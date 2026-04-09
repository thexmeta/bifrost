# Active Context - Bifrost Enterprise Features

**Last Updated:** 2026-04-09
**Session:** enterprise-fixes-003 (COMPLETED)
**Previous:** build-deploy-fixes-002 (COMPLETED), enterprise-features-enablement-001 (COMPLETED)

---

## Current Focus

**COMPLETED (Session 003 - Enterprise Fixes & Multi-Model VK Bug):**
- ✅ Critical fix: `isModelAllowed()` now checks ALL provider configs (not just first match)
- ✅ Fixed RBAC page: functional config page with toggle/role/save
- ✅ Fixed Log Exports: storage type selector (S3/GCS/Azure) now rendered
- ✅ Fixed Vault page: uses enterprise config API instead of plugin API
- ✅ Fixed Datadog page: uses enterprise config API instead of plugin API
- ✅ Added enterprise config persistence to DB (GetEnterpriseConfig/UpdateEnterpriseConfig)
- ✅ Updated config handler GET/PUT endpoints for enterprise config
- ✅ Fixed @enterprise webpack alias → _fallbacks/enterprise
- ✅ Fixed cross-platform copy-build.js script
- ✅ Added Go unit tests (8 tests across 2 files)
- ✅ Added React unit tests (32 tests across 4 files)
- ✅ Deployed version with all fixes: service running on port 4000

**CURRENT STATE:**
- Service running on port 4000, UI accessible
- Enterprise features persist via `/api/config` PUT endpoint
- All UI pages functional (RBAC, Log Exports, Vault, Datadog)
- Multi-model VK bug fixed — VKs with multiple provider configs per provider now work

---

## Active State

### Project Path
- **Root:** `E:\Projects\Go\bifrost`
- **Deploy Path:** `D:\Development\CodeMode\bifrost`
- **Binary:** `D:\Development\CodeMode\bifrost\bifrost-http.exe`

### Service Status
- **Name:** Bifrost (Windows Service via Servy)
- **Status:** Running
- **Endpoint:** http://localhost:4000
- **UI:** ✅ Accessible (localhost:4000)

### Deployed Config
- **Path:** `D:\Development\CodeMode\bifrost\bifrost-data\config.json`
- Enterprise section with RBAC, SSO, Vault, Datadog, Log Exports, Guardrails
- ⚠️ VKs have provider configs but NO `"keys"` arrays — need to be added
- Virtual keys: vk-chat-engine, vk-coding-engine, vk-small-engine, vk-tool-engine, vk-embeddding-engine, vk-code-embeddding-engine, vk-gemini-researcher

### Key Files Modified (Session 003)
1. `plugins/governance/resolver.go` — isModelAllowed multi-config fix
2. `ui/app/workspace/governance/rbac/page.tsx` — functional RBAC page
3. `ui/app/workspace/log-exports/page.tsx` — storage type selector
4. `ui/app/workspace/vault/page.tsx` — enterprise config API
5. `ui/app/workspace/datadog/page.tsx` — enterprise config API
6. `ui/next.config.ts` — @enterprise alias fix
7. `ui/package.json` — cross-platform copy-build.js
8. `ui/scripts/copy-build.js` — new cross-platform script
9. `framework/configstore/store.go` — enterprise config interface
10. `framework/configstore/rdb.go` — enterprise config implementation
11. `transports/bifrost-http/handlers/config.go` — enterprise config endpoints

### Tests Added
- `framework/configstore/enterprise_config_test.go` (5 tests)
- `transports/bifrost-http/handlers/enterprise_config_test.go` (3 tests)
- `ui/app/workspace/governance/rbac/page.test.tsx` (7 tests)
- `ui/app/workspace/log-exports/page.test.tsx` (7 tests)
- `ui/app/workspace/vault/page.test.tsx` (8 tests)
- `ui/app/workspace/datadog/page.test.tsx` (10 tests)

---

## Scratchpad

### Virtual Key Config Format (for config.json)
```json
{
  "governance": {
    "virtual_keys": [{
      "id": "vk-coding-engine",
      "name": "CodingEngine",
      "provider_configs": [
        {
          "provider": "nvidia-nim",
          "weight": 1.0,
          "allowed_models": ["qwen/qwen3-coder-480b-a35b-instruct"],
          "keys": [{
            "name": "nim-main",
            "value": "env.NVIDIA_NIM_API_KEY",
            "models": ["*"],
            "weight": 1.0
          }]
        }
      ]
    }]
  }
}
```
Each provider config needs its own `"keys"` array or it will pass model checks but fail with "no keys found".

### Direct Key Mode (No VKs)
```json
"client_config": { "allow_direct_keys": true }
```
Then pass provider API key via `Authorization: Bearer <key>` header.

### No-Auth Mode (Auto-select from provider keys)
Just call the API without any auth headers. Bifrost auto-selects from `providers.<name>.keys`.

---

## Open Tasks

### Completed ✅ (Session 003)
- [x] Fix isModelAllowed multi-config bug
- [x] Fix RBAC page UI
- [x] Fix Log Exports storage type selector
- [x] Fix Vault config path (plugin → enterprise)
- [x] Fix Datadog config path (plugin → enterprise)
- [x] Add enterprise config backend (Get/Update)
- [x] Fix @enterprise webpack alias
- [x] Add cross-platform copy-build.js
- [x] Create Go unit tests (8 tests)
- [x] Create React unit tests (32 tests)
- [x] Deploy all fixes to production

### Open / Next Session
- [ ] Add `"keys"` arrays to VK provider configs in config.json (or via UI)
- [ ] Test VK with keys end-to-end
- [ ] Consider adding SSO OAuth callback handler stub
- [ ] Consider adding config validation for VK keys
- [ ] Consider adding isModelAllowed unit test for multi-config case

---

## Resume Command

```bash
cd E:\Projects\Go\bifrost

# Check service
sc query Bifrost

# Test endpoint
curl http://localhost:4000/health

# Continue: add keys to VK provider configs or test direct key mode
```
