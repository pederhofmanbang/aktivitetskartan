import React, { useEffect, useMemo, useState } from "react";
import {
  DATA, FACETS, GRANSKNING, KATEGORI_MAP, kategoriOf, granskningOf,
  maturityOf, maturityLabel, fieldValue, applyFilters, facetCounts, sortItems, SORTS,
  selectionsToParams, paramsToSelections,
} from "../model.js";
import { Link } from "../router.jsx";
import { GranskningBadge, KategoriChip } from "./Badge.jsx";
import StatsPanel from "./StatsPanel.jsx";

const GR_LABELS = { alla: "Alla", kurerad: "Kurerade", ai: "AI-sammanställda" };

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" />
    </svg>
  );
}

function Facets({ counts, selections, toggle, clearAll, activeCount }) {
  return (
    <aside className="facets" aria-label="Filtrera initiativen">
      <div className="facets__head">
        <h2>Filtrera</h2>
        {activeCount > 0 && (
          <button className="facets__clear" onClick={clearAll}>
            Rensa alla
          </button>
        )}
      </div>
      {FACETS.filter((f) => f.id !== "gr").map((facet) => {
        const cmap = counts[facet.id] || new Map();
        const entries = [...cmap.entries()].sort((a, b) => b[1] - a[1]);
        // Valda värden som fallit ur räkningen visas ändå (annars går de inte att bocka ur).
        for (const v of selections[facet.id] || []) {
          if (!cmap.has(v)) entries.push([v, 0]);
        }
        if (entries.length === 0) return null;
        const nSel = selections[facet.id]?.size || 0;
        return (
          <details key={facet.id} className="facet" open={nSel > 0}>
            <summary>
              <span>
                {facet.label}
                {nSel > 0 && <span className="facet__count-badge">{nSel}</span>}
              </span>
            </summary>
            {entries.map(([value, count]) => (
              <label key={value}>
                <input
                  type="checkbox"
                  checked={selections[facet.id]?.has(value) || false}
                  onChange={() => toggle(facet.id, value)}
                />
                <span className="val">{value}</span>
                <span className="cnt">{count}</span>
              </label>
            ))}
          </details>
        );
      })}
    </aside>
  );
}

function Card({ item, ov }) {
  const k = KATEGORI_MAP[kategoriOf(item)];
  const m = maturityOf(item, ov);
  // Override-lagret vinner även på korten.
  const name = fieldValue(item, "n", ov);
  const ans = fieldValue(item, "ans", ov) || "—";
  return (
    <Link to={`/initiativ/${item.nr}`} className="card" style={{ borderLeftColor: k.color }}>
      <div className="card__meta">
        <KategoriChip item={item} />
        <GranskningBadge nivå={granskningOf(ov)} />
        <span>Nr {item.nr}</span>
      </div>
      <h3>{name}</h3>
      <dl className="card__facts">
        <div>
          <dt>Mognadsgrad:</dt> <dd>{m ? maturityLabel(m) : fieldValue(item, "st", ov) || "—"}</dd>
        </div>
        <div>
          <dt>Ansvarig:</dt>{" "}
          <dd>{ans.length > 90 ? ans.slice(0, 90) + "…" : ans}</dd>
        </div>
      </dl>
    </Link>
  );
}

function ListTable({ items, overrides }) {
  return (
    <div className="tablewrap">
      <table className="listtable">
        <thead>
          <tr>
            <th>Nr</th>
            <th>Initiativ</th>
            <th>Kategori</th>
            <th>Granskning</th>
            <th>Mognadsgrad</th>
            <th>Finansieringskälla</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const ov = overrides[item.nr];
            const m = maturityOf(item, ov);
            return (
              <tr key={item.nr}>
                <td>{item.nr}</td>
                <td>
                  <Link to={`/initiativ/${item.nr}`}>{fieldValue(item, "n", ov)}</Link>
                </td>
                <td>
                  <KategoriChip item={item} />
                </td>
                <td>
                  <GranskningBadge nivå={granskningOf(ov)} />
                </td>
                <td>{m ? maturityLabel(m) : "—"}</td>
                <td>{item.fk}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function Explorer({ overrides }) {
  const initial = useMemo(
    () => paramsToSelections(new URLSearchParams(window.location.search)),
    []
  );
  const [q, setQ] = useState(initial.q);
  const [selections, setSelections] = useState(initial.selections);
  const [sortId, setSortId] = useState(initial.sortId);
  const [view, setView] = useState(initial.view);

  // Synka state till URL:en så varje urval går att dela som länk.
  useEffect(() => {
    const p = selectionsToParams(q, selections, sortId, view);
    const qs = p.toString();
    const url = window.location.pathname + (qs ? "?" + qs : "");
    window.history.replaceState(null, "", url);
  }, [q, selections, sortId, view]);

  const toggle = (facetId, value) => {
    setSelections((prev) => {
      const next = { ...prev, [facetId]: new Set(prev[facetId] || []) };
      if (next[facetId].has(value)) next[facetId].delete(value);
      else next[facetId].add(value);
      return next;
    });
  };
  const clearAll = () => {
    setQ("");
    setSelections(Object.fromEntries(FACETS.map((f) => [f.id, new Set()])));
  };

  const grSel = selections.gr || new Set();
  const grMode = grSel.size === 1 ? (grSel.has("Kurerad") ? "kurerad" : "ai") : "alla";
  const setGrMode = (mode) => {
    setSelections((prev) => ({
      ...prev,
      gr: mode === "alla" ? new Set() : new Set([GRANSKNING[mode].label]),
    }));
  };

  const filtered = useMemo(
    () => applyFilters(DATA, overrides, q, selections),
    [overrides, q, selections]
  );
  const counts = useMemo(
    () => facetCounts(DATA, overrides, q, selections),
    [overrides, q, selections]
  );
  const items = useMemo(
    () => sortItems(filtered, sortId, overrides),
    [filtered, sortId, overrides]
  );

  const activeCount =
    Object.values(selections).reduce((acc, s) => acc + (s?.size || 0), 0) + (q ? 1 : 0);

  const activeChips = [];
  if (q) activeChips.push({ label: `Sök: ${q}`, clear: () => setQ("") });
  for (const facet of FACETS) {
    for (const v of selections[facet.id] || []) {
      activeChips.push({ label: v, clear: () => toggle(facet.id, v) });
    }
  }

  return (
    <>
      <header className="hero">
        <div className="container hero__grid">
          <div>
            <h1>Hälsodatakartan</h1>
            <p className="lead">
              {DATA.length} svenska hälsodatainitiativ — infrastruktur för
              datadelning, kvalitetsregister, samverkan, superdatorcentra och
              lagstiftning — kartlagda, kategoriserade och sökbara på ett
              ställe.
            </p>
            <p style={{ fontSize: "0.88rem", color: "#55504a", maxWidth: 640, marginBottom: 22 }}>
              Innehållet är under kontinuerlig utveckling och kurering.
              Hälsodatakartan är framtagen som en del av den regiongemensamma
              samarbetsplattformen inom AI, som samordnas av SKR.
            </p>
            <div className="searchbox">
              <SearchIcon />
              <input
                type="search"
                placeholder="Sök på namn, innehåll, aktör eller nummer …"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Sök bland initiativen"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="container">
        <StatsPanel overrides={overrides} />

        <div className="explorer">
          <Facets
            counts={counts}
            selections={selections}
            toggle={toggle}
            clearAll={clearAll}
            activeCount={activeCount}
          />
          <div>
            <div className="toolbar">
              <span className="toolbar__count" aria-live="polite">
                {items.length} initiativ
              </span>
              <div className="seg" role="group" aria-label="Filtrera på granskningsnivå">
                {["alla", "kurerad", "ai"].map((mode) => (
                  <button
                    key={mode}
                    aria-pressed={grMode === mode}
                    onClick={() => setGrMode(mode)}
                  >
                    {GR_LABELS[mode]}
                  </button>
                ))}
              </div>
              <label style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                Sortera:{" "}
                <select value={sortId} onChange={(e) => setSortId(e.target.value)}>
                  {SORTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="viewtoggle" role="group" aria-label="Välj vy">
                <button aria-pressed={view === "grid"} onClick={() => setView("grid")}>
                  ▦ Kort
                </button>
                <button aria-pressed={view === "list"} onClick={() => setView("list")}>
                  ☰ Lista
                </button>
              </div>
            </div>

            <div className="chips">
              {activeChips.map((c, i) => (
                <span key={i} className="chip">
                  {c.label}
                  <button onClick={c.clear} aria-label={`Ta bort filtret ${c.label}`}>
                    ×
                  </button>
                </span>
              ))}
            </div>

            {items.length === 0 ? (
              <div className="empty">
                <img src="/figurer/uppfoljaren.png" alt="" />
                <p>
                  Inga initiativ matchar din sökning.{" "}
                  <button className="facets__clear" onClick={clearAll}>
                    Rensa filtren
                  </button>{" "}
                  eller{" "}
                  <Link to="/foresla">föreslå ett initiativ som saknas</Link>.
                </p>
              </div>
            ) : view === "grid" ? (
              <div className="cardgrid">
                {items.map((item) => (
                  <Card key={item.nr} item={item} ov={overrides[item.nr]} />
                ))}
              </div>
            ) : (
              <ListTable items={items} overrides={overrides} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
