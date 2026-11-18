/** Kinds of inquiry the website sends to the contact-messages endpoint, grouped for the admin sidebar. */
export interface InquiryTypeDef {
  /** URL segment: /inquiries/:slug */
  slug: string;
  label: string;
  /** Values of the message `type` field that belong to this group. */
  types: string[];
}

export const INQUIRY_TYPES: InquiryTypeDef[] = [
  { slug: "contact-us", label: "Contact Us", types: ["general"] },
  { slug: "affiliate", label: "Affiliate", types: ["affiliate"] },
  { slug: "feedback", label: "Feedback", types: ["feedback"] },
  { slug: "trip-planning", label: "Trip Planning", types: ["plan-your-trip", "plan-with-us", "customize-trip"] },
  { slug: "trip-enquiry", label: "Trip Enquiry", types: ["trip-enquiry"] },
  { slug: "partnership", label: "Partnership", types: ["partner-brand", "partner-creator", "partner-agency"] },
];

export const getInquiryType = (slug?: string) => INQUIRY_TYPES.find((t) => t.slug === slug);
