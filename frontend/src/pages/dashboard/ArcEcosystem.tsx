import { useEffect, useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import type { EcosystemSearch } from "../../../../src/arc-ecosystem";

export function useArcEcosystem(query: string, enabled = true) {
  const [data, setData] = useState<EcosystemSearch | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setData(null);
    setError("");
    setBusy(false);
    if (!enabled) return;
    const controller = new AbortController();
    setBusy(true);
    const timer = window.setTimeout(() => {
      void fetch("/api/assets?" + new URLSearchParams({ kind: "ecosystem", q: query.trim() }), {
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) throw new Error("Ecosystem search is unavailable.");
          const body = await response.json();
          if (!controller.signal.aborted) setData(body);
        })
        .catch((error) => {
          if (!controller.signal.aborted)
            setError(error instanceof Error ? error.message : "Search unavailable.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setBusy(false);
        });
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, enabled]);
  return { data, error, busy };
}
export default function ArcEcosystem({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState("All");
  const { data, error, busy } = useArcEcosystem(query);
  const items =
    data?.items.filter(
      (item) =>
        filter === "All" ||
        (filter === "Launch announcements"
          ? item.status === "launch-announced"
          : item.status === "ecosystem-listed"),
    ) || [];
  return (
    <section className="aw-ecosystem" aria-label="Arc projects and launches">
      <div className="aw-ecosystem-heading">
        <div>
          <h2>Building on Arc</h2>
          <p>Discover projects, applications and announced integrations across the ecosystem.</p>
        </div>
        <a href="https://www.arc.io/ecosystem" target="_blank" rel="noreferrer">
          Official directory <ArrowUpRight size={15} />
        </a>
      </div>
      <label className="aw-ecosystem-search">
        <Search size={17} />
        <input
          type="search"
          aria-label="Search Arc projects"
          placeholder="Find a project or application…"
          value={query}
          maxLength={100}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <div className="aw-search-kinds" role="group" aria-label="Project coverage">
        {["All", "Launch announcements", "Directory listings"].map((value) => (
          <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>
            {value}
          </button>
        ))}
      </div>
      <p role="status">
        {busy
          ? "Searching ecosystem sources…"
          : error ||
            `${items.length} ${items.length === 1 ? "match" : "matches"} · ${data?.total || 0} sourced projects`}
      </p>
      {data?.status !== "current" && data && (
        <p className="ar-alert">
          Official directory temporarily unavailable.{" "}
          {data.status === "stale"
            ? "Showing the last retrieved directory and dated announcements."
            : "Only reviewed launch announcements are available."}
        </p>
      )}
      <div className="aw-ecosystem-grid">
        {items.map((item) => (
          <article key={item.id}>
            <span>
              {item.status === "launch-announced" ? "Launch announcement" : "Ecosystem listed"}
            </span>
            <h3>{item.name}</h3>
            <p>
              {item.status === "launch-announced"
                ? `Named in Circle’s ${item.evidenceDate} Arc launch announcement.`
                : "Listed in the official Arc ecosystem. Launch status is not published in this directory."}
            </p>
            <a href={item.sourceUrl} target="_blank" rel="noreferrer">
              View source <ArrowUpRight size={14} />
            </a>
          </article>
        ))}
      </div>
      {data && !busy && !items.length && (
        <p>No sourced projects match. An unlisted project may still be building on Arc.</p>
      )}
      <p className="aw-ecosystem-coverage">
        {data?.coverage}{" "}
        {data?.observedAt
          ? `Directory retrieved ${new Date(data.observedAt).toLocaleString()}.`
          : ""}
      </p>
    </section>
  );
}
