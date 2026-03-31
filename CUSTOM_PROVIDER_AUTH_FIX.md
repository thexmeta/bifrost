# Fix for Custom Provider Authorization Header Issue

## Problem

When configuring a custom provider with `base_provider_type:"openai"` pointing to an OpenAI-compatible API (e.g., NVIDIA NIM), Bifrost was not forwarding the `Authorization: Bearer <key>` header to the upstream API, resulting in `404 page not found` errors.

## Root Cause Analysis

After extensive investigation, the code for setting the Authorization header in `core/providers/openai/openai.go` is correct:

```go
if key.Value.GetValue() != "" {
    req.Header.Set("Authorization", "Bearer "+key.Value.GetValue())
}
```

The issue occurs when `key.Value.GetValue()` returns an empty string. This can happen in several scenarios:

1. **Key not properly configured**: The API key value was not set correctly when creating the custom provider
2. **Environment variable resolution failure**: If the key value uses `env.VARIABLE_NAME` syntax and the environment variable is not set
3. **Config persistence issue**: The key value was not properly saved or retrieved from the config store
4. **Redacted key value**: When updating a provider, key values are redacted for security. If the frontend sends the redacted value back instead of preserving the original, the key becomes invalid.

## Solution

Added validation and clear error messages to help diagnose authentication issues with custom providers:

### Changes Made

1. **Added validation in `HandleOpenAIChatCompletionRequest`** - Returns a clear error when a non-keyless custom provider is missing an API key value.

2. **Added test coverage** - New test cases verify that custom providers correctly handle API key configuration.

### Files Modified

- `core/providers/openai/openai.go` - Added validation for missing API keys in custom providers
- `core/providers/openai/custom_provider_auth_test.go` - New test file with validation tests

### Testing

Added test cases in `core/providers/openai/custom_provider_auth_test.go`:
- `TestCustomProviderAuthHeader` - Verifies Authorization header is set correctly
- `TestCustomProviderConfigPropagation` - Verifies CustomProviderConfig is properly stored

## Verification Steps

To verify the fix works:

1. Create a custom provider:
```bash
curl -X POST http://bifrost:14000/api/providers \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "nvidia",
    "keys": [{
      "name": "nvidia-key-1",
      "value": "<NVIDIA_API_KEY>",
      "models": ["llama-3.3-nemotron-super-49b-v1"],
      "weight": 1,
      "enabled": true
    }],
    "network_config": {
      "base_url": "https://integrate.api.nvidia.com",
      "default_request_timeout_in_seconds": 120
    },
    "custom_provider_config": {
      "is_key_less": false,
      "base_provider_type": "openai"
    },
    "provider_status": "active"
  }'
```

2. Send a chat completion request:
```bash
curl -X POST http://bifrost:14000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"nvidia/llama-3.3-nemotron-super-49b-v1","messages":[{"role":"user","content":"OK"}],"max_tokens":5}'
```

3. If the API key is missing, you should now receive a clear error message:
```json
{
  "status_code": 400,
  "error": {
    "message": "API key is required for this custom provider but no key value was found. Please verify the provider configuration includes a valid API key."
  }
}
```

## Common Issues and Solutions

### Issue 1: Key Value Not Persisted

**Symptom**: After creating a custom provider, requests fail with 404 errors.

**Solution**: Verify the key was saved correctly:
```bash
curl http://bifrost:14000/api/providers/nvidia | jq '.keys[] | {name, value}'
```

The `value` field should show your API key (or `env.VARIABLE_NAME` if using environment variables).

### Issue 2: Environment Variable Not Set

**Symptom**: Key value shows `env.NVIDIA_API_KEY` but requests fail.

**Solution**: Ensure the environment variable is set in the Bifrost container:
```bash
docker exec -it <container> env | grep NVIDIA_API_KEY
```

If not set, restart the container with the environment variable:
```bash
docker run -e NVIDIA_API_KEY=your-key-here ...
```

### Issue 3: Updating Provider Loses Key Value

**Symptom**: After updating a provider config, authentication fails.

**Solution**: When updating a provider, the API returns redacted key values (e.g., `sk-****...`). Do NOT send these redacted values back in update requests. Either:
- Omit the `keys` field entirely (preserves existing keys)
- Send the full, unredacted key values for any keys you want to update

## Additional Notes

- The `/v1` path should **not** be included in the `base_url` configuration, as Bifrost automatically appends it for OpenAI-compatible providers
- Custom providers are automatically registered as known providers when created, allowing model strings like `nvidia/model-name` to be parsed correctly
- If using environment variables for API keys (e.g., `"value": "env.NVIDIA_API_KEY"`), ensure the environment variable is set in the Bifrost container
