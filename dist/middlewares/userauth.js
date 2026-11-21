"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userAuth = userAuth;
const apiError_1 = require("../utils/apiError");
function userAuth(req, res, next) {
    try {
        const userId = req.header("x-user-id")?.trim();
        const role = req.header("x-user-role")?.trim().toUpperCase();
        if (!userId || !role) {
            throw new apiError_1.apiError(401, "Authentication required: user identity and role are missing");
        }
        req.user = {
            userId,
            role,
        };
        next();
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=userauth.js.map