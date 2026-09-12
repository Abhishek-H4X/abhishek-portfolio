import * as bundled from "./resumeData.js";

export const CONTENT_KEYS = [
  "PROFILE", "EXPERIENCE", "PROJECTS", "SKILLS",
  "EDUCATION", "CERTIFICATIONS", "PIPELINE_SUMMARY",
];
export const DEFAULT_DATA = Object.fromEntries(CONTENT_KEYS.map((key) => [key, bundled[key]]));
export const ASSET_LIMITS = { avatar: 2 * 1024 * 1024, resume: 3 * 1024 * 1024 };
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const strings = (value) => Array.isArray(value) && value.every((item) => typeof item === "string");
const fields = (value, names) => object(value) && names.every((name) => typeof value[name] === "string");

export function validateResume(data) {
  if (!object(data)) throw new Error("Resume data must be a JSON object");
  if ("PROFILE" in data) {
    const p = data.PROFILE;
    if (!object(p)) throw new Error("PROFILE must be an object");
    for (const key of ["name", "location", "tagline", "pitch", "resumeFile"]) {
      if (key in p && typeof p[key] !== "string") throw new Error("Invalid PROFILE." + key);
    }
    if ("highlights" in p && !strings(p.highlights)) throw new Error("Invalid profile highlights");
    if ("avatar" in p && p.avatar !== null && typeof p.avatar !== "string") throw new Error("Invalid avatar");
  }
  const definitions = {
    EXPERIENCE: (x) => fields(x, ["role", "org", "dates"]) && strings(x.points),
    PROJECTS: (x) => fields(x, ["name", "status", "description"]),
    SKILLS: (x) => fields(x, ["name", "group"]) &&
      (x.level === undefined || (Number.isFinite(x.level) && x.level >= 0 && x.level <= 100)),
    EDUCATION: (x) => fields(x, ["school", "program", "dates"]),
    CERTIFICATIONS: (x) => typeof x === "string",
    PIPELINE_SUMMARY: (x) => typeof x === "string",
  };
  for (const [key, valid] of Object.entries(definitions)) {
    if (key in data && (!Array.isArray(data[key]) || !data[key].every(valid))) throw new Error("Invalid " + key);
  }
  return data;
}

export function normalizeResume(data) {
  validateResume(data);
  return {
    ...DEFAULT_DATA,
    ...Object.fromEntries(CONTENT_KEYS.filter((key) => key in data).map((key) => [key, data[key]])),
    PROFILE: { ...DEFAULT_DATA.PROFILE, ...data.PROFILE },
  };
}
