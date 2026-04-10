# Lessons Learned

## Config File Management (2026-04-10)

### Critical: WriteConfigToFile Must Merge, Not Replace
**What happened:** `WriteConfigToFile()` dumped only in-memory providers to config.json, overwriting all existing providers. On restart, the DB synced to match the truncated config.json, permanently losing all providers that weren't loaded.

**Fix:** WriteConfigToFile now:
1. Reads existing config.json to get current providers
2. Marshals in-memory providers
3. Merges: new values override, but **existing providers not in memory are preserved**
4. Atomic write (temp file + rename)

**Rule:** Never write partial state to config.json. Always merge with existing content.

### Standard Providers: No base_provider_type in custom_provider_config
Standard providers (nvidia-nim, openai, etc.) cannot have `base_provider_type` or `is_key_less` in their `custom_provider_config`. Only `allowed_requests` is allowed. Both backend validation and UI form schema must enforce this.

### UI Form Schema Must Match Backend Validation
`formCustomProviderConfigSchema` in `ui/lib/types/schemas.ts` required `base_provider_type` (min 1 char). Backend accepted empty strings for standard providers. This mismatch caused the UI Save button to be permanently disabled. Both must agree: `base_provider_type` is optional for standard providers.

### config.json Write Must Use Raw JSON, Not ConfigData Round-Trip
ConfigData's custom `UnmarshalJSON` mutates data (env var processing, type coercion). Using it for WriteConfigToFile caused corruption. Fix: use `map[string]any` merge with raw JSON marshaling.

## Provider Lifecycle (2026-04-10)

### Two-Way Sync: config.json ↔ DB
- **Startup:** config.json → in-memory → DB (load from file, sync to DB)
- **UI change:** in-memory + DB updated → WriteConfigToFile() writes to config.json
- **Merge:** WriteConfigToFile preserves existing providers from config.json that aren't in memory
- **Never** truncate providers during WriteConfigToFile

### Provider Keys Use Env Var References
Keys should use `{ "value": "", "env_var": "env.VAR_NAME", "from_env": true }` format. Raw values in config.json are insecure.
