import { verifyEditToken } from "../server/auth.js";
import { validateUpload } from "../server/assets.js";
import { normalizeResume } from "../src/data/resumeSchema.js";
import { requireWriteConfig, fetchGist, readStoredResume, patchGist, revisionOf, ResumeError } from "../server/resumeRepository.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!verifyEditToken(req.headers?.authorization)) return res.status(401).json({ error: "Unauthorized or session expired" });
  try {
    requireWriteConfig();
    const { type, data } = req.body || {};
    const file = validateUpload(type, data);
    const current = await readStoredResume(await fetchGist());
    const updated = {
      ...current,
      PROFILE: { ...current.PROFILE, ...(type === "avatar" ? { avatar: file.dataUrl } : { resumeFile: "/api/resume-file" }) },
    };
    const files = { "resume.json": { content: JSON.stringify(updated, null, 2) } };
    if (type === "resume") files["resume_pdf.b64"] = { content: file.bytes.toString("base64") };
    await patchGist(files);
    return res.status(200).json({ success: true, type, data: normalizeResume(updated), revision: revisionOf(updated) });
  } catch (error) {
    return res.status(error.status || 502).json({ error: error instanceof ResumeError ? error.message : "Upload failed. Please try again." });
  }
}
