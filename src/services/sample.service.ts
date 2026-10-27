
import crypto from "crypto";
import { prisma } from "./prisma.service";

const OTP_EXPIRY_MINUTES = 5;
const MAX_OTP_ATTEMPTS = 5;

export interface CreateSampleInput {
  appointmentTestId: string;
  homeCollectionId?: string;
  collectorId?: string;
  barcode: string;
  sampleType: string;
  containerType?: string;
  condition?:
    | "GOOD"
    | "DAMAGED"
    | "LEAKED"
    | "INSUFFICIENT"
    | "HEMOLYZED"
    | "REJECTED";
  notes?: string;
}

export interface UpdateSampleInput {
  status?:
    | "PENDING_COLLECTION"
    | "COLLECTED"
    | "IN_TRANSIT"
    | "RECEIVED"
    | "PROCESSING"
    | "REJECTED"
    | "COMPLETED";
  condition?:
    | "GOOD"
    | "DAMAGED"
    | "LEAKED"
    | "INSUFFICIENT"
    | "HEMOLYZED"
    | "REJECTED";
  rejectionReason?: string;
  notes?: string;
}

type CollectorSampleStatus = "COLLECTED" | "IN_TRANSIT";
type EvidenceType = "COLLECTION_PHOTO" | "DELIVERY_PROOF";

type SampleTrackingStatus =
  | "BARCODE_SCANNED"
  | "COLLECTED"
  | "IN_TRANSIT"
  | "RECEIVED_AT_LAB"
  | "ACCEPTED"
  | "REJECTED"
  | "PROCESSING_STARTED"
  | "COMPLETED";

type SampleStatus = NonNullable<UpdateSampleInput["status"]>;

const generateOtp = (): string =>
  crypto.randomInt(100000, 1000000).toString();

const hashOtp = (otp: string): string =>
  crypto.createHash("sha256").update(otp).digest("hex");

const isOtpExpired = (expiresAt: Date): boolean =>
  expiresAt.getTime() <= Date.now();

const isDebugEnvironment = (): boolean =>
  process.env.NODE_ENV !== "production";

const getLatestOtp = async (
  sampleId: string,
  purpose: "COLLECTION_VERIFICATION" | "SAMPLE_HANDOVER",
) =>
  prisma.sampleOtpVerification.findFirst({
    where: { sampleId, purpose },
    orderBy: { generatedAt: "desc" },
  });

const isCollectionOtpVerified = async (
  sampleId: string,
): Promise<boolean> => {
  const verification = await prisma.sampleOtpVerification.findFirst({
    where: {
      sampleId,
      purpose: "COLLECTION_VERIFICATION",
      verified: true,
    },
    orderBy: { verifiedAt: "desc" },
  });

  return verification !== null;
};

const addSampleTracking = async (
  sampleId: string,
  status: SampleTrackingStatus,
  notes?: string,
): Promise<void> => {
  await prisma.sampleTracking.create({
    data: { sampleId, status, notes },
  });
};

const synchronizeAppointmentTestStatus = async (
  appointmentTestId: string,
): Promise<void> => {
  const appointmentTest = await prisma.appointmentTest.findUnique({
    where: { appointmentTestId },
    select: { status: true },
  });

  if (!appointmentTest || appointmentTest.status === "COMPLETED") {
    return;
  }

  const samples = await prisma.sample.findMany({
    where: { appointmentTestId },
    select: { status: true },
  });

  if (samples.length === 0) return;

  const statuses = samples.map((sample) => sample.status);

  let nextStatus:
    | "PENDING"
    | "SAMPLE_COLLECTED"
    | "PROCESSING"
    | "COMPLETED" = "PENDING";

  if (statuses.every((status) => status === "COMPLETED")) {
    nextStatus = "COMPLETED";
  } else if (
    statuses.some(
      (status) => status === "RECEIVED" || status === "PROCESSING",
    )
  ) {
    nextStatus = "PROCESSING";
  } else if (
    statuses.some(
      (status) => status === "COLLECTED" || status === "IN_TRANSIT",
    )
  ) {
    nextStatus = "SAMPLE_COLLECTED";
  }

  if (nextStatus !== "PENDING") {
    await prisma.appointmentTest.update({
      where: { appointmentTestId },
      data: { status: nextStatus },
    });
  }
};

const synchronizeHomeCollectionStatus = async (
  homeCollectionId: string,
): Promise<void> => {
  const homeCollection = await prisma.homeCollection.findUnique({
    where: { homeCollectionId },
    include: {
      samples: { select: { status: true } },
      collectorAssignment: { select: { status: true } },
    },
  });

  if (!homeCollection || homeCollection.samples.length === 0) return;

  const statuses = homeCollection.samples.map((sample) => sample.status);

  let nextStatus:
    | "PENDING"
    | "ASSIGNED"
    | "EN_ROUTE"
    | "SAMPLE_COLLECTED"
    | "IN_LAB"
    | "PROCESSING"
    | "REPORT_READY"
    | "COMPLETED"
    | "CANCELLED";

  if (statuses.every((status) => status === "REJECTED")) {
    nextStatus = "CANCELLED";
  } else if (statuses.every((status) => status === "COMPLETED")) {
    nextStatus = "REPORT_READY";
  } else if (statuses.some((status) => status === "PROCESSING")) {
    nextStatus = "PROCESSING";
  } else if (statuses.some((status) => status === "IN_TRANSIT")) {
    nextStatus = "EN_ROUTE";
  } else if (
    statuses.some(
      (status) => status === "RECEIVED" || status === "COMPLETED",
    )
  ) {
    nextStatus = "IN_LAB";
  } else if (
    statuses.some(
      (status) => status === "COLLECTED" || status === "REJECTED",
    )
  ) {
    nextStatus = "SAMPLE_COLLECTED";
  } else if (homeCollection.collectorAssignment) {
    nextStatus = "ASSIGNED";
  } else {
    nextStatus = "PENDING";
  }

  const allSamplesHandedOverOrTerminal = statuses.every(
    (status) =>
      status === "RECEIVED" ||
      status === "PROCESSING" ||
      status === "COMPLETED" ||
      status === "REJECTED",
  );

  await prisma.homeCollection.update({
    where: { homeCollectionId },
    data: {
      status: nextStatus,
      ...(statuses.some((status) => status === "COLLECTED") &&
        !homeCollection.collectedAt && {
          collectedAt: new Date(),
        }),
    },
  });

  if (
    allSamplesHandedOverOrTerminal &&
    homeCollection.collectorAssignment?.status === "ACCEPTED"
  ) {
    await prisma.collectorAssignment.update({
      where: { homeCollectionId },
      data: { status: "COMPLETED" },
    });
  }
};

// =========================================================
// CREATE SAMPLE
// =========================================================

export const createSample = async (data: CreateSampleInput) => {
  const appointmentTest = await prisma.appointmentTest.findUnique({
    where: { appointmentTestId: data.appointmentTestId },
    include: {
      appointment: true,
      labTest: { include: { testCatalog: true } },
    },
  });

  if (!appointmentTest) throw new Error("Appointment test not found");

  if (appointmentTest.appointment.appointmentType !== "LAB") {
    throw new Error("Samples can only be created for LAB appointments");
  }

  if (data.homeCollectionId) {
    const homeCollection = await prisma.homeCollection.findUnique({
      where: { homeCollectionId: data.homeCollectionId },
    });

    if (!homeCollection) throw new Error("Home collection not found");

    if (homeCollection.appointmentId !== appointmentTest.appointmentId) {
      throw new Error("Home collection does not belong to this appointment");
    }

    if (homeCollection.status === "CANCELLED") {
      throw new Error("Cannot create a sample for a cancelled collection");
    }
  }

  if (data.collectorId) {
    const collector = await prisma.collector.findUnique({
      where: { collectorId: data.collectorId },
    });

    if (!collector) throw new Error("Collector not found");
    if (collector.status !== "ACTIVE") {
      throw new Error("Collector is inactive");
    }

    if (
      appointmentTest.appointment.labId &&
      collector.labId !== appointmentTest.appointment.labId
    ) {
      throw new Error("Collector does not belong to the appointment's lab");
    }
  }

  const existingSample = await prisma.sample.findUnique({
    where: { barcode: data.barcode },
  });

  if (existingSample) throw new Error("Barcode already exists");

  const sample = await prisma.sample.create({
    data: {
      appointmentTestId: data.appointmentTestId,
      homeCollectionId: data.homeCollectionId,
      collectorId: data.collectorId,
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

  await addSampleTracking(
    sample.sampleId,
    "BARCODE_SCANNED",
    "Sample registered and awaiting collection",
  );

  return sample;
};

// =========================================================
// COLLECTION OTP
// =========================================================

export const generateCollectionOtp = async (sampleId: string) => {
  const sample = await prisma.sample.findUnique({
    where: { sampleId },
    include: {
      appointmentTest: { include: { appointment: true } },
      homeCollection: true,
    },
  });

  if (!sample) throw new Error("Sample not found");

  if (sample.status !== "PENDING_COLLECTION") {
    throw new Error("OTP can only be generated before sample collection");
  }

  const otp = generateOtp();
  const expiresAt = new Date(
    Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000,
  );

  const verification = await prisma.$transaction(async (tx) => {
    await tx.sampleOtpVerification.updateMany({
      where: {
        sampleId,
        purpose: "COLLECTION_VERIFICATION",
        verified: false,
      },
      data: { expiresAt: new Date() },
    });

    return tx.sampleOtpVerification.create({
      data: {
        sampleId,
        purpose: "COLLECTION_VERIFICATION",
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
    message: "Collection OTP generated successfully",
  };
};

export const verifyCollectionOtp = async (
  sampleId: string,
  otp: string,
) => {
  if (!/^\d{6}$/.test(otp)) {
    throw new Error("OTP must be a 6-digit number");
  }

  const sample = await prisma.sample.findUnique({ where: { sampleId } });

  if (!sample) throw new Error("Sample not found");

  if (sample.status !== "PENDING_COLLECTION") {
    throw new Error("OTP verification is only allowed before sample collection");
  }

  const verification = await getLatestOtp(
    sampleId,
    "COLLECTION_VERIFICATION",
  );

  if (!verification) throw new Error("No collection OTP generated for this sample");
  if (verification.verified) throw new Error("Collection OTP has already been verified");
  if (isOtpExpired(verification.expiresAt)) throw new Error("Collection OTP has expired");
  if (verification.attempts >= MAX_OTP_ATTEMPTS) {
    throw new Error("Maximum OTP attempts exceeded");
  }

  if (hashOtp(otp) !== verification.otpHash) {
    await prisma.sampleOtpVerification.update({
      where: { verificationId: verification.verificationId },
      data: { attempts: { increment: 1 } },
    });
    throw new Error("Invalid collection OTP");
  }

  const verified = await prisma.$transaction(async (tx) => {
    const currentOtp = await tx.sampleOtpVerification.findUnique({
      where: { verificationId: verification.verificationId },
    });
    const currentSample = await tx.sample.findUnique({ where: { sampleId } });

    if (
      !currentOtp ||
      currentOtp.verified ||
      currentOtp.expiresAt <= new Date() ||
      currentOtp.attempts >= MAX_OTP_ATTEMPTS
    ) {
      throw new Error("Collection OTP is no longer valid");
    }

    if (!currentSample || currentSample.status !== "PENDING_COLLECTION") {
      throw new Error("Sample is no longer awaiting collection");
    }

    return tx.sampleOtpVerification.update({
      where: { verificationId: currentOtp.verificationId },
      data: { verified: true, verifiedAt: new Date() },
    });
  });

  return {
    sampleId,
    verificationId: verified.verificationId,
    verified: true,
    message: "Collection OTP verified successfully",
  };
};

// =========================================================
// GET SAMPLES
// =========================================================

export const getSamples = async () =>
  prisma.sample.findMany({
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

export const getSamplesByAppointmentTest = async (
  appointmentTestId: string,
) => {
  const appointmentTest = await prisma.appointmentTest.findUnique({
    where: { appointmentTestId },
    select: { appointmentTestId: true },
  });

  if (!appointmentTest) throw new Error("Appointment test not found");

  return prisma.sample.findMany({
    where: { appointmentTestId },
    orderBy: { createdAt: "desc" },
    include: {
      collector: true,
      homeCollection: true,
      appointmentTest: {
        include: { labTest: { include: { testCatalog: true } } },
      },
    },
  });
};

export const getSampleById = async (sampleId: string) => {
  const sample = await prisma.sample.findUnique({
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
      trackingEvents: { orderBy: { createdAt: "desc" } },
      otpVerifications: { orderBy: { generatedAt: "desc" } },
      evidence: true,
    },
  });

  if (!sample) throw new Error("Sample not found");
  return sample;
};

export const getSampleByBarcode = async (barcode: string) => {
  const sample = await prisma.sample.findUnique({
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
      trackingEvents: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!sample) throw new Error("Sample not found");
  return sample;
};

// =========================================================
// HANDOVER OTP: GENERATED BY LAB STAFF
// =========================================================

export const generateSampleHandoverOtp = async (
  sampleId: string,
  labUserId: string,
) => {
  const sample = await prisma.sample.findUnique({
    where: { sampleId },
    include: {
      appointmentTest: {
        include: {
          appointment: { include: { lab: true } },
        },
      },
    },
  });

  if (!sample) throw new Error("Sample not found");

  const lab = sample.appointmentTest.appointment.lab;

  if (!lab || lab.labUserId !== labUserId) {
    throw new Error("This sample does not belong to your lab");
  }

  if (sample.status !== "IN_TRANSIT") {
    throw new Error("Handover OTP can only be generated for a sample in transit");
  }

  const otp = generateOtp();
  const expiresAt = new Date(
    Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000,
  );

  const verification = await prisma.$transaction(async (tx) => {
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

// =========================================================
// HANDOVER OTP: VERIFIED BY COLLECTOR
// =========================================================

export const verifySampleHandoverOtp = async (
  sampleId: string,
  otp: string,
  userId: string,
) => {
  if (!/^\d{6}$/.test(otp)) throw new Error("OTP must be a 6-digit number");

  const collector = await prisma.collector.findUnique({
    where: { userId },
    select: { collectorId: true, status: true },
  });

  if (!collector) throw new Error("Collector not found for this user");
  if (collector.status !== "ACTIVE") throw new Error("Collector account is inactive");

  const sample = await prisma.sample.findUnique({
    where: { sampleId },
    include: {
      homeCollection: { include: { collectorAssignment: true } },
      appointmentTest: {
        include: { appointment: { include: { lab: true } } },
      },
    },
  });

  if (!sample) throw new Error("Sample not found");

  const homeCollection = sample.homeCollection;
  const assignment = homeCollection?.collectorAssignment;

  if (!homeCollection || !assignment) {
    throw new Error("Sample has no collector assignment");
  }

  if (assignment.collectorId !== collector.collectorId) {
    throw new Error("This sample is not assigned to you");
  }

  if (assignment.status !== "ACCEPTED") {
    throw new Error("You must accept the assignment first");
  }

  if (sample.status !== "IN_TRANSIT") {
    throw new Error("Sample must be in transit for handover");
  }

  if (!sample.appointmentTest.appointment.lab) {
    throw new Error("The appointment has no associated lab");
  }

  const verification = await getLatestOtp(sampleId, "SAMPLE_HANDOVER");

  if (!verification) throw new Error("Handover OTP has not been generated");
  if (verification.verified) throw new Error("Handover OTP has already been used");
  if (isOtpExpired(verification.expiresAt)) throw new Error("Handover OTP has expired");
  if (verification.attempts >= MAX_OTP_ATTEMPTS) {
    throw new Error("Maximum OTP attempts exceeded");
  }

  if (hashOtp(otp) !== verification.otpHash) {
    await prisma.sampleOtpVerification.update({
      where: { verificationId: verification.verificationId },
      data: { attempts: { increment: 1 } },
    });
    throw new Error("Invalid handover OTP");
  }

  const deliveryProof = await prisma.sampleEvidence.findFirst({
    where: { sampleId, type: "DELIVERY_PROOF" },
    select: { evidenceId: true },
  });

  if (!deliveryProof) {
    throw new Error("Upload delivery proof before verifying the lab handover");
  }

  await prisma.$transaction(async (tx) => {
    const currentOtp = await tx.sampleOtpVerification.findUnique({
      where: { verificationId: verification.verificationId },
    });
    const currentSample = await tx.sample.findUnique({ where: { sampleId } });

    if (
      !currentOtp ||
      currentOtp.verified ||
      currentOtp.expiresAt <= new Date() ||
      currentOtp.attempts >= MAX_OTP_ATTEMPTS
    ) {
      throw new Error("Handover OTP is no longer valid");
    }

    if (!currentSample || currentSample.status !== "IN_TRANSIT") {
      throw new Error("Sample is no longer in transit");
    }

    await tx.sampleOtpVerification.update({
      where: { verificationId: currentOtp.verificationId },
      data: { verified: true, verifiedAt: new Date() },
    });

    await tx.sample.update({
      where: { sampleId },
      data: { status: "RECEIVED", receivedAt: new Date() },
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

// =========================================================
// UPDATE SAMPLE
// =========================================================

export const updateSample = async (
  sampleId: string,
  data: UpdateSampleInput,
) => {
  const existingSample = await prisma.sample.findUnique({
    where: { sampleId },
    include: { appointmentTest: true, homeCollection: true },
  });

  if (!existingSample) throw new Error("Sample not found");

  const currentStatus = existingSample.status;
  const newStatus = data.status;

  if (!newStatus) {
    return prisma.sample.update({
      where: { sampleId },
      data: {
        ...(data.condition !== undefined && { condition: data.condition }),
        ...(data.rejectionReason !== undefined && {
          rejectionReason: data.rejectionReason,
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: {
        appointmentTest: true,
        collector: true,
        homeCollection: true,
        trackingEvents: { orderBy: { createdAt: "desc" } },
        otpVerifications: true,
        evidence: true,
      },
    });
  }

  if (currentStatus === "COMPLETED" || currentStatus === "REJECTED") {
    throw new Error(`Cannot change a terminal sample status: ${currentStatus}`);
  }

  const allowedTransitions: Record<string, SampleStatus[]> = {
    PENDING_COLLECTION: ["COLLECTED", "REJECTED"],
    COLLECTED: ["IN_TRANSIT", "REJECTED"],
    IN_TRANSIT: ["RECEIVED", "REJECTED"],
    RECEIVED: ["PROCESSING", "REJECTED"],
    PROCESSING: ["COMPLETED", "REJECTED"],
  };

  if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
    throw new Error(
      `Invalid sample status transition: ${currentStatus} -> ${newStatus}`,
    );
  }

  if (newStatus === "COLLECTED") {
    const collectionPhoto = await prisma.sampleEvidence.findFirst({
      where: { sampleId, type: "COLLECTION_PHOTO" },
      select: { evidenceId: true },
    });

    if (!collectionPhoto) {
      throw new Error("Upload a collection photo before marking the sample as COLLECTED");
    }

    if (existingSample.homeCollectionId) {
      const otpVerified = await isCollectionOtpVerified(sampleId);

      if (!otpVerified) {
        throw new Error("Collection OTP verification is required for home collection");
      }
    }
  }

  if (newStatus === "COMPLETED") {
    const report = await prisma.report.findUnique({
      where: { appointmentTestId: existingSample.appointmentTestId },
      include: { files: { select: { reportFileId: true } } },
    });

    if (!report) {
      throw new Error("Upload a report for this appointment test before completing the sample");
    }

    if (report.status !== "UPLOADED" && report.status !== "SENT") {
      throw new Error("Report must be UPLOADED or SENT before completion");
    }

    if (report.files.length === 0) {
      throw new Error("Upload at least one report file before completing the sample");
    }
  }

  if (newStatus === "REJECTED" && !data.rejectionReason?.trim()) {
    throw new Error("Rejection reason is required when rejecting a sample");
  }

  const trackingStatus: Partial<Record<SampleStatus, SampleTrackingStatus>> = {
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

  const updatedSample = await prisma.$transaction(async (tx) => {
    const currentSample = await tx.sample.findUnique({ where: { sampleId } });

    if (!currentSample || currentSample.status !== currentStatus) {
      throw new Error("Sample status changed while processing the request. Please retry.");
    }

    const updated = await tx.sample.update({
      where: { sampleId },
      data: {
        status: newStatus,
        ...(data.condition !== undefined && { condition: data.condition }),
        ...(data.rejectionReason !== undefined && {
          rejectionReason: data.rejectionReason,
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(newStatus === "COLLECTED" && { collectedAt: new Date() }),
        ...(newStatus === "RECEIVED" && { receivedAt: new Date() }),
      },
    });

    await tx.sampleTracking.create({
      data: {
        sampleId,
        status: mappedTrackingStatus,
        notes:
          data.notes ??
          (newStatus === "REJECTED"
            ? data.rejectionReason
            : `Sample status changed to ${newStatus}`),
      },
    });

    if (newStatus === "COLLECTED" && existingSample.homeCollectionId) {
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

    const homeTrackingStatus: Partial<
      Record<SampleStatus, "EN_ROUTE" | "PROCESSING" | "REPORT_READY">
    > = {
      IN_TRANSIT: "EN_ROUTE",
      PROCESSING: "PROCESSING",
      COMPLETED: "REPORT_READY",
    };

    const mappedHomeStatus = homeTrackingStatus[newStatus];

    if (mappedHomeStatus) {
      await prisma.homeCollectionTracking.create({
        data: {
          homeCollectionId: existingSample.homeCollectionId,
          status: mappedHomeStatus,
          notes:
            newStatus === "IN_TRANSIT"
              ? "Sample is in transit to the lab"
              : newStatus === "PROCESSING"
                ? "Sample processing has started"
                : "Sample processing completed and report is available",
        },
      });
    }
  }

  return prisma.sample.findUnique({
    where: { sampleId: updatedSample.sampleId },
    include: {
      appointmentTest: true,
      collector: true,
      homeCollection: true,
      trackingEvents: { orderBy: { createdAt: "desc" } },
      otpVerifications: { orderBy: { generatedAt: "desc" } },
      evidence: true,
    },
  });
};

// =========================================================
// DELETE SAMPLE
// =========================================================

export const deleteSample = async (sampleId: string) => {
  const sample = await prisma.sample.findUnique({
    where: { sampleId },
    include: {
      trackingEvents: true,
      otpVerifications: true,
      evidence: true,
    },
  });

  if (!sample) throw new Error("Sample not found");

  if (sample.status !== "PENDING_COLLECTION") {
    throw new Error("Only samples awaiting collection can be deleted");
  }

  if (sample.otpVerifications.length > 0) {
    throw new Error("Cannot delete a sample after an OTP has been generated");
  }

  if (sample.evidence.length > 0) {
    throw new Error("Cannot delete a sample that has evidence attached");
  }

  if (sample.trackingEvents.some((event) => event.status !== "BARCODE_SCANNED")) {
    throw new Error("Cannot delete a sample after its tracking workflow has started");
  }

  return prisma.$transaction(async (tx) => {
    await tx.sampleTracking.deleteMany({
      where: { sampleId, status: "BARCODE_SCANNED" },
    });

    return tx.sample.delete({ where: { sampleId } });
  });
};

// =========================================================
// COLLECTOR: VERIFY COLLECTION OTP
// =========================================================

export const verifyCollectorCollectionOtp = async (
  sampleId: string,
  otp: string,
  userId: string,
) => {
  const sample = await prisma.sample.findUnique({
    where: { sampleId },
    include: {
      homeCollection: {
        include: {
          collectorAssignment: { include: { collector: true } },
        },
      },
    },
  });

  if (!sample) throw new Error("Sample not found");
  if (!sample.homeCollectionId || !sample.homeCollection) {
    throw new Error("Sample is not part of a home collection");
  }

  const assignment = sample.homeCollection.collectorAssignment;

  if (!assignment) throw new Error("No collector assignment found");
  if (assignment.collector.userId !== userId) {
    throw new Error("Sample is not assigned to this collector");
  }
  if (assignment.status !== "ACCEPTED") {
    throw new Error("Collector must accept the assignment first");
  }
  if (assignment.collector.status !== "ACTIVE") {
    throw new Error("Collector is inactive");
  }

  return verifyCollectionOtp(sampleId, otp);
};

// =========================================================
// COLLECTOR: UPLOAD EVIDENCE
// =========================================================

export const uploadCollectorSampleEvidence = async (
  sampleId: string,
  userId: string,
  file: Express.Multer.File,
  type: EvidenceType,
) => {
  if (!file?.filename) throw new Error("Evidence file is required");

  const sample = await prisma.sample.findUnique({
    where: { sampleId },
    include: {
      homeCollection: {
        include: {
          collectorAssignment: { include: { collector: true } },
        },
      },
    },
  });

  if (!sample) throw new Error("Sample not found");

  const assignment = sample.homeCollection?.collectorAssignment;

  if (!sample.homeCollection || !assignment) {
    throw new Error("No collector assignment found");
  }
  if (assignment.collector.userId !== userId) {
    throw new Error("Sample is not assigned to this collector");
  }
  if (assignment.status !== "ACCEPTED") {
    throw new Error("Collector must accept the assignment first");
  }
  if (assignment.collector.status !== "ACTIVE") {
    throw new Error("Collector is inactive");
  }
  if (!["image/jpeg", "image/png"].includes(file.mimetype)) {
    throw new Error("Only JPG and PNG images are allowed");
  }

  if (type === "COLLECTION_PHOTO") {
    if (sample.status !== "PENDING_COLLECTION") {
      throw new Error("Collection photo must be uploaded before marking the sample COLLECTED");
    }

    if (!(await isCollectionOtpVerified(sampleId))) {
      throw new Error("Verify the collection OTP before uploading the collection photo");
    }
  }

  if (type === "DELIVERY_PROOF" && sample.status !== "IN_TRANSIT") {
    throw new Error("Delivery proof can only be uploaded while the sample is IN_TRANSIT");
  }

  const existingEvidence = await prisma.sampleEvidence.findFirst({
    where: { sampleId, type },
    select: { evidenceId: true },
  });

  if (existingEvidence) {
    throw new Error(`Evidence of type ${type} has already been uploaded for this sample`);
  }

  return prisma.sampleEvidence.create({
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

// =========================================================
// COLLECTOR: UPDATE SAMPLE STATUS
// =========================================================

export const updateCollectorSampleStatus = async (
  sampleId: string,
  userId: string,
  data: Omit<UpdateSampleInput, "status"> & {
    status: CollectorSampleStatus;
  },
) => {
  const sample = await prisma.sample.findUnique({
    where: { sampleId },
    include: {
      homeCollection: {
        include: {
          collectorAssignment: { include: { collector: true } },
        },
      },
    },
  });

  if (!sample) throw new Error("Sample not found");
  if (!sample.homeCollectionId || !sample.homeCollection) {
    throw new Error("Sample is not part of a home collection");
  }

  const assignment = sample.homeCollection.collectorAssignment;

  if (!assignment) throw new Error("No collector assignment found");
  if (assignment.collector.userId !== userId) {
    throw new Error("Sample is not assigned to this collector");
  }
  if (assignment.status !== "ACCEPTED") {
    throw new Error("Collector must accept the assignment first");
  }
  if (assignment.collector.status !== "ACTIVE") {
    throw new Error("Collector is inactive");
  }

  if (data.status !== "COLLECTED" && data.status !== "IN_TRANSIT") {
    throw new Error("Collector can only set status to COLLECTED or IN_TRANSIT");
  }

  return updateSample(sampleId, data);
};
