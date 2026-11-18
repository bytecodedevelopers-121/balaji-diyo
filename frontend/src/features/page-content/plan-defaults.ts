import defaults from "./plan-defaults.json";
import type { SeoContent } from "./company-defaults";

/** Built-in copy of the Plan Your Nepal Trip page; the CMS (admin → Page Content → Plan Your Trip) overrides it. */
export interface PlanContent {
  seo: SeoContent;
  /** `body` is rich-text HTML written in the admin's text editor. */
  content: { title: string; body: string };
  form: { personalTitle: string; tripTitle: string; submitLabel: string; successMessage: string };
}

export const PLAN_DEFAULTS: PlanContent = defaults;
