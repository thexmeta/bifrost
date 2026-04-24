package configstore

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/maximhq/bifrost/framework/configstore/tables"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupEnterpriseTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&tables.TableGovernanceConfig{}))
	return db
}

func TestRDBConfigStore_GetEnterpriseConfig_ReturnsEmptyWhenNotSet(t *testing.T) {
	db := setupEnterpriseTestDB(t)
	store := &RDBConfigStore{db: db}

	result, err := store.GetEnterpriseConfig(context.Background())

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Empty(t, result)
}

func TestRDBConfigStore_UpdateEnterpriseConfig_SavesToDB(t *testing.T) {
	db := setupEnterpriseTestDB(t)
	store := &RDBConfigStore{db: db}

	config := map[string]any{
		"rbac": map[string]any{
			"enabled":      true,
			"default_role": "admin",
		},
		"vault": map[string]any{
			"enabled": true,
			"type":    "hashicorp",
		},
	}

	err := store.UpdateEnterpriseConfig(context.Background(), config)
	require.NoError(t, err)

	// Verify it was saved
	result, err := store.GetEnterpriseConfig(context.Background())
	require.NoError(t, err)

	rbac, ok := result["rbac"].(map[string]any)
	require.True(t, ok)
	assert.Equal(t, true, rbac["enabled"])
	assert.Equal(t, "admin", rbac["default_role"])

	vault, ok := result["vault"].(map[string]any)
	require.True(t, ok)
	assert.Equal(t, true, vault["enabled"])
	assert.Equal(t, "hashicorp", vault["type"])
}

func TestRDBConfigStore_UpdateEnterpriseConfig_UpdatesExistingConfig(t *testing.T) {
	db := setupEnterpriseTestDB(t)
	store := &RDBConfigStore{db: db}

	// First save
	config1 := map[string]any{"rbac": map[string]any{"enabled": false}}
	err := store.UpdateEnterpriseConfig(context.Background(), config1)
	require.NoError(t, err)

	// Update with new config
	config2 := map[string]any{
		"rbac":    map[string]any{"enabled": true, "default_role": "editor"},
		"datadog": map[string]any{"enabled": true},
	}
	err = store.UpdateEnterpriseConfig(context.Background(), config2)
	require.NoError(t, err)

	// Verify update
	result, err := store.GetEnterpriseConfig(context.Background())
	require.NoError(t, err)

	rbac, ok := result["rbac"].(map[string]any)
	require.True(t, ok)
	assert.Equal(t, true, rbac["enabled"])
	assert.Equal(t, "editor", rbac["default_role"])

	_, ok = result["datadog"]
	assert.True(t, ok)
}

func TestRDBConfigStore_EnterpriseConfig_MarshalsComplexTypes(t *testing.T) {
	db := setupEnterpriseTestDB(t)
	store := &RDBConfigStore{db: db}

	config := map[string]any{
		"log_exports": map[string]any{
			"enabled": true,
			"destination": map[string]any{
				"type": "s3",
				"config": map[string]any{
					"bucket":      "my-bucket",
					"region":      "us-east-1",
					"prefix":      "logs/",
					"format":      "json",
					"compression": "gzip",
				},
			},
			"schedule": map[string]any{
				"interval_hours": 6,
			},
		},
	}

	err := store.UpdateEnterpriseConfig(context.Background(), config)
	require.NoError(t, err)

	result, err := store.GetEnterpriseConfig(context.Background())
	require.NoError(t, err)

	logExports, ok := result["log_exports"].(map[string]any)
	require.True(t, ok)
	assert.Equal(t, true, logExports["enabled"])

	dest, ok := logExports["destination"].(map[string]any)
	require.True(t, ok)
	assert.Equal(t, "s3", dest["type"])

	schedule, ok := logExports["schedule"].(map[string]any)
	require.True(t, ok)
	// JSON numbers are float64
	assert.Equal(t, float64(6), schedule["interval_hours"])
}

func TestRDBConfigStore_EnterpriseConfig_JSONRoundTrip(t *testing.T) {
	config := map[string]any{
		"vault": map[string]any{
			"enabled":              true,
			"type":                 "aws",
			"address":              "",
			"token":                "",
			"sync_paths":           []string{"bifrost/*", "api-keys/*"},
			"sync_interval_seconds": 600,
		},
	}

	data, err := json.Marshal(config)
	require.NoError(t, err)

	var decoded map[string]any
	err = json.Unmarshal(data, &decoded)
	require.NoError(t, err)

	vault, ok := decoded["vault"].(map[string]any)
	require.True(t, ok)
	assert.Equal(t, true, vault["enabled"])
	assert.Equal(t, "aws", vault["type"])
}
