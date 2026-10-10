
import { Request } from "express";
import { translateText } from "../services/translate.service";

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

export function getRequestedLanguage(req: Request): string {
  const header = req.headers["accept-language"];
  const requested = (header || "en").split(",")[0]
    .trim()
    .split("-")[0]
    .toLowerCase();

  return SUPPORTED_LANGUAGES.includes(requested) ? requested : "en";
}


export async function translateResponse<T>(
  value: T,
  targetLanguage: string,
): Promise<T> {
  if (targetLanguage === "en" || value == null) {
    return value;
  }

  if (value instanceof Date) {
    return value;
  }

  if (Array.isArray(value)) {
    return Promise.all(
      value.map((item) => translateResponse(item, targetLanguage)),
    ) as Promise<T>;
  }

  if (typeof value !== "object") {
    return value;
  }

  // Preserve Prisma Decimal and other custom class instances.
  const prototype = Object.getPrototypeOf(value);

  if (prototype !== Object.prototype && prototype !== null) {
    return value;
  }

  const result = { ...(value as Record<string, unknown>) };

  await Promise.all(
    Object.keys(result).map(async (key) => {
      const fieldValue = result[key];

      if (
        TRANSLATABLE_FIELDS.has(key) &&
        typeof fieldValue === "string" &&
        fieldValue.trim()
      ) {
        result[key] = await translateText(
          fieldValue,
          targetLanguage,
          "en",
        );
      } else if (
        fieldValue !== null &&
        typeof fieldValue === "object"
      ) {
        result[key] = await translateResponse(
          fieldValue,
          targetLanguage,
        );
      }
    }),
  );

  return result as T;
}

export async function translateInputToEnglish<T extends Record<string, any>>(
  body: T,
  sourceLanguage: string,
): Promise<T> {
  if (sourceLanguage === "en") {
    return body;
  }

  const result: Record<string, unknown> = {
  ...body,
};

  await Promise.all(
    Object.keys(result).map(async (key) => {
      const value = result[key];

      if (
        TRANSLATABLE_FIELDS.has(key) &&
        typeof value === "string" &&
        value.trim()
      ) {
        result[key] = await translateText(value, "en", sourceLanguage);
      }
    }),
  );

  return result as T;
}