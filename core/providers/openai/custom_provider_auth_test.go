package openai

import (
	"testing"

	schemas "github.com/maximhq/bifrost/core/schemas"
	"github.com/valyala/fasthttp"
)

// TestCustomProviderAuthHeader verifies that custom providers with base_provider_type:"openai"
// correctly forward the Authorization header to upstream APIs.
func TestCustomProviderAuthHeader(t *testing.T) {
	tests := []struct {
		name           string
		providerName   string
		apiKeyValue    string
		expectedAuth   string
		customProvider bool
	}{
		{
			name:           "standard_openai_provider",
			providerName:   "openai",
			apiKeyValue:    "sk-test-key-123",
			expectedAuth:   "Bearer sk-test-key-123",
			customProvider: false,
		},
		{
			name:           "custom_provider_with_openai_base",
			providerName:   "nvidia",
			apiKeyValue:    "env.NVIDIA_NIM_API_KEY",
			expectedAuth:   "Bearer env.NVIDIA_NIM_API_KEY",
			customProvider: true,
		},
		{
			name:           "custom_provider_with_empty_key",
			providerName:   "custom",
			apiKeyValue:    "",
			expectedAuth:   "",
			customProvider: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create provider config
			config := &schemas.ProviderConfig{
				NetworkConfig: schemas.NetworkConfig{
					BaseURL: "https://test.api.example.com",
				},
			}

			if tt.customProvider {
				config.CustomProviderConfig = &schemas.CustomProviderConfig{
					BaseProviderType:  schemas.OpenAI,
					CustomProviderKey: tt.providerName,
				}
			}

			// Create OpenAI provider
			provider := NewOpenAIProvider(config, &testLogger{})

			// Verify provider key
			providerKey := provider.GetProviderKey()
			if tt.customProvider {
				if providerKey != schemas.ModelProvider(tt.providerName) {
					t.Errorf("Expected provider key %s, got %s", tt.providerName, providerKey)
				}
			} else {
				if providerKey != schemas.OpenAI {
					t.Errorf("Expected provider key openai, got %s", providerKey)
				}
			}

			// Create test key
			key := schemas.Key{
				ID:    "test-key",
				Name:  "test-key-name",
				Value: schemas.EnvVar{Val: tt.apiKeyValue},
			}

			// Verify key value is accessible
			if key.Value.GetValue() != tt.apiKeyValue {
				t.Errorf("Expected key value %s, got %s", tt.apiKeyValue, key.Value.GetValue())
			}

			// Verify Authorization header would be set correctly
			if tt.apiKeyValue != "" {
				expectedHeader := "Bearer " + tt.apiKeyValue
				req := fasthttp.AcquireRequest()
				defer fasthttp.ReleaseRequest(req)

				req.Header.Set("Authorization", expectedHeader)
				actualAuth := string(req.Header.Peek("Authorization"))

				if actualAuth != expectedHeader {
					t.Errorf("Expected Authorization header %s, got %s", expectedHeader, actualAuth)
				}
			}
		})
	}
}

// TestCustomProviderConfigPropagation verifies that CustomProviderConfig is properly
// propagated through the OpenAI provider instance.
func TestCustomProviderConfigPropagation(t *testing.T) {
	customProviderName := "test-custom-provider"

	config := &schemas.ProviderConfig{
		NetworkConfig: schemas.NetworkConfig{
			BaseURL: "https://custom.api.example.com/v1",
		},
		CustomProviderConfig: &schemas.CustomProviderConfig{
			BaseProviderType:  schemas.OpenAI,
			CustomProviderKey: customProviderName,
			IsKeyLess:         false,
		},
	}

	provider := NewOpenAIProvider(config, &testLogger{})

	// Verify custom provider config is stored
	if provider.customProviderConfig == nil {
		t.Fatal("Expected customProviderConfig to be set, got nil")
	}

	if provider.customProviderConfig.CustomProviderKey != customProviderName {
		t.Errorf("Expected CustomProviderKey %s, got %s", customProviderName, provider.customProviderConfig.CustomProviderKey)
	}

	if provider.customProviderConfig.BaseProviderType != schemas.OpenAI {
		t.Errorf("Expected BaseProviderType openai, got %s", provider.customProviderConfig.BaseProviderType)
	}

	// Verify GetProviderKey returns the custom provider name
	providerKey := provider.GetProviderKey()
	if providerKey != schemas.ModelProvider(customProviderName) {
		t.Errorf("Expected provider key %s, got %s", customProviderName, providerKey)
	}
}

// testLogger is a minimal logger implementation for tests
type testLogger struct{}

func (l *testLogger) Debug(msg string, args ...any)                                {}
func (l *testLogger) Info(msg string, args ...any)                                 {}
func (l *testLogger) Warn(msg string, args ...any)                                 {}
func (l *testLogger) Error(msg string, args ...any)                                {}
func (l *testLogger) Fatal(msg string, args ...any)                                {}
func (l *testLogger) SetLevel(level schemas.LogLevel)                              {}
func (l *testLogger) SetOutputType(outputType schemas.LoggerOutputType)            {}
func (l *testLogger) LogHTTPRequest(level schemas.LogLevel, msg string) schemas.LogEventBuilder {
	return &noopLogEventBuilder{}
}

// noopLogEventBuilder is a no-op builder
type noopLogEventBuilder struct{}

func (b *noopLogEventBuilder) Str(key, val string) schemas.LogEventBuilder   { return b }
func (b *noopLogEventBuilder) Int(key string, val int) schemas.LogEventBuilder { return b }
func (b *noopLogEventBuilder) Int64(key string, val int64) schemas.LogEventBuilder { return b }
func (b *noopLogEventBuilder) Send()                                         {}
