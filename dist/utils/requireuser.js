"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireUserId = requireUserId;
const apiError_1 = require("./apiError");
function requireUserId(req) {
    const userId = req.header("x-user-id");
    if (!userId) {
        throw new apiError_1.apiError(401, "Unauthenticated (missing x-user-id)");
    }
    return userId;
}
//# sourceMappingURL=requireuser.js.map