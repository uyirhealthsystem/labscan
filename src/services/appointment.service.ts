
import { prisma } from "./prisma.service";

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
  status?: "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "RESCHEDULED";
  patientNotes?: string;

  // Selected tests for LAB appointment
  tests?: {
    labTestId: string;
  }[];

  // Selected services for SCAN appointment
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
  status?: "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "RESCHEDULED";
  patientNotes?: string;
}

export interface CreateAppointmentTestInput {
  appointmentId: string;
  labTestId: string;
  price?: number | string;
  status?: "PENDING" | "SAMPLE_COLLECTED" | "PROCESSING" | "COMPLETED";
}

export interface UpdateAppointmentTestInput {
  price?: number | string;
  status?: "PENDING" | "SAMPLE_COLLECTED" | "PROCESSING" | "COMPLETED";
}

export interface CreateAppointmentServiceInput {
  appointmentId: string;
  scanServiceId: string;
  equipmentId?: string;
  price?: number | string;
  status?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
}

export interface UpdateAppointmentServiceInput {
  equipmentId?: string;
  price?: number | string;
  status?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
}


// =========================================================
// APPOINTMENT
// =========================================================

export async function createAppointment(
  data: CreateAppointmentInput,
) {
  // -------------------------------------------------------
  // Validate patient
  // -------------------------------------------------------

  const patient = await prisma.patient.findUnique({
    where: {
      patientId: data.patientId,
    },
  });

  if (!patient) {
    throw new Error("Patient not found");
  }

  // -------------------------------------------------------
  // LAB appointment validation
  // -------------------------------------------------------

  if (data.appointmentType === "LAB") {
    if (!data.labId) {
      throw new Error("labId is required for LAB appointment");
    }

    if (data.scanCenterId) {
      throw new Error(
        "scanCenterId should not be provided for LAB appointment",
      );
    }

    const lab = await prisma.lab.findUnique({
      where: {
        labId: data.labId,
      },
    });

    if (!lab) {
      throw new Error("Lab not found");
    }

    // LAB appointment should have at least one selected test
    if (!data.tests || data.tests.length === 0) {
      throw new Error(
        "At least one lab test is required for LAB appointment",
      );
    }

    // SCAN services should not be provided
    if (data.services && data.services.length > 0) {
      throw new Error(
        "services should not be provided for LAB appointment",
      );
    }

    // -----------------------------------------------------
    // Validate every selected lab test
    // -----------------------------------------------------

    for (const test of data.tests) {
      const labTest = await prisma.labTest.findUnique({
        where: {
          labTestId: test.labTestId,
        },
      });

      if (!labTest) {
        throw new Error(
          `Lab test not found: ${test.labTestId}`,
        );
      }

      if (labTest.labId !== data.labId) {
        throw new Error(
          `Lab test ${test.labTestId} does not belong to the selected lab`,
        );
      }

      if (labTest.status !== "ACTIVE") {
        throw new Error(
          `Lab test ${test.labTestId} is not active`,
        );
      }
    }

    // Prevent duplicate test IDs in the same booking
    const testIds = data.tests.map(
      (test) => test.labTestId,
    );

    const uniqueTestIds = new Set(testIds);

    if (uniqueTestIds.size !== testIds.length) {
      throw new Error(
        "The same lab test cannot be added more than once",
      );
    }
  }


  // -------------------------------------------------------
  // SCAN appointment validation
  // -------------------------------------------------------

  if (data.appointmentType === "SCAN") {
    if (!data.scanCenterId) {
      throw new Error(
        "scanCenterId is required for SCAN appointment",
      );
    }

    if (data.labId) {
      throw new Error(
        "labId should not be provided for SCAN appointment",
      );
    }

    const scanCenter = await prisma.scanCenter.findUnique({
      where: {
        scanCenterId: data.scanCenterId,
      },
    });

    if (!scanCenter) {
      throw new Error("Scan center not found");
    }

    // SCAN appointment should have at least one selected service
    if (!data.services || data.services.length === 0) {
      throw new Error(
        "At least one scan service is required for SCAN appointment",
      );
    }

    // LAB tests should not be provided
    if (data.tests && data.tests.length > 0) {
      throw new Error(
        "tests should not be provided for SCAN appointment",
      );
    }

    // -----------------------------------------------------
    // Validate every selected scan service
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

      if (
        scanService.scanCenterId !== data.scanCenterId
      ) {
        throw new Error(
          `Scan service ${service.scanServiceId} does not belong to the selected scan center`,
        );
      }

      if (scanService.status !== "ACTIVE") {
        throw new Error(
          `Scan service ${service.scanServiceId} is not active`,
        );
      }

      // HOME scan must support home service
      if (
        data.appointmentMode === "HOME" &&
        !scanService.homeServiceAvailable
      ) {
        throw new Error(
          `Scan service ${service.scanServiceId} is not available for home service`,
        );
      }

      // Equipment required
      if (
        scanService.equipmentRequired &&
        !service.equipmentId
      ) {
        throw new Error(
          `equipmentId is required for scan service ${service.scanServiceId}`,
        );
      }

      // ---------------------------------------------------
      // Validate equipment if provided
      // ---------------------------------------------------

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

        if (
          equipment.scanCenterId !== data.scanCenterId
        ) {
          throw new Error(
            `Equipment ${service.equipmentId} does not belong to the selected scan center`,
          );
        }

        if (equipment.status !== "ACTIVE") {
          throw new Error(
            `Equipment ${service.equipmentId} is not active`,
          );
        }

        // Equipment must be mapped to this service
        const equipmentMapping =
          await prisma.equipmentService.findUnique({
            where: {
              equipmentId_scanServiceId: {
                equipmentId: service.equipmentId,
                scanServiceId: service.scanServiceId,
              },
            },
          });

        if (!equipmentMapping) {
          throw new Error(
            `Equipment ${service.equipmentId} is not mapped to scan service ${service.scanServiceId}`,
          );
        }
      }
    }

    // Prevent duplicate service IDs
    const serviceIds = data.services.map(
      (service) => service.scanServiceId,
    );

    const uniqueServiceIds = new Set(serviceIds);

    if (uniqueServiceIds.size !== serviceIds.length) {
      throw new Error(
        "The same scan service cannot be added more than once",
      );
    }
  }


  // -------------------------------------------------------
  // HOME appointment requires address
  // -------------------------------------------------------

  if (
    data.appointmentMode === "HOME" &&
    !data.address
  ) {
    throw new Error(
      "address is required for HOME appointment",
    );
  }


  // -------------------------------------------------------
  // Check duplicate booking ID
  // -------------------------------------------------------

  const existingBooking =
    await prisma.appointment.findUnique({
      where: {
        bookingId: data.bookingId,
      },
    });

  if (existingBooking) {
    throw new Error(
      `Appointment with bookingId ${data.bookingId} already exists`,
    );
  }


  // =======================================================
  // CREATE EVERYTHING IN ONE TRANSACTION
  // =======================================================

  return prisma.$transaction(async (tx) => {
    // -----------------------------------------------------
    // Create appointment
    // -----------------------------------------------------

    const appointment = await tx.appointment.create({
      data: {
        bookingId: data.bookingId,
        patientId: data.patientId,
        labId: data.labId,
        scanCenterId: data.scanCenterId,
        appointmentType: data.appointmentType,
        appointmentMode: data.appointmentMode,
        appointmentDate: new Date(
          data.appointmentDate,
        ),
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        address: data.address,
        status: data.status,
        patientNotes: data.patientNotes,
      },
    });


    // -----------------------------------------------------
    // Create selected LAB tests
    // -----------------------------------------------------

    if (
      data.appointmentType === "LAB" &&
      data.tests
    ) {
      await tx.appointmentTest.createMany({
        data: data.tests.map((test) => ({
          appointmentId:
            appointment.appointmentId,
          labTestId: test.labTestId,
          status: "PENDING",
        })),
      });
    }


    // -----------------------------------------------------
    // Create selected SCAN services
    // -----------------------------------------------------

    if (
      data.appointmentType === "SCAN" &&
      data.services
    ) {
      await tx.appointmentService.createMany({
        data: data.services.map((service) => ({
          appointmentId:
            appointment.appointmentId,
          scanServiceId: service.scanServiceId,
          equipmentId: service.equipmentId,
          status: "PENDING",
        })),
      });
    }


    // -----------------------------------------------------
    // Return complete appointment
    // -----------------------------------------------------

    return tx.appointment.findUnique({
      where: {
        appointmentId:
          appointment.appointmentId,
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
      },
    });
  });
}


// =========================================================
// GET APPOINTMENTS
// =========================================================

export async function getAppointments() {
  return prisma.appointment.findMany({
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
    },

    orderBy: {
      appointmentDate: "desc",
    },
  });
}


// =========================================================
// GET APPOINTMENTS BY PATIENT
// =========================================================

export async function getAppointmentsByPatient(
  patientId: string,
) {
  const patient = await prisma.patient.findUnique({
    where: {
      patientId,
    },
  });

  if (!patient) {
    throw new Error("Patient not found");
  }

  return prisma.appointment.findMany({
    where: {
      patientId,
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
    },

    orderBy: {
      appointmentDate: "desc",
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

        cancellation: true,

        reschedules: true,

        homeCollection: true,

        report: {
          include: {
            files: true,
          },
        },

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

  return prisma.appointment.delete({
    where: {
      appointmentId,
    },
  });
}


// =========================================================
// APPOINTMENT TEST
// =========================================================

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
      "Appointment test can only be added to LAB appointment",
    );
  }

  if (!appointment.labId) {
    throw new Error(
      "LAB appointment does not have labId",
    );
  }

  const labTest =
    await prisma.labTest.findUnique({
      where: {
        labTestId: data.labTestId,
      },
    });

  if (!labTest) {
    throw new Error("Lab test not found");
  }

  if (labTest.labId !== appointment.labId) {
    throw new Error(
      "Lab test does not belong to the appointment lab",
    );
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
      price: data.price,
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

export async function getAllAppointmentTests() {
  return prisma.appointmentTest.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      appointment: {
        select: {
          appointmentId: true,
          bookingId: true,
          appointmentType: true,
          appointmentMode: true,
          appointmentDate: true,
          status: true,
          patient: {
            select: {
              patientId: true,
              name: true,
              phone: true,
            },
          },
          lab: {
            select: {
              labId: true,
              name: true,
            },
          },
        },
      },
      labTest: {
        include: {
          testCatalog: {
            select: {
              testCatalogId: true,
              code: true,
              name: true,
              category: true,
            },
          },
        },
      },
    },
  });
}

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

    include: {
      labTest: {
        include: {
          testCatalog: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });
}


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
    throw new Error(
      "Appointment test not found",
    );
  }

  return appointmentTest;
}


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
    throw new Error(
      "Appointment test not found",
    );
  }

  return prisma.appointmentTest.update({
    where: {
      appointmentTestId,
    },

    data: {
      price: data.price,
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
    throw new Error(
      "Appointment test not found",
    );
  }

  return prisma.appointmentTest.delete({
    where: {
      appointmentTestId,
    },
  });
}


// =========================================================
// APPOINTMENT SERVICE
// =========================================================

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
      "Appointment service can only be added to SCAN appointment",
    );
  }

  if (!appointment.scanCenterId) {
    throw new Error(
      "SCAN appointment does not have scanCenterId",
    );
  }

  const scanService =
    await prisma.scanService.findUnique({
      where: {
        scanServiceId: data.scanServiceId,
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
      "Scan service does not belong to the appointment scan center",
    );
  }

  if (
    appointment.appointmentMode === "HOME" &&
    !scanService.homeServiceAvailable
  ) {
    throw new Error(
      "This scan service is not available for home service",
    );
  }

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
        "Equipment does not belong to the appointment scan center",
      );
    }

    const equipmentMapping =
      await prisma.equipmentService.findUnique({
        where: {
          equipmentId_scanServiceId: {
            equipmentId: data.equipmentId,
            scanServiceId: data.scanServiceId,
          },
        },
      });

    if (!equipmentMapping) {
      throw new Error(
        "Equipment is not mapped to this scan service",
      );
    }
  }

  const existing =
    await prisma.appointmentService.findUnique({
      where: {
        appointmentId_scanServiceId: {
          appointmentId: data.appointmentId,
          scanServiceId: data.scanServiceId,
        },
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
      price: data.price,
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


export async function getAllAppointmentServices() {
  return prisma.appointmentService.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      appointment: {
        select: {
          appointmentId: true,
          bookingId: true,
          appointmentType: true,
          appointmentMode: true,
          appointmentDate: true,
          status: true,
          patient: {
            select: {
              patientId: true,
              name: true,
              phone: true,
            },
          },
          scanCenter: {
            select: {
              scanCenterId: true,
              name: true,
            },
          },
        },
      },
      scanService: {
        include: {
          serviceCatalog: {
            select: {
              serviceCatalogId: true,
              code: true,
              name: true,
              category: true,
            },
          },
        },
      },
      equipment: {
        select: {
          equipmentId: true,
          name: true,
          equipmentType: true,
          manufacturer: true,
          modelNumber: true,
        },
      },
    },
  });
}

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

    include: {
      scanService: {
        include: {
          serviceCatalog: true,
        },
      },

      equipment: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });
}


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


export async function updateAppointmentService(
  appointmentServiceId: string,
  data: UpdateAppointmentServiceInput,
) {
  const existing =
    await prisma.appointmentService.findUnique({
      where: {
        appointmentServiceId,
      },

      include: {
        appointment: true,
        scanService: true,
      },
    });

  if (!existing) {
    throw new Error(
      "Appointment service not found",
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
      existing.appointment.scanCenterId
    ) {
      throw new Error(
        "Equipment does not belong to the appointment scan center",
      );
    }

    const mapping =
      await prisma.equipmentService.findUnique({
        where: {
          equipmentId_scanServiceId: {
            equipmentId: data.equipmentId,
            scanServiceId:
              existing.scanServiceId,
          },
        },
      });

    if (!mapping) {
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
      price: data.price,
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

  return prisma.appointmentService.delete({
    where: {
      appointmentServiceId,
    },
  });
}


