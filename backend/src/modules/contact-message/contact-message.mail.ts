import type { ContactMessage } from '@prisma/client';

export interface EmailContent {
  subject: string;
  html: string;
}

/**
 * Internal ops alert for a new enquiry — direct client request
 * 2026-09-07 ("for enquiry form it should send email on these two
 * email"). No such notification existed before this: a submission used
 * to only ever land in the DB, visible next time someone opened the
 * admin Contacts inbox — see `mailConfig.enquiryAdminEmails`'s own
 * comment for exactly which real-site forms this covers (every one of
 * them, since they all post to this same backend module).
 *
 * Plain inline styling, no branding chrome — same "internal, not
 * customer-facing" treatment as `booking.mail.ts`'s own
 * `bookingAdminAlertEmail`, not a customer-facing template mirrored from
 * a legacy source (there's no legacy equivalent to mirror here at all).
 *
 * IP Address/Country/Country Code lines are a follow-up to the original
 * request, same day — `country`/`countryCode` are resolved server-side
 * from `ipAddress` via `lib/ip-geolocation.ts` at submission time (see
 * `ContactMessage`'s own schema comment), so all three are omitted
 * together whenever the lookup didn't resolve (private/local IP in dev,
 * lookup service down) rather than shown as blank/misleading fields.
 */
export function enquiryAdminAlertEmail(message: ContactMessage): EmailContent {
  const html = `
    <body style="font-family: Verdana, sans-serif; font-size:12pt;">
      <br/>
      <h2 style="color:#44546a; font-size:12pt;">NEW ENQUIRY</h2>
      <hr/>
      <p>
        <strong>Type:</strong> ${message.type}<br/>
        <strong>Name:</strong> ${message.name}<br/>
        <strong>Email:</strong> ${message.email}<br/>
        <strong>Phone:</strong> ${message.phone ?? ''}<br/>
        ${message.packageId ? `<strong>Package Id:</strong> ${message.packageId}<br/>` : ''}
        ${message.numberOfTraveller != null ? `<strong>Number of Traveller:</strong> ${message.numberOfTraveller}<br/>` : ''}
        <strong>Page:</strong> ${message.url}<br/>
        ${message.ipAddress ? `<strong>IP Address:</strong> ${message.ipAddress}<br/>` : ''}
        ${message.country ? `<strong>Country:</strong> ${message.country}<br/>` : ''}
        ${message.countryCode ? `<strong>Country Code:</strong> ${message.countryCode}<br/>` : ''}
      </p>
      <h2 style="color:#44546a; font-size:12pt;">Message</h2>
      <hr/>
      <p>${message.message}</p>
      <p>Please respond to this enquiry.</p>
    </body>
  `;

  return { subject: `New Enquiry — ${message.name}`, html };
}
