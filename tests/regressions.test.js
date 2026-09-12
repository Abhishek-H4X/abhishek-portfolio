import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import http from "node:http";
import chat from "../api/chat.js";
import update from "../api/resume-update.js";
import upload from "../api/asset-upload.js";
import resumeFile from "../api/resume-file.js";
import resumeData from "../api/resume-data.js";
import editAuth from "../api/edit-auth.js";
import viteApiPlugin from "../viteApiPlugin.js";
import { signEditToken, verifyEditToken } from "../server/auth.js";
import { revisionOf, loadResumeSnapshot } from "../server/resumeRepository.js";
import { validateUpload } from "../server/assets.js";
import { ASSET_LIMITS, DEFAULT_DATA } from "../src/data/resumeSchema.js";
import { readChatStream } from "../src/lib/chatStream.js";
import { useResumeStore, applyResumeSnapshot, applySavedResume, refreshResumeData, stopResumePolling } from "../src/hooks/useResumeData.js";
import { useUIStore } from "../src/store.js";
import { rememberNodePosition } from "../src/lib/nodePositions.js";

const originalFetch = globalThis.fetch;
const envNames = ["GIST_ID", "GITHUB_TOKEN", "EDIT_TOKEN_SECRET", "EDIT_PASSCODE", "GROQ_API_KEY", "GROQ_MODEL", "VITE_RESUME_GIST_URL"];
const originalEnv = Object.fromEntries(envNames.map((key) => [key, process.env[key]]));
const saved = { ...structuredClone(DEFAULT_DATA), PROFILE: { ...DEFAULT_DATA.PROFILE, name: "Updated Candidate", avatar: "saved-avatar" }, customField: "keep-me" };
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });
const gist = (data = saved) => ({ files: { "resume.json": { content: JSON.stringify(data) } } });
const pdf = Buffer.from("%PDF-1.4\n" + "review-content ".repeat(400) + "\n%%EOF");
const pdfUrl = "data:application/pdf;base64," + pdf.toString("base64");
function configureWrites() {
  process.env.GIST_ID = "reviewgist";
  process.env.GITHUB_TOKEN = "review-github-token";
  process.env.EDIT_TOKEN_SECRET = "review-token-signing-secret";
}
const request = (body) => ({ method: "POST", headers: { authorization: "Bearer " + signEditToken(process.env.EDIT_TOKEN_SECRET) }, body });
const response = () => ({
  statusCode: 200, headers: {}, chunks: [], writableEnded: false,
  status(code) { this.statusCode = code; return this; },
  setHeader(key, value) { this.headers[key] = value; },
  writeHead(code, headers) { this.statusCode = code; Object.assign(this.headers, headers); },
  write(chunk) { this.chunks.push(chunk); },
  json(value) { this.body = value; this.writableEnded = true; return this; },
  end(value) { this.body = value ?? this.chunks.join(""); this.writableEnded = true; },
});
beforeEach(() => {
  for (const key of envNames) delete process.env[key];
  globalThis.fetch = async () => { throw new Error("Unexpected external request in test"); };
  useResumeStore.setState({ data: { ...structuredClone(DEFAULT_DATA), NODES: [] }, draft: null, revision: null, syncStatus: "idle" });
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const key of envNames) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
  stopResumePolling();
});

async function withDevServer(run) {
  let middleware;
  viteApiPlugin({}).configureServer({
    middlewares: { use(value) { middleware = value; } },
    ssrLoadModule: (path) => import(".." + path),
  });
  const events = [];
  const server = http.createServer((req, res) => {
    req.on("close", () => events.push("request-close"));
    middleware(req, res, () => { res.statusCode = 404; res.end(); });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try { return await run(server.address().port, events); }
  finally { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
}
function post(port, body, path = "/api/chat") {
  return new Promise((resolve, reject) => {
    const req = http.request({ port, host: "127.0.0.1", path, method: "POST", agent: false, headers: { "Content-Type": "application/json" } }, (res) => {
      let result = "";
      res.on("data", (chunk) => result += chunk);
      res.on("end", () => resolve({ status: res.statusCode, body: result }));
    });
    req.on("error", reject);
    req.end(typeof body === "string" ? body : JSON.stringify(body));
  });
}
const providerStream = () => new Response('data: {"choices":[{"delta":{"content":"Verified reply"}}]}\n\ndata: [DONE]\n\n', { headers: { "Content-Type": "text/event-stream" } });

test("chat finishes after a normal HTTP request body closes", async () => {
  process.env.GROQ_API_KEY = "review-groq-key";
  let providerCalls = 0;
  globalThis.fetch = async () => { providerCalls++; return providerStream(); };
  await withDevServer(async (port, events) => {
    const result = await post(port, { mode: "chat", messages: [{ role: "user", content: "Hello" }] });
    assert.equal(result.status, 200);
    assert.ok(events.includes("request-close"));
    assert.match(result.body, /Verified reply/);
    assert.match(result.body, /event: done/);
    assert.equal(providerCalls, 1);
  });
});

test("disconnecting the response aborts the provider request", { timeout: 4000 }, async () => {
  process.env.GROQ_API_KEY = "review-groq-key";
  let aborted;
  const cancellation = new Promise((resolve) => { aborted = resolve; });
  globalThis.fetch = (_url, options) => new Promise((_resolve, reject) => {
    const cancel = () => { aborted(true); reject(new DOMException("Disconnected", "AbortError")); };
    if (options.signal.aborted) cancel();
    else options.signal.addEventListener("abort", cancel, { once: true });
  });
  await withDevServer(async (port) => {
    const req = http.request({ port, host: "127.0.0.1", method: "POST", path: "/api/chat", agent: false, headers: { "Content-Type": "application/json" } }, (res) => {
      res.once("data", () => res.destroy());
    });
    req.on("error", () => {});
    req.end(JSON.stringify({ mode: "chat", messages: [{ role: "user", content: "Hello" }] }));
    assert.equal(await cancellation, true);
  });
});

test("the development bridge rejects malformed JSON", async () => {
  await withDevServer(async (port) => assert.equal((await post(port, "{bad")).status, 400));
});

test("chat and job matching both use current Gist data", async () => {
  configureWrites();
  process.env.GROQ_API_KEY = "review-groq-key";
  const current = { ...saved, SKILLS: [{ name: "New live skill", group: "Data Science", level: 70 }] };
  const prompts = [];
  globalThis.fetch = async (url, options = {}) => {
    if (String(url).startsWith("https://api.github.com/")) return json(gist(current));
    const input = JSON.parse(options.body);
    prompts.push(input.messages[0].content);
    return input.stream ? providerStream() : json({ choices: [{ message: { content: JSON.stringify({ score: 70, matched: ["New live skill"], gaps: [], pitch: "Current profile." }) } }] });
  };
  const chatRes = response();
  await chat({ method: "POST", body: { mode: "chat", messages: [{ role: "user", content: "Skills?" }] } }, chatRes);
  const matchRes = response();
  await chat({ method: "POST", body: { mode: "match", jobDescription: "New live skill" } }, matchRes);
  assert.equal(matchRes.statusCode, 200);
  assert.equal(prompts.length, 2);
  for (const prompt of prompts) { assert.match(prompt, /Updated Candidate/); assert.match(prompt, /New live skill/); }
});

test("a failed Gist read never causes a write", async () => {
  configureWrites();
  const methods = [];
  globalThis.fetch = async (_url, options) => { methods.push(options.method || "GET"); return json({}, 503); };
  const res = response();
  await update(request({ data: { PIPELINE_SUMMARY: ["Draft"] }, expectedRevision: revisionOf(saved) }), res);
  assert.equal(res.statusCode, 502);
  assert.deepEqual(methods, ["GET"]);
});

test("AI refuses to answer from outdated defaults when the configured live source fails", async () => {
  configureWrites();
  process.env.GROQ_API_KEY = "review-groq-key";
  const requested = [];
  globalThis.fetch = async (url) => { requested.push(String(url)); return json({}, 503); };
  const res = response();
  await chat({ method: "POST", body: { mode: "chat", messages: [{ role: "user", content: "Latest skills?" }] } }, res);
  assert.equal(res.statusCode, 503);
  assert.ok(requested.every((url) => url.startsWith("https://api.github.com/")));
  assert.match(res.body.error, /current resume/);
});

test("invalid or missing resume JSON cannot be overwritten by edits or uploads", async () => {
  configureWrites();
  for (const files of [{}, { "resume.json": { content: "{broken" } }]) {
    let writes = 0;
    globalThis.fetch = async (_url, options) => { if (options.method === "PATCH") writes++; return json({ files }); };
    for (const [handler, body] of [[update, { data: { PIPELINE_SUMMARY: ["Draft"] }, expectedRevision: "old" }], [upload, { type: "resume", data: pdfUrl }]]) {
      const res = response(); await handler(request(body), res);
      assert.equal(res.statusCode, 409);
    }
    assert.equal(writes, 0);
  }
});

test("stale drafts receive a conflict instead of overwriting newer data", async () => {
  configureWrites();
  let writes = 0;
  globalThis.fetch = async (_url, options) => { if (options.method === "PATCH") writes++; return json(gist()); };
  const res = response();
  await update(request({ data: { PIPELINE_SUMMARY: ["Draft"] }, expectedRevision: "stale" }), res);
  assert.equal(res.statusCode, 409);
  assert.equal(writes, 0);
});

test("successful partial saves preserve other profile fields and sections", async () => {
  configureWrites();
  let written;
  globalThis.fetch = async (_url, options) => {
    if (options.method === "PATCH") { written = JSON.parse(JSON.parse(options.body).files["resume.json"].content); return json({}); }
    return json(gist());
  };
  const res = response();
  await update(request({ data: { PROFILE: { pitch: "Updated pitch" } }, expectedRevision: revisionOf(saved) }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(written.PROFILE.pitch, "Updated pitch");
  assert.equal(written.PROFILE.avatar, saved.PROFILE.avatar);
  assert.equal(written.PROFILE.location, saved.PROFILE.location);
  assert.deepEqual(written.EXPERIENCE, saved.EXPERIENCE);
  assert.equal(written.customField, "keep-me");
  assert.equal(res.body.revision, revisionOf(written));
});

test("complete raw PDF content is fetched when Gist metadata is truncated", async () => {
  configureWrites();
  const encoded = pdf.toString("base64");
  let requestedRaw = false;
  globalThis.fetch = async (url, options) => {
    if (String(url).includes("gist.githubusercontent.com")) {
      requestedRaw = true;
      assert.equal(options.headers.Authorization, undefined);
      return new Response(encoded);
    }
    return json({ files: { "resume_pdf.b64": { content: encoded.slice(0, 128), truncated: true, raw_url: "https://gist.githubusercontent.com/review/id/raw/resume_pdf.b64" } } });
  };
  const res = response();
  await resumeFile({ method: "GET" }, res);
  assert.equal(res.statusCode, 200);
  assert.ok(requestedRaw);
  assert.deepEqual(res.body, pdf);
  assert.equal(res.headers["Content-Length"], pdf.length);
});

test("unavailable full PDF data reports failure instead of downloading partial bytes", async () => {
  configureWrites();
  globalThis.fetch = async (url) => String(url).includes("gist.githubusercontent.com")
    ? new Response("", { status: 503 })
    : json({ files: { "resume_pdf.b64": { content: pdf.toString("base64").slice(0, 64), truncated: true, raw_url: "https://gist.githubusercontent.com/review/id/raw/resume_pdf.b64" } } });
  const res = response(); await resumeFile({ method: "GET" }, res);
  assert.equal(res.statusCode, 502);
  assert.equal(res.headers.Location, undefined);
});

test("PDF uploads preserve the complete existing JSON, including truncated Gist reads", async () => {
  configureWrites();
  let files;
  globalThis.fetch = async (url, options = {}) => {
    if (options.method === "PATCH") { files = JSON.parse(options.body).files; return json({}); }
    if (String(url).includes("gist.githubusercontent.com")) return new Response(JSON.stringify(saved));
    return json({ files: { "resume.json": { content: '{"PRO', truncated: true, raw_url: "https://gist.githubusercontent.com/review/id/raw/resume.json" } } });
  };
  const res = response(); await upload(request({ type: "resume", data: pdfUrl }), res);
  assert.equal(res.statusCode, 200);
  const stored = JSON.parse(files["resume.json"].content);
  assert.equal(stored.PROFILE.resumeFile, "/api/resume-file");
  assert.equal(stored.PROFILE.avatar, saved.PROFILE.avatar);
  assert.equal(stored.customField, "keep-me");
  assert.equal(files["resume_pdf.b64"].content, pdf.toString("base64"));
});

test("upload validation rejects fake, incomplete, and oversized PDFs", () => {
  assert.throws(() => validateUpload("resume", "data:application/pdf;base64," + Buffer.from("not a PDF").toString("base64")));
  assert.throws(() => validateUpload("resume", pdfUrl.slice(0, -8)));
  assert.throws(() => validateUpload("resume", "data:application/pdf;base64," + "A".repeat(Math.ceil(ASSET_LIMITS.resume / 3) * 4 + 200)));
  assert.throws(() => validateUpload("__proto__", pdfUrl));
  assert.deepEqual(validateUpload("resume", pdfUrl).bytes, pdf);
});

test("large permitted PDF uploads remain valid after base64 encoding", () => {
  const large = Buffer.alloc(ASSET_LIMITS.resume, 32);
  large.write("%PDF-1.4\n"); large.write("%%EOF", large.length - 5);
  assert.equal(validateUpload("resume", "data:application/pdf;base64," + large.toString("base64")).bytes.length, large.length);
});

test("editor tokens require a valid signature and future finite expiry", async () => {
  configureWrites();
  const secret = process.env.EDIT_TOKEN_SECRET;
  assert.ok(verifyEditToken("Bearer " + signEditToken(secret)));
  assert.equal(verifyEditToken("Bearer " + signEditToken(secret, Date.now() - 1)), false);
  assert.equal(verifyEditToken("Bearer " + signEditToken("different-secret")), false);
  const payload = "{}";
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  assert.equal(verifyEditToken("Bearer " + Buffer.from(payload + "." + sig).toString("base64")), false);
  process.env.EDIT_PASSCODE = "review-passcode";
  const res = response(); await editAuth({ method: "POST", body: { passcode: 123 } }, res);
  assert.equal(res.statusCode, 400);
});

test("static and unavailable data are distinguished, and failures keep the last good resume", async () => {
  const res = response(); await resumeData({ method: "GET" }, res);
  assert.equal(res.body._meta.source, "static");
  applyResumeSnapshot({ ...saved, _meta: { source: "live", revision: "one" } });
  const previous = useResumeStore.getState().data;
  configureWrites();
  globalThis.fetch = async () => json({}, 503);
  const fallback = await loadResumeSnapshot();
  applyResumeSnapshot({ ...fallback.data, _meta: fallback });
  assert.equal(useResumeStore.getState().syncStatus, "error");
  assert.equal(useResumeStore.getState().data, previous);
});

test("background refreshes preserve drafts and cannot undo a confirmed save", async () => {
  useResumeStore.getState().setDraft({ summary: ["Unfinished draft"], revision: "old" });
  applyResumeSnapshot({ ...saved, PIPELINE_SUMMARY: ["Remote update"], _meta: { source: "live", revision: "new" } });
  assert.deepEqual(useResumeStore.getState().draft.summary, ["Unfinished draft"]);
  let resolveRead;
  globalThis.fetch = () => new Promise((resolve) => { resolveRead = resolve; });
  const pending = refreshResumeData();
  applySavedResume({ data: { ...saved, PIPELINE_SUMMARY: ["Confirmed save"] }, revision: "saved" });
  resolveRead(json({ ...saved, PIPELINE_SUMMARY: ["Outdated poll"], _meta: { source: "live", revision: "outdated" } }));
  await pending;
  assert.deepEqual(useResumeStore.getState().data.PIPELINE_SUMMARY, ["Confirmed save"]);
});

test("SSE parsing handles split Unicode/CRLF frames and requires completion", async () => {
  const encoded = new TextEncoder().encode('event: token\r\ndata: {"text":"Résumé ✓"}\r\n\r\nevent: done\r\ndata: {}\r\n\r\n');
  const stream = new ReadableStream({ start(controller) { for (const byte of encoded) controller.enqueue(Uint8Array.of(byte)); controller.close(); } });
  const events = [];
  await readChatStream(new Response(stream), (event, data) => events.push([event, data]));
  assert.equal(events[0][1].text, "Résumé ✓");
  assert.equal(events[1][0], "done");
  await assert.rejects(() => readChatStream(new Response('event: token\ndata: {"text":"Partial"}\n\n'), () => {}), /interrupted/);
  await assert.rejects(() => readChatStream(new Response('event: error\ndata: {"message":"Service unavailable"}\n\n'), () => {}), /Service unavailable/);
});

test("navigation uses current node coordinates and Reader requests repeat correctly", () => {
  rememberNodePosition("projects", { x: -2, y: 0.5, z: 3 });
  useUIStore.getState().setMode("3d");
  useUIStore.getState().openSection("projects");
  assert.deepEqual(useUIStore.getState().focusTarget, [-2, 0.5, 3]);
  useUIStore.getState().setMode("reader");
  useUIStore.getState().openSection("projects");
  const first = useUIStore.getState().readerSection;
  useUIStore.getState().openSection("projects");
  assert.equal(useUIStore.getState().activeSection, null);
  assert.equal(useUIStore.getState().readerSection.id, "projects");
  assert.notEqual(useUIStore.getState().readerSection, first);
});
