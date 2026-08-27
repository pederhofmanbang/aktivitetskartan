import React, { useMemo, useState } from "react";
import { DATA, KATEGORIER, kategoriOf, granskningOf } from "../model.js";

// Donut över kategorifördelningen. Palett validerad (CVD-separation, chroma,
// kontrast) — segmenten skiljs med 2 px yt-gap, identitet bärs av legend +
// text, aldrig av färg ensam.
function Donut({ counts, total }) {
  const [hover, setHover] = useState(null);
  const R = 52;
  const r = 34;
  const C = 2 * Math.PI * ((R + r) / 2);
  const stroke = R - r;
  const gapPx = 2;

  let acc = 0;
  const segs = KATEGORIER.map((k) => {
    const n = counts[k.id] || 0;
    const frac = n / total;
    const seg = { ...k, n, start: acc, frac };
    acc += frac;
    return seg;
  });

  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      role="img"
      aria-label={"Fördelning per kategori: " + segs.map((s) => `${s.label} ${s.n}`).join(", ")}
    >
      {segs.map((s) => {
        const len = Math.max(s.frac * C - gapPx, 1);
        return (
          <circle
            key={s.id}
            cx="60"
            cy="60"
            r={(R + r) / 2}
            fill="none"
            stroke={s.color}
            strokeWidth={hover === s.id ? stroke + 4 : stroke}
            strokeDasharray={`${len} ${C - len}`}
            strokeDashoffset={-s.start * C - gapPx / 2 + C / 4}
            onMouseEnter={() => setHover(s.id)}
            onMouseLeave={() => setHover(null)}
          >
            <title>{`${s.label}: ${s.n} initiativ`}</title>
          </circle>
        );
      })}
      <text x="60" y="56" textAnchor="middle" fontSize="20" fontWeight="700" fill="#111827">
        {total}
      </text>
      <text x="60" y="74" textAnchor="middle" fontSize="10" fill="#6b7280">
        initiativ
      </text>
    </svg>
  );
}

export default function StatsPanel({ overrides }) {
  const stats = useMemo(() => {
    const counts = {};
    let kurerade = 0;
    for (const item of DATA) {
      const k = kategoriOf(item);
      counts[k] = (counts[k] || 0) + 1;
      if (granskningOf(overrides[item.nr]) === "kurerad") kurerade++;
    }
    return { counts, kurerade };
  }, [overrides]);

  return (
    <div className="stats">
      <div className="donut-wrap">
        <Donut counts={stats.counts} total={DATA.length} />
        <ul className="donut-legend">
          {KATEGORIER.map((k) => (
            <li key={k.id}>
              <span className="dot" style={{ background: k.color }} aria-hidden="true" />
              {k.label}
              <span className="count">{stats.counts[k.id] || 0}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="stats__tiles">
        <div className="stat-tile">
          <div className="stat-tile__value">{DATA.length}</div>
          <div className="stat-tile__label">initiativ på kartan</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile__value">{stats.kurerade}</div>
          <div className="stat-tile__label">kurerade (människa + AI)</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile__value">{DATA.length - stats.kurerade}</div>
          <div className="stat-tile__label">AI-sammanställda</div>
        </div>
      </div>
      <div className="stats__figure" aria-hidden="true">
        <img src="/figurer/navet.png" alt="" loading="lazy" />
      </div>
    </div>
  );
}
