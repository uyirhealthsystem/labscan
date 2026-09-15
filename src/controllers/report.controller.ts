
import { Request, Response } from "express";

import {
  createReport,
  getReports,
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
  getEarningById,
  getEarningByAppointment,
  updateEarning,
  deleteEarning,
} from "../services/report.service";

// =========================================================
// REPORT CONTROLLERS
// =========================================================

export async function createReportController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const report = await createReport(req.body);

    res.status(201).json({
      status: "success",
      data: report,
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

    res.status(200).json({
      status: "success",
      data: reports,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch reports",
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

    res.status(200).json({
      status: "success",
      data: report,
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

    const report =
      await getReportByAppointment(appointmentId);

    res.status(200).json({
      status: "success",
      data: report,
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

    const report = await updateReport(
      reportId,
      req.body,
    );

    res.status(200).json({
      status: "success",
      data: report,
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

    res.status(200).json({
      status: "success",
      data: report,
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
    const reportFile =
      await createReportFile(req.body);

    res.status(201).json({
      status: "success",
      data: reportFile,
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

    res.status(200).json({
      status: "success",
      data: files,
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
    const reportFileId =
      String(req.params.reportFileId);

    const file =
      await getReportFileById(reportFileId);

    res.status(200).json({
      status: "success",
      data: file,
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
    const reportFileId =
      String(req.params.reportFileId);

    const file = await updateReportFile(
      reportFileId,
      req.body,
    );

    res.status(200).json({
      status: "success",
      data: file,
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
    const reportFileId =
      String(req.params.reportFileId);

    const file =
      await deleteReportFile(reportFileId);

    res.status(200).json({
      status: "success",
      data: file,
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

    res.status(201).json({
      status: "success",
      data: earning,
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

    res.status(200).json({
      status: "success",
      data: earnings,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch earnings",
    });
  }
}

export async function getEarningByIdController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const earningId =
      String(req.params.earningId);

    const earning =
      await getEarningById(earningId);

    res.status(200).json({
      status: "success",
      data: earning,
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
    const appointmentId =
      String(req.params.appointmentId);

    const earning =
      await getEarningByAppointment(appointmentId);

    res.status(200).json({
      status: "success",
      data: earning,
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
    const earningId =
      String(req.params.earningId);

    const earning = await updateEarning(
      earningId,
      req.body,
    );

    res.status(200).json({
      status: "success",
      data: earning,
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
    const earningId =
      String(req.params.earningId);

    const earning =
      await deleteEarning(earningId);

    res.status(200).json({
      status: "success",
      data: earning,
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


