import { ASSET_LIMITS } from "../src/data/resumeSchema.js";
import { ResumeError } from "./resumeRepository.js";

export function decodeBase64(value) {
  if (typeof value !== "string") throw new ResumeError("Invalid file data.", 400);
  const raw = value.replace(/\s/g, "");
  if (!raw || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(raw)) {
    throw new ResumeError("Invalid or incomplete base64 file.", 400);
  }
  const bytes = Buffer.from(raw, "base64");
  if (bytes.toString("base64") !== raw) throw new ResumeError("Invalid base64 file.", 400);
  return bytes;
}
export function isPdf(bytes) {
  return bytes.subarray(0, 5).toString("ascii") === "%PDF-" &&
    bytes.subarray(Math.max(0, bytes.length - 1024)).includes(Buffer.from("%%EOF"));
}
export function validateUpload(type, data) {
  if (!Object.hasOwn(ASSET_LIMITS, type)) throw new ResumeError("Choose an avatar or resume file.", 400);
  if (typeof data !== "string" || data.length > Math.ceil(ASSET_LIMITS[type] / 3) * 4 + 128) {
    throw new ResumeError("File exceeds the upload limit.", 413);
  }
  const match = data.match(/^data:([^;]+);base64,([\s\S]+)$/);
  if (!match) throw new ResumeError("A base64 file data URL is required.", 400);
  const bytes = decodeBase64(match[2]);
  if (bytes.length > ASSET_LIMITS[type]) throw new ResumeError("File exceeds the upload limit.", 413);
  const mime = match[1];
  const valid = type === "resume"
    ? mime === "application/pdf" && isPdf(bytes)
    : (mime === "image/png" && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) ||
      (mime === "image/jpeg" && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) ||
      (mime === "image/webp" && bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP");
  if (!valid) throw new ResumeError("The file contents do not match the selected file type, or the file is incomplete.", 400);
  return { bytes, dataUrl: "data:" + mime + ";base64," + bytes.toString("base64") };
}
