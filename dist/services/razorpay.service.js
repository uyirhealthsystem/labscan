"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPatientPaymentLink = createPatientPaymentLink;
exports.isValidRazorpayWebhookSignature = isValidRazorpayWebhookSignature;
exports.processRazorpayWebhook = processRazorpayWebhook;
const node_crypto_1 = require("node:crypto");
const razorpay_1 = __importDefault(require("razorpay"));
const client_1 = require("../generated/prisma/client");
const env_1 = require("../config/env");
const apiError_1 = require("../utils/apiError");
const logger_1 = require("../utils/logger");
const prisma_service_1 = require("./prisma.service");
function getRazorpayClient() {
    if (!env_1.env.razorpay.keyId || !env_1.env.razorpay.keySecret) {
        throw new apiError_1.apiError(503, "Online payment is not configured");
    }
    return new razorpay_1.default({ key_id: env_1.env.razorpay.keyId, key_secret: env_1.env.razorpay.keySecret });
}
function priceInPaise(value) {
    if (value === null) {
        throw new apiError_1.apiError(422, "A booking item has no price and cannot be paid online");
    }
    const fixed = value.toFixed(2);
    const match = /^(\d+)\.(\d{2})$/.exec(fixed);
    if (!match) {
        throw new apiError_1.apiError(422, "A booking item has an invalid price");
    }
    return BigInt(match[1]) * 100n + BigInt(match[2]);
}
async function createPatientPaymentLink(appointmentId, patientId) {
    const appointment = await prisma_service_1.prisma.appointment.findFirst({
        where: { appointmentId, patientId },
        include: { tests: true, services: true },
    });
    if (!appointment) {
        throw new apiError_1.apiError(404, "Appointment not found");
    }
    if (appointment.status === "CANCELLED") {
        throw new apiError_1.apiError(409, "A cancelled appointment cannot be paid");
    }
    const paidPayment = await prisma_service_1.prisma.appointmentPayment.findFirst({
        where: {
            appointmentId,
            status: "PAID",
        },
        orderBy: { createdAt: "desc" },
    });
    if (paidPayment) {
        return paidPayment;
    }
    const existing = await prisma_service_1.prisma.appointmentPayment.findFirst({
        where: { appointmentId, status: "CREATED" },
        orderBy: { createdAt: "desc" },
    });
    if (existing?.expiresAt && existing.expiresAt.getTime() > Date.now()) {
        return existing;
    }
    const prices = [
        ...appointment.tests.map((test) => test.price),
        ...appointment.services.map((service) => service.price),
    ];
    if (prices.length === 0) {
        throw new apiError_1.apiError(422, "This appointment has no payable items");
    }
    const totalPaise = prices.reduce((total, price) => total + priceInPaise(price), 0n);
    if (totalPaise <= 0n || totalPaise > BigInt(Number.MAX_SAFE_INTEGER)) {
        throw new apiError_1.apiError(422, "The appointment total is outside the supported payment range");
    }
    const client = getRazorpayClient();
    const referenceId = (0, node_crypto_1.randomUUID)();
    const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60;
    let link;
    try {
        link = await client.paymentLink.create({
            amount: Number(totalPaise),
            currency: "INR",
            accept_partial: false,
            reference_id: referenceId,
            description: `Lab & Scan booking ${appointment.bookingId}`,
            customer: {},
            notify: { email: false, sms: false },
            reminder_enable: false,
            expire_by: expiresAt,
            notes: { appointmentId },
        });
    }
    catch (error) {
        logger_1.logger.error({ err: error, appointmentId }, "Razorpay Payment Link creation failed");
        throw new apiError_1.apiError(502, "Could not start payment. Please try again.");
    }
    try {
        return await prisma_service_1.prisma.appointmentPayment.create({
            data: {
                appointmentId,
                razorpayPaymentLinkId: link.id,
                status: "CREATED",
                amount: new client_1.Prisma.Decimal(totalPaise.toString()).dividedBy(100),
                currency: "INR",
                checkoutUrl: link.short_url,
                expiresAt: link.expire_by ? new Date(link.expire_by * 1000) : null,
            },
        });
    }
    catch (error) {
        try {
            await client.paymentLink.cancel(link.id);
        }
        catch (cancelError) {
            logger_1.logger.error({ err: cancelError, appointmentId, paymentLinkId: link.id }, "Could not cancel an unpersisted Razorpay Payment Link");
        }
        throw error;
    }
}
function isValidRazorpayWebhookSignature(rawBody, signature, secret) {
    if (!/^[a-f\d]{64}$/i.test(signature) || !secret) {
        return false;
    }
    const expected = (0, node_crypto_1.createHmac)("sha256", secret).update(rawBody).digest();
    const received = Buffer.from(signature, "hex");
    return received.length === expected.length && (0, node_crypto_1.timingSafeEqual)(received, expected);
}
async function processRazorpayWebhook(rawBody, signature, headerEventId) {
    if (!env_1.env.razorpay.webhookSecret) {
        throw new apiError_1.apiError(503, "Payment webhook is not configured");
    }
    if (!isValidRazorpayWebhookSignature(rawBody, signature, env_1.env.razorpay.webhookSecret)) {
        throw new apiError_1.apiError(401, "Invalid Razorpay webhook signature");
    }
    let body;
    try {
        body = JSON.parse(rawBody.toString("utf8"));
    }
    catch {
        throw new apiError_1.apiError(400, "Invalid Razorpay webhook payload");
    }
    const eventType = body.event;
    const status = eventType === "payment_link.paid"
        ? "PAID"
        : eventType === "payment_link.expired"
            ? "EXPIRED"
            : eventType === "payment_link.cancelled"
                ? "CANCELLED"
                : null;
    if (!eventType || !status) {
        return { acknowledged: true, ignored: true };
    }
    const paymentLinkId = body.payload?.payment_link?.entity?.id;
    if (!paymentLinkId) {
        throw new apiError_1.apiError(400, "Razorpay webhook is missing its payment link ID");
    }
    const eventId = headerEventId?.trim() || (0, node_crypto_1.createHash)("sha256").update(rawBody).digest("hex");
    const payment = await prisma_service_1.prisma.appointmentPayment.findUnique({
        where: { razorpayPaymentLinkId: paymentLinkId },
    });
    if (!payment) {
        throw new apiError_1.apiError(404, "Payment link is not recognized");
    }
    try {
        await prisma_service_1.prisma.$transaction(async (tx) => {
            await tx.razorpayWebhookEvent.create({
                data: { eventId, eventType },
            });
            const current = await tx.appointmentPayment.findUniqueOrThrow({
                where: { paymentId: payment.paymentId },
            });
            if (current.status !== "PAID" || status === "PAID") {
                await tx.appointmentPayment.update({
                    where: { paymentId: payment.paymentId },
                    data: {
                        status,
                        ...(status === "PAID"
                            ? {
                                paidAt: new Date(),
                                razorpayPaymentId: body.payload?.payment?.entity?.id,
                            }
                            : {}),
                    },
                });
            }
        });
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return { acknowledged: true, duplicate: true };
        }
        throw error;
    }
    return { acknowledged: true, duplicate: false };
}
//# sourceMappingURL=razorpay.service.js.map