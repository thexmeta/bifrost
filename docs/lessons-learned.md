# Lessons Learned - Bifrost Development

## 2026-03-31: Adding New Provider Support

### Provider Integration Checklist

When adding a new provider to Bifrost, update ALL of these locations:

1. **Core Schema** (`core/schemas/bifrost.go`)
   - Add to `ModelProvider` enum
   - Add to `StandardProviders` list
   - Add to `SupportedBaseProviders` list (if it can be used as base for custom providers)

2. **Config Schema** (`transports/config.schema.json`)
   - Add to root `providers` object properties
   - Add to semantic cache plugin enum (if supports embeddings)

3. **Plugin Support** (`plugins/semanticcache/main.go`)
   - Add to `ProvidersWithEmbeddingSupport` map
   - Update error message with new provider name

4. **Helm Charts** (`helm-charts/bifrost/templates/_helpers.tpl`)
   - Update validation error messages

5. **Provider Implementation** (`core/providers/<name>/`)
   - Create provider implementation (or delegate to existing OpenAI-compatible provider)
   - Register in `core/bifrost.go` `createBaseProvider()` function

### Config Structure Gotchas

**CRITICAL:** Bifrost uses TWO different provider sections:

1. **Root `providers`** (OBJECT format):
   ```json
   "providers": {
     "provider-name": {
       "keys": [...],
       "network_config": {...}
     }
   }
   ```
   - Defines actual API connections
   - Must exist BEFORE virtual keys can reference them

2. **`governance.providers`** (ARRAY format):
   ```json
   "governance": {
     "providers": [
       {
         "name": "provider-name",
         "rate_limit_id": "..."
       }
     ]
   }
   ```
   - ONLY for governance settings (rate limits, budgets)
   - References providers defined at root level
   - **DO NOT** put actual provider keys/configs here

**Common Mistake:** Defining providers ONLY in `governance.providers` array causes:
- Foreign key constraint errors (database can't find provider)
- Virtual keys can't route to undefined providers

### Database Foreign Key Issues

When changing provider structure:
1. Delete database files (`config.db`, `config.db-*`)
2. Ensure root `providers` section is complete
3. Restart service - providers load first, then virtual keys

### PowerShell JSON Handling

**WARNING:** PowerShell `ConvertTo-Json` can corrupt complex nested JSON:
- Arrays become `@{...}` string representations
- Loses formatting and structure

**Safe Approach:**
- Always backup config before modifications
- Use Go or Node.js for JSON manipulation when possible
- Test with small configs first

### Build & Deploy Automation

Created `scripts/build-and-deploy.ps1` for reliable deployments:
- Stops Windows Service or process
- Builds with version info
- Deploys to target directory
- Restarts service

**Usage:**
```bash
make build-and-deploy VERSION="my-version"
```

### Schema Validation

Config schema must match binary version:
- Binary includes hardcoded provider lists
- Schema file validates config.json
- Mismatch causes validation errors

**Always:** Copy updated schema to deployment directory after changes:
```bash
copy transports\config.schema.json <deploy-path>\config.schema.json
```
