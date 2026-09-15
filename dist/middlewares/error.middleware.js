"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const apiError_1 = require("../utils/apiError");
const logger_1 = require("../utils/logger");
function errorHandler(err, _req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_next) {
    const statusCode = err instanceof apiError_1.apiError ? err.statusCode : 500;
    const message = err instanceof apiError_1.apiError ? err.message : 'Internal Server Error';
    if (statusCode >= 500) {
        logger_1.logger.error({ err }, message);
    }
    else {
        logger_1.logger.warn({ err }, message);
    }
    res.status(statusCode).json({
        status: 'error',
        statusCode,
        message,
    });
}
//# sourceMappingURL=error.middleware.js.map