import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Button } from "@/components/ui/Button";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { TableActions } from "@/components/table/TableActions";
import { usePermission } from "@/hooks/usePermission";
import { useSafeMutation } from "@/hooks/useSafeMutation";
import { ThumbnailField } from "@/components/site-content/ThumbnailField";
import { TopicsEditor, cleanTopics, validateTopics } from "@/components/site-content/TopicsEditor";
import { CardsEditor } from "@/components/site-content/CardsEditor";
import { SlidesEditor } from "@/components/site-content/SlidesEditor";
import { siteContentService } from "@/services/site-content.service";
import { getErrorMessage } from "@/lib/apiError";
import { COMPANY_INFO } from "@/constants";
import type { Destination, DestinationCard, GuideTopic, SiteContentResource, TravelGuide, WebStory, WebStorySlide } from "@/types/site-content";

const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Which field the slug is generated from. */
const SLUG_SOURCE: Record<SiteContentResource, string> = { destinations: "name", "travel-guides": "title", "web-stories": "title" };

type Row = (Destination | TravelGuide | WebStory) & { id: string; slug: string; isActive: boolean; sortOrder: number };

/** How each resource looks in the form: simple fields plus JSON fields for nested data. */
interface FieldDef {
  key: string;
  label: string;
  kind: "text" | "textarea" | "json" | "number" | "topics" | "image" | "slides" | "cards";
  hint?: string;
  required?: boolean;
}

interface ResourceDef {
  title: string;
  singular: string;
  fields: FieldDef[];
  columns: { header: string; render: (row: Row) => string }[];
}

const RESOURCES: Record<SiteContentResource, ResourceDef> = {
  destinations: {
    title: "Destinations",
    singular: "Destination",
    fields: [
      { key: "slug", label: "Slug", kind: "text", required: true, hint: "Lowercase, hyphens only. Used in /destination/<slug>." },
      { key: "name", label: "Name", kind: "text", required: true },
      { key: "countryLabel", label: "Country label", kind: "text", required: true, hint: "Used to count packages, e.g. Nepal." },
      { key: "heroImage", label: "Hero image", kind: "image", required: true },
      { key: "intro", label: "Intro", kind: "textarea", required: true },
      { key: "cards", label: "Category cards", kind: "cards" },
      { key: "contentHtml", label: "Article (HTML)", kind: "textarea" },
      { key: "sortOrder", label: "Sort order", kind: "number" },
    ],
    columns: [
      { header: "Name", render: (r) => (r as Destination).name },
      { header: "Country", render: (r) => (r as Destination).countryLabel },
      { header: "Cards", render: (r) => String((r as Destination).cards?.length ?? 0) },
    ],
  },
  "travel-guides": {
    title: "Travel Guides",
    singular: "Travel Guide",
    fields: [
      { key: "slug", label: "Slug", kind: "text", required: true },
      { key: "country", label: "Country", kind: "text", required: true },
      { key: "title", label: "Title", kind: "text", required: true },
      { key: "image", label: "Thumbnail", kind: "image", required: true },
      { key: "summary", label: "Summary", kind: "textarea", required: true },
      { key: "topics", label: "Topics", kind: "topics" },
      { key: "sortOrder", label: "Sort order", kind: "number" },
    ],
    columns: [
      { header: "Title", render: (r) => (r as TravelGuide).title },
      { header: "Country", render: (r) => (r as TravelGuide).country },
      { header: "Topics", render: (r) => String((r as TravelGuide).topics?.length ?? 0) },
    ],
  },
  "web-stories": {
    title: "Web Stories",
    singular: "Web Story",
    fields: [
      { key: "slug", label: "Slug", kind: "text", required: true },
      { key: "title", label: "Title", kind: "text", required: true },
      { key: "slides", label: "Slides", kind: "slides" },
      { key: "sortOrder", label: "Sort order", kind: "number" },
    ],
    columns: [
      { header: "Title", render: (r) => (r as WebStory).title },
      { header: "Slides", render: (r) => String((r as WebStory).slides?.length ?? 0) },
    ],
  },
};

const JSON_DEFAULTS: Record<string, unknown> = { cards: [], topics: [], slides: [] };

function toFormState(def: ResourceDef, row: Row | null): Record<string, string | boolean> {
  const state: Record<string, string | boolean> = { isActive: row?.isActive ?? true };
  for (const field of def.fields) {
    const value = (row as unknown as Record<string, unknown> | null)?.[field.key];
    if (field.kind === "topics" || field.kind === "slides" || field.kind === "cards") continue; // handled by structured editors
    if (field.kind === "json") state[field.key] = JSON.stringify(value ?? JSON_DEFAULTS[field.key] ?? [], null, 2);
    else state[field.key] = value === undefined || value === null ? (field.kind === "number" ? "0" : "") : String(value);
  }
  return state;
}

function SiteContentPage({ resource }: { resource: SiteContentResource }) {
  const def = RESOURCES[resource];
  const canCreate = usePermission("create:travel");
  const canEdit = usePermission("update:travel");
  const canDelete = usePermission("delete:travel");
  const qc = useQueryClient();

  const [target, setTarget] = useState<Row | null | undefined>(undefined); // undefined = closed, null = new
  const [form, setForm] = useState<Record<string, string | boolean>>({});
  const [guideTopics, setGuideTopics] = useState<GuideTopic[]>([]);
  const [slides, setSlides] = useState<WebStorySlide[]>([]);
  const [cards, setCards] = useState<DestinationCard[]>([]);
  const [slugTouched, setSlugTouched] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `${def.title} | ${COMPANY_INFO.name} Admin`;
  }, [def.title]);

  const queryKey = useMemo(() => ["site-content", resource] as const, [resource]);
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey,
    queryFn: () => siteContentService.list<Row>(resource),
  });
  const rows = data?.data ?? [];

  const refresh = () => qc.invalidateQueries({ queryKey });

  const save = useSafeMutation({
    mutationFn: async (values: Record<string, string | boolean>) => {
      const body: Record<string, unknown> = { isActive: values.isActive };
      for (const field of def.fields) {
        if (field.kind === "topics" || field.kind === "slides" || field.kind === "cards") continue;
        const raw = values[field.key] as string;
        if (field.kind === "json") {
          let parsed: unknown;
          try {
            parsed = JSON.parse(raw || "[]");
          } catch {
            throw new Error(`"${field.label}" is not valid JSON`);
          }
          body[field.key] = parsed;
        } else if (field.kind === "number") body[field.key] = Number(raw) || 0;
        else body[field.key] = raw;
      }
      if (resource === "destinations") {
        const cleaned = cards.filter((c) => c.label.trim() || c.href.trim() || c.image);
        if (cleaned.some((c) => !c.label.trim() || !c.href.trim() || !c.image)) throw new Error("JSON: Every category card needs an image, a title and a link");
        body.cards = cleaned.map((c) => ({ ...c, label: c.label.trim(), href: c.href.trim(), categoryKey: c.categoryKey || undefined }));
      }
      if (resource === "web-stories") {
        if (slides.length === 0) throw new Error("JSON: Add at least one image or video slide");
        body.slides = slides.map((s) => (s.video ? { image: "", video: s.video, caption: s.caption } : { image: s.image, caption: s.caption }));
        // Cover is derived: the first image slide, else the first video.
        body.cover = slides.find((s) => s.image)?.image ?? slides[0].video ?? "";
      }
      if (resource === "travel-guides") {
        const problem = validateTopics(guideTopics);
        if (problem) throw new Error(`JSON: ${problem}`);
        const topics = cleanTopics(guideTopics);
        return siteContentService.saveGuide(target as TravelGuide | null, body as never, topics);
      }
      return target ? siteContentService.update(resource, target.id, body) : siteContentService.create(resource, body);
    },
    onSuccess: () => {
      setTarget(undefined);
      void refresh();
    },
    onError: (err) =>
      setError(err instanceof Error && err.message.startsWith("JSON: ") ? err.message.slice(6) : err instanceof Error && err.message.includes("JSON") ? err.message : getErrorMessage(err)),
  });

  const remove = useSafeMutation({
    mutationFn: (id: string) => siteContentService.remove(resource, id),
    onSuccess: () => {
      setDeleteTarget(null);
      void refresh();
    },
    onError: (err) => {
      setError(getErrorMessage(err));
      setDeleteTarget(null);
    },
  });

  const open = (row: Row | null) => {
    setError(null);
    setForm(toFormState(def, row));
    setGuideTopics(((row as TravelGuide | null)?.topics ?? []).map((t) => ({ ...t, intro: t.intro ?? [] })));
    setCards(((row as Destination | null)?.cards ?? []).map((c) => ({ ...c })));
    setSlides(((row as WebStory | null)?.slides ?? []).map((s) => ({ ...s })));
    setSlugTouched(!!row);
    setTarget(row);
  };

  const columns: DataTableColumn<Row>[] = [
    ...def.columns.map((c, i) => ({ key: `c${i}`, header: c.header, render: (r: Row) => c.render(r) })),
    { key: "slug", header: "Slug", render: (r: Row) => r.slug },
    {
      key: "isActive",
      header: "Status",
      render: (r: Row) => <Badge label={r.isActive ? "Active" : "Inactive"} variant={r.isActive ? "green" : "gray"} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r: Row) => (
        <TableActions
          onEdit={canEdit ? () => open(r) : undefined}
          onDelete={canDelete ? () => setDeleteTarget(r) : undefined}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={def.title}
        action={
          <>
            <RefreshButton isFetching={isFetching} onRefresh={refetch} />
            {canCreate && <Button onClick={() => open(null)}>+ Add {def.singular}</Button>}
          </>
        }
      />

      {isError && <Alert variant="error" message={`Failed to load ${def.title.toLowerCase()}.`} />}
      {error && target === undefined && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard padding="sm">
        <DataTable columns={columns} data={rows} isLoading={isLoading} emptyMessage={`No ${def.title.toLowerCase()} yet.`} />
      </PageCard>

      <Drawer
        isOpen={target !== undefined}
        onClose={() => setTarget(undefined)}
        title={target ? `Edit ${def.singular}` : `New ${def.singular}`}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setTarget(undefined)}>
              Cancel
            </Button>
            <Button onClick={() => save.mutate(form)} isLoading={save.isPending}>
              {target ? "Save Changes" : `Create ${def.singular}`}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}
          {def.fields.map((field) => {
            const value = String(form[field.key] ?? "");
            const set = (v: string) => {
              if (field.key === "slug") setSlugTouched(true);
              const autoSlug = field.key === SLUG_SOURCE[resource] && !slugTouched;
              setForm((f) => ({ ...f, [field.key]: v, ...(autoSlug ? { slug: slugify(v) } : {}) }));
            };
            if (field.kind === "cards") {
              return <CardsEditor key={field.key} cards={cards} onChange={setCards} />;
            }
            if (field.kind === "slides") {
              return <SlidesEditor key={field.key} slides={slides} onChange={setSlides} />;
            }
            if (field.kind === "image") {
              return <ThumbnailField key={field.key} label={field.label} required={field.required} value={value} onChange={set} noun={resource === "destinations" ? "image" : "thumbnail"} folder={resource === "destinations" ? "destinations" : "travel-guides"} />;
            }
            if (field.kind === "topics") {
              return <TopicsEditor key={field.key} topics={guideTopics} onChange={setGuideTopics} />;
            }
            if (field.kind === "textarea" || field.kind === "json") {
              return (
                <Textarea
                  key={field.key}
                  label={field.label}
                  hint={field.hint}
                  required={field.required}
                  rows={field.kind === "json" ? 14 : 5}
                  className={field.kind === "json" ? "font-mono text-xs" : undefined}
                  value={value}
                  onChange={(e) => set(e.target.value)}
                />
              );
            }
            return (
              <Input
                key={field.key}
                label={field.label}
                hint={field.hint}
                required={field.required}
                type={field.kind === "number" ? "number" : "text"}
                value={value}
                onChange={(e) => set(e.target.value)}
              />
            );
          })}
          <Checkbox label="Active" checked={Boolean(form.isActive)} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
        </div>
      </Drawer>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={`Delete ${def.singular}`}
        message={`Delete "${deleteTarget?.slug}"? This cannot be undone.`}
        onConfirm={() => deleteTarget && remove.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        isLoading={remove.isPending}
      />
    </div>
  );
}

export const DestinationsAdminPage = () => <SiteContentPage resource="destinations" />;
export const TravelGuidesAdminPage = () => <SiteContentPage resource="travel-guides" />;
export const WebStoriesAdminPage = () => <SiteContentPage resource="web-stories" />;
export default SiteContentPage;
