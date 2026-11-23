import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SecretOnceModal } from "@/components/b2b/SecretOnceModal";
import {
  useApiKeys, useCreateApiKey, useCreateWebhook, useDeleteWebhook, useRevokeApiKey, useRotateApiKey, useRotateWebhookSecret,
  useSendWebhookTest, useUpdateWebhook, useWebhookDeliveries, useWebhooks,
} from "@/hooks/queries/useB2B";
import { getDetailedErrorMessage } from "@/lib/apiError";
import { formatDate } from "@/lib/formatDate";
import { WEBHOOK_EVENTS, type ApiKeyMeta, type WebhookEndpoint, type WebhookEvent } from "@/types/b2b";

type Reveal = { title: string; label: string; secret: string } | null;

function ApiKeys({ reveal }: { reveal: (r: Reveal) => void }) {
  const { data } = useApiKeys();
  const create = useCreateApiKey();
  const rotate = useRotateApiKey();
  const revoke = useRevokeApiKey();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [rpm, setRpm] = useState("60");
  const [expires, setExpires] = useState("");
  const [confirm, setConfirm] = useState<ApiKeyMeta | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    create.mutate({ name: name.trim(), rateLimitRpm: Number(rpm), ...(expires ? { expiresAt: expires } : {}) }, {
      onSuccess: (r) => { setOpen(false); setName(""); setExpires(""); reveal({ title: "API key created", label: "Your API key", secret: r.data.token }); },
      onError: (e) => setError(getDetailedErrorMessage(e)),
    });
  };

  return (
    <PageCard>
      <div className="mb-3 flex items-center justify-between">
        <div><h2 className="font-semibold text-gray-900">API keys</h2><p className="text-xs text-gray-500">Send as <code>x-api-key</code> to <code>/api/v1/b2b/…</code> (packages, quotes, bookings — read only).</p></div>
        <Button onClick={() => { setError(null); setOpen(true); }}>Create key</Button>
      </div>
      {error && !open && <Alert variant="error" message={error} onClose={() => setError(null)} />}
      <ul className="divide-y divide-gray-100 text-sm">
        {(data?.data ?? []).map((k) => (
          <li key={k.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
            <div>
              <p className="font-medium text-gray-900">{k.name} <Badge label={k.isActive ? "Active" : "Revoked"} variant={k.isActive ? "green" : "gray"} size="sm" /></p>
              <p className="font-mono text-xs text-gray-500">{k.keyPrefix}… · {k.rateLimitRpm}/min · {k.lastUsedAt ? `used ${formatDate(k.lastUsedAt)}` : "never used"}{k.expiresAt ? ` · expires ${formatDate(k.expiresAt)}` : ""}</p>
            </div>
            {k.isActive && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" isLoading={rotate.isPending && rotate.variables === k.id} onClick={() => rotate.mutate(k.id, { onSuccess: (r) => reveal({ title: "API key rotated", label: "Your new API key (the old one no longer works)", secret: r.data.token }), onError: (e) => setError(getDetailedErrorMessage(e)) })}>Rotate</Button>
                <Button variant="danger" size="sm" onClick={() => setConfirm(k)}>Revoke</Button>
              </div>
            )}
          </li>
        ))}
        {data && data.data.length === 0 && <li className="py-3 text-gray-500">No API keys yet.</li>}
      </ul>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Create API key" size="sm" footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit} isLoading={create.isPending} disabled={!name.trim()}>Create</Button></div>}>
        <div className="space-y-3">
          {error && <Alert variant="error" message={error} />}
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Production website" />
          <Input label="Rate limit (requests / minute)" type="number" min={1} max={600} value={rpm} onChange={(e) => setRpm(e.target.value)} />
          <Input label="Expires (optional)" type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
        </div>
      </Modal>
      <ConfirmDialog isOpen={!!confirm} title="Revoke API key?" message={`"${confirm?.name}" stops working immediately. This can't be undone.`} confirmLabel="Revoke" isLoading={revoke.isPending}
        onCancel={() => setConfirm(null)} onConfirm={() => confirm && revoke.mutate(confirm.id, { onSuccess: () => setConfirm(null), onError: (e) => { setError(getDetailedErrorMessage(e)); setConfirm(null); } })} />
    </PageCard>
  );
}

function Deliveries({ endpoint }: { endpoint: WebhookEndpoint }) {
  const { data } = useWebhookDeliveries(endpoint.id, { perPage: 10 });
  const rows = data?.data.items ?? [];
  return (
    <div className="mt-3 rounded-lg bg-gray-50 p-3">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Recent deliveries</p>
      {rows.length === 0 ? <p className="text-xs text-gray-500">None yet.</p> : (
        <ul className="divide-y divide-gray-200 text-xs">
          {rows.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5">
              <span className="font-mono text-gray-800">{d.eventType}</span>
              <span className="flex items-center gap-2 text-gray-600">
                <Badge label={d.status.toLowerCase()} variant={d.status === "DELIVERED" ? "green" : d.status === "FAILED" ? "red" : "yellow"} size="sm" />
                <span>attempt {d.attemptCount}/{d.maxAttempts}{d.lastResponseCode ? ` · HTTP ${d.lastResponseCode}` : ""}</span>
                {d.status === "PENDING" && d.nextRetryAt && <span>retry {formatDate(d.nextRetryAt)}</span>}
                {d.lastError && d.status !== "DELIVERED" && <span className="max-w-[18rem] truncate text-red-600" title={d.lastError}>{d.lastError}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EventPicker({ value, onChange }: { value: WebhookEvent[]; onChange: (v: WebhookEvent[]) => void }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-2">
      {WEBHOOK_EVENTS.map((ev) => (
        <label key={ev} className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={value.includes(ev)} onChange={() => onChange(value.includes(ev) ? value.filter((x) => x !== ev) : [...value, ev])} /> <span className="font-mono text-xs">{ev}</span>
        </label>
      ))}
    </div>
  );
}

function Webhooks({ reveal }: { reveal: (r: Reveal) => void }) {
  const { data } = useWebhooks();
  const create = useCreateWebhook();
  const update = useUpdateWebhook();
  const del = useDeleteWebhook();
  const rotate = useRotateWebhookSecret();
  const test = useSendWebhookTest();
  const [edit, setEdit] = useState<{ id?: string; url: string; events: WebhookEvent[] } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const fail = (e: unknown) => setError(getDetailedErrorMessage(e));

  const save = () => {
    if (!edit) return;
    setError(null);
    if (edit.id) update.mutate({ id: edit.id, url: edit.url, events: edit.events }, { onSuccess: () => setEdit(null), onError: fail });
    else create.mutate({ url: edit.url, events: edit.events }, { onSuccess: (r) => { setEdit(null); reveal({ title: "Webhook endpoint created", label: "Signing secret — use it to verify the X-B2B-Signature header", secret: r.data.secret }); }, onError: fail });
  };

  return (
    <PageCard>
      <div className="mb-3 flex items-center justify-between">
        <div><h2 className="font-semibold text-gray-900">Webhook endpoints</h2><p className="text-xs text-gray-500">Signed with HMAC-SHA256: <code>sha256=HMAC(secret, timestamp + "." + body)</code>. Failed deliveries retry with exponential backoff.</p></div>
        <Button onClick={() => { setError(null); setEdit({ url: "", events: ["booking.confirmed", "booking.cancelled"] }); }}>Add endpoint</Button>
      </div>
      {error && !edit && <Alert variant="error" message={error} onClose={() => setError(null)} />}
      {notice && <Alert variant="success" message={notice} onClose={() => setNotice(null)} />}
      <ul className="divide-y divide-gray-100 text-sm">
        {(data?.data ?? []).map((w) => (
          <li key={w.id} className="py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900">{w.url} <Badge label={w.isActive ? "Active" : "Paused"} variant={w.isActive ? "green" : "gray"} size="sm" /></p>
                <p className="text-xs text-gray-500">{w.events.join(", ")}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" size="sm" onClick={() => setExpanded(expanded === w.id ? null : w.id)}>{expanded === w.id ? "Hide log" : "Delivery log"}</Button>
                <Button variant="outline" size="sm" isLoading={test.isPending && test.variables === w.id} onClick={() => test.mutate(w.id, { onSuccess: () => { setNotice("Test event queued — check the delivery log."); setExpanded(w.id); }, onError: fail })}>Send test</Button>
                <Button variant="outline" size="sm" onClick={() => update.mutate({ id: w.id, isActive: !w.isActive }, { onError: fail })}>{w.isActive ? "Pause" : "Resume"}</Button>
                <Button variant="outline" size="sm" onClick={() => { setError(null); setEdit({ id: w.id, url: w.url, events: w.events }); }}>Edit</Button>
                <Button variant="outline" size="sm" onClick={() => rotate.mutate(w.id, { onSuccess: (r) => reveal({ title: "Signing secret rotated", label: "New signing secret (the old one no longer verifies)", secret: r.data.secret }), onError: fail })}>Rotate secret</Button>
                <Button variant="danger" size="sm" onClick={() => del.mutate(w.id, { onError: fail })}>Delete</Button>
              </div>
            </div>
            {expanded === w.id && <Deliveries endpoint={w} />}
          </li>
        ))}
        {data && data.data.length === 0 && <li className="py-3 text-gray-500">No webhook endpoints yet.</li>}
      </ul>

      <Modal isOpen={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "Edit webhook endpoint" : "Add webhook endpoint"} size="lg" footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={save} isLoading={create.isPending || update.isPending} disabled={!edit || !edit.url || edit.events.length === 0}>Save</Button></div>}>
        {edit && (
          <div className="space-y-3">
            {error && <Alert variant="error" message={error} />}
            <Input label="Endpoint URL (https)" value={edit.url} onChange={(e) => setEdit({ ...edit, url: e.target.value })} placeholder="https://example.com/webhooks" />
            <div><p className="mb-1.5 text-sm font-medium text-gray-700">Events</p><EventPicker value={edit.events} onChange={(events) => setEdit({ ...edit, events })} /></div>
          </div>
        )}
      </Modal>
    </PageCard>
  );
}

export default function PartnerDeveloperPage() {
  const [secret, setSecret] = useState<Reveal>(null);
  return (
    <div className="space-y-6">
      <PageHeader title="Developer" />
      <ApiKeys reveal={setSecret} />
      <Webhooks reveal={setSecret} />
      {secret && <SecretOnceModal {...secret} onClose={() => setSecret(null)} />}
    </div>
  );
}
