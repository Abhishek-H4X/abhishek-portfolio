import crypto from "node:crypto";

export function signEditToken(secret, expiresAt = Date.now() + 30 * 60 * 1000) {
  const payload = JSON.stringify({ exp: expiresAt });
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(payload + "." + signature).toString("base64");
}

export function verifyEditToken(header, secret = process.env.EDIT_TOKEN_SECRET) {
  if (!secret || typeof header !== "string" || !header.startsWith("Bearer ")) return false;
  try {
    const decoded = Buffer.from(header.slice(7), "base64").toString("utf8");
    const parts = decoded.split(".");
    if (parts.length !== 2 || !/^[a-f0-9]{64}$/.test(parts[1])) return false;
    const expected = crypto.createHmac("sha256", secret).update(parts[0]).digest();
    if (!crypto.timingSafeEqual(expected, Buffer.from(parts[1], "hex"))) return false;
    const { exp } = JSON.parse(parts[0]);
    return Number.isFinite(exp) && Date.now() < exp;
  } catch { return false; }
}
