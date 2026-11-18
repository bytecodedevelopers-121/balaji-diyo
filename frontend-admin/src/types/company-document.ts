export interface CompanyDocument {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  category: "legal" | "association";
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CompanyDocumentFormValues {
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  category?: "legal" | "association";
  sortOrder?: number;
  isActive?: boolean;
}
