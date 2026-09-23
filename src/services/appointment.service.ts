
import { prisma } from "./prisma.service";

// =========================================================
// TYPES
// =========================================================

export interface CreateAppointmentInput {
  bookingId: string;
  patientId: string;
  labId?: string;
  scanCenterId?: string;

  appointmentType: "LAB" | "SCAN";
  appointmentMode: "CENTER" | "HOME";

  appointmentDate: string;
  startTime: string;
  endTime: string;

  address?: string;
  status?:
    | "CONFIRMED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED"
    | "RESCHEDULED";

  patientNotes?: string;

  tests?: {
    labTestId: string;
  }[];

  services?: {
    scanServiceId: string;
    equipmentId?: string;
  }[];
}

export interface UpdateAppointmentInput {
  appointmentDate?: string;
  startTime?: string;
  endTime?: string;
  address?: string;
  status?:
    | "CONFIRMED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED"
    | "RESCHEDULED";
  patientNotes?: string;
}

// Price is NOT accepted from client.
// It is automatically copied from LabTest.price.
export interface CreateAppointmentTestInput {
  appointmentId: string;
  labTestId: string;
  status?: "PENDING" | "SAMPLE_COLLECTED" | "PROCESSING" | "COMPLETED";
}

// Price is NOT updateable.
// AppointmentTest keeps the booking-time price snapshot.
export interface UpdateAppointmentTestInput {
  status?: "PENDING" | "SAMPLE_COLLECTED" | "PROCESSING" | "COMPLETED";
}

// Price is NOT accepted from client.
// It is automatically copied from ScanService.price.
export interface CreateAppointmentServiceInput {
  appointmentId: string;
  scanServiceId: string;
  equipmentId?: string;
  status?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
}

// Price is NOT updateable.
// AppointmentService keeps the booking-time price snapshot.
export interface UpdateAppointmentServiceInput {
  equipmentId?: string;
  status?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
}

// =========================================================
// CREATE APPOINTMENT
// =========================================================

export async function createAppointment(data: CreateAppointmentInput) {
  // -------------------------------------------------------
  // Validate patient
  // -------------------------------------------------------

  // const patient = await prisma.patient.findUnique({
  //   where: {
  //     patientId: data.patientId,
  //   },
  // });

  // if (!patient) {
  //   throw new Error("Patient not found");
  // }

  // -------------------------------------------------------
  // Validate appointment type
  // -------------------------------------------------------

  if (data.appointmentType === "LAB") {
    if (!data.labId) {
      throw new Error("labId is required for LAB appointment");
    }

    if (data.scanCenterId) {
      throw new Error("scanCenterId is not allowed for LAB appointment");
    }

    if (!data.tests || data.tests.length === 0) {
      throw new Error("At least one lab test is required");
    }

    if (data.services && data.services.length > 0) {
      throw new Error("services are not allowed for LAB appointment");
    }

    // -----------------------------------------------------
    // Validate Lab
    // -----------------------------------------------------

    const lab = await prisma.lab.findUnique({
      where: {
        labId: data.labId,
      },
    });

    if (!lab) {
      throw new Error("Lab not found");
    }

    if (lab.status !== "ACTIVE") {
      throw new Error("Lab is not active");
    }

    // -----------------------------------------------------
    // Prevent duplicate lab tests
    // -----------------------------------------------------

    const labTestIds = data.tests.map((test) => test.labTestId);

    if (new Set(labTestIds).size !== labTestIds.length) {
      throw new Error("Duplicate lab tests are not allowed");
    }

    // -----------------------------------------------------
    // Validate every LabTest
    // -----------------------------------------------------

    for (const test of data.tests) {
      const labTest = await prisma.labTest.findUnique({
        where: {
          labTestId: test.labTestId,
        },
      });

      if (!labTest) {
        throw new Error(`Lab test not found: ${test.labTestId}`);
      }

      if (labTest.labId !== data.labId) {
        throw new Error(
          `Lab test ${test.labTestId} does not belong to this lab`,
        );
      }

      if (labTest.status !== "ACTIVE") {
        throw new Error(`Lab test ${test.labTestId} is not active`);
      }
    }
  }

  // =======================================================
  // SCAN APPOINTMENT
  // =======================================================

  if (data.appointmentType === "SCAN") {
    if (!data.scanCenterId) {
      throw new Error("scanCenterId is required for SCAN appointment");
    }

    if (data.labId) {
      throw new Error("labId is not allowed for SCAN appointment");
    }

    if (!data.services || data.services.length === 0) {
      throw new Error("At least one scan service is required");
    }

    if (data.tests && data.tests.length > 0) {
      throw new Error("tests are not allowed for SCAN appointment");
    }

    // -----------------------------------------------------
    // Validate Scan Center
    // -----------------------------------------------------

    const scanCenter = await prisma.scanCenter.findUnique({
      where: {
        scanCenterId: data.scanCenterId,
      },
    });

    if (!scanCenter) {
      throw new Error("Scan center not found");
    }

    if (scanCenter.status !== "ACTIVE") {
      throw new Error("Scan center is not active");
    }

    // -----------------------------------------------------
    // Prevent duplicate services
    // -----------------------------------------------------

    const scanServiceIds = data.services.map(
      (service) => service.scanServiceId,
    );

    if (
      new Set(scanServiceIds).size !== scanServiceIds.length
    ) {
      throw new Error("Duplicate scan services are not allowed");
    }

    // -----------------------------------------------------
    // Validate every ScanService
    // -----------------------------------------------------

    for (const service of data.services) {
      const scanService = await prisma.scanService.findUnique({
        where: {
          scanServiceId: service.scanServiceId,
        },
      });

      if (!scanService) {
        throw new Error(
          `Scan service not found: ${service.scanServiceId}`,
        );
      }

      if (scanService.scanCenterId !== data.scanCenterId) {
        throw new Error(
          `Scan service ${service.scanServiceId} does not belong to this scan center`,
        );
      }

      if (scanService.status !== "ACTIVE") {
        throw new Error(
          `Scan service ${service.scanServiceId} is not active`,
        );
      }

      // ---------------------------------------------------
      // HOME service validation
      // ---------------------------------------------------

      if (
        data.appointmentMode === "HOME" &&
        !scanService.homeServiceAvailable
      ) {
        throw new Error(
          `Home service is not available for scan service ${service.scanServiceId}`,
        );
      }

      // ---------------------------------------------------
      // Equipment validation
      // ---------------------------------------------------

      if (scanService.equipmentRequired && !service.equipmentId) {
        throw new Error(
          `equipmentId is required for scan service ${service.scanServiceId}`,
        );
      }

      if (service.equipmentId) {
        const equipment = await prisma.equipment.findUnique({
          where: {
            equipmentId: service.equipmentId,
          },
        });

        if (!equipment) {
          throw new Error(
            `Equipment not found: ${service.equipmentId}`,
          );
        }

        if (equipment.scanCenterId !== data.scanCenterId) {
          throw new Error(
            `Equipment ${service.equipmentId} does not belong to this scan center`,
          );
        }

        if (equipment.status !== "ACTIVE") {
          throw new Error(
            `Equipment ${service.equipmentId} is not active`,
          );
        }

        // Check equipment is mapped to this scan service
        const equipmentService =
          await prisma.equipmentService.findFirst({
            where: {
              equipmentId: service.equipmentId,
              scanServiceId: service.scanServiceId,
            },
          });

        if (!equipmentService) {
          throw new Error(
            `Equipment ${service.equipmentId} is not mapped to scan service ${service.scanServiceId}`,
          );
        }
      }
    }
  }

  // =======================================================
  // HOME APPOINTMENT ADDRESS
  // =======================================================

  if (
    data.appointmentMode === "HOME" &&
    !data.address
  ) {
    throw new Error(
      "address is required for HOME appointment",
    );
  }

  // =======================================================
  // DUPLICATE BOOKING
  // =======================================================

  const existingAppointment =
    await prisma.appointment.findUnique({
      where: {
        bookingId: data.bookingId,
      },
    });

  if (existingAppointment) {
    throw new Error(
      "Appointment already exists for this bookingId",
    );
  }

  // =======================================================
  // CREATE APPOINTMENT
  // =======================================================

  const appointment = await prisma.$transaction(
    async (tx) => {
      const createdAppointment =
        await tx.appointment.create({
          data: {
            bookingId: data.bookingId,
            patientId: data.patientId,
            labId: data.labId,
            scanCenterId: data.scanCenterId,
            appointmentType: data.appointmentType,
            appointmentMode: data.appointmentMode,
            appointmentDate: new Date(data.appointmentDate),
            startTime: new Date(data.startTime),
            endTime: new Date(data.endTime),
            address: data.address,
            status: data.status ?? "CONFIRMED",
            patientNotes: data.patientNotes,
          },
        });

      // ===================================================
      // LAB TESTS
      // ===================================================

      if (
        data.appointmentType === "LAB" &&
        data.tests
      ) {
        for (const test of data.tests) {
          const labTest = await tx.labTest.findUnique({
            where: {
              labTestId: test.labTestId,
            },
            include: {
              testCatalog: true,
            },
          });

          if (!labTest) {
            throw new Error(
              `Lab test not found: ${test.labTestId}`,
            );
          }

          await tx.appointmentTest.create({
            data: {
              appointmentId:
                createdAppointment.appointmentId,

              labTestId: labTest.labTestId,

              // IMPORTANT:
              // Price comes from LabTest, NOT request body
              price: labTest.price,

              status: "PENDING",

              // Snapshot catalog information
              fastingRequirement:
                labTest.testCatalog.fastingRequirement,

              fastingHours:
                labTest.testCatalog.fastingHours,

              preparationInstructions:
                labTest.testCatalog.preparationInstructions,
            },
          });
        }
      }

      // ===================================================
      // SCAN SERVICES
      // ===================================================

      if (
        data.appointmentType === "SCAN" &&
        data.services
      ) {
        for (const service of data.services) {
          const scanService =
            await tx.scanService.findUnique({
              where: {
                scanServiceId: service.scanServiceId,
              },
            });

          if (!scanService) {
            throw new Error(
              `Scan service not found: ${service.scanServiceId}`,
            );
          }

          await tx.appointmentService.create({
            data: {
              appointmentId:
                createdAppointment.appointmentId,

              scanServiceId:
                scanService.scanServiceId,

              equipmentId:
                service.equipmentId,

              // IMPORTANT:
              // Price comes from ScanService, NOT request body
              price: scanService.price,

              status: "PENDING",
            },
          });
        }
      }

      return createdAppointment;
    },
  );

  // =======================================================
  // RETURN FULL APPOINTMENT
  // =======================================================

  return prisma.appointment.findUnique({
    where: {
      appointmentId: appointment.appointmentId,
    },
    include: {
      //patient: true,

      lab: true,

      scanCenter: true,

      tests: {
        include: {
          labTest: {
            include: {
              testCatalog: true,
            },
          },
        },
      },

      services: {
        include: {
          scanService: {
            include: {
              serviceCatalog: true,
            },
          },
          equipment: true,
        },
      },

      homeCollection: true,

      cancellation: true,

      reschedules: true,

      report: true,

      earning: true,
    },
  });
}

// =========================================================
// GET ALL APPOINTMENTS
// =========================================================

export async function getAppointments() {
  return prisma.appointment.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      patient: true,

      lab: true,

      scanCenter: true,

      tests: {
        include: {
          labTest: {
            include: {
              testCatalog: true,
            },
          },
        },
      },

      services: {
        include: {
          scanService: {
            include: {
              serviceCatalog: true,
            },
          },
          equipment: true,
        },
      },

      homeCollection: true,

      cancellation: true,

      reschedules: true,

      report: true,

      earning: true,
    },
  });
}


// =========================================================
// GET APPOINTMENTS BY LAB ID
// =========================================================

export async function getAppointmentsByLabId(labId: string) {
  return prisma.appointment.findMany({
    where: {
      labId,
    },
    orderBy: {
      appointmentDate: "desc",
    },
    include: {
      lab: true,
      scanCenter: true,
      tests: {
        include: {
          labTest: {
            include: {
              testCatalog: {
                select: {
                  testCatalogId: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      services: true,
      homeCollection: true,
      cancellation: true,
      reschedules: true,
      report: true,
      earning: true,
    },
  });
}


// =========================================================
// GET APPOINTMENTS BY PATIENT
// =========================================================

export async function getAppointmentsByPatient(
  patientId: string,
) {
  // const patient = await prisma.appointment.findUnique({
  //   where: {
  //     patientId,
  //   },
  // });

  // if (!patient) {
  //   throw new Error("Patient not found");
  // }

  return prisma.appointment.findMany({
    where: {
      patientId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      lab: true,

      scanCenter: true,

      tests: {
        include: {
          labTest: {
            include: {
              testCatalog: true,
            },
          },
        },
      },

      services: {
        include: {
          scanService: {
            include: {
              serviceCatalog: true,
            },
          },
          equipment: true,
        },
      },

      homeCollection: true,

      cancellation: true,

      reschedules: true,

      report: true,

      earning: true,
    },
  });
}

// =========================================================
// GET APPOINTMENT BY ID
// =========================================================

export async function getAppointmentById(
  appointmentId: string,
) {
  const appointment =
    await prisma.appointment.findUnique({
      where: {
        appointmentId,
      },
      include: {
        patient: true,

        lab: true,

        scanCenter: true,

        tests: {
          include: {
            labTest: {
              include: {
                testCatalog: true,
              },
            },
          },
        },

        services: {
          include: {
            scanService: {
              include: {
                serviceCatalog: true,
              },
            },
            equipment: true,
          },
        },

        homeCollection: true,

        cancellation: true,

        reschedules: true,

        report: true,

        earning: true,
      },
    });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  return appointment;
}

// =========================================================
// UPDATE APPOINTMENT
// =========================================================

export async function updateAppointment(
  appointmentId: string,
  data: UpdateAppointmentInput,
) {
  const existing =
    await prisma.appointment.findUnique({
      where: {
        appointmentId,
      },
    });

  if (!existing) {
    throw new Error("Appointment not found");
  }

  return prisma.appointment.update({
    where: {
      appointmentId,
    },
    data: {
      appointmentDate: data.appointmentDate
        ? new Date(data.appointmentDate)
        : undefined,

      startTime: data.startTime
        ? new Date(data.startTime)
        : undefined,

      endTime: data.endTime
        ? new Date(data.endTime)
        : undefined,

      address: data.address,

      status: data.status,

      patientNotes: data.patientNotes,
    },
    include: {
      patient: true,

      lab: true,

      scanCenter: true,

      tests: {
        include: {
          labTest: {
            include: {
              testCatalog: true,
            },
          },
        },
      },

      services: {
        include: {
          scanService: {
            include: {
              serviceCatalog: true,
            },
          },
          equipment: true,
        },
      },

      homeCollection: true,
    },
  });
}

// =========================================================
// DELETE APPOINTMENT
// =========================================================

export async function deleteAppointment(
  appointmentId: string,
) {
  const existing =
    await prisma.appointment.findUnique({
      where: {
        appointmentId,
      },
    });

  if (!existing) {
    throw new Error("Appointment not found");
  }

  await prisma.appointment.delete({
    where: {
      appointmentId,
    },
  });

  return true;
}

// =========================================================
// CREATE APPOINTMENT TEST
// =========================================================
// This is only for adding a test later to an existing
// appointment.
//
// Normal appointment creation already creates AppointmentTest
// automatically.

export async function createAppointmentTest(
  data: CreateAppointmentTestInput,
) {
  const appointment =
    await prisma.appointment.findUnique({
      where: {
        appointmentId: data.appointmentId,
      },
    });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  if (appointment.appointmentType !== "LAB") {
    throw new Error(
      "AppointmentTest can only be created for LAB appointment",
    );
  }

  if (!appointment.labId) {
    throw new Error("Appointment labId not found");
  }

  const labTest = await prisma.labTest.findUnique({
    where: {
      labTestId: data.labTestId,
    },
    include: {
      testCatalog: true,
    },
  });

  if (!labTest) {
    throw new Error("Lab test not found");
  }

  if (labTest.labId !== appointment.labId) {
    throw new Error(
      "Lab test does not belong to appointment lab",
    );
  }

  if (labTest.status !== "ACTIVE") {
    throw new Error("Lab test is not active");
  }

  const existing =
    await prisma.appointmentTest.findUnique({
      where: {
        appointmentId_labTestId: {
          appointmentId: data.appointmentId,
          labTestId: data.labTestId,
        },
      },
    });

  if (existing) {
    throw new Error(
      "This lab test is already added to the appointment",
    );
  }

  return prisma.appointmentTest.create({
    data: {
      appointmentId: data.appointmentId,

      labTestId: data.labTestId,

      // Price automatically copied from LabTest
      price: labTest.price,

      status: data.status ?? "PENDING",

      fastingRequirement:
        labTest.testCatalog.fastingRequirement,

      fastingHours:
        labTest.testCatalog.fastingHours,

      preparationInstructions:
        labTest.testCatalog.preparationInstructions,
    },

    include: {
      labTest: {
        include: {
          testCatalog: true,
        },
      },
    },
  });
}

// =========================================================
// GET ALL APPOINTMENT TESTS
// =========================================================

export async function getAllAppointmentTests() {
  return prisma.appointmentTest.findMany({
    orderBy: {
      createdAt: "desc",
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
}

// =========================================================
// GET APPOINTMENT TESTS
// =========================================================

export async function getAppointmentTests(
  appointmentId: string,
) {
  const appointment =
    await prisma.appointment.findUnique({
      where: {
        appointmentId,
      },
    });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  return prisma.appointmentTest.findMany({
    where: {
      appointmentId,
    },
    orderBy: {
      createdAt: "asc",
    },
    include: {
      labTest: {
        include: {
          testCatalog: true,
        },
      },
    },
  });
}

// =========================================================
// GET APPOINTMENT TEST BY ID
// =========================================================

export async function getAppointmentTestById(
  appointmentTestId: string,
) {
  const appointmentTest =
    await prisma.appointmentTest.findUnique({
      where: {
        appointmentTestId,
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

  return appointmentTest;
}

// =========================================================
// UPDATE APPOINTMENT TEST
// =========================================================

export async function updateAppointmentTest(
  appointmentTestId: string,
  data: UpdateAppointmentTestInput,
) {
  const existing =
    await prisma.appointmentTest.findUnique({
      where: {
        appointmentTestId,
      },
    });

  if (!existing) {
    throw new Error("Appointment test not found");
  }

  return prisma.appointmentTest.update({
    where: {
      appointmentTestId,
    },
    data: {
      status: data.status,
    },
    include: {
      labTest: {
        include: {
          testCatalog: true,
        },
      },
    },
  });
}

// =========================================================
// DELETE APPOINTMENT TEST
// =========================================================

export async function deleteAppointmentTest(
  appointmentTestId: string,
) {
  const existing =
    await prisma.appointmentTest.findUnique({
      where: {
        appointmentTestId,
      },
    });

  if (!existing) {
    throw new Error("Appointment test not found");
  }

  await prisma.appointmentTest.delete({
    where: {
      appointmentTestId,
    },
  });

  return true;
}

// =========================================================
// CREATE APPOINTMENT SERVICE
// =========================================================
// Normally services are automatically created by
// createAppointment() for SCAN appointments.
//
// This API is only useful for adding a service later.

export async function createAppointmentService(
  data: CreateAppointmentServiceInput,
) {
  const appointment =
    await prisma.appointment.findUnique({
      where: {
        appointmentId: data.appointmentId,
      },
    });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  if (appointment.appointmentType !== "SCAN") {
    throw new Error(
      "AppointmentService can only be created for SCAN appointment",
    );
  }

  if (!appointment.scanCenterId) {
    throw new Error(
      "Appointment scanCenterId not found",
    );
  }

  const scanService =
    await prisma.scanService.findUnique({
      where: {
        scanServiceId: data.scanServiceId,
      },
      include: {
        serviceCatalog: true,
      },
    });

  if (!scanService) {
    throw new Error("Scan service not found");
  }

  if (
    scanService.scanCenterId !==
    appointment.scanCenterId
  ) {
    throw new Error(
      "Scan service does not belong to appointment scan center",
    );
  }

  if (scanService.status !== "ACTIVE") {
    throw new Error("Scan service is not active");
  }

  // -------------------------------------------------------
  // HOME validation
  // -------------------------------------------------------

  if (
    appointment.appointmentMode === "HOME" &&
    !scanService.homeServiceAvailable
  ) {
    throw new Error(
      "Home service is not available for this scan service",
    );
  }

  // -------------------------------------------------------
  // Equipment validation
  // -------------------------------------------------------

  if (
    scanService.equipmentRequired &&
    !data.equipmentId
  ) {
    throw new Error(
      "equipmentId is required for this scan service",
    );
  }

  if (data.equipmentId) {
    const equipment =
      await prisma.equipment.findUnique({
        where: {
          equipmentId: data.equipmentId,
        },
      });

    if (!equipment) {
      throw new Error("Equipment not found");
    }

    if (
      equipment.scanCenterId !==
      appointment.scanCenterId
    ) {
      throw new Error(
        "Equipment does not belong to appointment scan center",
      );
    }

    if (equipment.status !== "ACTIVE") {
      throw new Error("Equipment is not active");
    }

    const equipmentService =
      await prisma.equipmentService.findFirst({
        where: {
          equipmentId: data.equipmentId,
          scanServiceId: data.scanServiceId,
        },
      });

    if (!equipmentService) {
      throw new Error(
        "Equipment is not mapped to this scan service",
      );
    }
  }

  // -------------------------------------------------------
  // Prevent duplicate service
  // -------------------------------------------------------

  const existing =
    await prisma.appointmentService.findFirst({
      where: {
        appointmentId: data.appointmentId,
        scanServiceId: data.scanServiceId,
      },
    });

  if (existing) {
    throw new Error(
      "This scan service is already added to the appointment",
    );
  }

  return prisma.appointmentService.create({
    data: {
      appointmentId: data.appointmentId,

      scanServiceId: data.scanServiceId,

      equipmentId: data.equipmentId,

      // Price automatically copied from ScanService
      price: scanService.price,

      status: data.status ?? "PENDING",
    },

    include: {
      scanService: {
        include: {
          serviceCatalog: true,
        },
      },
      equipment: true,
    },
  });
}

// =========================================================
// GET ALL APPOINTMENT SERVICES
// =========================================================

export async function getAllAppointmentServices() {
  return prisma.appointmentService.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      appointment: true,

      scanService: {
        include: {
          serviceCatalog: true,
        },
      },

      equipment: true,
    },
  });
}

// =========================================================
// GET APPOINTMENT SERVICES
// =========================================================

export async function getAppointmentServices(
  appointmentId: string,
) {
  const appointment =
    await prisma.appointment.findUnique({
      where: {
        appointmentId,
      },
    });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  return prisma.appointmentService.findMany({
    where: {
      appointmentId,
    },
    orderBy: {
      createdAt: "asc",
    },
    include: {
      scanService: {
        include: {
          serviceCatalog: true,
        },
      },

      equipment: true,
    },
  });
}

// =========================================================
// GET APPOINTMENT SERVICE BY ID
// =========================================================

export async function getAppointmentServiceById(
  appointmentServiceId: string,
) {
  const appointmentService =
    await prisma.appointmentService.findUnique({
      where: {
        appointmentServiceId,
      },
      include: {
        appointment: true,

        scanService: {
          include: {
            serviceCatalog: true,
          },
        },

        equipment: true,
      },
    });

  if (!appointmentService) {
    throw new Error(
      "Appointment service not found",
    );
  }

  return appointmentService;
}

// =========================================================
// UPDATE APPOINTMENT SERVICE
// =========================================================

export async function updateAppointmentService(
  appointmentServiceId: string,
  data: UpdateAppointmentServiceInput,
) {
  const existing =
    await prisma.appointmentService.findUnique({
      where: {
        appointmentServiceId,
      },
    });

  if (!existing) {
    throw new Error(
      "Appointment service not found",
    );
  }

  if (data.equipmentId) {
    const appointment =
      await prisma.appointment.findUnique({
        where: {
          appointmentId: existing.appointmentId,
        },
      });

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    if (!appointment.scanCenterId) {
      throw new Error(
        "Appointment scanCenterId not found",
      );
    }

    const equipment =
      await prisma.equipment.findUnique({
        where: {
          equipmentId: data.equipmentId,
        },
      });

    if (!equipment) {
      throw new Error("Equipment not found");
    }

    if (
      equipment.scanCenterId !==
      appointment.scanCenterId
    ) {
      throw new Error(
        "Equipment does not belong to appointment scan center",
      );
    }

    if (equipment.status !== "ACTIVE") {
      throw new Error("Equipment is not active");
    }

    const equipmentService =
      await prisma.equipmentService.findFirst({
        where: {
          equipmentId: data.equipmentId,
          scanServiceId: existing.scanServiceId,
        },
      });

    if (!equipmentService) {
      throw new Error(
        "Equipment is not mapped to this scan service",
      );
    }
  }

  return prisma.appointmentService.update({
    where: {
      appointmentServiceId,
    },
    data: {
      equipmentId: data.equipmentId,
      status: data.status,
    },
    include: {
      scanService: {
        include: {
          serviceCatalog: true,
        },
      },

      equipment: true,
    },
  });
}

// =========================================================
// DELETE APPOINTMENT SERVICE
// =========================================================

export async function deleteAppointmentService(
  appointmentServiceId: string,
) {
  const existing =
    await prisma.appointmentService.findUnique({
      where: {
        appointmentServiceId,
      },
    });

  if (!existing) {
    throw new Error(
      "Appointment service not found",
    );
  }

  await prisma.appointmentService.delete({
    where: {
      appointmentServiceId,
    },
  });

  return true;
}
