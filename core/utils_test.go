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

func TestIsSupportedBaseProvider(t *testing.T) {
	tests := []struct {
		name     string
		provider schemas.ModelProvider
		expected bool
	}{
		{"Anthropic", schemas.Anthropic, true},
		{"Bedrock", schemas.Bedrock, true},
		{"Cohere", schemas.Cohere, true},
		{"Gemini", schemas.Gemini, true},
		{"OpenAI", schemas.OpenAI, true},
		{"HuggingFace", schemas.HuggingFace, true},
		{"Replicate", schemas.Replicate, true},
		{"NvidiaNIM", schemas.NvidiaNIM, true},

		{"Azure", schemas.Azure, false},
		{"Mistral", schemas.Mistral, false},
		{"Ollama", schemas.Ollama, false},
		{"Groq", schemas.Groq, false},
		{"CustomProvider", schemas.ModelProvider("my-custom-provider"), false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsSupportedBaseProvider(tt.provider)
			if result != tt.expected {
				t.Errorf("IsSupportedBaseProvider(%v) = %v; want %v", tt.provider, result, tt.expected)
			}
		})
	}
}

func TestIsStandardProvider(t *testing.T) {
	tests := []struct {
		name     string
		provider schemas.ModelProvider
		expected bool
	}{
		{"OpenAI", schemas.OpenAI, true},
		{"Azure", schemas.Azure, true},
		{"Anthropic", schemas.Anthropic, true},
		{"Bedrock", schemas.Bedrock, true},
		{"Mistral", schemas.Mistral, true},
		{"Ollama", schemas.Ollama, true},

		{"CustomProvider", schemas.ModelProvider("my-custom-provider"), false},
		{"EmptyProvider", schemas.ModelProvider(""), false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsStandardProvider(tt.provider)
			if result != tt.expected {
				t.Errorf("IsStandardProvider(%v) = %v; want %v", tt.provider, result, tt.expected)
			}
		})
	}
}
