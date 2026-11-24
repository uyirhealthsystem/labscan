"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePatient = void 0;
exports.requirePatientId = requirePatientId;
const apiError_1 = require("./apiError");
function requirePatientId(req) {
    const userId = req.header("x-user-id")?.trim();
    const role = req.header("x-user-role")?.trim().toUpperCase();
    if (!userId || !role) {
        throw new apiError_1.apiError(401, "Authentication required");
    }
    if (role !== "PATIENT") {
        throw new apiError_1.apiError(403, "Patient access required");
    }
    return userId;
}
const requirePatient = (req, _res, next) => {
    try {
        requirePatientId(req);
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.requirePatient = requirePatient;
//# sourceMappingURL=requirepatient.js.map