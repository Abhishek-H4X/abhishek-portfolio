import { loadResumeSnapshot } from "../server/resumeRepository.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const { data, ...meta } = await loadResumeSnapshot();
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({ ...data, _meta: meta });
}
