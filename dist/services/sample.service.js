"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCollectorSampleStatus = exports.uploadCollectorSampleEvidence = exports.deleteSample = exports.updateSample = exports.verifySampleHandoverOtp = exports.generateSampleHandoverOtp = exports.getSampleByBarcode = exports.getSampleById = exports.getSamplesByAppointmentTest = exports.getCollectorSamples = exports.getSamples = exports.createSample = exports.verifyCollectorHomeCollectionOtp = exports.generateHomeCollectionOtp = void 0;
const crypto_1 = __importDefault(require("crypto"));
const prisma_service_1 = require("./prisma.service");
const OTP_EXPIRY_MINUTES = 5;
const MAX_OTP_ATTEMPTS = 5;
// =========================================================
// COMMON HELPERS
// =========================================================
const generateOtp = () => crypto_1.default.randomInt(100000, 1000000).toString();
const hashOtp = (otp) => crypto_1.default.createHash("sha256").update(otp).digest("hex");
const isOtpExpired = (expiresAt) => expiresAt.getTime() <= Date.now();
const isDebugEnvironment = () => process.env.NODE_ENV !== "production";
const isCollectorAssignmentActive = (assignment) => {
    // Lab-assigned collectors do not need to accept again.
    if (assignment.source === "LAB_INTERNAL") {
        return assignment.status === "ASSIGNED";
    }
    // Independent collectors must accept their offer.
    if (assignment.source === "INDEPENDENT_POOL") {
        return assignment.status === "ACCEPTED";
    }
    return false;
};
const assertCollectorAssignment = (assignment, userId) => {
    if (!assignment) {
        throw new Error("No collector assignment found");
    }
    if (assignment.collector.userId !== userId) {
        throw new Error("This collection is not assigned to you");
    }
    if (assignment.collector.status !== "ACTIVE") {
        throw new Error("Collector account is inactive");
    }
    if (!isCollectorAssignmentActive(assignment)) {
        throw new Error("Collector assignment is not active");
    }
};
const getLatestHomeCollectionOtp = async (homeCollectionId) => prisma_service_1.prisma.homeCollectionOtpVerification.findFirst({
    where: { homeCollectionId },
    orderBy: { generatedAt: "desc" },
});
const isHomeCollectionOtpVerified = async (homeCollectionId) => {
    const verification = await prisma_service_1.prisma.homeCollectionOtpVerification.findFirst({
        where: {
            homeCollectionId,
            verified: true,
        },
        orderBy: { verifiedAt: "desc" },
    });
    return verification !== null;
};
const getLatestOtp = async (sampleId, purpose) => prisma_service_1.prisma.sampleOtpVerification.findFirst({
    where: { sampleId, purpose },
    orderBy: { generatedAt: "desc" },
});
const addSampleTracking = async (sampleId, status, notes) => {
    await prisma_service_1.prisma.sampleTracking.create({
        data: { sampleId, status, notes },
    });
};
// =========================================================
// HOME COLLECTION OTP GENERATION
// PATIENT GENERATES OTP
// =========================================================
const generateHomeCollectionOtp = async (homeCollectionId, userId) => {
    const homeCollection = await prisma_service_1.prisma.homeCollection.findUnique({
        where: { homeCollectionId },
        include: {
            appointment: true,
        },
    });
    if (!homeCollection) {
        throw new Error("Home collection not found");
    }
    if (homeCollection.status === "CANCELLED") {
        throw new Error("Cannot generate OTP for a cancelled collection");
    }
    // The authenticated citizen who booked the appointment
    // is authorized to generate the collection OTP.
    if (homeCollection.appointment.patientId !== userId) {
        throw new Error("Only the citizen who booked this appointment can generate the collection OTP");
    }
    // Do not generate another OTP after successful verification.
    const alreadyVerified = await isHomeCollectionOtpVerified(homeCollectionId);
    if (alreadyVerified) {
        throw new Error("Home collection OTP has already been verified");
    }
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    const verification = await prisma_service_1.prisma.$transaction(async (tx) => {
        await tx.homeCollectionOtpVerification.updateMany({
            where: {
                homeCollectionId,
                verified: false,
            },
            data: {
                expiresAt: new Date(),
            },
        });
        return tx.homeCollectionOtpVerification.create({
            data: {
                homeCollectionId,
                otpHash: hashOtp(otp),
                expiresAt,
            },
        });
    });
    return {
        verificationId: verification.verificationId,
        homeCollectionId,
        expiresAt: verification.expiresAt,
        ...(isDebugEnvironment() && { debugOtp: otp }),
        message: "Home collection OTP generated successfully",
    };
};
exports.generateHomeCollectionOtp = generateHomeCollectionOtp;
// =========================================================
// HOME COLLECTION OTP VERIFICATION
// COLLECTOR VERIFIES CITIZEN OTP BEFORE CREATING SAMPLES
// =========================================================
// =========================================================
// HOME COLLECTION OTP VERIFICATION
// COLLECTOR VERIFIES PATIENT OTP
// =========================================================
const verifyCollectorHomeCollectionOtp = async (homeCollectionId, otp, userId) => {
    if (!/^\d{6}$/.test(otp)) {
        throw new Error("OTP must be a 6-digit number");
    }
    const homeCollection = await prisma_service_1.prisma.homeCollection.findUnique({
        where: { homeCollectionId },
        include: {
            collectorAssignment: {
                include: {
                    collector: true,
                },
            },
        },
    });
    if (!homeCollection) {
        throw new Error("Home collection not found");
    }
    if (homeCollection.status === "CANCELLED") {
        throw new Error("This home collection has been cancelled");
    }
    // Ensure the actual authenticated collector owns this assignment.
    assertCollectorAssignment(homeCollection.collectorAssignment, userId);
    const verification = await getLatestHomeCollectionOtp(homeCollectionId);
    if (!verification) {
        throw new Error("Patient has not generated an OTP for this home collection");
    }
    if (verification.verified) {
        throw new Error("Home collection OTP has already been verified");
    }
    if (isOtpExpired(verification.expiresAt)) {
        throw new Error("Home collection OTP has expired");
    }
    if (verification.attempts >= MAX_OTP_ATTEMPTS) {
        throw new Error("Maximum OTP attempts exceeded");
    }
    // Check the OTP hash.
    if (hashOtp(otp) !== verification.otpHash) {
        const attemptUpdate = await prisma_service_1.prisma.homeCollectionOtpVerification.updateMany({
            where: {
                verificationId: verification.verificationId,
                verified: false,
                attempts: { lt: MAX_OTP_ATTEMPTS },
                expiresAt: { gt: new Date() },
            },
            data: {
                attempts: { increment: 1 },
            },
        });
        if (attemptUpdate.count === 0) {
            throw new Error("Home collection OTP is no longer valid");
        }
        throw new Error("Invalid home collection OTP");
    }
    // Recheck and verify inside a transaction.
    const verified = await prisma_service_1.prisma.$transaction(async (tx) => {
        const currentOtp = await tx.homeCollectionOtpVerification.findUnique({
            where: {
                verificationId: verification.verificationId,
            },
        });
        if (!currentOtp ||
            currentOtp.verified ||
            currentOtp.expiresAt <= new Date() ||
            currentOtp.attempts >= MAX_OTP_ATTEMPTS) {
            throw new Error("Home collection OTP is no longer valid");
        }
        return tx.homeCollectionOtpVerification.update({
            where: {
                verificationId: currentOtp.verificationId,
            },
            data: {
                verified: true,
                verifiedAt: new Date(),
            },
        });
    });
    return {
        homeCollectionId,
        verificationId: verified.verificationId,
        verified: true,
        message: "Home collection OTP verified successfully",
    };
};
exports.verifyCollectorHomeCollectionOtp = verifyCollectorHomeCollectionOtp;
// =========================================================
// SYNCHRONIZE APPOINTMENT TEST STATUS
// =========================================================
const synchronizeAppointmentTestStatus = async (appointmentTestId) => {
    const appointmentTest = await prisma_service_1.prisma.appointmentTest.findUnique({
        where: { appointmentTestId },
        select: { status: true },
    });
    if (!appointmentTest || appointmentTest.status === "COMPLETED") {
        return;
    }
    const samples = await prisma_service_1.prisma.sample.findMany({
        where: { appointmentTestId },
        select: { status: true },
    });
    if (samples.length === 0)
        return;
    const statuses = samples.map((sample) => sample.status);
    let nextStatus = "PENDING";
    if (statuses.every((status) => status === "COMPLETED")) {
        nextStatus = "COMPLETED";
    }
    else if (statuses.some((status) => status === "RECEIVED" || status === "PROCESSING")) {
        nextStatus = "PROCESSING";
    }
    else if (statuses.some((status) => status === "COLLECTED" || status === "IN_TRANSIT")) {
        nextStatus = "SAMPLE_COLLECTED";
    }
    if (nextStatus !== "PENDING") {
        await prisma_service_1.prisma.appointmentTest.update({
            where: { appointmentTestId },
            data: { status: nextStatus },
        });
    }
};
// =========================================================
// SYNCHRONIZE HOME COLLECTION STATUS
// =========================================================
const synchronizeHomeCollectionStatus = async (homeCollectionId) => {
    const homeCollection = await prisma_service_1.prisma.homeCollection.findUnique({
        where: { homeCollectionId },
        include: {
            samples: {
                select: { status: true },
            },
            collectorAssignment: {
                select: {
                    status: true,
                    source: true,
                },
            },
        },
    });
    if (!homeCollection || homeCollection.samples.length === 0) {
        return;
    }
    const statuses = homeCollection.samples.map((sample) => sample.status);
    let nextStatus;
    if (statuses.every((status) => status === "REJECTED")) {
        nextStatus = "CANCELLED";
    }
    else if (statuses.every((status) => status === "COMPLETED")) {
        nextStatus = "REPORT_READY";
    }
    else if (statuses.some((status) => status === "PROCESSING")) {
        nextStatus = "PROCESSING";
    }
    else if (statuses.some((status) => status === "IN_TRANSIT")) {
        nextStatus = "EN_ROUTE";
    }
    else if (statuses.some((status) => status === "RECEIVED" || status === "COMPLETED")) {
        nextStatus = "IN_LAB";
    }
    else if (statuses.some((status) => status === "COLLECTED" || status === "REJECTED")) {
        nextStatus = "SAMPLE_COLLECTED";
    }
    else if (homeCollection.collectorAssignment) {
        nextStatus = "ASSIGNED";
    }
    else {
        nextStatus = "PENDING";
    }
    const allSamplesHandedOverOrTerminal = statuses.every((status) => status === "RECEIVED" ||
        status === "PROCESSING" ||
        status === "COMPLETED" ||
        status === "REJECTED");
    await prisma_service_1.prisma.homeCollection.update({
        where: { homeCollectionId },
        data: {
            status: nextStatus,
            ...(statuses.some((status) => status === "COLLECTED") &&
                !homeCollection.collectedAt && {
                collectedAt: new Date(),
            }),
        },
    });
    // Both LAB_INTERNAL/ASSIGNED and INDEPENDENT_POOL/ACCEPTED
    // are valid active assignments. Mark either COMPLETED once
    // all samples have reached the lab or a terminal state.
    const assignment = homeCollection.collectorAssignment;
    const assignmentIsActive = assignment?.source === "LAB_INTERNAL"
        ? assignment.status === "ASSIGNED"
        : assignment?.source === "INDEPENDENT_POOL"
            ? assignment.status === "ACCEPTED"
            : false;
    if (allSamplesHandedOverOrTerminal && assignmentIsActive) {
        await prisma_service_1.prisma.collectorAssignment.update({
            where: { homeCollectionId },
            data: { status: "COMPLETED" },
        });
    }
};
// =========================================================
// CREATE SAMPLE
// HOME COLLECTION OTP MUST ALREADY BE VERIFIED
// =========================================================
const createSample = async (data, userId) => {
    const appointmentTest = await prisma_service_1.prisma.appointmentTest.findUnique({
        where: { appointmentTestId: data.appointmentTestId },
        include: {
            appointment: true,
            labTest: { include: { testCatalog: true } },
        },
    });
    if (!appointmentTest) {
        throw new Error("Appointment test not found");
    }
    const appointment = appointmentTest.appointment;
    if (appointment.appointmentType !== "LAB") {
        throw new Error("Samples can only be created for LAB appointments");
    }
    const isHomeAppointment = appointment.appointmentMode === "HOME";
    let assignedCollectorId;
    if (isHomeAppointment && !data.homeCollectionId) {
        throw new Error("Home collection ID is required for HOME appointments");
    }
    if (data.homeCollectionId) {
        const homeCollection = await prisma_service_1.prisma.homeCollection.findUnique({
            where: { homeCollectionId: data.homeCollectionId },
            include: {
                collectorAssignment: {
                    include: { collector: true },
                },
            },
        });
        if (!homeCollection) {
            throw new Error("Home collection not found");
        }
        if (homeCollection.appointmentId !== appointmentTest.appointmentId) {
            throw new Error("Home collection does not belong to this appointment");
        }
        if (homeCollection.status === "CANCELLED") {
            throw new Error("Cannot create a sample for a cancelled collection");
        }
        const assignment = homeCollection.collectorAssignment;
        if (!assignment) {
            throw new Error("A collector must be assigned before creating samples");
        }
        assertCollectorAssignment(assignment, userId);
        if (assignment.collector.status !== "ACTIVE") {
            throw new Error("Assigned collector is inactive");
        }
        const otpVerified = await isHomeCollectionOtpVerified(data.homeCollectionId);
        if (!otpVerified) {
            throw new Error("Home collection OTP must be verified before creating samples");
        }
        assignedCollectorId = assignment.collectorId;
        if (data.collectorId && data.collectorId !== assignedCollectorId) {
            throw new Error("Collector ID must match the assigned home collection collector");
        }
    }
    else if (data.collectorId) {
        const collector = await prisma_service_1.prisma.collector.findUnique({
            where: { collectorId: data.collectorId },
        });
        if (!collector) {
            throw new Error("Collector not found");
        }
        if (collector.status !== "ACTIVE") {
            throw new Error("Collector is inactive");
        }
        if (appointment.labId && collector.labId !== appointment.labId) {
            throw new Error("Collector does not belong to the appointment's lab");
        }
        assignedCollectorId = collector.collectorId;
    }
    const existingSample = await prisma_service_1.prisma.sample.findUnique({
        where: { barcode: data.barcode },
    });
    if (existingSample) {
        throw new Error("Barcode already exists");
    }
    const sample = await prisma_service_1.prisma.sample.create({
        data: {
            appointmentTestId: data.appointmentTestId,
            homeCollectionId: data.homeCollectionId,
            collectorId: assignedCollectorId,
            barcode: data.barcode,
            sampleType: data.sampleType,
            containerType: data.containerType,
            status: "PENDING_COLLECTION",
            condition: data.condition ?? "GOOD",
            notes: data.notes,
        },
        include: {
            appointmentTest: {
                include: {
                    appointment: true,
                    labTest: { include: { testCatalog: true } },
                },
            },
            collector: true,
            homeCollection: true,
        },
    });
    await addSampleTracking(sample.sampleId, "BARCODE_SCANNED", "Sample registered after home collection OTP verification");
    return sample;
};
exports.createSample = createSample;
// =========================================================
// GET ALL SAMPLES
// =========================================================
const getSamples = async () => prisma_service_1.prisma.sample.findMany({
    orderBy: { createdAt: "desc" },
    include: {
        appointmentTest: {
            include: {
                appointment: true,
                labTest: { include: { testCatalog: true } },
            },
        },
        collector: true,
        homeCollection: true,
    },
});
exports.getSamples = getSamples;
// =========================================================
// GET SAMPLES FOR AUTHENTICATED COLLECTOR
// =========================================================
const getCollectorSamples = async (userId) => {
    const collector = await prisma_service_1.prisma.collector.findUnique({
        where: { userId },
        select: {
            collectorId: true,
            name: true,
        },
    });
    if (!collector) {
        throw new Error("Collector not found");
    }
    const samples = await prisma_service_1.prisma.sample.findMany({
        where: {
            collectorId: collector.collectorId,
            homeCollectionId: {
                not: null,
            },
        },
        orderBy: {
            createdAt: "desc",
        },
        include: {
            appointmentTest: {
                include: {
                    appointment: true,
                    labTest: {
                        include: {
                            testCatalog: true,
                        },
                    },
                },
            },
            collector: true,
            homeCollection: true,
            trackingEvents: {
                orderBy: {
                    createdAt: "desc",
                },
            },
            evidence: true,
        },
    });
    return {
        collector,
        total: samples.length,
        samples,
    };
};
exports.getCollectorSamples = getCollectorSamples;
// =========================================================
// GET SAMPLES BY APPOINTMENT TEST
// =========================================================
const getSamplesByAppointmentTest = async (appointmentTestId) => {
    const appointmentTest = await prisma_service_1.prisma.appointmentTest.findUnique({
        where: { appointmentTestId },
        select: { appointmentTestId: true },
    });
    if (!appointmentTest) {
        throw new Error("Appointment test not found");
    }
    return prisma_service_1.prisma.sample.findMany({
        where: { appointmentTestId },
        orderBy: { createdAt: "desc" },
        include: {
            collector: true,
            homeCollection: true,
            appointmentTest: {
                include: {
                    labTest: { include: { testCatalog: true } },
                },
            },
        },
    });
};
exports.getSamplesByAppointmentTest = getSamplesByAppointmentTest;
// =========================================================
// GET SAMPLE BY ID
// OTP HASHES ARE NOT INCLUDED
// =========================================================
const getSampleById = async (sampleId) => {
    const sample = await prisma_service_1.prisma.sample.findUnique({
        where: { sampleId },
        include: {
            appointmentTest: {
                include: {
                    appointment: true,
                    labTest: { include: { testCatalog: true } },
                },
            },
            collector: true,
            homeCollection: true,
            trackingEvents: {
                orderBy: { createdAt: "desc" },
            },
            evidence: true,
        },
    });
    if (!sample) {
        throw new Error("Sample not found");
    }
    return sample;
};
exports.getSampleById = getSampleById;
// =========================================================
// GET SAMPLE BY BARCODE
// =========================================================
const getSampleByBarcode = async (barcode) => {
    const sample = await prisma_service_1.prisma.sample.findUnique({
        where: { barcode },
        include: {
            appointmentTest: {
                include: {
                    appointment: true,
                    labTest: { include: { testCatalog: true } },
                },
            },
            collector: true,
            homeCollection: true,
            trackingEvents: {
                orderBy: { createdAt: "desc" },
            },
        },
    });
    if (!sample) {
        throw new Error("Sample not found");
    }
    return sample;
};
exports.getSampleByBarcode = getSampleByBarcode;
// =========================================================
// GENERATE SAMPLE HANDOVER OTP - LAB STAFF
// THIS REMAINS SAMPLE-BASED
// =========================================================
const generateSampleHandoverOtp = async (sampleId, labUserId) => {
    const sample = await prisma_service_1.prisma.sample.findUnique({
        where: { sampleId },
        include: {
            appointmentTest: {
                include: {
                    appointment: {
                        include: { lab: true },
                    },
                },
            },
        },
    });
    if (!sample) {
        throw new Error("Sample not found");
    }
    const lab = sample.appointmentTest.appointment.lab;
    if (!lab || lab.labUserId !== labUserId) {
        throw new Error("This sample does not belong to your lab");
    }
    if (sample.status !== "IN_TRANSIT") {
        throw new Error("Handover OTP can only be generated for a sample in transit");
    }
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    const verification = await prisma_service_1.prisma.$transaction(async (tx) => {
        await tx.sampleOtpVerification.updateMany({
            where: {
                sampleId,
                purpose: "SAMPLE_HANDOVER",
                verified: false,
            },
            data: { expiresAt: new Date() },
        });
        return tx.sampleOtpVerification.create({
            data: {
                sampleId,
                purpose: "SAMPLE_HANDOVER",
                otpHash: hashOtp(otp),
                expiresAt,
            },
        });
    });
    return {
        verificationId: verification.verificationId,
        sampleId,
        purpose: verification.purpose,
        expiresAt: verification.expiresAt,
        ...(isDebugEnvironment() && { debugOtp: otp }),
        message: "Sample handover OTP generated successfully",
    };
};
exports.generateSampleHandoverOtp = generateSampleHandoverOtp;
// =========================================================
// VERIFY SAMPLE HANDOVER OTP - COLLECTOR
// =========================================================
const verifySampleHandoverOtp = async (sampleId, otp, userId) => {
    if (!/^\d{6}$/.test(otp)) {
        throw new Error("OTP must be a 6-digit number");
    }
    const collector = await prisma_service_1.prisma.collector.findUnique({
        where: { userId },
        select: {
            collectorId: true,
            status: true,
        },
    });
    if (!collector) {
        throw new Error("Collector not found for this user");
    }
    if (collector.status !== "ACTIVE") {
        throw new Error("Collector account is inactive");
    }
    const sample = await prisma_service_1.prisma.sample.findUnique({
        where: { sampleId },
        include: {
            homeCollection: {
                include: { collectorAssignment: true },
            },
            appointmentTest: {
                include: {
                    appointment: {
                        include: { lab: true },
                    },
                },
            },
        },
    });
    if (!sample) {
        throw new Error("Sample not found");
    }
    const homeCollection = sample.homeCollection;
    const assignment = homeCollection?.collectorAssignment;
    if (!homeCollection || !assignment) {
        throw new Error("Sample has no collector assignment");
    }
    if (assignment.collectorId !== collector.collectorId) {
        throw new Error("This sample is not assigned to you");
    }
    // LAB_INTERNAL remains ASSIGNED; INDEPENDENT_POOL must be ACCEPTED.
    const assignmentIsActive = assignment.source === "LAB_INTERNAL"
        ? assignment.status === "ASSIGNED"
        : assignment.source === "INDEPENDENT_POOL"
            ? assignment.status === "ACCEPTED"
            : false;
    if (!assignmentIsActive) {
        throw new Error("This collector assignment is no longer active");
    }
    if (sample.status !== "IN_TRANSIT") {
        throw new Error("Sample must be in transit for handover");
    }
    if (!sample.appointmentTest.appointment.lab) {
        throw new Error("The appointment has no associated lab");
    }
    const verification = await getLatestOtp(sampleId, "SAMPLE_HANDOVER");
    if (!verification) {
        throw new Error("Handover OTP has not been generated");
    }
    if (verification.verified) {
        throw new Error("Handover OTP has already been used");
    }
    if (isOtpExpired(verification.expiresAt)) {
        throw new Error("Handover OTP has expired");
    }
    if (verification.attempts >= MAX_OTP_ATTEMPTS) {
        throw new Error("Maximum OTP attempts exceeded");
    }
    if (hashOtp(otp) !== verification.otpHash) {
        const attemptUpdate = await prisma_service_1.prisma.sampleOtpVerification.updateMany({
            where: {
                verificationId: verification.verificationId,
                verified: false,
                attempts: { lt: MAX_OTP_ATTEMPTS },
                expiresAt: { gt: new Date() },
            },
            data: {
                attempts: { increment: 1 },
            },
        });
        if (attemptUpdate.count === 0) {
            throw new Error("Handover OTP is no longer valid");
        }
        throw new Error("Invalid handover OTP");
    }
    const deliveryProof = await prisma_service_1.prisma.sampleEvidence.findFirst({
        where: {
            sampleId,
            type: "DELIVERY_PROOF",
        },
        select: { evidenceId: true },
    });
    if (!deliveryProof) {
        throw new Error("Upload delivery proof before verifying the lab handover");
    }
    await prisma_service_1.prisma.$transaction(async (tx) => {
        const currentOtp = await tx.sampleOtpVerification.findUnique({
            where: { verificationId: verification.verificationId },
        });
        const currentSample = await tx.sample.findUnique({
            where: { sampleId },
        });
        if (!currentOtp ||
            currentOtp.verified ||
            currentOtp.expiresAt <= new Date() ||
            currentOtp.attempts >= MAX_OTP_ATTEMPTS) {
            throw new Error("Handover OTP is no longer valid");
        }
        if (!currentSample || currentSample.status !== "IN_TRANSIT") {
            throw new Error("Sample is no longer in transit");
        }
        await tx.sampleOtpVerification.update({
            where: { verificationId: currentOtp.verificationId },
            data: {
                verified: true,
                verifiedAt: new Date(),
            },
        });
        await tx.sample.update({
            where: { sampleId },
            data: {
                status: "RECEIVED",
                receivedAt: new Date(),
            },
        });
        await tx.sampleTracking.create({
            data: {
                sampleId,
                status: "RECEIVED_AT_LAB",
                notes: "Lab handover OTP verified",
            },
        });
    });
    await synchronizeAppointmentTestStatus(sample.appointmentTestId);
    await synchronizeHomeCollectionStatus(homeCollection.homeCollectionId);
    return {
        sampleId,
        status: "RECEIVED",
        homeCollectionId: homeCollection.homeCollectionId,
        message: "Sample handed over to the lab successfully",
    };
};
exports.verifySampleHandoverOtp = verifySampleHandoverOtp;
// =========================================================
// INTERNAL SAMPLE STATUS UPDATE
// =========================================================
const updateSampleStatusInternal = async (sampleId, data, allowCollectorTransition = false) => {
    const existingSample = await prisma_service_1.prisma.sample.findUnique({
        where: { sampleId },
        include: {
            appointmentTest: true,
            homeCollection: true,
        },
    });
    if (!existingSample) {
        throw new Error("Sample not found");
    }
    const currentStatus = existingSample.status;
    const newStatus = data.status;
    if (!newStatus) {
        const updated = await prisma_service_1.prisma.sample.update({
            where: { sampleId },
            data: {
                ...(data.condition !== undefined && {
                    condition: data.condition,
                }),
                ...(data.rejectionReason !== undefined && {
                    rejectionReason: data.rejectionReason,
                }),
                ...(data.notes !== undefined && {
                    notes: data.notes,
                }),
            },
        });
        return prisma_service_1.prisma.sample.findUnique({
            where: { sampleId: updated.sampleId },
            include: {
                appointmentTest: true,
                collector: true,
                homeCollection: true,
                trackingEvents: {
                    orderBy: { createdAt: "desc" },
                },
                evidence: true,
            },
        });
    }
    if (existingSample.homeCollectionId &&
        !allowCollectorTransition &&
        (newStatus === "COLLECTED" ||
            newStatus === "IN_TRANSIT" ||
            newStatus === "RECEIVED")) {
        throw new Error("Home collection status must be updated through the collector workflow or lab handover OTP");
    }
    if (currentStatus === "COMPLETED" || currentStatus === "REJECTED") {
        throw new Error(`Cannot change a terminal sample status: ${currentStatus}`);
    }
    const allowedTransitions = {
        PENDING_COLLECTION: ["COLLECTED", "REJECTED"],
        COLLECTED: ["IN_TRANSIT", "REJECTED"],
        IN_TRANSIT: ["RECEIVED", "REJECTED"],
        RECEIVED: ["PROCESSING", "REJECTED"],
        PROCESSING: ["COMPLETED", "REJECTED"],
    };
    if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
        throw new Error(`Invalid sample status transition: ${currentStatus} -> ${newStatus}`);
    }
    // For home collection, use the HomeCollection OTP,
    // not the old sample-level collection OTP.
    if (newStatus === "COLLECTED" && existingSample.homeCollectionId) {
        const otpVerified = await isHomeCollectionOtpVerified(existingSample.homeCollectionId);
        if (!otpVerified) {
            throw new Error("Home collection OTP verification is required");
        }
        const collectionPhoto = await prisma_service_1.prisma.sampleEvidence.findFirst({
            where: {
                sampleId,
                type: "COLLECTION_PHOTO",
            },
            select: { evidenceId: true },
        });
        if (!collectionPhoto) {
            throw new Error("Upload a collection photo before marking the sample as COLLECTED");
        }
    }
    if (newStatus === "COMPLETED") {
        const report = await prisma_service_1.prisma.report.findUnique({
            where: {
                appointmentTestId: existingSample.appointmentTestId,
            },
            include: {
                files: {
                    select: { reportFileId: true },
                },
            },
        });
        if (!report) {
            throw new Error("Upload a report for this appointment test before completing the sample");
        }
        if (report.status !== "UPLOADED" && report.status !== "SENT") {
            throw new Error("Report must be UPLOADED or SENT before completion");
        }
        if (report.files.length === 0) {
            throw new Error("Upload at least one report file before completion");
        }
    }
    if (newStatus === "REJECTED" && !data.rejectionReason?.trim()) {
        throw new Error("Rejection reason is required when rejecting a sample");
    }
    const trackingStatus = {
        COLLECTED: "COLLECTED",
        IN_TRANSIT: "IN_TRANSIT",
        RECEIVED: "RECEIVED_AT_LAB",
        PROCESSING: "PROCESSING_STARTED",
        COMPLETED: "COMPLETED",
        REJECTED: "REJECTED",
    };
    const mappedTrackingStatus = trackingStatus[newStatus];
    if (!mappedTrackingStatus) {
        throw new Error(`No tracking status mapping exists for ${newStatus}`);
    }
    const updatedSample = await prisma_service_1.prisma.$transaction(async (tx) => {
        const currentSample = await tx.sample.findUnique({
            where: { sampleId },
        });
        if (!currentSample || currentSample.status !== currentStatus) {
            throw new Error("Sample status changed while processing the request. Please retry.");
        }
        const updated = await tx.sample.update({
            where: { sampleId },
            data: {
                status: newStatus,
                ...(data.condition !== undefined && {
                    condition: data.condition,
                }),
                ...(data.rejectionReason !== undefined && {
                    rejectionReason: data.rejectionReason,
                }),
                ...(data.notes !== undefined && {
                    notes: data.notes,
                }),
                ...(newStatus === "COLLECTED" && {
                    collectedAt: new Date(),
                }),
                ...(newStatus === "RECEIVED" && {
                    receivedAt: new Date(),
                }),
            },
        });
        await tx.sampleTracking.create({
            data: {
                sampleId,
                status: mappedTrackingStatus,
                notes: data.notes ??
                    (newStatus === "REJECTED"
                        ? data.rejectionReason
                        : `Sample status changed to ${newStatus}`),
            },
        });
        if (newStatus === "COLLECTED" &&
            existingSample.homeCollectionId) {
            await tx.homeCollectionTracking.create({
                data: {
                    homeCollectionId: existingSample.homeCollectionId,
                    status: "SAMPLE_COLLECTED",
                    notes: "Sample collected from the patient",
                },
            });
        }
        return updated;
    });
    await synchronizeAppointmentTestStatus(existingSample.appointmentTestId);
    if (existingSample.homeCollectionId) {
        await synchronizeHomeCollectionStatus(existingSample.homeCollectionId);
        const homeTrackingStatus = {
            IN_TRANSIT: "EN_ROUTE",
            PROCESSING: "PROCESSING",
            COMPLETED: "REPORT_READY",
        };
        const mappedHomeStatus = homeTrackingStatus[newStatus];
        if (mappedHomeStatus) {
            await prisma_service_1.prisma.homeCollectionTracking.create({
                data: {
                    homeCollectionId: existingSample.homeCollectionId,
                    status: mappedHomeStatus,
                    notes: newStatus === "IN_TRANSIT"
                        ? "Sample is in transit to the lab"
                        : newStatus === "PROCESSING"
                            ? "Sample processing has started"
                            : "Sample processing completed and report is available",
                },
            });
        }
    }
    return prisma_service_1.prisma.sample.findUnique({
        where: { sampleId: updatedSample.sampleId },
        include: {
            appointmentTest: true,
            collector: true,
            homeCollection: true,
            trackingEvents: {
                orderBy: { createdAt: "desc" },
            },
            evidence: true,
        },
    });
};
// =========================================================
// PUBLIC UPDATE SAMPLE - LAB WORKFLOW
// =========================================================
const updateSample = async (sampleId, data) => updateSampleStatusInternal(sampleId, data, false);
exports.updateSample = updateSample;
// =========================================================
// DELETE SAMPLE
// =========================================================
const deleteSample = async (sampleId) => {
    const sample = await prisma_service_1.prisma.sample.findUnique({
        where: { sampleId },
        include: {
            trackingEvents: true,
            otpVerifications: true,
            evidence: true,
        },
    });
    if (!sample) {
        throw new Error("Sample not found");
    }
    if (sample.status !== "PENDING_COLLECTION") {
        throw new Error("Only samples awaiting collection can be deleted");
    }
    // Sample OTPs now exist only for lab handover.
    // Do not allow deleting a sample after a handover OTP was generated.
    if (sample.otpVerifications.length > 0) {
        throw new Error("Cannot delete a sample after an OTP has been generated");
    }
    if (sample.evidence.length > 0) {
        throw new Error("Cannot delete a sample that has evidence attached");
    }
    if (sample.trackingEvents.some((event) => event.status !== "BARCODE_SCANNED")) {
        throw new Error("Cannot delete a sample after its tracking workflow has started");
    }
    return prisma_service_1.prisma.$transaction(async (tx) => {
        await tx.sampleTracking.deleteMany({
            where: {
                sampleId,
                status: "BARCODE_SCANNED",
            },
        });
        return tx.sample.delete({
            where: { sampleId },
        });
    });
};
exports.deleteSample = deleteSample;
// =========================================================
// COLLECTOR: UPLOAD SAMPLE EVIDENCE
// =========================================================
const uploadCollectorSampleEvidence = async (sampleId, userId, file, type) => {
    if (!file?.filename) {
        throw new Error("Evidence file is required");
    }
    const sample = await prisma_service_1.prisma.sample.findUnique({
        where: { sampleId },
        include: {
            homeCollection: {
                include: {
                    collectorAssignment: {
                        include: { collector: true },
                    },
                },
            },
        },
    });
    if (!sample) {
        throw new Error("Sample not found");
    }
    const assignment = sample.homeCollection?.collectorAssignment;
    if (!sample.homeCollection || !assignment) {
        throw new Error("No collector assignment found");
    }
    assertCollectorAssignment(assignment, userId);
    if (!["image/jpeg", "image/png"].includes(file.mimetype)) {
        throw new Error("Only JPG and PNG images are allowed");
    }
    if (type === "COLLECTION_PHOTO") {
        if (sample.status !== "PENDING_COLLECTION") {
            throw new Error("Collection photo must be uploaded before marking the sample COLLECTED");
        }
        if (!(await isHomeCollectionOtpVerified(sample.homeCollectionId))) {
            throw new Error("Verify the home collection OTP before uploading the collection photo");
        }
    }
    if (type === "DELIVERY_PROOF") {
        if (sample.status !== "IN_TRANSIT") {
            throw new Error("Delivery proof can only be uploaded while the sample is IN_TRANSIT");
        }
    }
    const existingEvidence = await prisma_service_1.prisma.sampleEvidence.findFirst({
        where: { sampleId, type },
        select: { evidenceId: true },
    });
    if (existingEvidence) {
        throw new Error(`Evidence of type ${type} has already been uploaded for this sample`);
    }
    return prisma_service_1.prisma.sampleEvidence.create({
        data: {
            sampleId,
            collectorId: assignment.collectorId,
            type,
            fileUrl: `reports/${file.filename}`,
            fileName: file.originalname,
            mimeType: file.mimetype,
            fileSize: file.size,
        },
    });
};
exports.uploadCollectorSampleEvidence = uploadCollectorSampleEvidence;
// =========================================================
// COLLECTOR: UPDATE SAMPLE STATUS
// =========================================================
const updateCollectorSampleStatus = async (sampleId, userId, data) => {
    const sample = await prisma_service_1.prisma.sample.findUnique({
        where: { sampleId },
        include: {
            homeCollection: {
                include: {
                    collectorAssignment: {
                        include: { collector: true },
                    },
                },
            },
        },
    });
    if (!sample) {
        throw new Error("Sample not found");
    }
    if (!sample.homeCollectionId || !sample.homeCollection) {
        throw new Error("Sample is not part of a home collection");
    }
    const assignment = sample.homeCollection.collectorAssignment;
    assertCollectorAssignment(assignment, userId);
    if (data.status === "COLLECTED") {
        if (sample.status !== "PENDING_COLLECTION") {
            throw new Error("Only pending samples can be marked as collected");
        }
        if (!(await isHomeCollectionOtpVerified(sample.homeCollectionId))) {
            throw new Error("Verify the home collection OTP before marking the sample collected");
        }
        const collectionPhoto = await prisma_service_1.prisma.sampleEvidence.findFirst({
            where: {
                sampleId,
                type: "COLLECTION_PHOTO",
            },
            select: { evidenceId: true },
        });
        if (!collectionPhoto) {
            throw new Error("Upload collection photo before marking the sample collected");
        }
    }
    if (data.status === "IN_TRANSIT") {
        if (sample.status !== "COLLECTED") {
            throw new Error("Only collected samples can be marked as in transit");
        }
        const collectionPhoto = await prisma_service_1.prisma.sampleEvidence.findFirst({
            where: {
                sampleId,
                type: "COLLECTION_PHOTO",
            },
            select: { evidenceId: true },
        });
        if (!collectionPhoto) {
            throw new Error("Collection photo is required before transit");
        }
    }
    return updateSampleStatusInternal(sampleId, data, true);
};
exports.updateCollectorSampleStatus = updateCollectorSampleStatus;
//# sourceMappingURL=sample.service.js.map