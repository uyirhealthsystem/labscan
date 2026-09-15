"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.env = {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: Number(process.env.PORT ?? 8082),
    logLevel: process.env.LOG_LEVEL ?? "info",
    kafka: {
        brokers: (process.env.KAFKA_BROKERS ?? "localhost:9092").split(","),
        clientId: process.env.KAFKA_CLIENT_ID ?? "labscan-service",
        groupId: process.env.KAFKA_GROUP_ID ?? "labscan-service-group",
    },
};
//# sourceMappingURL=env.js.map