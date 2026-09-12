import { verifyEditToken } from "../server/auth.js";
import { requireWriteConfig, fetchGist, readStoredResume, mergeResumePatch, revisionOf, patchGist, ResumeError } from "../server/resumeRepository.js";
import { normalizeResume } from "../src/data/resumeSchema.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!verifyEditToken(req.headers?.authorization)) return res.status(401).json({ error: "Unauthorized or session expired" });
  try {
    requireWriteConfig();
    const { data: patch, expectedRevision } = req.body || {};
    const current = await readStoredResume(await fetchGist());
    if (!expectedRevision || revisionOf(current) !== expectedRevision) {
      throw new ResumeError("The saved resume has changed. Reload it before saving; your draft is still available.", 409);
    }
    const merged = mergeResumePatch(current, patch);
    await patchGist({ "resume.json": { content: JSON.stringify(merged, null, 2) } });
    return res.status(200).json({ success: true, data: normalizeResume(merged), revision: revisionOf(merged) });
  } catch (error) {
    return res.status(error.status || 502).json({ error: error instanceof ResumeError ? error.message : "Could not save changes. Your draft has been kept." });
  }
}
