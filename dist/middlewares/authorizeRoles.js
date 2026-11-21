"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = authorizeRoles;
const apiError_1 = require("../utils/apiError");
function authorizeRoles(...allowedRoles) {
    const normalizedRoles = allowedRoles.map((role) => role.trim().toUpperCase());
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw new apiError_1.apiError(401, "Authentication required");
            }
            if (!normalizedRoles.includes(req.user.role)) {
                throw new apiError_1.apiError(403, "You do not have permission to access this resource");
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
//# sourceMappingURL=authorizeRoles.js.map