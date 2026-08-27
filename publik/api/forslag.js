// Tar emot ändringsförslag, initiativförslag och kvalitetssäkrar-anmälningar,
// sparar dem i Supabase (service-nyckel, tabeller utan publika policies) och
// skapar en GitHub-issue i aktivitetskartan-repot så att Peder pingas.

const TYPES = {
  andring: {
    table: "public_field_suggestions",
    label: "ändringsförslag",
    required: ["forslag"],
    fields: ["nr", "initiativ", "falt", "forslag", "kalla", "namn", "epost", "organisation"],
    title: (p) => `Ändringsförslag: nr ${p.nr} — ${trunc(p.initiativ, 60)} (${p.falt})`,
  },
  kandidat: {
    table: "public_candidate_suggestions",
    label: "initiativförslag",
    required: ["namn", "beskrivning"],
    fields: ["namn", "organisation", "beskrivning", "varfor", "kalla", "foreslagenAv", "epost"],
    title: (p) => `Nytt initiativ föreslaget: ${trunc(p.namn, 80)}`,
  },
  granskare: {
    table: "public_reviewers",
    label: "kvalitetssäkrare",
    required: ["namn", "epost", "omraden"],
    fields: ["namn", "epost", "organisation", "roll", "omraden", "meddelande"],
    title: (p) => `Anmälan som kvalitetssäkrare: ${trunc(p.namn, 80)}`,
  },
};

const MAX_LEN = 5000;

// Stödjer både legacy service_role-JWT (eyJ…) och nya sb_secret_-nycklar.
// De nya nycklarna är inte JWT:er och ska bara skickas i apikey-headern.
function supaHeaders(key, extra = {}) {
  const h = { apikey: key, ...extra };
  if (key.startsWith("eyJ")) h.Authorization = `Bearer ${key}`;
  return h;
}

function trunc(s, n) {
  s = String(s || "");
  return s.length > n ? s.slice(0, n) + "…" : s;
}

// Enkel per-instans rate limit (bästa möjliga i serverless utan extern store).
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 5;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Endast POST" });
    return;
  }
  const supaUrl = process.env.SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supaUrl || !supaKey) {
    res.status(503).json({ error: "Tjänsten är inte konfigurerad ännu" });
    return;
  }

  const body = req.body || {};
  const conf = TYPES[body.typ];
  if (!conf) {
    res.status(400).json({ error: "Okänd förslagstyp" });
    return;
  }

  // Honeypot: fältet är dolt för människor — ifyllt betyder bot. Svara 200 tyst.
  if (body.webbplats) {
    res.status(200).json({ ok: true });
    return;
  }

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "okänd";
  if (rateLimited(ip)) {
    res.status(429).json({ error: "För många förslag på kort tid — vänta en stund och försök igen." });
    return;
  }

  const row = {};
  for (const f of conf.fields) {
    let v = body[f];
    if (v === undefined || v === null || v === "") continue;
    if (typeof v === "string") {
      if (v.length > MAX_LEN) {
        res.status(400).json({ error: "Ett fält är för långt" });
        return;
      }
      row[f] = v.trim();
    } else if (f === "nr" && Number.isInteger(v)) {
      row[f] = v;
    }
  }
  for (const f of conf.required) {
    if (!row[f]) {
      res.status(400).json({ error: "Obligatoriska fält saknas" });
      return;
    }
  }

  // 1. Spara i Supabase.
  try {
    const r = await fetch(`${supaUrl}/rest/v1/${conf.table}`, {
      method: "POST",
      headers: supaHeaders(supaKey, {
        "Content-Type": "application/json",
        Prefer: "return=representation",
      }),
      body: JSON.stringify(row),
    });
    if (!r.ok) throw new Error("Supabase HTTP " + r.status + ": " + (await r.text()).slice(0, 200));
    const [saved] = await r.json();
    row.id = saved?.id;
  } catch (err) {
    console.error("forslag/supabase:", err.message);
    res.status(502).json({ error: "Kunde inte spara förslaget — försök igen senare." });
    return;
  }

  // 2. Skapa GitHub-issue som ping (fel här stoppar inte inskicket).
  try {
    const token = process.env.KARTAN_GH_TOKEN;
    const repo = process.env.KARTAN_GH_REPO || "pederhofmanbang/aktivitetskartan";
    if (token) {
      const lines = conf.fields
        .filter((f) => row[f] !== undefined)
        .map((f) => `**${f}:** ${String(row[f]).replace(/\r?\n/g, "\n> ")}`);
      const issue = {
        title: conf.title(row),
        body:
          `Inskickat via Hälsodatakartan (${conf.label}).\n\n` +
          lines.join("\n\n") +
          `\n\n---\nRad-id i Supabase (\`${conf.table}\`): ${row.id ?? "okänt"}`,
        labels: ["hälsodatakartan", conf.label],
      };
      const gr = await fetch(`https://api.github.com/repos/${repo}/issues`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "halsodatakartan",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(issue),
      });
      if (gr.ok && row.id) {
        const created = await gr.json();
        await fetch(`${supaUrl}/rest/v1/${conf.table}?id=eq.${row.id}`, {
          method: "PATCH",
          headers: supaHeaders(supaKey, { "Content-Type": "application/json" }),
          body: JSON.stringify({ github_issue: created.number }),
        });
      } else if (!gr.ok) {
        console.error("forslag/github: HTTP " + gr.status);
      }
    }
  } catch (err) {
    console.error("forslag/github:", err.message);
  }

  res.status(200).json({ ok: true });
}
