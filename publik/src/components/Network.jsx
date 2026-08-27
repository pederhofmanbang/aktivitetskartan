import React, { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { DATA, KATEGORIER, KATEGORI_MAP, kategoriOf } from "../model.js";
import { useRouter } from "../router.jsx";

// Nätverkskartan (beta) — d3-kraftgraf över beroendekopplingarna i DATA.dep,
// med samma mekanik som interna appen: fokusnoder via sökfältet, hoppdjup
// 1–3 som expanderar grannskapet, och hover som tänder ett grannskap.

function buildGraph() {
  const valid = new Set(DATA.map((d) => d.nr));
  const adj = new Map(DATA.map((d) => [d.nr, new Set()]));
  const links = [];
  const seen = new Set();
  for (const d of DATA) {
    for (const raw of (d.dep || "").split(",")) {
      const t = Number(raw.trim());
      if (!t || !valid.has(t) || t === d.nr) continue;
      const key = Math.min(d.nr, t) + "-" + Math.max(d.nr, t);
      if (seen.has(key)) continue;
      seen.add(key);
      links.push({ source: d.nr, target: t });
      adj.get(d.nr).add(t);
      adj.get(t).add(d.nr);
    }
  }
  const nodes = DATA.map((d) => ({
    id: d.nr,
    name: d.n,
    kat: kategoriOf(d),
    degree: adj.get(d.nr).size,
  }));
  return { nodes, links, adj };
}

export default function Network() {
  const { navigate } = useRouter();
  const svgRef = useRef(null);
  const wrapRef = useRef(null);
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState([]); // nr:n i fokus
  const [hops, setHops] = useState(1);
  const [size, setSize] = useState({ w: 900, h: 600 });

  const graph = useMemo(buildGraph, []);
  const byNr = useMemo(() => new Map(graph.nodes.map((n) => [n.id, n])), [graph]);

  // Autocomplete-träffar för sökfältet.
  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return graph.nodes
      .filter((n) => !focus.includes(n.id) && (n.name.toLowerCase().includes(s) || String(n.id) === s))
      .slice(0, 8);
  }, [q, focus, graph]);

  // Synligt delgraf: allt, eller fokusnodernas grannskap inom N hopp.
  const visible = useMemo(() => {
    if (focus.length === 0) return null;
    const keep = new Set(focus);
    let frontier = [...focus];
    for (let i = 0; i < hops; i++) {
      const next = [];
      for (const nr of frontier) {
        for (const nb of graph.adj.get(nr) || []) {
          if (!keep.has(nb)) {
            keep.add(nb);
            next.push(nb);
          }
        }
      }
      frontier = next;
    }
    return keep;
  }, [focus, hops, graph]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: Math.max(480, Math.min(760, window.innerHeight - 300)) });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const { w, h } = size;

    const g = svg.append("g");
    svg.call(
      d3.zoom().scaleExtent([0.2, 4]).on("zoom", (ev) => g.attr("transform", ev.transform))
    );

    const focusSet = new Set(focus);
    const nodes = graph.nodes
      .filter((n) => !visible || visible.has(n.id))
      .map((n) => ({ ...n }));
    const nodeIds = new Set(nodes.map((n) => n.id));
    const links = graph.links
      .filter((l) => nodeIds.has(l.source) && nodeIds.has(l.target))
      .map((l) => ({ ...l }));

    const sim = d3
      .forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d) => d.id).distance(visible ? 70 : 46).strength(0.5))
      .force("charge", d3.forceManyBody().strength(visible ? -180 : -60))
      .force("center", d3.forceCenter(w / 2, h / 2))
      .force("collide", d3.forceCollide().radius((d) => 8 + Math.min(d.degree, 10)));

    const link = g
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#d5d0c8")
      .attr("stroke-width", 1);

    const r = (d) => (focusSet.has(d.id) ? 14 : 5 + Math.min(d.degree, 10));

    const node = g
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", r)
      .attr("fill", (d) => KATEGORI_MAP[d.kat].color)
      .attr("stroke", (d) => (focusSet.has(d.id) ? "#262422" : "#fff"))
      .attr("stroke-width", (d) => (focusSet.has(d.id) ? 3 : 1.5))
      .style("cursor", "pointer")
      .call(
        d3
          .drag()
          .on("start", (ev, d) => {
            if (!ev.active) sim.alphaTarget(0.2).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (ev, d) => {
            d.fx = ev.x;
            d.fy = ev.y;
          })
          .on("end", (ev, d) => {
            if (!ev.active) sim.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      )
      .on("click", (ev, d) => navigate(`/initiativ/${d.id}`));

    node.append("title").text((d) => `${d.name} (nr ${d.id}) — klicka för detaljer`);

    // Etiketter: alla när delgrafen är liten, annars fokus + nav med många kopplingar.
    const showAllLabels = nodes.length <= 60;
    const label = g
      .append("g")
      .selectAll("text")
      .data(nodes.filter((d) => showAllLabels || focusSet.has(d.id) || d.degree >= 8))
      .join("text")
      .text((d) => (d.name.length > 34 ? d.name.slice(0, 34) + "…" : d.name))
      .attr("font-size", 10.5)
      .attr("font-weight", (d) => (focusSet.has(d.id) ? 700 : 400))
      .attr("fill", "#262422")
      .attr("paint-order", "stroke")
      .attr("stroke", "#fffdf9")
      .attr("stroke-width", 3)
      .attr("pointer-events", "none");

    // Hover tänder grannskapet utan att röra simuleringen.
    const neighborsOf = (id) => graph.adj.get(id) || new Set();
    node
      .on("mouseenter", (ev, d) => {
        const hood = neighborsOf(d.id);
        node.attr("opacity", (n) => (n.id === d.id || hood.has(n.id) ? 1 : 0.15));
        link
          .attr("stroke", (l) => (l.source.id === d.id || l.target.id === d.id ? "#262422" : "#d5d0c8"))
          .attr("stroke-width", (l) => (l.source.id === d.id || l.target.id === d.id ? 1.8 : 1))
          .attr("opacity", (l) => (l.source.id === d.id || l.target.id === d.id ? 1 : 0.15));
        label.attr("opacity", (n) => (n.id === d.id || hood.has(n.id) ? 1 : 0.1));
      })
      .on("mouseleave", () => {
        node.attr("opacity", 1);
        link.attr("stroke", "#d5d0c8").attr("stroke-width", 1).attr("opacity", 1);
        label.attr("opacity", 1);
      });

    sim.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);
      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      label.attr("x", (d) => d.x + r(d) + 4).attr("y", (d) => d.y + 3);
    });

    return () => sim.stop();
  }, [graph, size, focus, hops, visible, navigate]);

  const addFocus = (nr) => {
    setFocus((f) => (f.includes(nr) ? f : [...f, nr]));
    setQ("");
  };

  return (
    <div className="container networkpage">
      <h1 style={{ fontSize: "1.7rem", marginBottom: 8 }}>
        Nätverkskartan <span className="nav__beta">Beta</span>
      </h1>
      <div className="network-banner">
        <strong>Betaversion.</strong>
        <span>
          Kartan visar beroenden och kopplingar mellan initiativen. Sök och
          välj ett initiativ för att fokusera på dess grannskap; hoppdjupet
          styr hur långt kopplingarna följs. Kopplingarna bygger delvis på
          AI-sammanställt underlag — betrakta kartan som en översikt, inte en
          fastställd bild.
        </span>
      </div>
      <div className="network-shell">
        <div className="network-toolbar">
          <div style={{ position: "relative" }}>
            <input
              type="search"
              placeholder="Sök initiativ att fokusera på …"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && matches.length > 0) addFocus(matches[0].id);
              }}
              aria-label="Sök initiativ att fokusera på i nätverkskartan"
            />
            {matches.length > 0 && (
              <ul
                style={{
                  position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20,
                  background: "#fff", border: "1px solid #d5d0c8", borderRadius: 6,
                  listStyle: "none", margin: "4px 0 0", padding: 4, maxHeight: 260,
                  overflowY: "auto", boxShadow: "0 6px 16px rgb(38 36 34 / 0.15)",
                  minWidth: 320,
                }}
              >
                {matches.map((m) => (
                  <li key={m.id}>
                    <button
                      onClick={() => addFocus(m.id)}
                      style={{
                        display: "block", width: "100%", textAlign: "left", border: "none",
                        background: "none", padding: "6px 8px", fontSize: "0.85rem",
                        cursor: "pointer", borderRadius: 4,
                      }}
                    >
                      <span style={{ color: KATEGORI_MAP[m.kat].color, marginRight: 6 }}>●</span>
                      {m.name.length > 60 ? m.name.slice(0, 60) + "…" : m.name}
                      <span style={{ color: "#6f6a64" }}> · nr {m.id}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {focus.length > 0 && (
            <>
              <label style={{ fontSize: "0.85rem", color: "#55504a", display: "flex", alignItems: "center", gap: 6 }}>
                Hoppdjup
                <select value={hops} onChange={(e) => setHops(Number(e.target.value))} style={{ fontFamily: "inherit", padding: "5px 8px", borderRadius: 4, border: "1px solid #262422" }}>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </select>
              </label>
              <button
                className="facets__clear"
                onClick={() => setFocus([])}
                style={{ fontSize: "0.85rem" }}
              >
                Visa hela kartan
              </button>
            </>
          )}
          <div className="network-legend">
            {KATEGORIER.map((k) => (
              <span key={k.id}>
                <span className="dot" style={{ background: k.color }} aria-hidden="true" />
                {k.label}
              </span>
            ))}
          </div>
        </div>
        {focus.length > 0 && (
          <div className="chips" style={{ padding: "10px 14px 0" }}>
            {focus.map((nr) => (
              <span key={nr} className="chip">
                {(byNr.get(nr)?.name || String(nr)).slice(0, 44)}
                <button onClick={() => setFocus((f) => f.filter((x) => x !== nr))} aria-label="Ta bort fokus">
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <div ref={wrapRef}>
          <svg
            ref={svgRef}
            width={size.w}
            height={size.h}
            role="img"
            aria-label="Nätverkskarta över initiativens beroenden. Sök för att fokusera på ett initiativs grannskap; klick på en nod öppnar initiativets sida."
          />
        </div>
      </div>
    </div>
  );
}
