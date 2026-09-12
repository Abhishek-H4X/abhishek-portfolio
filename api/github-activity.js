// Vercel serverless endpoint: GET /api/github-activity
// Fetches GitHub Repositories via REST API.
// Optionally uses GITHUB_TOKEN env var if present to prevent rate limiting.

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const username =
    req.query?.username ||
    process.env.VITE_GITHUB_USERNAME ||
    "Abhishek-H4X";

  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    console.warn("[github-activity] Missing GITHUB_TOKEN environment variable. This might lead to rate-limiting on GitHub REST API.");
  }

  try {
    const headers = {
      "User-Agent": "portfolio-github-activity",
      "Accept": "application/vnd.github.v3+json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const ghRes = await fetch(`https://api.github.com/users/${username}/repos?sort=pushed&per_page=20`, {
      method: "GET",
      headers
    });

    if (ghRes.status === 404) {
      res.setHeader("Cache-Control", "s-maxage=300");
      return res.status(200).json({ heatmap: null, repos: [], username, notFound: true });
    }

    if (!ghRes.ok) {
      throw new Error(`GitHub REST API responded with ${ghRes.status}`);
    }

    const raw = await ghRes.json();

    if (!Array.isArray(raw)) {
       throw new Error("Invalid response format from GitHub API");
    }

    // Process repo data
    const repos = raw.filter(r => !r.fork).map((repo) => {
      const topics = repo.topics || [];
      const isCompleted = topics.includes("completed");

      return {
        id: repo.id,
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
        stars: repo.stargazers_count,
        language: repo.language ? { name: repo.language, color: "#8b949e" } : null,
        status: isCompleted ? "Completed" : "In Progress",
        latestCommit: {
          message: "Latest update", // REST repos endpoint doesn't give commit message directly without another API call
          date: repo.pushed_at
        }
      };
    });

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
    res.status(200).json({ heatmap: null, repos, username });
  } catch (err) {
    console.error("[github-activity]", err.message);
    res.status(200).json({ heatmap: null, repos: [], username, error: err.message });
  }
}
