import type { PaymentRepository } from './payment.repository';

type PaymentWithRelations = Awaited<ReturnType<PaymentRepository['create']>>;

export interface EmailContent {
  subject: string;
  html: string;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** "USD 208" for legacy/USD rows; "USD 208 (NPR 31,764 charged at 152.66)" once NPR-charged. */
function amountLabel(payment: PaymentWithRelations): string {
  const usd = `USD ${payment.totalAmount}`;
  if (payment.currency === 'USD' || payment.chargedAmount == null) return usd;
  const npr = Number(payment.chargedAmount).toLocaleString('en-US');
  return `${usd} (${payment.currency} ${npr} charged at ${payment.exchangeRate})`;
}

function packageTitle(payment: PaymentWithRelations): string {
  return payment.package?.title ?? payment.customTitle ?? 'Custom Package';
}

/**
 * Sent right after a standalone payment (`/online-payment`, no Booking
 * behind it) is handed off to PACO's hosted page — the counterpart of the
 * booking confirmation email that `/book-now` sends at the same point.
 * New, not from a legacy template (legacy's `/payment` page sent nothing
 * until PACO's webhook reported `APPROVED`). Deliberately worded as
 * "request received", not "payment received": the money hasn't moved yet,
 * and the real payment-success email below still follows the webhook.
 */
export function paymentRequestCustomerEmail(payment: PaymentWithRelations): EmailContent {
  const title = escapeHtml(packageTitle(payment));
  const html = `
    <body style="font-family: Verdana, sans-serif; font-size:12pt">
      <p>Hello ${escapeHtml(payment.customerName ?? '')},</p>
      <p>Thank you for choosing to pay <strong>${amountLabel(payment)}</strong> for <strong>${title}</strong>. We have received your payment request and sent you to our secure payment page to complete it.</p>
      <p>Your payment reference is <strong>${payment.gatewayReference ?? ''}</strong> — please quote it in any correspondence with us about this payment.</p>
      <p>Once your payment is confirmed you will receive a separate payment confirmation email. If you were not able to finish paying, you can simply try again from our website.</p>
      <p>Please contact us via info@boundlessadventure.com if you have any queries.</p>
      <p>Note: If you find our email in the junk folder, please add it to your whitelist.</p>
      <br/>
      <p>Best Regards</p>
      <p><strong>Boundless Adventure Pvt. Ltd.</strong></p>
      <br/>
    </body>
  `;

  return { subject: `Payment Request Received — ${packageTitle(payment)}`, html };
}

/**
 * Mirrors `flamingo-base/resources/views/emails/front/paymentsuccesscustomer.blade.php`
 * verbatim. Legacy's own `PaymentController::checkHblPayment` sent this
 * live once a payment resolved `APPROVED`.
 */
export function paymentSuccessCustomerEmail(payment: PaymentWithRelations): EmailContent {
  const html = `
    <body style="font-family: Verdana, sans-serif; font-size:12pt">
      <p>
        Dear ${payment.customerName},
        <br/><br/>
        We have successfully received <strong>${amountLabel(payment)}</strong> as down payment of <strong>${packageTitle(payment)}</strong> package.
        <br/><br/>
        This email is an automated notification, which is unable to receive replies.
        <br/><br/>
        We are happy to help you with any questions or concerns you may have. Please contact us directly via info@boundlessadventure.com
        <br/><br/>
        Thank you for choosing us.
        <br/><br/>
        Best Regards
        <br/>
        Boundless Adventure Pvt Ltd
      </p>
    </body>
  `;

  return { subject: `Payment Successful — ${packageTitle(payment)}`, html };
}

/**
 * Mirrors `flamingo-base/resources/views/emails/admin/paymentsuccessadmin.blade.php`
 * verbatim. Legacy sent this alongside the customer one, same trigger.
 */
export function paymentSuccessAdminEmail(payment: PaymentWithRelations): EmailContent {
  const html = `
    <body style="font-family: Verdana, sans-serif; font-size:10.5pt">
      <p>
        Dear Admin,
        <br/><br/>
        <strong>${payment.customerName}</strong> has successfully paid <strong>${amountLabel(payment)}</strong> for package: ${packageTitle(payment)} .
        <br/><br/>
        <strong>Transaction Invoice Number:</strong> ${payment.gatewayReference ?? ''}
        <br/><br/>
        <strong>Email of Client:</strong> ${payment.customerEmail ?? 'not provided'}
        <br/><br/>
        Please check payment status and confirm immediately.
        <br/><br/>
        <strong>Best Regards</strong>
        <br/>
        Boundless Adventure Pvt Ltd
      </p>
    </body>
  `;

  return { subject: `Payment Received — ${packageTitle(payment)}`, html };
}
