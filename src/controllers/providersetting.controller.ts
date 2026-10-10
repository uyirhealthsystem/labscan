
import { Request, Response } from "express";

import {
  getProviderSettings,
  updateProviderSettings,
} from "../services/providersetting.service";

import {
  getRequestedLanguage,
  translateResponse,
} from "../utils/translate.response";

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

    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(settings, language),
    });
  } catch (error: unknown) {
    console.error("Get provider settings error:", error);

    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to get provider settings",
    });
  }
};

export const updateProviderSettingsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const settings = await updateProviderSettings(req.body);

    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      message: "Provider settings updated successfully",
      data: await translateResponse(settings, language),
    });
  } catch (error: unknown) {
    console.error("Update provider settings error:", error);

    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to update provider settings",
    });
  }
};

