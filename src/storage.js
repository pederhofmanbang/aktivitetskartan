import { supabase } from './supabaseClient'

// ─────────── OVERRIDES ───────────
export async function getOverride(nr) {
  const fallback = { fields: {}, arbetaVidere: false, qa: {}, infoGathering: {}, maturity: null, jurisdictions: [], jurisdictionOther: "", sources: [], fieldHistory: {} };
  try {
    const { data, error } = await supabase.from('overrides').select('data').eq('nr', nr).maybeSingle();
    if (error) throw error;
    return data ? { ...fallback, ...data.data } : fallback;
  } catch (e) {
    console.error('getOverride error:', e);
    return fallback;
  }
}

export async function saveOverride(nr, ov) {
  try {
    const { error } = await supabase.from('overrides').upsert({ nr, data: ov }, { onConflict: 'nr' });
    if (error) throw error;
  } catch (e) {
    console.error('saveOverride error:', e);
  }
}

// ─────────── DEEPDIVES ───────────
export async function getDeepDive(nr) {
  try {
    const { data, error } = await supabase.from('deepdives').select('data').eq('nr', nr).maybeSingle();
    if (error) throw error;
    return data ? data.data : null;
  } catch (e) {
    console.error('getDeepDive error:', e);
    return null;
  }
}

export async function saveDeepDive(nr, deepdive) {
  try {
    const { error } = await supabase.from('deepdives').upsert({ nr, data: deepdive }, { onConflict: 'nr' });
    if (error) throw error;
  } catch (e) {
    console.error('saveDeepDive error:', e);
  }
}

// ─────────── SUGGESTIONS ───────────
export async function getSuggestion(nr) {
  try {
    const { data, error } = await supabase.from('suggestions').select('text').eq('nr', nr).maybeSingle();
    if (error) throw error;
    return data ? data.text : "";
  } catch (e) {
    console.error('getSuggestion error:', e);
    return "";
  }
}

export async function saveSuggestion(nr, text) {
  try {
    const { error } = await supabase.from('suggestions').upsert({ nr, text }, { onConflict: 'nr' });
    if (error) throw error;
  } catch (e) {
    console.error('saveSuggestion error:', e);
  }
}

// ─────────── CANDIDATES ───────────
export async function getCandidates() {
  try {
    const { data, error } = await supabase.from('candidates').select('data').eq('id', 1).maybeSingle();
    if (error) throw error;
    return data ? data.data : null;
  } catch (e) {
    console.error('getCandidates error:', e);
    return null;
  }
}

export async function saveCandidates(list) {
  try {
    const { error } = await supabase.from('candidates').upsert({ id: 1, data: list }, { onConflict: 'id' });
    if (error) throw error;
  } catch (e) {
    console.error('saveCandidates error:', e);
  }
}

// ─────────── ANALYSIS OBJECTS (Kontinuitet & hållbarhet) ───────────
export async function getAnalysisObjects() {
  try {
    const { data, error } = await supabase.from('analysis_objects').select('data').eq('id', 1).maybeSingle();
    if (error) throw error;
    return data ? data.data : null;
  } catch (e) {
    console.error('getAnalysisObjects error:', e);
    return null;
  }
}

export async function saveAnalysisObjects(list) {
  try {
    const { error } = await supabase.from('analysis_objects').upsert({ id: 1, data: list }, { onConflict: 'id' });
    if (error) throw error;
  } catch (e) {
    console.error('saveAnalysisObjects error:', e);
  }
}

// ─────────── REALTIME ───────────
// Subscribe to changes on a table. Returns an object with an unsubscribe() method.
export function subscribeToTable(table, callback) {
  const channel = supabase
    .channel('realtime-' + table)
    .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
      callback(payload);
    })
    .subscribe();

  return {
    unsubscribe: () => supabase.removeChannel(channel),
  };
}

// ─────────── LOAD ALL OVERRIDES (for cache) ───────────
export async function getAllOverrides() {
  try {
    const { data, error } = await supabase.from('overrides').select('nr, data');
    if (error) throw error;
    const cache = {};
    (data || []).forEach(row => { cache[row.nr] = row.data; });
    return cache;
  } catch (e) {
    console.error('getAllOverrides error:', e);
    return {};
  }
}
