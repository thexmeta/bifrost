package handlers

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/valyala/fasthttp"
)

func TestEnterpriseConfig_UpdateConfigReturnsErrorWhenStoreNotInitialized(t *testing.T) {
	ctx := &fasthttp.RequestCtx{}
	ctx.Request.SetBody([]byte(`{"enterprise":{"rbac":{"enabled":true}}}`))

	handler := &ConfigHandler{store: nil}
	handler.updateConfig(ctx)

	assert.Equal(t, fasthttp.StatusInternalServerError, ctx.Response.StatusCode())
}

func TestEnterpriseConfig_MarshalsToJSON(t *testing.T) {
	config := map[string]any{
		"rbac": map[string]any{
			"enabled":      true,
			"default_role": "viewer",
		},
		"vault": map[string]any{
			"enabled":              true,
			"type":                 "hashicorp",
			"address":              "https://vault.example.com",
			"sync_interval_seconds": 300,
		},
		"datadog": map[string]any{
			"enabled":        true,
			"api_key":        "test-key",
			"site":           "datadoghq.com",
			"send_traces":    true,
			"send_metrics":   true,
		},
		"log_exports": map[string]any{
			"enabled": false,
			"destination": map[string]any{
				"type": "s3",
				"config": map[string]any{
					"bucket": "my-bucket",
					"region": "us-east-1",
				},
			},
		},
	}

	data, err := json.Marshal(config)
	assert.NoError(t, err)

	var decoded map[string]any
	err = json.Unmarshal(data, &decoded)
	assert.NoError(t, err)

	rbac, ok := decoded["rbac"].(map[string]any)
	assert.True(t, ok)
	assert.Equal(t, true, rbac["enabled"])
	assert.Equal(t, "viewer", rbac["default_role"])

	vault, ok := decoded["vault"].(map[string]any)
	assert.True(t, ok)
	assert.Equal(t, true, vault["enabled"])
	assert.Equal(t, "hashicorp", vault["type"])

	datadog, ok := decoded["datadog"].(map[string]any)
	assert.True(t, ok)
	assert.Equal(t, true, datadog["enabled"])
	assert.Equal(t, "test-key", datadog["api_key"])

	logExports, ok := decoded["log_exports"].(map[string]any)
	assert.True(t, ok)
	assert.Equal(t, false, logExports["enabled"])
}

func TestEnterpriseConfig_UpdateConfigPayloadIncludesEnterprise(t *testing.T) {
	payload := struct {
		ClientConfig    interface{}    `json:"client_config"`
		FrameworkConfig interface{}    `json:"framework_config"`
		AuthConfig      interface{}    `json:"auth_config"`
		Enterprise      map[string]any `json:"enterprise"`
	}{
		Enterprise: map[string]any{
			"rbac": map[string]any{"enabled": true},
		},
	}

	assert.NotNil(t, payload.Enterprise)
	assert.Equal(t, true, payload.Enterprise["rbac"].(map[string]any)["enabled"])
}
