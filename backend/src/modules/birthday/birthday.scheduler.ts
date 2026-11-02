import cron from 'node-cron';
import { sendTodaysBirthdayGreetings } from './birthday.service';

/** 07:00 Nepal time daily, plus one catch-up run at startup in case the
 *  server was down at 07:00 (the (email, year) unique key prevents repeats). */
export function startBirthdayScheduler(): void {
  cron.schedule('0 7 * * *', () => void sendTodaysBirthdayGreetings(), { timezone: 'Asia/Kathmandu' });
  void sendTodaysBirthdayGreetings();
}
