// Klient mot de serverless-funktioner som håller Supabase-nycklarna på servern.
// Ingen Supabase-nyckel finns i webbläsaren.

let overridesCache = null;

export async function fetchOverrides() {
  if (overridesCache) return overridesCache;
  try {
    const res = await fetch("/api/overrides");
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();
    overridesCache = json.overrides || {};
  } catch (err) {
    console.warn("Kunde inte hämta overrides — visar grunddata.", err);
    overridesCache = {};
  }
  return overridesCache;
}

export async function submitForslag(typ, payload) {
  const res = await fetch("/api/forslag", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ typ, ...payload }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Något gick fel — försök igen.");
  return json;
}
