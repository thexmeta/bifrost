package keyselectors

import (
	"testing"

	"github.com/maximhq/bifrost/core/schemas"
	"github.com/stretchr/testify/assert"
)

func TestWeightedRandom(t *testing.T) {
	ctx := &schemas.BifrostContext{}
	provider := schemas.ModelProvider("")
	model := ""

	t.Run("statistical distribution", func(t *testing.T) {
		keys := []schemas.Key{
			{ID: "key1", Weight: 0.5},
			{ID: "key2", Weight: 0.3},
			{ID: "key3", Weight: 0.2},
		}

		counts := map[string]int{
			"key1": 0,
			"key2": 0,
			"key3": 0,
		}

		iterations := 10000
		for i := 0; i < iterations; i++ {
			key, err := WeightedRandom(ctx, keys, provider, model)
			assert.NoError(t, err)
			counts[key.ID]++
		}

		// Calculate frequencies
		freq1 := float64(counts["key1"]) / float64(iterations)
		freq2 := float64(counts["key2"]) / float64(iterations)
		freq3 := float64(counts["key3"]) / float64(iterations)

		// Allow ±5% tolerance (0.05)
		assert.InDelta(t, 0.5, freq1, 0.05, "key1 distribution mismatch")
		assert.InDelta(t, 0.3, freq2, 0.05, "key2 distribution mismatch")
		assert.InDelta(t, 0.2, freq3, 0.05, "key3 distribution mismatch")
	})

	t.Run("zero weight fallback to uniform", func(t *testing.T) {
		keys := []schemas.Key{
			{ID: "key1", Weight: 0},
			{ID: "key2", Weight: 0},
			{ID: "key3", Weight: 0},
			{ID: "key4", Weight: 0},
		}

		counts := map[string]int{
			"key1": 0,
			"key2": 0,
			"key3": 0,
			"key4": 0,
		}

		iterations := 10000
		for i := 0; i < iterations; i++ {
			key, err := WeightedRandom(ctx, keys, provider, model)
			assert.NoError(t, err)
			counts[key.ID]++
		}

		expectedFreq := 0.25
		for id, count := range counts {
			freq := float64(count) / float64(iterations)
			assert.InDelta(t, expectedFreq, freq, 0.05, "zero weight distribution mismatch for %s", id)
		}
	})

	t.Run("single key", func(t *testing.T) {
		keys := []schemas.Key{
			{ID: "only_key", Weight: 1.0},
		}

		key, err := WeightedRandom(ctx, keys, provider, model)
		assert.NoError(t, err)
		assert.Equal(t, "only_key", key.ID)
	})

	t.Run("mixed zero and non-zero weights", func(t *testing.T) {
		// If totalWeight > 0, zero-weight keys should never be picked
		keys := []schemas.Key{
			{ID: "zero", Weight: 0.0},
			{ID: "full", Weight: 1.0},
		}

		counts := map[string]int{
			"zero": 0,
			"full": 0,
		}

		iterations := 1000
		for i := 0; i < iterations; i++ {
			key, err := WeightedRandom(ctx, keys, provider, model)
			assert.NoError(t, err)
			counts[key.ID]++
		}

		assert.Equal(t, 0, counts["zero"], "Zero weight key should not be picked when total weight > 0")
		assert.Equal(t, iterations, counts["full"])
	})
}
