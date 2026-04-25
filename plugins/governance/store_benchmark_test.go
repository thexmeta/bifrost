package governance

import (
	"context"
	"fmt"
	"testing"

	"github.com/maximhq/bifrost/framework/configstore"
	configstoreTables "github.com/maximhq/bifrost/framework/configstore/tables"
)

func BenchmarkLoadFromConfigMemory(b *testing.B) {
	numBudgets := 1000
	numRateLimits := 1000
	numProviders := 100
	numModelConfigs := 500
	numVirtualKeys := 1000

	budgets := make([]configstoreTables.TableBudget, numBudgets)
	for i := 0; i < numBudgets; i++ {
		id := fmt.Sprintf("budget-%d", i)
		budgets[i] = configstoreTables.TableBudget{ID: id}
	}

	rateLimits := make([]configstoreTables.TableRateLimit, numRateLimits)
	for i := 0; i < numRateLimits; i++ {
		id := fmt.Sprintf("rl-%d", i)
		rateLimits[i] = configstoreTables.TableRateLimit{ID: id}
	}

	providers := make([]configstoreTables.TableProvider, numProviders)
	for i := 0; i < numProviders; i++ {
		name := fmt.Sprintf("provider-%d", i)
		budgetID := fmt.Sprintf("budget-%d", i%numBudgets)
		rateLimitID := fmt.Sprintf("rl-%d", i%numRateLimits)
		providers[i] = configstoreTables.TableProvider{
			Name:        name,
			BudgetID:    &budgetID,
			RateLimitID: &rateLimitID,
		}
	}

	modelConfigs := make([]configstoreTables.TableModelConfig, numModelConfigs)
	for i := 0; i < numModelConfigs; i++ {
		name := fmt.Sprintf("model-%d", i)
		budgetID := fmt.Sprintf("budget-%d", i%numBudgets)
		rateLimitID := fmt.Sprintf("rl-%d", i%numRateLimits)
		modelConfigs[i] = configstoreTables.TableModelConfig{
			ModelName:   name,
			BudgetID:    &budgetID,
			RateLimitID: &rateLimitID,
		}
	}

	virtualKeys := make([]configstoreTables.TableVirtualKey, numVirtualKeys)
	for i := 0; i < numVirtualKeys; i++ {
		value := fmt.Sprintf("vk-%d", i)
		rateLimitID := fmt.Sprintf("rl-%d", i%numRateLimits)
		virtualKeys[i] = configstoreTables.TableVirtualKey{
			Value:       value,
			RateLimitID: &rateLimitID,
		}
	}

	config := &configstore.GovernanceConfig{
		Budgets:      budgets,
		RateLimits:   rateLimits,
		Providers:    providers,
		ModelConfigs: modelConfigs,
		VirtualKeys:  virtualKeys,
	}

	logger := NewMockLogger()
	gs := &LocalGovernanceStore{
		logger: logger,
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = gs.loadFromConfigMemory(context.Background(), config)
	}
}
