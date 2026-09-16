import { useState } from "react";
import {
  ORGANIZATIONS,
  RECORD_SERIES,
  TRANSACTIONS,
  EVIDENCE_BUNDLES,
  VERIFIERS,
  CORRECTIONS,
  API_KEYS,
  WEBHOOKS,
  NETWORK_STATUS,
} from "@/data/dashboard";
import { INTEGRATIONS } from "@/lib/arc-integrations";
import { ChartPanel, Segments } from "./QuantCharts";
import type { DraftRecord } from "./ArcTools";

type Row = { label: string; value: number; detail: string };
const count = (values: string[]): Row[] =>
  [...new Set(values)].map((label) => ({
    label,
    value: values.filter((v) => v === label).length,
    detail: "Count of matching records in the existing sample dataset.",
  }));
export default function LegacyAnalytics({ view, drafts }: { view: string; drafts: DraftRecord[] }) {
  const [metric, setMetric] = useState("Primary"),
    [sort, setSort] = useState("Largest"),
    [selected, setSelected] = useState("");
  const secondary = metric === "Secondary";
  let title = "Registry coverage",
    unit = "records",
    source = "Existing sample registry data",
    names = ["Records", "Flags"];
  let rows: Row[] = ORGANIZATIONS.map((o) => ({
    label: o.code,
    value: secondary ? o.openFlags : o.recordsSubmitted,
    detail: `${o.name} · ${o.jurisdiction} · ${o.status}`,
  }));
  switch (view) {
    case "organizations":
      title = "Organization activity";
      break;
    case "series":
      title = "Series comparison";
      rows = RECORD_SERIES.map((s) => ({
        label: s.code,
        value: secondary ? s.openFlags : s.recordCount,
        detail: `${s.name} · ${s.visibilityPolicy} · ${s.status}`,
      }));
      break;
    case "transactions":
      title = "Transaction distribution";
      names = ["Verification", "Visibility"];
      rows = count(
        TRANSACTIONS.map((t) => (secondary ? t.visibilityPolicy : t.verificationStatus)),
      );
      break;
    case "evidence":
      title = "Evidence footprint";
      names = ["Documents", "Size (MB)"];
      unit = secondary ? "MB" : "documents";
      rows = EVIDENCE_BUNDLES.map((e) => ({
        label: e.id,
        value: secondary ? e.sizeBytes / 1e6 : e.documentCount,
        detail: `${e.transactionIds.length} linked transactions · ${e.encryption} · retain until ${e.retentionUntil}`,
      }));
      break;
    case "verifiers":
      title = "Verifier comparison";
      names = ["Reviews", "Accuracy (%)"];
      unit = secondary ? "%" : "reviews";
      rows = VERIFIERS.map((v) => ({
        label: v.handle,
        value: secondary ? v.accuracy : v.reviews,
        detail: `${v.tier} · ${v.openChallenges} open challenges · reputation ${v.reputation}`,
      }));
      break;
    case "corrections":
      title = "Correction workflow";
      names = ["Status", "Kind"];
      rows = count(CORRECTIONS.map((c) => (secondary ? c.kind : c.status)));
      break;
    case "api":
      title = "API usage";
      names = ["Requests", "Webhook deliveries"];
      unit = secondary ? "deliveries" : "requests";
      rows = secondary
        ? WEBHOOKS.map((w) => ({
            label: w.event,
            value: w.deliveries,
            detail: `${w.failures} failures · ${w.enabled ? "enabled" : "disabled"} · sample webhook`,
          }))
        : API_KEYS.map((k) => ({
            label: k.label,
            value: k.requests30d,
            detail: `${k.status} · 30-day sample usage · ${k.scopes.join(", ")}`,
          }));
      break;
    case "settings":
      title = "Access boundaries";
      names = ["Visibility", "Authorization"];
      rows = count(
        secondary
          ? ORGANIZATIONS.map((o) => o.authorization)
          : TRANSACTIONS.map((t) => t.visibilityPolicy),
      );
      unit = secondary ? "organizations" : "records";
      break;
    case "network":
      title = "Latency sample";
      names = ["Observation", "Grouped"];
      unit = "ms";
      source = "Synthetic latency fixture · live RPC measurements remain in the tools below";
      rows = secondary
        ? Array.from({ length: 4 }, (_, i) => ({
            label: `Group ${i + 1}`,
            value:
              NETWORK_STATUS.slotHistory.slice(i * 8, i * 8 + 8).reduce((a, b) => a + b, 0) / 8,
            detail:
              "Mean of eight synthetic observations. This is not a network service-level measure.",
          }))
        : NETWORK_STATUS.slotHistory.map((v, i) => ({
            label: `Sample ${String(i + 1).padStart(2, "0")}`,
            value: v,
            detail:
              "Synthetic duration for layout inspection. Use Check network below for an actual RPC observation.",
          }));
      break;
    case "integrations":
      title = "Adapter plan";
      names = ["Planned", "Connected"];
      unit = "adapters";
      source = "Current implementation status";
      rows = INTEGRATIONS.map((i) => ({ label: i.name, value: secondary ? 0 : 1, detail: i.need }));
      break;
    case "assets":
    case "payments":
    case "activity":
      title = "Draft distribution";
      names = ["Recipients", "Assets"];
      unit = "drafts";
      source = "Your current session · local drafts only";
      rows = count(
        drafts.map((d) =>
          secondary ? d.asset : `${d.recipient.slice(0, 8)}…${d.recipient.slice(-4)}`,
        ),
      );
      break;
  }
  rows = [...rows].sort((a, b) =>
    sort === "Largest" ? b.value - a.value : a.label.localeCompare(b.label),
  );
  const active = rows.find((r) => r.label === selected) || rows[0],
    max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="q-legacy mb-10">
      <ChartPanel
        title={title}
        meta={source}
        actions={
          <Segments
            label="Summary metric"
            values={names}
            value={secondary ? names[1] : names[0]}
            onChange={(v) => {
              setMetric(v === names[1] ? "Secondary" : "Primary");
              setSelected("");
            }}
          />
        }
      >
        <div className="q-chart-toolbar">
          <span className="q-label">
            {rows.length} groups · {unit}
          </span>
          <Segments
            label="Summary sorting"
            value={sort}
            values={["Largest", "A–Z"]}
            onChange={setSort}
          />
        </div>
        {rows.length ? (
          <div className="q-legacy-layout">
            <div className="q-legacy-bars">
              {rows.map((r) => (
                <button
                  key={r.label}
                  aria-pressed={active?.label === r.label}
                  onClick={() => setSelected(r.label)}
                >
                  <span title={r.label}>{r.label}</span>
                  <div>
                    <i style={{ width: `${(r.value / max) * 100}%` }} />
                  </div>
                  <b>{r.value.toLocaleString("en-US", { maximumFractionDigits: 2 })}</b>
                </button>
              ))}
            </div>
            <div className="q-legacy-detail" aria-live="polite">
              <span className="q-label">{active.label}</span>
              <strong>{active.value.toLocaleString("en-US", { maximumFractionDigits: 2 })}</strong>
              <span className="q-label">{unit}</span>
              <p>{active.detail}</p>
            </div>
          </div>
        ) : (
          <div className="q-empty">
            Create a payment draft to inspect its distribution here. No transactions have been
            submitted.
          </div>
        )}
      </ChartPanel>
    </div>
  );
}
