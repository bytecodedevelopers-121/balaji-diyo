import { useId, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2 } from "lucide-react";
import { MediaPickerModal } from "@/components/media/MediaPickerModal";
import { getPublicUrl } from "@/lib/storage";
import { BUILT_IN_TOUR_TYPES } from "@/lib/tourTypes";
import type { DestinationCard } from "@/types/site-content";
import type { Media } from "@/types/media";

const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) ?? "http://localhost:3000").replace(/\/+$/, "");
const previewSrc = (value: string) => (value.startsWith("/") ? `${SITE_URL}${value}` : value);

/** Activity filters used for the package count on a card. */
const ACTIVITIES = [
  { value: "", label: "None" },
  { value: "trekking", label: "Trekking and Hiking" },
  { value: "climbing", label: "Climbing and Expedition" },
  { value: "safari", label: "Jungle and Wildlife Safari" },
  { value: "tours", label: "Nepal Tours and Holidays" },
  { value: "day", label: "Day Tours and Activities" },
  { value: "deals", label: "Deals and Discounts" },
];

interface Props {
  cards: DestinationCard[];
  onChange: (cards: DestinationCard[]) => void;
}

const inputClass = "w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-indigo-500";

/** Category cards of a destination page: a photo, a title and the page the card links to. */
export function CardsEditor({ cards, onChange }: Props) {
  const [pickFor, setPickFor] = useState<number | null>(null);
  const listId = useId();

  const update = (i: number, patch: Partial<DestinationCard>) => onChange(cards.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const remove = (i: number) => onChange(cards.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= cards.length) return;
    const next = [...cards];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">Category cards</label>
        <button
          type="button"
          onClick={() => onChange([...cards, { label: "", href: "", image: "" }])}
          className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-gray-50"
        >
          <Plus size={14} /> Add card
        </button>
      </div>

      <datalist id={listId}>
        {BUILT_IN_TOUR_TYPES.map((t) => (
          <option key={t.slug} value={`/${t.slug}`}>
            {t.label}
          </option>
        ))}
      </datalist>

      {cards.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-xs text-gray-500">No cards yet. Add one to show a category on this destination page.</div>
      ) : (
        <ul className="space-y-3">
          {cards.map((card, i) => (
            <li key={i} className="flex gap-3 rounded-lg border border-gray-200 p-3">
              <button
                type="button"
                onClick={() => setPickFor(i)}
                aria-label="Choose card image"
                className="relative h-24 w-32 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50 text-xs text-gray-500 hover:bg-gray-100"
              >
                {card.image ? (
                  <img src={previewSrc(card.image)} alt="" className="size-full object-cover" />
                ) : (
                  <span className="flex size-full flex-col items-center justify-center gap-1">
                    <ImagePlus size={20} />
                    Upload image
                  </span>
                )}
              </button>

              <div className="grid min-w-0 flex-1 gap-2">
                <input className={inputClass} placeholder="Card title, e.g. Day Tours and Activities" value={card.label} onChange={(e) => update(i, { label: e.target.value })} />
                <input className={inputClass} placeholder="Link, e.g. /nepal-day-tours" list={listId} value={card.href} onChange={(e) => update(i, { href: e.target.value })} />
                <select className={inputClass} value={card.categoryKey ?? ""} onChange={(e) => update(i, { categoryKey: e.target.value || undefined })} aria-label="Activity for package count">
                  {ACTIVITIES.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.value ? `Count packages of: ${a.label}` : "No package count"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <button type="button" aria-label="Move up" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30">
                  <ArrowUp size={14} />
                </button>
                <button type="button" aria-label="Move down" onClick={() => move(i, 1)} disabled={i === cards.length - 1} className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30">
                  <ArrowDown size={14} />
                </button>
                <button type="button" aria-label="Remove card" onClick={() => remove(i)} className="rounded p-1 text-red-500 hover:bg-red-50">
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <MediaPickerModal
        isOpen={pickFor !== null}
        onClose={() => setPickFor(null)}
        onSelect={(media: Media) => {
          if (pickFor !== null) update(pickFor, { image: getPublicUrl(media.fullPath) });
          setPickFor(null);
        }}
        folder="destinations"
      />
    </div>
  );
}
