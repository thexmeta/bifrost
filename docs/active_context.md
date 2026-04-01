# Active Context - Bifrost Enterprise Features

**Last Updated:** 2026-04-02
**Session:** build-deploy-fixes-002 (COMPLETED)
**Previous:** enterprise-features-enablement-001 (COMPLETED)
**Next Session:** enterprise-configuration-002 (Optional - Feature Configuration)

---

## Current Focus

**COMPLETED (Session 002 - Build & Deploy Fixes):**
- ✅ Fixed build script path error (`scripts/build-and-deploy.ps1`)
- ✅ Removed stale go.mod dependency (`transports/go.mod`)
- ✅ Fixed duplicate virtual key name collision (deployed config.json)
- ✅ Rebuilt and redeployed bifrost-http binary
- ✅ Service running on port 4000

**CURRENT STATE:**
- Service is running and healthy on port 4000
- Build script works correctly from scripts/ directory
- All enterprise features accessible from UI dashboard
- No external telemetry or diagnostic calls
- Configuration complete, ready for feature-specific setup

---

## Active State

### Project Path
- **Root:** `E:\Projects\Go\bifrost`
- **Deploy Path:** `D:\Development\CodeMode\bifrost`
- **Binary:** `D:\Development\CodeMode\bifrost\bifrost-http.exe`

### Service Status
- **Name:** Bifrost
- **Status:** Running
- **Version:** plugins/maxim/v1.5.35-14-gaebe93d7-dirty
- **Endpoint:** http://localhost:4000
- **Health:** ✅ OK (no fatal errors in logs)

### Configuration Files
- **Source Config:** `E:\Projects\Go\bifrost\config.json`
  - ✅ `enterprise` section with all features enabled
  - ✅ `is_enterprise: true` in governance plugin
- **Deployed Config:** `D:\Development\CodeMode\bifrost\bifrost-data\config.json`
  - ⚠️ **Diverges from source** - has custom virtual keys and provider configs
  - ✅ Virtual key names are unique (fixed: `vk-tool-engine` → "ToolEngine")
- **Schema:** `E:\Projects\Go\bifrost\transports\config.schema.json`
  - ✅ `enterprise_config` definition added (~400 lines)

### Build State
- **UI Mode:** Enterprise (forced in `next.config.ts`)
- **Binary:** Embedded UI included
- **Last Build:** 2026-04-02
- **Build Script:** `scripts/build-and-deploy.ps1` (fixed path issue)

### Go Modules
- **Workspace:** Go 1.26.1 (`go.work`)
- **Modules:** core, framework, transports, plugins/*
- **Last Tidy:** 2026-04-02 (removed stale nvidia dependency)

---

## Scratchpad

### Lessons Learned (2026-04-02)

#### 1. Build Script Path Resolution
Scripts running from subdirectories must use relative paths correctly:
```powershell
# WRONG (from scripts/ directory)
$BuildDir = "transports\bifrost-http"

# CORRECT
$BuildDir = "..\transports\bifrost-http"
```

#### 2. Go Module Indirect Dependencies
Watch for stale indirect dependencies in `go.mod`. If you see:
```
github.com/maximhq/bifrost/core/providers/nvidia v0.0.0 // indirect
```
But the actual provider is `nvidianim`, remove it and run `go mod tidy`.

#### 3. Virtual Key Name Uniqueness
Virtual keys must have unique `name` fields (not just unique `id`):
```json
// ❌ CONFLICT - same name, different IDs
{"id": "vk-tool-engine", "name": "EmbedEngine"}
{"id": "vk-embeddding-engine", "name": "EmbedEngine"}

// ✅ FIXED - unique names
{"id": "vk-tool-engine", "name": "ToolEngine"}
{"id": "vk-embeddding-engine", "name": "EmbedEngine"}
```

### Deployed Config Virtual Keys
```
vk-chat-engine|ChatEngine
vk-coding-engine|CodingEngine
vk-small-engine|SmallEngine
vk-tool-engine|ToolEngine         ← Fixed from "EmbedEngine"
vk-embeddding-engine|EmbedEngine
vk-code-embeddding-engine|CodeEmbedEngine
vk-gemini-researcher|Gemini Grounded Research
```
```bash
# SSO
SSO_ISSUER=https://your-org.okta.com/oauth2/default
SSO_CLIENT_ID=your-client-id
SSO_CLIENT_SECRET=your-client-secret

# Vault
VAULT_ADDR=https://vault.your-domain.com
VAULT_TOKEN=hvs.your-token

# Datadog
DATADOG_API_KEY=your-api-key
DATADOG_APP_KEY=your-app-key

# Log Exports
LOG_EXPORT_BUCKET=your-s3-bucket

# Guardrails
PATRONUS_API_KEY=your-patronus-key
AZURE_CONTENT_SAFETY_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
```

### Quick Test Commands
```powershell
# Health check
Invoke-RestMethod http://localhost:4000/health

# Test enterprise page access
Invoke-WebRequest http://localhost:4000/workspace/sso
Invoke-WebRequest http://localhost:4000/workspace/vault
Invoke-WebRequest http://localhost:4000/workspace/datadog
```

---

## Open Tasks

### Completed ✅ (Session 001 - Enterprise Features)
- [x] Enable all enterprise features in config.json
- [x] Add enterprise_config to config.schema.json
- [x] Create UI pages for all enterprise features
- [x] Update sidebar navigation
- [x] Disable all external telemetry
- [x] Rebuild UI with enterprise mode
- [x] Rebuild Go binary with embedded UI
- [x] Deploy and verify service health
- [x] Document all changes

### Completed ✅ (Session 002 - Build & Deploy Fixes)
- [x] Fix build script path error (`scripts/build-and-deploy.ps1`)
- [x] Remove stale go.mod dependency (`transports/go.mod`)
- [x] Fix duplicate virtual key name collision
- [x] Rebuild and redeploy bifrost-http binary
- [x] Verify service running on port 4000

### Next Session (Optional)
- [ ] Configure SSO with Okta/Entra ID
- [ ] Set up Vault integration
- [ ] Configure Datadog integration
- [ ] Set up log exports to S3
- [ ] Test guardrails with actual providers
- [ ] Configure clustering for HA
- [ ] Add user documentation/screenshots
- [ ] Sync deployed config changes back to source control
- [ ] Add validation for duplicate virtual key names in config schema

---

## Code Changes Summary

### Files Created (16 UI pages + docs):
1. `ui/app/workspace/mcp-tool-groups/page.tsx`
2. `ui/app/workspace/mcp-auth-config/page.tsx`
3. `ui/app/workspace/scim/page.tsx`
4. `ui/app/workspace/governance/rbac/page.tsx`
5. `ui/app/workspace/governance/users/page.tsx`
6. `ui/app/workspace/audit-logs/page.tsx`
7. `ui/app/workspace/guardrails/page.tsx`
8. `ui/app/workspace/guardrails/providers/page.tsx`
9. `ui/app/workspace/guardrails/configuration/page.tsx`
10. `ui/app/workspace/cluster/page.tsx`
11. `ui/app/workspace/adaptive-routing/page.tsx`
12. `ui/app/workspace/prompt-repo/deployments/page.tsx`
13. `ui/app/workspace/sso/page.tsx`
14. `ui/app/workspace/vault/page.tsx`
15. `ui/app/workspace/datadog/page.tsx`
16. `ui/app/workspace/log-exports/page.tsx`
17. `docs/ENTERPRISE_FEATURES_CONFIGURED.md`
18. `docs/session_summary.md`

### Files Modified:
1. `config.json` - Enterprise configuration
2. `transports/config.schema.json` - Schema definition
3. `ui/next.config.ts` - Enterprise mode flag
4. `ui/components/sidebar.tsx` - Navigation
5. `ui/lib/types/config.ts` - Type definition
6. `cli/internal/update/check.go` - Telemetry disable
7. `transports/bifrost-http/lib/validator.go` - Telemetry disable
8. `ui/lib/store/apis/configApi.ts` - Telemetry disable

### Lines of Code:
- **Added:** ~1,500 lines
- **Modified:** ~20 lines
- **Tests:** Manual verification complete

---

## Resume Command

```bash
cd E:\Projects\Go\bifrost

# Check service status
powershell -Command "Get-Service Bifrost | Select-Object Name, Status"

# Test health endpoint
curl http://localhost:4000/health

# Continue with enterprise feature configuration
# Start with SSO setup, Vault integration, or Datadog configuration
```

---

## Session Handoff Notes

**For Next AI Agent:**
1. All enterprise features are ENABLED and ACCESSIBLE
2. No license gate messages appear anymore
3. External telemetry is DISABLED (offline mode)
4. Service is RUNNING and HEALTHY on port 4000
5. Build script fixed and tested - use `scripts/build-and-deploy.ps1`
6. Virtual key names must be unique (fixed: `vk-tool-engine` → "ToolEngine")

**Key Files to Reference:**
- `docs/session_summary.md` - Full session summary (both sessions 001 & 002)
- `docs/active_context.md` - This file (current state)
- `docs/ENTERPRISE_FEATURES_CONFIGURED.md` - Enterprise features documentation
- `scripts/build-and-deploy.ps1` - Working build/deploy script
- `config.json` - Source configuration
- `D:\Development\CodeMode\bifrost\bifrost-data\config.json` - Deployed config (diverges)

**Critical Notes:**
- Deployed config has custom virtual keys - sync back to source if needed
- Virtual key `name` field must be unique (database constraint)
- Build script must use `..\transports\bifrost-http` (relative from scripts/)
