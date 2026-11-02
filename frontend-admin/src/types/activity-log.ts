export interface ActivityLogActor {
  id: string;
  name: string | null;
  email: string;
}

export interface ActivityLog {
  id: string;
  loggerType: string; // "admin" | "user"
  loggerId: string;
  // Resolved server-side from loggerId for loggerType "admin" only — null for
  // "user" entries (no User row to resolve) or if the account is gone.
  actor: ActivityLogActor | null;
  primaryAction: string | null;
  clientAction: string | null;
  actionMethod: string | null;
  actionData: unknown;
  actionResponse: unknown;
  actionCategory: string | null;
  actionCategoryKey: string | null;
  actionCategoryId: string | null;
  actionTitle: string | null;
  actionKey: string | null;
  createdAt: string;
}
