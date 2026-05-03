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

func TestIsRateLimitErrorMessage(t *testing.T) {
	tests := []struct {
		name     string
		message  string
		expected bool
	}{
		// Edge cases
		{"Empty string", "", false},

		// Exact matches
		{"Exact match rate limit", "rate limit", true},
		{"Exact match rate_limit", "rate_limit", true},
		{"Exact match ratelimit", "ratelimit", true},
		{"Exact match too many requests", "too many requests", true},
		{"Exact match quota exceeded", "quota exceeded", true},
		{"Exact match 429", "429", false},

		// Case insensitivity
		{"Mixed case rate limit", "RaTe LiMiT", true},
		{"Mixed case too many requests", "Too Many Requests", true},
		{"Mixed case quota exceeded", "QUOTA EXCEEDED", true},

		// Embedded within a sentence
		{"Embedded rate limit", "The server returned a rate limit error", true},
		{"Embedded too many requests", "Error: too many requests for this user", true},
		{"Embedded with punctuation", "status: 429, message: quota exceeded.", true},

		// Non-matching cases
		{"No rate limit", "internal server error", false},
		{"No rate limit token", "invalid token provided", false},
		{"Close but no match", "rate limited", true}, // Contains "rate limit"
		{"Close but no match 2", "ratelimiting", true}, // Contains "ratelimit"
		{"No match 428", "status 428", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsRateLimitErrorMessage(tt.message)
			if result != tt.expected {
				t.Errorf("IsRateLimitErrorMessage(%q) = %v; want %v", tt.message, result, tt.expected)
			}
		})
	}
}
