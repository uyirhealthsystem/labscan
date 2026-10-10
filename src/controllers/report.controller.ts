
import { Request, Response } from "express";

import {
  createReport,
  getReports,
  uploadReport,
  getReportById,
  getReportByAppointment,
  updateReport,
  deleteReport,

  createReportFile,
  getReportFiles,
  getReportFileById,
  updateReportFile,
  deleteReportFile,

  createEarning,
  getEarnings,
  getEarningsSummary,
  getEarningById,
  getEarningByAppointment,
  updateEarning,
  deleteEarning,
} from "../services/report.service";

import {
  getRequestedLanguage,
  translateResponse,
} from "../utils/translate.response";

// =========================================================
// REPORT CONTROLLERS
// =========================================================

export async function createReportController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const report = await createReport(req.body);
    const language = getRequestedLanguage(req);

    res.status(201).json({
      status: "success",
      data: await translateResponse(report, language),
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to create report",
    });
  }
}

export async function getReportsController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const reports = await getReports();
    const language = getRequestedLanguage(req);

    res.status(200).json({
      status: "success",
      data: await translateResponse(reports, language),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch reports",
    });
  }
}

export async function uploadReportController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const appointmentId = String(req.params.appointmentId);
    const file = req.file;

    if (!appointmentId || appointmentId === "undefined") {
      res.status(400).json({
        status: "error",
        message: "Appointment ID is required in the URL",
      });
      return;
    }

    if (!file) {
      res.status(400).json({
        status: "error",
        message: "Report file is required",
      });
      return;
    }

    const result = await uploadReport(appointmentId, {
      originalname: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
    });

    const language = getRequestedLanguage(req);

    res.status(200).json({
      status: "success",
      message: "Report uploaded successfully",
      data: await translateResponse(result, language),
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to upload report",
    });
  }
}

export async function getReportByIdController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const reportId = String(req.params.reportId);
    const report = await getReportById(reportId);
    const language = getRequestedLanguage(req);

    res.status(200).json({
      status: "success",
      data: await translateResponse(report, language),
    });
  } catch (error) {
    res.status(404).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Report not found",
    });
  }
}

export async function getReportByAppointmentController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const appointmentId = String(req.params.appointmentId);

    const report = await getReportByAppointment(appointmentId);
    const language = getRequestedLanguage(req);

    res.status(200).json({
      status: "success",
      data: await translateResponse(report, language),
    });
  } catch (error) {
    res.status(404).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Report not found",
    });
  }
}

export async function updateReportController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const reportId = String(req.params.reportId);

    const report = await updateReport(reportId, req.body);
    const language = getRequestedLanguage(req);

    res.status(200).json({
      status: "success",
      data: await translateResponse(report, language),
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to update report",
    });
  }
}

export async function deleteReportController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const reportId = String(req.params.reportId);
    const report = await deleteReport(reportId);
    const language = getRequestedLanguage(req);

    res.status(200).json({
      status: "success",
      data: await translateResponse(report, language),
    });
  } catch (error) {
    res.status(404).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Report not found",
    });
  }
}

// =========================================================
// REPORT FILE CONTROLLERS
// =========================================================

export async function createReportFileController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const reportFile = await createReportFile(req.body);
    const language = getRequestedLanguage(req);

    res.status(201).json({
      status: "success",
      data: await translateResponse(reportFile, language),
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to create report file",
    });
  }
}

export async function getReportFilesController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const reportId = String(req.params.reportId);
    const files = await getReportFiles(reportId);
    const language = getRequestedLanguage(req);

    res.status(200).json({
      status: "success",
      data: await translateResponse(files, language),
    });
  } catch (error) {
    res.status(404).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch report files",
    });
  }
}

export async function getReportFileByIdController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const reportFileId = String(req.params.reportFileId);

    const file = await getReportFileById(reportFileId);
    const language = getRequestedLanguage(req);

    res.status(200).json({
      status: "success",
      data: await translateResponse(file, language),
    });
  } catch (error) {
    res.status(404).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Report file not found",
    });
  }
}

export async function updateReportFileController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const reportFileId = String(req.params.reportFileId);

    const file = await updateReportFile(reportFileId, req.body);
    const language = getRequestedLanguage(req);

    res.status(200).json({
      status: "success",
      data: await translateResponse(file, language),
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to update report file",
    });
  }
}

export async function deleteReportFileController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const reportFileId = String(req.params.reportFileId);

    const file = await deleteReportFile(reportFileId);
    const language = getRequestedLanguage(req);

    res.status(200).json({
      status: "success",
      data: await translateResponse(file, language),
    });
  } catch (error) {
    res.status(404).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Report file not found",
    });
  }
}

// =========================================================
// EARNING CONTROLLERS
// =========================================================

export async function createEarningController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const earning = await createEarning(req.body);
    const language = getRequestedLanguage(req);

    res.status(201).json({
      status: "success",
      data: await translateResponse(earning, language),
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to create earning",
    });
  }
}

export async function getEarningsController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const earnings = await getEarnings();
    const language = getRequestedLanguage(req);

    res.status(200).json({
      status: "success",
      data: await translateResponse(earnings, language),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch earnings",
    });
  }
}

export const getEarningsSummaryController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const summary = await getEarningsSummary();
    const language = getRequestedLanguage(req);

    res.status(200).json({
      status: "success",
      data: await translateResponse(summary, language),
    });
  } catch (error) {
    console.error("Get earnings summary error:", error);

    res.status(500).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to get earnings summary",
    });
  }
};

export async function getEarningByIdController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const earningId = String(req.params.earningId);

    const earning = await getEarningById(earningId);
    const language = getRequestedLanguage(req);

    res.status(200).json({
      status: "success",
      data: await translateResponse(earning, language),
    });
  } catch (error) {
    res.status(404).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Earning not found",
    });
  }
}

export async function getEarningByAppointmentController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const appointmentId = String(req.params.appointmentId);

    const earning = await getEarningByAppointment(appointmentId);
    const language = getRequestedLanguage(req);

    res.status(200).json({
      status: "success",
      data: await translateResponse(earning, language),
    });
  } catch (error) {
    res.status(404).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Earning not found",
    });
  }
}

export async function updateEarningController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const earningId = String(req.params.earningId);

    const earning = await updateEarning(earningId, req.body);
    const language = getRequestedLanguage(req);

    res.status(200).json({
      status: "success",
      data: await translateResponse(earning, language),
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to update earning",
    });
  }
}

export async function deleteEarningController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const earningId = String(req.params.earningId);

    const earning = await deleteEarning(earningId);
    const language = getRequestedLanguage(req);

    res.status(200).json({
      status: "success",
      data: await translateResponse(earning, language),
    });
  } catch (error) {
    res.status(404).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Earning not found",
    });
  }
}

