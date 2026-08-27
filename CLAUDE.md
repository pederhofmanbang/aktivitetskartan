# CLAUDE.md — Session-handover

Brief context for the next Claude session on this repo.

## Project at a glance

**Aktivitetskartan** — interactive mapping of Swedish health-data initiatives (React + Vite, deployed to Vercel). Single-file React app: `src/Dashboard.jsx`. The `DATA` array now lives in **`src/data.js`** (shared module, ~400 KB) — imported by both the internal app and the public app. Supabase for persistence.

**Two apps in this repo:**
- **Internal app** (repo root, `src/Dashboard.jsx`) — aktivitetskartan.vercel.app, the editing environment. Unchanged behaviour.
- **Public app** (`publik/`) — **Hälsodatakartan**, kartan.kchd.se, read-only publik vy i SKR:s grafiska profil (tokens från `pederhofmanbang/kunskapsutveckling` → `knowledge/mallar/skr-grafisk-profil.md`). Own Vercel project with Root Directory `publik`. Serverless functions `publik/api/overrides.js` (read, service key) and `publik/api/forslag.js` (submissions → Supabase-tabellerna `public_field_suggestions` / `public_candidate_suggestions` / `public_reviewers` + GitHub-issue-ping). Env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `KARTAN_GH_TOKEN`, `KARTAN_GH_REPO`. **Ingen Supabase-nyckel i webbläsaren** — de nya tabellerna har RLS utan policies (endast service role). Granskningsmärkning: `arbetaVidere: true` ⇒ "Kurerad", annars "AI-sammanställd".

- Initiatives now: **196** (originally 97). Quality registers (kvalitetsregister) account for **98** of them, added in six batches.
- Per-initiative storage: a fallback `DATA` array in `Dashboard.jsx` + an `overrides` layer in Supabase keyed by `nr`.

## What's been built

**Continuity module** (`🛡️ Kontinuitet`)
- Implements *Metodstöd för hållbar digital försörjningskedja* (`docs/Metodstöd_*.docx`).
- 4-step assessment per analysobjekt, 6 dimensions with traffic-light + free text, ~15 legal frameworks, supplier chips, beroendegraf, markdown + PDF export. Stored in Supabase table `analysis_objects`.
- Code lives between `function newAnalysisObject` and `function ContinuityView` in `Dashboard.jsx`.

**Prioriterade view enhancements**
- ⭐ toggle `mode = "starred" | "filled"` (filled = at least one Prio-only field populated).
- Layout toggle `layout = "list" | "grid"`. In grid mode, clicking a card opens a **Prio-card modal** (via `renderPrioCard`, extracted helper reused by both list and modal) — NOT the generic `DetailModal`. This keeps grid+list editing consistent (PR #28).
- Grid card preview shows `item.st` (labeled "Mognadsgrad") and `item.typ` — from DATA, not from override Prio-fields, so preview matches the rest of the app (PR #29).
- Header search and sidebar filters now apply via `sorted` prop (fixed in PR #17).

**Dynamic UI counts**
- Header, lathund and top stat tile all use `{DATA.length}` — never hardcode initiative counts (PR #26, #27). Same rule applies to README.md and CLAUDE.md line 9 when a new batch lands.

**Registerplattformskonsolidering (nr 64)**
- The Prio-override has all 21 Prio-fields filled from the CPUA-konsolidering markdown; kept `arbetaVidere: true` (starred).

**Sidebar quick filter**
- New "Snabbfilter" section in the sidebar between Ursprung and Finansieringskälla, with a `📋 Kvalitetsregister` toggle that filters anything tagged `verksamhetstyp = kvalitetsregister`.
- State: `const [quickFilter, setQuickFilter] = useState({ kvalreg: false })`.

## Data conventions for new initiatives

When adding kvalitetsregister via md batches, the established pattern is:

- **nr**: next sequential, currently next free is **197**.
- **Name**: `NKR {nkr-id} — {full name}` so the external NKR identifier is searchable and the catalogue order is meaningful.
- **DATA-level fields**: `del: "A"`, `sub: "A1"`, `fk: "Regionerna"`, `tags: [{category:"Verksamhetstyp", values:"kvalitetsregister"}, {category:"Aktörstyp", values:"region"}]`.
- **Override fields**: all 21 Prio-fields populated where the md provides them; `arbetaVidere: false` (NOT starred); `tags.anvfall: ["Kvalitetsregister", ...]`; `connections` array with `nr: 2` (the Nationella kvalitetsregister umbrella).
- **CPUA-avvikelse**: when source notes the actual CPUA differs from the batch focus region, capture it in DATA `korr` field. The parser handles two formats: `> **Korrigering:** ...` (blockquote) and `**CPUA-avvikelse: ...**` (inline bold paragraph).

## Batch workflow (proven across six batches)

Batches 1–4 used a regex md-parser; batches 5–6 switched to a hand-crafted **build script** (`/tmp/build_kvalreg{N}.js`) that hardcodes the parsed entries as JS objects — more reliable than parsing when the md-format varies. Prefer the build-script approach for new batches unless the incoming md is highly regular.

Build-script skeleton (batch 5 and 6 are good templates):
- Array of `{nr, nkrId, name, fields: {...all 21 Prio-fields...}, anvfall, anvomrade, connections, korr}` objects.
- Emits: `/tmp/data_entriesN.json` (DATA rows) + `/tmp/upsertN_batch_{1..3}.sql` (SQL upserts, split into ~3–4 rows per batch to keep payloads small).

Steps:
1. Run the build script: `node /tmp/build_kvalreg{N}.js`.
2. Append DATA entries into **`src/data.js`** (NOT Dashboard.jsx — DATA moved there) by replacing the unique anchor `}];\n/* ─────────── END DATA ─────────── */` with `},{new_entries}];\n/* ─────────── END DATA ─────────── */`.
3. `npm run build` to validate.
4. Run the SQL upserts via the Supabase `execute_sql` MCP tool (tool name has varied per session — the current session uses `mcp__Supabase__execute_sql`, older sessions used `mcp__12cfdc37-...__execute_sql`; project id is stable: `gcbqrrspmnfakkxyhqdv`).
5. Verify with `SELECT nr FROM overrides WHERE nr BETWEEN {min} AND {max}` — all rows must appear.
6. Bump CLAUDE.md line 9 (total + kvalreg counts + batch count) and README.md line 3.
7. Commit, push, open PR, squash-merge.

CPUA-avvikelse handling: capture in the DATA `korr` field AND in the override `ovrigt` field (both). See nr 182 SOReg, nr 190 Bråck, nr 195 PsoReg for reference.

Registers that were deliberately SKIPPED (wrong CPUA vs the batch's focus region):
- **NKR 183 Kvalitetsregister ECT** — CPUA is Region Örebro län (not Västerbotten). Belongs in a future Örebro-batch.

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
