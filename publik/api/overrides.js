// Läser overrides-lagret från Supabase med service-nyckeln (server-side) och
// serverar en rensad, cachead JSON till den publika sajten. Ingen
// Supabase-nyckel når webbläsaren.

const PUBLIC_KEYS = [
  "fields",
  "arbetaVidere",
  "maturity",
  "tags",
  "connections",
  "jurisdictions",
  "jurisdictionOther",
  "sources",
];

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Endast GET" });
    return;
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    res.status(503).json({ error: "Tjänsten är inte konfigurerad" });
    return;
  }

  try {
    const r = await fetch(`${url}/rest/v1/overrides?select=nr,data`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!r.ok) throw new Error("Supabase HTTP " + r.status);
    const rows = await r.json();

    const overrides = {};
    for (const row of rows) {
      const slim = {};
      for (const k of PUBLIC_KEYS) {
        if (row.data?.[k] !== undefined) slim[k] = row.data[k];
      }
      overrides[row.nr] = slim;
    }

    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
    res.status(200).json({ overrides });
  } catch (err) {
    console.error("overrides:", err.message);
    res.status(502).json({ error: "Kunde inte hämta data" });
  }
}
