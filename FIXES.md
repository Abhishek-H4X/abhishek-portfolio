# Fixes included

- Removed the exposed credential from the working project and distributable package. The original key still needs to be revoked by the account owner.
- Reinstalled dependencies for the build environment and excluded node_modules from the final archive.
- Corrected SSE cancellation: healthy request completion no longer aborts the response; an actual response disconnect cancels upstream AI work.
- Added explicit handling for incomplete, empty and failed chat replies.
- Centralized résumé loading for the website, AI chat and job matching. When a configured live source fails, the AI asks the visitor to retry instead of answering from outdated defaults.
- Made live/static/offline status reflect the actual data source and retained the last successful browser snapshot on failures.
- Prevented résumé saves and asset uploads from overwriting content after failed, missing or invalid Gist reads.
- Preserved untouched fields during saves and added revision checks for stale drafts.
- Kept editor drafts separate from polling data and protected confirmed saves from older in-flight refreshes.
- Fetch complete raw Gist files when API content is truncated; validate PDF structure before delivering it.
- Align PDF upload limits with encoded request size and validate file contents server-side.
- Hardened editor token verification and supplied a complete environment template.
- Connected Reader navigation to real section targets.
- Connected camera focus to live node positions and restored the prior view when a section closes.
- Added Escape handling, dialog focus management and keyboard activation for nodes and mobile controls.
- Added visible save/upload errors and corrected the native cursor fallback.
- Preserved the current visual theme, résumé content, legacy source files and existing feature set.

## Validation record

- Regression suite: 19 tests.
- Fresh production build: successful.
- Local HTTP API bridge: verified using mocked provider responses.\n- Separate actual-Vite integration check: blocked by automatic approval review because of possible résumé transmission to Groq.
- Browser visual QA: unavailable in this environment.
- Live provider operations: require the owner's new credentials and configuration.
