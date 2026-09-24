import { Request, Response } from "express";

import {
  getProviderSettings,
  updateProviderSettings,
} from "../services/providersetting.service";

export const getProviderSettingsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const labId = req.query.labId as string | undefined;
    const scanCenterId =
      req.query.scanCenterId as string | undefined;

    const settings = await getProviderSettings(
      labId,
      scanCenterId,
    );

    return res.status(200).json({
      status: "success",
      data: settings,
    });
  } catch (error: any) {
    console.error("Get provider settings error:", error);

    return res.status(400).json({
      status: "error",
      message:
        error.message || "Failed to get provider settings",
    });
  }
};

export const updateProviderSettingsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const settings = await updateProviderSettings(req.body);

    return res.status(200).json({
      status: "success",
      message: "Provider settings updated successfully",
      data: settings,
    });
  } catch (error: any) {
    console.error("Update provider settings error:", error);

    return res.status(400).json({
      status: "error",
      message:
        error.message || "Failed to update provider settings",
    });
  }
};