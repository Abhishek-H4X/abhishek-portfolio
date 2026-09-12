import { fetchGist, readGistFile } from "../server/resumeRepository.js";
import { decodeBase64, isPdf } from "../server/assets.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  res.setHeader("Cache-Control", "no-store");
  const fallback = () => { res.setHeader("Location", "/resume.pdf"); return res.status(302).end(); };
  if (!process.env.GIST_ID) return fallback();
  try {
    const content = await readGistFile(await fetchGist(), "resume_pdf.b64");
    if (content === null) return fallback();
    const bytes = decodeBase64(content);
    if (!isPdf(bytes)) throw new Error("Invalid PDF");
    if (bytes.length > 4_400_000) throw new Error("PDF exceeds the hosted response limit");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Disposition", 'attachment; filename="Abhishek_Kushwaha_Resume.pdf"');
    res.setHeader("Content-Length", bytes.length);
    return res.end(bytes);
  } catch {
    return res.status(502).json({ error: "The uploaded resume could not be downloaded completely. Please try again." });
  }
}
