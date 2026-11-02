export interface HomepageService {
  id: string;
  title: string;
  description: string;
  secondaryDescription: string | null;
  imageUrl: string;
  ctaLabel: string;
  ctaUrl: string;
  sortOrder: number;
}

export interface HomepageServiceSection {
  id: string;
  eyebrow: string;
  heading: string;
  introduction: string;
}

export interface HomepageServicesPayload {
  section: HomepageServiceSection;
  items: HomepageService[];
}
