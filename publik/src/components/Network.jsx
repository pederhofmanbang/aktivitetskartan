import React, { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { DATA, KATEGORIER, KATEGORI_MAP, kategoriOf } from "../model.js";
import { useRouter } from "../router.jsx";

// Nätverkskartan (beta) — d3-kraftgraf över beroendekopplingarna i DATA.dep.
export default function Network() {
  const { navigate } = useRouter();
  const svgRef = useRef(null);
  const wrapRef = useRef(null);
  const [q, setQ] = useState("");
  const [size, setSize] = useState({ w: 900, h: 600 });

  const graph = useMemo(() => {
    const nodes = DATA.map((d) => ({
      id: d.nr,
      name: d.n,
      kat: kategoriOf(d),
    }));
    const seen = new Set();
    const links = [];
    const valid = new Set(DATA.map((d) => d.nr));
    for (const d of DATA) {
      for (const raw of (d.dep || "").split(",")) {
        const t = Number(raw.trim());
        if (!t || !valid.has(t) || t === d.nr) continue;
        const key = Math.min(d.nr, t) + "-" + Math.max(d.nr, t);
        if (seen.has(key)) continue;
        seen.add(key);
        links.push({ source: d.nr, target: t });
      }
    }
    const degree = {};
    for (const l of links) {
      degree[l.source] = (degree[l.source] || 0) + 1;
      degree[l.target] = (degree[l.target] || 0) + 1;
    }
    for (const n of nodes) n.degree = degree[n.id] || 0;
    return { nodes, links };
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: Math.max(480, Math.min(720, window.innerHeight - 280)) });
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

    const nodes = graph.nodes.map((n) => ({ ...n }));
    const links = graph.links.map((l) => ({ ...l }));

    const sim = d3
      .forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d) => d.id).distance(46).strength(0.4))
      .force("charge", d3.forceManyBody().strength(-60))
      .force("center", d3.forceCenter(w / 2, h / 2))
      .force("collide", d3.forceCollide().radius((d) => 6 + Math.min(d.degree, 10)));

    const link = g
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#d5d0c8")
      .attr("stroke-width", 1);

    const lower = q.trim().toLowerCase();
    const matches = (d) =>
      lower && (d.name.toLowerCase().includes(lower) || String(d.id) === lower);

    const node = g
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d) => 5 + Math.min(d.degree, 10))
      .attr("fill", (d) => KATEGORI_MAP[d.kat].color)
      .attr("stroke", (d) => (matches(d) ? "#262422" : "#fff"))
      .attr("stroke-width", (d) => (matches(d) ? 3 : 1.5))
      .attr("opacity", (d) => (!lower || matches(d) ? 1 : 0.25))
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

    const label = g
      .append("g")
      .selectAll("text")
      .data(nodes.filter((d) => d.degree >= 5 || matches(d)))
      .join("text")
      .text((d) => (d.name.length > 34 ? d.name.slice(0, 34) + "…" : d.name))
      .attr("font-size", 10)
      .attr("fill", "#262422")
      .attr("pointer-events", "none");

    sim.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);
      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      label.attr("x", (d) => d.x + 10).attr("y", (d) => d.y + 3);
    });

    return () => sim.stop();
  }, [graph, size, q, navigate]);

  return (
    <div className="container networkpage">
      <h1 style={{ fontSize: "1.7rem", marginBottom: 8 }}>
        Nätverkskartan <span className="nav__beta">Beta</span>
      </h1>
      <div className="network-banner">
        <strong>Betaversion.</strong>
        <span>
          Kartan visar beroenden och kopplingar mellan initiativen. Layouten är
          automatisk och kopplingarna bygger delvis på AI-sammanställt underlag —
          betrakta den som en översikt, inte en fastställd karta.
        </span>
      </div>
      <div className="network-shell">
        <div className="network-toolbar">
          <input
            type="search"
            placeholder="Sök och markera i kartan …"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Sök nod i nätverkskartan"
          />
          <div className="network-legend">
            {KATEGORIER.map((k) => (
              <span key={k.id}>
                <span className="dot" style={{ background: k.color }} aria-hidden="true" />
                {k.label}
              </span>
            ))}
          </div>
        </div>
        <div ref={wrapRef}>
          <svg
            ref={svgRef}
            width={size.w}
            height={size.h}
            role="img"
            aria-label="Nätverkskarta över initiativens beroenden. Använd sökfältet för att hitta ett initiativ; klick på en nod öppnar initiativets sida."
          />
        </div>
      </div>
    </div>
  );
}
