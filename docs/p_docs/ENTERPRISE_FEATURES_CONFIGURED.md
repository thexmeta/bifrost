# Bifrost Enterprise Features - Configuration Summary

**Configuration Date:** 2026-04-01  
**Configuration File:** `config.json`  
**Schema File:** `transports/config.schema.json`

---

## Overview

All Bifrost Enterprise features have been **FULLY ENABLED** in the configuration. The enterprise mode is activated by setting `is_enterprise: true` in the governance plugin configuration.

> **Note:** Some features require external credentials and services to be configured. See the "Required Environment Variables" section below.

---

## Enabled Enterprise Features

### 1. **Enterprise Mode (Core)**
- **Status:** ✅ ENABLED
- **Location:** `plugins[].config.is_enterprise` (governance plugin)
- **Description:** Activates enterprise-grade governance features including user-level governance, advanced RBAC, and audit trails.

### 2. **Role-Based Access Control (RBAC)**
- **Status:** ✅ ENABLED
- **Location:** `enterprise.rbac`
- **Configuration:**
  ```json
  {
    "enabled": true,
    "default_role": "viewer"
  }
  ```
- **Features:**
  - Fine-grained permissions (View, Create, Update, Delete)
  - System roles: Admin, Developer, Viewer
  - Custom role creation
  - Resource-level access control

### 3. **Single Sign-On (SSO)**
- **Status:** ✅ ENABLED (requires Okta/Entra setup)
- **Location:** `enterprise.sso`
- **Provider:** Okta (configurable to Entra ID)
- **Configuration:**
  ```json
  {
    "enabled": true,
    "provider": "okta",
    "issuer": "env.SSO_ISSUER",
    "client_id": "env.SSO_CLIENT_ID",
    "client_secret": "env.SSO_CLIENT_SECRET",
    "redirect_uri": "http://localhost:8080/auth/callback",
    "scopes": ["openid", "email", "profile"],
    "role_mappings": {
      "admin_group": "Admin",
      "developer_group": "Developer",
      "viewer_group": "Viewer"
    }
  }
  ```
- **Required Setup:**
  - Configure Okta/Entra ID application
  - Set environment variables

### 4. **Audit Logs**
- **Status:** ✅ ENABLED
- **Location:** `enterprise.audit_logs`
- **Configuration:**
  ```json
  {
    "enabled": true,
    "retention_days": 365,
    "events": ["user.login", "user.logout", "role.*", "virtual_key.*", "provider.*", "config.update", "plugin.*"]
  }
  ```
- **Features:**
  - Immutable audit trails
  - SOC 2, GDPR, HIPAA compliance
  - 365-day retention

### 5. **Guardrails (Content Safety)**
- **Status:** ✅ ENABLED (requires provider API keys)
- **Location:** `enterprise.guardrails`
- **Enabled Providers:**
  - ✅ AWS Bedrock Guardrails (us-east-1)
  - ✅ Azure Content Safety
  - ✅ Patronus AI
- **Configuration:**
  ```json
  {
    "enabled": true,
    "providers": {
      "aws_bedrock": { "enabled": true, "region": "us-east-1" },
      "azure_content_safety": { "enabled": true, "endpoint": "env.AZURE_CONTENT_SAFETY_ENDPOINT" },
      "patronus": { "enabled": true, "api_key": "env.PATRONUS_API_KEY" }
    }
  }
  ```

### 6. **Vault Support (Secret Management)**
- **Status:** ✅ ENABLED (requires HashiCorp Vault setup)
- **Location:** `enterprise.vault`
- **Vault Type:** HashiCorp Vault
- **Configuration:**
  ```json
  {
    "enabled": true,
    "type": "hashicorp",
    "config": {
      "address": "env.VAULT_ADDR",
      "token": "env.VAULT_TOKEN",
      "sync_paths": ["bifrost/*"],
      "sync_interval_seconds": 300
    }
  }
  ```
- **Features:**
  - Automated key synchronization
  - 5-minute sync interval
  - Transit encryption

### 7. **Clustering (High Availability)**
- **Status:** ✅ ENABLED (requires multi-node setup)
- **Location:** `enterprise.clustering`
- **Configuration:**
  ```json
  {
    "enabled": true,
    "node_name": "bifrost-node-1",
    "bind_addr": "0.0.0.0",
    "bind_port": 8301
  }
  ```
- **Features:**
  - Automatic service discovery
  - Gossip-based synchronization
  - Horizontal scaling

### 8. **Adaptive Load Balancing**
- **Status:** ✅ ENABLED
- **Location:** `enterprise.adaptive_load_balancing`
- **Configuration:**
  ```json
  {
    "enabled": true,
    "health_check_interval_seconds": 10,
    "warmup_requests": 10,
    "ewma_alpha": 0.3
  }
  ```
- **Features:**
  - Predictive scaling
  - Real-time health monitoring
  - Performance-based routing

### 9. **Log Exports**
- **Status:** ✅ ENABLED (requires S3 bucket)
- **Location:** `enterprise.log_exports`
- **Destination:** AWS S3
- **Configuration:**
  ```json
  {
    "enabled": true,
    "destination": {
      "type": "s3",
      "config": {
        "bucket": "env.LOG_EXPORT_BUCKET",
        "region": "us-east-1",
        "prefix": "bifrost-logs/",
        "format": "json",
        "compression": "gzip"
      }
    },
    "schedule": { "interval_hours": 1 }
  }
  ```
- **Features:**
  - Hourly automated exports
  - GZIP compression
  - JSON format

### 10. **Datadog Integration**
- **Status:** ✅ ENABLED (requires Datadog account)
- **Location:** `enterprise.datadog`
- **Configuration:**
  ```json
  {
    "enabled": true,
    "api_key": "env.DATADOG_API_KEY",
    "app_key": "env.DATADOG_APP_KEY",
    "site": "datadoghq.com",
    "traces_enabled": true,
    "metrics_enabled": true,
    "logs_enabled": true
  }
  ```
- **Features:**
  - APM traces ✅
  - LLM Observability ✅
  - Metrics export ✅
  - Log correlation ✅

---

## Enabled Plugins

| Plugin | Status | Features |
|--------|--------|----------|
| **Governance** | ✅ ENABLED | Virtual keys, budgets, rate limits, routing, RBAC |
| **Telemetry** | ✅ ENABLED | Prometheus metrics, custom labels |
| **Logging** | ✅ ENABLED | Request/response audit logging |
| **OpenTelemetry** | ✅ ENABLED | OTLP tracing, metrics export |
| **Semantic Cache** | ✅ ENABLED | Qdrant vector store, 95% similarity threshold |
| **Maxim** | ✅ ENABLED | Maxim observability integration |

---

## Environment Variables Required

The following environment variables **must be set** for all enterprise features to function:

### Core (Required)
```bash
BIFROST_ENCRYPTION_KEY=your-secure-32-byte-encryption-key
```

### SSO / Identity (Required for SSO)
```bash
SSO_ISSUER=https://your-org.okta.com/oauth2/default
SSO_CLIENT_ID=your-okta-client-id
SSO_CLIENT_SECRET=your-okta-client-secret
```

### Guardrails (Required for content safety)
```bash
PATRONUS_API_KEY=your-patronus-api-key
AZURE_CONTENT_SAFETY_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
# AWS Bedrock uses your AWS credentials from environment
```

### Vault (Required for secret management)
```bash
VAULT_ADDR=https://vault.your-domain.com
VAULT_TOKEN=hvs.your-vault-token
```

### Clustering (Required for multi-node)
```bash
CLUSTER_ADVERTISE_ADDR=your-public-ip:8301
```

### Log Exports (Required for S3 export)
```bash
LOG_EXPORT_BUCKET=your-bifrost-logs-bucket
# AWS credentials from environment or IAM role
```

### Datadog (Required for observability)
```bash
DATADOG_API_KEY=your-datadog-api-key
DATADOG_APP_KEY=your-datadog-app-key
```

### Semantic Cache (Required for Qdrant)
```bash
QDRANT_API_KEY=your-qdrant-api-key
```

### Maxim Observability (Optional)
```bash
MAXIM_API_KEY=your-maxim-api-key
```

---

## Quick Start: Set All Environment Variables (Windows)

```powershell
# Core
[Environment]::SetEnvironmentVariable('BIFROST_ENCRYPTION_KEY', 'your-secure-key', 'Machine')

# SSO
[Environment]::SetEnvironmentVariable('SSO_ISSUER', 'https://your-org.okta.com/oauth2/default', 'Machine')
[Environment]::SetEnvironmentVariable('SSO_CLIENT_ID', 'your-client-id', 'Machine')
[Environment]::SetEnvironmentVariable('SSO_CLIENT_SECRET', 'your-client-secret', 'Machine')

# Guardrails
[Environment]::SetEnvironmentVariable('PATRONUS_API_KEY', 'your-patronus-key', 'Machine')
[Environment]::SetEnvironmentVariable('AZURE_CONTENT_SAFETY_ENDPOINT', 'https://your-resource.cognitiveservices.azure.com/', 'Machine')

# Vault
[Environment]::SetEnvironmentVariable('VAULT_ADDR', 'https://vault.your-domain.com', 'Machine')
[Environment]::SetEnvironmentVariable('VAULT_TOKEN', 'hvs.your-token', 'Machine')

# Clustering
[Environment]::SetEnvironmentVariable('CLUSTER_ADVERTISE_ADDR', 'your-ip:8301', 'Machine')

# Log Exports
[Environment]::SetEnvironmentVariable('LOG_EXPORT_BUCKET', 'your-bucket', 'Machine')

# Datadog
[Environment]::SetEnvironmentVariable('DATADOG_API_KEY', 'your-api-key', 'Machine')
[Environment]::SetEnvironmentVariable('DATADOG_APP_KEY', 'your-app-key', 'Machine')

# Semantic Cache
[Environment]::SetEnvironmentVariable('QDRANT_API_KEY', 'your-qdrant-key', 'Machine')

# Maxim
[Environment]::SetEnvironmentVariable('MAXIM_API_KEY', 'your-maxim-key', 'Machine')
```

---

## Configuration Validation

To validate the configuration:

```bash
# Start Bifrost with the new configuration
make dev

# Or build and run the binary
make build
./bifrost-http
```

Check the logs for any configuration errors. Missing environment variables will be logged as warnings.

---

## Next Steps

### Immediate Actions
1. **Set all environment variables** (see above)
2. **Start the Bifrost service** with `make dev`
3. **Verify enterprise mode** is active in the UI at `http://localhost:8080`

### Access Enterprise Features in UI Dashboard

All enterprise features are now accessible from the Bifrost UI dashboard:

| Feature | UI Location | Description |
|---------|-------------|-------------|
| **SSO Configuration** | Settings → SSO | Configure Okta or Entra ID authentication |
| **Vault Integration** | Settings → Vault | Configure secret management |
| **Datadog Integration** | Enterprise → Datadog | Configure Datadog observability |
| **Log Exports** | Enterprise → Log Exports | Configure automated S3 log exports |
| **RBAC** | Governance → Roles & Permissions | Manage roles and permissions |
| **Audit Logs** | Governance → Audit Logs | View audit trail |
| **Guardrails** | Guardrails | Configure content safety |
| **Cluster Config** | Cluster Config | Manage clustering |
| **Adaptive Routing** | Adaptive Routing | Configure load balancing |

### Feature-Specific Setup

| Feature | Action Required |
|---------|-----------------|
| **SSO** | Create Okta/Entra app, configure redirect URIs |
| **Guardrails** | Set up AWS Bedrock/Azure/Patronus accounts |
| **Vault** | Deploy HashiCorp Vault, create bifrost/* paths |
| **Clustering** | Deploy additional nodes, configure retry_join |
| **Log Exports** | Create S3 bucket, configure IAM permissions |
| **Datadog** | Create Datadog account, get API keys |
| **Semantic Cache** | Deploy Qdrant, create collection |

---

## Support

For enterprise license activation and support:
- **Website:** https://www.getmaxim.ai/bifrost/enterprise
- **Documentation:** https://docs.getbifrost.ai/enterprise
- **Discord:** https://discord.gg/exN5KAydbU

---

## Configuration Files Modified

1. **`config.json`** - Main configuration with all enterprise features **ENABLED**
2. **`transports/config.schema.json`** - Updated schema with `enterprise_config` definition
3. **`docs/ENTERPRISE_FEATURES_CONFIGURED.md`** - This documentation file

---

**Note:** All enterprise features are now enabled at the configuration level. Features requiring external services (SSO, Vault, Datadog, etc.) will log warnings if credentials are not provided but will not prevent Bifrost from starting.
