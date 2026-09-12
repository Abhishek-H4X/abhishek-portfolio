import crypto from "node:crypto";
import { signEditToken } from "../server/auth.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { passcode } = req.body || {};
  const expected = process.env.EDIT_PASSCODE;
  const secret = process.env.EDIT_TOKEN_SECRET;
  if (!expected || !secret) return res.status(503).json({ error: "Editor authentication is not configured on the server." });
  if (typeof passcode !== "string" || passcode.length > 1024) return res.status(400).json({ error: "Enter a valid passcode." });
  const a = Buffer.from(expected);
  const b = Buffer.from(passcode);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(401).json({ error: "Invalid passcode" });
  return res.status(200).json({ token: signEditToken(secret) });
}
