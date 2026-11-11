
import { escalateDueHomeCollections } from "../services/homecollection.service";
import { logger } from "../utils/logger";

const ESCALATION_INTERVAL_MS = 60 * 1000;

let isRunning = false;
let interval: ReturnType<typeof setInterval> | undefined;

async function runHomeCollectionEscalation(): Promise<void> {
  if (isRunning) {
    logger.warn("Previous home collection escalation is still running");
    return;
  }

  isRunning = true;

  try {
    const result = await escalateDueHomeCollections();

    logger.info(
      result,
      "Home collection escalation check completed",
    );
  } catch (error) {
    logger.error(
      { err: error },
      "Home collection escalation job failed",
    );
  } finally {
    isRunning = false;
  }
}

export function startHomeCollectionEscalationJob(): () => void {
  if (interval) {
    logger.warn("Home collection escalation job is already running");
    return stopHomeCollectionEscalationJob;
  }

  logger.info("Starting home collection escalation job");

  void runHomeCollectionEscalation();

  interval = setInterval(() => {
    void runHomeCollectionEscalation();
  }, ESCALATION_INTERVAL_MS);

  return stopHomeCollectionEscalationJob;
}

export function stopHomeCollectionEscalationJob(): void {
  if (interval) {
    clearInterval(interval);
    interval = undefined;
    logger.info("Home collection escalation job stopped");
  }
}

