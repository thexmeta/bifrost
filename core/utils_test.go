package bifrost

import (
	"testing"

	"github.com/maximhq/bifrost/core/schemas"
	"github.com/stretchr/testify/require"
)

func TestCanProviderKeyValueBeEmpty(t *testing.T) {
	tests := []struct {
		name     string
		provider schemas.ModelProvider
		expected bool
	}{
		// Providers that can have empty key values
		{"Vertex", schemas.Vertex, true},
		{"Bedrock", schemas.Bedrock, true},
		{"VLLM", schemas.VLLM, true},
		{"Azure", schemas.Azure, true},
		{"Ollama", schemas.Ollama, true},
		{"SGL", schemas.SGL, true},

		// Providers that cannot have empty key values
		{"OpenAI", schemas.OpenAI, false},
		{"Anthropic", schemas.Anthropic, false},
		{"Cohere", schemas.Cohere, false},
		{"Mistral", schemas.Mistral, false},
		{"Groq", schemas.Groq, false},
		{"Parasail", schemas.Parasail, false},
		{"Perplexity", schemas.Perplexity, false},
		{"Cerebras", schemas.Cerebras, false},
		{"Gemini", schemas.Gemini, false},
		{"OpenRouter", schemas.OpenRouter, false},
		{"Elevenlabs", schemas.Elevenlabs, false},
		{"HuggingFace", schemas.HuggingFace, false},
		{"Nebius", schemas.Nebius, false},
		{"XAI", schemas.XAI, false},
		{"Replicate", schemas.Replicate, false},
		{"Runway", schemas.Runway, false},
		{"Fireworks", schemas.Fireworks, false},
		{"NvidiaNIM", schemas.NvidiaNIM, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := CanProviderKeyValueBeEmpty(tt.provider)
			if result != tt.expected {
				t.Errorf("CanProviderKeyValueBeEmpty(%v) = %v; want %v", tt.provider, result, tt.expected)
			}
		})
	}
}

func TestValidateExternalURL(t *testing.T) {
	tests := []struct {
		name    string
		urlStr  string
		wantErr bool
	}{
		{
			name:    "valid external URL bypassing DNS",
			urlStr:  "https://8.8.8.8",
			wantErr: false,
		},
		{
			name:    "empty URL",
			urlStr:  "",
			wantErr: true,
		},
		{
			name:    "invalid URL format",
			urlStr:  "http://%42:8080/",
			wantErr: true,
		},
		{
			name:    "non-https scheme",
			urlStr:  "ftp://8.8.8.8",
			wantErr: true,
		},
		{
			name:    "missing hostname",
			urlStr:  "https:///",
			wantErr: true,
		},
		{
			name:    "localhost string",
			urlStr:  "http://localhost:8080",
			wantErr: true,
		},
		{
			name:    "loopback IPv4",
			urlStr:  "http://127.0.0.1:8080",
			wantErr: true,
		},
		{
			name:    "loopback IPv6",
			urlStr:  "http://[::1]:8080",
			wantErr: true,
		},
		{
			name:    "private IP 10.x.x.x",
			urlStr:  "https://10.0.0.1",
			wantErr: true,
		},
		{
			name:    "private IP 192.168.x.x",
			urlStr:  "https://192.168.1.100",
			wantErr: true,
		},
		{
			name:    "private IP 172.16.x.x",
			urlStr:  "https://172.16.0.5",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateExternalURL(tt.urlStr)
			if tt.wantErr {
				require.Error(t, err)
			} else {
				require.NoError(t, err)
			}
		})
	}
}
