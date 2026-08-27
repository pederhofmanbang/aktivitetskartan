import React, { useMemo } from "react";
import { DATA, KATEGORIER, kategoriOf } from "../model.js";
import { useRouter } from "../router.jsx";

const FK = ["Regionerna", "Stat, inkl myndigheter och/eller privat", "EU"];
const FK_SHORT = ["Regionerna", "Stat/privat", "EU"];

export default function Matrix({ overrides }) {
  const { navigate } = useRouter();

  const cells = useMemo(() => {
    const m = {};
    for (const item of DATA) {
      const key = kategoriOf(item) + "|" + item.fk;
      (m[key] = m[key] || []).push(item);
    }
    return m;
  }, []);

  const openCell = (katLabel, fk) => {
    const p = new URLSearchParams();
    p.set("kat", katLabel);
    p.set("fk", fk);
    navigate("/?" + p.toString());
  };

  return (
    <div className="container matrixpage">
      <h1>Matris</h1>
      <p className="sub">
        Alla {DATA.length} initiativ fördelade på kategori och finansieringskälla.
        Klicka på en ruta för att öppna urvalet i kartan.
      </p>
      <div className="tablewrap">
        <table className="matrix">
          <thead>
            <tr>
              <th scope="col"></th>
              {FK_SHORT.map((fk) => (
                <th key={fk} scope="col">{fk}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {KATEGORIER.map((k) => (
              <tr key={k.id}>
                <th scope="row" className="rowhead" style={{ color: k.color }}>
                  {k.label}
                </th>
                {FK.map((fk, i) => {
                  const items = cells[k.id + "|" + fk] || [];
                  const examples = items
                    .slice(0, 2)
                    .map((it) => (it.n.length > 46 ? it.n.slice(0, 46) + "…" : it.n));
                  return (
                    <td key={fk}>
                      <button
                        className="matrix-cell"
                        onClick={() => openCell(k.label, fk)}
                        aria-label={`${k.label} × ${FK_SHORT[i]}: ${items.length} initiativ — öppna i kartan`}
                      >
                        <span className="n" style={{ color: k.color }}>{items.length}</span>
                        {examples.map((ex, j) => (
                          <span key={j} className="ex">{ex}</span>
                        ))}
                        {items.length > 2 && <span className="ex">+ {items.length - 2} till</span>}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
