/**
 * Enquiry submission payload — maps to the backend's Contact Message
 * module (backend/src/modules/contact-message), mounted at
 * `POST /contacts`.
 *
 * PROVISIONAL — see features/trips/types/trip.types.ts for the same caveat.
 */
export interface EnquiryPayload {
  name: string;
  email: string;
  type: string;
  message: string;
  phone?: string;
  packageId?: string;
  numberOfTraveller?: number;
  /** Cloudflare Turnstile token from the form's Captcha widget — verified by the backend's `verifyCaptcha` guard, a no-op there until TURNSTILE_SECRET_KEY is set. */
  captchaToken?: string;
}
