"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
const app = (0, app_1.createApp)();
const server = app.listen(env_1.env.port, () => {
    logger_1.logger.info(`Service listening on port ${env_1.env.port} [${env_1.env.nodeEnv}]`);
});
function shutdown(signal) {
    logger_1.logger.info(`${signal} received, shutting down gracefully`);
    server.close((err) => {
        if (err) {
            logger_1.logger.error(err, 'Error during shutdown');
            process.exit(1);
        }
        process.exit(0);
    });
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
    logger_1.logger.error(reason, 'Unhandled Rejection');
});
process.on('uncaughtException', (err) => {
    logger_1.logger.error(err, 'Uncaught Exception');
    process.exit(1);
});
//# sourceMappingURL=server.js.map