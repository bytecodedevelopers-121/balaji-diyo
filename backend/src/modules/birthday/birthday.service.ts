import { createHmac, timingSafeEqual } from 'crypto';
import prisma from '../../config/prisma';
import env from '../../config/env';
import { sendMail } from '../../lib/mail';
import { isMailConfigured } from '../../config/mail';
import { birthdayGreetingEmail } from './birthday.mail';

const TIMEZONE = 'Asia/Kathmandu';

interface Recipient {
  email: string;
  fullName: string;
}

/** Month/day/year of "today" in Nepal time, regardless of server timezone. */
function todayInNepal(): { month: number; day: number; year: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { month: get('month'), day: get('day'), year: get('year') };
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function unsubscribeToken(email: string): string {
  return createHmac('sha256', env.JWT_SECRET).update(`birthday-unsub:${email.toLowerCase()}`).digest('hex');
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = Buffer.from(unsubscribeToken(email));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

function unsubscribeUrl(email: string): string {
  const base = (process.env.API_PUBLIC_URL || `http://localhost:${env.PORT}`).replace(/\/$/, '');
  return `${base}/api/birthday/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubscribeToken(email)}`;
}

/** Lead bookers (Booking.dateOfBirth/email) whose birthday is today, one per
 *  email (latest booking's name wins), minus opt-outs and anyone already
 *  greeted this year. Feb 29 birthdays are celebrated on Feb 28 in non-leap years. */
async function findRecipients(month: number, day: number, year: number): Promise<Recipient[]> {
  const feb28Fallback = month === 2 && day === 28 && !isLeapYear(year);
  return prisma.$queryRaw<Recipient[]>`
    SELECT DISTINCT ON (LOWER(b."email")) LOWER(b."email") AS "email", b."fullName" AS "fullName"
    FROM "bookings" b
    WHERE b."dateOfBirth" IS NOT NULL
      AND (
        (EXTRACT(MONTH FROM b."dateOfBirth") = ${month} AND EXTRACT(DAY FROM b."dateOfBirth") = ${day})
        OR (${feb28Fallback} AND EXTRACT(MONTH FROM b."dateOfBirth") = 2 AND EXTRACT(DAY FROM b."dateOfBirth") = 29)
      )
      AND NOT EXISTS (SELECT 1 FROM "birthday_optouts" o WHERE o."email" = LOWER(b."email"))
      AND NOT EXISTS (
        SELECT 1 FROM "birthday_greetings_sent" s WHERE s."email" = LOWER(b."email") AND s."year" = ${year}
      )
    ORDER BY LOWER(b."email"), b."createdAt" DESC`;
}

/** Sends today's birthday greetings. Safe to run repeatedly. Never throws. */
export async function sendTodaysBirthdayGreetings(): Promise<number> {
  if (!isMailConfigured) {
    console.error('birthday: SMTP not configured, skipping');
    return 0;
  }
  try {
    const { month, day, year } = todayInNepal();
    const recipients = await findRecipients(month, day, year);
    let sent = 0;
    for (const { email, fullName } of recipients) {
      // Claim the (email, year) slot first so a concurrent run can't double-send.
      try {
        await prisma.birthdayGreetingSent.create({ data: { email, year } });
      } catch {
        continue;
      }
      try {
        await sendMail({ to: email, ...birthdayGreetingEmail(fullName, unsubscribeUrl(email)) });
        sent++;
      } catch (err) {
        console.error('birthday: send failed', { email, err });
        await prisma.birthdayGreetingSent.deleteMany({ where: { email, year } });
      }
    }
    console.error(`birthday: ${sent}/${recipients.length} greetings sent`);
    return sent;
  } catch (err) {
    console.error('birthday: job failed', err);
    return 0;
  }
}

export async function optOut(email: string): Promise<void> {
  const normalized = email.toLowerCase();
  await prisma.birthdayOptOut.upsert({ where: { email: normalized }, update: {}, create: { email: normalized } });
}
