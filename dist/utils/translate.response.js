"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRequestedLanguage = getRequestedLanguage;
exports.translateResponse = translateResponse;
exports.translateInputToEnglish = translateInputToEnglish;
const translate_service_1 = require("../services/translate.service");
const SUPPORTED_LANGUAGES = ["en", "ta", "te", "hi", "ml", "kn"];
const TRANSLATABLE_FIELDS = new Set([
    "name",
    "address",
    "description",
    "preparationInstructions",
    "instructions",
    "reportNotes",
    "fullName",
    "addressLine1",
    "addressLine2",
    "city",
    "state",
    "specialInstructions",
    "patientNotes",
    "gender",
    "category"
]);
function getRequestedLanguage(req) {
    const header = req.headers["accept-language"];
    const requested = (header || "en").split(",")[0]
        .trim()
        .split("-")[0]
        .toLowerCase();
    return SUPPORTED_LANGUAGES.includes(requested) ? requested : "en";
}
async function translateResponse(value, targetLanguage) {
    if (targetLanguage === "en" || value == null) {
        return value;
    }
    if (value instanceof Date) {
        return value;
    }
    if (Array.isArray(value)) {
        return Promise.all(value.map((item) => translateResponse(item, targetLanguage)));
    }
    if (typeof value !== "object") {
        return value;
    }
    // Preserve Prisma Decimal and other custom class instances.
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
        return value;
    }
    const result = { ...value };
    await Promise.all(Object.keys(result).map(async (key) => {
        const fieldValue = result[key];
        if (TRANSLATABLE_FIELDS.has(key) &&
            typeof fieldValue === "string" &&
            fieldValue.trim()) {
            result[key] = await (0, translate_service_1.translateText)(fieldValue, targetLanguage, "en");
        }
        else if (fieldValue !== null &&
            typeof fieldValue === "object") {
            result[key] = await translateResponse(fieldValue, targetLanguage);
        }
    }));
    return result;
}
async function translateInputToEnglish(body, sourceLanguage) {
    if (sourceLanguage === "en") {
        return body;
    }
    const result = {
        ...body,
    };
    await Promise.all(Object.keys(result).map(async (key) => {
        const value = result[key];
        if (TRANSLATABLE_FIELDS.has(key) &&
            typeof value === "string" &&
            value.trim()) {
            result[key] = await (0, translate_service_1.translateText)(value, "en", sourceLanguage);
        }
    }));
    return result;
}
//# sourceMappingURL=translate.response.js.map