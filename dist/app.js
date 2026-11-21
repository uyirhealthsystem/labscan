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
const path_1 = __importDefault(require("path"));
const userauth_1 = require("./middlewares/userauth");
function createApp() {
    const app = (0, express_1.default)();
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use((0, pino_http_1.default)({ logger: logger_1.logger }));
    // Liveness check for PM2 / load balancers / k8s probes.
    app.get('/health', (_req, res) => {
        res.status(200).json({ status: 'ok' });
    });
    app.use("/uploads", express_1.default.static(path_1.default.join(process.cwd(), "uploads")));
    // Namespaced so the api-gateway can route every labscan path by one prefix.
    app.use('/api/v1/labscan', userauth_1.userAuth, routes_1.default);
    app.use(notFound_middleware_1.notFoundHandler);
    app.use(error_middleware_1.errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map