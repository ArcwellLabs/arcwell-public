import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Printer } from "lucide-react";
import paper from "@/data/whitepaper.json";
import roadmap from "@/data/product-roadmap.json";
import "./whitepaper.css";
export default function Whitepaper() {
  return (
    <article className="wp-page">
      <header className="wp-header">
        <p className="wp-kicker">ARCWELL / WHITEPAPER / V{paper.version}</p>
        <h1>{paper.title}</h1>
        <p className="wp-subtitle">{paper.subtitle}</p>
        <p className="wp-date">{paper.date}</p>
        <p className="wp-abstract">{paper.abstract}</p>
        <div className="wp-actions">
          <button onClick={() => window.print()}>
            <Printer size={16} /> Print or save PDF
          </button>
          <Link to="/roadmap">
            Explore the roadmap <ArrowUpRight size={16} />
          </Link>
        </div>
      </header>
      <nav className="wp-contents" aria-label="Whitepaper contents">
        {paper.sections.map((s) => (
          <a href={`#${s.id}`} key={s.id}>
            {s.kicker.split(" /")[0]} <span>{s.title}</span>
          </a>
        ))}
      </nav>
      {paper.sections.map((s) => (
        <section className="wp-section" key={s.id} id={s.id}>
          <p className="wp-kicker">{s.kicker}</p>
          <h2>{s.title}</h2>
          {s.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
          {s.table && (
            <div className="wp-table-wrap">
              <table>
                <thead>
                  <tr>
                    {s.table.headers.map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {s.table.rows.map((row) => (
                    <tr key={row[0]}>
                      {row.map((v, i) =>
                        i === 0 ? (
                          <th scope="row" key={i}>
                            {v}
                          </th>
                        ) : (
                          <td key={i}>{v}</td>
                        ),
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {s.flow && (
            <ol className="wp-flow">
              {s.flow.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          )}
          {s.roadmap && (
            <div className="wp-roadmap">
              {roadmap.phases.map((p) => (
                <section key={p.id}>
                  <p className="wp-kicker">
                    STAGE {p.number} · {p.status}
                  </p>
                  <h3>{p.short}</h3>
                  <p>{p.description}</p>
                  <ul>
                    {p.deliverables.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                  <p className="wp-gate">
                    <strong>
                      {p.status === "Available" ? "Current boundary" : "Release gate"}:
                    </strong>{" "}
                    {p.gate}
                  </p>
                </section>
              ))}
            </div>
          )}
          {s.references && (
            <ul className="wp-references">
              {s.references.map((r) => (
                <li key={r.url}>
                  <a href={r.url} target="_blank" rel="noreferrer">
                    {r.label} <ArrowUpRight size={14} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
      <footer className="wp-end">
        ARCWELL · Product and technology · Version {paper.version}
        <Link to="/roadmap">Return to roadmap →</Link>
      </footer>
    </article>
  );
}
