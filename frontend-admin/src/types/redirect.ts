export interface Redirect {
  id: string;
  source: string;
  destination: string;
  isPermanent: boolean;
  redirectCode: string | null;
  redirectMessage: string | null;
  redirectStatus: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRedirectDto {
  source: string;
  destination: string;
  isPermanent?: boolean;
  redirectCode?: string;
  redirectMessage?: string;
  redirectStatus?: boolean;
}

export interface UpdateRedirectDto {
  source?: string;
  destination?: string;
  isPermanent?: boolean;
  redirectCode?: string;
  redirectMessage?: string;
  redirectStatus?: boolean;
}
