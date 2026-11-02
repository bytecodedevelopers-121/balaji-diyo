export interface Service {
  id: string;
  title: string;
  description: string;
  secondaryDescription: string | null;
  imageUrl: string;
  ctaLabel: string;
  ctaUrl: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ServiceFormValues {
  title: string;
  description: string;
  secondaryDescription?: string | null;
  imageUrl: string;
  ctaLabel?: string;
  ctaUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface ServiceSectionConfig {
  id: string;
  eyebrow: string;
  heading: string;
  introduction: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ServiceSectionConfigFormValues = Pick<ServiceSectionConfig, "eyebrow" | "heading" | "introduction">;
