"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startHomeCollectionEscalationJob = startHomeCollectionEscalationJob;
exports.stopHomeCollectionEscalationJob = stopHomeCollectionEscalationJob;
const homecollection_service_1 = require("../services/homecollection.service");
const logger_1 = require("../utils/logger");
const ESCALATION_INTERVAL_MS = 60 * 1000;
let isRunning = false;
let interval;
async function runHomeCollectionEscalation() {
    if (isRunning) {
        logger_1.logger.warn("Previous home collection escalation is still running");
        return;
    }
    isRunning = true;
    try {
        const result = await (0, homecollection_service_1.escalateDueHomeCollections)();
        logger_1.logger.info(result, "Home collection escalation check completed");
    }
    catch (error) {
        logger_1.logger.error({ err: error }, "Home collection escalation job failed");
    }
    finally {
        isRunning = false;
    }
}
function startHomeCollectionEscalationJob() {
    if (interval) {
        logger_1.logger.warn("Home collection escalation job is already running");
        return stopHomeCollectionEscalationJob;
    }
    logger_1.logger.info("Starting home collection escalation job");
    void runHomeCollectionEscalation();
    interval = setInterval(() => {
        void runHomeCollectionEscalation();
    }, ESCALATION_INTERVAL_MS);
    return stopHomeCollectionEscalationJob;
}
function stopHomeCollectionEscalationJob() {
    if (interval) {
        clearInterval(interval);
        interval = undefined;
        logger_1.logger.info("Home collection escalation job stopped");
    }
}
//# sourceMappingURL=homecollectionEscalation.job.js.map