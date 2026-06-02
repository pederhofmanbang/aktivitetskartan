# CLAUDE.md — Session-handover

Brief context for the next Claude session on this repo.

## Project at a glance

**Aktivitetskartan** — interactive mapping of Swedish health-data initiatives (React + Vite, deployed to Vercel). Single-file React app: `src/Dashboard.jsx` (~1.1 MB). Supabase for persistence.

- Initiatives now: **178** (originally 97). Quality registers (kvalitetsregister) account for **80** of them, added in four batches.
- Per-initiative storage: a fallback `DATA` array in `Dashboard.jsx` + an `overrides` layer in Supabase keyed by `nr`.

## What's been built

**Continuity module** (`🛡️ Kontinuitet`)
- Implements *Metodstöd för hållbar digital försörjningskedja* (`docs/Metodstöd_*.docx`).
- 4-step assessment per analysobjekt, 6 dimensions with traffic-light + free text, ~15 legal frameworks, supplier chips, beroendegraf, markdown + PDF export. Stored in Supabase table `analysis_objects`.
- Code lives between `function newAnalysisObject` and `function ContinuityView` in `Dashboard.jsx`.

**Prioriterade view enhancements**
- ⭐ toggle `mode = "starred" | "filled"` (filled = at least one Prio-only field populated).
- Layout toggle `layout = "list" | "grid"` — grid shows compact cards, click opens DetailModal.
- Header search and sidebar filters now apply via `sorted` prop (fixed in PR #17).

**Sidebar quick filter**
- New "Snabbfilter" section in the sidebar between Ursprung and Finansieringskälla, with a `📋 Kvalitetsregister` toggle that filters anything tagged `verksamhetstyp = kvalitetsregister`.
- State: `const [quickFilter, setQuickFilter] = useState({ kvalreg: false })`.

## Data conventions for new initiatives

When adding kvalitetsregister via md batches, the established pattern is:

- **nr**: next sequential, currently next free is **179**.
- **Name**: `NKR {nkr-id} — {full name}` so the external NKR identifier is searchable and the catalogue order is meaningful.
- **DATA-level fields**: `del: "A"`, `sub: "A1"`, `fk: "Regionerna"`, `tags: [{category:"Verksamhetstyp", values:"kvalitetsregister"}, {category:"Aktörstyp", values:"region"}]`.
- **Override fields**: all 21 Prio-fields populated where the md provides them; `arbetaVidere: false` (NOT starred); `tags.anvfall: ["Kvalitetsregister", ...]`; `connections` array with `nr: 2` (the Nationella kvalitetsregister umbrella).
- **CPUA-avvikelse**: when source notes the actual CPUA differs from the batch focus region, capture it in DATA `korr` field. The parser handles two formats: `> **Korrigering:** ...` (blockquote) and `**CPUA-avvikelse: ...**` (inline bold paragraph).

## Md-parser workflow (proven across four batches)

Reusable parser at `/tmp/parse_kvalreg{N}.js` (the one in batch 4 covers all observed format variations):

- Splits on `## (?=\d+ )` headers (handles both `NN Name` and `NN – Name`).
- Section regex tolerates both `**1. Syfte & behov.**` and `**1. Syfte & behov**`.
- For section 5 (Ekonomi & strategi), tries explicit `Ekonomisk modell:` / `Strategisk betydelse:` labels first, falls back to first-sentence split.
- Output: per-register JS objects → DATA entries + Supabase upsert SQL.

After parsing:
1. Generate DATA entries with `node /tmp/build_kvalreg.js`.
2. Append into `src/Dashboard.jsx` by replacing the unique anchor `}];\n/* ─────────── CONSTANTS ─────────── */` with `},{new_entries}];\n/* ─────────── CONSTANTS ─────────── */`.
3. `npm run build` to validate, then commit, push, open PR, merge.
4. Run the SQL upserts via `mcp__12cfdc37-7cbb-487b-bb5d-25c6f5e65331__execute_sql` in batches of ~5–6 transactions to keep payloads manageable.
5. Supabase project id: `gcbqrrspmnfakkxyhqdv`.

## House style

- Swedish in user-facing strings and prose; English in code comments where used.
- Don't touch the original initiative cards or PrioritizedView's editor — additive changes only.
- Don't star new bulk-imported initiatives. Use the "Alla med Prio-fält ifyllda" toggle to surface them in the Prio tab without polluting the ⭐ semantics.
- Every PR squash-merged immediately after build passes. No PRs left open.

## What the user typically asks next

- Next batch of kvalitetsregister (allocates next nr block, same flow).
- Refinements to the Kontinuitet module or its export formats.
- UI tweaks to Prioriterade or the sidebar filter.

If the user pastes a markdown catalogue of registers, prefer to reuse the batch-4 parser as a starting point — it already handles the structural variations seen across batches 1–4.
