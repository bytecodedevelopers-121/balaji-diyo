export interface BlogComment {
  id: string;
  blogId: string;
  blog?: { id: string; title: string };
  parentId: string | null;
  commentorName: string;
  commentorEmail: string | null;
  commentorAddress: string | null;
  commentorContact: string | null;
  comment: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
