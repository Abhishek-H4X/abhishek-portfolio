import crypto from "node:crypto";
import { DEFAULT_DATA, CONTENT_KEYS, normalizeResume, validateResume } from "../src/data/resumeSchema.js";

export class ResumeError extends Error {
  constructor(message, status = 502) { super(message); this.status = status; }
}
export const revisionOf = (data) => crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
const headers = () => ({
  Accept: "application/vnd.github+json", "User-Agent": "portfolio-resume",
  ...(process.env.GITHUB_TOKEN ? { Authorization: "Bearer " + process.env.GITHUB_TOKEN } : {}),
});
const gistEndpoint = () => "https://api.github.com/gists/" + encodeURIComponent(process.env.GIST_ID);

export function requireWriteConfig() {
  if (!process.env.GIST_ID || !process.env.GITHUB_TOKEN) {
    throw new ResumeError("Resume editing requires GIST_ID and GITHUB_TOKEN on the server.", 503);
  }
}

export async function fetchGist() {
  if (!process.env.GIST_ID) throw new ResumeError("GIST_ID is not configured.", 503);
  let response;
  try {
    response = await fetch(gistEndpoint(), { headers: headers(), signal: AbortSignal.timeout(10_000) });
  } catch { throw new ResumeError("Could not read the saved resume. No changes were saved."); }
  if (!response.ok) throw new ResumeError("Could not read the saved resume (HTTP " + response.status + ").");
  return response.json();
}

function trustedRawUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || !["gist.githubusercontent.com", "raw.githubusercontent.com"].includes(url.hostname)) {
    throw new ResumeError("Invalid GitHub raw file URL.");
  }
  return url;
}

export async function readGistFile(gist, filename) {
  const file = gist.files?.[filename];
  if (!file) return null;
  if (!file.truncated && typeof file.content === "string") return file.content;
  if (!file.raw_url) throw new ResumeError("The complete " + filename + " file is unavailable.");
  const response = await fetch(trustedRawUrl(file.raw_url), {
    headers: { "User-Agent": "portfolio-resume" },
    signal: AbortSignal.timeout(15_000), redirect: "error",
  });
  if (!response.ok) throw new ResumeError("Could not download the complete " + filename + " file.");
  return response.text();
}

export async function readStoredResume(gist) {
  const content = await readGistFile(gist, "resume.json");
  if (!content?.trim()) throw new ResumeError("The Gist needs a valid resume.json file before it can be edited.", 409);
  try {
    const data = validateResume(JSON.parse(content));
    if (!CONTENT_KEYS.some((key) => key in data)) throw new Error("No resume sections");
    return data;
  } catch { throw new ResumeError("Saved resume.json is invalid. Repair it before saving changes.", 409); }
}

export async function loadResumeSnapshot() {
  try {
    let stored;
    if (process.env.GIST_ID) {
      stored = await readStoredResume(await fetchGist());
    } else if (process.env.VITE_RESUME_GIST_URL) {
      const url = trustedRawUrl(process.env.VITE_RESUME_GIST_URL);
      url.pathname = url.pathname.replace(/\/raw\/[a-f0-9]{40}\//, "/raw/");
      const response = await fetch(url, { signal: AbortSignal.timeout(10_000), redirect: "error" });
      if (!response.ok) throw new Error("Resume source unavailable");
      stored = validateResume(await response.json());
    } else {
      return { data: normalizeResume(DEFAULT_DATA), source: "static", revision: null };
    }
    return { data: normalizeResume(stored), source: "live", revision: revisionOf(stored) };
  } catch {
    return {
      data: normalizeResume(DEFAULT_DATA), source: "fallback", revision: null,
      warning: "Live resume is unavailable. Showing the last available resume.",
    };
  }
}

export function mergeResumePatch(current, patch) {
  if (!patch || typeof patch !== "object" || Array.isArray(patch) || !Object.keys(patch).length) {
    throw new ResumeError("Provide at least one resume field.", 400);
  }
  if (Object.keys(patch).some((key) => !CONTENT_KEYS.includes(key))) {
    throw new ResumeError("Only resume content fields can be updated.", 400);
  }
  try { validateResume(patch); } catch (error) { throw new ResumeError(error.message, 400); }
  return { ...current, ...patch, ...(patch.PROFILE ? { PROFILE: { ...current.PROFILE, ...patch.PROFILE } } : {}) };
}

export async function patchGist(files) {
  const response = await fetch(gistEndpoint(), {
    method: "PATCH", headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify({ files }), signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new ResumeError("Could not save changes (GitHub HTTP " + response.status + ").");
}
