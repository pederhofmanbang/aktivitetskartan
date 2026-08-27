import React, { useMemo, useState } from "react";
import {
  DATA, KATEGORI_MAP, kategoriOf, granskningOf, GRANSKNING,
  maturityOf, maturityLabel, fieldValue, PRIO_SECTIONS, PRIO_ONLY_FIELDS,
  SUGGESTABLE_FIELDS, CAT_COLORS, SUB_LABELS, ehdsOf,
} from "../model.js";
import { Link } from "../router.jsx";
import { GranskningBadge, KategoriChip } from "./Badge.jsx";
import { submitForslag } from "../api.js";

const byNr = new Map(DATA.map((d) => [d.nr, d]));

function ScoreRows({ rows }) {
  return (
    <table className="score-table">
      <tbody>
        {rows.map((r) => (
          <tr key={r.name}>
            <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{r.name}</td>
            <td className="score-dots" aria-label={`${r.score} av 3`}>
              {"●".repeat(r.score)}
              {"○".repeat(Math.max(0, 3 - r.score))}
            </td>
            <td style={{ color: "#6b7280" }}>{r.comment}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SuggestPanel({ item }) {
  const [falt, setFalt] = useState("");
  const [forslag, setForslag] = useState("");
  const [kalla, setKalla] = useState("");
  const [namn, setNamn] = useState("");
  const [epost, setEpost] = useState("");
  const [org, setOrg] = useState("");
  const [hp, setHp] = useState("");
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!forslag.trim()) return;
    setBusy(true);
    setStatus(null);
    try {
      await submitForslag("andring", {
        nr: item.nr,
        initiativ: item.n,
        falt: SUGGESTABLE_FIELDS.find((f) => f.key === falt)?.label || "Allmänt",
        forslag, kalla, namn, epost, organisation: org,
        webbplats: hp,
      });
      setStatus({ ok: true, msg: "Tack! Ditt förslag är inskickat och granskas manuellt innan något ändras." });
      setForslag(""); setKalla("");
    } catch (err) {
      setStatus({ ok: false, msg: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="suggest-panel" id="foresla-andring">
      <h2>Föreslå en ändring</h2>
      <p style={{ fontSize: "0.92rem", color: "#4b5563", marginBottom: 12 }}>
        Ser du något som är fel, inaktuellt eller saknas? Skicka in ett förslag —
        det granskas manuellt innan kartan uppdateras.
      </p>
      <form className="form" onSubmit={submit} style={{ background: "transparent", border: "none", padding: 0 }}>
        <label>
          Vad gäller förslaget?
          <select value={falt} onChange={(e) => setFalt(e.target.value)}>
            {SUGGESTABLE_FIELDS.map((f) => (
              <option key={f.key} value={f.key}>{f.label}</option>
            ))}
          </select>
        </label>
        <label>
          Förslag till ändring
          <textarea
            required
            value={forslag}
            onChange={(e) => setForslag(e.target.value)}
            maxLength={4000}
            placeholder="Beskriv vad som bör ändras och till vad."
          />
        </label>
        <label>
          Källa eller länk <span className="opt">(frivilligt men värdefullt)</span>
          <input value={kalla} onChange={(e) => setKalla(e.target.value)} maxLength={500} />
        </label>
        <div className="row2">
          <label>
            Namn <span className="opt">(frivilligt)</span>
            <input value={namn} onChange={(e) => setNamn(e.target.value)} maxLength={200} />
          </label>
          <label>
            E-post <span className="opt">(frivilligt — om du vill ha återkoppling)</span>
            <input type="email" value={epost} onChange={(e) => setEpost(e.target.value)} maxLength={200} />
          </label>
        </div>
        <label>
          Organisation <span className="opt">(frivilligt)</span>
          <input value={org} onChange={(e) => setOrg(e.target.value)} maxLength={200} />
        </label>
        <label className="hp" aria-hidden="true">
          Lämna fältet tomt
          <input tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
        </label>
        <div>
          <button className="btn btn--primary" disabled={busy || !forslag.trim()}>
            {busy ? "Skickar …" : "Skicka förslaget"}
          </button>
        </div>
        {status && (
          <p className={"form__status " + (status.ok ? "form__status--ok" : "form__status--err")} role="status">
            {status.msg}
          </p>
        )}
      </form>
    </section>
  );
}

export default function Detail({ nr, overrides }) {
  const item = byNr.get(nr);
  const ov = overrides[nr];

  const prioSections = useMemo(() => {
    if (!item) return [];
    return PRIO_SECTIONS.map((sec) => ({
      title: sec.title,
      fields: sec.fields
        .map((f) => ({ ...f, value: fieldValue(item, f.key, ov) }))
        .filter((f) => f.value && (PRIO_ONLY_FIELDS.has(f.key) || ov?.fields?.[f.key])),
    })).filter((sec) => sec.fields.length > 0);
  }, [item, ov]);

  if (!item) {
    return (
      <div className="container detail">
        <p>Initiativet hittades inte.</p>
        <Link to="/" className="detail__back">← Till kartan</Link>
      </div>
    );
  }

  const k = KATEGORI_MAP[kategoriOf(item)];
  const g = GRANSKNING[granskningOf(ov)];
  const m = maturityOf(item, ov);
  const deps = (item.dep || "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => byNr.has(n));
  const connections = (ov?.connections || []).filter((c) => byNr.has(c.nr));
  const jurisdiktioner = [
    ...(ov?.jurisdictions || []),
    ...(item.jurisdiktioner ? item.jurisdiktioner.split(",").map((s) => s.trim()) : []),
  ];
  const unikaJur = [...new Set(jurisdiktioner)].filter(Boolean);
  const sources = (ov?.sources || []).filter(Boolean);

  return (
    <div className="container detail">
      <Link to="/" className="detail__back">← Till kartan</Link>
      <header className="detail__head" style={{ borderLeftColor: k.color }}>
        <div className="detail__meta">
          <KategoriChip item={item} />
          <GranskningBadge nivå={g.id} />
          <span style={{ color: "#6b7280", fontSize: "0.85rem" }}>
            Nr {item.nr} · {SUB_LABELS[item.sub] || item.sub}
          </span>
        </div>
        <h1>{item.n}</h1>
      </header>

      <p className="granskning-note">
        <strong>{g.label}:</strong> {g.desc}{" "}
        <a href="#foresla-andring">Föreslå en ändring ↓</a>
      </p>

      <dl className="factgrid">
        <div><dt>Ansvarig</dt><dd>{item.ans || "—"}</dd></div>
        <div><dt>Finansieringskälla</dt><dd>{item.fk || "—"}</dd></div>
        <div><dt>Finansiering</dt><dd>{item.fin || "—"}</dd></div>
        <div><dt>Tidplan</dt><dd>{item.tid || "—"}</dd></div>
        <div><dt>Mognadsgrad</dt><dd>{m ? maturityLabel(m) : "—"}{item.st ? ` (${item.st})` : ""}</dd></div>
        <div><dt>EHDS-relevans</dt><dd>{ehdsOf(item) || "—"}</dd></div>
      </dl>

      {item.nk && (
        <section>
          <h2>Beskrivning</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>{fieldValue(item, "nk", ov)}</p>
        </section>
      )}

      {(item.fok || item.mg) && (
        <section>
          <h2>Fokus och målgrupp</h2>
          {item.fok && (
            <div className="fieldrow"><h3>Hälsodatafokus</h3><p>{fieldValue(item, "fok", ov)}</p></div>
          )}
          {item.mg && (
            <div className="fieldrow"><h3>Målgrupp</h3><p>{fieldValue(item, "mg", ov)}</p></div>
          )}
        </section>
      )}

      {(item.tek || item.ds) && (
        <section>
          <h2>Teknik och standarder</h2>
          {item.tek && (
            <div className="fieldrow"><h3>Teknisk miljö</h3><p>{fieldValue(item, "tek", ov)}</p></div>
          )}
          {item.ds && (
            <div className="fieldrow"><h3>Datastandarder</h3><p>{fieldValue(item, "ds", ov)}</p></div>
          )}
          {ov?.tags?.standarder?.length > 0 && (
            <div className="conn-list" style={{ marginTop: 8 }}>
              {ov.tags.standarder.map((s) => (
                <span key={s} className="kat-chip" style={{ background: "#dfefeb", color: "#115e67" }}>{s}</span>
              ))}
            </div>
          )}
        </section>
      )}

      {item.akt && (
        <section>
          <h2>Aktörer</h2>
          <p>{fieldValue(item, "akt", ov)}</p>
        </section>
      )}

      {Array.isArray(item.nytta) && item.nytta.length > 0 && (
        <section>
          <h2>Nytta</h2>
          <ul className="nytta-list">
            {item.nytta.map((n, i) => (
              <li key={i}>
                <span className="level">{n.level}</span>
                <span>{n.text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {prioSections.length > 0 && (
        <section>
          <h2>Fördjupning</h2>
          <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: 12 }}>
            Fördjupade uppgifter från den kurerade genomgången.
          </p>
          {prioSections.map((sec) => (
            <div key={sec.title} style={{ marginBottom: 18 }}>
              <h3 style={{ fontSize: "1rem", color: "#374151", marginBottom: 6 }}>{sec.title}</h3>
              {sec.fields.map((f) => (
                <div className="fieldrow" key={f.key}>
                  <h3>{f.label}</h3>
                  <p>{f.value}</p>
                </div>
              ))}
            </div>
          ))}
        </section>
      )}

      {unikaJur.length > 0 && (
        <section>
          <h2>Juridiska ramverk</h2>
          <div className="conn-list">
            {unikaJur.map((j) => (
              <span key={j} className="kat-chip" style={{ background: "#f7f2eb", color: "#262422" }}>{j}</span>
            ))}
          </div>
        </section>
      )}

      {(deps.length > 0 || connections.length > 0) && (
        <section>
          <h2>Kopplingar till andra initiativ</h2>
          {connections.length > 0 && (
            <>
              <h3 style={{ fontSize: "0.9rem", color: "#374151", margin: "6px 0" }}>Kurerade kopplingar</h3>
              <ul className="conn-list">
                {connections.map((c) => (
                  <li key={c.nr}>
                    <Link to={`/initiativ/${c.nr}`}>
                      {(c.cats || []).length > 0 && (
                        <span className="conn-cat" style={{ color: CAT_COLORS[c.cats[0]] || "#6b7280" }}>
                          {c.cats.join(" · ")}
                        </span>
                      )}
                      {byNr.get(c.nr).n.length > 60 ? byNr.get(c.nr).n.slice(0, 60) + "…" : byNr.get(c.nr).n}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          {deps.length > 0 && (
            <>
              <h3 style={{ fontSize: "0.9rem", color: "#374151", margin: "12px 0 6px" }}>Relaterade initiativ</h3>
              <ul className="conn-list">
                {deps.map((n) => (
                  <li key={n}>
                    <Link to={`/initiativ/${n}`}>
                      {byNr.get(n).n.length > 60 ? byNr.get(n).n.slice(0, 60) + "…" : byNr.get(n).n}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {item.datafordj && (
        <section>
          <h2>Datafördjupning</h2>
          <dl className="factgrid">
            {Object.entries(item.datafordj)
              .filter(([, v]) => v)
              .map(([key, value]) => (
                <div key={key}><dt>{key}</dt><dd>{String(value)}</dd></div>
              ))}
          </dl>
        </section>
      )}

      {(item.ai?.length > 0 || item.kchd?.length > 0) && (
        <section>
          <details className="scores">
            <summary>Relevansbedömning (AI-potential och KCHD-relevans)</summary>
            {item.ai?.length > 0 && (
              <>
                <h3 style={{ fontSize: "0.88rem", margin: "12px 0 4px" }}>AI-potential</h3>
                <ScoreRows rows={item.ai} />
              </>
            )}
            {item.kchd?.length > 0 && (
              <>
                <h3 style={{ fontSize: "0.88rem", margin: "12px 0 4px" }}>KCHD-relevans</h3>
                <ScoreRows rows={item.kchd} />
              </>
            )}
          </details>
        </section>
      )}

      {sources.length > 0 && (
        <section>
          <h2>Källor</h2>
          <ul>
            {sources.map((s, i) => (
              <li key={i}>
                {String(s).startsWith("http") ? (
                  <a href={s} rel="noopener noreferrer" target="_blank">{s}</a>
                ) : (
                  String(s)
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {item.korr && (
        <section>
          <h2>Korrigering</h2>
          <p>{item.korr}</p>
        </section>
      )}

      <SuggestPanel item={item} />
    </div>
  );
}
