
import { Request, Response } from "express";

import {
  createAppointment,
  createAppointmentService,
  createAppointmentTest,
  deleteAppointment,
  deleteAppointmentService,
  deleteAppointmentTest,
  getAppointmentById,
  getAppointmentsByLabId,
  getAppointmentServiceById,
  getAppointmentServices,
  getAppointmentTestById,
  getAppointmentTests,
  getAppointments,
  getAppointmentsByPatient,
  updateAppointment,
  updateAppointmentService,
  updateAppointmentTest,
  getAllAppointmentTests,
  getAllAppointmentServices,
  completeAppointment,
} from "../services/appointment.service";

import {
  getRequestedLanguage,
  translateResponse,
} from "../utils/translate.response";

// =========================================================
// APPOINTMENT
// =========================================================


export async function createAppointmentController(
  req: Request,
  res: Response,
) {
  try {
    const {
      patientId,
      labId,
      scanCenterId,
      appointmentType,
      appointmentMode,
      appointmentDate,
      startTime,
      endTime,
      address,
      status,
      patientNotes,
      tests,
      services,
    } = req.body;

    if (
      !patientId ||
      !appointmentType ||
      !appointmentMode ||
      !appointmentDate ||
      !startTime ||
      !endTime
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "patientId, appointmentType, appointmentMode, appointmentDate, startTime and endTime are required",
      });
    }

    const appointment = await createAppointment({
      patientId,
      labId,
      scanCenterId,
      appointmentType,
      appointmentMode,
      appointmentDate,
      startTime,
      endTime,
      address,
      status,
      patientNotes,
      tests,
      services,
    });

    const language = getRequestedLanguage(req);

    return res.status(201).json({
      status: "success",
      message: "Appointment created successfully",
      data: await translateResponse(appointment, language),
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}



export async function getAppointmentsController(
  req: Request,
  res: Response,
) {
  try {
    const appointments = await getAppointments();
    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(appointments, language),
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}

export const completeAppointmentController = async (
  req: Request,
  res: Response,
) => {
  try {
    const appointmentId = req.params.appointmentId as string;
    const appointment = await completeAppointment(appointmentId);
    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      message: "Appointment completed successfully",
      data: await translateResponse(appointment, language),
    });
  } catch (error: any) {
    console.error("Complete appointment error:", error);

    if (error.message === "Appointment not found") {
      return res.status(404).json({
        status: "error",
        message: error.message,
      });
    }

    return res.status(400).json({
      status: "error",
      message: error.message || "Failed to complete appointment",
    });
  }
};

// =========================================================
// GET APPOINTMENTS BY LAB ID
// =========================================================

export async function getAppointmentsByLabIdController(
  req: Request<{ labId: string }>,
  res: Response,
) {
  try {
    const { labId } = req.params;
    const appointments = await getAppointmentsByLabId(labId);
    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(appointments, language),
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}

export async function getAppointmentsByPatientController(
  req: Request<{ patientId: string }>,
  res: Response,
) {
  try {
    const { patientId } = req.params;
    const appointments = await getAppointmentsByPatient(patientId);
    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(appointments, language),
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}

export async function getAppointmentByIdController(
  req: Request<{ appointmentId: string }>,
  res: Response,
) {
  try {
    const { appointmentId } = req.params;
    const appointment = await getAppointmentById(appointmentId);
    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(appointment, language),
    });
  } catch (error: any) {
    return res.status(404).json({
      status: "error",
      message: error.message,
    });
  }
}

export async function updateAppointmentController(
  req: Request<{ appointmentId: string }>,
  res: Response,
) {
  try {
    const { appointmentId } = req.params;
    const appointment = await updateAppointment(
      appointmentId,
      req.body,
    );
    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      message: "Appointment updated successfully",
      data: await translateResponse(appointment, language),
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}

export async function deleteAppointmentController(
  req: Request<{ appointmentId: string }>,
  res: Response,
) {
  try {
    const { appointmentId } = req.params;
    await deleteAppointment(appointmentId);

    return res.status(200).json({
      status: "success",
      message: "Appointment deleted successfully",
    });
  } catch (error: any) {
    return res.status(404).json({
      status: "error",
      message: error.message,
    });
  }
}

// =========================================================
// APPOINTMENT TEST
// =========================================================

export async function createAppointmentTestController(
  req: Request,
  res: Response,
) {
  try {
    const { appointmentId, labTestId, status } = req.body;

    if (!appointmentId || !labTestId) {
      return res.status(400).json({
        status: "error",
        message: "appointmentId and labTestId are required",
      });
    }

    const appointmentTest = await createAppointmentTest({
      appointmentId,
      labTestId,
      status,
    });
    const language = getRequestedLanguage(req);

    return res.status(201).json({
      status: "success",
      message: "Appointment test added successfully",
      data: await translateResponse(appointmentTest, language),
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}

export async function getAllAppointmentTestsController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const appointmentTests = await getAllAppointmentTests();
    const language = getRequestedLanguage(req);

    res.status(200).json({
      status: "success",
      data: await translateResponse(appointmentTests, language),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch appointment tests",
    });
  }
}

export async function getAppointmentTestsController(
  req: Request<{ appointmentId: string }>,
  res: Response,
) {
  try {
    const { appointmentId } = req.params;
    const tests = await getAppointmentTests(appointmentId);
    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(tests, language),
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}

export async function getAppointmentTestByIdController(
  req: Request<{ appointmentTestId: string }>,
  res: Response,
) {
  try {
    const { appointmentTestId } = req.params;
    const appointmentTest =
      await getAppointmentTestById(appointmentTestId);
    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(appointmentTest, language),
    });
  } catch (error: any) {
    return res.status(404).json({
      status: "error",
      message: error.message,
    });
  }
}

export async function updateAppointmentTestController(
  req: Request<{ appointmentTestId: string }>,
  res: Response,
) {
  try {
    const { appointmentTestId } = req.params;
    const appointmentTest = await updateAppointmentTest(
      appointmentTestId,
      req.body,
    );
    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      message: "Appointment test updated successfully",
      data: await translateResponse(appointmentTest, language),
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}

export async function deleteAppointmentTestController(
  req: Request<{ appointmentTestId: string }>,
  res: Response,
) {
  try {
    const { appointmentTestId } = req.params;
    await deleteAppointmentTest(appointmentTestId);

    return res.status(200).json({
      status: "success",
      message: "Appointment test deleted successfully",
    });
  } catch (error: any) {
    return res.status(404).json({
      status: "error",
      message: error.message,
    });
  }
}

// =========================================================
// APPOINTMENT SERVICE
// =========================================================

export async function createAppointmentServiceController(
  req: Request,
  res: Response,
) {
  try {
    const {
      appointmentId,
      scanServiceId,
      equipmentId,
      status,
    } = req.body;

    if (!appointmentId || !scanServiceId) {
      return res.status(400).json({
        status: "error",
        message: "appointmentId and scanServiceId are required",
      });
    }

    const appointmentService = await createAppointmentService({
      appointmentId,
      scanServiceId,
      equipmentId,
      status,
    });
    const language = getRequestedLanguage(req);

    return res.status(201).json({
      status: "success",
      message: "Appointment service added successfully",
      data: await translateResponse(appointmentService, language),
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}

export async function getAllAppointmentServicesController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const appointmentServices = await getAllAppointmentServices();
    const language = getRequestedLanguage(req);

    res.status(200).json({
      status: "success",
      data: await translateResponse(appointmentServices, language),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch appointment services",
    });
  }
}

export async function getAppointmentServicesController(
  req: Request<{ appointmentId: string }>,
  res: Response,
) {
  try {
    const { appointmentId } = req.params;
    const services = await getAppointmentServices(appointmentId);
    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(services, language),
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}

export async function getAppointmentServiceByIdController(
  req: Request<{ appointmentServiceId: string }>,
  res: Response,
) {
  try {
    const { appointmentServiceId } = req.params;
    const appointmentService =
      await getAppointmentServiceById(appointmentServiceId);
    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(appointmentService, language),
    });
  } catch (error: any) {
    return res.status(404).json({
      status: "error",
      message: error.message,
    });
  }
}

export async function updateAppointmentServiceController(
  req: Request<{ appointmentServiceId: string }>,
  res: Response,
) {
  try {
    const { appointmentServiceId } = req.params;
    const appointmentService = await updateAppointmentService(
      appointmentServiceId,
      req.body,
    );
    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      message: "Appointment service updated successfully",
      data: await translateResponse(appointmentService, language),
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}

export async function deleteAppointmentServiceController(
  req: Request<{ appointmentServiceId: string }>,
  res: Response,
) {
  try {
    const { appointmentServiceId } = req.params;
    await deleteAppointmentService(appointmentServiceId);

    return res.status(200).json({
      status: "success",
      message: "Appointment service deleted successfully",
    });
  } catch (error: any) {
    return res.status(404).json({
      status: "error",
      message: error.message,
    });
  }
}