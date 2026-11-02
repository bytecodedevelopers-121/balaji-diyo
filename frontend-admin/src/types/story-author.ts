export interface StoryAuthor {
  id: string;
  name: string;
  salutation: string | null;
  email: string;
  description: string | null;
  isActive: boolean;
  slug: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStoryAuthorDto {
  name: string;
  slug?: string;
  salutation?: string;
  email: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateStoryAuthorDto {
  name?: string;
  slug?: string;
  salutation?: string;
  email?: string;
  description?: string;
  isActive?: boolean;
}
