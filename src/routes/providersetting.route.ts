import { Router } from "express";

import {
  getProviderSettingsController,
  updateProviderSettingsController,
} from "../controllers/providersetting.controller";

const router = Router();

router.get(
  "/provider/settings",
  getProviderSettingsController,
);

router.patch(
  "/provider/settings",
  updateProviderSettingsController,
);

export default router;