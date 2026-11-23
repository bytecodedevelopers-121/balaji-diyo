import cron from 'node-cron';
import type { B2BSlaService } from './b2b-sla.service';

/** Every minute (plus once at startup for tickets that came due while the server was down). */
export function startSlaScheduler(service: B2BSlaService, onError: (err: unknown) => void): void {
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try { await service.sweep(); } catch (err) { onError(err); } finally { running = false; }
  };
  cron.schedule('* * * * *', () => void run());
  void run();
}
