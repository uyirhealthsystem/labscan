
import crypto from "crypto";
import {prisma} from "./prisma.service";

const OTP_EXPIRY_MINUTES = 5;
const MAX_OTP_ATTEMPTS = 5;

// =========================================================
// TYPES
// =========================================================

export interface CreateSampleInput {
  appointmentTestId: string;
  homeCollectionId?: string;
  collectorId?: string;
  barcode: string;
  sampleType: string;
  containerType?: string;
  condition?: "GOOD" | "DAMAGED" | "LEAKED" | "INSUFFICIENT" | "HEMOLYZED" | "REJECTED";
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
  condition?: "GOOD" | "DAMAGED" | "LEAKED" | "INSUFFICIENT" | "HEMOLYZED" | "REJECTED";
  rejectionReason?: string;
  notes?: string;
}

// =========================================================
// OTP HELPERS
// =========================================================

const generateOtp = (): string => {
  return crypto.randomInt(100000, 1000000).toString();
};

const hashOtp = (otp: string): string => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

// =========================================================
// CREATE SAMPLE
// =========================================================

export const createSample = async (data: CreateSampleInput) => {
  // -------------------------------------------------------
  // Validate appointment test
  // -------------------------------------------------------

  const appointmentTest = await prisma.appointmentTest.findUnique({
    where: {
      appointmentTestId: data.appointmentTestId,
    },
    include: {
      appointment: true,
      labTest: {
        include: {
          testCatalog: true,
        },
      },
    },
  });

  if (!appointmentTest) {
    throw new Error("Appointment test not found");
  }

  // -------------------------------------------------------
  // Validate home collection
  // -------------------------------------------------------

  if (data.homeCollectionId) {
    const homeCollection = await prisma.homeCollection.findUnique({
      where: {
        homeCollectionId: data.homeCollectionId,
      },
    });

    if (!homeCollection) {
      throw new Error("Home collection not found");
    }

    if (
      homeCollection.appointmentId !==
      appointmentTest.appointmentId
    ) {
      throw new Error(
        "Home collection does not belong to this appointment",
      );
    }
  }

  // -------------------------------------------------------
  // Validate collector
  // -------------------------------------------------------

  if (data.collectorId) {
    const collector = await prisma.collector.findUnique({
      where: {
        collectorId: data.collectorId,
      },
    });

    if (!collector) {
      throw new Error("Collector not found");
    }

    if (collector.status !== "ACTIVE") {
      throw new Error("Collector is inactive");
    }
  }

  // -------------------------------------------------------
  // Check barcode
  // -------------------------------------------------------

  const existingSample = await prisma.sample.findUnique({
    where: {
      barcode: data.barcode,
    },
  });

  if (existingSample) {
    throw new Error("Barcode already exists");
  }

  // -------------------------------------------------------
  // Create sample
  // -------------------------------------------------------

  const sample = await prisma.sample.create({
    data: {
      appointmentTestId: data.appointmentTestId,
      homeCollectionId: data.homeCollectionId,
      collectorId: data.collectorId,

      barcode: data.barcode,
      sampleType: data.sampleType,
      containerType: data.containerType,

      // IMPORTANT:
      // Sample exists physically as a labelled tube,
      // but collection has NOT happened yet.
      status: "PENDING_COLLECTION",

      condition: data.condition ?? "GOOD",
      notes: data.notes,
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
    },
  });

  // -------------------------------------------------------
  // Create initial tracking event
  // -------------------------------------------------------

  await prisma.sampleTracking.create({
    data: {
      sampleId: sample.sampleId,
      status: "BARCODE_SCANNED",
      notes: "Sample tube registered and waiting for collection verification",
    },
  });

  return sample;
};

// =========================================================
// GENERATE COLLECTION OTP
// =========================================================

export const generateCollectionOtp = async (
  sampleId: string,
) => {
  const sample = await prisma.sample.findUnique({
    where: {
      sampleId,
    },
    include: {
      appointmentTest: {
        include: {
          appointment: {
            include: {
              patient: true,
            },
          },
        },
      },
      homeCollection: true,
    },
  });

  if (!sample) {
    throw new Error("Sample not found");
  }

  // OTP can only be generated before physical collection
  if (sample.status !== "PENDING_COLLECTION") {
    throw new Error(
      "OTP can only be generated before sample collection",
    );
  }

  const otp = generateOtp();
  const otpHash = hashOtp(otp);

  const expiresAt = new Date(
    Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000,
  );

  // -------------------------------------------------------
  // Invalidate previous active OTPs
  // -------------------------------------------------------

  await prisma.sampleOtpVerification.updateMany({
    where: {
      sampleId,
      purpose: "COLLECTION_VERIFICATION",
      verified: false,
    },
    data: {
      expiresAt: new Date(),
    },
  });

  // -------------------------------------------------------
  // Store OTP hash
  // -------------------------------------------------------

  const verification =
    await prisma.sampleOtpVerification.create({
      data: {
        sampleId,
        purpose: "COLLECTION_VERIFICATION",
        otpHash,
        expiresAt,
      },
    });

  return {
    verificationId: verification.verificationId,
    sampleId,
    purpose: verification.purpose,
    expiresAt,

    // DEV ONLY
    // Do NOT return this in production.
    debugOtp: otp,

    message:
      "OTP generated successfully. Share the OTP with the collector.",
  };
};

// =========================================================
// VERIFY COLLECTION OTP
// =========================================================

export const verifyCollectionOtp = async (
  sampleId: string,
  otp: string,
) => {
  const sample = await prisma.sample.findUnique({
    where: {
      sampleId,
    },
  });

  if (!sample) {
    throw new Error("Sample not found");
  }

  if (sample.status !== "PENDING_COLLECTION") {
    throw new Error(
      "OTP verification is only allowed before sample collection",
    );
  }

  // -------------------------------------------------------
  // Get latest OTP
  // -------------------------------------------------------

  const verification =
    await prisma.sampleOtpVerification.findFirst({
      where: {
        sampleId,
        purpose: "COLLECTION_VERIFICATION",
      },
      orderBy: {
        generatedAt: "desc",
      },
    });

  if (!verification) {
    throw new Error("No OTP generated for this sample");
  }

  if (verification.verified) {
    throw new Error("OTP has already been verified");
  }

  if (new Date() > verification.expiresAt) {
    throw new Error("OTP has expired");
  }

  if (verification.attempts >= MAX_OTP_ATTEMPTS) {
    throw new Error(
      "Maximum OTP attempts exceeded",
    );
  }

  // -------------------------------------------------------
  // Compare OTP
  // -------------------------------------------------------

  const otpHash = hashOtp(otp);

  if (otpHash !== verification.otpHash) {
    await prisma.sampleOtpVerification.update({
      where: {
        verificationId:
          verification.verificationId,
      },
      data: {
        attempts: {
          increment: 1,
        },
      },
    });

    throw new Error("Invalid OTP");
  }

  // -------------------------------------------------------
  // Mark OTP verified
  // -------------------------------------------------------

  await prisma.sampleOtpVerification.update({
    where: {
      verificationId:
        verification.verificationId,
    },
    data: {
      verified: true,
      verifiedAt: new Date(),
    },
  });

  return {
    sampleId,
    verificationId: verification.verificationId,
    verified: true,
    message:
      "OTP verified successfully. Sample can now be collected.",
  };
};

// =========================================================
// CHECK OTP VERIFIED
// =========================================================

const isCollectionOtpVerified = async (
  sampleId: string,
): Promise<boolean> => {
  const verification =
    await prisma.sampleOtpVerification.findFirst({
      where: {
        sampleId,
        purpose: "COLLECTION_VERIFICATION",
        verified: true,
      },
      orderBy: {
        verifiedAt: "desc",
      },
    });

  return !!verification;
};

// =========================================================
// GET ALL SAMPLES
// =========================================================

export const getSamples = async () => {
  return prisma.sample.findMany({
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
    },
  });
};

// =========================================================
// GET SAMPLES BY APPOINTMENT TEST
// =========================================================

export const getSamplesByAppointmentTest = async (
  appointmentTestId: string,
) => {
  return prisma.sample.findMany({
    where: {
      appointmentTestId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      collector: true,
      homeCollection: true,
      appointmentTest: {
        include: {
          labTest: {
            include: {
              testCatalog: true,
            },
          },
        },
      },
    },
  });
};

// =========================================================
// GET SAMPLE BY ID
// =========================================================

export const getSampleById = async (
  sampleId: string,
) => {
  const sample = await prisma.sample.findUnique({
    where: {
      sampleId,
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
      otpVerifications: {
        orderBy: {
          generatedAt: "desc",
        },
      },
    },
  });

  if (!sample) {
    throw new Error("Sample not found");
  }

  return sample;
};

// =========================================================
// GET SAMPLE BY BARCODE
// =========================================================

export const getSampleByBarcode = async (
  barcode: string,
) => {
  const sample = await prisma.sample.findUnique({
    where: {
      barcode,
    },
    include: {
      appointmentTest: {
        include: {
          appointment: {
            include: {
              patient: true,
            },
          },
          labTest: {
            include: {
              testCatalog: true,
            },
          },
        },
      },
      collector: true,
      homeCollection: true,
    },
  });

  if (!sample) {
    throw new Error("Sample not found");
  }

  return sample;
};

// =========================================================
// UPDATE SAMPLE
// =========================================================

export const updateSample = async (
  sampleId: string,
  data: UpdateSampleInput,
) => {
  const existingSample = await prisma.sample.findUnique({
    where: {
      sampleId,
    },
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

  // -------------------------------------------------------
  // Prevent update without status/other fields
  // -------------------------------------------------------

  if (!newStatus) {
    return prisma.sample.update({
      where: {
        sampleId,
      },
      data: {
        condition: data.condition,
        rejectionReason: data.rejectionReason,
        notes: data.notes,
      },
      include: {
        appointmentTest: true,
        collector: true,
        homeCollection: true,
      },
    });
  }

  // -------------------------------------------------------
  // COLLECTION
  // -------------------------------------------------------

 if (newStatus === "COLLECTED") {
  if (currentStatus !== "PENDING_COLLECTION") {
    throw new Error(
      "Sample can only be collected from PENDING_COLLECTION",
    );
  }

  // OTP is required only for HOME collection.
  // CENTER collection is performed directly by lab staff.
  if (existingSample.homeCollectionId) {
    const otpVerified = await isCollectionOtpVerified(sampleId);

    if (!otpVerified) {
      throw new Error(
        "OTP verification is required before collecting the home sample",
      );
    }
  }
}

  // -------------------------------------------------------
  // IN TRANSIT
  // -------------------------------------------------------

  if (newStatus === "IN_TRANSIT") {
    if (currentStatus !== "COLLECTED") {
      throw new Error(
        "Sample must be COLLECTED before moving to IN_TRANSIT",
      );
    }
  }

  // -------------------------------------------------------
  // RECEIVED
  // -------------------------------------------------------

  if (newStatus === "RECEIVED") {
    if (currentStatus !== "IN_TRANSIT") {
      throw new Error(
        "Sample must be IN_TRANSIT before RECEIVED",
      );
    }
  }

  // -------------------------------------------------------
  // PROCESSING
  // -------------------------------------------------------

  if (newStatus === "PROCESSING") {
    if (currentStatus !== "RECEIVED") {
      throw new Error(
        "Sample must be RECEIVED before PROCESSING",
      );
    }
  }

  // -------------------------------------------------------
  // COMPLETED
  // -------------------------------------------------------

  if (newStatus === "COMPLETED") {
    if (currentStatus !== "PROCESSING") {
      throw new Error(
        "Sample must be PROCESSING before COMPLETED",
      );
    }
  }

  // -------------------------------------------------------
  // REJECTED
  // -------------------------------------------------------

  if (
    newStatus === "REJECTED" &&
    !data.rejectionReason
  ) {
    throw new Error(
      "Rejection reason is required when rejecting a sample",
    );
  }

  // -------------------------------------------------------
  // Build update data
  // -------------------------------------------------------

  const updateData: any = {
    status: newStatus,
    condition: data.condition,
    rejectionReason: data.rejectionReason,
    notes: data.notes,
  };

  // Backend-generated collection timestamp
  if (newStatus === "COLLECTED") {
    updateData.collectedAt = new Date();
  }

  // Backend-generated received timestamp
  if (newStatus === "RECEIVED") {
    updateData.receivedAt = new Date();
  }

  // -------------------------------------------------------
  // Update sample
  // -------------------------------------------------------

  const updatedSample = await prisma.sample.update({
    where: {
      sampleId,
    },
    data: updateData,
    include: {
      appointmentTest: true,
      collector: true,
      homeCollection: true,
    },
  });

  // -------------------------------------------------------
  // Tracking
  // -------------------------------------------------------

  let trackingStatus:
    | "BARCODE_SCANNED"
    | "COLLECTED"
    | "IN_TRANSIT"
    | "RECEIVED_AT_LAB"
    | "ACCEPTED"
    | "REJECTED"
    | "PROCESSING_STARTED"
    | "COMPLETED"
    | null = null;

  if (newStatus === "COLLECTED") {
    trackingStatus = "COLLECTED";
  } else if (newStatus === "IN_TRANSIT") {
    trackingStatus = "IN_TRANSIT";
  } else if (newStatus === "RECEIVED") {
    trackingStatus = "RECEIVED_AT_LAB";
  } else if (newStatus === "PROCESSING") {
    trackingStatus = "PROCESSING_STARTED";
  } else if (newStatus === "COMPLETED") {
    trackingStatus = "COMPLETED";
  } else if (newStatus === "REJECTED") {
    trackingStatus = "REJECTED";
  }

  if (trackingStatus) {
    await prisma.sampleTracking.create({
      data: {
        sampleId,
        status: trackingStatus,
        notes: data.notes,
      },
    });
  }

  // -------------------------------------------------------
  // Update AppointmentTest
  // -------------------------------------------------------

  if (newStatus === "COLLECTED") {
    await prisma.appointmentTest.update({
      where: {
        appointmentTestId:
          existingSample.appointmentTestId,
      },
      data: {
        status: "SAMPLE_COLLECTED",
      },
    });
  }

  if (newStatus === "PROCESSING") {
    await prisma.appointmentTest.update({
      where: {
        appointmentTestId:
          existingSample.appointmentTestId,
      },
      data: {
        status: "PROCESSING",
      },
    });
  }

  if (newStatus === "COMPLETED") {
    await prisma.appointmentTest.update({
      where: {
        appointmentTestId:
          existingSample.appointmentTestId,
      },
      data: {
        status: "COMPLETED",
      },
    });
  }

  // -------------------------------------------------------
  // Update HomeCollection
  // -------------------------------------------------------

  if (existingSample.homeCollectionId) {
    if (newStatus === "COLLECTED") {
      await prisma.homeCollection.update({
        where: {
          homeCollectionId:
            existingSample.homeCollectionId,
        },
        data: {
          status: "SAMPLE_COLLECTED",
          collectedAt: new Date(),
        },
      });
    }

    if (newStatus === "RECEIVED") {
      await prisma.homeCollection.update({
        where: {
          homeCollectionId:
            existingSample.homeCollectionId,
        },
        data: {
          status: "IN_LAB",
        },
      });
    }

    if (newStatus === "PROCESSING") {
      await prisma.homeCollection.update({
        where: {
          homeCollectionId:
            existingSample.homeCollectionId,
        },
        data: {
          status: "PROCESSING",
        },
      });
    }

    if (newStatus === "COMPLETED") {
      await prisma.homeCollection.update({
        where: {
          homeCollectionId:
            existingSample.homeCollectionId,
        },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });
    }

    if (newStatus === "REJECTED") {
      await prisma.homeCollection.update({
        where: {
          homeCollectionId:
            existingSample.homeCollectionId,
        },
        data: {
          status: "CANCELLED",
        },
      });
    }
  }

  return updatedSample;
};

// =========================================================
// DELETE SAMPLE
// =========================================================

export const deleteSample = async (
  sampleId: string,
) => {
  const sample = await prisma.sample.findUnique({
    where: {
      sampleId,
    },
  });

  if (!sample) {
    throw new Error("Sample not found");
  }

  return prisma.sample.delete({
    where: {
      sampleId,
    },
  });
};
