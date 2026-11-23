import cron from 'node-cron';
import type { B2BInventoryService } from './b2b-inventory.service';

/**
 * Sweeps lapsed holds every minute (plus once at startup for holds that
 * expired while the server was down). Safe with multiple instances / overlapping
 * runs: expiry is a compare-and-set under the departure row lock.
 */
export function startHoldExpiryScheduler(service: B2BInventoryService, onError: (err: unknown) => void): void {
  let running = false;
  const run = async () => {
    if (running) return; // don't stack sweeps in one process
    running = true;
    try {
      await service.sweepExpiredHolds();
    } catch (err) {
      onError(err);
    } finally {
      running = false;
    }
  };
  cron.schedule('* * * * *', () => void run());
  void run();
}
