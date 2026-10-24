import { getStore } from "@netlify/blobs";
import { handle } from "../lib/api.mjs";

export default async (req) => {
  const store = getStore({ name: "find-your-zone-live", consistency: "strong" });
  return handle(req, { store, hostKey: process.env.HOST_KEY });
};

export const config = { path: "/api/live/*" };
