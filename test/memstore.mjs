// Minimal in-memory stand-in for a Netlify Blobs store.
export function memStore() {
  const m = new Map();
  return {
    async get(key, opts) { if (!m.has(key)) return null; const v = m.get(key); return opts?.type === "json" ? JSON.parse(v) : v; },
    async setJSON(key, val) { m.set(key, JSON.stringify(val)); },
    async set(key, val) { m.set(key, String(val)); },
    async delete(key) { m.delete(key); },
    async list({ prefix = "" } = {}) { return { blobs: [...m.keys()].filter((k) => k.startsWith(prefix)).map((key) => ({ key })) }; },
  };
}
