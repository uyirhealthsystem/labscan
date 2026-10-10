
import { Request, Response } from "express";

import {
  createLab,
  deleteLab,
  getLabById,
  getLabs,
  getLabsByDistrict,
  updateLab,
  getLabsByUserId,
  getLabMetricsByDistrict,
} from "../services/lab.service";

import { requireUserId } from "../utils/requireuser";

import {
  getRequestedLanguage,
  translateResponse,
  translateInputToEnglish,
} from "../utils/translate.response";

// CREATE LAB
export async function createLabController(req: Request, res: Response) {
  try {
    const userId = requireUserId(req);
    const language = getRequestedLanguage(req);

    const translatedBody = await translateInputToEnglish(
      req.body,
      language,
    );

    const {
      name,
      registrationNumber,
      phone,
      email,
      address,
      districtId,
      status,
    } = translatedBody;

    if (!name) {
      return res.status(400).json({
        status: "error",
        message: "name is required",
      });
    }

    const lab = await createLab({
      labUserId: userId,
      name,
      registrationNumber,
      phone,
      email,
      address,
      districtId,
      status,
    });

    return res.status(201).json({
      status: "success",
      message: "Lab created successfully",
      data: await translateResponse(lab, language),
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}

// GET ALL LABS
export async function getLabsController(req: Request, res: Response) {
  try {
    const labs = await getLabs();
    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(labs, language),
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}

// GET LABS BY DISTRICT
export async function getLabsByDistrictController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const districtId = req.params.districtId as string;

    if (!districtId) {
      res.status(400).json({
        status: "error",
        message: "districtId is required",
      });
      return;
    }

    const labs = await getLabsByDistrict(districtId);
    const language = getRequestedLanguage(req);

    res.status(200).json({
      status: "success",
      districtId,
      data: await translateResponse(labs, language),
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}

// GET LAB BY ID
export async function getLabByIdController(
  req: Request<{ labId: string }>,
  res: Response,
) {
  try {
    const { labId } = req.params;
    const language = getRequestedLanguage(req);

    const lab = await getLabById(labId);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(lab, language),
    });
  } catch (error: any) {
    return res.status(404).json({
      status: "error",
      message: error.message,
    });
  }
}

// UPDATE LAB
export async function updateLabController(
  req: Request<{ labId: string }>,
  res: Response,
) {
  try {
    const { labId } = req.params;
    const language = getRequestedLanguage(req);

    const translatedBody = await translateInputToEnglish(
      req.body,
      language,
    );

    const lab = await updateLab(labId, translatedBody);

    return res.status(200).json({
      status: "success",
      message: "Lab updated successfully",
      data: await translateResponse(lab, language),
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}

// DELETE LAB
export async function deleteLabController(
  req: Request<{ labId: string }>,
  res: Response,
) {
  try {
    const { labId } = req.params;
    const language = getRequestedLanguage(req);

    const lab = await deleteLab(labId);

    return res.status(200).json({
      status: "success",
      message: "Lab deactivated successfully",
      data: await translateResponse(
        {
          labId: lab.labId,
          name: lab.name,
          status: lab.status,
        },
        language,
      ),
    });
  } catch (error: any) {
    return res.status(404).json({
      status: "error",
      message: error.message,
    });
  }
}

// GET LABS BY USER ID
export async function getLabsByUserIdController(
  req: Request,
  res: Response,
) {
  try {
    const userId = requireUserId(req);
    const language = getRequestedLanguage(req);

    const labs = await getLabsByUserId(userId);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(labs, language),
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}

// GET LAB METRICS BY DISTRICT
export async function getLabMetricsByDistrictController(
  req: Request,
  res: Response,
) {
  try {
    const districtId = req.params.districtId as string;
    const data = await getLabMetricsByDistrict(districtId);

    return res.status(200).json({
      status: "success",
      districtId,
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}