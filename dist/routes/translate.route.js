"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const translate_service_1 = require("../services/translate.service");
const router = (0, express_1.Router)();
router.get("/translation/test", async (req, res) => {
    try {
        const text = "Your blood test report is ready";
        const language = String(req.query.lang || "ta");
        const translatedText = await (0, translate_service_1.translateText)(text, language);
        res.json({
            originalText: text,
            language,
            translatedText,
        });
    }
    catch (error) {
        console.error("Translation test failed:", error);
        res.status(500).json({
            message: "Translation failed",
        });
    }
});
exports.default = router;
//# sourceMappingURL=translate.route.js.map