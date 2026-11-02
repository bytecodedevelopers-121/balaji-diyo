import { sanitizeRichText } from "@/lib/sanitizeHtml";
import { cn } from "@/utils";
import "./RichTextEditor/content.css";

interface RichTextViewProps {
  html: string | null | undefined;
  emptyText?: string;
  className?: string;
}

// Renders HTML produced by RichTextEditor. Re-sanitizes at render time —
// belt-and-suspenders in case the stored value ever bypassed the form.
// Shares `rte-content` styling with the editor so saved content (headings,
// tables, colors, alignment, task lists, etc.) renders identically here.
export function RichTextView({ html, emptyText = "—", className }: RichTextViewProps) {
  if (!html || !html.replace(/<[^>]*>/g, "").trim()) {
    return <p className="text-sm text-gray-900">{emptyText}</p>;
  }
  return (
    <div
      className={cn("rte-content text-sm text-gray-900", className)}
      dangerouslySetInnerHTML={{ __html: sanitizeRichText(html) }}
    />
  );
}
