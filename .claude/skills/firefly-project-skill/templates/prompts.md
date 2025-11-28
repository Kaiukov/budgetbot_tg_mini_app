# Prompt Templates

Use these templates to quickly generate code or documentation using the Firefly Project Skill.

## 1. Generate API Client Method

**Goal:** Create a TypeScript function to call a specific endpoint.

**Prompt:**
```markdown
Create a TypeScript function to call the [ENDPOINT_NAME] endpoint.
- Use the `ApiResponse` interface from `templates/types.ts`.
- Handle authentication headers based on Tier [TIER_NUMBER].
- Include error handling for common status codes.
```

## 2. Debug Sync Issue

**Goal:** Troubleshoot a failed synchronization.

**Prompt:**
```markdown
I'm seeing a sync error for [SYNC_TYPE].
- Check the `reference/02-sync-endpoints.md` documentation.
- Review the `reference/09-error-handling.md` for common error codes.
- Suggest a curl command to manually trigger the sync and inspect the output.
```

## 3. Create New Report View

**Goal:** Design a new database view for analytics.

**Prompt:**
```markdown
I need a new view to track [METRIC_NAME].
- Reference the existing schema in `reference/05-database-views.md`.
- Use the `transactions` table as the source.
- Follow the pattern of `accounts_usage_view` (CTE-based).
```

## 4. Update Documentation

**Goal:** Add a new endpoint to the documentation.

**Prompt:**
```markdown
I've added a new endpoint `[METHOD] [PATH]`.
- Update `reference/03-get-endpoints.md` (or appropriate file).
- Follow the standard format: Description, Endpoint, Parameters, Example, Response.
- Add it to the index in `SKILL.md`.
```
