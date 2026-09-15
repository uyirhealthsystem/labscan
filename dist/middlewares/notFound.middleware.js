"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = notFoundHandler;
const apiError_1 = require("../utils/apiError");
function notFoundHandler(req, _res, next) {
    next(new apiError_1.apiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}
//# sourceMappingURL=notFound.middleware.js.map