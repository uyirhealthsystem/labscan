"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiError = void 0;
class apiError extends Error {
    statusCode;
    isOperational;
    constructor(statusCode, message, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, apiError.prototype);
    }
}
exports.apiError = apiError;
//# sourceMappingURL=apiError.js.map