package bifrost

import (
	"testing"

	"github.com/maximhq/bifrost/core/schemas"
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
