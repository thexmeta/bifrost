# Active Context - Bifrost

**Last Updated:** 2026-04-10 (Session 004 END)
**Previous:** enterprise-fixes-003 (COMPLETED)

---

## Current Focus

**COMPLETED (Session 004):**
- ✅ Critical fix: Provider update "custom provider validation failed" — strip base_provider_type/is_key_less from standard providers
- ✅ Critical fix: WriteConfigToFile merge logic — preserves existing providers from config.json (prevents data loss)
- ✅ Critical fix: buildConfigDataForFile includes ALL providers from memory
- ✅ Critical fix: UI form schema — base_provider_type optional for standard providers
- ✅ Critical fix: config.json write uses raw JSON merge (not ConfigData round-trip)
- ✅ RBAC MVP: DB tables, ConfigStore CRUD, HTTP API, seed migration (Admin/Editor/Viewer)
- ✅ RBAC middleware implemented (uses X-BF-User-ID header)
- ✅ config.json restored with nvidia-nim provider (5 keys), VKs, rate_limits, plugins, vector_store
- ✅ nvidia-nim provider restored with all 5 keys + streaming enabled

**CURRENT STATE:**
- Service running on port 4000 (manual process, PID 23496)
- nvidia-nim provider: 5 keys, streaming enabled
- VKs: 8 VKs loaded (ChatEngine, CodingEngine, SmallEngine, etc.)
- config.json → DB sync working
- DB → config.json sync working (WriteConfigToFile preserves existing providers)

---

## Active State

### Project Path
- **Root:** `E:\Projects\Go\bifrost`
- **Deploy Path:** `D:\Development\CodeMode\bifrost`
- **Binary:** `D:\Development\CodeMode\bifrost\bifrost-http.exe`

### Service Status
- **Process:** Manual (PID 23496) — Windows Service "Bifrost" exists but was not started
- **Endpoint:** http://localhost:4000
- **UI:** Accessible (localhost:4000)

### Deployed Config
- **Path:** `D:\Development\CodeMode\bifrost\config.json` — nvidia-nim with 5 keys, VKs, plugins, vector_store
- **DB:** `D:\Development\CodeMode\bifrost\config.db` — synced from config.json on startup

### Open Tasks (Priority Order)
- [ ] Re-add lost providers (openrouter, ezif, dashscope, gemini, etc.) via UI
- [ ] Wire RBAC middleware into main middleware chain (needs session auth integration)
- [ ] Add Tool Groups feature
- [ ] Add Guardrails feature
- [ ] Add Adaptive Routing feature
- [ ] WriteConfigToFile: currently preserves existing providers during merge — verify this survives multiple restart cycles

---

## Key Lessons (Added to lessons-learned.md)
1. **NEVER write partial state to config.json** — must merge with existing, not replace
2. **config.json is the source of truth** — DB should reflect config.json on startup, then sync bidirectionally
3. **WriteConfigToFile must preserve ALL existing providers** — even those not currently in memory
4. **Standard providers cannot have base_provider_type/is_key_less** — these are for custom providers only
5. **UI form schema must match backend validation** — both must allow base_provider_type to be optional for standard providers

---

## Scratchpad

### nvidia-nim Provider Config (current)
```json
{
  "nvidia-nim": {
    "keys": [
      { "name": "nim", "value": { "env_var": "env.NVIDIA_NIM_API_KEY", "from_env": true }, "models": ["..."], "weight": 1.0, "enabled": true },
      { "name": "nim-glm5-key", "value": { "env_var": "env.NIM_GLM_API_KEY", "from_env": true }, "models": ["z-ai/glm5"], "weight": 1.0, "enabled": true },
      { "name": "nim-minimax-key", "value": { "env_var": "env.NIM_MINIMAX_API_KEY", "from_env": true }, "models": ["minimaxai/minimax-m2.5"], "weight": 1.0, "enabled": true },
      { "name": "nim-kimi-k2t-key", "value": { "env_var": "env.NIM_KIMIK2T_API_KEY", "from_env": true }, "models": ["moonshotai/kimi-k2-thinking"], "weight": 1.0, "enabled": true },
      { "name": "nim-kimi-k2i-key", "value": { "env_var": "env.NIM_KIMIK2I_API_KEY", "from_env": true }, "models": ["moonshotai/kimi-k2-instruct"], "weight": 1.0, "enabled": true }
    ],
    "network_config": { "base_url": "https://integrate.api.nvidia.com", "default_request_timeout_in_seconds": 120, "max_retries": 5, "retry_backoff_initial": 100, "retry_backoff_max": 5000 },
    "concurrency_and_buffer_size": { "concurrency": 1000, "buffer_size": 5000 },
    "store_raw_request_response": true,
    "custom_provider_config": { "base_provider_type": "openai", "is_key_less": false, "allowed_requests": { "chat_completion": true, "chat_completion_stream": true, "embedding": true, "list_models": true } }
  }
}
```

### Service Start Command
```
"D:\Development\CodeMode\bifrost\bifrost-http.exe" -host 127.0.0.1 -port 4000 -app-dir "D:\Development\CodeMode\bifrost"
```

---

## Resume Command

```bash
cd E:\Projects\Go\bifrost

# Start service (manual)
"D:\Development\CodeMode\bifrost\bifrost-http.exe" -host 127.0.0.1 -port 4000 -app-dir "D:\Development\CodeMode\bifrost"

# Then verify
curl http://localhost:4000/health
curl http://localhost:4000/api/providers/nvidia-nim
```
