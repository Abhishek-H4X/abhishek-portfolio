# Abhishek Kushwaha — 3D Data Science Portfolio

React + React Three Fiber portfolio with Reader mode, a career dashboard, skills charts, GitHub projects, owner editing, résumé uploads, and a Groq-powered assistant.

## Run locally

1. Extract the ZIP and open the folder containing package.json.
2. Use Node.js 20 or newer.
3. Run npm ci. Dependencies are deliberately excluded from the ZIP so npm installs the correct versions for your operating system.
4. Copy .env.example to .env.local and fill in the settings you need.
   - PowerShell: Copy-Item .env.example .env.local
   - macOS/Linux: cp .env.example .env.local
5. Run npm run dev and open the address printed by Vite.

The portfolio runs without credentials using the bundled résumé. The chat then performs simple résumé lookups, and job matching clearly identifies itself as a keyword comparison without a fit score.

The key included in the original upload has been removed from this package. Revoke that old key in your Groq account and create a replacement. Removing it from a ZIP does not revoke it.

## Configuration

| Setting | Purpose |
| --- | --- |
| GROQ_API_KEY | A new Groq key for live AI chat and job matching. Server only. |
| GROQ_MODEL | Optional model override. Defaults to openai/gpt-oss-120b; choose a model available to your Groq account. |
| GIST_ID | Recommended live résumé source. The same Gist is used for reads, edits and uploaded files. |
| GITHUB_TOKEN | Server token with permission to read and update that Gist. Also used for the GitHub widget. |
| EDIT_PASSCODE | Owner passcode for Edit Mode. |
| EDIT_TOKEN_SECRET | A long, random secret used to sign 30-minute editor sessions. |
| VITE_GITHUB_USERNAME | Public GitHub username for the project widget. |
| VITE_RESUME_GIST_URL | Optional read-only raw GitHub URL when GIST_ID is empty. Not needed when GIST_ID is configured. |

Keep private credentials in .env.local locally and in your hosting provider's environment settings when deployed. Do not put private credentials in variables starting with VITE_; those variables can be included in browser code.

To generate a signing secret locally, use:
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"

## Enable live editing

1. Create a Gist containing a file named resume.json. Use the included resume.seed.json as the initial contents.
2. Add its GIST_ID, a GITHUB_TOKEN with Gist write access, EDIT_PASSCODE and EDIT_TOKEN_SECRET to the server configuration.
3. Restart the development server, or redeploy after changing hosted environment settings.
4. Wait for the header to show LIVE, then open Dashboard → Edit Mode and enter your passcode.
5. Edit career milestones and select Save Changes to Gist.

The live content is intentionally visible to portfolio visitors, even when stored in a secret Gist. Only put public résumé information in it.

Drafts are kept separately from the displayed résumé. Polling, switching views and closing/reopening the mobile dashboard preserve the draft within the current page session. Reloading the whole browser page discards an unsaved draft.

If the saved version has changed, saving returns a conflict and keeps the draft. Copy any draft text you need before selecting Discard draft and reload saved resume. This is a single-owner editor: revision checks detect already-changed data, but GitHub Gists do not provide an atomic multi-writer transaction in this implementation.

Failed or malformed Gist reads never cause a write using bundled defaults. Unknown existing fields and untouched profile fields are preserved during successful edits.

## Uploads and downloads

After unlocking Edit Mode:
- Use the profile image control to upload PNG, JPEG or WebP images up to 2 MiB.
- Use the résumé upload control to upload a complete PDF up to 3 MiB.

Files are validated on the server as well as in the browser. The PDF upload limit leaves room for base64 encoding within the host's request size limit. Truncated GitHub API responses are followed through to their complete raw contents before parsing or decoding.

Without an uploaded résumé, the download uses public/resume.pdf. If an existing uploaded file cannot be retrieved completely, the request reports an error instead of serving a partial file or silently substituting an older résumé.

## Navigation

- Select a node or a navigation item to open its section in 3D mode.
- Camera focus uses the selected node's current world position. Closing the section returns to the previous view, and manual orbiting remains available.
- In Reader mode, section navigation scrolls to and focuses the corresponding section.
- Escape closes the active panel or modal. Modal keyboard focus is contained and returns to the opening control.
- Node buttons and the mobile pipeline control support keyboard activation.

## Validation

Run npm test for the included regression suite.
Run npm run build for the production frontend.

The test suite covers normal and cancelled chat streams, current résumé context, write failures, stale drafts, profile preservation, complete PDF retrieval, upload validation, token expiry, polling races and navigation state.

The regression suite exercises the development API bridge over local HTTP with mocked upstream responses. The separate actual-Vite integration check was blocked by automatic approval review because it could send résumé data to Groq. Browser visual QA and live authenticated provider operations remain unverified.

The 3D/chart bundle still generates Vite's large-chunk advisory. The production build succeeds; code splitting is a future performance improvement.

## Deploy using the existing Vercel architecture

The included vercel.json preserves the Vite frontend plus Node API routes:
- Build command: npm run build
- Static output: dist
- Server endpoints: api/*.js
- Shared server helpers: server/

Set the environment variables on the hosting project. Deploy the complete source folder containing package.json, api, server and src, not just dist.

npm run preview serves only the compiled frontend; it does not run these Node API handlers. Use npm run dev for full local functionality. The included dist folder contains a fresh frontend build.

## Implementation references

- Node HTTP request/response lifetimes: https://nodejs.org/docs/latest-v24.x/api/http.html
- GitHub Gist content and truncation: https://docs.github.com/en/rest/gists/gists
- Vercel payload limits: https://vercel.com/docs/functions/limitations
- Vercel function duration configuration: https://vercel.com/docs/functions/configuring-functions/duration
