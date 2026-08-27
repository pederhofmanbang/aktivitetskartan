// Datamodell för Hälsodatakartan — kategorier, granskningsnivåer, mognadsgrad,
// facetter och merge-logik mot overrides-lagret. Grunddata importeras från
// interna appens delade modul (../src/data.js).
import { DATA } from "../../src/data.js";

export { DATA };

/* ─────────── Kategorier (femfärgspalett, validerad för CVD-separation) ─────────── */

export const KATEGORIER = [
  { id: "infra", label: "Digital infrastruktur", color: "#1A56DB", bg: "#E8F0FE" },
  { id: "kvalreg", label: "Kvalitetsregister", color: "#0891B2", bg: "#E0F7FA" },
  { id: "samverkan", label: "Samverkan & forskning", color: "#B45309", bg: "#FEF3E2" },
  { id: "super", label: "Superdatorcentra", color: "#6D28D9", bg: "#F3E8FE" },
  { id: "lagstiftning", label: "Lagstiftning & policy", color: "#B91C1C", bg: "#FEE2E2" },
];

export const KATEGORI_MAP = Object.fromEntries(KATEGORIER.map((k) => [k.id, k]));

export function kategoriOf(item) {
  const tags = item.tags || [];
  const isKvalreg = tags.some(
    (t) =>
      t.category === "Verksamhetstyp" &&
      String(t.values).toLowerCase().includes("kvalitetsregister")
  );
  if (isKvalreg) return "kvalreg";
  const t = item.typ || "";
  if (t.toLowerCase().includes("infrastruktur")) return "infra";
  if (t.includes("Samverkan") || t.toLowerCase().includes("forskning")) return "samverkan";
  if (t.includes("Superdator")) return "super";
  return "lagstiftning";
}

/* ─────────── Del / underkategori (rapportens indelning) ─────────── */

export const DEL_LABELS = {
  A: "Del A – Infrastruktur & datadelning",
  B: "Del B – TRE-miljöer",
  C: "Del C – Stödsystem & standarder",
  D: "Del D – Lagstiftning & strategi",
};

export const SUB_LABELS = {
  A1: "A1 – Regionala initiativ",
  A2: "A2 – Statliga initiativ",
  A3: "A3 – EU / internationella",
  B: "B – TRE-miljöer",
  C1: "C1 – Regionala stödsystem",
  C2: "C2 – Statliga stödsystem",
  C3: "C3 – EU / internationella stöd",
  D: "D – Lagstiftning, strategi & policy",
};

/* ─────────── Granskningsnivåer ─────────── */

export const GRANSKNING = {
  kurerad: {
    id: "kurerad",
    label: "Kurerad",
    kort: "Genomgången av människa och AI",
    desc: "Innehållet har gåtts igenom och kompletterats av en människa tillsammans med AI. Fel kan ändå förekomma — hittar du något, föreslå gärna en ändring.",
  },
  ai: {
    id: "ai",
    label: "AI-sammanställd",
    kort: "Framtagen av AI, ej genomgången av människa",
    desc: "Innehållet är sammanställt av AI från öppna källor och har ännu inte gåtts igenom av en människa. Uppgifterna kan innehålla fel — läs med det i åtanke.",
  },
};

export function granskningOf(override) {
  return override?.arbetaVidere === true ? "kurerad" : "ai";
}

/* ─────────── Mognadsgrad ─────────── */

export const MATURITY_LEVELS = [
  { value: 1, label: "Planerad", desc: "Beslut fattat men ej påbörjat" },
  { value: 2, label: "Under uppbyggnad", desc: "Utveckling/upphandling pågår" },
  { value: 3, label: "Pilot/test", desc: "Begränsad drift, testas" },
  { value: 4, label: "Operativ (begränsad)", desc: "I drift men ej full utrullning" },
  { value: 5, label: "Fullt implementerad", desc: "I drift nationellt/fullt utrullad" },
  { value: 6, label: "Avslutat", desc: "Projektet är avslutat" },
];

const STATUS_TO_MATURITY = {
  "Operativt": 5, "Under uppbyggnad": 2, "Under driftsättning": 3, "Under utredning": 1,
  "Pågående uppdrag": 4, "Pågående": 4, "Nystartat": 2, "Avslutat": 6, "Avslutat/övergång": 6,
  "Ikraftträdd — implementation pågår": 4, "Remitterad": 1, "Beslutad": 1, "Beslutad strategi": 1,
  "Gällande lagstiftning": 5, "Gällande EU-förordning": 5, "Avslutad utredning, remissbehandling": 1,
};

export function maturityOf(item, override) {
  if (override?.maturity) return override.maturity;
  const st = item.st || "";
  if (STATUS_TO_MATURITY[st]) return STATUS_TO_MATURITY[st];
  const s = st.toLowerCase();
  if (s.includes("operativt")) {
    return s.includes("utveckling") || s.includes("pågår") || s.includes("pågående")
      ? 4
      : 5;
  }
  if (s.includes("under anslutning")) return 3;
  if (s.includes("avslutat") && s.includes("pågående")) return 4;
  if (s.includes("avslutat")) return 6;
  return null;
}

export function maturityLabel(value) {
  return MATURITY_LEVELS.find((m) => m.value === value)?.label || "Okänd";
}

/* ─────────── EHDS-relevans ─────────── */

export function ehdsOf(item) {
  const s = (item.ehds || "").trim().toLowerCase();
  if (s.startsWith("hög") || s.startsWith("mycket hög")) return "Hög";
  if (s.startsWith("medel") || s.startsWith("måttlig")) return "Medel";
  if (s.startsWith("låg")) return "Låg";
  return s ? "Övrig" : null;
}

/* ─────────── Fältmerge mot overrides ─────────── */

export function fieldValue(item, field, override) {
  const v = override?.fields?.[field];
  if (v !== undefined && v !== "") return v;
  return item[field];
}

export function tagValues(item, category) {
  const t = (item.tags || []).find((x) => x.category === category);
  return t ? String(t.values).split(", ").filter(Boolean) : [];
}

/* ─────────── Prio-sektioner (läsvy av fördjupningsfälten) ─────────── */

export const PRIO_SECTIONS = [
  { title: "Syfte & behov", fields: [
    { key: "fok", label: "Hälsodatafokus" },
    { key: "typ", label: "Typ" },
    { key: "nk", label: "Nyckelkaraktäristik" },
    { key: "status", label: "Status" },
    { key: "behov", label: "Behov & gap" },
    { key: "behovsniva", label: "Behovsnivå" },
    { key: "overlap", label: "Överlapp med andra infrastrukturer" },
  ]},
  { title: "Nyttjande & effekt", fields: [
    { key: "mg", label: "Målgrupp" },
    { key: "anvtyp", label: "Användningstyp" },
    { key: "nyttjande", label: "Nyttjandegrad" },
    { key: "forutsattningar", label: "Förutsättningar för nyttjande" },
    { key: "outnyttjat", label: "Outnyttjad kapacitet" },
  ]},
  { title: "Organisation & ägarskap", fields: [
    { key: "ans", label: "Ansvarig" },
    { key: "akt", label: "Aktörer" },
    { key: "agarskap", label: "Ägandeskap & åtagande" },
    { key: "styrning", label: "Styrning & samverkan" },
  ]},
  { title: "Teknik & standarder", fields: [
    { key: "tek", label: "Teknik" },
    { key: "ds", label: "Datastandarder" },
  ]},
  { title: "Ekonomi & strategi", fields: [
    { key: "ekonomi", label: "Ekonomisk modell" },
    { key: "strategi", label: "Strategisk betydelse" },
  ]},
  { title: "Övrigt", fields: [{ key: "ovrigt", label: "Övriga kommentarer" }] },
];

// Fält som bara finns i override-lagret (visas när de är ifyllda).
export const PRIO_ONLY_FIELDS = new Set([
  "status", "behov", "behovsniva", "overlap", "anvtyp", "nyttjande",
  "forutsattningar", "outnyttjat", "agarskap", "styrning", "ekonomi", "strategi", "ovrigt",
]);

// Alla föreslåbara fält (för "Föreslå ändring"-formuläret).
export const SUGGESTABLE_FIELDS = [
  { key: "", label: "Allmänt / hela initiativet" },
  { key: "n", label: "Namn" },
  { key: "ans", label: "Ansvarig" },
  { key: "akt", label: "Aktörer" },
  { key: "st", label: "Status/mognadsgrad" },
  { key: "fin", label: "Finansiering" },
  { key: "tid", label: "Tidplan" },
  { key: "nk", label: "Beskrivning / nyckelkaraktäristik" },
  { key: "tek", label: "Teknik" },
  { key: "ds", label: "Datastandarder" },
  { key: "ehds", label: "EHDS-relevans" },
  { key: "mg", label: "Målgrupp" },
  { key: "dep", label: "Beroenden/kopplingar" },
  { key: "tags", label: "Taggar/kategorisering" },
];

export const CONNECTION_CATS = ["Samskapa", "Överlapp", "Stötta", "Docka in i", "Lära av", "Hålla koll på"];
export const CAT_COLORS = {
  "Samskapa": "#1A56DB", "Överlapp": "#B45309", "Stötta": "#166534",
  "Docka in i": "#7E22CE", "Lära av": "#0F766E", "Hålla koll på": "#6B7280",
};

/* ─────────── Facetter ─────────── */

export const FACETS = [
  {
    id: "gr", label: "Granskningsnivå",
    values: (item, ov) => [GRANSKNING[granskningOf(ov)].label],
  },
  {
    id: "kat", label: "Kategori",
    values: (item) => [KATEGORI_MAP[kategoriOf(item)].label],
  },
  {
    id: "del", label: "Rapportdel",
    values: (item) => (DEL_LABELS[item.del] ? [DEL_LABELS[item.del]] : []),
  },
  {
    id: "sub", label: "Underkategori",
    values: (item) => (SUB_LABELS[item.sub] ? [SUB_LABELS[item.sub]] : []),
  },
  {
    id: "akt", label: "Aktörstyp",
    values: (item) => tagValues(item, "Aktörstyp"),
  },
  {
    id: "verk", label: "Verksamhetstyp",
    values: (item) => tagValues(item, "Verksamhetstyp"),
  },
  {
    id: "fok", label: "Fokusområde",
    values: (item) => tagValues(item, "Fokusområde"),
  },
  {
    id: "anv", label: "Användning",
    values: (item) => tagValues(item, "Användning"),
  },
  {
    id: "fk", label: "Finansieringskälla",
    values: (item) => (item.fk ? [item.fk] : []),
  },
  {
    id: "mog", label: "Mognadsgrad",
    values: (item, ov) => {
      const m = maturityOf(item, ov);
      return m ? [maturityLabel(m)] : ["Okänd"];
    },
  },
  {
    id: "ehds", label: "EHDS-relevans",
    values: (item) => {
      const e = ehdsOf(item);
      return e ? [e] : [];
    },
  },
  {
    id: "std", label: "Standarder",
    values: (item, ov) => ov?.tags?.standarder || [],
  },
];

/* ─────────── Sök, filtrering, sortering ─────────── */

export function searchMatch(item, ov, q) {
  if (!q) return true;
  const hay = [
    item.n, item.nk, item.ans, item.akt, item.ds, item.tek, String(item.nr),
    fieldValue(item, "nk", ov),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((tok) => hay.includes(tok));
}

// selections: { facetId: Set<value> }
export function applyFilters(items, overrides, q, selections) {
  return items.filter((item) => {
    const ov = overrides[item.nr];
    if (!searchMatch(item, ov, q)) return false;
    for (const facet of FACETS) {
      const sel = selections[facet.id];
      if (!sel || sel.size === 0) continue;
      const vals = facet.values(item, ov);
      if (!vals.some((v) => sel.has(v))) return false;
    }
    return true;
  });
}

// Facettantal: varje facett räknas på urvalet som gäller när facettens egna val ignoreras.
export function facetCounts(items, overrides, q, selections) {
  const out = {};
  for (const facet of FACETS) {
    const rest = { ...selections, [facet.id]: new Set() };
    const pool = applyFilters(items, overrides, q, rest);
    const counts = new Map();
    for (const item of pool) {
      for (const v of facet.values(item, overrides[item.nr])) {
        counts.set(v, (counts.get(v) || 0) + 1);
      }
    }
    out[facet.id] = counts;
  }
  return out;
}

export const SORTS = [
  { id: "namn", label: "Namn A–Ö", fn: (a, b) => a.n.localeCompare(b.n, "sv") },
  { id: "nr", label: "Rapportordning (nr)", fn: (a, b) => a.nr - b.nr },
  { id: "kat", label: "Kategori", fn: (a, b) => kategoriOf(a).localeCompare(kategoriOf(b)) || a.n.localeCompare(b.n, "sv") },
  { id: "mognad", label: "Mognadsgrad (högst först)", fn: null },
];

export function sortItems(items, sortId, overrides) {
  const sort = SORTS.find((s) => s.id === sortId) || SORTS[1];
  const arr = [...items];
  if (sortId === "mognad") {
    arr.sort((a, b) => (maturityOf(b, overrides[b.nr]) || 0) - (maturityOf(a, overrides[a.nr]) || 0) || a.n.localeCompare(b.n, "sv"));
  } else {
    arr.sort(sort.fn);
  }
  return arr;
}

/* ─────────── URL-synk av filterstate ─────────── */

export function selectionsToParams(q, selections, sortId, view) {
  const p = new URLSearchParams();
  if (q) p.set("q", q);
  for (const [id, set] of Object.entries(selections)) {
    if (set && set.size > 0) p.set(id, [...set].join("|"));
  }
  if (sortId && sortId !== "nr") p.set("sort", sortId);
  if (view && view !== "grid") p.set("vy", view);
  return p;
}

export function paramsToSelections(params) {
  const selections = {};
  for (const facet of FACETS) {
    const raw = params.get(facet.id);
    selections[facet.id] = new Set(raw ? raw.split("|").filter(Boolean) : []);
  }
  return {
    q: params.get("q") || "",
    selections,
    sortId: params.get("sort") || "nr",
    view: params.get("vy") || "grid",
  };
}
