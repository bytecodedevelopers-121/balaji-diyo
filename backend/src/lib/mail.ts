import nodemailer, { type Transporter } from 'nodemailer';
import { mailConfig, isMailConfigured } from '../config/mail';

export interface SendMailParams {
  to: string;
  subject: string;
  html: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: mailConfig.host,
      port: mailConfig.port,
      secure: mailConfig.port === 465,
      auth: { user: mailConfig.user, pass: mailConfig.password },
    });
  }
  return transporter;
}

/**
 * Sends one email via SMTP — fire-and-forget by design, same shape as
 * `revalidateFrontendTags` (this backend's other "best-effort side effect
 * that must never fail the mutation that triggered it" integration):
 * never throws, only logs. No-ops (with a log line) when SMTP isn't
 * configured — same "optional integration" pattern as PACO/GA4.
 *
 * No real SMTP account exists yet — `backend/.env` currently holds a free
 * Ethereal (nodemailer's own fake-SMTP dev/test service) account so this
 * is actually testable today; swap in real credentials later as a pure
 * env-var change, no code change needed.
 */
export async function sendMail({ to, subject, html }: SendMailParams): Promise<void> {
  if (!isMailConfigured) {
    console.error('sendMail: SMTP not configured, skipping', { to, subject });
    return;
  }

  try {
    const info = await getTransporter().sendMail({
      from: `"${mailConfig.fromName}" <${mailConfig.fromEmail}>`,
      to,
      subject,
      html,
    });
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      // Only Ethereal test accounts return a preview URL — real SMTP
      // providers don't, so this line is silent in production.
      console.error('sendMail: preview URL (Ethereal test account)', { to, subject, previewUrl });
    }
  } catch (err) {
    console.error('sendMail: send failed', { to, subject, err });
  }
}
