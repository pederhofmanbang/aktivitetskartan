import React from "react";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Search, X, ChevronDown, ChevronRight, Check, Square, CheckSquare, GitCompare, Filter, Banknote, Tag, ArrowUpDown, XCircle, Database, Edit3, Loader, Printer, MapPin, Globe, Download, Upload } from "lucide-react";
import * as d3 from "d3";
import { getOverride, saveOverride, getDeepDive, saveDeepDive, getSuggestion, saveSuggestion, getCandidates, saveCandidates, getAnalysisObjects, saveAnalysisObjects, getAllOverrides, subscribeToTable } from "./storage";
/* ─────────── EMBEDDED DATA ─────────── */
import { DATA } from "./data.js";
/* ─────────── CONSTANTS ─────────── */
const SUB_LABELS = {
  A1: "A1 – Regionala initiativ",
  A2: "A2 – Statliga initiativ",
  A3: "A3 – EU / internationella",
  B:  "B – TRE-miljöer",
  C1: "C1 – Regionala stödsystem",
  C2: "C2 – Statliga stödsystem",
  C3: "C3 – EU / internationella stöd",
  D:  "D – Lagstiftning, strategi & policy"
};
const DEL_LABELS = {
  A: "Del A – Infrastruktur & datadelning",
  B: "Del B – TRE-miljöer",
  C: "Del C – Stödsystem & standarder",
  D: "Del D – Lagstiftning & strategi"
};
const DEL_COLORS = {
  A: { bg: "#E8F0FE", border: "#4285F4", text: "#1A56DB", dot: "#4285F4" },
  B: { bg: "#FEF3E2", border: "#E8913A", text: "#B45309", dot: "#E8913A" },
  C: { bg: "#E6F5EC", border: "#2D8A56", text: "#166534", dot: "#2D8A56" },
  D: { bg: "#F3E8FE", border: "#8B5CF6", text: "#6D28D9", dot: "#8B5CF6" }
};
const FK_LABELS = {
  "Regionerna": "Regionerna",
  "Stat, inkl myndigheter och/eller privat": "Stat / myndigheter",
  "EU": "EU"
};
const TAG_CATS = ["Aktörstyp", "Verksamhetstyp", "Fokusområde", "Användning"];
function parseMSEK(s) {
  if (!s) return 0;
  const m = s.match(/([\d\s,.]+)\s*MSEK/);
  if (!m) return 0;
  return parseFloat(m[1].replace(/\s/g, "").replace(",", ".")) || 0;
}
function getTagValues(item, cat) {
  const t = item.tags.find(tg => tg.category === cat);
  return t ? t.values.split(", ").map(v => v.trim()) : [];
}
/* ─────────── FILTER SECTION ─────────── */
function FilterSection({ title, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 2 }}>
      <button onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 12px", background: open ? "#F0F4FF" : "transparent", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#1B3A5C", transition: "all 0.15s", fontFamily: "'DM Sans', sans-serif" }}>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {icon}
        <span style={{ flex: 1, textAlign: "left" }}>{title}</span>
      </button>
      {open && <div style={{ padding: "6px 12px 10px 20px" }}>{children}</div>}
    </div>
  );
}
/* ─────────── FILTER CHECKBOX ─────────── */
function FilterCheck({ label, checked, onChange, count, color }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 6px", borderRadius: 6, cursor: "pointer", fontSize: 12.5, color: "#374151", fontFamily: "'DM Sans', sans-serif", background: checked ? "#F0F4FF" : "transparent" }}
      onMouseEnter={e => { if (!checked) e.currentTarget.style.background = "#F7F8FA"; }}
      onMouseLeave={e => { if (!checked) e.currentTarget.style.background = "transparent"; }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ display: "none" }} />
      <span style={{ width: 16, height: 16, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: checked ? "none" : "1.5px solid #CBD5E1", background: checked ? (color || "#1B3A5C") : "#fff" }}>
        {checked && <Check size={11} color="#fff" strokeWidth={3} />}
      </span>
      <span style={{ flex: 1, lineHeight: 1.3 }}>{label}</span>
      {count !== undefined && <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500, marginLeft: "auto" }}>{count}</span>}
    </label>
  );
}
/* ─────────── INITIATIVE CARD ─────────── */
function InitCard({ item, selected, onSelect, onClick, ov }) {
  const col = DEL_COLORS[item.del];
  const matVal = (ov && ov.maturity) ? ov.maturity : (STATUS_TO_MATURITY[item.st] || null);
  const matLevel = MATURITY_LEVELS.find(m => m.value === matVal);
  const msek = parseMSEK(item.fin);
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${selected ? col.border : ov?.arbetaVidere ? "#F59E0B" : "#E5E7EB"}`, padding: 0, cursor: "pointer", transition: "all 0.2s", boxShadow: selected ? `0 0 0 2px ${col.border}33` : ov?.arbetaVidere ? "0 0 0 2px #F59E0B33" : "0 1px 3px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", position: "relative", transform: selected ? "scale(1.01)" : "scale(1)" }}
      onMouseEnter={e => { if (!selected) { e.currentTarget.style.borderColor = col.border + "88"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"; }}}
      onMouseLeave={e => { if (!selected) { e.currentTarget.style.borderColor = ov?.arbetaVidere ? "#F59E0B" : "#E5E7EB"; e.currentTarget.style.boxShadow = ov?.arbetaVidere ? "0 0 0 2px #F59E0B33" : "0 1px 3px rgba(0,0,0,0.04)"; }}}>
      <div style={{ height: 4, borderRadius: "12px 12px 0 0", background: `linear-gradient(90deg, ${col.border}, ${col.border}88)` }} />
      <div style={{ padding: "12px 14px 14px" }} onClick={onClick}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: col.text, background: col.bg, padding: "2px 7px", borderRadius: 4, flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}>{item.sub}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", fontFamily: "'DM Sans', sans-serif" }}>Nr {item.nr}</span>
          {(ov && ov.arbetaVidere) && <span style={{fontSize:11}}>⭐</span>}
          {(ov && ov.qa && ov.qa.approved && ov.qa.approved.done) && <span style={{fontSize:11,color:"#22C55E"}}>✓</span>}
          <div style={{ flex: 1 }} />
          {matLevel && <span style={{ fontSize: 9, fontWeight: 600, color: matLevel.color, background: matLevel.color + "14", padding: "2px 7px", borderRadius: 10, whiteSpace: "nowrap" }}>{matLevel.label}</span>}
        </div>
        <h3 style={{ fontSize: 13.5, fontWeight: 700, color: "#111827", margin: "0 0 6px 0", lineHeight: 1.35, fontFamily: "'DM Sans', sans-serif" }}>{item.n}</h3>
        <p style={{ fontSize: 12, color: "#6B7280", margin: 0, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", fontFamily: "'Source Sans 3', sans-serif" }}>
          {item.nk ? item.nk.substring(0, 180) + (item.nk.length > 180 ? "…" : "") : ""}
        </p>
        {msek > 0 && <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}><Banknote size={12} color="#9CA3AF" /><span style={{ fontSize: 11, color: "#6B7280", fontWeight: 500 }}>{msek.toLocaleString("sv-SE")} MSEK</span></div>}
      </div>
      <div style={{ position: "absolute", bottom: 10, right: 10, zIndex: 2, cursor: "pointer", padding: 4 }} onClick={e => { e.stopPropagation(); onSelect(); }}>
        {selected ? <CheckSquare size={18} color={col.border} fill={col.bg} /> : <Square size={18} color="#CBD5E1" />}
      </div>
    </div>
  );
}
/* ─────────── SCORE BAR ─────────── */
function ScoreBar({ label, score, comment, color = "#1B3A5C" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 12 }}>
      <span style={{ width: 160, color: "#6B7280", flexShrink: 0 }}>{label}</span>
      <div style={{ display: "flex", gap: 3 }}>{[1,2,3].map(s => <div key={s} style={{ width: 24, height: 8, borderRadius: 4, background: s <= score ? color : "#E5E7EB" }} />)}</div>
      <span style={{ color: "#9CA3AF", fontSize: 11 }}>{comment}</span>
    </div>
  );
}
/* ─────────── DETAIL MODAL ─────────── */
function DetailModal({ item, onClose, allItems, overridesCache, refreshOverrides, analysisObjects = [], onCreateContinuityAnalysis }) {
  const [override, setOverride] = useState(null);
  const [showMeta, setShowMeta] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    getOverride(item.nr).then(ov => setOverride(ov));
    const sub = subscribeToTable('overrides', (payload) => {
      if (payload.new && payload.new.nr === item.nr) {
        const fallback = { fields: {}, arbetaVidere: false, qa: {}, infoGathering: {}, maturity: null, jurisdictions: [], jurisdictionOther: "", sources: [], fieldHistory: {} };
        setOverride({ ...fallback, ...payload.new.data });
      }
    });
    return () => sub.unsubscribe();
  }, [item.nr]);
  const handleSave = async () => {
    await saveOverride(item.nr, override);
    if (refreshOverrides) refreshOverrides();
  };
  const autoSave = useCallback((nextOverride) => {
    saveOverride(item.nr, nextOverride).then(() => { if (refreshOverrides) refreshOverrides(); });
  }, [item.nr, refreshOverrides]);
  const toggleArbetaVidere = async () => {
    const next = { ...override, arbetaVidere: !override.arbetaVidere };
    setOverride(next);
    await saveOverride(item.nr, next);
    if (refreshOverrides) refreshOverrides();
  };
  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);
  if (!override) return null;
  const gfv = (field) => getFieldValue(item, field, override);
  const maturity = override.maturity !== null ? override.maturity : (STATUS_TO_MATURITY[item.st] || null);
  const matLevel = MATURITY_LEVELS.find(m => m.value === maturity);
  const isApproved = override.qa?.approved?.done;
  const col = DEL_COLORS[item.del];
  const deps = item.dep ? item.dep.split(",").map(d => parseInt(d.trim())).filter(Boolean) : [];
  const depItems = deps.map(nr => allItems.find(i => i.nr === nr)).filter(Boolean);
  const linkedAO = analysisObjects.filter(o => Array.isArray(o.linkedInitiatives) && o.linkedInitiatives.includes(item.nr));
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: expanded ? "stretch" : "flex-start", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", padding: expanded ? 12 : "40px 20px", overflowY: expanded ? "hidden" : "auto", transition: "padding 0.2s" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: expanded ? 12 : 16, maxWidth: expanded ? "100%" : 720, width: "100%", boxShadow: "0 24px 48px rgba(0,0,0,0.15)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: expanded ? "100%" : "none", transition: "max-width 0.2s, border-radius 0.2s" }} onClick={e => e.stopPropagation()}>
        <div style={{ background: `linear-gradient(135deg, ${col.border}, ${col.border}CC)`, padding: "24px 28px", color: "#fff", position: "relative", flexShrink: 0 }}>
          <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 6 }}>
            <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, padding: 6, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }} title={expanded ? "Förminska" : "Expandera"}>{expanded ? "⊟" : "⊞"}</button>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, padding: 6, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={18} /></button>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, background: "rgba(255,255,255,0.25)", padding: "3px 10px", borderRadius: 6 }}>{item.sub}</span>
            <span style={{ fontSize: 12, opacity: 0.8 }}>Nr {item.nr}</span>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, lineHeight: 1.3, fontFamily: "'DM Sans', sans-serif", paddingRight: 32 }}>{item.n}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <button onClick={toggleArbetaVidere} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 8, fontSize: 10, fontWeight: 600, cursor: "pointer", border: override.arbetaVidere ? "2px solid #F59E0B" : "1px solid #E5E7EB", background: override.arbetaVidere ? "#FFFBEB" : "rgba(255,255,255,0.15)", color: override.arbetaVidere ? "#B45309" : "rgba(255,255,255,0.8)" }}>
              {override.arbetaVidere ? <span style={{fontSize:12}}>⭐</span> : <span style={{fontSize:12,opacity:0.4}}>☆</span>}
              {override.arbetaVidere ? "Prioriterad" : "Arbeta vidare"}
            </button>
            {matLevel && <span style={{ padding: "3px 8px", borderRadius: 8, fontSize: 9, fontWeight: 600, background: "rgba(255,255,255,0.2)", color: "#fff" }}>{matLevel.label}</span>}
            {isApproved && <span style={{ padding: "3px 8px", borderRadius: 8, fontSize: 9, fontWeight: 600, background: "rgba(34,197,94,0.3)", color: "#fff" }}>✅ Godkänd</span>}
          </div>
        </div>
        <div style={{ padding: "20px 28px 28px", maxHeight: expanded ? "none" : "60vh", overflowY: "auto", flex: expanded ? 1 : "none" }}>
          <div style={{ marginBottom: 12, padding: "8px 12px", background: "#ECFEFF", border: "1px solid #A5F3FC", borderRadius: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#0E7490", textTransform: "uppercase", letterSpacing: "0.04em" }}>🛡️ Kontinuitetsanalys</span>
            {linkedAO.length > 0
              ? linkedAO.map(o => (
                  <span key={o.id} title={o.typ} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 12, background: "#fff", border: "1px solid #A5F3FC", color: "#0E7490", fontWeight: 600 }}>{o.namn || "Namnlöst"}</span>
                ))
              : <span style={{ fontSize: 11, color: "#0E7490", fontStyle: "italic" }}>Ingen analys ännu</span>}
            <div style={{ flex: 1 }} />
            {onCreateContinuityAnalysis && (
              <button onClick={(e) => { e.stopPropagation(); onCreateContinuityAnalysis(item); }}
                style={{ padding: "4px 12px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer", border: "1px solid #0E7490", background: "#0E7490", color: "#fff" }}>
                + Skapa{linkedAO.length > 0 ? " ny" : ""}
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            <button onClick={() => setShowEdit(!showEdit)} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 10.5, fontWeight: 600, cursor: "pointer", border: showEdit ? "1px solid #4285F4" : "1px solid #E5E7EB", background: showEdit ? "#E8F0FE" : "#fff", color: showEdit ? "#1A56DB" : "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{fontSize:11}}>✏️</span> {showEdit ? "Stäng redigering" : "Redigera"}
            </button>
            <button onClick={() => setShowMeta(!showMeta)} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 10.5, fontWeight: 600, cursor: "pointer", border: showMeta ? "1px solid #8B5CF6" : "1px solid #E5E7EB", background: showMeta ? "#F3E8FE" : "#fff", color: showMeta ? "#6D28D9" : "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{fontSize:11}}>🛡</span> {showMeta ? "Dölj QA & Metadata" : "QA & Metadata"}
            </button>
          </div>
          {/* METADATA PANEL */}
          {showMeta && <div style={{ marginBottom: 16, padding: 14, background: "#FAFBFC", borderRadius: 10, border: "1px solid #E5E7EB" }}>
            <CardMetadataPanel item={item} override={override} setOverride={setOverride} onSave={handleSave} />
          </div>}
          {/* EDITABLE FIELDS */}
          {showEdit && <div style={{ marginBottom: 16, padding: 14, background: "#FFF8F0", borderRadius: 10, border: "1px solid #FCD34D" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#B45309", marginBottom: 8 }}>Redigera fält (sparas i override-lager, original bevaras alltid i historik)</div>
            <EditableField label="Namn" field="n" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
            <EditableField label="Ansvarig" field="ans" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
            <EditableField label="Typ" field="typ" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
            <EditableField label="Finansieringskälla" field="fk" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
            <EditableField label="Finansiering" field="fin" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
            <EditableField label="Tidplan" field="tid" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
            <EditableField label="Målgrupp" field="mg" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
            <EditableField label="Fokus" field="fok" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
            <EditableField label="Nyckelkaraktäristik" field="nk" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
            <EditableField label="EHDS-relevans" field="ehds" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
            <EditableField label="Datastandarder" field="ds" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
            <EditableField label="Teknisk miljö" field="tek" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
            <EditableField label="Aktörer" field="akt" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
            <EditableField label="Arbetsgruppens beskrivning" field="wg_beskr" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
            <EditableField label="Teknologi/infrastruktur (arbetsgruppen)" field="wg_tek" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
            <EditableField label="Beroenden (kommaseparerade nr)" field="dep" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
            <EditableField label="Korrigering" field="korr" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
            <div style={{ borderTop: "1px solid #E5E7EB", marginTop: 8, paddingTop: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#B45309", marginBottom: 6 }}>Strukturerade fält</div>
              <ScoreArrayEditor label="AI-relevans (6 dimensioner)" field="ai" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
              <ScoreArrayEditor label="KCHD-relevans (5 dimensioner)" field="kchd" item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
              <NyttaEditor item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
              <TagsEditor item={item} override={override} setOverride={setOverride} autoSave={autoSave} />
            </div>
          </div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px", marginBottom: 20, padding: 16, background: "#F7F8FA", borderRadius: 12 }}>
            {[["Mognadsgrad", matLevel ? matLevel.label : (item.st || "—")],["Finansiering", item.fin || "—"],["Finansieringskälla", item.fk],["Tidsperiod", item.tid || "—"],["Ansvarig", item.ans],["Hälsodatafokus", item.fok || "—"],["Målgrupp", item.mg || "—"],["Typ", item.typ]].map(([l, v], idx) => (
              <div key={idx}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{l}</div>
                <div style={{ fontSize: 12.5, color: "#374151", lineHeight: 1.4 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 20 }}><h4 style={{ fontSize: 13, fontWeight: 700, color: "#1B3A5C", marginBottom: 6 }}>Nyckelkaraktäristik</h4><p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, margin: 0 }}>{item.nk}</p></div>
          {item.ehds && <div style={{ marginBottom: 20 }}><h4 style={{ fontSize: 13, fontWeight: 700, color: "#1B3A5C", marginBottom: 6 }}>EHDS-relevans</h4><p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, margin: 0 }}>{item.ehds}</p></div>}
          {item.wg_beskr && <div style={{ marginTop: 4, marginBottom: 12, padding: "10px 12px", background: "#F0F7FF", borderRadius: 8, border: "1px solid #BFDBFE" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#1A56DB", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Arbetsgruppens beskrivning</div>
            <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>{item.wg_beskr}</div>
          </div>}
          {item.wg_tek && <div style={{ marginBottom: 12, padding: "10px 12px", background: "#F5F3FF", borderRadius: 8, border: "1px solid #DDD6FE" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#6D28D9", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Teknologi och infrastruktur (arbetsgruppen)</div>
            <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>{item.wg_tek}</div>
          </div>}
          {item.korr && <div style={{ marginBottom: 20, padding: 12, background: "#FEF3C7", borderRadius: 8, border: "1px solid #FCD34D" }}><h4 style={{ fontSize: 12, fontWeight: 700, color: "#92400E", marginBottom: 4 }}>Korrektioner</h4><p style={{ fontSize: 12, color: "#78350F", lineHeight: 1.5, margin: 0 }}>{item.korr}</p></div>}
          {item.ai && item.ai.length > 0 && <div style={{ marginBottom: 20 }}><h4 style={{ fontSize: 13, fontWeight: 700, color: "#1B3A5C", marginBottom: 8 }}>AI-relevans</h4>{item.ai.map((a, i) => <ScoreBar key={i} label={a.name} score={a.score} comment={a.comment} color="#4285F4" />)}</div>}
          {item.kchd && item.kchd.length > 0 && <div style={{ marginBottom: 20 }}><h4 style={{ fontSize: 13, fontWeight: 700, color: "#1B3A5C", marginBottom: 8 }}>KCHD-relevans</h4>{item.kchd.map((k, i) => <ScoreBar key={i} label={k.name} score={k.score} comment={k.comment} color="#2D8A56" />)}</div>}
          {item.nytta && item.nytta.length > 0 && <div style={{ marginBottom: 20 }}><h4 style={{ fontSize: 13, fontWeight: 700, color: "#1B3A5C", marginBottom: 8 }}>Nyttodimensioner</h4>{item.nytta.map((ny, i) => (
            <div key={i} style={{ marginBottom: 6, display: "flex", gap: 8, fontSize: 12.5 }}><span style={{ fontWeight: 700, color: col.text, background: col.bg, padding: "2px 8px", borderRadius: 4, fontSize: 11, flexShrink: 0 }}>{ny.level}</span><span style={{ color: "#374151", lineHeight: 1.4 }}>{ny.text}</span></div>
          ))}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            {item.ds && <div><h4 style={{ fontSize: 12, fontWeight: 700, color: "#1B3A5C", marginBottom: 4 }}>Datastandarder</h4><p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5, margin: 0 }}>{item.ds}</p></div>}
            {item.tek && <div><h4 style={{ fontSize: 12, fontWeight: 700, color: "#1B3A5C", marginBottom: 4 }}>Teknik</h4><p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5, margin: 0 }}>{item.tek}</p></div>}
          </div>
          {item.akt && <div style={{ marginBottom: 20 }}><h4 style={{ fontSize: 12, fontWeight: 700, color: "#1B3A5C", marginBottom: 4 }}>Aktörer</h4><p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5, margin: 0 }}>{item.akt}</p></div>}
          <div style={{ marginBottom: 20 }}><h4 style={{ fontSize: 12, fontWeight: 700, color: "#1B3A5C", marginBottom: 8 }}>Taggar</h4><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{item.tags.map((tg, i) => tg.values.split(", ").map((v, j) => <span key={`${i}-${j}`} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "#F3F4F6", color: "#4B5563", fontWeight: 500 }}>{tg.category}: {v}</span>))}</div></div>
          {depItems.length > 0 && <div><h4 style={{ fontSize: 12, fontWeight: 700, color: "#1B3A5C", marginBottom: 8 }}>Beroenden</h4><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{depItems.map(d => <span key={d.nr} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, background: DEL_COLORS[d.del].bg, color: DEL_COLORS[d.del].text, fontWeight: 600, border: `1px solid ${DEL_COLORS[d.del].border}33` }}>Nr {d.nr}: {d.n.length > 40 ? d.n.substring(0, 40) + "…" : d.n}</span>)}</div></div>}
          {item.jurisdiktioner && <div style={{ marginTop: 12, marginBottom: 12, padding: "10px 12px", background: "#FFF7ED", borderRadius: 8, border: "1px solid #FDBA74" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#9A3412", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Rekommenderade jurisdiktioner</div>
            <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>{item.jurisdiktioner}</div>
          </div>}
          <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
            <button onClick={() => { onClose(); setTimeout(() => document.dispatchEvent(new CustomEvent("openDeepDive", { detail: item.nr })), 100); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 6, fontSize: 11.5, fontWeight: 600, cursor: "pointer", border: "1px solid #4285F4", background: "#E8F0FE", color: "#1A56DB" }}>
              <Database size={13} /> Datafördjupning
            </button>
          </div>
          <SuggestionField itemNr={item.nr} />
        </div>
      </div>
    </div>
  );
}
/* ─────────── COMPARE PANEL ─────────── */
function ComparePanel({ items, onClose }) {
  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", padding: 20 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, width: "95vw", maxWidth: 1100, maxHeight: "85vh", overflow: "auto", boxShadow: "0 24px 48px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#fff", zIndex: 2 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1B3A5C", margin: 0 }}>Jämför initiativ ({items.length} valda)</h3>
          <button onClick={onClose} style={{ background: "#F3F4F6", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", display: "flex" }}><X size={16} /></button>
        </div>
        <div style={{ padding: 24, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 12.5 }}>
            <thead><tr>
              <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 700, color: "#6B7280", fontSize: 11, textTransform: "uppercase", position: "sticky", left: 0, background: "#fff", width: 140 }}>Fält</th>
              {items.map(it => <th key={it.nr} style={{ textAlign: "left", padding: "8px 12px", fontWeight: 700, color: DEL_COLORS[it.del].text, background: DEL_COLORS[it.del].bg, borderRadius: "8px 8px 0 0", minWidth: 200 }}>Nr {it.nr}: {it.n.length > 30 ? it.n.substring(0, 30) + "…" : it.n}</th>)}
            </tr></thead>
            <tbody>
              {[["Mognadsgrad", it => { const m = STATUS_TO_MATURITY[it.st]; const ml = m ? MATURITY_LEVELS.find(l => l.value === m) : null; return ml ? ml.label : (it.st || "—"); }],["Finansiering", it => it.fin || "—"],["Finansieringskälla", it => it.fk],["Tidsperiod", it => it.tid || "—"],["Ansvarig", it => it.ans],["Hälsodatafokus", it => it.fok || "—"],["EHDS-relevans", it => it.ehds || "—"],
                ["AI-relevans (snitt)", it => { if (!it.ai || !it.ai.length) return "—"; return (it.ai.reduce((s, a) => s + a.score, 0) / it.ai.length).toFixed(1) + " / 3"; }],
                ["KCHD-relevans (snitt)", it => { if (!it.kchd || !it.kchd.length) return "—"; return (it.kchd.reduce((s, a) => s + a.score, 0) / it.kchd.length).toFixed(1) + " / 3"; }],
                ["Datastandarder", it => it.ds || "—"],["Teknik", it => it.tek || "—"]
              ].map(([label, fn], ri) => (
                <tr key={label} style={{ background: ri % 2 === 0 ? "#F9FAFB" : "#fff" }}>
                  <td style={{ padding: "8px 12px", fontWeight: 600, color: "#4B5563", position: "sticky", left: 0, background: ri % 2 === 0 ? "#F9FAFB" : "#fff" }}>{label}</td>
                  {items.map(it => <td key={it.nr} style={{ padding: "8px 12px", color: "#374151", lineHeight: 1.4, verticalAlign: "top" }}>{fn(it)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
/* ─────────── MATRIX VIEW (Del A fyrfältare) ─────────── */
/* ─────────── PERSISTENT STORAGE (Supabase) ─────────── */
// storageGet/storageSet kept as thin wrappers for backward compat with export/import
const storageGet = async (key) => {
  if (key.startsWith("override:")) return getOverride(parseInt(key.split(":")[1]));
  if (key.startsWith("deepdive:")) return getDeepDive(parseInt(key.split(":")[1]));
  if (key.startsWith("suggestion:")) return getSuggestion(parseInt(key.split(":")[1]));
  if (key === "candidates_list") return getCandidates();
  if (key === "analysis_objects") return getAnalysisObjects();
  return null;
};
const storageSet = async (key, val) => {
  if (key.startsWith("override:")) return saveOverride(parseInt(key.split(":")[1]), val);
  if (key.startsWith("deepdive:")) return saveDeepDive(parseInt(key.split(":")[1]), val);
  if (key.startsWith("suggestion:")) return saveSuggestion(parseInt(key.split(":")[1]), val);
  if (key === "candidates_list") return saveCandidates(val);
  if (key === "analysis_objects") return saveAnalysisObjects(val);
};
/* ─────────── EXPORT / IMPORT HELPERS (Supabase) ─────────── */
import { supabase } from './supabaseClient';
const exportAllData = async () => {
  const [ov, dd, sug, cand] = await Promise.all([
    supabase.from('overrides').select('*'),
    supabase.from('deepdives').select('*'),
    supabase.from('suggestions').select('*'),
    supabase.from('candidates').select('*'),
  ]);
  const backup = { overrides: ov.data || [], deepdives: dd.data || [], suggestions: sug.data || [], candidates: cand.data || [] };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "aktivitetskartan_backup_" + new Date().toISOString().slice(0, 10) + ".json";
  a.click();
  URL.revokeObjectURL(url);
  return (ov.data?.length || 0) + (dd.data?.length || 0) + (sug.data?.length || 0) + (cand.data?.length || 0);
};
const importAllData = () => {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) { resolve(0); return; }
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const backup = JSON.parse(ev.target.result);
          let count = 0;
          if (backup.overrides?.length) { await supabase.from('overrides').upsert(backup.overrides, { onConflict: 'nr' }); count += backup.overrides.length; }
          if (backup.deepdives?.length) { await supabase.from('deepdives').upsert(backup.deepdives, { onConflict: 'nr' }); count += backup.deepdives.length; }
          if (backup.suggestions?.length) { await supabase.from('suggestions').upsert(backup.suggestions, { onConflict: 'nr' }); count += backup.suggestions.length; }
          if (backup.candidates?.length) { await supabase.from('candidates').upsert(backup.candidates, { onConflict: 'id' }); count += backup.candidates.length; }
          resolve(count);
        } catch (err) {
          alert("Kunde inte läsa filen. Kontrollera att det är en giltig backup-fil.");
          resolve(0);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
};
/* ─────────── DATA DEEPDIVE PANEL ─────────── */
/* ─────────── MATURITY LEVELS ─────────── */
const MATURITY_LEVELS = [
  { value: 1, label: "Planerad", color: "#9CA3AF", desc: "Beslut fattat men ej påbörjat" },
  { value: 2, label: "Under uppbyggnad", color: "#F59E0B", desc: "Utveckling/upphandling pågår" },
  { value: 3, label: "Pilot/test", color: "#8B5CF6", desc: "Begränsad drift, testas" },
  { value: 4, label: "Operativ (begränsad)", color: "#3B82F6", desc: "I drift men ej full utrullning" },
  { value: 5, label: "Fullt implementerad", color: "#22C55E", desc: "I drift nationellt/fullt utrullad" },
  { value: 6, label: "Avslutat", color: "#6B7280", desc: "Projektet är avslutat" },
];
const STATUS_TO_MATURITY = {
  "Operativt": 5, "Under uppbyggnad": 2, "Under driftsättning": 3, "Under utredning": 1,
  "Pågående uppdrag": 4, "Pågående": 4, "Nystartat": 2, "Avslutat": 6, "Avslutat/övergång": 6,
  "Ikraftträdd — implementation pågår": 4, "Remitterad": 1, "Beslutad": 1, "Beslutad strategi": 1,
  "Gällande lagstiftning": 5, "Gällande EU-förordning": 5, "Avslutad utredning, remissbehandling": 1,
};
const JURISDICTIONS = [
  "GDPR (EU 2016/679)", "PDL — Patientdatalagen (2008:355)", "OSL — Offentlighets- och sekretesslagen",
  "EHDS — EU 2025/327", "AI Act — EU 2024/1689", "MDR — Medicintekniska förordningen",
  "IVDR — In vitro-diagnostik", "NIS2 — Cybersäkerhetsdirektivet", "Biobankslagen (2023:38)",
  "Registerförfattningar (SoS)", "Etikprövningslagen (2003:460)", "Upphovsrättslagen",
  "SVOD — Socialstyrelsens föreskrifter om öppenvårdsdokumentation",
];
const QA_STEPS = [
  { key: "aiResearch", label: "AI-research", required: true },
  { key: "manualEdit", label: "Manuell redigering", required: true },
  { key: "aiRecheck", label: "Ny AI-kontroll", required: false },
  { key: "approved", label: "Godkänd", required: true },
];
const INFO_METHODS = [
  { key: "desktopResearch", label: "Desktop research (inkl AI)" },
  { key: "dialogExpert", label: "Dialog med sakkunnig" },
  { key: "reviewedExpert", label: "Granskad av sakkunnig" },
  { key: "dialogGroup", label: "Dialog i grupp" },
];
/* ─────────── KONTINUITET & HÅLLBARHET (Metodstöd för digital försörjningskedja) ─────────── */
// Trafikljus-skala för självskattning av sårbarhet/resiliens per dimension.
const CONTINUITY_SCALE = [
  { value: "god", label: "God förmåga / låg sårbarhet", short: "God", color: "#22C55E" },
  { value: "svaghet", label: "Vissa svagheter", short: "Svagheter", color: "#F59E0B" },
  { value: "betydande", label: "Betydande sårbarhet", short: "Betydande", color: "#F97316" },
  { value: "kritisk", label: "Kritisk sårbarhet", short: "Kritisk", color: "#DC2626" },
];
const SCALE_BY_VALUE = Object.fromEntries(CONTINUITY_SCALE.map(s => [s.value, s]));
const SCALE_SEVERITY = { god: 1, svaghet: 2, betydande: 3, kritisk: 4 };
// De sex analysdimensionerna ur Metodstödet, steg 2. Varje dimension skattas + besvaras i fritext.
const CONTINUITY_DIMENSIONS = [
  { key: "verksamhetskritikalitet", label: "Verksamhetskritikalitet", icon: "🏥",
    desc: "Vilka system, tjänster, dataflöden och leverantörer är mest kritiska för vård, administration, ledning, uppföljning och beredskap?",
    questions: ["Vilka processer måste fungera för att vården ska kunna upprätthållas?", "Vilka informationstillgångar är mest kritiska?", "Vad blir konsekvensen vid avbrott?"] },
  { key: "beroenden_inlasning", label: "Beroenden & inlåsning", icon: "🔒",
    desc: "Tekniska, avtalsmässiga, kompetensmässiga eller marknadsmässiga inlåsningseffekter — beroende av leverantörer, plattformar, molntjänster eller specialistkonsulter.",
    questions: ["Vilka leverantörs-, plattforms- eller molnberoenden finns?", "Finns inlåsning i avtal, format eller kompetens?", "Hur svårt vore det att byta eller komplettera?"] },
  { key: "data_interop", label: "Data & interoperabilitet", icon: "🔌",
    desc: "Hur data lagras, används, delas och kan flyttas — dataportabilitet, öppna standarder, dokumenterade gränssnitt och möjligheten att byta komponenter.",
    questions: ["Kan data flyttas eller återanvändas (portabilitet)?", "Används öppna standarder och dokumenterade gränssnitt?", "Går komponenter att byta ut eller komplettera?"] },
  { key: "cybersakerhet", label: "Cybersäkerhet & informationssäkerhet", icon: "🛡️",
    desc: "Skyddsåtgärder, beroenden och risker som identifierats i befintligt arbete (Cybersäkerhetskollen, RSA, informationsklassning, leverantörsbedömningar).",
    questions: ["Vad visar Cybersäkerhetskollen / RSA för analysobjektet?", "Vilka skyddsåtgärder och incidentförmågor finns?", "Vilka risker bär leverantörskedjan?"] },
  { key: "ekonomi", label: "Ekonomi & handlingsutrymme", icon: "💰",
    desc: "Kostnadsdrivare: licenser, abonnemang, integrationer, konsultberoenden, förvaltning, migrerings- och exitkostnader — i relation till budgetutrymme.",
    questions: ["Vilka är de största kostnadsdrivarna?", "Vad skulle det kosta att minska eller bryta ett beroende (migrering/exit)?", "Hur förhåller sig kostnaderna till budgetutrymmet?"] },
  { key: "kompetens", label: "Kompetenser & förmågor", icon: "🧠",
    desc: "Interna kompetenser och förmågor att förstå, styra, säkra, vidareutveckla och vid behov förändra den digitala försörjningskedjan.",
    questions: ["Har regionen kompetens att styra leverantörer och förstå konsekvenser?", "Finns förmåga att genomföra förändringar?", "Vilka kompetenser saknas?"] },
];
// Rättsliga ramverk ur Metodstödet, steg 1 — relevansbedömning + bedömningstext per ramverk.
const LEGAL_FRAMEWORKS = [
  { key: "hsl", namn: "Hälso- och sjukvårdslagen", varfor: "Hur infrastrukturen påverkar vårdens jämlikhet, behovsstyrning och god vård på lika villkor." },
  { key: "psl", namn: "Patientsäkerhetslagen", varfor: "Digitala system och tillgång till rätt information i rätt tid som del av patientsäkerhetsarbetet." },
  { key: "pdl", namn: "Patientdatalagen", varfor: "Åtkomst, loggning, spärrar, sammanhållen journalföring och hantering av hälsodata." },
  { key: "interop_se", namn: "Lag om interoperabilitetskrav vid datadelning (föreslagen)", varfor: "Krav på gemensamma interoperabilitetslösningar och återanvändbara strukturer." },
  { key: "gdpr", namn: "Dataskyddsförordningen (GDPR)", varfor: "Rättslig grund, inbyggt dataskydd, tredjelandsöverföring och kontroll över personuppgiftsbehandling." },
  { key: "ehds", namn: "EHDS-förordningen", varfor: "Krav på interoperabilitet, strukturerad hälsodata, portabilitet och tillgängliggörande för primär- och sekundäranvändning." },
  { key: "nis2", namn: "NIS2 / Cybersäkerhetslagen", varfor: "Riskhantering, resiliens, incidentförmåga, ledningsansvar, leverantörskedjor och kontinuitetsåtgärder." },
  { key: "ai_act", namn: "AI-förordningen", varfor: "Hur AI-system får införas, övervakas och användas, särskilt i högrisknära kliniska sammanhang." },
  { key: "cra", namn: "Cyber Resilience-förordningen", varfor: "Krav på säkra digitala produkter, sårbarhetshantering, uppdateringar och transparens över livscykeln." },
  { key: "data_act", namn: "Data-förordningen", varfor: "Rätt till data från uppkopplade produkter — påverkar medicinteknik, portabilitet och leverantörslåsningar." },
  { key: "dga", namn: "Data Governance-förordningen", varfor: "Säkra former för att tillgängliggöra skyddade data för forskning och sekundäranvändning." },
  { key: "open_data", namn: "Öppna data-lagen", varfor: "Hur icke-känsliga datamängder görs tillgängliga i öppna, maskinläsbara format." },
  { key: "iea", namn: "Interoperable Europe Act", varfor: "Tryck på interoperabilitet, återanvändning, öppna standarder och dokumenterade gränssnitt." },
  { key: "digital_networks", namn: "Digital Networks-förordningen (framväxande)", varfor: "Kan påverka nätresiliens och beroenden till strategisk digital infrastruktur." },
  { key: "tech_sovereignty", namn: "Tech Sovereignty Package (framväxande)", varfor: "Kan påverka långsiktiga vägval och kontroll över strategisk digital infrastruktur." },
];
const ANALYSIS_OBJECT_TYPES = ["Systemmiljö", "Dataplattform", "Leverantörsberoende", "Informationskedja", "Försörjningskedja (verksamhetsområde)"];
// Kompetenskategorier ur Metodstödet, rad 84–91 — för fältet "Deltagande funktioner".
const KOMPETENSER = [
  "Strategisk IT-arkitektur, integrationer och digital infrastruktur",
  "Informationssäkerhet, cybersäkerhet och riskhantering",
  "Upphandling, leverantörsstyrning och avtalsförvaltning",
  "Juridik, dataskydd och informationshantering",
  "Ekonomi, kostnadsanalys och nyttobedömning",
  "Representanter från berörda verksamheter och informationsägare",
  "Beredskap, kontinuitetshantering och krisledning",
];
// Ansvarsområden ur Metodstödet, rad 56 — vem som ansvarar för respektive perspektiv.
const ANSVAR_OMRADEN = [
  { key: "kontinuitet", label: "Kontinuitetsperspektivet" },
  { key: "juridik", label: "Rättslig bedömning (enskild lag & på totalen)" },
  { key: "ekonomi", label: "Ekonomisk analys" },
  { key: "cybersakerhet", label: "Cybersäkerhetsunderlag" },
  { key: "arkitektur", label: "Arkitekturöversikt" },
  { key: "sammanvagning", label: "Sammanvägning av resultat" },
];
// Korta kolumnetiketter för rättsliga ramverk i översiktsmatrisen.
const LEGAL_KORT = { hsl: "HSL", psl: "PSL", pdl: "PDL", interop_se: "IntOp", gdpr: "GDPR", ehds: "EHDS", nis2: "NIS2", ai_act: "AI Act", cra: "CRA", data_act: "Data", dga: "DGA", open_data: "Öppna", iea: "IEA", digital_networks: "DigNet", tech_sovereignty: "TechSov" };
// Metodstödets fyra steg (för accordion-rubriker i analysvyn).
const CONTINUITY_STEPS = [
  { n: 1, label: "Avgränsa analysobjekt & samla underlag", desc: "Identifiera kritiska processer, informationstillgångar och tillämpliga rättsliga krav." },
  { n: 2, label: "Beskriv beroenden & dimensioner", desc: "Självskatta och beskriv de sex analysdimensionerna." },
  { n: 3, label: "Bedöm konsekvenser, risker & sårbarheter", desc: "Sammanvägd bedömning av vad som händer om beroendena brister." },
  { n: 4, label: "Prioritera åtgärder & dokumentera", desc: "Slutsatser, rekommenderade prioriteringar och åtgärdsförslag." },
];

/* ─────────── OVERRIDE HELPERS (getOverride & saveOverride imported from storage.js) ─────────── */
const getFieldValue = (item, field, override) => {
  if (override && override.fields && override.fields[field] !== undefined) return override.fields[field];
  return item[field];
};
/* ─────────── CARD METADATA PANEL ─────────── */
function CardMetadataPanel({ item, override, setOverride, onSave }) {
  const maturity = override.maturity !== null ? override.maturity : (STATUS_TO_MATURITY[item.st] || null);
  const qa = override.qa || {};
  const info = override.infoGathering || {};
  const jurisdictions = override.jurisdictions || [];
  const debounceRef = useRef(null);
  const updateOv = (path, val) => {
    const next = JSON.parse(JSON.stringify(override));
    const parts = path.split(".");
    let obj = next;
    for (let i = 0; i < parts.length - 1; i++) { if (!obj[parts[i]]) obj[parts[i]] = {}; obj = obj[parts[i]]; }
    obj[parts[parts.length - 1]] = val;
    setOverride(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { saveOverride(item.nr, next); }, 600);
  };
  const toggleQa = (key) => {
    const curr = qa[key] || {};
    updateOv("qa." + key, curr.done ? { done: false, date: null, name: "" } : { done: true, date: new Date().toISOString().slice(0, 10), name: "" });
  };
  const toggleInfo = (key) => updateOv("infoGathering." + key, !info[key]);
  const toggleJuris = (j) => {
    const next = jurisdictions.includes(j) ? jurisdictions.filter(x => x !== j) : [...jurisdictions, j];
    updateOv("jurisdictions", next);
  };
  const isApproved = qa.approved && qa.approved.done;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* QA Chain */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#1B3A5C", marginBottom: 6 }}>Kvalitetssäkring</div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {QA_STEPS.map((step, idx) => {
            const s = qa[step.key] || {};
            return (
              <button key={step.key} onClick={() => toggleQa(step.key)}
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, fontSize: 10.5, fontWeight: 600, cursor: "pointer",
                  border: s.done ? "1px solid #22C55E" : "1px solid #E5E7EB",
                  background: s.done ? "#F0FFF4" : "#fff",
                  color: s.done ? "#166534" : "#6B7280",
                  opacity: !step.required ? 0.7 : 1,
                }}>
                {s.done ? <span style={{fontSize:12}}>✓</span> : <span style={{fontSize:12,opacity:0.3}}>○</span>}
                {step.label}{!step.required && " (frivillig)"}
                {s.done && s.date && <span style={{ fontSize: 9, color: "#9CA3AF" }}>{s.date}</span>}
              </button>
            );
          })}
        </div>
        {isApproved && <div style={{ marginTop: 4, fontSize: 10, color: "#166534", fontWeight: 600 }}>✅ Kortet är godkänt och säkert att använda</div>}
      </div>
      {/* Info Gathering */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#1B3A5C", marginBottom: 6 }}>Informationsinsamling</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {INFO_METHODS.map(m => (
            <button key={m.key} onClick={() => toggleInfo(m.key)}
              style={{ padding: "4px 10px", borderRadius: 14, fontSize: 10, cursor: "pointer",
                border: info[m.key] ? "1px solid #4285F4" : "1px solid #E5E7EB",
                background: info[m.key] ? "#E8F0FE" : "#fff",
                color: info[m.key] ? "#1A56DB" : "#6B7280", fontWeight: info[m.key] ? 600 : 400,
              }}>
              {info[m.key] ? "✓ " : ""}{m.label}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 10, color: "#6B7280" }}>Annat:</span>
          <input value={info.other || ""} onChange={e => updateOv("infoGathering.other", e.target.value)}
            style={{ border: "1px solid #E5E7EB", borderRadius: 6, padding: "3px 8px", fontSize: 10, flex: 1 }}
            placeholder="Fritext..." />
        </div>
      </div>
      {/* Maturity */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#1B3A5C", marginBottom: 6 }}>Mognadsgrad</div>
        <div style={{ display: "flex", gap: 2 }}>
          {MATURITY_LEVELS.map(m => (
            <button key={m.value} onClick={() => updateOv("maturity", maturity === m.value ? null : m.value)}
              title={m.desc}
              style={{ flex: 1, padding: "6px 2px", borderRadius: 6, fontSize: 9, fontWeight: 600, cursor: "pointer", textAlign: "center",
                border: maturity === m.value ? "2px solid " + m.color : "1px solid #E5E7EB",
                background: maturity === m.value ? m.color + "18" : "#fff",
                color: maturity === m.value ? m.color : "#9CA3AF",
              }}>
              {m.label}
            </button>
          ))}
        </div>
      </div>
      {/* Jurisdictions */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#1B3A5C", marginBottom: 6 }}>Jurisdiktioner / regelverk</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          {JURISDICTIONS.map(j => (
            <button key={j} onClick={() => toggleJuris(j)}
              style={{ padding: "3px 8px", borderRadius: 12, fontSize: 9.5, cursor: "pointer",
                border: jurisdictions.includes(j) ? "1px solid #DC2626" : "1px solid #E5E7EB",
                background: jurisdictions.includes(j) ? "#FEF2F2" : "#fff",
                color: jurisdictions.includes(j) ? "#991B1B" : "#6B7280",
                fontWeight: jurisdictions.includes(j) ? 600 : 400,
              }}>
              {j}
            </button>
          ))}
        </div>
        <input value={override.jurisdictionOther || ""} onChange={e => updateOv("jurisdictionOther", e.target.value)}
          style={{ marginTop: 4, border: "1px solid #E5E7EB", borderRadius: 6, padding: "3px 8px", fontSize: 10, width: "100%" }}
          placeholder="Övrigt regelverk..." />
      </div>
      {/* Sources */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#1B3A5C", marginBottom: 6 }}>Källor</div>
        {(override.sources || []).map((src, i) => (
          <div key={i} style={{ display: "flex", gap: 4, marginBottom: 3, alignItems: "center" }}>
            <span style={{fontSize:10,color:"#9CA3AF"}}>🔗</span>
            <input value={src.label || ""} onChange={e => { const s = [...(override.sources||[])]; s[i] = {...s[i], label: e.target.value}; updateOv("sources", s); }}
              style={{ border: "1px solid #E5E7EB", borderRadius: 4, padding: "2px 6px", fontSize: 10, width: 100 }} placeholder="Etikett" />
            <input value={src.url || ""} onChange={e => { const s = [...(override.sources||[])]; s[i] = {...s[i], url: e.target.value}; updateOv("sources", s); }}
              style={{ border: "1px solid #E5E7EB", borderRadius: 4, padding: "2px 6px", fontSize: 10, flex: 1 }} placeholder="https://..." />
            <button onClick={() => { const s = (override.sources||[]).filter((_,j) => j !== i); updateOv("sources", s); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#DC2626", fontSize: 12 }}>×</button>
          </div>
        ))}
        <button onClick={() => updateOv("sources", [...(override.sources||[]), { label: "", url: "" }])}
          style={{ padding: "3px 10px", borderRadius: 6, fontSize: 10, cursor: "pointer", border: "1px solid #E5E7EB", background: "#fff", color: "#6B7280" }}>
          + Lägg till källa
        </button>
      </div>
    </div>
  );
}
/* ─────────── FIELD EDITOR ─────────── */
function EditableField({ label, field, item, override, setOverride, autoSave }) {
  const [editing, setEditing] = useState(false);
  const origVal = item[field] || "";
  const hasOverride = override.fields && override.fields[field] !== undefined;
  const displayVal = hasOverride ? override.fields[field] : origVal;
  const save = (val) => {
    const next = JSON.parse(JSON.stringify(override));
    if (!next.fields) next.fields = {};
    if (!next.fieldHistory) next.fieldHistory = {};
    // Save current to history before overwriting
    if (!next.fieldHistory[field]) next.fieldHistory[field] = [];
    if (hasOverride) {
      next.fieldHistory[field].push(next.fields[field]);
    } else {
      next.fieldHistory[field].push(origVal);
    }
    // Keep max 10 history entries
    if (next.fieldHistory[field].length > 10) next.fieldHistory[field] = next.fieldHistory[field].slice(-10);
    next.fields[field] = val;
    setOverride(next);
    setEditing(false);
    if (autoSave) autoSave(next);
  };
  const restore = () => {
    const next = JSON.parse(JSON.stringify(override));
    if (!next.fields) return;
    // Move current override to history
    if (!next.fieldHistory) next.fieldHistory = {};
    if (!next.fieldHistory[field]) next.fieldHistory[field] = [];
    if (next.fields[field] !== undefined) next.fieldHistory[field].push(next.fields[field]);
    delete next.fields[field];
    setOverride(next);
    if (autoSave) autoSave(next);
  };
  if (editing) {
    return (
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#374151", marginBottom: 2 }}>{label}</div>
        <textarea defaultValue={displayVal} rows={3} style={{ width: "100%", border: "1px solid #4285F4", borderRadius: 6, padding: "6px 8px", fontSize: 11, resize: "vertical", fontFamily: "inherit" }}
          onBlur={e => save(e.target.value)} autoFocus />
      </div>
    );
  }
  return (
    <div style={{ marginBottom: 6, position: "relative", group: true }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#374151" }}>{label}</span>
        {hasOverride && <span style={{ fontSize: 8, color: "#F59E0B", fontWeight: 600 }}>✏️ redigerad</span>}
        <button onClick={() => setEditing(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 2px", color: "#9CA3AF" }} title="Redigera">
          <span style={{fontSize:10}}>✏️</span>
        </button>
        {hasOverride && (
          <button onClick={restore} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 2px", color: "#F59E0B" }} title="Återställ till original (sparar redigering i historik)">
            <span style={{fontSize:10}}>↩</span>
          </button>
        )}
      </div>
      <div style={{ fontSize: 11, color: "#374151", lineHeight: 1.5 }}>{displayVal || <span style={{ color: "#CBD5E1", fontStyle: "italic" }}>Ej ifyllt</span>}</div>
    </div>
  );
}
/* ─────────── SCORE ARRAY EDITOR (AI/KCHD) ─────────── */
function ScoreArrayEditor({ label, field, item, override, setOverride, autoSave }) {
  const origArr = item[field] || [];
  const hasOv = override.fields && override.fields[field] !== undefined;
  const arr = hasOv ? override.fields[field] : origArr;
  const [open, setOpen] = useState(false);
  const saveArr = (newArr) => {
    const next = JSON.parse(JSON.stringify(override));
    if (!next.fields) next.fields = {};
    if (!next.fieldHistory) next.fieldHistory = {};
    if (!next.fieldHistory[field]) next.fieldHistory[field] = [];
    next.fieldHistory[field].push(JSON.stringify(hasOv ? next.fields[field] : origArr));
    if (next.fieldHistory[field].length > 10) next.fieldHistory[field] = next.fieldHistory[field].slice(-10);
    next.fields[field] = newArr;
    setOverride(next);
    if (autoSave) autoSave(next);
  };
  const updateItem = (idx, key, val) => {
    const copy = JSON.parse(JSON.stringify(arr));
    copy[idx][key] = val;
    saveArr(copy);
  };
  const restore = () => {
    const next = JSON.parse(JSON.stringify(override));
    if (!next.fields) return;
    if (!next.fieldHistory) next.fieldHistory = {};
    if (!next.fieldHistory[field]) next.fieldHistory[field] = [];
    if (next.fields[field] !== undefined) next.fieldHistory[field].push(JSON.stringify(next.fields[field]));
    delete next.fields[field];
    setOverride(next);
  };
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#374151" }}>{label}</span>
        {hasOv && <span style={{ fontSize: 8, color: "#F59E0B", fontWeight: 600 }}>✏️ redigerad</span>}
        <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 4px", fontSize: 10, color: "#4285F4" }}>
          {open ? "▾ dölj" : "▸ redigera"}
        </button>
        {hasOv && <button onClick={restore} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 2px", fontSize: 10, color: "#F59E0B" }} title="Återställ">↩</button>}
      </div>
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: 8, background: "#F9FAFB", borderRadius: 6, border: "1px solid #E5E7EB" }}>
          {arr.map((dim, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 10, color: "#6B7280", minWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dim.name}</span>
              <div style={{ display: "flex", gap: 2 }}>
                {[1, 2, 3].map(s => (
                  <button key={s} onClick={() => updateItem(idx, "score", s)}
                    style={{ width: 24, height: 24, borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: "pointer",
                      border: dim.score === s ? "2px solid #4285F4" : "1px solid #E5E7EB",
                      background: dim.score === s ? (s === 3 ? "#D1FAE5" : s === 2 ? "#FEF3C7" : "#F3F4F6") : "#fff",
                      color: dim.score === s ? (s === 3 ? "#065F46" : s === 2 ? "#92400E" : "#6B7280") : "#9CA3AF",
                    }}>{s}</button>
                ))}
              </div>
              <input value={dim.comment || ""} onChange={e => updateItem(idx, "comment", e.target.value)}
                style={{ flex: 1, border: "1px solid #E5E7EB", borderRadius: 4, padding: "3px 6px", fontSize: 10, fontFamily: "inherit" }}
                placeholder="Kommentar..." />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
/* ─────────── NYTTA EDITOR ─────────── */
function NyttaEditor({ item, override, setOverride, autoSave }) {
  const field = "nytta";
  const origArr = item[field] || [];
  const hasOv = override.fields && override.fields[field] !== undefined;
  const arr = hasOv ? override.fields[field] : origArr;
  const [open, setOpen] = useState(false);
  const saveArr = (newArr) => {
    const next = JSON.parse(JSON.stringify(override));
    if (!next.fields) next.fields = {};
    if (!next.fieldHistory) next.fieldHistory = {};
    if (!next.fieldHistory[field]) next.fieldHistory[field] = [];
    next.fieldHistory[field].push(JSON.stringify(hasOv ? next.fields[field] : origArr));
    if (next.fieldHistory[field].length > 10) next.fieldHistory[field] = next.fieldHistory[field].slice(-10);
    next.fields[field] = newArr;
    setOverride(next);
    if (autoSave) autoSave(next);
  };
  const updateItem = (idx, val) => {
    const copy = JSON.parse(JSON.stringify(arr));
    copy[idx].text = val;
    saveArr(copy);
  };
  const restore = () => {
    const next = JSON.parse(JSON.stringify(override));
    if (!next.fields) return;
    if (!next.fieldHistory) next.fieldHistory = {};
    if (!next.fieldHistory[field]) next.fieldHistory[field] = [];
    if (next.fields[field] !== undefined) next.fieldHistory[field].push(JSON.stringify(next.fields[field]));
    delete next.fields[field];
    setOverride(next);
  };
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#374151" }}>Nyttodimensioner</span>
        {hasOv && <span style={{ fontSize: 8, color: "#F59E0B", fontWeight: 600 }}>✏️ redigerad</span>}
        <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 4px", fontSize: 10, color: "#4285F4" }}>
          {open ? "▾ dölj" : "▸ redigera"}
        </button>
        {hasOv && <button onClick={restore} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 2px", fontSize: 10, color: "#F59E0B" }} title="Återställ">↩</button>}
      </div>
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: 8, background: "#F9FAFB", borderRadius: 6, border: "1px solid #E5E7EB" }}>
          {arr.map((ny, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#4285F4", minWidth: 70, paddingTop: 4, textTransform: "uppercase" }}>{ny.level}</span>
              <textarea value={ny.text || ""} onChange={e => updateItem(idx, e.target.value)} rows={2}
                style={{ flex: 1, border: "1px solid #E5E7EB", borderRadius: 4, padding: "4px 6px", fontSize: 10, fontFamily: "inherit", resize: "vertical" }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
/* ─────────── TAGS EDITOR ─────────── */
function TagsEditor({ item, override, setOverride, autoSave }) {
  const field = "tags";
  const origArr = item[field] || [];
  const hasOv = override.fields && override.fields[field] !== undefined;
  const arr = hasOv ? override.fields[field] : origArr;
  const [open, setOpen] = useState(false);
  const saveArr = (newArr) => {
    const next = JSON.parse(JSON.stringify(override));
    if (!next.fields) next.fields = {};
    if (!next.fieldHistory) next.fieldHistory = {};
    if (!next.fieldHistory[field]) next.fieldHistory[field] = [];
    next.fieldHistory[field].push(JSON.stringify(hasOv ? next.fields[field] : origArr));
    if (next.fieldHistory[field].length > 10) next.fieldHistory[field] = next.fieldHistory[field].slice(-10);
    next.fields[field] = newArr;
    setOverride(next);
    if (autoSave) autoSave(next);
  };
  const updateTag = (idx, val) => {
    const copy = JSON.parse(JSON.stringify(arr));
    copy[idx].values = val;
    saveArr(copy);
  };
  const restore = () => {
    const next = JSON.parse(JSON.stringify(override));
    if (!next.fields) return;
    if (!next.fieldHistory) next.fieldHistory = {};
    if (!next.fieldHistory[field]) next.fieldHistory[field] = [];
    if (next.fields[field] !== undefined) next.fieldHistory[field].push(JSON.stringify(next.fields[field]));
    delete next.fields[field];
    setOverride(next);
  };
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#374151" }}>Taggar</span>
        {hasOv && <span style={{ fontSize: 8, color: "#F59E0B", fontWeight: 600 }}>✏️ redigerad</span>}
        <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 4px", fontSize: 10, color: "#4285F4" }}>
          {open ? "▾ dölj" : "▸ redigera"}
        </button>
        {hasOv && <button onClick={restore} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 2px", fontSize: 10, color: "#F59E0B" }} title="Återställ">↩</button>}
      </div>
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: 8, background: "#F9FAFB", borderRadius: 6, border: "1px solid #E5E7EB" }}>
          {arr.map((tag, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 10, color: "#6B7280", minWidth: 100, fontWeight: 600 }}>{tag.category}</span>
              <input value={tag.values || ""} onChange={e => updateTag(idx, e.target.value)}
                style={{ flex: 1, border: "1px solid #E5E7EB", borderRadius: 4, padding: "3px 6px", fontSize: 10, fontFamily: "inherit" }}
                placeholder="Kommaseparerade värden..." />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
const DEEPDIVE_FIELDS = [
  { key: "formaga", label: "Datarelaterad förmåga som adresseras", type: "checktext",
    options: ["Data management (sammanhållen data, semantik)", "Data governance (styrning, säkerhet, integritet)", "Tillgängliggöra data (integration, uppdateringsfrekvens)", "Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft)", "Externa krav (EHDS, NDI)"] },
  { key: "doman", label: "Datadomän / verksamhetsdata", type: "text" },
  { key: "frekvens", label: "Dataegenskaper: realtid/frekvens", type: "select", options: ["Ej specificerat", "Batch (dagligen/veckovis)", "Near real-time (minuter/timmar)", "Real-time (kontinuerligt)"] },
  { key: "datatyp", label: "Dataegenskaper: datatyp/format", type: "text" },
  { key: "datamangd", label: "Dataegenskaper: datamängd/omfattning", type: "text" },
  { key: "kallsystem", label: "Datakällor: källsystem", type: "text" },
  { key: "iot", label: "Datakällor: IoT/sensordata", type: "text" },
  { key: "standarder", label: "Standarder och modeller", type: "text" },
  { key: "kvalitet", label: "Dataförberedelser och kvalitet", type: "text" },
];
const DEEPDIVE_DEFAULTS = {"5": {"formaga_checks": ["Tillgängliggöra data (integration, uppdateringsfrekvens)", "Data governance (styrning, säkerhet, integritet)", "Data management (sammanhållen data, semantik)", "Externa krav (EHDS, NDI)"], "formaga_text": "Kärnfunktion: realtids titthål över vårdgivargränser. Stark governance via Samtyckestjänsten, Spärrtjänsten, Loggtjänsten. FHIR-adapter för EHDS planeras ~2029. Adresserar INTE analys/AI.", "doman": "14 kliniska informationskategorier: vårdkontakter, anteckningar, diagnoser, funktionstillstånd, vårdplan, läkemedel (inkl NLL), provsvar, remisser, bilddiagnostik-remisser, mödravård, uppmärksamhetsinformation, vaccinationer, tillväxtkurva barn.", "frekvens": "Real-time (kontinuerligt)", "datatyp": "Strukturerad XML (SOAP/WSDL/XSD via RIV-TA Basic Profile 2.1) + ostrukturerad fritext i kliniska anteckningar. Kodad data: ICD-10-SE, KVÅ, ATC, SNOMED CT, NPU. Mutual TLS med SITHS funktionscertifikat.", "datamangd": "NTjP: ~516 miljoner anrop/månad (okt 2024, +40% YoY). NPÖ-sökningar +15% YoY. Alla 21 regioner anslutna som producenter och konsumenter. Potentiellt ~10,5 miljoner invånare.", "kallsystem": "Cambio COSMIC (17 regioner), Oracle Health Millennium (VGR, Skåne), CGM TakeCare (Stockholm). Kommunala system: Procapita, Treserva, Magna Cura, Viva via agenter. E-hälsomyndigheten (NLL). Svevac (vaccination).", "iot": "Ingen IoT/sensordata. Strikt EHR-journaldokumentation. Närmast mätdata: tillväxtkurvor (manuellt dokumenterade).", "standarder": "RIV-TA Basic Profile 2.1 (SOAP/XML). HSA (organisationsidentitet). SITHS (autentisering, eIDAS substantial). ICD-10-SE, KVÅ, ATC, SNOMED CT, NPU. T2-referensarkitektur (2023). FHIR PoC genomförd men ej i produktion.", "kvalitet": "Ingen central ETL — data hämtas on-demand från källsystem. Kvalitetssäkring via: Verifiering av Tjänsteproducent (teknisk testning per källsystem × tjänstekontrakt), Etablering av samverkan (end-to-end-test). Datakvalitetsansvar hos respektive vårdgivare. Klassificerad som NMI (Nationellt Medicinskt Informationssystem)."}, "11": {"formaga_checks": ["Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft)", "Tillgängliggöra data (integration, uppdateringsfrekvens)", "Data management (sammanhållen data, semantik)", "Data governance (styrning, säkerhet, integritet)", "Externa krav (EHDS, NDI)"], "formaga_text": "Stark beräkningskraft via NAISS (Bianca, Berzelius, Dardel). 144+ nf-core pipelines. SciLifeLab Data Centre som centralt nav. FEGA Sweden för GDPR-kompatibel genomikdelning. GA4GH-standarder (Beacon v2, htsget).", "doman": "Genomik (WGS, WES, scRNA-seq), transkriptomik (spatial via Visium), proteomik (MS + Olink), metabolomik, kryo-EM, medicinsk bilddata (via AIDA), klinisk data (kvalitetsregister, biobanker med >150M prover), epidemiologisk övervakning (avloppsvatten-monitorering).", "frekvens": "Batch (dagligen/veckovis)", "datatyp": "FASTQ/BAM/VCF (genomik), TIFF/OME-TIFF (mikroskopi), DICOM (medicinsk bild), mzML/mzXML (proteomik), HDF5/H5AD (single-cell), CSV/TSV (tabulär). Nextflow-pipelines med Docker/Singularity-containers.", "datamangd": "Multi-petabyte-skala. UPPMAX >7 PB lagringskapacitet. Bianca: 4 480 kärnor, 204 noder (128 GB), 10 GPU-noder (NVIDIA A100). Per WGS-prov: ~100–200 GB rå FASTQ, expanderar 5–10× vid analys. Biobank Sverige: >150M prover. NGI SNP&SEQ: Swedac ISO 17025-ackrediterat.", "kallsystem": "10 SciLifeLab-plattformar (Genomics/NGI, Clinical Genomics, NBIS, Proteomics m.fl.). 4 DDLS Data Science Nodes. NAISS: Bianca, Rackham, Dardel, Berzelius, Alvis. GMS 7 regionala centra. Internationella: EGA, ENA, PRIDE, UniProt.", "iot": "Sekvensinstrument: Illumina NovaSeq X Plus, PacBio HiFi, Oxford Nanopore. Masspektrometrar: Orbitrap, LC-MS/MS. Kryo-EM vid 5 sites. NMR-spektrometrar. Avloppsvattenmätning för patogenövervakning.", "standarder": "FAIR-principer (grundläggande). GA4GH: Beacon v2, Phenopackets, htsget, DUO. ISO/IEC 17025 (NGI SNP&SEQ). nf-core pipelines (144+). ELIXIR RDMkit. GDPR. Data Stewardship Wizard (DMP). FEGA Sweden.", "kvalitet": "FastQC (rå-QC), MultiQC (aggregering), CheckQC (automatiserad Illumina-runfolder-QC). Cutadapt (adapter-trimming). nf-core-pipelines med inbyggd QC i varje steg. DMP:er obligatoriska. NBIS erbjuder kostnadsfri datahanteringskonsultation. Data lagras minst 10 år. End-to-end-kryptering via DDS."}, "20": {"formaga_checks": ["Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft)", "Tillgängliggöra data (integration, uppdateringsfrekvens)", "Data governance (styrning, säkerhet, integritet)", "Data management (sammanhållen data, semantik)", "Externa krav (EHDS, NDI)"], "formaga_text": "DSP (Data Science Platform, mars 2025) med DGX-2 och Verdi-system för GPU-beräkning. DOI-baserad publicering till 41+ länder. AIDA Data Sharing Policy (publicerad i Nature Scientific Data). REMS för digital åtkomsthantering. Deltar i EUCAIM, Bigpicture, GDI.", "doman": "Medicinsk bilddiagnostik: radiologi (CT, MRI, röntgen, mammografi, CTPA, MR-Linac), patologi (helglasbilder/WSI med H&E och immunhistokemi), dermatologi. Anatomiska domäner: bröst, kolon, lever, ovarium, skelett, thorax, prostata, hjärna. SCAPIS kardiopulmonell CT från 6 universitetssjukhus.", "frekvens": "Batch (dagligen/veckovis)", "datatyp": "DICOM (radiologi), Hamamatsu NDP-format (patologi-WSI, 20×–40× förstoring). Annotationer: segmenteringsmasker, bounding boxes, klassificeringsetiketter, SNOMED-CT-kopplade ontologitermer. Totalt ~1,05 miljoner annotationer över 52 dataset.", "datamangd": "52 dataset (50 reella + 2 syntetiska), 56,95 TB reell data + 124 GB syntetisk. 154 917 reella skanningar + 106 448 syntetiska. DSP Verdi: 3,2 PB HDD + 153 TB SSD. DGX-2: 15× NVIDIA Tesla V100, 1,5 TB RAM. Operativt sedan oktober 2018. 200+ externa datadelningshändelser till 41+ länder.", "kallsystem": "Sjukhus-PACS (retrospektiv extraktion). Region Östergötland (primär datakälla, avtal 2025). 6 SCAPIS-sjukhussites. AIDA-egen molnbaserad PACS. Skannertyper: Hamamatsu NanoZoomer (XR, 2.0 HT, XRL), Aperio/Leica Scanscope. ~50 AIDA-partners (akademi, industri, vård).", "iot": "Patologiskannrar (Hamamatsu NanoZoomer-serien), CT-skannrar, MRI (inkl MR-Linac), röntgen/CR-system, mammografienheter. All data extraheras retrospektivt — inga realtidsflöden. Federerat lärande utforskas via MAIA-plattformen.", "standarder": "DICOM (primär bildstandard). FAIR-principer. DOI via DataCite (doi:10.23698/aida/[id]). SNOMED-CT (tumörmorfologi, organkodning). AO/OTA (frakturklassificering). AIDA-licenssystem (BY, standard, kontrollerad). GDPR-anonymisering enligt egen publicerad policy.", "kvalitet": "DICOM-anonymisering: automatiserade verktyg + iterativ manuell granskning, 1 av 100 undersökningar fullständigt manuellt granskade. Ansiktssuddighetalgoritmer (CT-skallar). Anonymisering sker vid kliniken före överföring. Dubbelgranskad annotation (en läkare annoterar, en kontrollerar). SNOMED-CT-kopplad ontologi. Stadler et al. (2020): 8 vägledande principer för databasuppbyggnad."}, "1": {"formaga_checks": ["Data management (sammanhållen data, semantik)", "Data governance (styrning, säkerhet, integritet)", "Tillgängliggöra data (integration, uppdateringsfrekvens)", "Externa krav (EHDS, NDI)"], "formaga_text": "GMS samordnar genomisk diagnostik nationellt. Central datainfrastruktur under utveckling med BDC beräkningskluster. Stark governance via avtal mellan 7 universitetssjukvårdsregioner. EHDS-genomik är prioriterad datakategori.", "doman": "Klinisk genomik: helgenomsekvensering (WGS), helexomsekvensering (WES), genpaneler, somatisk tumörgenomik. Sjukdomsdomäner: sällsynta sjukdomar, cancer (solida och hematologiska), farmakogenomik. Tillhörande klinisk data: diagnoskoder, behandlingsdata, familjehistorik.", "frekvens": "Near real-time (minuter/timmar)", "datatyp": "FASTQ (råsekvens), BAM/CRAM (alignment), VCF/gVCF (varianter), BED (regioner). Kliniska rapporter i PDF + strukturerat format. Phenopackets (GA4GH) för fenotypdata. Scout-systemet (Clinical Genomics, SciLifeLab) för variantanalys.", "datamangd": "~120 MSEK regionavtal. 7 regionala genomikcentra. BDC: 6 beräkningsnoder + 1,3 PB lagring. Ca 5 000-10 000 kliniska WGS-analyser/år (uppskattning 2025). Mål: all klinisk genetik via WGS inom 5 år.", "kallsystem": "Illumina NovaSeq 6000/X Plus (sekvensering), Scout/Chanjo (variantanalys SciLifeLab Clinical Genomics), LIMS-system per centrum, Cytogenomics/CytoSure (strukturella varianter), regionala journalsystem för klinisk data.", "iot": "Sekvensinstrument: Illumina NovaSeq X Plus, NovaSeq 6000, MiSeq. Arraychip: Infinium Global Screening Array. Under utvärdering: Oxford Nanopore för snabb diagnostik.", "standarder": "GA4GH: Beacon v2, Phenopackets v2, htsget, DUO (Data Use Ontology). HGNC gennomenklatur. ACMG/AMP variantklassificering. VCF v4.3. FHIR Genomics IG (under pilotering). ICD-10-SE + Orphanet-koder för sällsynta sjukdomar.", "kvalitet": "Clinical Genomics pipeline (nf-core MIP) med inbyggd QC per steg. Sanger-verifiering av patogena varianter. Coverage-krav: >30× mediandjup för WGS, >99% av gener >20×. Internt kalibreringsprogram med NA12878-referens. Swedac-ackreditering eftersträvas."}, "2": {"formaga_checks": ["Data management (sammanhållen data, semantik)", "Data governance (styrning, säkerhet, integritet)", "Tillgängliggöra data (integration, uppdateringsfrekvens)", "Externa krav (EHDS, NDI)"], "formaga_text": "100+ register med varierande datamodeller. Stark governance via PDL kap 7 (opt-out). Registercentrum (QRC, UCR, RCC) förvaltar data. NKRR hanterar forskarutlämning. Konsolidering 17→7 plattformar pågår under NAG kvalitetsregister.", "doman": "Alla kliniska domäner: hjärt-kärl (SWEDEHEART, RiksSvikt), cancer (alla cancerformer via RCC), ortopedi (Svenska Höftprotesregistret, Knäprotesregistret), diabetes (NDR), stroke (Riksstroke), psykiatri (PsykiatrIN), demens (SveDem), reumatologi (SRQ), m.fl. >100 register.", "frekvens": "Batch (dagligen/veckovis)", "datatyp": "Strukturerade variabler per register (variabellistor publicerade). Formats: proprietära per plattform (INCA, RC-plattformen, LifeReg, Stratum m.fl.), CSV/XML vid utlämning. ICD-10-SE, KVÅ, ATC-koder integrerade. Registervariabelbiblioteket (RUT/Dataguiden) dokumenterar tillgängliga variabler.", "datamangd": "100+ register, uppskattningsvis 50-80 miljoner registreringar totalt. SWEDEHEART: >750 000 patienter. NDR: >600 000 patienter. Cancerregistret: ~80 000 nya fall/år. 178 MSEK statlig årlig finansiering + regionernas egenfinansiering.", "kallsystem": "Journalsystem (COSMIC, Millennium, TakeCare) → manuell + halvautomatisk registrering → registerplattformar (INCA, RC-plattformen, LifeReg, Stratum, UCR-plattformen m.fl.). NKRR/IUTKR för forskarutlämning.", "iot": "Inget direkt IoT. Data härrör från manuell klinisk registrering. Pågående arbete med automatiserad överföring från journalsystem (\"registrera en gång, återanvänd\").", "standarder": "ICD-10-SE, KVÅ, ATC, Snomed CT (varierande per register). Registerspecifika variabellistor. PDL kap 7 (juridisk grund). Registerförordningar (2001:707 m.fl.). NKRR:s utlämningsprocess.", "kvalitet": "Validering vid inmatning (plattformsspecifik). Täckningsgrad varierar (50-99% beroende på register). Bortfallsanalyser i årsrapporter. Registercentrum utför datakvalitetsgranskningar. Extern revision av Vård- och omsorgsanalys."}, "3": {"formaga_checks": ["Data management (sammanhållen data, semantik)", "Tillgängliggöra data (integration, uppdateringsfrekvens)"], "formaga_text": "Regionernas egna system genererar den primärdata som alla andra initiativ bygger på. Stor heterogenitet: 3 huvudjournalsystem, olika datalager, olika AI-mognad. SUSSA (9 COSMIC-regioner) och Millennium-blocket (VGR, Skåne) är de två stora grupperna.", "doman": "All klinisk verksamhet: primärvård, specialistvård (somatisk + psykiatrisk), akut, operation, intensivvård, kommunal hälso- och sjukvård. Lab, röntgen, patologi. Administrativa system: väntetider, ekonomi, personal.", "frekvens": "Real-time (kontinuerligt)", "datatyp": "Journaldata (fritext + strukturerad), labbresultat (numeriska + kodade), bilddiagnostik (DICOM), operationsdata, läkemedelsordinationer (ATC), diagnoskoder (ICD-10-SE), åtgärdskoder (KVÅ). Varierande proprietära format per journalsystem.", "datamangd": "~10,5 miljoner invånare. 21 regioner. COSMIC: 17 regioner (~6M invånare). Millennium: 2 regioner (VGR + Skåne, ~3M). TakeCare: Stockholm (~2,4M). Hundratals terabyte klinisk data totalt.", "kallsystem": "Cambio COSMIC (17 reg.), Oracle Health Millennium (VGR, Skåne), CompuGroup TakeCare (Stockholm). Lab: Flexlab, SoftLab, Klinisk kemi-system. Bild: Sectra PACS, GE PACS. Operation: Orbit, MetaVision. Intensivvård: PDMS (Clinisoft, MetaVision).", "iot": "Patientövervakning: monitorering (SpO2, EKG, blodtryck). Infusionspumpar. Ventilatorer (data sällan strukturerat extraherad). Hemmonitorering (pilot i vissa regioner). CGM (kontinuerlig blodsockermätning) i diabetesvård.", "standarder": "ICD-10-SE (diagnoser), KVÅ (åtgärder), ATC (läkemedel), Snomed CT (varierande), DICOM (bild), HL7 v2 (lab), RIV-TA (NTjP-integration). Varje region har egen informationsarkitektur.", "kvalitet": "Varierande per region. Kodningskvalitet (ICD-10) granskad av Socialstyrelsen. Datalager med ETL-processer (varierande kvalitet). Ingen nationell standard för datakvalitetsmätning. SUSSA har viss gemensam modell."}, "4": {"formaga_checks": ["Tillgängliggöra data (integration, uppdateringsfrekvens)", "Externa krav (EHDS, NDI)"], "formaga_text": "1177 är invånarens primära digitala ingång till vården. Ny version under utveckling med moderniserad arkitektur. Kan bli MyHealth@EU primary use access point. Integrerar med NPÖ för journalåtkomst.", "doman": "Invånartjänster: hälsoråd/triagering (1177 Vårdguiden), journalåtkomst (via NPÖ), tidbokning, receptförnyelse, e-tjänster per region, säkra meddelanden till vårdgivare, vaccinationsbokningar, provsvarsvisning.", "frekvens": "Real-time (kontinuerligt)", "datatyp": "Webbinnehåll (HTML/JSON), invånarinteraktionsdata, ärendedata (meddelanden, bokningar), journalvisning (hämtas via NPÖ/NTjP i SOAP/XML). Ny arkitektur: REST/JSON, mikrotjänster.", "datamangd": "~10,5 miljoner potentiella användare (alla invånare). Hundratals miljoner sidvisningar/år. E-tjänster: varierar per region (40-200 per region). 1177 Vårdguiden: ~200 miljoner besök/år.", "kallsystem": "NPÖ (via NTjP, journaldata), regionala tidbokningstjänster, regionala e-tjänsteplattformar, 1177 Vårdguiden (innehållsplattform Episerver/Optimizely). SITHS/BankID för autentisering.", "iot": "Inget direkt IoT. Potentiellt i framtiden: hemmonitoreringsdata visad via 1177, egenmätta hälsovärden (blodtryck, vikt, blodsockernivåer) — pilotprojekt i vissa regioner.", "standarder": "RIV-TA (NTjP-integration), SAML/OIDC (autentisering), SITHS, BankID, HSA (organisationskatalog). WCAG 2.1 AA (tillgänglighet). Ny arkitektur: FHIR R4 planeras.", "kvalitet": "Tillgänglighetsgranskningar (WCAG). SLA för uppetid (99,9%). Innehållsgranskningsprocess för medicinsk information (1177 Vårdguiden). Användartester och nöjdhetsmätningar."}, "6": {"formaga_checks": ["Data management (sammanhållen data, semantik)", "Data governance (styrning, säkerhet, integritet)", "Tillgängliggöra data (integration, uppdateringsfrekvens)"], "formaga_text": "INCA är den centrala IT-plattformen för cancerregistrering i Sverige. IPÖ ger realtidsöversikt i patientmötet. Stark governance via RCC i samverkan. Cancerdata prioriterad under EHDS.", "doman": "Alla cancerformer: diagnos, stadieindelning (TNM), behandling (kirurgi, cytostatika, strålning, immunterapi), uppföljning, överlevnad. IPÖ: PROM/PREM-data (patientrapporterade utfall). ~25 cancerspecifika kvalitetsregister.", "frekvens": "Batch (dagligen/veckovis)", "datatyp": "Strukturerade registervariablar per cancerform. ICD-10-SE (diagnos), ICD-O-3 (tumörmorfologi/-topografi), TNM-klassifikation, KVÅ (åtgärder), ATC (läkemedel). IPÖ: patientrapporterade PROM-formulär. Webbaserade inmatningsformulär.", "datamangd": "Cancerregistret: ~80 000 nya maligna tumörer/år. Sedan 1958. ~25 diagnosspecifika register. IPÖ: implementerat för 15+ diagnoser, >100 000 registreringar/år. Driftas av Sogeti. Regional lagring i INCA-plattformen.", "kallsystem": "Manuell inmatning via INCA-webbformulär. Journalsystem (COSMIC, Millennium, TakeCare) som källa — men begränsad automatisk överföring. Patologisystem (för morfologikoder). Strålbehandlingssystem.", "iot": "Inget direkt IoT. Cancerbehandlingsapparater (linjäracceleratorer, PET-CT) genererar data men den överförs manuellt till registren.", "standarder": "ICD-10-SE, ICD-O-3 (topografi+morfologi), TNM 8th edition, KVÅ, ATC. INCA eget API för datautlämning. RCC:s variabellistor. Snomed CT (begränsat). ENCR (European Network of Cancer Registries) jämförelsestandard.", "kvalitet": "Täckningsgrad >96% (Cancerregistret, Socialstyrelsen granskar). Valideringsregler vid inmatning. Årliga datakvalitetsrapporter per register. Regionala onkologicentra granskar lokalt. Eftersläpning i registrering (6-12 mån) problematiskt."}, "7": {"formaga_checks": ["Data management (sammanhållen data, semantik)", "Tillgängliggöra data (integration, uppdateringsfrekvens)"], "formaga_text": "SUSSA-samverkan ger 9 COSMIC-regioner gemensam datamodell för datalager. Stark källa för sekundäranvändning. Direktåtkomst till klinisk data utan manuell registrering. Viktig partner för vårddatahubb.", "doman": "All klinisk data i COSMIC: vårdkontakter (öppen/sluten), diagnoser, åtgärder, läkemedel, lab, remisser, vårddokumentation. Administrativa data: väntetider, resursutnyttjande, beläggning.", "frekvens": "Batch (dagligen/veckovis)", "datatyp": "SQL-baserat datalager med COSMIC-datamodell. ICD-10-SE, KVÅ, ATC standardkodning. Cambio COSMIC XML-exportformat. CSV/Excel vid manuella uttag. COSMIC Intelligence (BI-verktyg) för rapporter.", "datamangd": "9 regioner: Dalarna, Gävleborg, Uppsala, Sörmland, Västmanland, Värmland, Norrbotten, Västerbotten, Jämtland-Härjedalen. Ca 2,2 miljoner invånare. Flera terabyte datalager per region.", "kallsystem": "Cambio COSMIC (kärnsystem). COSMIC datalager (DW). COSMIC Intelligence (BI). Labsystem integrerade via HL7. Röntgensvar via RIS/PACS-koppling.", "iot": "Inget direkt IoT kopplat till SUSSA-datalager. Monitoreringsdata från intensivvård kan finnas i COSMIC men extraheras sällan systematiskt.", "standarder": "COSMIC-datamodell (proprietär men dokumenterad). ICD-10-SE, KVÅ, ATC, NPU (labbkoder). SQL-baserade extrakt. Gemensam SUSSA-datamodell under utveckling.", "kvalitet": "ETL-processer per region (varierande kvalitet). Gemensam variabeldefinition inom SUSSA. Kodningsgranskning i regionala kodningsgrupper. Cambio levererar DW-schema med dokumentation."}, "8": {"formaga_checks": ["Data management (sammanhållen data, semantik)", "Data governance (styrning, säkerhet, integritet)", "Tillgängliggöra data (integration, uppdateringsfrekvens)", "Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft)", "Externa krav (EHDS, NDI)"], "formaga_text": "KCHD är navet för regiongemensam hälsodatastrategi. NSG Hälsodata fattar strategiska beslut, DiN (Digitaliseringsnätverket) styr IT-direktörernas prioriteringar. 5 subprojekt 2026: Datamodell, Mappningsmotor, Beräkning Väntetider/PAR, FHIR API, Demo-miljö.", "doman": "Sekundäranvändning av all regional hälsodata: väntetidsdata (0-3-90-90 vårdgarantin), PAR-SV/PAR-OV (patientregistret), kvalitetsregisterdata, standardiserade variabler. Metanivå: datastyrning, kompetens, regelverk.", "frekvens": "Batch (dagligen/veckovis)", "datatyp": "Mappningsspecifikationer (JSON/YAML), FHIR R4-resurser, openEHR-arketyper, OMOP CDM-mappningar, Socialstyrelsens flatfiler (PAR-format). Docker-containers med transformationslogik. Git-baserad versionshantering.", "datamangd": "Potentiellt alla 21 regioners data. POC-fas med 5 pilotdataflöden. DG REFORM-finansierat konsultuppdrag (1 år). Målbild: nationell hub som processar alla regioners rapporteringsflöden.", "kallsystem": "Regionala journalsystem (COSMIC, Millennium, TakeCare) → regionala datalager → KCHD hub-relay. Socialstyrelsens specifikationer (PAR-SV, PAR-OV). Pilot med Region 22 demomiljö (FastAPI, MinIO, EHRbase).", "iot": "Inget direkt IoT. Hub-konceptet hanterar strukturerad data, inte realtidssensordata.", "standarder": "FHIR R4 (HL7 Sweden basprofiler), openEHR (arketyper via CKM), OMOP CDM v5.4 (via OMOP4Sweden), Socialstyrelsens variabelspecifikationer, RIV-TA (bakåtkompatibilitet). GitOps-baserad distribution.", "kvalitet": "DQ0-DQ6 kvalitetskontroller i POC-pipelinen (Tier 1-9 transformationer). Ifyllnadsgrad (fill rate) som primärt kvalitetsmått. Automatiserad validering mot Socialstyrelsens specifikationer. CHECKLIST.md och SPRINT_LOG.md för utvecklingskontroll."}, "9": {"formaga_checks": ["Data governance (styrning, säkerhet, integritet)", "Tillgängliggöra data (integration, uppdateringsfrekvens)", "Externa krav (EHDS, NDI)"], "formaga_text": "NDI är Sveriges huvudsakliga EHDS-implementeringsinitiativ. E-hälsomyndigheten bygger teknisk infrastruktur medan samordnare Mats Nilsson utreder policy. Fyra delrapporter levererade, slutrapport april 2026.", "doman": "All hälsodata för primär- och sekundäranvändning: EHR, läkemedel, labb, bilddiagnostik, utskrivning, genomik (i linje med EHDS 14 datakategorier). Målbild: nationell plattform som knyter samman alla datakällor.", "frekvens": "Real-time (kontinuerligt)", "datatyp": "Under specifikation. Förväntat: FHIR R4 (EEHRxF-format), HL7 CDA (MyHealth@EU-kompatibilitet), OMOP CDM (sekundäranvändning). API-baserad arkitektur.", "datamangd": "Nationell skala: 10,5 miljoner invånare, alla vårdgivare. Slutrapport 1 april 2026 ska specificera scope och dimensionering.", "kallsystem": "Alla befintliga system: journalsystem, NTjP, NPÖ, 1177, NLL, Socialstyrelsen, SCB. Målbild: nationell orkestreringsplattform.", "iot": "Inte i initialfas. Framtida: hemmonitorering, wearables, medicinteknisk utrustning kan inkluderas.", "standarder": "EHDS (EU 2025/327), EEHRxF (European EHR Exchange Format), FHIR R4, HL7 CDA, SNOMED CT, ICD-10-SE (→ICD-11), LOINC (labb). EIRA (European Interoperability Reference Architecture).", "kvalitet": "Under specifikation. Förväntas inkludera: datakvalitetskrav per datakategori, certifieringsprocess för anslutna system, kontinuerlig kvalitetsmonitorering."}, "10": {"formaga_checks": ["Tillgängliggöra data (integration, uppdateringsfrekvens)"], "formaga_text": "Ena är sektorsövergripande digital infrastruktur. Hälsodata är en tillämpningsdomän men inte huvudfokus. Byggblock: SDK, digital post, auktorisering, API-hantering. Begränsad direkt hälsodatarelevans men viktiga grundkomponenter.", "doman": "Förvaltningsgemensam: alla offentliga sektorer. Hälsodatarelevanta byggblock: SDK (Säker digital kommunikation), auktorisering (behörighetsstyrning), API-hantering, digital post (för invånarkommunikation).", "frekvens": "Real-time (kontinuerligt)", "datatyp": "API-standarder (REST/JSON), meddelandeformat (SDK), identitetsdata (Sweden Connect), adressdata, organisationsdata. Inte hälsodata per se utan infrastrukturkomponenter.", "datamangd": "Hela offentlig sektor: ~500 myndigheter, 290 kommuner, 21 regioner. Ca 55 MSEK budget (2024). Ej hälsodataspecifikt.", "kallsystem": "DIGG:s egna byggblock. Sweden Connect (eIDAS). Skatteverkets folkbokföring. Bolagsverkets företagsregister. Lantmäteriets geodata.", "iot": "Inte tillämpligt.", "standarder": "OASIS (SDK-protokoll), OAuth 2.0/OIDC (autentisering), REST/JSON (API-design), eIDAS 2.0, EIRA (arkitekturramverk). W3C Verifiable Credentials (under utvärdering).", "kvalitet": "DIGG:s kvalitetskrav per byggblock. SLA-avtal. Certifieringsprocess för anslutna myndigheter."}, "12": {"formaga_checks": ["Data governance (styrning, säkerhet, integritet)", "Tillgängliggöra data (integration, uppdateringsfrekvens)", "Externa krav (EHDS, NDI)"], "formaga_text": "SENASH förbereder HDAB-funktioner: metadatakatalog och databeställningssystem kopplat till EHDS. EU4Health + VR-finansiering. Samverkan mellan 4 HBAD-myndigheter. Knyter samman RUT/Dataguiden med EHDS-krav.", "doman": "Registerdata hos HBAD-myndigheter: Socialstyrelsens hälsodataregister, SCB:s registerdata, Folkhälsomyndighetens smittskyddsdata, Läkemedelsverkets data. Metadatanivå: variabelbeskrivningar, kvalitetsindikatorer, åtkomstregler.", "frekvens": "Batch (dagligen/veckovis)", "datatyp": "Metadata (DCAT-AP, GSIM-modellen), databeställningsformulär, regelverksspecifikationer. Registerdata: flatfiler, SAS-format, CSV. Under utveckling: EHDS-kompatibla metadataformat.", "datamangd": "Alla nationella hälsodataregister (Socialstyrelsen 6 register + kvalitetsregister). SCB:s 100+ statistikregister. Ca 28 MSEK total projektbudget (60% EU, 40% nationellt).", "kallsystem": "Socialstyrelsens register, SCB:s register, FoHM:s SmiNet/NVR, Läkemedelsverkets register. RUT/Dataguiden (metadata). MONA (SCB:s analysplattform).", "iot": "Inte tillämpligt.", "standarder": "DCAT-AP (metadatakatalog), GSIM (statistisk informationsmodell), EHDS-metadataformat (under utveckling), HealthData@EU-noden. ISO 11179 (metadata registry).", "kvalitet": "Metadatakvalitetskrav enligt EHDS art. 55-56. Kvalitetsindikatorer per dataset. Harmonisering av variabelbeskrivningar mellan HBAD-myndigheter."}, "13": {"formaga_checks": ["Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft)"], "formaga_text": "WASP är Sveriges största forskningsprogram (6,5 mdr SEK). Generellt AI-fokus, inte hälsodataspecifikt. WASP-HS adresserar samhällsaspekter. Spillover-effekt: AI-kompetens och metoder tillämpbara på hälsodata.", "doman": "AI generellt: maskininlärning, djupinlärning, autonoma system, mjukvara, AI-etik (WASP-HS). Hälsodatatillämpningar förekommer men är inte primärt fokus. Forskningsdomäner: robotik, naturlig språkbehandling, datorseende, optimering.", "frekvens": "Ej specificerat", "datatyp": "Forskningsdata i alla format: bilddata, textdata, sensordata, simuleringsdata. Beräkningsresurser: GPU-kluster, molnresurser.", "datamangd": "600+ forskare. 80+ doktorander. 5 universitet (LiU, KTH, Chalmers, Lund, Umeå). 6 500 MSEK totalbudget 2016-2030.", "kallsystem": "Universitetens egna beräkningsresurser. NAISS superdatorer (Berzelius, Alvis). Industripartners data (konfidentiellt).", "iot": "Sensorer och robotar i forskningsprojekt. Inte hälso-IoT specifikt.", "standarder": "Öppna forskningsstandarder. PyTorch, TensorFlow, JAX (ML-ramverk). FAIR-principer (forskning). Ej hälsodatastandarder.", "kvalitet": "Vetenskaplig peer review. Reproducerbarhet genom öppen kod. Ej hälsodataspecifik kvalitetssäkring."}, "14": {"formaga_checks": ["Tillgängliggöra data (integration, uppdateringsfrekvens)", "Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft)"], "formaga_text": "NAISS tillhandahåller nationell beräkningsinfrastruktur. Bianca vid UPPMAX specifikt för känslig data (inkl. hälsodata). Arrhenius (EuroHPC), Berzelius (AI), Dardel (KTH) — alla tillgängliga för hälsodataforskning med rätt avtal.", "doman": "All beräkningsintensiv forskning: genomik/bioinformatik (största hälsodataanvändningen), proteinstruktur, epidemiologisk modellering, medicinsk bildanalys, NLP på klinisk text.", "frekvens": "Batch (dagligen/veckovis)", "datatyp": "Alla beräkningsformat: FASTQ/BAM/VCF (genomik), DICOM (bild), HDF5 (maskininlärning), CSV/Parquet (tabulär), Singularity/Docker containers (pipelines).", "datamangd": "6 centra: C3SE (Chalmers), HPC2N (Umeå), LUNARC (Lund), NSC (Linköping), PDC (KTH), UPPMAX (Uppsala). Totalt >50 PB lagringskapacitet. 150 MSEK (2023, VR-basanslag).", "kallsystem": "Forskarnas egna data (uppladdade). Registerdata (via etikgodkännande). Sekvenseringsdata (från SciLifeLab, GMS). Internationell data (EGA, ENA).", "iot": "Ej direkt — beräknar data från IoT men tar inte emot realtidsströmmar.", "standarder": "SLURM (resurshantering), Singularity/Apptainer (containers), SUNET/Swamid (autentisering), Wharf (säker filöverföring till Bianca). ISO 27001-inspirerad säkerhet.", "kvalitet": "SLA per system (99,5%+ uppetid). NAISS kompetenscentrum för support. SNIC/NAISS användarenkäter. Bianca: isolerade noder, inga nätverksanslutningar."}, "15": {"formaga_checks": ["Tillgängliggöra data (integration, uppdateringsfrekvens)", "Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft)"], "formaga_text": "ASHA bygger säker analysmiljö för regionala hälsodata kopplad till NSC:s beräkningsinfrastruktur. Utvecklar federerade analysmetoder. Samverkan med AIDA Data Hub. Vinnova-finansierat.", "doman": "Regional hälsodata från Region Östergötland: journaldata, labbdata, bilddiagnostik. Fokus på federerad analys — beräkning sker vid datakällan utan central lagring.", "frekvens": "Batch (dagligen/veckovis)", "datatyp": "Klinisk data i regionalt format (COSMIC-extrakt). ML-modeller (Python/R). Federerade analysprotokoll. DICOM (bilddata via AIDA-koppling).", "datamangd": "Region Östergötlands ~470 000 invånare. NSC:s beräkningsresurser. 30 MSEK Vinnova-finansiering (2023-2027).", "kallsystem": "COSMIC (Region Östergötland), CMIV (bilddata), SciLifeLab (genomikdata). NSC superdator för beräkning.", "iot": "MR-skannrar och CT (bilddata via CMIV). Inte realtids-IoT.", "standarder": "OMOP CDM (under pilotering), FHIR R4, DICOM. Federerat lärande: PySyft/Flower-ramverk (under utvärdering). GDPR-compliance by design.", "kvalitet": "Vinnovas projektuppföljning. Etikprövning obligatorisk. Datakvalitetskontroller vid extraktion."}, "16": {"formaga_checks": ["Data governance (styrning, säkerhet, integritet)", "Tillgängliggöra data (integration, uppdateringsfrekvens)"], "formaga_text": "MONA är SCB:s befintliga SPE (Secure Processing Environment). Forskare analyserar mikrodata via säker fjärråtkomst utan att data lämnar SCB. Utreds som nationell SPE inom EHDS.", "doman": "SCB:s registerdata: LISA (arbetsmarknad), folk- och bostadsräkningar, utbildningsregister. Kopplad till Socialstyrelsens hälsodataregister, Cancerregistret, Läkemedelsregistret via samkörning.", "frekvens": "Batch (dagligen/veckovis)", "datatyp": "SAS-dataset, STATA-format, R-kompatibla data. Avidentifierade mikrodata med SCB som länknyckelinnehavare. Tabelluttag måste sekretessprövas före export.", "datamangd": "Hela Sveriges befolkning (~10,5M). 100+ statistikregister. Tusentals forskningsprojekt per år. Ca 2 000 aktiva MONA-användare.", "kallsystem": "SCB:s egna register (LISA, befolkningsregistret). Länkade register från Socialstyrelsen, Folkhälsomyndigheten, Läkemedelsverket, CSN, Försäkringskassan m.fl.", "iot": "Inte tillämpligt.", "standarder": "GSIM (metadata), GSBPM (statistisk process), SCB:s egna sekretesspolicyer. EHDS-kompatibilitet utreds (SPE-krav art. 50).", "kvalitet": "SCB:s kvalitetsramverk (European Statistics Code of Practice). Sekretesspröving av alla tabelluttag. Registervalidering och årlig kvalitetsdokumentation."}, "17": {"formaga_checks": ["Tillgängliggöra data (integration, uppdateringsfrekvens)"], "formaga_text": "SAFOS är Försäkringskassans plattform för säker myndighetssamverkan. Virtuellt datacenter. Hälsodatarelevans begränsad till sjukskrivnings- och rehabiliteringsdata.", "doman": "Myndighetsintern samverkan: sjukskrivningsdata, rehabilitering, arbetsförmågebedömning. Koppling till Försäkringskassans handläggningsprocess. Samarbetsytor och mötestjänster.", "frekvens": "Real-time (kontinuerligt)", "datatyp": "Dokument (sjukintyg, utlåtanden), ärendedata, videokonferens, samarbetsdokument. Allt lagras i Försäkringskassans datacenter.", "datamangd": "Försäkringskassan + samverkande myndigheter. Exakt volym ej offentlig.", "kallsystem": "Webcert/Intygstjänster (sjukintyg), Försäkringskassans handläggningssystem, Arbetsförmedlingens system.", "iot": "Inte tillämpligt.", "standarder": "Försäkringskassans interna standarder. Webbaserat, plattformsoberoende. Svenska molntjänstkrav (ej utländska molntjänster).", "kvalitet": "Försäkringskassans säkerhetsklassade personal. Informationsklassning. Ej hälsodataspecifik kvalitetssäkring."}, "18": {"formaga_checks": ["Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft)"], "formaga_text": "WCMM stärker molekylärmedicin vid svenska universitet. Rekryterar internationella forskare. Inte primärt hälsodatainfrastruktur utan forskningsprogram. Begränsad EHDS-relevans.", "doman": "Molekylärmedicin: single-cell-genomik, spatial transkriptomik, proteomik, metabolomik, kryo-EM. Translationell forskning: grundforskning → klinisk tillämpning.", "frekvens": "Batch (dagligen/veckovis)", "datatyp": "Experimentell data: single-cell RNA-seq (H5AD), spatial data (Visium), proteomikdata (mzML), kryo-EM (MRC/MRCS), mikroskopi (TIFF/OME-TIFF).", "datamangd": "1 000 MSEK Wallenberg-finansiering 2014-2028. 4 noder: LiU, Umeå, GU, Lund. 100+ rekryterade forskare.", "kallsystem": "SciLifeLab-plattformar (NGI, proteomikfaciliteter). Universitetens egna labbutrustning. BioImage Archive, EBI.", "iot": "Laboratorieinstrument: sekvenserare, masspektrometrar, kryo-EM-mikroskop. Inte klinisk IoT.", "standarder": "FAIR-principer, MINSEQE (sekvensering), MIAPE (proteomik). Bioinformatikstandarder (nf-core). Ej hälsodatastandarder.", "kvalitet": "Vetenskaplig peer review. Standardiserade bioinformatikpipelines. Kvalitetskontroller per experiment."}, "19": {"formaga_checks": ["Data governance (styrning, säkerhet, integritet)", "Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft)"], "formaga_text": "AI Sweden IDV kartlade 179 AI-initiativ inom hälso- och sjukvård i 21 regioner. Fokus: federerat lärande, syntetisk data, AI-mognadsbedömning. Avslutat 2025 — lärdomar informerar vidare arbete.", "doman": "AI-tillämpningar i vård: bilddiagnostik-AI, kliniskt beslutsstöd, prediktionsmodeller, NLP på journaltext, processautomation. Kartläggning av 179 initiativ i 21 regioner.", "frekvens": "Ej specificerat", "datatyp": "Kartläggningsdata (enkätresultat, intervjudata). Syntetiska dataset (prototyper). AI-modeller (Python/PyTorch/TensorFlow). Federerat lärande-prototyper.", "datamangd": "179 kartlagda AI-initiativ. 30 MSEK total projektbudget. Pilotprojekt med 4-5 regioner.", "kallsystem": "Regionernas journalsystem (via anonymiserade extrakt). AI Swedens GPU-resurser (Berzelius). HDC Region Halland (samarbetspartner).", "iot": "Inte direkt i kartläggningen. Kartlagda initiativ inkluderar medicinteknisk AI (t.ex. ECG-analys).", "standarder": "OHDSI/OMOP (diskuterat men ej implementerat). Federerat lärande-ramverk (Flower, PySyft). AI Swedens referensarkitektur. Ej hälsodatastandarder formellt.", "kvalitet": "Kartläggningsmetodik dokumenterad. AI-mognadsbedömningsverktyg. Projektets slutrapport publicerad."}, "21": {"formaga_checks": ["Data governance (styrning, säkerhet, integritet)", "Tillgängliggöra data (integration, uppdateringsfrekvens)", "Externa krav (EHDS, NDI)"], "formaga_text": "EU-finansierat EHDS-förberedelseprojekt. KTH koordinerar. Piloterar metadatahantering och datadelning. Partners: Socialstyrelsen, SCB, E-hälsomyndigheten, VR.", "doman": "Metadatahantering för EHDS: datasetkatalogisering, åtkomstregler, kvalitetsindikatorer. Pilotering av EHDS-kompatibel datadelning mellan svenska aktörer.", "frekvens": "Batch (dagligen/veckovis)", "datatyp": "Metadata (DCAT-AP), piloteringsdata från svenska register. EHDS-kompatibla format under utveckling.", "datamangd": "6 MEuro (EU Digital Europe Programme). Multinationellt konsortium. Svensk pilotering med begränsat dataset.", "kallsystem": "Socialstyrelsens register, SCB, E-hälsomyndigheten. HealthData@EU-testbädd.", "iot": "Inte tillämpligt.", "standarder": "EHDS (EU 2025/327), HealthData@EU-noden, DCAT-AP, FHIR R4. EHDS datakategorier (art. 33). Implementerande akter (under utveckling).", "kvalitet": "EU-projektrapportering. Piloteringsresultat utvärderas. EHDS-kravuppfyllnad mäts."}, "22": {"formaga_checks": ["Tillgängliggöra data (integration, uppdateringsfrekvens)", "Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft)", "Externa krav (EHDS, NDI)"], "formaga_text": "Europeisk federerad plattform för cancerbilddata. DICOM-standard. Svenska noder (LiU, Umeå, VB, KI) bidrar. Kopplat till AIDA Data Hub. Cancer imaging prioriterad under EHDS.", "doman": "Cancerbilddiagnostik: CT, MRI, mammografi, patologi (WSI), PET-CT. Alla cancerformer. Annoterade dataset för AI-träning.", "frekvens": "Batch (dagligen/veckovis)", "datatyp": "DICOM (radiologi), WSI-format (patologi: Hamamatsu NDP, Aperio SVS), NIfTI (hjärnbilder), segmenteringsmasker, annotationsdata. SNOMED CT-kodade lesioner.", "datamangd": "17 MEuro EU-budget. 80+ partners. 200 000+ bilder planerat. Svenska bidrag via AIDA Data Hub (52 dataset, 57 TB).", "kallsystem": "Sjukhus-PACS (retrospektiva extrakt), AIDA Data Hub, nationella cancerbildarkiv. Federerad åtkomst utan central lagring.", "iot": "CT-skannrar, MRI, PET-CT, patologiskannrar. Retrospektiv data — inte realtidsström.", "standarder": "DICOM, DICOMweb, FHIR ImagingStudy, SNOMED CT (annotationer). Federerad infrastruktur: EUCAIM Central Hub + nationella noder. FAIR-principer.", "kvalitet": "DICOM-anonymisering (ansiktssuddning, metadata-rensning). Annotationskvalitet: dubbelgranskad av radiologer. Dataset-DOI via DataCite."}, "23": {"formaga_checks": ["Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft)"], "formaga_text": "EuroHPC petascale-superdator vid NSC/Linköping. Generell beräkningsresurs — inte hälsodataspecifik. Kan användas för storskalig hälsodataanalys med rätt avtal.", "doman": "All beräkningsintensiv forskning: klimatmodellering, materialvetenskap, genomik, AI-träning. Hälsodata möjligt men inte primärt.", "frekvens": "Batch (dagligen/veckovis)", "datatyp": "Alla HPC-format. Parallella beräkningsjobb. GPU-acceleration tillgänglig.", "datamangd": "68,5 MEuro (EuroHPC JU + nationellt). Topprestanda: ~30 PFLOPS. Del av NAISS.", "kallsystem": "Forskarnas egna data. EuroHPC-åtkomst via PRACE/EuroHPC JU.", "iot": "Inte tillämpligt.", "standarder": "SLURM, MPI, OpenMP, CUDA. EuroHPC JU access policies.", "kvalitet": "NSC driftstandard. EuroHPC JU uppföljning."}, "24": {"formaga_checks": ["Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft)"], "formaga_text": "EuroHPC AI Factory för storskalig AI-träning. GPU-rik infrastruktur. Inte hälsodataspecifik men kan användas. Koppling till Mimer-systemet vid NSC.", "doman": "Storskalig AI: stora språkmodeller (LLM), datorseende, generativ AI. Hälso-AI möjligt med rätt avtal och datasäkerhet.", "frekvens": "Batch (dagligen/veckovis)", "datatyp": "AI-träningsdata: bilder, text, tabulär, multimodal. GPU-optimerade format (TFRecord, WebDataset).", "datamangd": "60 MEuro (EuroHPC + nationellt). Tusentals GPU:er (NVIDIA H100-generation). 2024-2029.", "kallsystem": "Forskardata, öppna dataset, industripartners data.", "iot": "Inte tillämpligt.", "standarder": "PyTorch, JAX, DeepSpeed. NVIDIA CUDA/NCCL. EuroHPC JU regler. Ej hälsodatastandarder.", "kvalitet": "RISE:s kvalitetsramverk. EuroHPC benchmarks."}, "25": {"formaga_checks": ["Data governance (styrning, säkerhet, integritet)", "Tillgängliggöra data (integration, uppdateringsfrekvens)", "Externa krav (EHDS, NDI)"], "formaga_text": "Europeisk infrastruktur för genomikdatadelning under 1+MG-deklarationen. GA4GH-standarder (Beacon, htsget). Svensk nod vid NBIS. Direkt EHDS-koppling: genomikdata specificerad.", "doman": "Genomikdata: referensgenom, klinisk genomik, populationsgenetik. Fenotypdata kopplad till genom. 27 EU-länder.", "frekvens": "Batch (dagligen/veckovis)", "datatyp": "VCF/gVCF (varianter), BAM/CRAM (alignment), Phenopackets (fenotyp), Beacon v2-svar (discovery). DUO (Data Use Ontology) för åtkomstregler.", "datamangd": "40 MEuro (EU Digital Europe). 32 MSEK till svensk nod (NBIS). Mål: 1+ miljoner genom tillgängliga via federerad infrastruktur.", "kallsystem": "Nationella genomikcentra (GMS i Sverige), biobanker, klinisk genetik. EGA (European Genome-phenome Archive). FEGA Sweden.", "iot": "Sekvensinstrument (indirekt — genererar den data som delas).", "standarder": "GA4GH: Beacon v2, htsget, Phenopackets v2, DUO, Passports. FHIR Genomics IG. DCAT-AP (metadata). ISO 27001 (säkerhet).", "kvalitet": "GA4GH interoperabilitetstester. GDI conformance suite. ELIXIR datakvalitetsramverk."}, "26": {"formaga_checks": ["Data management (sammanhållen data, semantik)", "Tillgängliggöra data (integration, uppdateringsfrekvens)", "Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft)"], "formaga_text": "NBIS är nationellt bioinformatikcentrum vid SciLifeLab. Stödjer forskare med dataanalys, datapublicering, datahantering. Driftar FEGA Sweden, svensk ELIXIR-nod, GDI-implementation.", "doman": "Bioinformatik: genomik, transkriptomik, proteomik, metabolomik, strukturbiologi, bildanalys. Datahantering: DMP, datapublicering, FAIR-implementering.", "frekvens": "Batch (dagligen/veckovis)", "datatyp": "FASTQ/BAM/VCF (genomik), TIFF/OME-TIFF (mikroskopi), mzML (proteomik), HDF5/H5AD (single-cell). nf-core pipelines (144+). Nextflow+Docker/Singularity.", "datamangd": "105 MSEK (2023, VR + SciLifeLab). Noder vid alla MedFak utom Örebro. 40+ bioinformatiker. DDS (Data Delivery System): end-to-end-krypterad dataöverföring.", "kallsystem": "SciLifeLab-plattformar (NGI, Clinical Genomics, Proteomics m.fl.). Internationella arkiv: EGA, ENA, PRIDE, UniProt, PDB. FEGA Sweden.", "iot": "Sekvensinstrument (Illumina, PacBio, Nanopore) — NBIS tar emot data, inte realtidsström.", "standarder": "FAIR-principer. GA4GH (Beacon, htsget, Phenopackets, DUO). ELIXIR RDMkit. nf-core (144+ pipelines). ISO 17025 (NGI ackreditering). Data Stewardship Wizard.", "kvalitet": "FastQC, MultiQC, CheckQC, Cutadapt (bioinformatik-QC). DMP obligatoriska. NBIS erbjuder gratis datahanteringskonsultation. Data lagras minst 10 år."}, "27": {"formaga_checks": ["Data governance (styrning, säkerhet, integritet)", "Avancerad analys och AI (utvecklingsmiljöer, beräkningskraft)"], "formaga_text": "Bianca är NAISS-systemet för känslig data vid UPPMAX/Uppsala. Isolerade projektkluster utan internet. Mest använda miljön för hälsodataforskning i Sverige. Wharf för säker filöverföring.", "doman": "Känslig forskningsdata: klinisk data, genomikdata, registerdata, bilddata. Alla forskningsprojekt med etikgodkännande för känsliga personuppgifter.", "frekvens": "Batch (dagligen/veckovis)", "datatyp": "Alla forskningsformat: VCF, BAM, DICOM, CSV, SAS, STATA, R. Linux-miljö med fria programvaruinstallationer. Singularity-containers.", "datamangd": "4 480 kärnor, 204 noder (128 GB RAM), 10 GPU-noder (NVIDIA A100). >7 PB lagringskapacitet (UPPMAX totalt). Ca 75 MSEK löpande (del av NAISS). Hundratals aktiva projekt.", "kallsystem": "Forskarnas egna data. SCB/Socialstyrelsen (registerdata via utlämning). SciLifeLab/GMS (genomikdata). Internationella arkiv.", "iot": "Inte tillämpligt — beräkningsmiljö, inte datainsamling.", "standarder": "NAISS säkerhetspolicy. Wharf (säker filöverföring). SFTP via SUNET. Tvåfaktorsautentisering. Isolerade projektkluster (ingen internetåtkomst inifrån). SLURM.", "kvalitet": "Bianca-säkerhetsmodell: projektkluster utan nätverksåtkomst, inspelning av alla terminalsessioner (thinlinc), automatisk sessionstidsgräns. UPPMAX supportteam. NAISS SLA."}, "28": {"formaga_checks": ["Data governance (styrning, säkerhet, integritet)", "Externa krav (EHDS, NDI)"], "formaga_text": "Joint Action som utvecklade gemensamma principer för EHDS sekundäranvändning: datakvalitet, metadata, SPE-krav. Resultat informerar EHDS implementerande akter. Sverige deltog aktivt.", "doman": "EHDS-policynivå: datakvalitetsprinciper, metadatastandard, SPE-krav, datasetkategorisering, åtkomstregler, etiska principer för sekundäranvändning.", "frekvens": "Ej specificerat", "datatyp": "Policydokument, rekommendationer, tekniska specifikationer. Piloteringsresultat (begränsad faktisk data).", "datamangd": "21 EU-medlemsstater deltar. Finland koordinerar. Budget ej specificerat (EU4Health Joint Action).", "kallsystem": "Nationella hälsodatamyndigheter i 21 EU-länder. Europeiska kommissionen (DG SANTE, HaDEA).", "iot": "Inte tillämpligt.", "standarder": "EHDS-utkast (nu EU 2025/327), DCAT-AP (metadata), HL7 FHIR, OMOP CDM (diskuterat), ISO 27001 (SPE-krav), GDPR art. 89 (forskningsundantag).", "kvalitet": "EU-projektrapportering. Joint Action-kvalitetssäkring. Peer review av leverabler."}};
function DataDeepDivePanel({ itemNr, onClose }) {
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    storageGet("deepdive:" + itemNr).then(d => {
      setData(d || DEEPDIVE_DEFAULTS[itemNr] || {});
      setLoaded(true);
    });
  }, [itemNr]);
  const save = async () => {
    setSaving(true);
    await storageSet("deepdive:" + itemNr, data);
    setSaving(false);
  };
  const update = (key, val) => setData(prev => ({ ...prev, [key]: val }));
  const toggleCheck = (key, opt) => {
    const arr = data[key + "_checks"] || [];
    const next = arr.includes(opt) ? arr.filter(x => x !== opt) : [...arr, opt];
    setData(prev => ({ ...prev, [key + "_checks"]: next }));
  };
  if (!loaded) return <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}><Loader size={20} /> Laddar...</div>;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1100, display: "flex", justifyContent: "center", alignItems: expanded ? "stretch" : "center", padding: expanded ? 12 : 0, transition: "padding 0.2s" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: expanded ? 12 : 16, width: expanded ? "100%" : 680, maxWidth: expanded ? "100%" : 680, maxHeight: expanded ? "100%" : "85vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 25px 50px rgba(0,0,0,0.25)", transition: "width 0.2s, border-radius 0.2s" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F0F7FF", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Database size={16} color="#1A56DB" />
            <span style={{ fontSize: 15, fontWeight: 700, color: "#1B3A5C", fontFamily: "'DM Sans', sans-serif" }}>Datafördjupning — #{itemNr}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={save} disabled={saving} style={{ padding: "6px 14px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid #4285F4", background: "#4285F4", color: "#fff" }}>
              {saving ? "Sparar..." : "Spara"} 
            </button>
            <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} style={{ padding: "6px 10px", borderRadius: 6, fontSize: 14, cursor: "pointer", border: "1px solid #E5E7EB", background: "#fff", color: "#6B7280" }} title={expanded ? "Förminska" : "Expandera"}>{expanded ? "⊟" : "⊞"}</button>
            <button onClick={onClose} style={{ padding: "6px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer", border: "1px solid #E5E7EB", background: "#fff", color: "#6B7280" }}>Stäng</button>
          </div>
        </div>
        <div style={{ overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {DEEPDIVE_FIELDS.map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>{f.label}</label>
              {f.type === "checktext" ? (
                <div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                    {f.options.map(opt => {
                      const checked = (data[f.key + "_checks"] || []).includes(opt);
                      return <button key={opt} onClick={() => toggleCheck(f.key, opt)} style={{ padding: "4px 10px", borderRadius: 14, fontSize: 10.5, cursor: "pointer", border: checked ? "1px solid #4285F4" : "1px solid #E5E7EB", background: checked ? "#E8F0FE" : "#fff", color: checked ? "#1A56DB" : "#6B7280", fontWeight: checked ? 600 : 400 }}>{opt}</button>;
                    })}
                  </div>
                  <textarea value={data[f.key + "_text"] || ""} onChange={e => update(f.key + "_text", e.target.value)} placeholder="Fritext..." rows={2} style={{ width: "100%", border: "1px solid #E5E7EB", borderRadius: 6, padding: "6px 10px", fontSize: 12, resize: "vertical", fontFamily: "inherit" }} />
                </div>
              ) : f.type === "select" ? (
                <select value={data[f.key] || ""} onChange={e => update(f.key, e.target.value)} style={{ width: "100%", border: "1px solid #E5E7EB", borderRadius: 6, padding: "6px 10px", fontSize: 12, background: "#fff" }}>
                  {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <textarea value={data[f.key] || ""} onChange={e => update(f.key, e.target.value)} rows={2} style={{ width: "100%", border: "1px solid #E5E7EB", borderRadius: 6, padding: "6px 10px", fontSize: 12, resize: "vertical", fontFamily: "inherit" }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
/* ─────────── SUGGESTION FIELD (used inside DetailModal) ─────────── */
function SuggestionField({ itemNr }) {
  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    storageGet("suggestion:" + itemNr).then(d => {
      setText(d || "");
      setLoaded(true);
      if (d && d.length > 0) setExpanded(true);
    });
  }, [itemNr]);
  const save = async () => {
    setSaving(true);
    await storageSet("suggestion:" + itemNr, text);
    setSaving(false);
  };
  return (
    <div style={{ marginTop: 12, borderTop: "1px solid #E5E7EB", paddingTop: 10 }}>
      <button onClick={() => setExpanded(!expanded)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 12, fontWeight: 600, color: "#B45309" }}>
        <Edit3 size={13} />
        Föreslå ändringar {text ? "(" + text.length + " tecken)" : ""}
        {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
      </button>
      {expanded && loaded && (
        <div style={{ marginTop: 6 }}>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={4} placeholder="Skriv ditt förslag här. Alla kan redigera detta fält." style={{ width: "100%", border: "1px solid #E5E7EB", borderRadius: 6, padding: "8px 10px", fontSize: 12, resize: "vertical", fontFamily: "inherit", minHeight: 80, maxHeight: 300 }} />
          <button onClick={save} disabled={saving} style={{ marginTop: 4, padding: "4px 12px", borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid #E8913A", background: saving ? "#FEF3E2" : "#fff", color: "#B45309" }}>
            {saving ? "Sparar..." : "Spara förslag"}
          </button>
        </div>
      )}
    </div>
  );
}
/* ─────────── MAP VIEW ─────────── */
const GEO_ASSIGNMENTS = {
  // city: { lat, lon, label }
  "Linköping": { lat: 58.41, lon: 15.63 },
  "Stockholm": { lat: 59.33, lon: 18.07 },
  "Solna": { lat: 59.36, lon: 18.00 },
  "Göteborg": { lat: 57.71, lon: 11.97 },
  "Uppsala": { lat: 59.86, lon: 17.64 },
  "Lund": { lat: 55.71, lon: 13.19 },
  "Örebro": { lat: 59.27, lon: 15.21 },
  "Halmstad": { lat: 56.67, lon: 12.86 },
  "Falkenberg": { lat: 56.91, lon: 12.49 },
  "Sundsvall": { lat: 62.39, lon: 17.31 },
  "Kalmar": { lat: 56.66, lon: 16.36 },
};
const INIT_GEO = {
  1: "Göteborg", 13: "Linköping", 14: "Linköping", 15: "Linköping",
  16: "Örebro", 17: "Stockholm", 18: "Linköping", 19: "Göteborg",
  20: "Linköping", 21: "Stockholm", 22: "Linköping", 23: "Linköping",
  24: "Linköping", 27: "Uppsala", 29: "Solna", 30: "Göteborg",
  31: "Uppsala", 32: "Lund", 33: "Göteborg", 35: "Örebro",
  37: "Falkenberg", 46: "Solna", 47: "Solna", 55: "Uppsala",
  56: "Stockholm", 62: "Solna", 65: "Solna", 73: "Uppsala",
  74: "Solna", 86: "Stockholm", 92: "Halmstad",
  // Stockholm-based national
  4: "Stockholm", 5: "Stockholm", 8: "Stockholm", 9: "Stockholm",
  38: "Stockholm", 39: "Stockholm", 40: "Stockholm", 41: "Stockholm",
  43: "Stockholm", 44: "Stockholm", 45: "Stockholm", 48: "Stockholm",
  49: "Stockholm", 50: "Stockholm", 51: "Stockholm", 57: "Stockholm",
  58: "Stockholm", 61: "Stockholm", 63: "Stockholm", 64: "Stockholm",
  71: "Stockholm", 72: "Stockholm", 76: "Stockholm", 82: "Stockholm",
  87: "Stockholm", 93: "Stockholm", 94: "Stockholm", 96: "Stockholm",
  // DIGG
  10: "Sundsvall", 95: "Sundsvall",
  // RISE
  75: "Göteborg",
  // SciLifeLab
  11: "Stockholm", 25: "Uppsala", 26: "Uppsala", 53: "Stockholm", 54: "Stockholm",
};
// National (no single location) and International
const NATIONAL_NRS = [2, 3, 6, 7, 34, 36, 42, 59, 60, 66, 97,
  // Legislation/policy
  78, 79, 80, 81, 83, 85, 88, 89, 90, 91];
const INTL_NRS = [28, 52, 67, 68, 69, 70, 77, 84, 12];
function MapView({ data, onClickItem }) {
  const [selectedCity, setSelectedCity] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const typColor = (typ) => {
    if (!typ) return "#6B7280";
    const t = typ.toLowerCase();
    if (t.includes("infrastruktur")) return "#4285F4";
    if (t.includes("samverkan") || t.includes("forskning")) return "#E8913A";
    if (t.includes("superdator")) return "#8B5CF6";
    if (t.includes("lagstiftning") || t.includes("strategi") || t.includes("policy")) return "#DC2626";
    return "#6B7280";
  };
  // Group by city
  const cityGroups = useMemo(() => {
    const groups = {};
    data.forEach(item => {
      const city = INIT_GEO[item.nr];
      if (city && GEO_ASSIGNMENTS[city]) {
        if (!groups[city]) groups[city] = [];
        groups[city].push(item);
      }
    });
    return groups;
  }, [data]);
  const nationalItems = useMemo(() => data.filter(d => NATIONAL_NRS.includes(d.nr)), [data]);
  const intlItems = useMemo(() => data.filter(d => INTL_NRS.includes(d.nr)), [data]);
  // Load Leaflet and init map
  useEffect(() => {
    if (mapInstanceRef.current) return;
    // Load Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(link);
    }
    // Load Leaflet JS
    const loadLeaflet = () => {
      return new Promise((resolve) => {
        if (window.L) { resolve(window.L); return; }
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
        script.onload = () => resolve(window.L);
        document.head.appendChild(script);
      });
    };
    loadLeaflet().then((L) => {
      if (!mapRef.current || mapInstanceRef.current) return;
      const map = L.map(mapRef.current, {
        center: [62.5, 16],
        zoom: 4,
        zoomControl: true,
        scrollWheelZoom: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 10,
        minZoom: 3,
      }).addTo(map);
      mapInstanceRef.current = map;
      // Add markers
      Object.entries(cityGroups).forEach(([city, items]) => {
        const geo = GEO_ASSIGNMENTS[city];
        if (!geo) return;
        const count = items.length;
        const r = Math.max(12, Math.min(28, 8 + count * 1.5));
        const icon = L.divIcon({
          className: "",
          html: "<div style='width:" + (r*2) + "px;height:" + (r*2) + "px;border-radius:50%;background:#2563EB;border:2.5px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;font-size:" + (r > 14 ? 11 : 9) + "px;font-weight:700;font-family:DM Sans,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:pointer'>" + count + "</div>",
          iconSize: [r*2, r*2],
          iconAnchor: [r, r],
        });
        const marker = L.marker([geo.lat, geo.lon], { icon }).addTo(map);
        const popupContent = "<div style='font-family:DM Sans,system-ui,sans-serif;min-width:200px'>" +
          "<div style='font-weight:700;font-size:14px;color:#1B3A5C;margin-bottom:4px'>" + (city === "Solna" ? "Solna/Stockholm" : city) + "</div>" +
          "<div style='font-size:11px;color:#6B7280;margin-bottom:6px'>" + count + " initiativ</div>" +
          items.map(i => "<div style='font-size:10px;padding:2px 0;color:#374151'><b style='color:" + typColor(i.typ) + "'>#" + i.nr + "</b> " +
            (i.n.length > 35 ? i.n.substring(0,35) + "…" : i.n) + "</div>").join("") +
          "</div>";
        marker.bindPopup(popupContent, { maxWidth: 300, maxHeight: 250 });
        marker.on("click", () => setSelectedCity(city));
        markersRef.current[city] = marker;
      });
      // Fit bounds to Sweden
      map.fitBounds([[55.3, 11], [69.1, 24]], { padding: [20, 20] });
    });
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);
  // Update markers when data changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    // Markers are static since data doesn't change city assignments
  }, [data, cityGroups]);
  // Pan to selected city
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedCity) return;
    const geo = GEO_ASSIGNMENTS[selectedCity];
    if (geo) {
      mapInstanceRef.current.setView([geo.lat, geo.lon], 7, { animate: true });
      if (markersRef.current[selectedCity]) {
        markersRef.current[selectedCity].openPopup();
      }
    }
  }, [selectedCity]);
  const InitBadge = ({ item }) => (
    <div onClick={() => onClickItem(item)} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 5, fontSize: 10, cursor: "pointer", background: typColor(item.typ) + "15", border: "1px solid " + typColor(item.typ) + "40", color: typColor(item.typ), fontWeight: 500, lineHeight: 1.2 }}
      onMouseEnter={e => e.currentTarget.style.background = typColor(item.typ) + "30"}
      onMouseLeave={e => e.currentTarget.style.background = typColor(item.typ) + "15"}>
      <span style={{ fontWeight: 700 }}>#{item.nr}</span>
      <span style={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.n.length > 25 ? item.n.substring(0, 25) + "…" : item.n}</span>
    </div>
  );
  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Leaflet Map */}
      <div style={{ flex: "0 0 420px", position: "relative", borderRight: "1px solid #E5E7EB" }}>
        <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
        <div style={{ position: "absolute", bottom: 30, left: 8, background: "rgba(255,255,255,0.93)", borderRadius: 8, padding: "6px 10px", fontSize: 9, color: "#6B7280", border: "1px solid #E5E7EB", zIndex: 1000, backdropFilter: "blur(4px)" }}>
          {[["#4285F4", "Infrastruktur"], ["#E8913A", "Samverkan"], ["#8B5CF6", "Superdator"], ["#DC2626", "Lagstiftning"]].map(([col, l]) => (
            <span key={l} style={{ display: "inline-flex", alignItems: "center", gap: 3, marginRight: 8 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: col }} /> {l}
            </span>
          ))}
        </div>
      </div>
      {/* Right panel */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {selectedCity && cityGroups[selectedCity] ? (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <MapPin size={16} color="#1A56DB" />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1B3A5C", margin: 0 }}>{selectedCity === "Solna" ? "Solna/Stockholm" : selectedCity}</h3>
              <span style={{ fontSize: 11, color: "#6B7280", background: "#F3F4F6", padding: "2px 8px", borderRadius: 10 }}>{cityGroups[selectedCity].length} initiativ</span>
              <button onClick={() => { setSelectedCity(null); if (mapInstanceRef.current) mapInstanceRef.current.fitBounds([[55.3, 11], [69.1, 24]], { padding: [20, 20] }); }} style={{ marginLeft: "auto", padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer", border: "1px solid #E5E7EB", background: "#fff", color: "#6B7280" }}>Visa alla</button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {cityGroups[selectedCity].map(i => <InitBadge key={i.nr} item={i} />)}
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1B3A5C", margin: "0 0 10px" }}>Geografisk fördelning</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {Object.entries(cityGroups).sort((a, b) => b[1].length - a[1].length).map(([city, items]) => (
                <div key={city} onClick={() => setSelectedCity(city)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 6, cursor: "pointer", border: "1px solid #E5E7EB", background: "#fff" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#F0F7FF"}
                  onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                  <MapPin size={12} color="#3B82F6" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#1B3A5C", minWidth: 100 }}>{city === "Solna" ? "Solna/Stockholm" : city}</span>
                  <div style={{ flex: 1, height: 6, background: "#F3F4F6", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: (items.length / Math.max(...Object.values(cityGroups).map(g => g.length)) * 100) + "%", background: "#3B82F6", borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#374151", minWidth: 24, textAlign: "right" }}>{items.length}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* National */}
        <div style={{ marginBottom: 16, borderTop: "1px solid #E5E7EB", paddingTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 15 }}>🇸🇪</span>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#1B3A5C", margin: 0 }}>Nationella initiativ</h3>
            <span style={{ fontSize: 10, color: "#9CA3AF", background: "#F3F4F6", padding: "2px 8px", borderRadius: 10 }}>{nationalItems.length}</span>
          </div>
          <p style={{ fontSize: 10, color: "#9CA3AF", margin: "0 0 6px" }}>Verkar över hela Sverige — ingen enskild ort</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {nationalItems.map(i => <InitBadge key={i.nr} item={i} />)}
          </div>
        </div>
        {/* International */}
        <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Globe size={14} color="#6B7280" />
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#1B3A5C", margin: 0 }}>Internationella / EU</h3>
            <span style={{ fontSize: 10, color: "#9CA3AF", background: "#F3F4F6", padding: "2px 8px", borderRadius: 10 }}>{intlItems.length}</span>
          </div>
          <p style={{ fontSize: 10, color: "#9CA3AF", margin: "0 0 6px" }}>Gränsöverskridande eller EU-styrda initiativ</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {intlItems.map(i => <InitBadge key={i.nr} item={i} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
/* ─────────── TAG GROUPS & CONNECTION CATEGORIES ─────────── */
const TAG_GROUPS = [
  { key: "standarder", label: "Standarder", tags: ["OMOP", "OpenEHR", "HL7", "FHIR", "Health D-CAT AP", "GA4GH", "ICD-10", "Snomed CT", "KVÅ", "NTjP", "ATC", "GSIM"] },
  { key: "anvfall", label: "Användningsfall", tags: ["Vård av patient", "Vård av annan patient", "Precisionsmedicin", "PROM", "PREM", "Innovation", "Styrning", "Analys", "Uppföljning", "Forskning", "Life science", "Kvalitetsregister", "Hälsodataregister"] },
  { key: "anvomrade", label: "Användningsområde", tags: ["Genomik", "Biobank", "Sekundäranvändning", "Primäranvändning"] },
];
const CONNECTION_CATS = ["Samskapa", "Överlapp", "Stötta", "Docka in i", "Lära av", "Hålla koll på"];
const CAT_COLORS = { "Samskapa": "#1A56DB", "Överlapp": "#B45309", "Stötta": "#166534", "Docka in i": "#7E22CE", "Lära av": "#0F766E", "Hålla koll på": "#6B7280" };

function TagGroupPicker({ override, setOverride, autoSave, itemNr }) {
  const [openGroup, setOpenGroup] = useState(null);
  const tags = (override && override.tags) || {};
  const toggle = (groupKey, tag) => {
    const next = JSON.parse(JSON.stringify(override));
    if (!next.tags) next.tags = {};
    if (!next.tags[groupKey]) next.tags[groupKey] = [];
    const idx = next.tags[groupKey].indexOf(tag);
    if (idx >= 0) next.tags[groupKey].splice(idx, 1); else next.tags[groupKey].push(tag);
    setOverride(next);
    if (autoSave) autoSave(next);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {TAG_GROUPS.map(g => {
        const selected = tags[g.key] || [];
        const isOpen = openGroup === g.key;
        return (
          <div key={g.key}>
            <div onClick={() => setOpenGroup(isOpen ? null : g.key)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#1B3A5C", textTransform: "uppercase", letterSpacing: 0.4 }}>{g.label}</span>
              <span style={{ fontSize: 10, color: "#5a7a9a" }}>({selected.length})</span>
              <span style={{ fontSize: 10, color: "#5a7a9a", marginLeft: 2 }}>{isOpen ? "▾" : "▸"}</span>
            </div>
            {selected.length > 0 && !isOpen && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {selected.map(t => (
                  <span key={t} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "#1B3A5C", color: "#fff", fontWeight: 600 }}>{t}</span>
                ))}
              </div>
            )}
            {isOpen && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, padding: "8px 0" }}>
                {g.tags.map(t => {
                  const sel = selected.includes(t);
                  return (
                    <span key={t} onClick={() => toggle(g.key, t)} style={{ fontSize: 11.5, padding: "3px 10px", borderRadius: 10, cursor: "pointer", fontWeight: 600, border: sel ? "1.5px solid #1B3A5C" : "1.5px solid #C0C8D0", background: sel ? "#1B3A5C" : "#fff", color: sel ? "#fff" : "#2c3e50", transition: "all 0.15s" }}>{t}</span>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ConnectionPicker({ itemNr, starred, override, setOverride, autoSave, overridesCache }) {
  const [open, setOpen] = useState(false);
  const [editingNr, setEditingNr] = useState(null);
  const connections = (override && override.connections) || [];
  const others = starred.filter(i => i.nr !== itemNr);
  const connMap = {};
  connections.forEach(c => { connMap[c.nr] = c.cats || []; });

  const toggleConnection = (targetNr) => {
    const next = JSON.parse(JSON.stringify(override));
    if (!next.connections) next.connections = [];
    const idx = next.connections.findIndex(c => c.nr === targetNr);
    if (idx >= 0) {
      next.connections.splice(idx, 1);
      if (editingNr === targetNr) setEditingNr(null);
    } else {
      next.connections.push({ nr: targetNr, cats: [] });
      setEditingNr(targetNr);
    }
    setOverride(next);
    if (autoSave) autoSave(next);
  };

  const toggleCat = (targetNr, cat) => {
    const next = JSON.parse(JSON.stringify(override));
    if (!next.connections) next.connections = [];
    const conn = next.connections.find(c => c.nr === targetNr);
    if (!conn) return;
    if (!conn.cats) conn.cats = [];
    const idx = conn.cats.indexOf(cat);
    if (idx >= 0) conn.cats.splice(idx, 1); else conn.cats.push(cat);
    setOverride(next);
    if (autoSave) autoSave(next);
  };

  const connectedItems = connections.filter(c => others.some(o => o.nr === c.nr));

  return (
    <div>
      {connectedItems.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: open ? 12 : 0 }}>
          {connectedItems.map(c => {
            const item = others.find(o => o.nr === c.nr);
            if (!item) return null;
            const col = DEL_COLORS[item.del] || DEL_COLORS.A;
            return (
              <div key={c.nr} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "#F6F8FA", borderRadius: 8, border: "1px solid #D0D7DE" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: col.text, background: col.bg, padding: "1px 6px", borderRadius: 4 }}>{item.nr}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#0f1f2e", flex: 1 }}>{item.n.length > 40 ? item.n.substring(0, 40) + "…" : item.n}</span>
                <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                  {(c.cats || []).map(cat => (
                    <span key={cat} style={{ fontSize: 9.5, padding: "1px 6px", borderRadius: 8, background: CAT_COLORS[cat] || "#6B7280", color: "#fff", fontWeight: 600 }}>{cat}</span>
                  ))}
                </div>
                <span onClick={() => setEditingNr(editingNr === c.nr ? null : c.nr)} style={{ cursor: "pointer", fontSize: 11, color: "#5a7a9a", fontWeight: 600 }}>✎</span>
                <span onClick={() => toggleConnection(c.nr)} style={{ cursor: "pointer", fontSize: 13, color: "#B91C1C", fontWeight: 600, lineHeight: 1 }}>×</span>
              </div>
            );
          })}
          {editingNr && connMap[editingNr] !== undefined && (
            <div style={{ padding: "8px 12px", background: "#EFF2F5", borderRadius: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#1B3A5C", textTransform: "uppercase", marginBottom: 6 }}>Kategorisera koppling till #{editingNr}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {CONNECTION_CATS.map(cat => {
                  const sel = (connMap[editingNr] || []).includes(cat);
                  return (
                    <span key={cat} onClick={() => toggleCat(editingNr, cat)} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, cursor: "pointer", fontWeight: 600, border: sel ? "none" : "1.5px solid #C0C8D0", background: sel ? (CAT_COLORS[cat] || "#6B7280") : "#fff", color: sel ? "#fff" : "#2c3e50", transition: "all 0.15s" }}>{cat}</span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      <button onClick={() => setOpen(!open)} style={{ fontSize: 12, fontWeight: 600, color: "#1B3A5C", background: "none", border: "1.5px solid #1B3A5C", borderRadius: 8, padding: "5px 14px", cursor: "pointer", marginTop: connectedItems.length > 0 ? 8 : 0 }}>
        {open ? "Stäng" : "+ Koppla till annat initiativ"}
      </button>
      {open && (
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
          {others.map(item => {
            const isConn = connMap[item.nr] !== undefined;
            const col = DEL_COLORS[item.del] || DEL_COLORS.A;
            return (
              <div key={item.nr} onClick={() => { toggleConnection(item.nr); }} style={{ padding: "8px 12px", borderRadius: 8, cursor: "pointer", border: isConn ? "2px solid #1B3A5C" : "1.5px solid #D0D7DE", background: isConn ? "#E8EDF5" : "#fff", transition: "all 0.15s" }}
                onMouseEnter={e => { if (!isConn) e.currentTarget.style.borderColor = "#7a8a9e"; }} onMouseLeave={e => { if (!isConn) e.currentTarget.style.borderColor = "#D0D7DE"; }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: col.text, background: col.bg, padding: "1px 5px", borderRadius: 4 }}>{item.nr}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: "#0f1f2e" }}>{item.n.length > 30 ? item.n.substring(0, 30) + "…" : item.n}</span>
                  {isConn && <span style={{ marginLeft: "auto", fontSize: 14, color: "#1B3A5C" }}>✓</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────── PRIORITIZED VIEW (Prioriterade) ─────────── */
// Prio-specifika fält som inte renderas på det vanliga kortet — används av "Alla med Prio-fält ifyllda"-läget.
const PRIO_ONLY_FIELDS = ["status", "behov", "behovsniva", "overlap", "anvtyp", "nyttjande", "forutsattningar", "outnyttjat", "agarskap", "styrning", "ekonomi", "strategi", "ovrigt"];
const PRIO_SECTIONS = [
  { title: "Syfte & behov", nr: 1, fields: [
    { key: "fok", label: "Hälsodatafokus", hint: "Vilken typ av hälsodata hanteras? Vilka datatyper och dataflöden omfattas?" },
    { key: "typ", label: "Typ", hint: "T.ex. register, plattform, standard, kvalitetssystem…" },
    { key: "nk", label: "Nyckelkaraktäristik", hint: "Vad utmärker initiativet? Syfte, omfattning och funktionalitet" },
    { key: "status", label: "Status", hint: "Under utveckling / driftsatt / används i projektform / används rutinmässigt för vård eller forskning" },
    { key: "behov", label: "Behov & gap", hint: "Vilka prioriterade behov fyller initiativet utifrån vård- och forskningsändamål? Vilka gap finns?" },
    { key: "behovsniva", label: "Behovsnivå", hint: "Nationellt, regionalt eller lokalt behov?" },
    { key: "overlap", label: "Överlapp med andra infrastrukturer", hint: "Vilka infrastrukturer överlappar? Typ av överlapp (funktionell / data / målgrupp) och grad (låg / medel / hög)" },
  ]},
  { title: "Nyttjande & effekt", nr: 2, fields: [
    { key: "mg", label: "Målgrupp", hint: "Vem använder infrastrukturen?" },
    { key: "anvtyp", label: "Användningstyp", hint: "Forskning, klinik, AI, verksamhetsutveckling, kvalitetsarbete?" },
    { key: "nyttjande", label: "Nyttjandegrad", hint: "Antal användare, projekt och regioner. Konkreta nyttor och utfall" },
    { key: "forutsattningar", label: "Förutsättningar för nyttjande", hint: "Vad krävs av regionerna? Resurser, kompetenser och andra förutsättningar för dataproduktion, överföring, lagring och användning" },
    { key: "outnyttjat", label: "Outnyttjad kapacitet", hint: "Vad finns men används inte? Potential för breddad användning" },
  ]},
  { title: "Organisation & ägarskap", nr: 3, fields: [
    { key: "ans", label: "Ansvarig", hint: "Vem ansvarar för initiativet?" },
    { key: "akt", label: "Aktörer", hint: "Vilka organisationer är involverade?" },
    { key: "agarskap", label: "Ägandeskap & åtagande", hint: "Regionernas åtagande och ägandeskap. Villkor för överlåtelse (lärarundantag, fribrev, kommersiella avtal). Ansvar, beslutsbefogenheter, nyttjanderätter" },
    { key: "styrning", label: "Styrning & samverkan", hint: "Beslutsstruktur och organisation. Möjlighet till ökat nyttjande av regionerna? Förutsättningar för samtliga 21 regioner att delta" },
  ]},
  { title: "Teknik & standarder", nr: 4, fields: [
    { key: "tek", label: "Teknik", hint: "Teknisk uppbyggnad: central lagring, on-prem, off-prem, molntjänst (t.ex. Azure)?" },
    { key: "ds", label: "Datastandarder", hint: "Vilka standarder används och stöds? Strategisk inriktning för standarder" },
  ]},
  { title: "Ekonomi & strategi", nr: 5, fields: [
    { key: "ekonomi", label: "Ekonomisk modell", hint: "Hittills nedlagda kostnader, regionernas och andra finansiärers åtagande, fördelning av kostnader för utveckling, drift och förvaltning" },
    { key: "strategi", label: "Strategisk betydelse", hint: "Kritikalitet för vård, forskning och nationella mål (t.ex. EHDS). Framtida potential och möjlighet till breddad användning" },
  ]},
  { title: "Övrigt", nr: 6, fields: [
    { key: "ovrigt", label: "Övriga kommentarer", hint: "Övriga relevanta frågeställningar, observationer eller noteringar" },
  ]},
];
function PrioFieldEditor({ field, item, override, setOverride, autoSave }) {
  const [editing, setEditing] = useState(false);
  const origVal = item[field.key] || "";
  const hasOv = override.fields && override.fields[field.key] !== undefined;
  const displayVal = hasOv ? override.fields[field.key] : origVal;
  const save = (val) => {
    const next = JSON.parse(JSON.stringify(override));
    if (!next.fields) next.fields = {};
    if (!next.fieldHistory) next.fieldHistory = {};
    if (!next.fieldHistory[field.key]) next.fieldHistory[field.key] = [];
    next.fieldHistory[field.key].push(hasOv ? next.fields[field.key] : origVal);
    if (next.fieldHistory[field.key].length > 10) next.fieldHistory[field.key] = next.fieldHistory[field.key].slice(-10);
    next.fields[field.key] = val;
    setOverride(next);
    setEditing(false);
    if (autoSave) autoSave(next);
  };
  if (editing) {
    return (
      <textarea defaultValue={displayVal} rows={2} autoFocus onBlur={e => save(e.target.value)}
        onKeyDown={e => { if (e.key === "Escape") setEditing(false); }}
        placeholder={field.hint || ""}
        style={{ width: "100%", border: "1.5px solid #1B3A5C", borderRadius: 6, padding: "6px 10px", fontSize: 13, resize: "vertical", fontFamily: "inherit", minHeight: 44, lineHeight: 1.5, color: "#1a1a1a" }} />
    );
  }
  return (
    <div onClick={() => setEditing(true)} style={{ cursor: "pointer", fontSize: 13, color: displayVal ? "#1a1a1a" : "#7a8a9e", lineHeight: 1.55, minHeight: 22, borderRadius: 5, padding: "3px 6px", transition: "background 0.15s", fontStyle: displayVal ? "normal" : "italic" }}
      onMouseEnter={e => { e.currentTarget.style.background = "#E8EDF2"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
      {displayVal || (field.hint || "Klicka för att redigera…")}
      {hasOv && <span style={{ fontSize: 9, color: "#D97706", marginLeft: 4 }}>✏️</span>}
    </div>
  );
}
function PrioritizedView({ data, overridesCache, refreshOverrides, onClickItem }) {
  const [mode, setMode] = useState("starred"); // "starred" | "filled"
  const [layout, setLayout] = useState("list"); // "list" | "grid"
  const [modalItem, setModalItem] = useState(null);
  const starred = useMemo(() => data.filter(i => {
    const ov = overridesCache[i.nr];
    if (mode === "starred") return ov && ov.arbetaVidere;
    // "filled" — alla med minst ett Prio-only-fält ifyllt
    if (!ov || !ov.fields) return false;
    return PRIO_ONLY_FIELDS.some(k => {
      const v = ov.fields[k];
      return v != null && String(v).trim() !== "";
    });
  }), [data, overridesCache, mode]);
  const [overrides, setOverrides] = useState({});
  const [selectedExport, setSelectedExport] = useState(new Set());
  useEffect(() => {
    starred.forEach(item => {
      getOverride(item.nr).then(ov => {
        setOverrides(prev => ({ ...prev, [item.nr]: ov }));
      });
    });
  }, [starred]);
  const setOvForNr = (nr) => (next) => {
    setOverrides(prev => ({ ...prev, [nr]: next }));
  };
  const autoSaveForNr = (nr) => (nextOverride) => {
    saveOverride(nr, nextOverride).then(() => { if (refreshOverrides) refreshOverrides(); });
  };
  const toggleExportSelect = (nr) => setSelectedExport(prev => { const n = new Set(prev); if (n.has(nr)) n.delete(nr); else n.add(nr); return n; });
  const selectAllForExport = () => { if (selectedExport.size === starred.length) setSelectedExport(new Set()); else setSelectedExport(new Set(starred.map(i => i.nr))); };

  const buildCardMarkdown = (item, ov) => {
    const lines = [];
    lines.push("# " + item.nr + ". " + item.n);
    lines.push("");
    lines.push("**Delområde:** " + (item.sub || "–") + "  ");
    lines.push("**Beskrivning:** " + (item.d || "–"));
    lines.push("");
    PRIO_SECTIONS.forEach(section => {
      lines.push("## " + section.nr + ". " + section.title);
      lines.push("");
      section.fields.forEach(f => {
        const hasOv = ov.fields && ov.fields[f.key] !== undefined;
        const val = hasOv ? ov.fields[f.key] : (item[f.key] || "");
        lines.push("**" + f.label + ":** " + (val || "–"));
      });
      lines.push("");
    });
    lines.push("## 7. Taggning");
    lines.push("");
    const tags = ov.tags || {};
    TAG_GROUPS.forEach(g => {
      const sel = tags[g.key] || [];
      lines.push("**" + g.label + ":** " + (sel.length > 0 ? sel.join(", ") : "–"));
    });
    lines.push("");
    lines.push("## 8. Kopplingar");
    lines.push("");
    const conns = ov.connections || [];
    if (conns.length === 0) { lines.push("Inga kopplingar"); }
    else {
      conns.forEach(c => {
        const target = data.find(d => d.nr === c.nr);
        const name = target ? target.n : "Nr " + c.nr;
        const cats = (c.cats || []).join(", ");
        lines.push("- **" + c.nr + ". " + name + "**" + (cats ? " (" + cats + ")" : ""));
      });
    }
    lines.push("");
    return lines.join("\n");
  };

  const exportMarkdown = () => {
    const items = starred.filter(i => selectedExport.has(i.nr));
    if (items.length === 0) return;
    const parts = items.map(item => buildCardMarkdown(item, overrides[item.nr] || {}));
    const md = "# Prioriterade initiativ — Export\n\n_Exporterad " + new Date().toLocaleDateString("sv-SE") + "_\n\n---\n\n" + parts.join("\n---\n\n");
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prioriterade-initiativ-" + new Date().toISOString().slice(0, 10) + ".md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const printCards = () => {
    const items = starred.filter(i => selectedExport.has(i.nr));
    if (items.length === 0) return;
    const parts = items.map(item => {
      const ov = overrides[item.nr] || {};
      let html = '<div style="page-break-after:always;font-family:system-ui,sans-serif;max-width:700px;margin:0 auto;padding:20px 0">';
      html += '<h1 style="font-size:22px;color:#0f1f2e;border-bottom:2px solid #1B3A5C;padding-bottom:8px">' + item.nr + '. ' + item.n + '</h1>';
      html += '<p style="color:#3a4a5a;font-size:13px"><strong>Delområde:</strong> ' + (item.sub || '–') + '</p>';
      html += '<p style="color:#1a1a1a;font-size:13px">' + (item.d || '') + '</p>';
      PRIO_SECTIONS.forEach(section => {
        html += '<h2 style="font-size:15px;color:#1B3A5C;margin-top:18px;border-left:3px solid #1B3A5C;padding-left:8px">' + section.nr + '. ' + section.title + '</h2>';
        html += '<table style="width:100%;border-collapse:collapse;font-size:12.5px">';
        section.fields.forEach(f => {
          const hasOvF = ov.fields && ov.fields[f.key] !== undefined;
          const val = hasOvF ? ov.fields[f.key] : (item[f.key] || '');
          html += '<tr><td style="padding:4px 8px;font-weight:700;color:#2c3e50;width:180px;vertical-align:top;border-bottom:1px solid #eee">' + f.label + '</td>';
          html += '<td style="padding:4px 8px;color:#1a1a1a;border-bottom:1px solid #eee">' + (val || '<span style="color:#999">–</span>') + '</td></tr>';
        });
        html += '</table>';
      });
      html += '<h2 style="font-size:15px;color:#1B3A5C;margin-top:18px;border-left:3px solid #1B3A5C;padding-left:8px">7. Taggning</h2>';
      const tags = ov.tags || {};
      TAG_GROUPS.forEach(g => {
        const sel = tags[g.key] || [];
        html += '<p style="font-size:12.5px;margin:4px 0"><strong>' + g.label + ':</strong> ' + (sel.length > 0 ? sel.map(t => '<span style="background:#1B3A5C;color:#fff;padding:1px 7px;border-radius:8px;font-size:11px;margin-right:3px">' + t + '</span>').join(' ') : '–') + '</p>';
      });
      html += '<h2 style="font-size:15px;color:#1B3A5C;margin-top:18px;border-left:3px solid #1B3A5C;padding-left:8px">8. Kopplingar</h2>';
      const conns = ov.connections || [];
      if (conns.length === 0) { html += '<p style="font-size:12.5px;color:#999">Inga kopplingar</p>'; }
      else {
        html += '<ul style="font-size:12.5px;padding-left:20px">';
        conns.forEach(c => {
          const target = data.find(dd => dd.nr === c.nr);
          const name = target ? target.n : 'Nr ' + c.nr;
          const cats = (c.cats || []).map(cat => '<span style="background:' + (CAT_COLORS[cat] || '#6B7280') + ';color:#fff;padding:1px 6px;border-radius:8px;font-size:10px;margin-left:4px">' + cat + '</span>').join('');
          html += '<li><strong>' + c.nr + '. ' + name + '</strong>' + cats + '</li>';
        });
        html += '</ul>';
      }
      html += '</div>';
      return html;
    });
    const w = window.open('', '_blank');
    w.document.write('<html><head><title>Prioriterade initiativ</title></head><body style="margin:0;padding:20px">' + parts.join('') + '</body></html>');
    w.document.close();
    w.print();
  };

  const renderPrioCard = (item) => {
    const col = DEL_COLORS[item.del];
    const ov = overrides[item.nr];
    if (!ov) return null;
    return (
      <div key={item.nr} style={{ background: "#fff", borderRadius: 14, border: "1px solid #D0D7DE", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", overflow: "hidden" }}>
        <div style={{ height: 4, background: `linear-gradient(90deg, ${col.border}, ${col.border}88)` }} />
        <div style={{ padding: "18px 24px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <input type="checkbox" checked={selectedExport.has(item.nr)} onChange={() => toggleExportSelect(item.nr)} style={{ width: 16, height: 16, accentColor: "#1B3A5C", cursor: "pointer", flexShrink: 0 }} title="Markera för export/utskrift" />
            <span style={{ fontSize: 11, fontWeight: 700, color: col.text, background: col.bg, padding: "3px 10px", borderRadius: 6 }}>{item.sub}</span>
            <span style={{ fontSize: 11, color: "#3a4a5a", fontWeight: 600 }}>Nr {item.nr}</span>
            <span style={{ fontSize: 13 }}>⭐</span>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f1f2e", margin: 0, flex: 1, fontFamily: "'DM Sans', sans-serif" }}>{item.n}</h3>
          </div>
          {PRIO_SECTIONS.map(section => (
            <div key={section.title} style={{ marginBottom: 16 }}>
              <div style={{ borderLeft: "3px solid #1B3A5C", paddingLeft: 10, marginBottom: 8 }}>
                <h4 style={{ fontSize: 12.5, fontWeight: 700, color: "#1B3A5C", margin: 0, textTransform: "uppercase", letterSpacing: 0.6, fontFamily: "'DM Sans', sans-serif" }}>
                  <span style={{ color: "#5a7a9a", marginRight: 6 }}>{section.nr}.</span>{section.title}
                </h4>
              </div>
              <div style={{ background: "#F6F8FA", borderRadius: 8, padding: "12px 16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: section.fields.length === 1 ? "1fr" : "1fr 1fr", gap: "10px 24px" }}>
                  {section.fields.map(f => (
                    <div key={f.key}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#2c3e50", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 3 }}>{f.label}</div>
                      <PrioFieldEditor field={f} item={item} override={ov} setOverride={setOvForNr(item.nr)} autoSave={autoSaveForNr(item.nr)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <div style={{ marginBottom: 16 }}>
            <div style={{ borderLeft: "3px solid #1B3A5C", paddingLeft: 10, marginBottom: 8 }}>
              <h4 style={{ fontSize: 12.5, fontWeight: 700, color: "#1B3A5C", margin: 0, textTransform: "uppercase", letterSpacing: 0.6, fontFamily: "'DM Sans', sans-serif" }}>
                <span style={{ color: "#5a7a9a", marginRight: 6 }}>7.</span>Taggning
              </h4>
            </div>
            <div style={{ background: "#F6F8FA", borderRadius: 8, padding: "12px 16px" }}>
              <TagGroupPicker override={ov} setOverride={setOvForNr(item.nr)} autoSave={autoSaveForNr(item.nr)} itemNr={item.nr} />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ borderLeft: "3px solid #1B3A5C", paddingLeft: 10, marginBottom: 8 }}>
              <h4 style={{ fontSize: 12.5, fontWeight: 700, color: "#1B3A5C", margin: 0, textTransform: "uppercase", letterSpacing: 0.6, fontFamily: "'DM Sans', sans-serif" }}>
                <span style={{ color: "#5a7a9a", marginRight: 6 }}>8.</span>Kopplingar till andra prioriterade
              </h4>
            </div>
            <div style={{ background: "#F6F8FA", borderRadius: 8, padding: "12px 16px" }}>
              <ConnectionPicker itemNr={item.nr} starred={starred} override={ov} setOverride={setOvForNr(item.nr)} autoSave={autoSaveForNr(item.nr)} overridesCache={overridesCache} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (starred.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: "#5a6a7a" }}>
        <span style={{ fontSize: 40, display: "block", marginBottom: 12 }}>⭐</span>
        <p style={{ fontSize: 15, fontWeight: 600, color: "#1B3A5C" }}>Inga prioriterade initiativ</p>
        <p style={{ fontSize: 13, color: "#3a4a5a" }}>Öppna ett kort och klicka "Arbeta vidare" för att stjärnmarkera det</p>
      </div>
    );
  }
  return (
    <div style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 20, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f1f2e", margin: "0 0 4px", fontFamily: "'DM Sans', sans-serif" }}>Prioriterade initiativ</h2>
          <p style={{ fontSize: 13, color: "#3a4a5a", margin: "0 0 8px" }}>{starred.length} {mode === "starred" ? "stjärnmarkerade initiativ" : "initiativ med Prio-fält ifyllda"} — klicka på fältvärden för att redigera direkt</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button onClick={() => setMode("starred")} style={{ padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: mode === "starred" ? "1px solid #F59E0B" : "1px solid #E5E7EB", background: mode === "starred" ? "#FFFBEB" : "#fff", color: mode === "starred" ? "#B45309" : "#6B7280" }}>⭐ Bara stjärnmärkta</button>
            <button onClick={() => setMode("filled")} style={{ padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: mode === "filled" ? "1px solid #1B3A5C" : "1px solid #E5E7EB", background: mode === "filled" ? "#E8F0FE" : "#fff", color: mode === "filled" ? "#1A56DB" : "#6B7280" }}>📝 Alla med Prio-fält ifyllda</button>
            <span style={{ width: 1, background: "#E5E7EB", margin: "0 4px" }} />
            <button onClick={() => setLayout("list")} title="Lista (fulla kort)" style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: layout === "list" ? "1px solid #1B3A5C" : "1px solid #E5E7EB", background: layout === "list" ? "#1B3A5C" : "#fff", color: layout === "list" ? "#fff" : "#6B7280" }}>☰ Lista</button>
            <button onClick={() => setLayout("grid")} title="Rutnät (kompakt)" style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: layout === "grid" ? "1px solid #1B3A5C" : "1px solid #E5E7EB", background: layout === "grid" ? "#1B3A5C" : "#fff", color: layout === "grid" ? "#fff" : "#6B7280" }}>▦ Rutnät</button>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={selectAllForExport} style={{ fontSize: 12, fontWeight: 600, color: "#1B3A5C", background: "#fff", border: "1.5px solid #1B3A5C", borderRadius: 8, padding: "5px 12px", cursor: "pointer" }}>
            {selectedExport.size === starred.length ? "Avmarkera alla" : "Markera alla"}
          </button>
          {selectedExport.size > 0 && (<>
            <button onClick={exportMarkdown} style={{ fontSize: 12, fontWeight: 600, color: "#fff", background: "#1B3A5C", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}>
              Exportera .md ({selectedExport.size})
            </button>
            <button onClick={printCards} style={{ fontSize: 12, fontWeight: 600, color: "#fff", background: "#1B3A5C", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}>
              Skriv ut / PDF ({selectedExport.size})
            </button>
          </>)}
        </div>
      </div>
      {layout === "grid" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
          {starred.map(item => {
            const ov = overrides[item.nr] || {};
            const col = DEL_COLORS[item.del] || {};
            return (
              <div key={item.nr} onClick={() => setModalItem(item)}
                style={{ background: "#fff", border: "1px solid " + (col.border || "#E5E7EB"), borderLeft: "4px solid " + (col.border || "#E5E7EB"), borderRadius: 8, padding: 10, cursor: "pointer", display: "flex", flexDirection: "column", gap: 5, minHeight: 130, transition: "transform 0.1s, box-shadow 0.1s" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: col.bg || "#F3F4F6", color: col.text || "#374151" }}>{item.sub}</span>
                  <span style={{ fontSize: 10, color: "#9CA3AF" }}>Nr {item.nr}</span>
                  {ov.arbetaVidere && <span style={{ marginLeft: "auto", fontSize: 11 }} title="Stjärnmärkt">⭐</span>}
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "#1B3A5C", lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{item.n}</div>
                {item.st && <div style={{ fontSize: 10, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><b style={{ color: "#374151" }}>Mognadsgrad:</b> {item.st}</div>}
                {item.typ && <div style={{ fontSize: 10, color: "#6B7280", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}><b style={{ color: "#374151" }}>Typ:</b> {item.typ}</div>}
              </div>
            );
          })}
        </div>
      )}
      <div style={{ display: layout === "list" ? "flex" : "none", flexDirection: "column", gap: 20 }}>
        {starred.map(item => renderPrioCard(item))}
      </div>
      {modalItem && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", padding: "40px 20px", overflowY: "auto" }} onClick={() => setModalItem(null)}>
          <div style={{ width: "100%", maxWidth: 900 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
              <button onClick={() => setModalItem(null)} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "rgba(255,255,255,0.95)", color: "#1B3A5C", fontSize: 18, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }} title="Stäng">×</button>
            </div>
            {renderPrioCard(modalItem)}
          </div>
        </div>
      )}
    </div>
  );
}
/* ─────────── PRIO NETWORK VIEW ─────────── */
function PrioNetworkView({ data, overridesCache, onClickItem }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ w: 900, h: 600 });
  const [hovered, setHovered] = useState(null);
  const simRef = useRef(null);
  const starred = useMemo(() => data.filter(i => {
    const ov = overridesCache[i.nr];
    return ov && ov.arbetaVidere;
  }), [data, overridesCache]);
  const dataMap = useMemo(() => { const m = {}; starred.forEach(d => m[d.nr] = d); return m; }, [starred]);
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 100 && height > 100) setDims({ w: width, h: height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    if (!svgRef.current || starred.length === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const { w, h } = dims;
    const nodes = starred.map(d => {
      const ov = overridesCache[d.nr] || {};
      const conns = (ov.connections || []).filter(c => dataMap[c.nr]);
      return { id: d.nr, nr: d.nr, label: "#" + d.nr + " " + (d.n.length > 22 ? d.n.substring(0, 22) + "…" : d.n), shortLabel: "#" + d.nr, fullName: d.n, del: d.del, typ: d.typ, connCount: conns.length, r: Math.max(12, Math.min(26, 10 + conns.length * 3)) };
    });
    const nodeSet = new Set(starred.map(d => d.nr));
    const links = [];
    const linkSet = new Set();
    starred.forEach(d => {
      const ov = overridesCache[d.nr] || {};
      (ov.connections || []).forEach(c => {
        if (!nodeSet.has(c.nr)) return;
        const key = Math.min(d.nr, c.nr) + "-" + Math.max(d.nr, c.nr);
        if (!linkSet.has(key)) {
          linkSet.add(key);
          links.push({ source: d.nr, target: c.nr, cats: c.cats || [], sourceNr: d.nr });
        }
      });
    });
    const g = svg.append("g");
    const zoom = d3.zoom().scaleExtent([0.3, 4]).on("zoom", e => g.attr("transform", e.transform));
    svg.call(zoom);
    const link = g.append("g").selectAll("line").data(links).join("line")
      .attr("stroke", d => { const c = d.cats[0]; return c ? (CAT_COLORS[c] || "#9CA3AF") : "#C0C8D0"; })
      .attr("stroke-width", d => d.cats.length > 0 ? 2.5 : 1.5)
      .attr("stroke-dasharray", d => d.cats.length === 0 ? "4,3" : "none");
    const linkLabels = g.append("g").selectAll("text").data(links.filter(l => l.cats.length > 0)).join("text")
      .text(d => d.cats.join(", "))
      .attr("font-size", 8.5).attr("font-weight", 600).attr("fill", d => { const c = d.cats[0]; return c ? (CAT_COLORS[c] || "#6B7280") : "#6B7280"; })
      .attr("text-anchor", "middle").attr("font-family", "'DM Sans', sans-serif");
    const node = g.append("g").selectAll("g").data(nodes, d => d.id).join("g").attr("cursor", "pointer");
    node.each(function(d) {
      const el = d3.select(this);
      const col = DEL_COLORS[d.del] || DEL_COLORS.A;
      el.append("circle").attr("r", d.r).attr("fill", col.border).attr("stroke", "#0f1f2e").attr("stroke-width", 2);
    });
    node.append("text").text(d => d.shortLabel).attr("dy", d => d.r + 14).attr("text-anchor", "middle")
      .attr("font-size", 10).attr("font-weight", 700).attr("fill", "#0f1f2e").attr("font-family", "'DM Sans', sans-serif");
    const tooltip = svg.append("g").style("display", "none");
    const ttBg = tooltip.append("rect").attr("fill", "#0f1f2e").attr("rx", 6).attr("ry", 6);
    const ttText = tooltip.append("text").attr("fill", "#fff").attr("font-size", 12).attr("font-weight", 600).attr("font-family", "'DM Sans', sans-serif");
    node.on("mouseover", function(event, d) {
      d3.select(this).select("circle").attr("stroke-width", 3.5);
      link.attr("opacity", l => (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.15);
      linkLabels.attr("opacity", l => (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.15);
      node.attr("opacity", n => {
        if (n.id === d.id) return 1;
        return links.some(l => (l.source.id === d.id && l.target.id === n.id) || (l.target.id === d.id && l.source.id === n.id)) ? 1 : 0.2;
      });
      ttText.text(d.fullName + " — " + d.connCount + " kopplingar");
      const bbox = ttText.node().getBBox();
      ttBg.attr("x", bbox.x - 10).attr("y", bbox.y - 5).attr("width", bbox.width + 20).attr("height", bbox.height + 10);
      tooltip.attr("transform", "translate(" + (event.offsetX + 14) + "," + (event.offsetY - 24) + ")").style("display", null);
      setHovered(d.nr);
    }).on("mouseout", function() {
      node.attr("opacity", 1);
      d3.select(this).select("circle").attr("stroke-width", 2);
      link.attr("opacity", 1);
      linkLabels.attr("opacity", 1);
      tooltip.style("display", "none");
      setHovered(null);
    }).on("dblclick", function(event, d) {
      event.stopPropagation();
      if (onClickItem && dataMap[d.nr]) onClickItem(dataMap[d.nr]);
    });
    const sim = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-350))
      .force("center", d3.forceCenter(w / 2, h / 2))
      .force("collision", d3.forceCollide().radius(d => d.r + 10))
      .on("tick", () => {
        link.attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y);
        linkLabels.attr("x", d => (d.source.x + d.target.x) / 2).attr("y", d => (d.source.y + d.target.y) / 2 - 5);
        node.attr("transform", d => "translate(" + d.x + "," + d.y + ")");
      });
    simRef.current = sim;
    const drag = d3.drag()
      .on("start", (event, d) => { if (!event.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
      .on("end", (event, d) => { if (!event.active) sim.alphaTarget(0); d.fx = null; d.fy = null; });
    node.call(drag);
    return () => sim.stop();
  }, [starred, overridesCache, dims, dataMap]);
  if (starred.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: "#5a6a7a" }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: "#1B3A5C" }}>Inga prioriterade initiativ</p>
        <p style={{ fontSize: 13, color: "#3a4a5a" }}>Stjärnmarkera initiativ och skapa kopplingar i Prioriterade-fliken</p>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "10px 16px", background: "#F6F8FA", borderBottom: "1px solid #D0D7DE", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#0f1f2e" }}>Prio-nätverk</span>
        <span style={{ fontSize: 11, color: "#3a4a5a" }}>{starred.length} noder · Dblklick = detalj · Dra = flytta</span>
        <div style={{ display: "flex", gap: 10, marginLeft: "auto", flexWrap: "wrap" }}>
          {CONNECTION_CATS.map(cat => (
            <span key={cat} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: CAT_COLORS[cat] }}>
              <span style={{ width: 10, height: 3, borderRadius: 2, background: CAT_COLORS[cat], display: "inline-block" }} />{cat}
            </span>
          ))}
        </div>
      </div>
      <div ref={containerRef} style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <svg ref={svgRef} width={dims.w} height={dims.h} style={{ background: "#FAFBFC" }} />
      </div>
    </div>
  );
}
/* ─────────── GUIDE VIEW (Lathund) ─────────── */
function GuideView() {
  const sectionStyle = { background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" };
  const headingStyle = { fontSize: 14, fontWeight: 800, color: "#1B3A5C", marginBottom: 4, marginTop: 0, fontFamily: "'DM Sans', sans-serif" };
  const subStyle = { fontSize: 11.5, color: "#6B7280", marginBottom: 14, marginTop: 0 };
  const rowStyle = { display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: "#374151", minWidth: 120, flexShrink: 0 };
  const descStyle = { fontSize: 12, color: "#6B7280", lineHeight: 1.5 };
  const chipStyle = (bg, border, color) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 10, fontSize: 10.5, fontWeight: 600, background: bg, border: `1px solid ${border}`, color, marginRight: 4, marginBottom: 4 });
  const stepBox = (bg, border) => ({ flex: 1, background: bg, border: `2px solid ${border}`, borderRadius: 12, padding: "14px 16px", textAlign: "center", position: "relative" });
  const arrowStyle = { display: "flex", alignItems: "center", fontSize: 22, color: "#9CA3AF", fontWeight: 300, padding: "0 2px" };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1B3A5C", margin: "0 0 4px 0", fontFamily: "'DM Sans', sans-serif" }}>Aktivitetskartan — lathund</h2>
        <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>{DATA.length} hälsodatainitiativ — läs, analysera, redigera, kvalitetssäkra</p>
      </div>

      {/* TWO-COLUMN: Användare + Redaktör */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {/* LEFT — Användare */}
        <div style={{ ...sectionStyle, background: "#F0F7FF", borderColor: "#B8D4F0" }}>
          <h3 style={{ ...headingStyle, color: "#1A56DB" }}>Utforska och analysera</h3>
          <p style={subStyle}>Alla användare — ingen inloggning krävs</p>
          <div style={rowStyle}><span style={labelStyle}>Sök</span><span style={descStyle}>Fritext i headern — söker på namn, beskrivning, ansvarig och nummer</span></div>
          <div style={rowStyle}><span style={labelStyle}>Filter</span><span style={descStyle}>Del (A–D), underkategori, finansieringskälla, mognadsgrad, jurisdiktioner, taggar (4 kategorier), "Arbeta vidare", QA-godkänd</span></div>
          <div style={rowStyle}><span style={labelStyle}>6 vyer</span><span style={descStyle}>Kort, Matris, Nätverk, Karta, Kandidater, Lathund</span></div>
          <div style={rowStyle}><span style={labelStyle}>Sortering</span><span style={descStyle}>Rapportordning (nr), Namn A–Ö, AI-relevans, KCHD-relevans, Finansiering (MSEK)</span></div>
          <div style={rowStyle}><span style={labelStyle}>Detaljmodal</span><span style={descStyle}>Klicka på ett kort → alla data, AI- och KCHD-poäng, nyttodimensioner, EHDS, beroenden, taggar</span></div>
          <div style={rowStyle}><span style={labelStyle}>Datafördjupning</span><span style={descStyle}>Utökade datafält: förmågor, domän, frekvens, standarder, kvalitet m.m. (9 fält per kort)</span></div>
          <div style={rowStyle}><span style={labelStyle}>Jämför</span><span style={descStyle}>Kryssa 2–5 kort → jämför sida vid sida med all data och poäng</span></div>
          <div style={rowStyle}><span style={labelStyle}>Skriv ut</span><span style={descStyle}>Markera kort → genererar HTML-fil med all data → öppna + Ctrl+P för PDF</span></div>
          <div style={rowStyle}><span style={labelStyle}>Export / import</span><span style={descStyle}>Spara/ladda alla ändringar som JSON-fil (backup)</span></div>
          <div style={rowStyle}><span style={labelStyle}>Expandera</span><span style={descStyle}>Alla modaler har helskärmsknapp (⊞) i övre hörnet</span></div>
        </div>

        {/* RIGHT — Redaktör */}
        <div style={{ ...sectionStyle, background: "#FFF9F0", borderColor: "#E8C9A0" }}>
          <h3 style={{ ...headingStyle, color: "#B45309" }}>Redigera och kvalitetssäkra</h3>
          <p style={subStyle}>Ändringar sparas automatiskt i Supabase (delat mellan alla)</p>
          <div style={rowStyle}><span style={labelStyle}>Redigera fält</span><span style={descStyle}>17 textfält + AI-poäng (6 dim.), KCHD-poäng (5 dim.), nyttodimensioner, taggar. Historik sparas (max 10 per fält)</span></div>
          <div style={rowStyle}><span style={labelStyle}>Mognadsgrad</span><span style={descStyle}>6 nivåer: Planerad → Under uppbyggnad → Pilot/test → Operativ (begränsad) → Fullt implementerad → Avslutat</span></div>
          <div style={rowStyle}>
            <span style={labelStyle}>QA-kedja</span>
            <span style={descStyle}>
              4 steg: <span style={chipStyle("#E8F0FE","#4285F4","#1A56DB")}>AI-research</span>
              <span style={chipStyle("#E8F0FE","#4285F4","#1A56DB")}>Manuell redigering</span>
              <span style={chipStyle("#F3E8FE","#8B5CF6","#6D28D9")}>Ny AI-kontroll (frivillig)</span>
              <span style={chipStyle("#F0FFF4","#22C55E","#166534")}>Godkänd</span>
            </span>
          </div>
          <div style={rowStyle}><span style={labelStyle}>Informations&shy;insamling</span><span style={descStyle}>Bocka av metoder: desktop research (inkl AI), dialog med sakkunnig, granskad av sakkunnig, dialog i grupp + fritextfält</span></div>
          <div style={rowStyle}><span style={labelStyle}>Jurisdiktioner</span><span style={descStyle}>13 regelverk (GDPR, PDL, EHDS, AI Act, MDR m.fl.) + fritextfält för övrigt</span></div>
          <div style={rowStyle}><span style={labelStyle}>Källor</span><span style={descStyle}>Lägg till URL + etikett per initiativ (obegränsat antal)</span></div>
          <div style={rowStyle}><span style={labelStyle}>Arbeta vidare</span><span style={descStyle}>Stjärnmarkera kort (⭐) för att prioritera — filtrerbart</span></div>
          <div style={rowStyle}><span style={labelStyle}>Föreslå ändringar</span><span style={descStyle}>Fritext per kort — sparas separat, syns vid utskrift</span></div>
          <div style={rowStyle}><span style={labelStyle}>Datafördjupning</span><span style={descStyle}>Redigera 9 datafält: förmåga (checkboxar + text), domän, frekvens, datatyp, datamängd, källsystem, IoT/sensor, standarder, kvalitet</span></div>
          <div style={rowStyle}><span style={labelStyle}>Kandidater</span><span style={descStyle}>Föreslå nya initiativ som kan bli egna kort — med prioritet, status, EHDS-relevans</span></div>
        </div>
      </div>

      {/* QA PROCESS */}
      <div style={{ ...sectionStyle, background: "#F0FFF4", borderColor: "#A7D7B8", marginBottom: 20 }}>
        <h3 style={{ ...headingStyle, color: "#166534", textAlign: "center" }}>Kvalitetsprocess — från AI-utkast till godkänt kort</h3>
        <p style={{ ...subStyle, textAlign: "center" }}>Varje kort genomgår upp till 4 steg. Steg 3 är frivilligt.</p>
        <div style={{ display: "flex", alignItems: "stretch", gap: 0, marginTop: 16, marginBottom: 16 }}>
          <div style={stepBox("#E8F0FE", "#4285F4")}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#1A56DB", marginBottom: 4 }}>1. AI-research</div>
            <div style={{ fontSize: 11, color: "#374151", fontWeight: 600, marginBottom: 6 }}>Grunddata genereras</div>
            <div style={{ fontSize: 10.5, color: "#6B7280", lineHeight: 1.5 }}>AI samlar in och strukturerar information om varje initiativ</div>
          </div>
          <div style={arrowStyle}>→</div>
          <div style={stepBox("#FFF9F0", "#E8913A")}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#B45309", marginBottom: 4 }}>2. Manuell redigering</div>
            <div style={{ fontSize: 11, color: "#374151", fontWeight: 600, marginBottom: 6 }}>Redaktör granskar</div>
            <div style={{ fontSize: 10.5, color: "#6B7280", lineHeight: 1.5 }}>Redigera textfält, sätt mognadsgrad, koppla jurisdiktioner, lägg till källor</div>
          </div>
          <div style={arrowStyle}>→</div>
          <div style={stepBox("#F3E8FE", "#8B5CF6")}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#6D28D9", marginBottom: 4 }}>3. Ny AI-kontroll</div>
            <div style={{ fontSize: 11, color: "#374151", fontWeight: 600, marginBottom: 6 }}>Frivilligt steg</div>
            <div style={{ fontSize: 10.5, color: "#6B7280", lineHeight: 1.5 }}>Komplettera datafördjupning, verifiera fakta, korskontrollera</div>
          </div>
          <div style={arrowStyle}>→</div>
          <div style={stepBox("#F0FFF4", "#22C55E")}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#166534", marginBottom: 4 }}>4. Godkänd</div>
            <div style={{ fontSize: 11, color: "#374151", fontWeight: 600, marginBottom: 6 }}>Klart att använda</div>
            <div style={{ fontSize: 10.5, color: "#6B7280", lineHeight: 1.5 }}>Kortet visas med grön bock (✅), filtrerbart som "QA-godkänd"</div>
          </div>
        </div>
      </div>

      {/* STRUCTURE — Del A–D */}
      <div style={{ ...sectionStyle, marginBottom: 20 }}>
        <h3 style={headingStyle}>Kartans struktur — 4 delar, 8 underkategorier</h3>
        <p style={subStyle}>Initiativen är organiserade i 4 delar med totalt 8 underkategorier</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { del: "A", label: "Infrastruktur & datadelning", color: "#4285F4", bg: "#E8F0FE", subs: ["A1 – Regionala initiativ", "A2 – Statliga initiativ", "A3 – EU / internationella"] },
            { del: "B", label: "TRE-miljöer", color: "#E8913A", bg: "#FEF3E2", subs: ["B – Trusted Research Environments"] },
            { del: "C", label: "Stödsystem & standarder", color: "#2D8A56", bg: "#E6F5EC", subs: ["C1 – Regionala stödsystem", "C2 – Statliga stödsystem", "C3 – EU / internationella stöd"] },
            { del: "D", label: "Lagstiftning & strategi", color: "#8B5CF6", bg: "#F3E8FE", subs: ["D – Lagstiftning, strategi & policy"] },
          ].map(d => (
            <div key={d.del} style={{ background: d.bg, border: `1px solid ${d.color}33`, borderRadius: 10, padding: "12px 16px" }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: d.color, marginBottom: 4 }}>Del {d.del} — {d.label}</div>
              {d.subs.map(s => <div key={s} style={{ fontSize: 11, color: "#374151", marginBottom: 2 }}>• {s}</div>)}
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ textAlign: "center", padding: "12px 0", color: "#9CA3AF", fontSize: 11.5, lineHeight: 1.6 }}>
        <div style={{ marginBottom: 4 }}>Alla ändringar sparas automatiskt i Supabase — delat mellan alla användare, alla enheter.</div>
        <div>Grunddata ({DATA.length} initiativ) är inbakad i appen och uppdateras vid ny deploy.</div>
      </div>
    </div>
  );
}
/* ─────────── CANDIDATES VIEW (Kandidater) ─────────── */
const CANDIDATE_STATUSES = ["Föreslagen", "Under utredning", "Beslutad", "Avvisad"];
const CANDIDATE_PRIORITIES = ["Hög", "Medel", "Låg"];
const CANDIDATE_FIELDS = [
  { key: "namn", label: "Namn", type: "text", placeholder: "Initiativets namn" },
  { key: "organisation", label: "Organisation / ansvarig", type: "text", placeholder: "Vem driver detta?" },
  { key: "varforRelevant", label: "Varför relevant för KCHD?", type: "textarea", placeholder: "Kort motivering..." },
  { key: "kalla", label: "Källa / URL", type: "text", placeholder: "https://..." },
  { key: "prioritet", label: "Prioritet", type: "select", options: CANDIDATE_PRIORITIES },
  { key: "status", label: "Status i vår process", type: "select", options: CANDIDATE_STATUSES },
  { key: "foreslagenAv", label: "Föreslagen av", type: "text", placeholder: "Namn" },
  { key: "relateradeTill", label: "Relaterade befintliga initiativ (nr)", type: "text", placeholder: "t.ex. 56, 76" },
  { key: "ehdsRelevans", label: "EHDS-relevans", type: "text", placeholder: "Koppling till EHDS?" },
  { key: "noteringar", label: "Noteringar", type: "textarea", placeholder: "Övriga kommentarer..." },
];
const DEFAULT_CANDIDATES = [
  {
    id: 1, namn: "OMOP4Sweden (uppföljare/utökat)", organisation: "Swelife / GU / KI",
    varforRelevant: "OMOP CDM är central standard för EHDS sekundäranvändning. Befintligt kort #56 täcker piloten (aug–dec 2025, 500 kSEK) men en bredare svensk OMOP-satsning bör dokumenteras separat. SCIFI-PEARL vid GU och DARWIN EU-koppling motiverar eget kort för den större bilden.",
    kalla: "https://www.ohdsi.org", prioritet: "Hög", status: "Under utredning",
    foreslagenAv: "Peder", relateradeTill: "56, 55, 76, 30",
    ehdsRelevans: "Direkt — OMOP CDM nämns som möjlig standard för EHDS sekundäranvändning",
    noteringar: "Befintligt kort #56 täcker Vinnova-piloten. Denna kandidat avser ett bredare OMOP-ekosystem i Sverige.", datum: "2026-03-09"
  },
];
function CandidatesView() {
  const [candidates, setCandidates] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [editingId, setEditingId] = useState(null);
  useEffect(() => {
    storageGet("candidates_list").then(data => {
      setCandidates(data && data.length ? data : DEFAULT_CANDIDATES);
      setLoaded(true);
    });
  }, []);
  const save = async (list) => {
    setCandidates(list);
    await storageSet("candidates_list", list);
  };
  const addNew = () => {
    const next = [...candidates, { id: Date.now(), namn: "", organisation: "", varforRelevant: "", kalla: "", prioritet: "Medel", status: "Föreslagen", foreslagenAv: "", relateradeTill: "", ehdsRelevans: "", noteringar: "", datum: new Date().toISOString().slice(0, 10) }];
    save(next);
    setEditingId(next[next.length - 1].id);
  };
  const updateField = (id, key, val) => {
    const next = candidates.map(c => c.id === id ? { ...c, [key]: val } : c);
    save(next);
  };
  const remove = (id) => {
    if (confirm("Ta bort denna kandidat?")) save(candidates.filter(c => c.id !== id));
  };
  const prioColor = (p) => p === "Hög" ? "#DC2626" : p === "Medel" ? "#F59E0B" : "#6B7280";
  const statusColor = (s) => s === "Beslutad" ? "#22C55E" : s === "Under utredning" ? "#3B82F6" : s === "Avvisad" ? "#9CA3AF" : "#8B5CF6";
  if (!loaded) return null;
  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1B3A5C", margin: "0 0 4px", fontFamily: "'DM Sans', sans-serif" }}>Kandidater — potentiella nya initiativ</h2>
          <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>{candidates.length} kandidater. Initiativ som kan bli egna kort i dashboarden.</p>
        </div>
        <button onClick={addNew} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid #4285F4", background: "#E8F0FE", color: "#1A56DB" }}>+ Ny kandidat</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {candidates.map(cand => {
          const isEditing = editingId === cand.id;
          return (
            <div key={cand.id} style={{ background: "#fff", border: "1px solid " + (cand.status === "Beslutad" ? "#86EFAC" : "#E5E7EB"), borderRadius: 10, overflow: "hidden" }}>
              {/* Header row */}
              <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", background: isEditing ? "#FAFBFC" : "#fff" }}
                onClick={() => setEditingId(isEditing ? null : cand.id)}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1B3A5C", flex: 1 }}>{cand.namn || "Namnlös kandidat"}</span>
                <span style={{ fontSize: 9, fontWeight: 600, padding: "3px 8px", borderRadius: 10, color: prioColor(cand.prioritet), background: prioColor(cand.prioritet) + "14" }}>{cand.prioritet}</span>
                <span style={{ fontSize: 9, fontWeight: 600, padding: "3px 8px", borderRadius: 10, color: statusColor(cand.status), background: statusColor(cand.status) + "14" }}>{cand.status}</span>
                <span style={{ fontSize: 10, color: "#9CA3AF" }}>{cand.datum}</span>
                <span style={{ fontSize: 11, color: "#9CA3AF" }}>{isEditing ? "▾" : "▸"}</span>
              </div>
              {/* Expanded edit area */}
              {isEditing && (
                <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {CANDIDATE_FIELDS.map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: 10, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 2 }}>{f.label}</label>
                      {f.type === "select" ? (
                        <select value={cand[f.key] || ""} onChange={e => updateField(cand.id, f.key, e.target.value)}
                          style={{ width: "100%", border: "1px solid #E5E7EB", borderRadius: 6, padding: "6px 8px", fontSize: 12, fontFamily: "inherit" }}>
                          {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : f.type === "textarea" ? (
                        <textarea value={cand[f.key] || ""} onChange={e => updateField(cand.id, f.key, e.target.value)} rows={2}
                          placeholder={f.placeholder} style={{ width: "100%", border: "1px solid #E5E7EB", borderRadius: 6, padding: "6px 8px", fontSize: 12, fontFamily: "inherit", resize: "vertical" }} />
                      ) : (
                        <input value={cand[f.key] || ""} onChange={e => updateField(cand.id, f.key, e.target.value)}
                          placeholder={f.placeholder} style={{ width: "100%", border: "1px solid #E5E7EB", borderRadius: 6, padding: "6px 8px", fontSize: 12, fontFamily: "inherit" }} />
                      )}
                    </div>
                  ))}
                  <button onClick={() => remove(cand.id)} style={{ alignSelf: "flex-end", padding: "4px 12px", borderRadius: 6, fontSize: 10, cursor: "pointer", border: "1px solid #FECACA", background: "#FEF2F2", color: "#991B1B" }}>Ta bort kandidat</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
/* ─────────── KONTINUITET & HÅLLBARHET VIEW ─────────── */
function newAnalysisObject() {
  return {
    id: Date.now(), namn: "", typ: ANALYSIS_OBJECT_TYPES[0], datum: new Date().toISOString().slice(0, 10),
    beslutssituation: "", avgransningar: "", analysfragor: "", beroda: "", ambitionsniva: "",
    bestallare: "", samordning: "", deltagare: [], ansvar: {},
    linkedInitiatives: [], underlag: "",
    leverantorer: [], legal: {}, dimensions: {}, riskbedomning: "", slutsatser: "", atgarder: "",
  };
}
function buildContinuityMarkdown(obj, allData) {
  const L = [];
  L.push("# Kontinuitetsanalys: " + (obj.namn || "Namnlöst analysobjekt"));
  L.push("");
  L.push("**Typ:** " + obj.typ + "  ");
  L.push("**Datum:** " + obj.datum);
  L.push("");
  L.push("## 1. Avgränsning & underlag");
  L.push("**Beslutssituation:** " + (obj.beslutssituation || "—"));
  L.push("**Avgränsningar:** " + (obj.avgransningar || "—"));
  L.push("**Analysfrågor:** " + (obj.analysfragor || "—"));
  L.push("**Berörda verksamheter & informationsflöden:** " + (obj.beroda || "—"));
  L.push("**Ambitionsnivå:** " + (obj.ambitionsniva || "—"));
  L.push("**Beställare:** " + (obj.bestallare || "—") + "  ");
  L.push("**Samordningsansvarig:** " + (obj.samordning || "—"));
  if (obj.deltagare && obj.deltagare.length) L.push("**Deltagande funktioner:** " + obj.deltagare.join("; "));
  if (obj.ansvar && Object.keys(obj.ansvar).some(k => obj.ansvar[k])) {
    L.push("");
    L.push("**Ansvarsfördelning:**");
    ANSVAR_OMRADEN.forEach(a => { if (obj.ansvar[a.key]) L.push("- " + a.label + ": " + obj.ansvar[a.key]); });
  }
  if (obj.linkedInitiatives && obj.linkedInitiatives.length) {
    const names = obj.linkedInitiatives.map(nr => { const d = allData.find(x => x.nr === nr); return d ? "Nr " + nr + " — " + d.n : "Nr " + nr; });
    L.push("**Kopplade initiativ:** " + names.join("; "));
  }
  L.push("**Underlag:** " + (obj.underlag || "—"));
  if (obj.leverantorer && obj.leverantorer.length) L.push("**Centrala leverantörer / plattformar:** " + obj.leverantorer.join(", "));
  L.push("");
  L.push("### Tillämpliga rättsliga ramverk");
  const relevant = LEGAL_FRAMEWORKS.filter(f => obj.legal && obj.legal[f.key] && obj.legal[f.key].relevant);
  if (relevant.length === 0) L.push("_Inga markerade._");
  relevant.forEach(f => { L.push("- **" + f.namn + "**" + (obj.legal[f.key].note ? ": " + obj.legal[f.key].note : "")); });
  L.push("");
  L.push("## 2. Beroenden & dimensioner");
  CONTINUITY_DIMENSIONS.forEach(dim => {
    const d = (obj.dimensions && obj.dimensions[dim.key]) || {};
    const sc = d.level ? SCALE_BY_VALUE[d.level] : null;
    L.push("### " + dim.label + (sc ? " — _" + sc.label + "_" : ""));
    if (d.nulage) L.push("**Nuläge:** " + d.nulage);
    if (d.beroenden) L.push("**Beroenden:** " + d.beroenden);
    if (d.konsekvens) L.push("**Konsekvenser:** " + d.konsekvens);
    if (d.atgardsbehov) L.push("**Åtgärdsbehov:** " + d.atgardsbehov);
    L.push("");
  });
  L.push("## 3. Konsekvenser, risker & sårbarheter");
  L.push(obj.riskbedomning || "—");
  L.push("");
  L.push("## 4. Slutsatser & åtgärder");
  L.push("**Slutsatser:** " + (obj.slutsatser || "—"));
  L.push("**Rekommenderade åtgärder:** " + (obj.atgarder || "—"));
  return L.join("\n");
}
function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
}
function buildContinuityObjectHtml(obj, allData) {
  const e = escapeHtml;
  const dimRows = CONTINUITY_DIMENSIONS.map(dim => {
    const d = (obj.dimensions && obj.dimensions[dim.key]) || {};
    const sc = d.level ? SCALE_BY_VALUE[d.level] : null;
    const bodyBits = [];
    if (d.nulage) bodyBits.push("<b>Nuläge:</b> " + e(d.nulage));
    if (d.beroenden) bodyBits.push("<b>Beroenden:</b> " + e(d.beroenden));
    if (d.konsekvens) bodyBits.push("<b>Konsekvenser:</b> " + e(d.konsekvens));
    if (d.atgardsbehov) bodyBits.push("<b>Åtgärdsbehov:</b> " + e(d.atgardsbehov));
    const body = bodyBits.length ? bodyBits.join("<br>") : "<span style='color:#9CA3AF'>—</span>";
    const chipColor = sc ? sc.color : "#9CA3AF";
    const chipLabel = sc ? e(sc.label) : "Ej bedömt";
    return "<tr><th style='text-align:left;padding:8px;border:1px solid #E5E7EB;background:#FAFBFC;width:180px;vertical-align:top'>" +
      e(dim.label) + "<br><span style='display:inline-block;margin-top:4px;padding:2px 8px;border-radius:10px;font-size:10px;color:#fff;background:" + chipColor + "'>" + chipLabel + "</span></th>" +
      "<td style='padding:8px;border:1px solid #E5E7EB;font-size:11px;vertical-align:top'>" + body + "</td></tr>";
  }).join("");
  const legalItems = LEGAL_FRAMEWORKS.filter(f => obj.legal && obj.legal[f.key] && obj.legal[f.key].relevant)
    .map(f => "<li><b>" + e(f.namn) + "</b>" + (obj.legal[f.key].note ? ": " + e(obj.legal[f.key].note) : "") + "</li>").join("");
  const initiativeItems = (obj.linkedInitiatives || []).map(nr => {
    const d = allData.find(x => x.nr === nr);
    return "<li>Nr " + nr + (d ? " — " + e(d.n) : "") + "</li>";
  }).join("");
  return "<section class='cont-obj'>" +
    "<h1>Kontinuitetsanalys: " + e(obj.namn || "Namnlöst analysobjekt") + "</h1>" +
    "<div class='meta'><b>Typ:</b> " + e(obj.typ) + " &middot; <b>Datum:</b> " + e(obj.datum) + "</div>" +
    "<h2>1. Avgränsning & underlag</h2>" +
    "<p><b>Beslutssituation:</b> " + (e(obj.beslutssituation) || "—") + "</p>" +
    "<p><b>Avgränsningar:</b> " + (e(obj.avgransningar) || "—") + "</p>" +
    "<p><b>Analysfrågor:</b> " + (e(obj.analysfragor) || "—") + "</p>" +
    "<p><b>Berörda verksamheter & informationsflöden:</b> " + (e(obj.beroda) || "—") + "</p>" +
    "<p><b>Ambitionsnivå:</b> " + (e(obj.ambitionsniva) || "—") + "</p>" +
    "<p><b>Beställare:</b> " + (e(obj.bestallare) || "—") + " &middot; <b>Samordningsansvarig:</b> " + (e(obj.samordning) || "—") + "</p>" +
    ((obj.deltagare && obj.deltagare.length) ? "<p><b>Deltagande funktioner:</b> " + obj.deltagare.map(e).join("; ") + "</p>" : "") +
    ((obj.ansvar && Object.keys(obj.ansvar).some(k => obj.ansvar[k])) ? "<p class='label'>Ansvarsfördelning</p><ul>" + ANSVAR_OMRADEN.filter(a => obj.ansvar[a.key]).map(a => "<li><b>" + e(a.label) + ":</b> " + e(obj.ansvar[a.key]) + "</li>").join("") + "</ul>" : "") +
    (initiativeItems ? "<p class='label'>Kopplade initiativ</p><ul>" + initiativeItems + "</ul>" : "") +
    "<p><b>Underlag:</b> " + (e(obj.underlag) || "—") + "</p>" +
    ((obj.leverantorer && obj.leverantorer.length) ? "<p><b>Centrala leverantörer / plattformar:</b> " + obj.leverantorer.map(e).join(", ") + "</p>" : "") +
    "<p class='label'>Tillämpliga rättsliga ramverk</p>" +
    (legalItems ? "<ul>" + legalItems + "</ul>" : "<p style='color:#9CA3AF'>Inga markerade.</p>") +
    "<h2>2. Beroenden & dimensioner</h2>" +
    "<table>" + dimRows + "</table>" +
    "<h2>3. Konsekvenser, risker & sårbarheter</h2>" +
    "<p>" + (e(obj.riskbedomning) || "—") + "</p>" +
    "<h2>4. Slutsatser & åtgärder</h2>" +
    "<p><b>Slutsatser:</b> " + (e(obj.slutsatser) || "—") + "</p>" +
    "<p><b>Rekommenderade åtgärder:</b> " + (e(obj.atgarder) || "—") + "</p>" +
    "</section>";
}
function openContinuityPrint(objs, allData) {
  const w = window.open("", "_blank");
  if (!w) return;
  const body = objs.map(o => buildContinuityObjectHtml(o, allData)).join("<div style='page-break-after:always'></div>");
  w.document.write("<!doctype html><html><head><meta charset='utf-8'><title>Kontinuitetsanalys</title>" +
    "<style>" +
    "body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#111827;max-width:900px;margin:24px auto;padding:0 24px;font-size:12px;line-height:1.5}" +
    "h1{font-size:20px;color:#1B3A5C;margin:0 0 6px}" +
    "h2{font-size:14px;color:#1B3A5C;margin:24px 0 8px;border-bottom:2px solid #E5E7EB;padding-bottom:4px}" +
    "table{border-collapse:collapse;width:100%;margin:8px 0}" +
    ".meta{color:#6B7280;font-size:11px;margin-bottom:6px}" +
    ".label{font-size:10px;color:#6B7280;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;margin-top:12px}" +
    "@media print{body{margin:0}}" +
    "</style></head><body>" + body +
    "<script>window.onload=function(){setTimeout(function(){window.print()},200)}</script>" +
    "</body></html>");
  w.document.close();
}
const contInput = { width: "100%", border: "1px solid #E5E7EB", borderRadius: 6, padding: "6px 8px", fontSize: 12, fontFamily: "inherit", boxSizing: "border-box" };
const contLabel = { fontSize: 10, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 3, marginTop: 8 };

function ContChipsInput({ values, onChange, placeholder }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v || values.includes(v)) { setDraft(""); return; }
    onChange([...values, v]);
    setDraft("");
  };
  return (
    <div>
      {values.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
          {values.map(v => (
            <span key={v} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 12, fontSize: 11, background: "#ECFEFF", color: "#0E7490", border: "1px solid #A5F3FC" }}>
              {v}
              <button onClick={() => onChange(values.filter(x => x !== v))} style={{ background: "none", border: "none", cursor: "pointer", color: "#0E7490", padding: 0, fontSize: 13, lineHeight: 1 }}>×</button>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 6 }}>
        <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }} placeholder={placeholder} style={contInput} />
        <button onClick={add} style={{ padding: "4px 14px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid #E5E7EB", background: "#fff", color: "#374151", whiteSpace: "nowrap" }}>Lägg till</button>
      </div>
    </div>
  );
}

function ContScalePicker({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {CONTINUITY_SCALE.map(s => {
        const active = value === s.value;
        return (
          <button key={s.value} onClick={() => onChange(active ? null : s.value)}
            title={s.label}
            style={{ padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer",
              border: "1px solid " + (active ? s.color : "#E5E7EB"),
              background: active ? s.color : "#fff", color: active ? "#fff" : "#6B7280" }}>
            {s.short}
          </button>
        );
      })}
    </div>
  );
}

function ContInitiativePicker({ selected, allData, onToggle }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return allData.filter(d => !query || d.n.toLowerCase().includes(query) || String(d.nr).includes(query)).slice(0, 60);
  }, [q, allData]);
  return (
    <div>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Sök initiativ att koppla..." style={contInput} />
      <div style={{ maxHeight: 160, overflowY: "auto", border: "1px solid #E5E7EB", borderRadius: 6, marginTop: 6, padding: 4 }}>
        {list.map(d => {
          const on = selected.includes(d.nr);
          return (
            <label key={d.nr} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 4px", fontSize: 11, cursor: "pointer", color: "#374151" }}>
              <input type="checkbox" checked={on} onChange={() => onToggle(d.nr)} />
              <span><b>{d.nr}</b> — {d.n}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function ContObjectEditor({ obj, onPatch, allData }) {
  const [step, setStep] = useState(1);
  const updateDim = (key, patch) => onPatch({ dimensions: { ...obj.dimensions, [key]: { ...(obj.dimensions[key] || {}), ...patch } } });
  const updateLegal = (key, patch) => onPatch({ legal: { ...obj.legal, [key]: { ...(obj.legal[key] || {}), ...patch } } });
  const toggleInit = (nr) => {
    const cur = obj.linkedInitiatives || [];
    onPatch({ linkedInitiatives: cur.includes(nr) ? cur.filter(x => x !== nr) : [...cur, nr] });
  };
  const stepBtn = (n) => (
    <button onClick={() => setStep(n)} style={{ padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer",
      border: step === n ? "1px solid #1B3A5C" : "1px solid #E5E7EB", background: step === n ? "#1B3A5C" : "#fff", color: step === n ? "#fff" : "#6B7280" }}>
      {n}. {CONTINUITY_STEPS[n - 1].label}
    </button>
  );
  return (
    <div style={{ padding: "0 16px 16px" }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "4px 0 12px" }}>
        {[1, 2, 3, 4].map(stepBtn)}
        <div style={{ flex: 1 }} />
        <button onClick={() => downloadText("kontinuitetsanalys-" + (obj.namn || "objekt").replace(/[^a-z0-9]+/gi, "-").toLowerCase() + ".md", buildContinuityMarkdown(obj, allData))}
          style={{ padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid #4285F4", background: "#E8F0FE", color: "#1A56DB" }}>Exportera .md</button>
        <button onClick={() => openContinuityPrint([obj], allData)}
          style={{ padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid #E5E7EB", background: "#fff", color: "#374151" }}>Skriv ut / PDF</button>
      </div>
      <p style={{ fontSize: 11, color: "#9CA3AF", margin: "0 0 10px" }}>{CONTINUITY_STEPS[step - 1].desc}</p>

      {step === 1 && (
        <div>
          <label style={contLabel}>Typ av analysobjekt</label>
          <select value={obj.typ} onChange={e => onPatch({ typ: e.target.value })} style={contInput}>
            {ANALYSIS_OBJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <label style={contLabel}>Beslutssituation som analysen ska stödja</label>
          <textarea value={obj.beslutssituation} onChange={e => onPatch({ beslutssituation: e.target.value })} rows={2} style={contInput}
            placeholder="T.ex. strategiskt vägval, belysa sårbarheter, förbereda upphandling, arkitekturstyrning..." />
          <label style={contLabel}>Avgränsningar (vad analysen inte omfattar)</label>
          <textarea value={obj.avgransningar || ""} onChange={e => onPatch({ avgransningar: e.target.value })} rows={2} style={contInput}
            placeholder="System, processer eller perspektiv som ligger utanför denna analys" />
          <label style={contLabel}>Analysfrågor som ska besvaras</label>
          <textarea value={obj.analysfragor || ""} onChange={e => onPatch({ analysfragor: e.target.value })} rows={2} style={contInput}
            placeholder="De konkreta frågor regionen vill ha svar på i denna analys" />
          <label style={contLabel}>Berörda verksamheter & kritiska informationsflöden</label>
          <textarea value={obj.beroda} onChange={e => onPatch({ beroda: e.target.value })} rows={2} style={contInput} />
          <label style={contLabel}>Ambitionsnivå</label>
          <input value={obj.ambitionsniva} onChange={e => onPatch({ ambitionsniva: e.target.value })} style={contInput} placeholder="Avgränsad / fördjupad / bred analys" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <label style={contLabel}>Beställare</label>
              <input value={obj.bestallare || ""} onChange={e => onPatch({ bestallare: e.target.value })} style={contInput} placeholder="Namn / roll" />
            </div>
            <div>
              <label style={contLabel}>Samordningsansvarig</label>
              <input value={obj.samordning || ""} onChange={e => onPatch({ samordning: e.target.value })} style={contInput} placeholder="Namn / roll" />
            </div>
          </div>
          <label style={contLabel}>Deltagande funktioner / kompetenser</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {KOMPETENSER.map(k => {
              const on = (obj.deltagare || []).includes(k);
              return (
                <label key={k} style={{ display: "flex", alignItems: "flex-start", gap: 6, cursor: "pointer", fontSize: 11, color: "#374151" }}>
                  <input type="checkbox" checked={on} onChange={() => {
                    const cur = obj.deltagare || [];
                    onPatch({ deltagare: on ? cur.filter(x => x !== k) : [...cur, k] });
                  }} style={{ marginTop: 2 }} />
                  <span>{k}</span>
                </label>
              );
            })}
          </div>
          <label style={{ ...contLabel, marginTop: 12, fontSize: 11, color: "#1B3A5C", fontWeight: 700 }}>Ansvarsfördelning per perspektiv</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {ANSVAR_OMRADEN.map(a => (
              <div key={a.key}>
                <label style={{ fontSize: 10, color: "#6B7280", display: "block", marginBottom: 2 }}>{a.label}</label>
                <input value={(obj.ansvar && obj.ansvar[a.key]) || ""} onChange={e => onPatch({ ansvar: { ...(obj.ansvar || {}), [a.key]: e.target.value } })}
                  style={contInput} placeholder="Namn / roll" />
              </div>
            ))}
          </div>
          <label style={contLabel}>Kopplade initiativ (från kartläggningen)</label>
          <ContInitiativePicker selected={obj.linkedInitiatives || []} allData={allData} onToggle={toggleInit} />
          <label style={contLabel}>Insamlat underlag (konsekvensanalyser, RSA, kontinuitetsplaner, avtal, arkitektur...)</label>
          <textarea value={obj.underlag} onChange={e => onPatch({ underlag: e.target.value })} rows={2} style={contInput} />
          <label style={contLabel}>Centrala leverantörer / plattformar (driver inlåsnings- och koncentrationsrisker)</label>
          <ContChipsInput values={obj.leverantorer || []} onChange={v => onPatch({ leverantorer: v })} placeholder="T.ex. Cambio COSMIC, Microsoft Azure, Oracle Health..." />
          <label style={{ ...contLabel, marginTop: 16, fontSize: 12, color: "#1B3A5C", fontWeight: 800 }}>Tillämpliga rättsliga ramverk & styrande krav</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {LEGAL_FRAMEWORKS.map(f => {
              const lv = obj.legal[f.key] || {};
              return (
                <div key={f.key} style={{ border: "1px solid " + (lv.relevant ? "#BFDBFE" : "#F3F4F6"), borderRadius: 6, padding: "6px 8px", background: lv.relevant ? "#F5F9FF" : "#fff" }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 6, cursor: "pointer" }}>
                    <input type="checkbox" checked={!!lv.relevant} onChange={() => updateLegal(f.key, { relevant: !lv.relevant })} style={{ marginTop: 2 }} />
                    <span style={{ fontSize: 11 }}><b style={{ color: "#1B3A5C" }}>{f.namn}</b> <span style={{ color: "#9CA3AF" }}>— {f.varfor}</span></span>
                  </label>
                  {lv.relevant && (
                    <input value={lv.note || ""} onChange={e => updateLegal(f.key, { note: e.target.value })} style={{ ...contInput, marginTop: 4 }} placeholder="Bedömning för detta analysobjekt..." />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {CONTINUITY_DIMENSIONS.map(dim => {
            const d = obj.dimensions[dim.key] || {};
            return (
              <div key={dim.key} style={{ border: "1px solid #E5E7EB", borderRadius: 8, padding: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1B3A5C" }}>{dim.icon} {dim.label}</span>
                  <ContScalePicker value={d.level} onChange={v => updateDim(dim.key, { level: v })} />
                </div>
                <p style={{ fontSize: 11, color: "#9CA3AF", margin: "6px 0 8px" }}>{dim.desc}</p>
                <div style={{ fontSize: 10, color: "#B45309", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 6, padding: "6px 8px", marginBottom: 8 }}>
                  Frågor att besvara: {dim.questions.join(" · ")}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div><label style={contLabel}>Nuläge</label><textarea value={d.nulage || ""} onChange={e => updateDim(dim.key, { nulage: e.target.value })} rows={2} style={contInput} /></div>
                  <div><label style={contLabel}>Beroenden</label><textarea value={d.beroenden || ""} onChange={e => updateDim(dim.key, { beroenden: e.target.value })} rows={2} style={contInput} /></div>
                  <div><label style={contLabel}>Konsekvenser</label><textarea value={d.konsekvens || ""} onChange={e => updateDim(dim.key, { konsekvens: e.target.value })} rows={2} style={contInput} /></div>
                  <div><label style={contLabel}>Åtgärdsbehov</label><textarea value={d.atgardsbehov || ""} onChange={e => updateDim(dim.key, { atgardsbehov: e.target.value })} rows={2} style={contInput} /></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {step === 3 && (
        <div>
          <p style={{ fontSize: 11, color: "#9CA3AF", margin: "0 0 8px" }}>Väg samman konsekvenser för verksamhetskontinuitet, informations- och cybersäkerhet, juridik, ekonomi, kompetens, upphandling och interoperabilitet om beroendena brister.</p>
          <textarea value={obj.riskbedomning} onChange={e => onPatch({ riskbedomning: e.target.value })} rows={10} style={contInput} />
        </div>
      )}

      {step === 4 && (
        <div>
          <label style={contLabel}>Slutsatser (centrala beroenden, koncentrationer, inlåsningseffekter)</label>
          <textarea value={obj.slutsatser} onChange={e => onPatch({ slutsatser: e.target.value })} rows={5} style={contInput} />
          <label style={contLabel}>Rekommenderade prioriteringar & åtgärder</label>
          <textarea value={obj.atgarder} onChange={e => onPatch({ atgarder: e.target.value })} rows={5} style={contInput} />
        </div>
      )}
    </div>
  );
}

function ContOverview({ objects, allData, onExportAll }) {
  if (objects.length === 0) return <p style={{ fontSize: 13, color: "#9CA3AF", padding: 20 }}>Inga analysobjekt än. Lägg till objekt under fliken Analysobjekt.</p>;
  const supplierMap = {};
  objects.forEach(o => {
    (o.leverantorer || []).forEach(s => {
      const k = s && s.trim(); if (!k) return;
      if (!supplierMap[k]) supplierMap[k] = { name: k, objects: [], initSet: new Set() };
      supplierMap[k].objects.push(o);
      (o.linkedInitiatives || []).forEach(nr => supplierMap[k].initSet.add(nr));
    });
  });
  const suppliers = Object.values(supplierMap).sort((a, b) => (b.objects.length - a.objects.length) || (b.initSet.size - a.initSet.size));
  const maxObjs = Math.max(1, ...suppliers.map(s => s.objects.length));
  const cell = (level) => {
    const sc = level ? SCALE_BY_VALUE[level] : null;
    return <td style={{ textAlign: "center", padding: 4 }}>
      <span title={sc ? sc.label : "Ej bedömt"} style={{ display: "inline-block", width: 18, height: 18, borderRadius: 4, background: sc ? sc.color : "#E5E7EB" }} />
    </td>;
  };
  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: "#1B3A5C", margin: 0 }}>Sårbarhets-heatmap — analysobjekt × dimensioner</h3>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={onExportAll} style={{ padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid #4285F4", background: "#E8F0FE", color: "#1A56DB" }}>Exportera alla (.md)</button>
          <button onClick={() => openContinuityPrint(objects, allData)} style={{ padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid #E5E7EB", background: "#fff", color: "#374151" }}>Skriv ut alla / PDF</button>
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", fontSize: 11, width: "100%" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "2px solid #E5E7EB", color: "#6B7280" }}>Analysobjekt</th>
              {CONTINUITY_DIMENSIONS.map(d => <th key={d.key} title={d.label} style={{ padding: "6px 4px", borderBottom: "2px solid #E5E7EB", color: "#6B7280", fontSize: 16 }}>{d.icon}</th>)}
              <th title="Värsta läge bland dimensioner · antal bedömda" style={{ padding: "6px 8px", borderBottom: "2px solid #E5E7EB", color: "#6B7280", fontSize: 10 }}>Värsta · Bedömt</th>
              <th style={{ padding: "6px 8px", borderBottom: "2px solid #E5E7EB", color: "#6B7280" }}>Ramverk</th>
              <th style={{ padding: "6px 8px", borderBottom: "2px solid #E5E7EB", color: "#6B7280" }}>Initiativ</th>
            </tr>
          </thead>
          <tbody>
            {objects.map(obj => {
              const legalCount = LEGAL_FRAMEWORKS.filter(f => obj.legal && obj.legal[f.key] && obj.legal[f.key].relevant).length;
              const dimLevels = CONTINUITY_DIMENSIONS.map(d => (obj.dimensions && obj.dimensions[d.key] && obj.dimensions[d.key].level) || null);
              const assessed = dimLevels.filter(v => v).length;
              const worst = dimLevels.reduce((acc, v) => (v && (!acc || SCALE_SEVERITY[v] > SCALE_SEVERITY[acc])) ? v : acc, null);
              const worstSc = worst ? SCALE_BY_VALUE[worst] : null;
              return (
                <tr key={obj.id}>
                  <td style={{ padding: "6px 8px", borderBottom: "1px solid #F3F4F6", fontWeight: 600, color: "#1B3A5C" }}>
                    {obj.namn || "Namnlöst"} <span style={{ color: "#9CA3AF", fontWeight: 400 }}>· {obj.typ}</span>
                  </td>
                  {CONTINUITY_DIMENSIONS.map(d => <React.Fragment key={d.key}>{cell((obj.dimensions && obj.dimensions[d.key] && obj.dimensions[d.key].level) || null)}</React.Fragment>)}
                  <td style={{ textAlign: "center", padding: "6px 8px", borderBottom: "1px solid #F3F4F6", whiteSpace: "nowrap" }}>
                    {worstSc
                      ? <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 10, fontSize: 9, fontWeight: 700, background: worstSc.color, color: "#fff" }}>{worstSc.short}</span>
                      : <span style={{ fontSize: 10, color: "#9CA3AF" }}>—</span>}
                    <span style={{ marginLeft: 6, fontSize: 10, color: "#6B7280", fontWeight: 600 }}>{assessed}/6</span>
                  </td>
                  <td style={{ textAlign: "center", padding: "6px 8px", borderBottom: "1px solid #F3F4F6", color: "#6B7280" }}>{legalCount}</td>
                  <td style={{ textAlign: "center", padding: "6px 8px", borderBottom: "1px solid #F3F4F6", color: "#6B7280" }}>{(obj.linkedInitiatives || []).length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
        {CONTINUITY_SCALE.map(s => (
          <span key={s.value} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#6B7280" }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: s.color, display: "inline-block" }} />{s.label}
          </span>
        ))}
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#6B7280" }}><span style={{ width: 12, height: 12, borderRadius: 3, background: "#E5E7EB", display: "inline-block" }} />Ej bedömt</span>
      </div>
      <div style={{ marginTop: 16, fontSize: 11, color: "#9CA3AF" }}>
        {CONTINUITY_DIMENSIONS.map((d, i) => <span key={d.key}>{d.icon} {d.label}{i < CONTINUITY_DIMENSIONS.length - 1 ? "  ·  " : ""}</span>)}
      </div>

      <h3 style={{ fontSize: 14, fontWeight: 800, color: "#1B3A5C", margin: "28px 0 4px" }}>Leverantörskoncentration</h3>
      <p style={{ fontSize: 11, color: "#9CA3AF", margin: "0 0 10px" }}>Vilka leverantörer och plattformar bär upp flest analysobjekt? Riskkoncentrationer enligt Metodstödet steg 2 (beroenden & inlåsning).</p>
      {suppliers.length === 0 ? (
        <p style={{ fontSize: 12, color: "#9CA3AF", fontStyle: "italic" }}>Inga leverantörer angivna på analysobjekten än. Lägg till under steg 1.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {suppliers.map(s => (
            <div key={s.name} style={{ display: "grid", gridTemplateColumns: "220px 1fr 140px", gap: 10, alignItems: "center" }}>
              <span title={s.objects.map(o => o.namn || "Namnlöst").join(", ")} style={{ fontSize: 12, color: "#1B3A5C", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
              <div style={{ background: "#F3F4F6", borderRadius: 4, height: 14, overflow: "hidden" }}>
                <div style={{ background: "#0E7490", height: "100%", width: (s.objects.length / maxObjs * 100) + "%" }} />
              </div>
              <span style={{ fontSize: 10, color: "#6B7280" }}>{s.objects.length} objekt · {s.initSet.size} initiativ</span>
            </div>
          ))}
        </div>
      )}

      <h3 style={{ fontSize: 14, fontWeight: 800, color: "#1B3A5C", margin: "28px 0 4px" }}>Ramverkstäckning</h3>
      <p style={{ fontSize: 11, color: "#9CA3AF", margin: "0 0 10px" }}>Vilka rättsliga ramverk har markerats som relevanta per analysobjekt? Hovra över en cell för bedömningstexten.</p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", fontSize: 11, width: "100%" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "2px solid #E5E7EB", color: "#6B7280" }}>Analysobjekt</th>
              {LEGAL_FRAMEWORKS.map(f => (
                <th key={f.key} title={f.namn + " — " + f.varfor} style={{ padding: "6px 6px", borderBottom: "2px solid #E5E7EB", color: "#6B7280", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>{LEGAL_KORT[f.key] || f.key}</th>
              ))}
              <th style={{ padding: "6px 8px", borderBottom: "2px solid #E5E7EB", color: "#6B7280", fontSize: 10 }}>Σ</th>
            </tr>
          </thead>
          <tbody>
            {objects.map(obj => {
              const count = LEGAL_FRAMEWORKS.filter(f => obj.legal && obj.legal[f.key] && obj.legal[f.key].relevant).length;
              return (
                <tr key={obj.id}>
                  <td style={{ padding: "6px 8px", borderBottom: "1px solid #F3F4F6", fontWeight: 600, color: "#1B3A5C" }}>{obj.namn || "Namnlöst"}</td>
                  {LEGAL_FRAMEWORKS.map(f => {
                    const r = obj.legal && obj.legal[f.key];
                    const on = r && r.relevant;
                    return (
                      <td key={f.key} title={f.namn + (on && r.note ? " — " + r.note : "")} style={{ textAlign: "center", padding: 4, borderBottom: "1px solid #F3F4F6" }}>
                        <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: 3, background: on ? "#0E7490" : "#F3F4F6", border: on ? "none" : "1px solid #E5E7EB" }} />
                      </td>
                    );
                  })}
                  <td style={{ textAlign: "center", padding: "6px 8px", borderBottom: "1px solid #F3F4F6", color: "#6B7280", fontWeight: 600 }}>{count}</td>
                </tr>
              );
            })}
            <tr>
              <td style={{ padding: "6px 8px", borderTop: "2px solid #E5E7EB", color: "#9CA3AF", fontSize: 10 }}>Σ objekt</td>
              {LEGAL_FRAMEWORKS.map(f => {
                const count = objects.filter(o => o.legal && o.legal[f.key] && o.legal[f.key].relevant).length;
                return <td key={f.key} style={{ textAlign: "center", padding: "6px 4px", borderTop: "2px solid #E5E7EB", color: "#9CA3AF", fontSize: 10 }}>{count || ""}</td>;
              })}
              <td style={{ borderTop: "2px solid #E5E7EB" }} />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ContDependencyGraph({ objects, allData }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ w: 900, h: 600 });
  const [hovered, setHovered] = useState(null);
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 100 && height > 100) setDims({ w: width, h: height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    if (!svgRef.current || objects.length === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const { w, h } = dims;
    const aoNodes = objects.map(o => {
      const levels = CONTINUITY_DIMENSIONS.map(d => (o.dimensions && o.dimensions[d.key] && o.dimensions[d.key].level) || null).filter(Boolean);
      const worst = levels.reduce((acc, v) => (!acc || SCALE_SEVERITY[v] > SCALE_SEVERITY[acc]) ? v : acc, null);
      return { id: "ao_" + o.id, type: "ao", label: o.namn || "Namnlöst", fullName: (o.namn || "Namnlöst") + " · " + o.typ, color: worst ? SCALE_BY_VALUE[worst].color : "#9CA3AF", r: 22 };
    });
    const linkedNrs = new Set();
    objects.forEach(o => (o.linkedInitiatives || []).forEach(nr => linkedNrs.add(nr)));
    const initNodes = [...linkedNrs].map(nr => {
      const d = allData.find(x => x.nr === nr);
      return { id: "init_" + nr, type: "init", nr, label: "#" + nr, fullName: d ? "Nr " + nr + " — " + d.n : "Nr " + nr, color: "#6B7280", r: 8 };
    });
    const supMap = {};
    objects.forEach(o => (o.leverantorer || []).forEach(s => {
      const k = (s || "").trim(); if (!k) return;
      if (!supMap[k]) supMap[k] = { id: "sup_" + k, type: "supplier", label: k, fullName: "Leverantör: " + k, color: "#0E7490", count: 0 };
      supMap[k].count++;
    }));
    const supplierNodes = Object.values(supMap).map(s => ({ ...s, r: Math.max(10, Math.min(24, 8 + s.count * 3)) }));
    const nodes = [...aoNodes, ...initNodes, ...supplierNodes];
    const links = [];
    objects.forEach(o => {
      const aoId = "ao_" + o.id;
      (o.linkedInitiatives || []).forEach(nr => links.push({ source: aoId, target: "init_" + nr, kind: "contains" }));
      (o.leverantorer || []).forEach(s => { const k = (s || "").trim(); if (k && supMap[k]) links.push({ source: aoId, target: supMap[k].id, kind: "provides" }); });
    });
    linkedNrs.forEach(nr => {
      const d = allData.find(x => x.nr === nr);
      if (!d || !d.dep) return;
      d.dep.split(",").map(s => parseInt(s.trim())).filter(Boolean).forEach(t => {
        if (linkedNrs.has(t) && nr < t) links.push({ source: "init_" + nr, target: "init_" + t, kind: "dep" });
      });
    });
    const sim = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(d => d.kind === "contains" ? 55 : d.kind === "provides" ? 90 : 45).strength(0.5))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(w / 2, h / 2))
      .force("collide", d3.forceCollide().radius(d => d.r + 4));
    const link = svg.append("g").selectAll("line").data(links).enter().append("line")
      .attr("stroke", d => d.kind === "contains" ? "#D1D5DB" : d.kind === "provides" ? "#0E7490" : "#F87171")
      .attr("stroke-width", d => d.kind === "contains" ? 1.6 : 1.4)
      .attr("stroke-dasharray", d => d.kind === "dep" ? "3,3" : null)
      .attr("opacity", 0.65);
    const node = svg.append("g").selectAll("g").data(nodes).enter().append("g")
      .style("cursor", "pointer")
      .on("mouseenter", (_, d) => setHovered(d))
      .on("mouseleave", () => setHovered(null))
      .call(d3.drag()
        .on("start", (event, d) => { if (!event.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on("end", (event, d) => { if (!event.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));
    node.append("circle")
      .attr("r", d => d.r)
      .attr("fill", d => d.color)
      .attr("stroke", d => d.type === "ao" ? "#1B3A5C" : "#fff")
      .attr("stroke-width", d => d.type === "ao" ? 3 : 1.5);
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", d => d.r + 11)
      .attr("font-size", d => d.type === "ao" ? 11 : d.type === "supplier" ? 10 : 9)
      .attr("font-weight", d => d.type === "ao" ? 700 : 500)
      .attr("fill", "#1B3A5C")
      .attr("pointer-events", "none")
      .text(d => d.type === "init" ? d.label : (d.label.length > 22 ? d.label.substring(0, 22) + "…" : d.label));
    sim.on("tick", () => {
      link.attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y);
      node.attr("transform", d => "translate(" + d.x + "," + d.y + ")");
    });
    return () => sim.stop();
  }, [objects, allData, dims]);
  if (objects.length === 0) return <p style={{ fontSize: 13, color: "#9CA3AF", padding: 20 }}>Inga analysobjekt än.</p>;
  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", height: "calc(100vh - 260px)", minHeight: 500, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10 }}>
      <svg ref={svgRef} width={dims.w} height={dims.h} style={{ width: "100%", height: "100%" }} />
      <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(255,255,255,0.95)", padding: "8px 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 10, color: "#6B7280", display: "flex", gap: 14, flexWrap: "wrap", maxWidth: "70%" }}>
        <span><span style={{ display: "inline-block", width: 14, height: 14, borderRadius: "50%", background: "#22C55E", border: "2px solid #1B3A5C", verticalAlign: "middle", marginRight: 4 }} />Analysobjekt (färg = värsta läge)</span>
        <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#6B7280", verticalAlign: "middle", marginRight: 4 }} />Kopplat initiativ</span>
        <span><span style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: "#0E7490", verticalAlign: "middle", marginRight: 4 }} />Leverantör</span>
        <span><span style={{ display: "inline-block", width: 16, height: 2, background: "#D1D5DB", verticalAlign: "middle", marginRight: 4 }} />Ingår i</span>
        <span><span style={{ display: "inline-block", width: 16, height: 2, background: "#0E7490", verticalAlign: "middle", marginRight: 4 }} />Tillhandahålls av</span>
        <span><span style={{ display: "inline-block", width: 16, height: 0, borderTop: "2px dashed #F87171", verticalAlign: "middle", marginRight: 4 }} />Initiativ-beroende</span>
      </div>
      {hovered && (
        <div style={{ position: "absolute", bottom: 12, left: 12, background: "rgba(27,58,92,0.95)", color: "#fff", padding: "8px 12px", borderRadius: 8, fontSize: 11, maxWidth: 480 }}>
          {hovered.type === "ao" ? "🛡️ " : hovered.type === "supplier" ? "🏭 " : ""}{hovered.fullName || hovered.label}
        </div>
      )}
    </div>
  );
}

function ContinuityView({ allData }) {
  const [objects, setObjects] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [subTab, setSubTab] = useState("objekt");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  useEffect(() => {
    storageGet("analysis_objects").then(data => { setObjects(Array.isArray(data) ? data : []); setLoaded(true); });
    const sub = subscribeToTable('analysis_objects', (payload) => {
      const row = payload.new;
      if (row && Array.isArray(row.data)) setObjects(row.data);
    });
    return () => sub.unsubscribe();
  }, []);
  const save = async (list) => { setObjects(list); await storageSet("analysis_objects", list); };
  const addNew = () => { const o = newAnalysisObject(); const next = [...objects, o]; save(next); setEditingId(o.id); setSubTab("objekt"); };
  const addFromInitiative = (init) => {
    const o = newAnalysisObject();
    o.namn = init.n;
    o.typ = "Dataplattform";
    o.linkedInitiatives = [init.nr];
    const next = [...objects, o]; save(next); setEditingId(o.id); setSubTab("objekt");
    setPickerOpen(false); setPickerQuery("");
  };
  const pickerHits = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    return allData.filter(d => !q || d.n.toLowerCase().includes(q) || String(d.nr).includes(q)).slice(0, 40);
  }, [pickerQuery, allData]);
  const patch = (id, p) => save(objects.map(o => o.id === id ? { ...o, ...p } : o));
  const remove = (id) => { if (confirm("Ta bort detta analysobjekt?")) save(objects.filter(o => o.id !== id)); };
  const exportAll = () => {
    const text = objects.map(o => buildContinuityMarkdown(o, allData)).join("\n\n---\n\n");
    downloadText("kontinuitetsanalys-alla-" + new Date().toISOString().slice(0, 10) + ".md", text);
  };
  if (!loaded) return null;
  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 20 }}>
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1B3A5C", margin: "0 0 4px", fontFamily: "'DM Sans', sans-serif" }}>Kontinuitet & hållbarhet</h2>
        <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>Analys av den digitala försörjningskedjan med kontinuitetshantering som grund — enligt Metodstödet. Ett analysobjekt kan vara en systemmiljö, dataplattform, ett leverantörsberoende eller en informationskedja.</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <button onClick={() => setSubTab("objekt")} style={{ padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", border: subTab === "objekt" ? "1px solid #1B3A5C" : "1px solid #E5E7EB", background: subTab === "objekt" ? "#1B3A5C" : "#fff", color: subTab === "objekt" ? "#fff" : "#6B7280" }}>Analysobjekt</button>
        <button onClick={() => setSubTab("oversikt")} style={{ padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", border: subTab === "oversikt" ? "1px solid #1B3A5C" : "1px solid #E5E7EB", background: subTab === "oversikt" ? "#1B3A5C" : "#fff", color: subTab === "oversikt" ? "#fff" : "#6B7280" }}>Översikt</button>
        <button onClick={() => setSubTab("graf")} style={{ padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", border: subTab === "graf" ? "1px solid #1B3A5C" : "1px solid #E5E7EB", background: subTab === "graf" ? "#1B3A5C" : "#fff", color: subTab === "graf" ? "#fff" : "#6B7280" }}>Beroendegraf</button>
        <div style={{ flex: 1 }} />
        {subTab === "objekt" && (
          <>
            <button onClick={() => { setPickerOpen(!pickerOpen); setPickerQuery(""); }} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid #BFDBFE", background: pickerOpen ? "#DBEAFE" : "#F5F9FF", color: "#1A56DB" }}>+ Från initiativ</button>
            <button onClick={addNew} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid #4285F4", background: "#E8F0FE", color: "#1A56DB" }}>+ Tomt analysobjekt</button>
          </>
        )}
      </div>
      {subTab === "objekt" && pickerOpen && (
        <div style={{ border: "1px solid #BFDBFE", borderRadius: 10, padding: 12, background: "#F5F9FF", marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#1B3A5C", fontWeight: 700, marginBottom: 6 }}>Skapa kontinuitetsanalys utifrån ett befintligt initiativ</div>
          <p style={{ fontSize: 11, color: "#6B7280", margin: "0 0 8px" }}>Namn och koppling förifylls — du kan ändra typ och allt annat efteråt.</p>
          <input value={pickerQuery} onChange={e => setPickerQuery(e.target.value)} autoFocus placeholder="Sök initiativ på namn eller nummer..." style={contInput} />
          <div style={{ maxHeight: 260, overflowY: "auto", marginTop: 8, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 6 }}>
            {pickerHits.length === 0 && <p style={{ padding: 10, fontSize: 11, color: "#9CA3AF", margin: 0 }}>Inga träffar.</p>}
            {pickerHits.map(d => (
              <button key={d.nr} onClick={() => addFromInitiative(d)} style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 10px", border: "none", borderBottom: "1px solid #F3F4F6", background: "transparent", cursor: "pointer", fontSize: 12, color: "#1B3A5C" }}>
                <b>Nr {d.nr}</b> — {d.n} <span style={{ color: "#9CA3AF", fontSize: 11 }}>· {d.typ}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {subTab === "oversikt" ? (
        <ContOverview objects={objects} allData={allData} onExportAll={exportAll} />
      ) : subTab === "graf" ? (
        <ContDependencyGraph objects={objects} allData={allData} />
      ) : objects.length === 0 ? (
        <p style={{ fontSize: 13, color: "#9CA3AF", padding: "20px 0" }}>Inga analysobjekt än. Klicka "+ Nytt analysobjekt" för att börja en kontinuitetsanalys.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {objects.map(obj => {
            const isEditing = editingId === obj.id;
            return (
              <div key={obj.id} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", background: isEditing ? "#FAFBFC" : "#fff" }} onClick={() => setEditingId(isEditing ? null : obj.id)}>
                  {isEditing
                    ? <input value={obj.namn} onClick={e => e.stopPropagation()} onChange={e => patch(obj.id, { namn: e.target.value })} placeholder="Namn på analysobjekt" style={{ ...contInput, flex: 1, fontWeight: 700 }} />
                    : <span style={{ fontSize: 13, fontWeight: 700, color: "#1B3A5C", flex: 1 }}>{obj.namn || "Namnlöst analysobjekt"}</span>}
                  <span style={{ fontSize: 9, fontWeight: 600, padding: "3px 8px", borderRadius: 10, color: "#1A56DB", background: "#E8F0FE" }}>{obj.typ}</span>
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>{isEditing ? "▾" : "▸"}</span>
                </div>
                {isEditing && (
                  <div>
                    <ContObjectEditor obj={obj} onPatch={p => patch(obj.id, p)} allData={allData} />
                    <div style={{ padding: "0 16px 14px", textAlign: "right" }}>
                      <button onClick={() => remove(obj.id)} style={{ padding: "4px 12px", borderRadius: 6, fontSize: 10, cursor: "pointer", border: "1px solid #FECACA", background: "#FEF2F2", color: "#991B1B" }}>Ta bort analysobjekt</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────── ANALYSIS VIEW ─────────── */
function AnalysisView({ data, onClickItem }) {
  const [tab, setTab] = useState("A");
  const tabs = [
    { id: "A", label: "Förmågegap", icon: "📊", desc: "Vad behöver vi, vem har det?" },
    { id: "B", label: "Dockningsindex", icon: "🔌", desc: "Hur lätt kan vi koppla oss till detta?" },
    { id: "C", label: "Kluster", icon: "🔗", desc: "Vilka initiativ bildar ekosystem?" },
    { id: "D", label: "Mognadstrappa", icon: "📈", desc: "Vad bör vi göra i vilken ordning?" },
    { id: "E", label: "Regiongemensamt", icon: "🎯", desc: "Vad driver vi själva vs. dockar in i?" },
  ];
  const AI_DIMS = ["Datatillgång", "Teknik/IT", "Strategi", "Juridik", "Nyttokalkyler", "Kompetens"];
  const KCHD_DIMS = ["Teknik att docka in i", "Sekundäranvändning av hälsodata", "Data management & governance", "Variabelbeskrivningar/metadata", "Juridik"];
  const getAiScore = (item, dim) => (item.ai || []).find(a => a.name === dim)?.score || 0;
  const getKchdScore = (item, dim) => (item.kchd || []).find(k => k.name === dim)?.score || 0;
  const getKchdComment = (item, dim) => (item.kchd || []).find(k => k.name === dim)?.comment || "";
  const avgAi = (item) => { const scores = (item.ai || []).map(a => a.score); return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0; };
  const avgKchd = (item) => { const scores = (item.kchd || []).map(k => k.score); return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0; };
  const typColor = (typ) => {
    if (!typ) return "#6B7280";
    const t = typ.toLowerCase();
    if (t.includes("infrastruktur")) return "#4285F4";
    if (t.includes("samverkan") || t.includes("forskning")) return "#E8913A";
    if (t.includes("superdator")) return "#8B5CF6";
    if (t.includes("lagstiftning") || t.includes("strategi") || t.includes("policy")) return "#DC2626";
    return "#6B7280";
  };
  const fkLabel = (fk) => fk === "Regionerna" ? "Reg" : fk && fk.includes("Stat") ? "Stat" : "EU";
  const InitBadge = ({ item, showScore, score }) => (
    <div onClick={() => onClickItem(item)} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 6, fontSize: 10.5, cursor: "pointer", background: typColor(item.typ) + "18", border: "1px solid " + typColor(item.typ) + "44", color: typColor(item.typ), fontWeight: 500, lineHeight: 1.2 }}
      onMouseEnter={e => e.currentTarget.style.background = typColor(item.typ) + "30"}
      onMouseLeave={e => e.currentTarget.style.background = typColor(item.typ) + "18"}>
      <span style={{ fontWeight: 700 }}>#{item.nr}</span>
      <span style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.n.length > 28 ? item.n.substring(0, 28) + "…" : item.n}</span>
      {showScore && <span style={{ marginLeft: 2, fontWeight: 700, fontSize: 10, background: typColor(item.typ), color: "#fff", borderRadius: 4, padding: "1px 4px" }}>{score}</span>}
    </div>
  );
  // ─── ANALYS A: Förmågegap ───
  const renderA = () => {
    const dimData = AI_DIMS.map(dim => {
      const sorted = [...data].sort((a, b) => getAiScore(b, dim) - getAiScore(a, dim));
      const top = sorted.filter(i => getAiScore(i, dim) === 3).slice(0, 12);
      const mid = sorted.filter(i => getAiScore(i, dim) === 2).slice(0, 6);
      return { dim, top, mid, topCount: sorted.filter(i => getAiScore(i, dim) === 3).length };
    });
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1B3A5C", margin: "0 0 6px" }}>A. Förmågegap-matris</h3>
          <p style={{ fontSize: 12, color: "#6B7280", margin: 0, lineHeight: 1.5 }}>Visar vilka initiativ som scorar högst (3) inom varje AI-dimension. Regionerna har ofta svag juridik- och kompetensförmåga — initiativen nedan kan fylla dessa luckor.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {dimData.map(({ dim, top, mid, topCount }) => (
            <div key={dim} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1B3A5C" }}>{dim}</span>
                <span style={{ fontSize: 10, color: "#9CA3AF", background: "#F3F4F6", padding: "2px 8px", borderRadius: 10 }}>{topCount} initiativ med score 3</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {top.map(i => <InitBadge key={i.nr} item={i} showScore score={3} />)}
                {mid.slice(0, 4).map(i => <InitBadge key={i.nr} item={i} showScore score={2} />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  // ─── ANALYS B: Dockningsindex ───
  const renderB = () => {
    const scored = data.map(item => {
      const dock = getKchdScore(item, "Teknik att docka in i");
      const sek = getKchdScore(item, "Sekundäranvändning av hälsodata");
      const varb = getKchdScore(item, "Variabelbeskrivningar/metadata");
      const raw = dock + sek + varb;
      const fkBonus = item.fk === "Regionerna" ? 1.5 : item.fk && item.fk.includes("Stat") ? 1.0 : 0.7;
      const index = (raw * fkBonus).toFixed(1);
      return { ...item, dockIndex: parseFloat(index), rawDock: raw, dock, sek, varb, fkBonus };
    }).sort((a, b) => b.dockIndex - a.dockIndex);
    const top20 = scored.slice(0, 20);
    const maxIdx = top20[0]?.dockIndex || 1;
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1B3A5C", margin: "0 0 6px" }}>B. Dockningsindex</h3>
          <p style={{ fontSize: 12, color: "#6B7280", margin: 0, lineHeight: 1.5 }}>Rankad lista baserad på KCHD-relevans (Teknik att docka + Sekundäranvändning + Variabelbeskrivningar) × finansieringsnärhet (Regionerna: ×1.5, Stat: ×1.0, EU: ×0.7). Högre = lättare att börja samarbeta med.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {top20.map((item, idx) => (
            <div key={item.nr} onClick={() => onClickItem(item)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: idx < 3 ? "#F0FFF4" : idx < 10 ? "#fff" : "#FAFAFA", border: "1px solid " + (idx < 3 ? "#86EFAC" : "#E5E7EB"), borderRadius: 8, cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = "#F0F7FF"}
              onMouseLeave={e => e.currentTarget.style.background = idx < 3 ? "#F0FFF4" : idx < 10 ? "#fff" : "#FAFAFA"}>
              <span style={{ fontSize: 14, fontWeight: 800, color: idx < 3 ? "#166534" : "#6B7280", width: 28, textAlign: "right" }}>{idx + 1}</span>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: typColor(item.typ), flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1B3A5C", minWidth: 32 }}>#{item.nr}</span>
              <span style={{ fontSize: 11.5, color: "#374151", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.n}</span>
              <div style={{ width: 100, height: 8, background: "#F3F4F6", borderRadius: 4, overflow: "hidden", flexShrink: 0 }}>
                <div style={{ height: "100%", width: (item.dockIndex / maxIdx * 100) + "%", background: idx < 3 ? "#22C55E" : idx < 10 ? "#4285F4" : "#9CA3AF", borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: idx < 3 ? "#166534" : "#374151", width: 36, textAlign: "right" }}>{item.dockIndex}</span>
              <span style={{ fontSize: 9, color: "#9CA3AF", width: 28 }}>{fkLabel(item.fk)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };
  // ─── ANALYS C: Klusteranalys ───
  const renderC = () => {
    const nrSet = new Set(data.map(d => d.nr));
    const adj = {};
    data.forEach(d => { adj[d.nr] = new Set(); });
    data.forEach(d => {
      (d.dep || "").split(",").map(s => parseInt(s.trim())).filter(n => n && nrSet.has(n)).forEach(n => {
        adj[d.nr].add(n); adj[n].add(d.nr);
      });
    });
    // Find connected components
    const visited = new Set();
    const clusters = [];
    data.forEach(d => {
      if (visited.has(d.nr)) return;
      const cluster = [];
      const queue = [d.nr];
      while (queue.length) {
        const nr = queue.shift();
        if (visited.has(nr)) continue;
        visited.add(nr);
        cluster.push(nr);
        (adj[nr] || new Set()).forEach(n => { if (!visited.has(n)) queue.push(n); });
      }
      clusters.push(cluster);
    });
    const sortedClusters = clusters.sort((a, b) => b.length - a.length);
    const dataMap = {};
    data.forEach(d => dataMap[d.nr] = d);
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1B3A5C", margin: "0 0 6px" }}>C. Klusteranalys</h3>
          <p style={{ fontSize: 12, color: "#6B7280", margin: 0, lineHeight: 1.5 }}>Visar sammanhängande ekosystem av initiativ. Att satsa på t.ex. precisionsmedicin kräver engagemang i hela klustret, inte bara ett initiativ. Kluster sorterade efter storlek.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sortedClusters.filter(cl => cl.length > 1).map((cl, idx) => {
            const items = cl.map(nr => dataMap[nr]).filter(Boolean).sort((a, b) => b.ai.reduce((s, x) => s + x.score, 0) - a.ai.reduce((s, x) => s + x.score, 0));
            const fkDist = {};
            items.forEach(i => { const fk = fkLabel(i.fk); fkDist[fk] = (fkDist[fk] || 0) + 1; });
            return (
              <div key={idx} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1B3A5C" }}>Kluster {idx + 1}</span>
                  <span style={{ fontSize: 10, color: "#9CA3AF", background: "#F3F4F6", padding: "2px 8px", borderRadius: 10 }}>{items.length} initiativ</span>
                  {Object.entries(fkDist).map(([fk, n]) => (
                    <span key={fk} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 8, background: fk === "Reg" ? "#E6F5EC" : fk === "Stat" ? "#F3F4F6" : "#EFF6FF", color: fk === "Reg" ? "#166534" : fk === "Stat" ? "#374151" : "#1A56DB" }}>{fk}: {n}</span>
                  ))}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxHeight: 120, overflowY: "auto" }}>
                  {items.map(i => <InitBadge key={i.nr} item={i} />)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  // ─── ANALYS D: Mognadstrappa ───
  const renderD = () => {
    const statusOrder = { "Operativt": 3, "Under uppbyggnad": 2, "Under driftsättning": 2, "Under utredning": 1, "Pågående uppdrag": 2, "Pågående": 2, "Nystartat": 1, "Avslutat": 0, "Avslutat/övergång": 0, "Ikraftträdd — implementation pågår": 2, "Remitterad": 1, "Beslutad": 2, "Beslutad strategi": 2, "Gällande lagstiftning": 3, "Gällande EU-förordning": 3, "Avslutad utredning, remissbehandling": 1 };
    const statusBucket = (st) => {
      const v = statusOrder[st];
      if (v === undefined) return 1;
      return v;
    };
    const statusLabel = (v) => v >= 3 ? "Operativt" : v >= 2 ? "Under uppbyggnad" : v >= 1 ? "Under utredning" : "Avslutat";
    const statusColor = (v) => v >= 3 ? "#22C55E" : v >= 2 ? "#F59E0B" : v >= 1 ? "#6366F1" : "#9CA3AF";
    const items = data.map(item => ({
      ...item,
      aiAvg: avgAi(item),
      maturity: statusBucket(item.st)
    }));
    const quadrants = [
      { label: "🎯 Nu — börja samverka idag", filter: i => i.maturity >= 3 && i.aiAvg >= 2, bg: "#F0FFF4", border: "#86EFAC" },
      { label: "⏳ Snart — förbered er", filter: i => i.maturity >= 2 && i.maturity < 3 && i.aiAvg >= 2, bg: "#FFFBEB", border: "#FCD34D" },
      { label: "👁 Bevaka — hög potential", filter: i => i.maturity < 2 && i.aiAvg >= 2, bg: "#EFF6FF", border: "#93C5FD" },
      { label: "📋 Låg prioritet", filter: i => i.aiAvg < 2, bg: "#F9FAFB", border: "#E5E7EB" },
    ];
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1B3A5C", margin: "0 0 6px" }}>D. Mognadstrappa</h3>
          <p style={{ fontSize: 12, color: "#6B7280", margin: 0, lineHeight: 1.5 }}>Korsrefererar mognad (status) med AI-relevans (genomsnittlig score). Operativa initiativ med hög AI-relevans är "low-hanging fruit" som regionerna kan börja samverka med idag.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {quadrants.map(q => {
            const matches = items.filter(q.filter).sort((a, b) => b.aiAvg - a.aiAvg);
            return (
              <div key={q.label} style={{ background: q.bg, border: "1px solid " + q.border, borderRadius: 10, padding: 14, minHeight: 100 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1B3A5C", marginBottom: 8 }}>{q.label} <span style={{ fontWeight: 400, color: "#9CA3AF" }}>({matches.length})</span></div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxHeight: 200, overflowY: "auto" }}>
                  {matches.slice(0, 20).map(i => <InitBadge key={i.nr} item={i} showScore score={i.aiAvg.toFixed(1)} />)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  // ─── ANALYS E: Regiongemensamt vs. externt ───
  const renderE = () => {
    const groups = [
      { key: "drive", label: "🟢 Regionerna driver själva", desc: "Här bestämmer ni takten", filter: i => i.fk === "Regionerna", bg: "#F0FFF4", border: "#86EFAC" },
      { key: "adapt", label: "🔴 Regionerna måste anpassa sig", desc: "Lagstiftning och policy — följ med", filter: i => i.fk !== "Regionerna" && (i.typ || "").toLowerCase().includes("lagstiftning") || (i.typ || "").toLowerCase().includes("policy") || (i.typ || "").toLowerCase().includes("strategi"), bg: "#FEF2F2", border: "#FECACA" },
      { key: "dock", label: "🔵 Regionerna kan välja att docka in", desc: "Stat/EU-infrastruktur och samverkan — prioriteringsfrågan", filter: i => i.fk !== "Regionerna" && !((i.typ || "").toLowerCase().includes("lagstiftning") || (i.typ || "").toLowerCase().includes("policy") || (i.typ || "").toLowerCase().includes("strategi")), bg: "#EFF6FF", border: "#93C5FD" },
    ];
    // Avoid double-counting: assign each item to first matching group
    const assigned = new Set();
    const groupItems = groups.map(g => {
      const items = data.filter(i => !assigned.has(i.nr) && g.filter(i)).sort((a, b) => avgKchd(b) - avgKchd(a));
      items.forEach(i => assigned.add(i.nr));
      return { ...g, items };
    });
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1B3A5C", margin: "0 0 6px" }}>E. Regiongemensamt vs. externt — KCHD:s beslutsstöd</h3>
          <p style={{ fontSize: 12, color: "#6B7280", margin: 0, lineHeight: 1.5 }}>Tredje gruppen (blå) är den strategiska prioriteringsfrågan: vilka externa initiativ ska regionerna aktivt docka in i? Sorterade efter KCHD-relevans.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {groupItems.map(g => (
            <div key={g.key} style={{ background: g.bg, border: "1px solid " + g.border, borderRadius: 10, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1B3A5C" }}>{g.label}</span>
                <span style={{ fontSize: 10, color: "#9CA3AF" }}>({g.items.length} initiativ)</span>
              </div>
              <p style={{ fontSize: 11, color: "#6B7280", margin: "0 0 8px" }}>{g.desc}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxHeight: 200, overflowY: "auto" }}>
                {g.items.map(i => <InitBadge key={i.nr} item={i} showScore score={avgKchd(i).toFixed(1)} />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Sub-tabs */}
      <div style={{ padding: "8px 16px", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", display: "flex", gap: 4, overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: tab === t.id ? "1px solid #4285F4" : "1px solid #E5E7EB", background: tab === t.id ? "#E8F0FE" : "#fff", color: tab === t.id ? "#1A56DB" : "#6B7280", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
        <span style={{ fontSize: 10, color: "#9CA3AF", alignSelf: "center", marginLeft: 8, fontStyle: "italic" }}>{tabs.find(t => t.id === tab)?.desc}</span>
      </div>
      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        {tab === "A" && renderA()}
        {tab === "B" && renderB()}
        {tab === "C" && renderC()}
        {tab === "D" && renderD()}
        {tab === "E" && renderE()}
      </div>
    </div>
  );
}
/* ─────────── NETWORK VIEW ─────────── */
function NetworkView({ data, onClickItem }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [focusNrs, setFocusNrs] = useState(new Set());
  const [hops, setHops] = useState(1);
  const [hovered, setHovered] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dims, setDims] = useState({ w: 900, h: 600 });
  const simRef = useRef(null);
  const dataMap = useMemo(() => { const m = {}; data.forEach(d => m[d.nr] = d); return m; }, [data]);
  // Build full adjacency (bidirectional)
  const adj = useMemo(() => {
    const a = {};
    data.forEach(d => { a[d.nr] = new Set(); });
    data.forEach(d => {
      (d.dep || "").split(",").map(s => parseInt(s.trim())).filter(n => n && a[n] !== undefined).forEach(n => {
        a[d.nr].add(n);
        a[n].add(d.nr);
      });
    });
    return a;
  }, [data]);
  // Expand from focus nodes by N hops
  const visibleNrs = useMemo(() => {
    if (focusNrs.size === 0) return new Set(data.map(d => d.nr));
    const visited = new Set(focusNrs);
    let frontier = new Set(focusNrs);
    for (let h = 0; h < hops; h++) {
      const next = new Set();
      frontier.forEach(nr => {
        (adj[nr] || new Set()).forEach(n => { if (!visited.has(n)) { visited.add(n); next.add(n); } });
      });
      frontier = next;
    }
    return visited;
  }, [focusNrs, hops, adj, data]);
  // Color by typ
  const typColor = (typ) => {
    if (!typ) return "#6B7280";
    const t = typ.toLowerCase();
    if (t.includes("infrastruktur")) return "#4285F4";
    if (t.includes("samverkan") || t.includes("forskning")) return "#E8913A";
    if (t.includes("superdator")) return "#8B5CF6";
    if (t.includes("lagstiftning") || t.includes("strategi") || t.includes("policy")) return "#DC2626";
    return "#6B7280";
  };
  const fkShape = (fk) => {
    if (fk === "Regionerna") return "circle";
    if (fk && fk.includes("Stat")) return "rect";
    return "diamond";
  };
  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 100 && height > 100) setDims({ w: width, h: height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);
  // d3-force simulation
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const visData = data.filter(d => visibleNrs.has(d.nr));
    const visSet = new Set(visData.map(d => d.nr));
    const nodes = visData.map(d => ({
      id: d.nr, nr: d.nr, label: "#" + d.nr + " " + (d.n.length > 25 ? d.n.substring(0, 25) + "…" : d.n),
      shortLabel: "#" + d.nr,
      fullName: d.n, typ: d.typ, fk: d.fk, del: d.del,
      isFocus: focusNrs.has(d.nr),
      connections: (adj[d.nr] || new Set()).size,
      r: Math.max(8, Math.min(22, 6 + ((adj[d.nr] || new Set()).size) * 1.5))
    }));
    const links = [];
    const linkSet = new Set();
    visData.forEach(d => {
      (d.dep || "").split(",").map(s => parseInt(s.trim())).filter(n => n && visSet.has(n)).forEach(n => {
        const key = Math.min(d.nr, n) + "-" + Math.max(d.nr, n);
        if (!linkSet.has(key)) { linkSet.add(key); links.push({ source: d.nr, target: n }); }
      });
    });
    const { w, h } = dims;
    const g = svg.append("g");
    // Zoom
    const zoom = d3.zoom().scaleExtent([0.2, 4]).on("zoom", e => g.attr("transform", e.transform));
    svg.call(zoom);
    // Arrow marker
    svg.append("defs").append("marker").attr("id", "arrow").attr("viewBox", "0 -5 10 10").attr("refX", 20).attr("refY", 0).attr("markerWidth", 6).attr("markerHeight", 6).attr("orient", "auto").append("path").attr("d", "M0,-4L10,0L0,4").attr("fill", "#CBD5E1");
    // Links
    const link = g.append("g").selectAll("line").data(links).join("line")
      .attr("stroke", "#E5E7EB").attr("stroke-width", 1.5).attr("marker-end", "url(#arrow)");
    // Node groups
    const node = g.append("g").selectAll("g").data(nodes, d => d.id).join("g").attr("cursor", "pointer");
    // Draw shapes
    node.each(function(d) {
      const el = d3.select(this);
      const color = typColor(d.typ);
      const isFocus = d.isFocus;
      el.append("circle")
        .attr("r", d.r)
        .attr("fill", color + (isFocus ? "" : "CC"))
        .attr("stroke", isFocus ? "#0F2942" : color)
        .attr("stroke-width", isFocus ? 3 : 1.5);
    });
    // Labels
    node.append("text").text(d => d.shortLabel).attr("dy", d => d.r + 12).attr("text-anchor", "middle")
      .attr("font-size", 9).attr("font-weight", 600).attr("fill", "#374151").attr("font-family", "'DM Sans', sans-serif");
    // Hover tooltip
    const tooltip = svg.append("g").attr("class", "tooltip").style("display", "none");
    const ttBg = tooltip.append("rect").attr("fill", "#1B3A5C").attr("rx", 6).attr("ry", 6);
    const ttText = tooltip.append("text").attr("fill", "#fff").attr("font-size", 11).attr("font-family", "'DM Sans', sans-serif");
    node.on("mouseover", function(event, d) {
      d3.select(this).select("circle").attr("stroke-width", 3).attr("stroke", "#0F2942");
      link.attr("stroke", l => (l.source.id === d.id || l.target.id === d.id) ? typColor(d.typ) : "#E5E7EB")
        .attr("stroke-width", l => (l.source.id === d.id || l.target.id === d.id) ? 2.5 : 1.5);
      ttText.text(d.fullName + " (" + d.connections + " koppl.)");
      const bbox = ttText.node().getBBox();
      ttBg.attr("x", bbox.x - 8).attr("y", bbox.y - 4).attr("width", bbox.width + 16).attr("height", bbox.height + 8);
      tooltip.attr("transform", "translate(" + (event.offsetX + 12) + "," + (event.offsetY - 20) + ")").style("display", null);
      setHovered(d.nr);
    }).on("mouseout", function(event, d) {
      d3.select(this).select("circle").attr("stroke-width", d.isFocus ? 3 : 1.5).attr("stroke", d.isFocus ? "#0F2942" : typColor(d.typ));
      link.attr("stroke", "#E5E7EB").attr("stroke-width", 1.5);
      tooltip.style("display", "none");
      setHovered(null);
    }).on("click", function(event, d) {
      event.stopPropagation();
      setFocusNrs(prev => {
        const next = new Set(prev);
        if (next.has(d.nr)) next.delete(d.nr); else next.add(d.nr);
        return next;
      });
    }).on("dblclick", function(event, d) {
      event.stopPropagation();
      onClickItem(dataMap[d.nr]);
    });
    svg.on("click", () => {}); // prevent zoom reset
    // Simulation
    const sim = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(80))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(w / 2, h / 2))
      .force("collision", d3.forceCollide().radius(d => d.r + 6))
      .on("tick", () => {
        link.attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y);
        node.attr("transform", d => "translate(" + d.x + "," + d.y + ")");
      });
    simRef.current = sim;
    // Drag
    const drag = d3.drag()
      .on("start", (event, d) => { if (!event.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
      .on("end", (event, d) => { if (!event.active) sim.alphaTarget(0); d.fx = null; d.fy = null; });
    node.call(drag);
    return () => sim.stop();
  }, [data, visibleNrs, focusNrs, dims, adj, dataMap]);
  // Search suggestions
  const suggestions = useMemo(() => {
    if (searchTerm.length < 2) return [];
    const t = searchTerm.toLowerCase();
    return data.filter(d => (d.n.toLowerCase().includes(t) || ("#" + d.nr).includes(t))).slice(0, 8);
  }, [searchTerm, data]);
  const toggleFocus = (nr) => {
    setFocusNrs(prev => { const n = new Set(prev); if (n.has(nr)) n.delete(nr); else n.add(nr); return n; });
    setSearchTerm("");
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Toolbar */}
      <div style={{ padding: "10px 16px", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ position: "relative", minWidth: 220 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", borderRadius: 8, padding: "4px 10px", border: "1px solid #E5E7EB" }}>
            <Search size={13} color="#9CA3AF" />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Sök initiativ att fokusera..." style={{ border: "none", background: "transparent", fontSize: 11, outline: "none", width: 160 }} />
          </div>
          {suggestions.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 10, maxHeight: 200, overflowY: "auto" }}>
              {suggestions.map(d => (
                <div key={d.nr} onClick={() => toggleFocus(d.nr)} style={{ padding: "6px 10px", fontSize: 11, cursor: "pointer", borderBottom: "1px solid #F3F4F6", background: focusNrs.has(d.nr) ? "#E8F0FE" : "#fff" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#F3F4F6"} onMouseLeave={e => e.currentTarget.style.background = focusNrs.has(d.nr) ? "#E8F0FE" : "#fff"}>
                  <span style={{ fontWeight: 700 }}>#{d.nr}</span> {d.n.length > 40 ? d.n.substring(0, 40) + "…" : d.n}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#6B7280" }}>
          <span>Djup:</span>
          {[1, 2, 3].map(h => (
            <button key={h} onClick={() => setHops(h)} style={{ width: 24, height: 24, borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: hops === h ? "1px solid #4285F4" : "1px solid #E5E7EB", background: hops === h ? "#E8F0FE" : "#fff", color: hops === h ? "#1A56DB" : "#6B7280" }}>{h}</button>
          ))}
        </div>
        {focusNrs.size > 0 && (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
            {[...focusNrs].map(nr => (
              <span key={nr} onClick={() => toggleFocus(nr)} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 12, background: "#0F2942", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
                #{nr} ×
              </span>
            ))}
            <button onClick={() => setFocusNrs(new Set())} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "none", border: "1px solid #E5E7EB", cursor: "pointer", color: "#6B7280" }}>Visa alla</button>
          </div>
        )}
        <span style={{ fontSize: 10, color: "#9CA3AF", marginLeft: "auto" }}>{visibleNrs.size} noder · Klicka = fokus · Dblklick = detalj · Dra = flytta</span>
      </div>
      {/* Legend */}
      <div style={{ padding: "6px 16px", background: "#fff", borderBottom: "1px solid #E5E7EB", display: "flex", gap: 16, fontSize: 10, color: "#6B7280" }}>
        {[["#4285F4", "Infrastruktur"], ["#E8913A", "Samverkan/forskning"], ["#8B5CF6", "Superdatorcentra"], ["#DC2626", "Lagstiftning/policy"]].map(([col, label]) => (
          <span key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: col, display: "inline-block" }} /> {label}
          </span>
        ))}
      </div>
      {/* SVG canvas */}
      <div ref={containerRef} style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <svg ref={svgRef} width={dims.w} height={dims.h} style={{ background: "#FAFBFC" }} />
      </div>
    </div>
  );
}
function MatrixView({ data, onClickItem }) {
  const fkLabels = { "Regionerna": "Regionerna", "Stat, inkl myndigheter och/eller privat": "Stat / myndigheter", "EU": "EU" };
  const fkKeys = ["Regionerna", "Stat, inkl myndigheter och/eller privat", "EU"];
  const typBuckets = {
    infra: { label: "Digital infrastruktur för datadelning", match: t => t && t.toLowerCase().includes("infrastruktur") },
    samverkan: { label: "Samverkan / demonstrator / forskning", match: t => t && (t.includes("Samverkan") || t.toLowerCase().includes("forskning")) },
    super: { label: "Superdatorcentra för känslig data", match: t => t && t.includes("Superdator") },
    lagstiftning: { label: "Lagstiftning / strategi / policy", match: t => t && (t.includes("Lagstiftning") || t.includes("strategi") || t.includes("policy")) }
  };
  const typKeys = ["infra", "samverkan", "super", "lagstiftning"];
  const typColors = {
    infra: { bg: "#E8F0FE", text: "#1A56DB", border: "#4285F4" },
    samverkan: { bg: "#FEF3E2", text: "#B45309", border: "#E8913A" },
    super: { bg: "#F3E8FE", text: "#6D28D9", border: "#8B5CF6" },
    lagstiftning: { bg: "#FEE2E2", text: "#991B1B", border: "#DC2626" }
  };
  const getCell = (fk, typKey) => data.filter(i => i.fk === fk && typBuckets[typKey].match(i.typ));
  const activeTypKeys = typKeys.filter(tk => fkKeys.some(fk => getCell(fk, tk).length > 0));
  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1B3A5C", margin: "0 0 6px", fontFamily: "'DM Sans', sans-serif" }}>Sexfältare (Typ × Finansieringskälla)</h2>
        <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>{data.length} initiativ fördelade på typ och finansieringskälla. Använd filter i sidofältet för att välja urval.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "220px repeat(3, 1fr)", gap: 8 }}>
        <div />
        {fkKeys.map(fk => (
          <div key={fk} style={{ padding: "10px 12px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#166534", background: "#E6F5EC", borderRadius: 8, fontFamily: "'DM Sans', sans-serif" }}>{fkLabels[fk]}</div>
        ))}
        {activeTypKeys.map(tk => (
          <React.Fragment key={tk}>
            <div style={{ display: "flex", alignItems: "center", padding: "10px 12px", fontSize: 11.5, fontWeight: 700, color: typColors[tk].text, background: typColors[tk].bg, borderRadius: 8, fontFamily: "'DM Sans', sans-serif", borderLeft: "4px solid " + typColors[tk].border, lineHeight: 1.3 }}>{typBuckets[tk].label}</div>
            {fkKeys.map(fk => {
              const items = getCell(fk, tk);
              return (
                <div key={fk + "-" + tk} style={{ background: items.length > 0 ? "#fff" : "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: items.length > 8 ? 10 : 14, minHeight: 60, maxHeight: 340, overflowY: items.length > 8 ? "auto" : "visible" }}>
                  {items.length === 0 ? <span style={{ fontSize: 11, color: "#CBD5E1", fontStyle: "italic" }}>Inga</span> : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {items.map(item => {
                        const delCol = {A:"#4285F4",B:"#E8913A",C:"#2D8A56",D:"#8B5CF6"}[item.del] || "#6B7280";
                        return (
                          <div key={item.nr} onClick={() => onClickItem(item)} style={{ padding: "5px 8px", borderRadius: 5, cursor: "pointer", background: typColors[tk].bg, border: "1px solid " + typColors[tk].border + "33", fontSize: 11, lineHeight: 1.25, color: typColors[tk].text, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}
                            onMouseEnter={e => { e.currentTarget.style.background = typColors[tk].border + "22"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = typColors[tk].bg; }}>
                            <span style={{ fontWeight: 700, flexShrink: 0 }}>#{item.nr}</span>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.n.length > 38 ? item.n.substring(0, 38) + "…" : item.n}</span>
                            <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, color: delCol, background: delCol + "18", padding: "1px 5px", borderRadius: 3, flexShrink: 0 }}>{item.sub}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {items.length > 0 && <div style={{ marginTop: 6, fontSize: 10, color: "#9CA3AF", fontWeight: 600 }}>{items.length} initiativ</div>}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
/* ─────────── INKORG (inskick från publika Hälsodatakartan) ─────────── */
const INBOX_SECTIONS = [
  { key: "andringar", label: "Ändringsförslag", icon: "✏️", fields: [
    ["initiativ", "Initiativ"], ["falt", "Fält"], ["forslag", "Förslag"], ["kalla", "Källa"],
    ["namn", "Namn"], ["epost", "E-post"], ["organisation", "Organisation"],
  ]},
  { key: "kandidater", label: "Initiativförslag", icon: "💡", fields: [
    ["namn", "Namn"], ["organisation", "Organisation"], ["beskrivning", "Beskrivning"],
    ["varfor", "Varför"], ["kalla", "Källa"], ["foreslagenAv", "Föreslagen av"], ["epost", "E-post"],
  ]},
  { key: "granskare", label: "Kvalitetssäkrare", icon: "🔍", fields: [
    ["namn", "Namn"], ["epost", "E-post"], ["organisation", "Organisation"],
    ["roll", "Roll"], ["omraden", "Områden"], ["meddelande", "Meddelande"],
  ]},
];
const INBOX_STATUSES = ["ny", "hanterad", "avvisad"];
const INBOX_STATUS_COLORS = { ny: "#B45309", hanterad: "#166534", avvisad: "#6B7280" };

function InboxView() {
  const [pass, setPass] = useState(() => localStorage.getItem("kartan_admin_pass") || "");
  const [input, setInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("alla");

  const call = async (body, p) => {
    const res = await fetch("/api/inkorg", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-kartan-pass": p },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || "HTTP " + res.status);
    return json;
  };

  const load = async (p) => {
    setLoading(true);
    setError("");
    try {
      setData(await call({ action: "list" }, p));
      setAuthed(true);
      localStorage.setItem("kartan_admin_pass", p);
    } catch (e) {
      setError(e.message);
      setAuthed(false);
      localStorage.removeItem("kartan_admin_pass");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pass) load(pass);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setStatus = async (typ, id, status) => {
    setData((prev) => ({
      ...prev,
      [typ]: prev[typ].map((r) => (r.id === id ? { ...r, status } : r)),
    }));
    try {
      await call({ action: "setStatus", typ, id, status }, pass);
    } catch (e) {
      setError("Kunde inte spara status: " + e.message);
    }
  };

  if (!authed) {
    return (
      <div style={{ maxWidth: 420, margin: "60px auto", background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>📥 Inkorg</h2>
        <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>
          Inskick från publika Hälsodatakartan. Ange administratörslösenordet
          (env <code>KARTAN_ADMIN_PASSWORD</code> i Vercel).
        </p>
        <form onSubmit={(e) => { e.preventDefault(); setPass(input); load(input); }}>
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Lösenord"
            style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, fontSize: 14, marginBottom: 10 }}
          />
          <button type="submit" disabled={loading || !input} style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#1A56DB", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
            {loading ? "Kontrollerar …" : "Öppna inkorgen"}
          </button>
        </form>
        {error && <p style={{ color: "#B91C1C", fontSize: 13, marginTop: 10 }}>{error}</p>}
      </div>
    );
  }

  const totalNy = data
    ? INBOX_SECTIONS.reduce((acc, s) => acc + (data[s.key] || []).filter((r) => r.status === "ny").length, 0)
    : 0;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <h2 style={{ fontSize: 20 }}>📥 Inkorg</h2>
        <span style={{ fontSize: 12, color: "#6B7280" }}>
          {totalNy} nya inskick från publika Hälsodatakartan
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {["alla", ...INBOX_STATUSES].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 600, cursor: "pointer", border: statusFilter === s ? "1px solid #1A56DB" : "1px solid #E5E7EB", background: statusFilter === s ? "#E8F0FE" : "#fff", color: statusFilter === s ? "#1A56DB" : "#6B7280" }}>
              {s === "alla" ? "Alla" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <button onClick={() => load(pass)} disabled={loading} style={{ padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid #E5E7EB", background: "#fff", color: "#6B7280" }}>
            {loading ? "Hämtar …" : "↻ Uppdatera"}
          </button>
        </div>
      </div>
      {error && <p style={{ color: "#B91C1C", fontSize: 13, marginBottom: 10 }}>{error}</p>}
      {INBOX_SECTIONS.map((sec) => {
        const rows = (data?.[sec.key] || []).filter((r) => statusFilter === "alla" || r.status === statusFilter);
        return (
          <div key={sec.key} style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 15, marginBottom: 8 }}>
              {sec.icon} {sec.label}{" "}
              <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 400 }}>
                ({(data?.[sec.key] || []).filter((r) => r.status === "ny").length} nya · {(data?.[sec.key] || []).length} totalt)
              </span>
            </h3>
            {rows.length === 0 ? (
              <p style={{ fontSize: 13, color: "#9CA3AF", padding: "8px 0" }}>Inget att visa.</p>
            ) : (
              rows.map((r) => (
                <div key={r.id} style={{ background: "#fff", border: "1px solid #E5E7EB", borderLeft: `4px solid ${INBOX_STATUS_COLORS[r.status] || "#E5E7EB"}`, borderRadius: 8, padding: "12px 16px", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: "#6B7280" }}>
                      {String(r.created_at).slice(0, 16).replace("T", " ")}
                    </span>
                    <select value={r.status} onChange={(e) => setStatus(sec.key, r.id, e.target.value)} style={{ fontSize: 11, fontWeight: 600, padding: "2px 6px", borderRadius: 6, border: "1px solid #D1D5DB", color: INBOX_STATUS_COLORS[r.status] }}>
                      {INBOX_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {r.github_issue && (
                      <a href={`https://github.com/pederhofmanbang/aktivitetskartan/issues/${r.github_issue}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#1A56DB" }}>
                        Issue #{r.github_issue}
                      </a>
                    )}
                    {sec.key === "andringar" && r.nr && (
                      <span style={{ fontSize: 11, color: "#6B7280" }}>Nr {r.nr}</span>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "4px 18px" }}>
                    {sec.fields.filter(([k]) => r[k]).map(([k, label]) => (
                      <div key={k} style={{ fontSize: 13 }}>
                        <span style={{ fontWeight: 600, color: "#374151" }}>{label}: </span>
                        <span style={{ whiteSpace: "pre-wrap" }}>{String(r[k])}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────── MAIN DASHBOARD ─────────── */
export default function Dashboard() {
  const [filters, setFilters] = useState({ del: [], sub: [], fk: [], maturity: [], jurisdictions: [], arbetaVidere: false, qaApproved: false, tags: {} });
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [detailItem, setDetailItem] = useState(null);
  const [showCompare, setShowCompare] = useState(false);
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [sortBy, setSortBy] = useState("default");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [overridesCache, setOverridesCache] = useState({});
  const [analysisObjects, setAnalysisObjects] = useState([]);
  useEffect(() => {
    // Load all overrides from Supabase in one query
    getAllOverrides().then(cache => setOverridesCache(cache)).catch(() => {});
    // Subscribe to realtime changes so all users see updates instantly
    const sub = subscribeToTable('overrides', (payload) => {
      if (payload.eventType === 'DELETE') {
        setOverridesCache(prev => { const next = { ...prev }; delete next[payload.old.nr]; return next; });
      } else {
        const row = payload.new;
        setOverridesCache(prev => ({ ...prev, [row.nr]: row.data }));
      }
    });
    return () => sub.unsubscribe();
  }, []);
  useEffect(() => {
    getAnalysisObjects().then(list => setAnalysisObjects(Array.isArray(list) ? list : [])).catch(() => {});
    const sub = subscribeToTable('analysis_objects', (payload) => {
      const row = payload.new;
      if (row && Array.isArray(row.data)) setAnalysisObjects(row.data);
    });
    return () => sub.unsubscribe();
  }, []);
  const printSelected = useCallback(async () => {
    const items = DATA.filter(i => selected.has(i.nr));
    if (items.length === 0) return;
    // Fetch deepdive + suggestion data for all selected items
    const ddMap = {};
    const sugMap = {};
    for (const item of items) {
      const dd = await storageGet("deepdive:" + item.nr);
      ddMap[item.nr] = dd || DEEPDIVE_DEFAULTS[item.nr] || null;
      const sug = await storageGet("suggestion:" + item.nr);
      sugMap[item.nr] = sug || null;
    }
    const DN = { A: "Del A", B: "Del B", C: "Del C", D: "Del D" };
    const esc = (s) => s ? String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;") : "";
    const scoreBadge = (arr) => (arr||[]).map(a =>
      "<span style='display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;margin:1px 2px;" +
      (a.score===3?"background:#D1FAE5;color:#065F46":a.score===2?"background:#FEF3C7;color:#92400E":"background:#F3F4F6;color:#6B7280") +
      "'>"+esc(a.name)+": "+a.score+" ("+esc(a.comment)+")</span>"
    ).join("");
    const nyttaHtml = (arr) => (arr||[]).map(n =>
      "<div style='margin-bottom:2px'><span style='display:inline-block;width:70px;font-weight:600;font-size:9px;color:#4285F4;text-transform:uppercase'>"+esc(n.level)+"</span> <span style='font-size:10.5px'>"+esc(n.text)+"</span></div>"
    ).join("");
    const tagHtml = (arr) => (arr||[]).map(t =>
      "<span style='display:inline-block;padding:1px 6px;border-radius:8px;font-size:9px;margin:1px;background:#F3F4F6;color:#374151'>"+esc(t.category)+": "+esc(t.values)+"</span>"
    ).join("");
    const ddFieldLabels = {
      formaga: "Datarelaterad f\u00f6rm\u00e5ga",
      doman: "Datadom\u00e4n / verksamhetsdata",
      frekvens: "Realtid/frekvens",
      datatyp: "Datatyp/format",
      datamangd: "Datam\u00e4ngd/omfattning",
      kallsystem: "K\u00e4llsystem",
      iot: "IoT/sensordata",
      standarder: "Standarder och modeller",
      kvalitet: "Dataf\u00f6rberedelser och kvalitet"
    };
    const deepdiveHtml = (dd) => {
      if (!dd) return "";
      var rows = "";
      // Förmåga (checks + text)
      var checks = (dd.formaga_checks || []).map(c => "<span style='display:inline-block;padding:2px 8px;border-radius:12px;font-size:9.5px;margin:1px;background:#E8F0FE;color:#1A56DB;font-weight:500'>&#10003; "+esc(c)+"</span>").join("");
      var fText = dd.formaga_text ? "<div style='font-size:10.5px;margin-top:3px'>"+esc(dd.formaga_text)+"</div>" : "";
      if (checks || fText) rows += "<div style='margin-bottom:6px'><div style='font-weight:600;font-size:10px;color:#374151;margin-bottom:2px'>Datarelaterad f\u00f6rm\u00e5ga</div>"+checks+fText+"</div>";
      // Remaining 8 fields
      var keys = ["doman","frekvens","datatyp","datamangd","kallsystem","iot","standarder","kvalitet"];
      keys.forEach(function(k) {
        var val = dd[k];
        if (val && val.trim()) {
          rows += "<div style='margin-bottom:4px'><span style='font-weight:600;font-size:10px;color:#374151'>"+ddFieldLabels[k]+":</span> <span style='font-size:10.5px'>"+esc(val)+"</span></div>";
        }
      });
      if (!rows) return "";
      return "<div style='font-weight:700;font-size:11px;color:#8B5CF6;margin-top:10px;margin-bottom:4px;border-bottom:1px solid #E5E7EB;padding-bottom:2px'>Dataf\u00f6rdjupning</div>" + rows;
    };
    const cards = items.map(item => {
      const aiT = (item.ai||[]).reduce((s,a) => s+a.score, 0);
      const kT = (item.kchd||[]).reduce((s,a) => s+a.score, 0);
      const dd = ddMap[item.nr];
      const sug = sugMap[item.nr];
      return "<div style='page-break-inside:avoid;border:1px solid #ccc;border-radius:8px;padding:16px 18px;margin-bottom:14px'>" +
        "<div style='display:flex;align-items:center;gap:8px;margin-bottom:8px;border-bottom:2px solid #1A56DB;padding-bottom:6px'>" +
        "<span style='font-weight:800;font-size:15px;color:#1A56DB'>#"+item.nr+"</span>" +
        "<span style='font-weight:700;font-size:13px;color:#1B3A5C'>"+esc(item.n)+"</span>" +
        "<span style='display:inline-block;padding:2px 8px;border-radius:10px;font-size:9px;font-weight:600;background:#E8F0FE;color:#1A56DB'>"+(DN[item.del]||item.del)+"</span></div>" +
        "<div style='font-size:11px;line-height:1.6;color:#374151'>" +
        "<div><b>Ansvarig:</b> "+esc(item.ans)+"</div>" +
        "<div><b>Typ:</b> "+esc(item.typ)+"</div>" +
        "<div><b>Finansiering:</b> "+esc(item.fk)+" &mdash; "+esc(item.fin)+"</div>" +
        "<div><b>Mognadsgrad:</b> "+esc(item.st)+" | <b>Tidplan:</b> "+esc(item.tid)+"</div>" +
        "<div><b>Fokus:</b> "+esc(item.fok)+"</div>" +
        "<div><b>M&aring;lgrupp:</b> "+esc(item.mg)+"</div>" +
        "</div>" +
        "<div style='margin-top:8px;font-size:11px;line-height:1.5;color:#374151'><b>Nyckelkarakt&auml;ristik:</b> "+esc(item.nk)+"</div>" +
        (item.ehds ? "<div style='margin-top:4px;font-size:11px'><b>EHDS-relevans:</b> "+esc(item.ehds)+"</div>" : "") +
        (item.wg_beskr ? "<div style='margin-top:8px;padding:8px 10px;background:#F0F7FF;border-radius:6px;border:1px solid #BFDBFE'><div style=\'font-size:10px;font-weight:700;color:#1A56DB;margin-bottom:3px;text-transform:uppercase\'>Arbetsgruppens beskrivning</div><div style=\'font-size:11px;color:#374151;line-height:1.5\'>"+esc(item.wg_beskr)+"</div></div>" : "") +
        (item.wg_tek ? "<div style='margin-top:4px;padding:8px 10px;background:#F5F3FF;border-radius:6px;border:1px solid #DDD6FE'><div style=\'font-size:10px;font-weight:700;color:#6D28D9;margin-bottom:3px;text-transform:uppercase\'>Teknologi och infrastruktur (arbetsgruppen)</div><div style=\'font-size:11px;color:#374151;line-height:1.5\'>"+esc(item.wg_tek)+"</div></div>" : "") +
        (item.korr ? "<div style='margin-top:4px;font-size:11px;color:#92400E'><b>Korrigering:</b> "+esc(item.korr)+"</div>" : "") +
        "<div style='font-weight:700;font-size:11px;color:#1A56DB;margin-top:10px;margin-bottom:4px;border-bottom:1px solid #E5E7EB;padding-bottom:2px'>Nytta</div>" +
        nyttaHtml(item.nytta) +
        "<div style='font-weight:700;font-size:11px;color:#1A56DB;margin-top:8px;margin-bottom:4px;border-bottom:1px solid #E5E7EB;padding-bottom:2px'>AI-relevans ("+aiT+"/18)</div>" +
        "<div style='display:flex;flex-wrap:wrap;gap:2px'>"+scoreBadge(item.ai)+"</div>" +
        "<div style='font-weight:700;font-size:11px;color:#1A56DB;margin-top:8px;margin-bottom:4px;border-bottom:1px solid #E5E7EB;padding-bottom:2px'>KCHD-relevans ("+kT+"/15)</div>" +
        "<div style='display:flex;flex-wrap:wrap;gap:2px'>"+scoreBadge(item.kchd)+"</div>" +
        deepdiveHtml(dd) +
        "<div style='margin-top:8px;font-size:10.5px;line-height:1.5;color:#374151'>" +
        (item.ds && item.ds !== "Se nyckelkaraktäristik" ? "<div><b>Datastandarder:</b> "+esc(item.ds)+"</div>" : "") +
        (item.tek && item.tek !== "Se nyckelkaraktäristik" ? "<div><b>Teknisk milj&ouml;:</b> "+esc(item.tek)+"</div>" : "") +
        (item.akt && item.akt !== item.ans ? "<div><b>Akt&ouml;rer:</b> "+esc(item.akt)+"</div>" : "") +
        "</div>" +
        "<div style='margin-top:6px;display:flex;flex-wrap:wrap;gap:2px'>"+tagHtml(item.tags)+"</div>" +
        (item.dep ? "<div style='margin-top:6px;font-size:10.5px'><b>Beroenden:</b> "+esc(item.dep)+"</div>" : "") +
        (sug ? "<div style='margin-top:8px;padding:8px;background:#FFFBEB;border:1px solid #FCD34D;border-radius:6px;font-size:10.5px'><b style='color:#B45309'>F&ouml;reslagna &auml;ndringar:</b> "+esc(sug)+"</div>" : "") +
        "</div>";
    }).join("");
    const fullHtml = "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Omv\u00e4rldsanalys - " + items.length + " initiativ</title>" +
      "<style>@page{margin:16mm 14mm;size:A4}body{font-family:Segoe UI,system-ui,-apple-system,sans-serif;color:#1B3A5C;font-size:11px;line-height:1.5;max-width:780px;margin:0 auto;padding:30px}" +
      "@media print{.no-print{display:none!important}}</style></head><body>" +
      "<div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:3px solid #1A56DB;padding-bottom:12px'>" +
      "<div><h1 style='font-size:20px;font-weight:800;color:#1B3A5C;margin:0 0 4px'>Omv\u00e4rldsanalys &mdash; " + items.length + " valda initiativ</h1>" +
      "<p style='font-size:12px;color:#6B7280;margin:0'>Utskriven " + new Date().toLocaleDateString("sv-SE") + " | KCHD / SKR</p></div>" +
      "<button class='no-print' onclick='window.print()' style='padding:8px 20px;border-radius:6px;font-size:13px;cursor:pointer;border:1px solid #4285F4;background:#4285F4;color:#fff;font-weight:600'>Skriv ut / Spara PDF</button></div>" +
      cards + "</body></html>";
    var blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "initiativ_utskrift_" + new Date().toISOString().slice(0,10) + ".html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
  }, [selected]);
  useEffect(() => {
    const handler = (e) => setDeepDiveItem(e.detail);
    document.addEventListener("openDeepDive", handler);
    return () => document.removeEventListener("openDeepDive", handler);
  }, []);
  const [viewMode, setViewMode] = useState("cards");
  const [ursprungFilter, setUrsprungFilter] = useState({ ursprunglig: false, ovriga: false });
  const [quickFilter, setQuickFilter] = useState({ kvalreg: false });
  const [deepdiveItem, setDeepDiveItem] = useState(null);
  const allSubs = useMemo(() => { const map = {}; DATA.forEach(i => { map[i.sub] = (map[i.sub] || 0) + 1; }); return Object.entries(map).sort((a, b) => { const order = ["A1","A2","A3","B","C1","C2","C3","D"]; return order.indexOf(a[0]) - order.indexOf(b[0]); }); }, []);
  const allTagsByCategory = useMemo(() => { const result = {}; TAG_CATS.forEach(cat => { const map = {}; DATA.forEach(i => getTagValues(i, cat).forEach(v => { map[v] = (map[v] || 0) + 1; })); result[cat] = Object.entries(map).sort((a, b) => b[1] - a[1]); }); return result; }, []);
  const filtered = useMemo(() => {
    let items = DATA;
    if (search.trim()) { const q = search.toLowerCase(); items = items.filter(i => i.n.toLowerCase().includes(q) || (i.nk && i.nk.toLowerCase().includes(q)) || (i.ans && i.ans.toLowerCase().includes(q)) || String(i.nr).includes(q)); }
    if (filters.del.length) items = items.filter(i => filters.del.includes(i.del));
    if (filters.sub.length) items = items.filter(i => filters.sub.includes(i.sub));
    if (filters.fk.length) items = items.filter(i => filters.fk.includes(i.fk));
    Object.entries(filters.tags).forEach(([cat, vals]) => { if (vals.length) { items = items.filter(i => { const tv = getTagValues(i, cat); return vals.some(v => tv.includes(v)); }); } });
    if (filters.maturity.length) items = items.filter(i => { const ov = overridesCache[i.nr]; const mat = (ov && ov.maturity) ? ov.maturity : (STATUS_TO_MATURITY[i.st] || null); return mat && filters.maturity.includes(mat); });
    if (filters.jurisdictions.length) items = items.filter(i => { const ov = overridesCache[i.nr]; const juris = (ov && ov.jurisdictions) || []; return filters.jurisdictions.some(j => juris.includes(j)); });
    if (filters.arbetaVidere) items = items.filter(i => { const ov = overridesCache[i.nr]; return ov && ov.arbetaVidere; });
    if (filters.qaApproved) items = items.filter(i => { const ov = overridesCache[i.nr]; return ov && ov.qa && ov.qa.approved && ov.qa.approved.done; });
    if (ursprungFilter.ursprunglig !== ursprungFilter.ovriga) {
      if (ursprungFilter.ursprunglig) items = items.filter(i => { const tv = getTagValues(i, "Användning"); return tv.includes("ursprunglig"); });
      if (ursprungFilter.ovriga) items = items.filter(i => { const tv = getTagValues(i, "Användning"); return !tv.includes("ursprunglig"); });
    }
    if (quickFilter.kvalreg) items = items.filter(i => getTagValues(i, "Verksamhetstyp").includes("kvalitetsregister"));
    if (showOnlySelected) items = items.filter(i => selected.has(i.nr));
    return items;
  }, [search, filters, showOnlySelected, selected, ursprungFilter, quickFilter, overridesCache]);
  const sorted = useMemo(() => {
    let items = [...filtered];
    if (sortBy === "default") return items.sort((a, b) => a.nr - b.nr);
    if (sortBy === "name") return items.sort((a, b) => a.n.localeCompare(b.n, "sv"));
    if (sortBy === "ai_desc") return items.sort((a, b) => (b.ai.reduce((s, x) => s + x.score, 0) / (b.ai.length || 1)) - (a.ai.reduce((s, x) => s + x.score, 0) / (a.ai.length || 1)));
    if (sortBy === "kchd_desc") return items.sort((a, b) => (b.kchd.reduce((s, x) => s + x.score, 0) / (b.kchd.length || 1)) - (a.kchd.reduce((s, x) => s + x.score, 0) / (a.kchd.length || 1)));
    if (sortBy === "msek_desc") return items.sort((a, b) => parseMSEK(b.fin) - parseMSEK(a.fin));
    return items;
  }, [filtered, sortBy]);
  const stats = useMemo(() => { const msek = filtered.reduce((s, i) => s + parseMSEK(i.fin), 0); return { count: filtered.length, msek }; }, [filtered]);
  const activeFilterCount = useMemo(() => { let c = filters.del.length + filters.sub.length + filters.fk.length + filters.maturity.length + filters.jurisdictions.length + (filters.arbetaVidere ? 1 : 0) + (filters.qaApproved ? 1 : 0); Object.values(filters.tags).forEach(v => { c += v.length; }); if (search.trim()) c++; if (showOnlySelected) c++; if (ursprungFilter.ursprunglig !== ursprungFilter.ovriga) c++; if (quickFilter.kvalreg) c++; return c; }, [filters, search, showOnlySelected, ursprungFilter, quickFilter]);
  const toggleFilter = useCallback((key, value) => { setFilters(prev => { const arr = prev[key]; const next = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]; return { ...prev, [key]: next }; }); }, []);
  const toggleTagFilter = useCallback((cat, value) => { setFilters(prev => { const current = prev.tags[cat] || []; const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value]; return { ...prev, tags: { ...prev.tags, [cat]: next } }; }); }, []);
  const clearFilters = useCallback(() => { setFilters({ del: [], sub: [], fk: [], maturity: [], jurisdictions: [], arbetaVidere: false, qaApproved: false, tags: {} }); setSearch(""); setShowOnlySelected(false); setUrsprungFilter({ ursprunglig: false, ovriga: false }); setQuickFilter({ kvalreg: false }); }, []);
  const toggleSelect = useCallback((nr) => { setSelected(prev => { const next = new Set(prev); if (next.has(nr)) next.delete(nr); else next.add(nr); return next; }); }, []);
  const activeChips = useMemo(() => {
    const chips = [];
    filters.del.forEach(v => chips.push({ label: `Del ${v}`, clear: () => toggleFilter("del", v) }));
    filters.sub.forEach(v => chips.push({ label: SUB_LABELS[v] || v, clear: () => toggleFilter("sub", v) }));
    filters.fk.forEach(v => chips.push({ label: FK_LABELS[v] || v, clear: () => toggleFilter("fk", v) }));
    Object.entries(filters.tags).forEach(([cat, vals]) => { vals.forEach(v => chips.push({ label: `${cat}: ${v}`, clear: () => toggleTagFilter(cat, v) })); });
    filters.maturity.forEach(v => { const ml = MATURITY_LEVELS.find(m => m.value === v); chips.push({ label: `Mognad: ${ml ? ml.label : v}`, clear: () => toggleFilter("maturity", v) }); });
    filters.jurisdictions.forEach(v => chips.push({ label: v, clear: () => toggleFilter("jurisdictions", v) }));
    if (filters.arbetaVidere) chips.push({ label: "Arbeta vidare", clear: () => setFilters(prev => ({ ...prev, arbetaVidere: false })) });
    if (filters.qaApproved) chips.push({ label: "QA-godkänd", clear: () => setFilters(prev => ({ ...prev, qaApproved: false })) });
    if (ursprungFilter.ursprunglig && !ursprungFilter.ovriga) chips.push({ label: "Ursprungliga 28", clear: () => setUrsprungFilter({ ursprunglig: false, ovriga: false }) });
    if (ursprungFilter.ovriga && !ursprungFilter.ursprunglig) chips.push({ label: "Övriga (ej ursprungliga)", clear: () => setUrsprungFilter({ ursprunglig: false, ovriga: false }) });
    if (quickFilter.kvalreg) chips.push({ label: "📋 Kvalitetsregister", clear: () => setQuickFilter({ kvalreg: false }) });
    if (showOnlySelected) chips.push({ label: `Visar ${selected.size} valda`, clear: () => setShowOnlySelected(false) });
    return chips;
  }, [filters, showOnlySelected, selected.size, toggleFilter, toggleTagFilter, ursprungFilter, quickFilter]);
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,800;1,9..40,400&family=Source+Sans+3:wght@300;400;500;600&display=swap');
        html, body, #root { height: 100%; margin: 0; padding: 0; overflow: hidden; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
      `}</style>
      <div style={{ fontFamily: "'Source Sans 3', 'DM Sans', system-ui, sans-serif", background: "#F4F5F7", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* TOP HEADER */}
        <div style={{ background: "linear-gradient(135deg, #0F2942, #1B3A5C)", color: "#fff", padding: "16px 24px", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, fontFamily: "'DM Sans', sans-serif", letterSpacing: -0.3 }}>Sveriges hälsodatainfrastruktur</h1>
              <p style={{ fontSize: 12, opacity: 0.7, margin: "2px 0 0" }}>{DATA.length} initiativ — Interaktiv kartläggning</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: "8px 14px", width: 280, border: "1px solid rgba(255,255,255,0.15)" }}>
              <Search size={15} style={{ opacity: 0.6, flexShrink: 0 }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Sök initiativ…" style={{ background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 13, width: "100%" }} />
              {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", opacity: 0.6, display: "flex", padding: 0 }}><X size={14} /></button>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 20 }}>
              <div><div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, opacity: 0.6, fontWeight: 600 }}>Initiativ</div><div style={{ fontSize: 26, fontWeight: 800, fontFamily: "'DM Sans', sans-serif" }}>{stats.count}<span style={{ fontSize: 14, opacity: 0.5, fontWeight: 400 }}> / {DATA.length}</span></div></div>
              <div style={{ width: 1, background: "rgba(255,255,255,0.15)" }} />
              <div><div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, opacity: 0.6, fontWeight: 600 }}>Finansiering</div><div style={{ fontSize: 26, fontWeight: 800, fontFamily: "'DM Sans', sans-serif" }}>{stats.msek > 0 ? (stats.msek / 1000).toFixed(1) : "0"}<span style={{ fontSize: 14, opacity: 0.5, fontWeight: 400 }}> mdkr SEK</span></div></div>
              <div style={{ width: 1, background: "rgba(255,255,255,0.15)" }} />
              <div><div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, opacity: 0.6, fontWeight: 600 }}>Valda</div><div style={{ fontSize: 26, fontWeight: 800, fontFamily: "'DM Sans', sans-serif" }}>{selected.size}</div></div>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => { const n = exportAllData(); alert(`Exporterade ${n} dataposter.`); }} style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#fff", padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, opacity: 0.8 }} title="Exportera alla lokala data till fil"><Download size={13} />Export</button>
              <button onClick={async () => { const n = await importAllData(); if (n > 0) { alert(`Importerade ${n} dataposter. Sidan laddas om.`); window.location.reload(); } }} style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#fff", padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, opacity: 0.8 }} title="Importera data från backup-fil"><Upload size={13} />Import</button>
            </div>
            {selected.size > 0 && <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowOnlySelected(!showOnlySelected)} style={{ background: showOnlySelected ? "#E8913A" : "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, color: "#fff", padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><Filter size={13} />{showOnlySelected ? "Visa alla" : "Visa valda"}</button>
              <button onClick={printSelected} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, color: "#fff", padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><Printer size={13} />Skriv ut ({selected.size})</button>
              {selected.size >= 2 && selected.size <= 5 && <button onClick={() => setShowCompare(true)} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, color: "#fff", padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><GitCompare size={13} />Jämför ({selected.size})</button>}
              <button onClick={() => setSelected(new Set())} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", padding: "7px 10px", fontSize: 12, cursor: "pointer", opacity: 0.7, display: "flex" }}><XCircle size={14} /></button>
            </div>}
          </div>
          {activeChips.length > 0 && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10, alignItems: "center" }}>
            <span style={{ fontSize: 11, opacity: 0.5, marginRight: 2 }}>Filter:</span>
            {activeChips.map((chip, i) => <span key={i} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.15)", color: "#fff", display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}>{chip.label}<button onClick={chip.clear} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 0, display: "flex", opacity: 0.7 }}><X size={11} /></button></span>)}
            <button onClick={clearFilters} style={{ fontSize: 11, color: "#fff", opacity: 0.6, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Rensa alla</button>
          </div>}
        </div>
        {/* MAIN LAYOUT */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* SIDEBAR */}
          <div style={{ width: sidebarOpen ? 260 : 44, transition: "width 0.25s ease", background: "#fff", borderRight: "1px solid #E5E7EB", overflow: "hidden", flexShrink: 0, display: "flex", flexDirection: "column" }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ padding: "12px 14px", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "#1B3A5C", fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", borderBottom: "1px solid #F3F4F6" }}><Filter size={15} />{sidebarOpen && <span>Filter {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}</span>}</button>
            {sidebarOpen && <div style={{ overflowY: "auto", flex: 1, padding: "8px 8px" }}>
              <div style={{ marginBottom: 8, padding: "8px 12px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1B3A5C", marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>Ursprung</div>
                <FilterCheck label="Ursprungliga 28" checked={ursprungFilter.ursprunglig} onChange={() => setUrsprungFilter(prev => ({ ...prev, ursprunglig: !prev.ursprunglig }))} count={DATA.filter(i => getTagValues(i, "Användning").includes("ursprunglig")).length} color="#0F2942" />
                <FilterCheck label="Övriga" checked={ursprungFilter.ovriga} onChange={() => setUrsprungFilter(prev => ({ ...prev, ovriga: !prev.ovriga }))} count={DATA.filter(i => !getTagValues(i, "Användning").includes("ursprunglig")).length} color="#6B7280" />
              </div>
              <div style={{ height: 1, background: "#E5E7EB", margin: "4px 12px 8px" }} />
              <div style={{ marginBottom: 8, padding: "8px 12px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1B3A5C", marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>Snabbfilter</div>
                <FilterCheck label="📋 Kvalitetsregister" checked={quickFilter.kvalreg} onChange={() => setQuickFilter(prev => ({ ...prev, kvalreg: !prev.kvalreg }))} count={DATA.filter(i => getTagValues(i, "Verksamhetstyp").includes("kvalitetsregister")).length} color="#0E7490" />
              </div>
              <div style={{ height: 1, background: "#E5E7EB", margin: "4px 12px 8px" }} />
              <FilterSection title="Finansieringskälla" icon={<Banknote size={13} />}>
                {["Regionerna", "Stat, inkl myndigheter och/eller privat", "EU"].map(fk => <FilterCheck key={fk} label={FK_LABELS[fk] || fk} checked={filters.fk.includes(fk)} onChange={() => toggleFilter("fk", fk)} count={DATA.filter(i => i.fk === fk).length} />)}
              </FilterSection>
              <FilterSection title="Mognadsgrad">
                {MATURITY_LEVELS.map(m => {
                  const count = DATA.filter(i => { const ov = overridesCache[i.nr]; const mat = (ov && ov.maturity) ? ov.maturity : (STATUS_TO_MATURITY[i.st] || null); return mat === m.value; }).length;
                  return <FilterCheck key={m.value} label={m.label} checked={filters.maturity.includes(m.value)} onChange={() => toggleFilter("maturity", m.value)} count={count} color={m.color} />;
                })}
              </FilterSection>
              <FilterSection title="Jurisdiktioner">
                {JURISDICTIONS.map(j => {
                  const count = DATA.filter(i => { const ov = overridesCache[i.nr]; return ov && ov.jurisdictions && ov.jurisdictions.includes(j); }).length;
                  return count > 0 ? <FilterCheck key={j} label={j.split(" — ")[0].split(" (")[0]} checked={filters.jurisdictions.includes(j)} onChange={() => toggleFilter("jurisdictions", j)} count={count} /> : null;
                })}
              </FilterSection>
              <FilterSection title="Arbetsstatus">
                <FilterCheck label="⭐ Arbeta vidare" checked={filters.arbetaVidere} onChange={() => setFilters(prev => ({ ...prev, arbetaVidere: !prev.arbetaVidere }))} count={Object.values(overridesCache).filter(ov => ov.arbetaVidere).length} color="#F59E0B" />
                <FilterCheck label="✅ QA-godkänd" checked={filters.qaApproved} onChange={() => setFilters(prev => ({ ...prev, qaApproved: !prev.qaApproved }))} count={Object.values(overridesCache).filter(ov => ov.qa && ov.qa.approved && ov.qa.approved.done).length} color="#22C55E" />
              </FilterSection>
              {TAG_CATS.map(cat => <FilterSection key={cat} title={cat} icon={<Tag size={13} />}>
                {(allTagsByCategory[cat] || []).map(([val, count]) => <FilterCheck key={val} label={val} checked={(filters.tags[cat] || []).includes(val)} onChange={() => toggleTagFilter(cat, val)} count={count} />)}
              </FilterSection>)}
            </div>}
          </div>
          {/* MAIN CONTENT */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", background: "#fff", borderBottom: "1px solid #E5E7EB" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F9FAFB", borderRadius: 8, padding: "4px 10px", border: "1px solid #E5E7EB", minWidth: 200 }}>
                <Search size={14} color="#9CA3AF" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Sök initiativ..." style={{ border: "none", background: "transparent", fontSize: 12, outline: "none", width: "100%", color: "#374151" }} />
                {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><X size={12} color="#9CA3AF" /></button>}
              </div>
              <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>{sorted.length} initiativ visas</span>
              <div style={{ display: "flex", gap: 4, marginLeft: 12 }}>
                <button onClick={() => setViewMode("cards")} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: viewMode === "cards" ? "1px solid #4285F4" : "1px solid #E5E7EB", background: viewMode === "cards" ? "#E8F0FE" : "#fff", color: viewMode === "cards" ? "#1A56DB" : "#6B7280" }}>Kort</button>
                <button onClick={() => setViewMode("matrix")} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: viewMode === "matrix" ? "1px solid #4285F4" : "1px solid #E5E7EB", background: viewMode === "matrix" ? "#E8F0FE" : "#fff", color: viewMode === "matrix" ? "#1A56DB" : "#6B7280" }}>Matris</button>
                <button onClick={() => setViewMode("network")} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: viewMode === "network" ? "1px solid #4285F4" : "1px solid #E5E7EB", background: viewMode === "network" ? "#E8F0FE" : "#fff", color: viewMode === "network" ? "#1A56DB" : "#6B7280" }}>Nätverk</button>
                <button onClick={() => setViewMode("map")} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: viewMode === "map" ? "1px solid #4285F4" : "1px solid #E5E7EB", background: viewMode === "map" ? "#E8F0FE" : "#fff", color: viewMode === "map" ? "#1A56DB" : "#6B7280" }}>Karta</button>
                <button onClick={() => setViewMode("prioritized")} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: viewMode === "prioritized" ? "1px solid #F59E0B" : "1px solid #E5E7EB", background: viewMode === "prioritized" ? "#FFFBEB" : "#fff", color: viewMode === "prioritized" ? "#B45309" : "#6B7280" }}>⭐ Prioriterade</button>
                <button onClick={() => setViewMode("prionetwork")} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: viewMode === "prionetwork" ? "1px solid #F59E0B" : "1px solid #E5E7EB", background: viewMode === "prionetwork" ? "#FFFBEB" : "#fff", color: viewMode === "prionetwork" ? "#B45309" : "#6B7280" }}>⭐ Prio-nätverk</button>
                <button onClick={() => setViewMode("continuity")} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: viewMode === "continuity" ? "1px solid #0E7490" : "1px solid #E5E7EB", background: viewMode === "continuity" ? "#ECFEFF" : "#fff", color: viewMode === "continuity" ? "#0E7490" : "#6B7280" }}>🛡️ Kontinuitet</button>
                <button onClick={() => setViewMode("candidates")} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: viewMode === "candidates" ? "1px solid #4285F4" : "1px solid #E5E7EB", background: viewMode === "candidates" ? "#E8F0FE" : "#fff", color: viewMode === "candidates" ? "#1A56DB" : "#6B7280" }}>Kandidater</button>
                <button onClick={() => setViewMode("inbox")} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: viewMode === "inbox" ? "1px solid #4285F4" : "1px solid #E5E7EB", background: viewMode === "inbox" ? "#E8F0FE" : "#fff", color: viewMode === "inbox" ? "#1A56DB" : "#6B7280" }}>📥 Inkorg</button>
                <button onClick={() => setViewMode("guide")} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: viewMode === "guide" ? "1px solid #4285F4" : "1px solid #E5E7EB", background: viewMode === "guide" ? "#E8F0FE" : "#fff", color: viewMode === "guide" ? "#1A56DB" : "#6B7280" }}>Lathund</button>
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <ArrowUpDown size={13} color="#9CA3AF" />
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ border: "1px solid #E5E7EB", borderRadius: 8, padding: "6px 10px", fontSize: 12, color: "#374151", background: "#fff", cursor: "pointer", outline: "none" }}>
                  <option value="default">Rapportordning (Nr)</option>
                  <option value="name">Namn A–Ö</option>
                  <option value="ai_desc">AI-relevans (högst först)</option>
                  <option value="kchd_desc">KCHD-relevans (högst först)</option>
                  <option value="msek_desc">Finansiering (störst först)</option>
                </select>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: (viewMode === "matrix" || viewMode === "network" || viewMode === "prionetwork" || viewMode === "map" || viewMode === "candidates" || viewMode === "guide" || viewMode === "prioritized" || viewMode === "continuity" || viewMode === "inbox") ? 0 : 20 }}>
              {viewMode === "guide" ? (
                <GuideView />
              ) : viewMode === "prioritized" ? (
                <PrioritizedView data={sorted} overridesCache={overridesCache} onClickItem={item => setDetailItem(item)} refreshOverrides={async () => { const cache = await getAllOverrides(); setOverridesCache(cache); }} />
              ) : viewMode === "prionetwork" ? (
                <PrioNetworkView data={sorted} overridesCache={overridesCache} onClickItem={item => setDetailItem(item)} />
              ) : viewMode === "continuity" ? (
                <ContinuityView allData={DATA} />
              ) : viewMode === "inbox" ? (
                <InboxView />
              ) : viewMode === "candidates" ? (
                <CandidatesView />
              ) : viewMode === "map" ? (
                <MapView data={sorted} onClickItem={item => setDetailItem(item)} />
              ) : viewMode === "network" ? (
                <NetworkView data={sorted} onClickItem={item => setDetailItem(item)} />
              ) : viewMode === "matrix" ? (
                <MatrixView data={sorted} onClickItem={item => setDetailItem(item)} />
              ) : sorted.length === 0 ? (
                <div style={{ textAlign: "center", padding: 60, color: "#9CA3AF" }}>
                  <Search size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                  <p style={{ fontSize: 15, fontWeight: 600 }}>Inga initiativ matchar filtren</p>
                  <p style={{ fontSize: 13 }}>Prova att ändra eller rensa filter</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                  {sorted.map(item => <InitCard key={item.nr} item={item} selected={selected.has(item.nr)} onSelect={() => toggleSelect(item.nr)} onClick={() => setDetailItem(item)} ov={overridesCache[item.nr]} />)}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* DEEPDIVE MODAL */}
        {deepdiveItem && <DataDeepDivePanel itemNr={deepdiveItem} onClose={() => setDeepDiveItem(null)} />}
        {/* MODALS */}
        {detailItem && <DetailModal item={detailItem} onClose={() => setDetailItem(null)} allItems={DATA}
          overridesCache={overridesCache}
          analysisObjects={analysisObjects}
          onCreateContinuityAnalysis={async (item) => {
            const o = newAnalysisObject();
            o.namn = item.n; o.typ = "Dataplattform"; o.linkedInitiatives = [item.nr];
            const next = [...analysisObjects, o];
            setAnalysisObjects(next);
            await saveAnalysisObjects(next);
            setDetailItem(null);
            setViewMode("continuity");
          }}
          refreshOverrides={async () => {
            try {
              const cache = {};
              for (const item of DATA) {
                try {
                  const ov = await getOverride(item.nr);
                  if (ov && (ov.arbetaVidere || (ov.qa && ov.qa.approved && ov.qa.approved.done) || ov.maturity || (ov.jurisdictions && ov.jurisdictions.length) || (ov.fields && Object.keys(ov.fields).length > 0))) {
                    cache[item.nr] = ov;
                  }
                } catch(e) {}
              }
              setOverridesCache(cache);
            } catch(e) {}
          }}
        />}
        {showCompare && selected.size >= 2 && <ComparePanel items={DATA.filter(i => selected.has(i.nr)).slice(0, 5)} onClose={() => setShowCompare(false)} />}
      </div>
    </>
  );
}