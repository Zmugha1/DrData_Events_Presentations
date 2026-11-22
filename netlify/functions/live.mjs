import { getStore } from "@netlify/blobs";
import { handle } from "../lib/api.mjs";

// Live features run only when LIVE_ENABLED is "true" in Netlify. Turn it on before an event, off after.
export default async (req) => {
  if (process.env.LIVE_ENABLED !== "true") return handle(req, { enabled: false });
  const store = getStore({ name: "find-your-zone-live", consistency: "strong" });
  return handle(req, { store, hostKey: process.env.HOST_KEY });
};

export const config = { path: "/api/live/*" };
