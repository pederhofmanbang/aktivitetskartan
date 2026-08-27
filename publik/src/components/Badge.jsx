import React from "react";
import { GRANSKNING, KATEGORI_MAP, kategoriOf } from "../model.js";

export function GranskningBadge({ nivå, title }) {
  const g = GRANSKNING[nivå] || GRANSKNING.ai;
  const isKurerad = g.id === "kurerad";
  return (
    <span
      className={"badge " + (isKurerad ? "badge--kurerad" : "badge--ai")}
      title={title || g.kort}
    >
      <span aria-hidden="true">{isKurerad ? "✓" : "◇"}</span>
      {g.label}
    </span>
  );
}

export function KategoriChip({ item }) {
  const k = KATEGORI_MAP[kategoriOf(item)];
  return (
    <span className="kat-chip" style={{ background: k.bg, color: k.color }}>
      {k.label}
    </span>
  );
}
