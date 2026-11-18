import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ThumbnailField } from "./ThumbnailField";
import type { GuideSection, GuideTopic } from "@/types/site-content";

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const emptyTopic = (): GuideTopic => ({ slug: "", title: "", image: "", summary: "", intro: [], sections: [] });

/** Drops blank lines/entries and empty sections so the saved topic is clean. */
export function cleanTopics(topics: GuideTopic[]): GuideTopic[] {
  const list = (a?: string[]) => (a ?? []).map((x) => x.trim()).filter(Boolean);
  return topics.map((t) => {
    const sections = t.sections
      .map((s): GuideSection => {
        const out: GuideSection = {};
        if (s.heading?.trim()) out.heading = s.heading.trim();
        if (s.body?.trim()) out.body = s.body.trim();
        if (list(s.paragraphs).length) out.paragraphs = list(s.paragraphs);
        if (list(s.bullets).length) out.bullets = list(s.bullets);
        if (s.note?.trim()) out.note = s.note.trim();
        return out;
      })
      .filter((s) => Object.keys(s).length > 0);
    const intro = list(t.intro ?? undefined);
    return {
      ...t,
      title: t.title.trim(),
      slug: slugify(t.slug || t.title),
      image: t.image.trim(),
      summary: t.summary.trim(),
      intro: intro.length ? intro : null,
      sections,
    };
  });
}

/** Returns an error message for the first invalid topic, or null. */
export function validateTopics(topics: GuideTopic[]): string | null {
  const slugs = new Set<string>();
  for (const [i, t] of topics.entries()) {
    const n = `Topic ${i + 1}`;
    if (!t.title.trim()) return `${n}: title is required`;
    if (!t.image.trim()) return `${n} (${t.title}): image is required`;
    if (!t.summary.trim()) return `${n} (${t.title}): summary is required`;
    const slug = slugify(t.slug || t.title);
    if (!slug) return `${n}: slug is required`;
    if (slugs.has(slug)) return `${n} (${t.title}): duplicate slug "${slug}"`;
    slugs.add(slug);
  }
  return null;
}

interface Props {
  topics: GuideTopic[];
  onChange: (topics: GuideTopic[]) => void;
}

/** Form-based editor for a travel guide's topics (no JSON). */
export function TopicsEditor({ topics, onChange }: Props) {
  const [open, setOpen] = useState<number | null>(null);

  const patchTopic = (i: number, patch: Partial<GuideTopic>) =>
    onChange(topics.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  const patchSection = (i: number, j: number, patch: Partial<GuideSection>) =>
    patchTopic(i, { sections: topics[i].sections.map((s, idx) => (idx === j ? { ...s, ...patch } : s)) });
  const move = <T,>(arr: T[], from: number, to: number) => {
    if (to < 0 || to >= arr.length) return arr;
    const copy = [...arr];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    return copy;
  };

  const add = () => {
    onChange([...topics, emptyTopic()]);
    setOpen(topics.length);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Topics ({topics.length})</span>
        <Button type="button" size="sm" variant="outline" onClick={add}>
          + Add topic
        </Button>
      </div>

      {topics.length === 0 && <p className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">No topics yet.</p>}

      {topics.map((t, i) => {
        const isOpen = open === i;
        return (
          <div key={t.id ?? `new-${i}`} className="rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center gap-2 px-3 py-2">
              <button type="button" className="flex-1 text-left text-sm font-semibold text-gray-800" onClick={() => setOpen(isOpen ? null : i)}>
                {isOpen ? "▾" : "▸"} {t.title || <span className="font-normal text-gray-400">Untitled topic</span>}
              </button>
              <Button type="button" size="sm" variant="ghost" disabled={i === 0} onClick={() => onChange(move(topics, i, i - 1))}>
                ↑
              </Button>
              <Button type="button" size="sm" variant="ghost" disabled={i === topics.length - 1} onClick={() => onChange(move(topics, i, i + 1))}>
                ↓
              </Button>
              <Button
                type="button"
                size="sm"
                variant="danger"
                onClick={() => {
                  if (window.confirm(`Delete topic "${t.title || "Untitled"}"? It is removed when you save the guide.`)) {
                    onChange(topics.filter((_, idx) => idx !== i));
                    setOpen(null);
                  }
                }}
              >
                Delete
              </Button>
            </div>

            {isOpen && (
              <div className="space-y-4 border-t border-gray-100 p-3">
                <Input
                  label="Title"
                  required
                  value={t.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    // keep slug in sync with the title until the slug is edited by hand (new topics only)
                    const follow = !t.id && (t.slug === "" || t.slug === slugify(t.title));
                    patchTopic(i, { title, ...(follow ? { slug: slugify(title) } : {}) });
                  }}
                />
                <Input
                  label="Slug"
                  required
                  hint="Used in the URL: /travel-guides/<guide>/<slug>"
                  value={t.slug}
                  onChange={(e) => patchTopic(i, { slug: e.target.value })}
                />
                <ThumbnailField label="Thumbnail" required value={t.image} onChange={(image) => patchTopic(i, { image })} folder="travel-guides" />
                <Textarea label="Summary" required rows={3} value={t.summary} onChange={(e) => patchTopic(i, { summary: e.target.value })} />
                <Textarea
                  label="Opening paragraphs"
                  rows={5}
                  hint="Separate paragraphs with a blank line. Use **bold** for emphasis. Leave empty to show the summary."
                  value={(t.intro ?? []).join("\n\n")}
                  onChange={(e) => patchTopic(i, { intro: e.target.value.split("\n\n") })}
                />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Sections ({t.sections.length})</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => patchTopic(i, { sections: [...t.sections, { heading: "" }] })}
                    >
                      + Add section
                    </Button>
                  </div>

                  {t.sections.map((s, j) => (
                    <div key={j} className="space-y-3 rounded-lg bg-gray-50 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Section {j + 1}</span>
                        <div className="flex gap-1">
                          <Button type="button" size="sm" variant="ghost" disabled={j === 0} onClick={() => patchTopic(i, { sections: move(t.sections, j, j - 1) })}>
                            ↑
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={j === t.sections.length - 1}
                            onClick={() => patchTopic(i, { sections: move(t.sections, j, j + 1) })}
                          >
                            ↓
                          </Button>
                          <Button type="button" size="sm" variant="danger" onClick={() => patchTopic(i, { sections: t.sections.filter((_, idx) => idx !== j) })}>
                            Remove
                          </Button>
                        </div>
                      </div>
                      <Input label="Heading" value={s.heading ?? ""} onChange={(e) => patchSection(i, j, { heading: e.target.value })} />
                      <Textarea label="Text" rows={3} value={s.body ?? ""} onChange={(e) => patchSection(i, j, { body: e.target.value })} />
                      <Textarea
                        label="Extra paragraphs"
                        rows={3}
                        hint="Separate paragraphs with a blank line."
                        value={(s.paragraphs ?? []).join("\n\n")}
                        onChange={(e) => patchSection(i, j, { paragraphs: e.target.value.split("\n\n") })}
                      />
                      <Textarea
                        label="Bullet points"
                        rows={4}
                        hint="One bullet per line."
                        value={(s.bullets ?? []).join("\n")}
                        onChange={(e) => patchSection(i, j, { bullets: e.target.value.split("\n") })}
                      />
                      <Input label="Note" value={s.note ?? ""} onChange={(e) => patchSection(i, j, { note: e.target.value })} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
