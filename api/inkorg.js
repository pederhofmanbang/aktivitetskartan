// Inkorg för interna appen: läser och statusuppdaterar inskicken från publika
// Hälsodatakartan (public_field_suggestions / public_candidate_suggestions /
// public_reviewers). Tabellerna har RLS utan policies — endast service-nyckeln
// (server-side här) kommer åt dem. Lösenordsskydd med samma mönster som
// kchd-repots /api/nextstep-board: konstant-tids-jämförelse mot env-lösenord,
// klienten skickar lösenordet i header x-kartan-pass.

const TABLES = {
  andringar: "public_field_suggestions",
  kandidater: "public_candidate_suggestions",
  granskare: "public_reviewers",
};

const STATUSES = ["ny", "hanterad", "avvisad"];

function timingSafeEqual(a, b) {
  const sa = String(a);
  const sb = String(b);
  let diff = sa.length ^ sb.length;
  for (let i = 0; i < Math.max(sa.length, sb.length); i++) {
    diff |= (sa.charCodeAt(i) || 0) ^ (sb.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Endast POST" });
    return;
  }
  const pass = process.env.KARTAN_ADMIN_PASSWORD;
  const supaUrl = process.env.SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!pass || !supaUrl || !supaKey) {
    res.status(503).json({ error: "Inkorgen är inte konfigurerad (env saknas)" });
    return;
  }
  if (!timingSafeEqual(req.headers["x-kartan-pass"] || "", pass)) {
    res.status(401).json({ error: "Fel lösenord" });
    return;
  }

  // Stödjer både legacy service_role-JWT (eyJ…) och nya sb_secret_-nycklar.
  // De nya nycklarna är inte JWT:er och ska bara skickas i apikey-headern.
  const authHeaders = { apikey: supaKey };
  if (supaKey.startsWith("eyJ")) authHeaders.Authorization = `Bearer ${supaKey}`;

  const supa = (path, init = {}) =>
    fetch(`${supaUrl}/rest/v1/${path}`, {
      ...init,
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    });

  const { action } = req.body || {};

  try {
    if (action === "auth") {
      res.status(200).json({ ok: true });
      return;
    }

    if (action === "list") {
      const out = {};
      for (const [key, table] of Object.entries(TABLES)) {
        const r = await supa(`${table}?select=*&order=created_at.desc&limit=500`);
        if (!r.ok) throw new Error(`${table}: HTTP ${r.status}`);
        out[key] = await r.json();
      }
      res.status(200).json(out);
      return;
    }

    if (action === "setStatus") {
      const { typ, id, status } = req.body;
      const table = TABLES[typ];
      if (!table || !Number.isInteger(id) || !STATUSES.includes(status)) {
        res.status(400).json({ error: "Ogiltig statusändring" });
        return;
      }
      const r = await supa(`${table}?id=eq.${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      if (!r.ok) throw new Error(`${table}: HTTP ${r.status}`);
      res.status(200).json({ ok: true });
      return;
    }

    res.status(400).json({ error: "Okänd action" });
  } catch (err) {
    console.error("inkorg:", err.message);
    res.status(502).json({ error: "Kunde inte nå databasen" });
  }
}
