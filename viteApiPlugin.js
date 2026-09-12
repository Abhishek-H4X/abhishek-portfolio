// Serve the same handlers in development and production.
export default function viteApiPlugin(env = process.env) {
  for (const key of ["GROQ_API_KEY", "GROQ_MODEL", "VITE_RESUME_GIST_URL", "VITE_GITHUB_USERNAME",
    "GITHUB_TOKEN", "EDIT_PASSCODE", "EDIT_TOKEN_SECRET", "GIST_ID"]) {
    if (env[key]) process.env[key] = env[key];
  }
  return {
    name: "vite-api-plugin",
    configureServer(server) {
      const routes = new Set(["chat", "edit-auth", "resume-update", "asset-upload", "resume-data", "resume-file", "github-activity"]);
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, "http://localhost");
        const route = url.pathname.replace(/^\/api\//, "");
        if (!url.pathname.startsWith("/api/") || !routes.has(route)) return next();
        res.status = (code) => { res.statusCode = code; return res; };
        res.json = (data) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(data)); return res; };
        req.query = Object.fromEntries(url.searchParams);
        try {
          if (req.method === "POST") {
            const chunks = [];
            let size = 0;
            for await (const chunk of req) {
              size += chunk.length;
              if (size > 4_400_000) { res.status(413).json({ error: "Request body is too large." }); return; }
              chunks.push(chunk);
            }
            try { req.body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"); }
            catch { res.status(400).json({ error: "Invalid JSON" }); return; }
          }
          const { default: handler } = await server.ssrLoadModule("/api/" + route + ".js");
          await handler(req, res);
        } catch {
          if (!res.headersSent) res.status(500).json({ error: "The request could not be completed." });
          else if (!res.writableEnded) res.end();
        }
      });
    },
  };
}
