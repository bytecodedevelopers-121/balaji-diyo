export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  type: string;
  url: string;
  phone: string | null;
  message: string;
  packageId: string | null;
  numberOfTraveller: number | null;
  ipAddress: string | null;
  /** Resolved server-side from `ipAddress` at submission time — see the
   *  backend's `ContactMessage` schema comment. Both null together
   *  whenever the lookup didn't resolve. */
  country: string | null;
  countryCode: string | null;
  isRead: boolean;
  createdAt: string;
}
