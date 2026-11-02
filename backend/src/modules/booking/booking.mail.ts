import type { BookingRepository } from './booking.repository';

type BookingWithRelations = Awaited<ReturnType<BookingRepository['create']>>;

export interface EmailContent {
  subject: string;
  html: string;
}

/** `j F, Y` (legacy's own Laravel date format) — e.g. "24 August, 2026". */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function packageTitle(booking: BookingWithRelations): string {
  return booking.package?.title ?? 'Custom Booking';
}

/** Customer-facing "BA-<package title>-<number>" reference (2026-09-07
 *  direct client request, package title added 2026-09-07 follow-up) —
 *  see `Booking.bookingNumber`'s own schema comment for why the number
 *  itself, not this formatted string, is what's actually stored. The
 *  title is read live off the `package` relation each time this runs,
 *  not snapshotted, so a later package rename is reflected automatically
 *  instead of leaving old bookings' codes stale. */
function bookingCode(booking: BookingWithRelations): string {
  return `BA-${packageTitle(booking)}-${booking.bookingNumber}`;
}

/**
 * The admin booking alert now sends the exact same email as the customer's
 * confirmation (client request 2026-10-27: "admin mail and user mail should
 * be same") — it replaces the legacy `emails/admin/packagebooking` layout
 * (trip/contact detail dump) that used to live here.
 */
export function bookingAdminAlertEmail(booking: BookingWithRelations): EmailContent {
  return bookingConfirmationEmail(booking);
}

/**
 * Mirrors `flamingo-base/resources/views/emails/front/packagebooking.blade.php`
 * verbatim (plus one addition — see below). Legacy wrote this one but
 * never actually sent it (commented out in `PackageBookingController`) —
 * activated here since the new checkout page (`CheckoutView.tsx`)
 * already promises the customer a confirmation email.
 *
 * The booking-code line is new, not from the legacy template — direct
 * client request 2026-09-07 (no such code existed anywhere before,
 * legacy included; see `Booking.bookingNumber`'s own schema comment).
 */
export function bookingConfirmationEmail(booking: BookingWithRelations): EmailContent {
  const html = `
    <body style="font-family: Verdana, sans-serif; font-size:12pt">
      <p>Hello ${booking.fullName}<p>
      <p>Thank you for booking ${packageTitle(booking)} from ${formatDate(booking.startDate)} to ${formatDate(booking.endDate)}.</p>
      <p>Your booking code is <strong>${bookingCode(booking)}</strong> — please quote it in any correspondence with us about this booking.</p>
      <p>We will reach out to you as soon as possible.</p>
      <p>Please contact us if you have any queries regarding the booking.</p>
      <p>Note: If you find our email in the junk folder, please add it to your whitelist.</p>
      <p>Thank you again for choosing your trip with us.</p>
      <br/>
      <p>Best Regards</p>
      <p><strong>Boundless Adventure Pvt. Ltd.</strong></p>
      <br/>
    </body>
  `;

  return { subject: `Booking Received — ${packageTitle(booking)}`, html };
}
