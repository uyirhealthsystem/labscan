"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const pino_http_1 = __importDefault(require("pino-http"));
const error_middleware_1 = require("./middlewares/error.middleware");
const notFound_middleware_1 = require("./middlewares/notFound.middleware");
const routes_1 = __importDefault(require("./routes"));
const logger_1 = require("./utils/logger");
function createApp() {
    const app = (0, express_1.default)();
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use((0, pino_http_1.default)({ logger: logger_1.logger }));
    app.use('/api/v1', routes_1.default);
    app.use(notFound_middleware_1.notFoundHandler);
    app.use(error_middleware_1.errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map