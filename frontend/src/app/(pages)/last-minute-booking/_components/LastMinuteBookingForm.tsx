"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import { Minus, Plus, ShieldCheck } from "lucide-react";
import { countries } from "@/config/contact-form-options";

export interface LastMinuteTrip {
  title: string;
  slug: string;
  imageUrl: string;
  date: string;
  days: number;
  price: number;
}

const ADD_ONS = [
  { id: "flight-out", label: "Book a flight from Kathmandu to Pokhara (Day 3)", price: 125 },
  { id: "flight-back", label: "Book a flight from Pokhara to Kathmandu (Day 13)", price: 125 },
  { id: "single-room", label: "Single Private Room", price: 200 },
  { id: "solo-trek", label: "Solo Private Trek", price: 300 },
  { id: "private-trek", label: "Make It Private Trek", price: 100 },
];

const SOURCES = ["Google", "Facebook / Instagram", "TripAdvisor", "Friend or family", "Travel blog", "Other"];
const DEPOSIT_PERCENT = 20;

const money = (n: number) => `US$${n.toLocaleString()}`;
const dateLabel = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric", timeZone: "UTC" });
};

const field =
  "w-full rounded-[4px] border border-brand-neutral-300 bg-white px-3 py-3 text-[13px] text-brand-neutral-900 outline-none placeholder:text-brand-neutral-700 focus:border-logo-navy";

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-md border border-brand-neutral-200 bg-white p-5 shadow-[0_2px_10px_rgba(6,74,112,0.06)]">
      <h2 className="mb-4 text-[14px] font-semibold text-[#d98a00]">{title}</h2>
      {children}
    </section>
  );
}

function Stepper({ value, onChange, label, min = 0 }: { value: number; onChange: (n: number) => void; label: string; min?: number }) {
  return (
    <div className="flex items-center justify-between rounded-[4px] border border-brand-neutral-300 px-2 py-1.5">
      <button type="button" aria-label={`Decrease ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)} className="grid size-6 place-items-center rounded-[3px] bg-logo-sun/30 text-logo-navy-dark disabled:opacity-40">
        <Minus aria-hidden="true" className="size-3.5" />
      </button>
      <span className="min-w-8 text-center text-[13px]">{value}</span>
      <button type="button" aria-label={`Increase ${label}`} onClick={() => onChange(value + 1)} className="grid size-6 place-items-center rounded-[3px] bg-logo-sun/30 text-logo-navy-dark">
        <Plus aria-hidden="true" className="size-3.5" />
      </button>
    </div>
  );
}

export function LastMinuteBookingForm({ trip, phone }: { trip: LastMinuteTrip; phone: string }) {
  const [date, setDate] = useState(trip.date);
  const [travelers, setTravelers] = useState(1);
  const [addOns, setAddOns] = useState<Record<string, number>>({});
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addOnTotal = useMemo(() => ADD_ONS.reduce((sum, a) => sum + a.price * (addOns[a.id] ?? 0), 0), [addOns]);
  const packagePrice = trip.price * travelers;
  const total = packagePrice + addOnTotal;
  const deposit = Math.round((total * DEPOSIT_PERCENT) / 100);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const get = (key: string) => String(form.get(key) ?? "").trim();
    if (!accepted) {
      setError("Please accept the terms and conditions to continue.");
      return;
    }
    setError(null);

    const chosen = ADD_ONS.filter((a) => (addOns[a.id] ?? 0) > 0).map((a) => `${a.label} x${addOns[a.id]}`);
    const lines = [
      `Last Minute Booking: ${trip.title}`,
      `Trip date: ${dateLabel(date)} (${trip.days} days)`,
      `Travelers: ${travelers}`,
      chosen.length ? `Add-ons: ${chosen.join("; ")}` : "Add-ons: none",
      `Total: ${money(total)} | Deposit now (${DEPOSIT_PERCENT}%): ${money(deposit)}`,
      "",
      `Name: ${get("firstName")} ${get("lastName")}`,
      `Email: ${get("email")}`,
      `Country: ${get("country")}`,
      `Phone: ${get("phone")}`,
      get("whatsapp") ? `WhatsApp: ${get("whatsapp")}` : "",
      `Found us via: ${get("source")}`,
      get("notes") ? `Notes: ${get("notes")}` : "",
    ].filter(Boolean);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener,noreferrer");
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex flex-col gap-5">
        <Card title="Date and Travelers">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] text-brand-neutral-700">Trip Date *</span>
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={field} />
            </label>
            <div>
              <span className="mb-1 block text-[11px] text-brand-neutral-700">Number of Travelers</span>
              <Stepper value={travelers} onChange={setTravelers} label="travelers" min={1} />
            </div>
          </div>
        </Card>

        <Card title="Add-Ons and Extra Options">
          <ul className="divide-y divide-dashed divide-brand-neutral-300">
            {ADD_ONS.map((a) => (
              <li key={a.id} className="grid items-center gap-3 py-3 sm:grid-cols-[1fr_auto_120px]">
                <span className="text-[13px] font-semibold text-brand-neutral-900">{a.label}</span>
                <span className="text-[12px] text-brand-neutral-800">
                  + <strong>US${a.price}</strong> per person
                </span>
                <Stepper value={addOns[a.id] ?? 0} onChange={(n) => setAddOns((prev) => ({ ...prev, [a.id]: n }))} label={a.label} />
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Lead Traveler Details">
          <div className="grid gap-4 sm:grid-cols-2">
            <input name="firstName" required placeholder="First Name *" className={field} />
            <input name="lastName" required placeholder="Last Name *" className={field} />
            <input name="email" type="email" required placeholder="Email Address *" className={field} />
            <select name="country" required defaultValue="" className={field}>
              <option value="" disabled>Choose Your Country *</option>
              {countries.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input name="phone" type="tel" required placeholder="Country Code + Phone Number *" className={field} />
            <input name="whatsapp" type="tel" placeholder="WhatsApp Number" className={field} />
            <select name="source" required defaultValue="" className={`${field} sm:col-span-2`}>
              <option value="" disabled>Where Did You Find Us? *</option>
              {SOURCES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <textarea name="notes" rows={5} placeholder="Pickup Details and Extra Requirements (If Any)" className={`${field} sm:col-span-2`} />
          </div>
          <label className="mt-4 flex items-center gap-2 text-[12px] text-brand-neutral-800">
            <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="accent-[#064a70]" />
            I accept <a href="/company/terms-and-conditions" target="_blank" className="text-[#d98a00] underline">terms and conditions</a>
          </label>
          {error ? <p role="alert" className="mt-2 text-[12px] text-red-600">{error}</p> : null}
          <button type="submit" className="mt-4 rounded-[4px] bg-logo-sun px-6 py-3 text-[12px] font-bold tracking-wide text-logo-navy-dark uppercase transition-opacity hover:opacity-90">
            Proceed to Payment
          </button>
        </Card>
      </div>

      <aside className="h-fit overflow-hidden rounded-md border border-brand-neutral-200 bg-white shadow-[0_2px_10px_rgba(6,74,112,0.06)] lg:sticky lg:top-24">
        <h2 className="bg-[#064a70] px-4 py-3 text-[13px] font-bold text-white">Your Trip Details</h2>
        <div className="p-4">
          <div className="flex gap-3">
            <Image src={trip.imageUrl} alt="" width={64} height={64} className="size-16 rounded-[4px] object-cover" />
            <div>
              <p className="text-[14px] leading-snug font-bold text-logo-navy-dark">{trip.title}</p>
              <p className="mt-1 text-[11px] text-brand-neutral-800">Duration: {trip.days} Days</p>
            </div>
          </div>

          <dl className="mt-4 divide-y divide-brand-neutral-200 border-t border-brand-neutral-200 text-[11px] text-brand-neutral-800">
            <Row k="Trip Date:" v={dateLabel(date)} />
            <Row k="Number of Traveler:" v={`${travelers} traveler(s)`} />
            <Row k="Package Price" sub={`${money(trip.price)} x ${travelers} traveler(s)`} v={money(packagePrice)} strong />
            {addOnTotal > 0 ? <Row k="Add-Ons" v={money(addOnTotal)} strong /> : null}
            <Row k="Total Price" v={money(total)} strong />
            <Row k="Initial Payment" sub={`(${DEPOSIT_PERCENT}% of total amount)`} v={money(deposit)} strong />
            <Row k="Due Amount (Pay Later)" v={money(total - deposit)} strong />
          </dl>

          <p className="mt-3 rounded-[4px] border border-[#f4dd9a] bg-[#fffaeb] px-3 py-2 text-[10px] text-[#a56a00]">
            You pay the balance amount after arriving in Kathmandu, before the trip starts.
          </p>
          <p className="mt-3 flex items-start gap-1.5 text-[10px] text-brand-neutral-800">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-logo-green" />
            This is a secure payment. Your card details are safe.
          </p>
        </div>
      </aside>
    </form>
  );
}

function Row({ k, v, sub, strong }: { k: string; v: string; sub?: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <dt>
        {k}
        {sub ? <span className="block text-[9px] text-brand-neutral-700">{sub}</span> : null}
      </dt>
      <dd className={strong ? "font-bold text-logo-navy-dark" : ""}>{v}</dd>
    </div>
  );
}
