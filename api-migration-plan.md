# General imstructions
Here’s a migration plan to consolidate the old api/sync/* + api/v1/* into a single api/v1/* surface with a unified client that handles GET/POST/PUT/DELETE.

## Skill 
- use skill `firefly-project-skill`

## Firefly api 
- Eliminate `/Users/oleksandrkaiukov/Code/budgetbot_tg_mini_app/src/services/firefly` 
- Firefly api not direct use any more. 

## Consilidate
Target shape
- Single base path api/v1 for both Sync and Firefly-style calls.
- One HTTP client that injects headers (Sync: X-Anonymous-Key + X-Telegram-Init-Data;) based on a per-request “auth strategy”. Use skill `firefly-project-skill` nas check `tier 2` auth method.
- Centralized base URL resolution (prod vs dev proxy) and error handling.
Design the shared client
- Add src/services/sync/apiClient.ts exporting request<T>(path, {method, body, auth}) where auth can be sync, firefly, or none.
- Shared behaviors: JSON encode/decode, optional timeout/retry, error mapping, redaction of secrets in logs, support for GET/POST/PUT/DELETE.
- Base URL resolution: reuse logic currently in src/services/sync.ts 
- Header builders:
  - Sync: X-Anonymous-Key + initData
  - Common: Accept: application/json, Content-Type: application/json unless sending FormData.

## Refactor call sites
- src/services/sync.ts: swap direct fetch/getBaseUrl calls to the shared syncClient. Drop duplicated base URL and header code; keep caching logic intact. Ensure GET requests omit body.
- src/utils/fetchUserPhoto.ts and src/utils/fetchUserData.ts: route through syncClient with auth: 'sync'; verify paths updated to /api/v1/tgUser.
- Search for any remaining /api/sync/ usages and update to /api/v1/*. Add a temporary compatibility shim (302/rewrites or server route alias) if needed for rollout.

## Config and routing
- Env: keep VITE_SYNC_API_KEY, VITE_FIREFLY_TOKEN, VITE_BASE_URL (if still used). Add a single VITE_API_BASE_URL if helpful; otherwise derive as now.
- Vite dev proxy and any edge/router configs: ensure /api/v1/** is forwarded correctly; remove /api/sync/** proxy once consumers are migrated.
- Update README/CHANGELOG with the new path scheme and required envs.
- update `/Users/oleksandrkaiukov/.claude/skills/telegram-mini-apps-skill/references/auth.md`


