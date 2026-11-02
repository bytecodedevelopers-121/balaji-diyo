// SMTP config for booking-notification emails — same "optional, degrades
// cleanly" shape already established twice in this codebase (see
// config/paco.ts, config/googleAnalytics.ts): without credentials, the
// mail module logs and skips instead of crashing anything that triggers
// it. No live SMTP account exists yet — see lib/mail.ts's own comment on
// the Ethereal dev/test account standing in until real ones arrive.
export interface MailConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
  /** Who receives the "new booking" alert — separate from send-capability itself, since a missing admin address should only skip *that* email, not the customer's. */
  adminEmail: string;
  /** Who receives the "new enquiry" alert (contact-message module — every
   *  form on the site that's ever called "the enquiry form" in code
   *  comments funnels into this one backend module: the main Contact
   *  page, a package's "Enquire Now" modal, blog/trekking-route "Ask a
   *  Question"). Direct client request 2026-09-07: both
   *  `info@boundlessadventure.com` and `boundlesstrek@gmail.com`, comma-
   *  separated — Nodemailer's own `to` field accepts that natively, no
   *  code change needed to send to more than one address. Own env var
   *  rather than reusing `adminEmail` above: the client asked for two
   *  specific addresses here, and a booking alert going to two inboxes
   *  wasn't part of this request. */
  enquiryAdminEmails: string;
}

export const mailConfig: MailConfig = {
  host: process.env.SMTP_HOST ?? '',
  port: Number(process.env.SMTP_PORT) || 587,
  user: process.env.SMTP_USER ?? '',
  password: process.env.SMTP_PASSWORD ?? '',
  fromEmail: process.env.SMTP_FROM_EMAIL || 'no-reply@boundlessadventure.com',
  fromName: process.env.SMTP_FROM_NAME || 'Boundless Adventure',
  adminEmail: process.env.BOOKING_ADMIN_EMAIL ?? '',
  enquiryAdminEmails: process.env.ENQUIRY_ADMIN_EMAILS || 'info@boundlessadventure.com,boundlesstrek@gmail.com',
};

export const isMailConfigured = Boolean(mailConfig.host && mailConfig.user && mailConfig.password);
