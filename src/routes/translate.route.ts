
import { Router } from "express";
import { translateText } from "../services/translate.service";

const router = Router();

router.get("/translation/test", async (req, res) => {
  try {
    const text = "Your blood test report is ready";
    const language = String(req.query.lang || "ta");

    const translatedText = await translateText(text, language);

    res.json({
      originalText: text,
      language,
      translatedText,
    });
  } catch (error) {
    console.error("Translation test failed:", error);
    res.status(500).json({
      message: "Translation failed",
    });
  }
});

export default router;