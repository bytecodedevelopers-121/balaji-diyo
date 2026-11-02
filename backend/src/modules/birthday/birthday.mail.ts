import type { EmailContent } from '../booking/booking.mail';

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Plain birthday greeting (client choice: no offer/discount). */
export function birthdayGreetingEmail(fullName: string, unsubscribeUrl: string): EmailContent {
  const firstName = escapeHtml(fullName.trim().split(/\s+/)[0] || 'friend');
  const html = `
    <body style="font-family: Verdana, sans-serif; font-size:12pt; color:#222;">
      <h2 style="color:#44546a;">Happy Birthday, ${firstName}! 🎉</h2>
      <p>
        Everyone at Boundless Adventure is wishing you a wonderful birthday
        and a year full of great adventures.
      </p>
      <p>Warm regards,<br/>The Boundless Adventure Team</p>
      <hr/>
      <p style="font-size:9pt; color:#777;">
        Don't want birthday greetings? <a href="${unsubscribeUrl}">Unsubscribe</a>.
      </p>
    </body>`;
  return { subject: `Happy Birthday, ${firstName}!`, html };
}
