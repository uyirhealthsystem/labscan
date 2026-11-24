import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import Razorpay from "razorpay";
import { Prisma } from "../generated/prisma/client";
import { env } from "../config/env";
import { apiError } from "../utils/apiError";
import { logger } from "../utils/logger";
import { prisma } from "./prisma.service";

type RazorpayWebhook = {
  event?: string;
  payload?: {
    payment_link?: { entity?: { id?: string } };
    payment?: { entity?: { id?: string } };
  };
};

type CreatedPaymentLink = {
  id: string;
  short_url: string;
  expire_by?: number;
};

function getRazorpayClient() {
  if (!env.razorpay.keyId || !env.razorpay.keySecret) {
    throw new apiError(503, "Online payment is not configured");
  }
  return new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret });
}

function priceInPaise(value: Prisma.Decimal | null): bigint {
  if (value === null) {
    throw new apiError(422, "A booking item has no price and cannot be paid online");
  }

  const fixed = value.toFixed(2);
  const match = /^(\d+)\.(\d{2})$/.exec(fixed);
  if (!match) {
    throw new apiError(422, "A booking item has an invalid price");
  }
  return BigInt(match[1]) * 100n + BigInt(match[2]);
}

export async function createPatientPaymentLink(appointmentId: string, patientId: string) {
  const appointment = await prisma.appointment.findFirst({
    where: { appointmentId, patientId },
    include: { tests: true, services: true },
  });
  if (!appointment) {
    throw new apiError(404, "Appointment not found");
  }
  if (appointment.status === "CANCELLED") {
    throw new apiError(409, "A cancelled appointment cannot be paid");
  }

  const paidPayment = await prisma.appointmentPayment.findFirst({
    where: {
      appointmentId,
      status: "PAID",
    },
    orderBy: { createdAt: "desc" },
  });
  if (paidPayment) {
    return paidPayment;
  }
  const existing = await prisma.appointmentPayment.findFirst({
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
    throw new apiError(422, "This appointment has no payable items");
  }
  const totalPaise = prices.reduce((total, price) => total + priceInPaise(price), 0n);
  if (totalPaise <= 0n || totalPaise > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new apiError(422, "The appointment total is outside the supported payment range");
  }

  const client = getRazorpayClient();
  const referenceId = randomUUID();
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60;
  let link: CreatedPaymentLink;
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
  } catch (error) {
    logger.error({ err: error, appointmentId }, "Razorpay Payment Link creation failed");
    throw new apiError(502, "Could not start payment. Please try again.");
  }

  try {
    return await prisma.appointmentPayment.create({
      data: {
        appointmentId,
        razorpayPaymentLinkId: link.id,
        status: "CREATED",
        amount: new Prisma.Decimal(totalPaise.toString()).dividedBy(100),
        currency: "INR",
        checkoutUrl: link.short_url,
        expiresAt: link.expire_by ? new Date(link.expire_by * 1000) : null,
      },
    });
  } catch (error) {
    try {
      await client.paymentLink.cancel(link.id);
    } catch (cancelError) {
      logger.error(
        { err: cancelError, appointmentId, paymentLinkId: link.id },
        "Could not cancel an unpersisted Razorpay Payment Link",
      );
    }
    throw error;
  }
}

export function isValidRazorpayWebhookSignature(rawBody: Buffer, signature: string, secret: string): boolean {
  if (!/^[a-f\d]{64}$/i.test(signature) || !secret) {
    return false;
  }
  const expected = createHmac("sha256", secret).update(rawBody).digest();
  const received = Buffer.from(signature, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function processRazorpayWebhook(rawBody: Buffer, signature: string, headerEventId?: string) {
  if (!env.razorpay.webhookSecret) {
    throw new apiError(503, "Payment webhook is not configured");
  }
  if (!isValidRazorpayWebhookSignature(rawBody, signature, env.razorpay.webhookSecret)) {
    throw new apiError(401, "Invalid Razorpay webhook signature");
  }

  let body: RazorpayWebhook;
  try {
    body = JSON.parse(rawBody.toString("utf8")) as RazorpayWebhook;
  } catch {
    throw new apiError(400, "Invalid Razorpay webhook payload");
  }

  const eventType = body.event;
  const status =
    eventType === "payment_link.paid"
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
    throw new apiError(400, "Razorpay webhook is missing its payment link ID");
  }
  const eventId = headerEventId?.trim() || createHash("sha256").update(rawBody).digest("hex");
  const payment = await prisma.appointmentPayment.findUnique({
    where: { razorpayPaymentLinkId: paymentLinkId },
  });
  if (!payment) {
    throw new apiError(404, "Payment link is not recognized");
  }

  try {
    await prisma.$transaction(async (tx) => {
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
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { acknowledged: true, duplicate: true };
    }
    throw error;
  }

  return { acknowledged: true, duplicate: false };
}
