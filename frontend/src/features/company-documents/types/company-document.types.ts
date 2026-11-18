/**
 * Company document domain type — maps to the backend's CompanyDocument
 * module (backend/src/modules/company-document), exposed publicly via
 * `GET /company-documents`. Unlike TeamMember, there's no per-document
 * detail page/slug — the /company-documents page renders the whole
 * roster as one static grid, so only the fields that grid needs are
 * included here.
 */
export interface CompanyDocument {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  /** Which group of the Legal Documents page it sits in. */
  category?: "legal" | "association";
  sortOrder: number;
}
