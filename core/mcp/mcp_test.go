package mcp

import (
	"context"
	"testing"
	"time"

	"github.com/maximhq/bifrost/core/schemas"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type mockLogger struct {
	schemas.Logger
}

func (m mockLogger) Debug(msg string, args ...any) {}
func (m mockLogger) Info(msg string, args ...any)  {}
func (m mockLogger) Warn(msg string, args ...any)  {}
func (m mockLogger) Error(msg string, args ...any) {}
func (m mockLogger) Fatal(msg string, args ...any) {}

type mockOAuth2Provider struct{}

func (m mockOAuth2Provider) GetAccessToken(ctx context.Context, configID string) (string, error) {
	return "", nil
}
func (m mockOAuth2Provider) RefreshAccessToken(ctx context.Context, oauthConfigID string) error {
	return nil
}
func (m mockOAuth2Provider) ValidateToken(ctx context.Context, oauthConfigID string) (bool, error) {
	return true, nil
}
func (m mockOAuth2Provider) RevokeToken(ctx context.Context, oauthConfigID string) error { return nil }
func (m mockOAuth2Provider) GetUserAccessToken(ctx context.Context, sessionToken string) (string, error) {
	return "", nil
}
func (m mockOAuth2Provider) GetUserAccessTokenByIdentity(ctx context.Context, virtualKeyID, userID, sessionToken, mcpClientID string) (string, error) {
	return "", nil
}
func (m mockOAuth2Provider) InitiateUserOAuthFlow(ctx context.Context, oauthConfigID string, mcpClientID string, redirectURI string) (*schemas.OAuth2FlowInitiation, string, error) {
	return nil, "", nil
}
func (m mockOAuth2Provider) CompleteUserOAuthFlow(ctx context.Context, state string, code string) (string, error) {
	return "", nil
}
func (m mockOAuth2Provider) RefreshUserAccessToken(ctx context.Context, sessionToken string) error {
	return nil
}
func (m mockOAuth2Provider) RevokeUserToken(ctx context.Context, sessionToken string) error { return nil }

type mockCodeMode struct {
	CodeMode
	deps *CodeModeDependencies
}

func (m *mockCodeMode) SetDependencies(deps *CodeModeDependencies) {
	m.deps = deps
}

func TestNewMCPManager(t *testing.T) {
	ctx := context.Background()

	t.Run("nil logger falls back to defaultLogger", func(t *testing.T) {
		config := schemas.MCPConfig{}
		oauth2Provider := mockOAuth2Provider{}
		var codeMode CodeMode = nil

		manager := NewMCPManager(ctx, config, oauth2Provider, nil, codeMode)

		require.NotNil(t, manager)
		assert.Equal(t, defaultLogger, manager.logger)
	})

	t.Run("nil ToolManagerConfig initializes defaults", func(t *testing.T) {
		config := schemas.MCPConfig{
			ToolManagerConfig: nil,
		}
		oauth2Provider := mockOAuth2Provider{}
		logger := mockLogger{}
		var codeMode CodeMode = nil

		manager := NewMCPManager(ctx, config, oauth2Provider, logger, codeMode)

		require.NotNil(t, manager)
		assert.NotNil(t, manager.toolsManager)
	})

	t.Run("pluginPipelineProvider and releasePluginPipeline initialized", func(t *testing.T) {
		calledProvider := false
		calledRelease := false

		config := schemas.MCPConfig{
			PluginPipelineProvider: func() any {
				calledProvider = true
				return nil
			},
			ReleasePluginPipeline: func(pipeline any) {
				calledRelease = true
			},
		}
		oauth2Provider := mockOAuth2Provider{}
		logger := mockLogger{}
		var codeMode CodeMode = nil

		manager := NewMCPManager(ctx, config, oauth2Provider, logger, codeMode)

		require.NotNil(t, manager)
		assert.NotNil(t, manager.toolsManager.pluginPipelineProvider)
		assert.NotNil(t, manager.toolsManager.releasePluginPipeline)

		manager.toolsManager.pluginPipelineProvider()
		assert.True(t, calledProvider)

		manager.toolsManager.releasePluginPipeline(nil)
		assert.True(t, calledRelease)
	})

	t.Run("pluginPipelineProvider returns invalid type", func(t *testing.T) {
		config := schemas.MCPConfig{
			PluginPipelineProvider: func() any {
				return "not-a-pipeline"
			},
			ReleasePluginPipeline: func(pipeline any) {
			},
		}
		oauth2Provider := mockOAuth2Provider{}
		logger := mockLogger{}
		var codeMode CodeMode = nil

		manager := NewMCPManager(ctx, config, oauth2Provider, logger, codeMode)

		require.NotNil(t, manager)
		assert.NotNil(t, manager.toolsManager.pluginPipelineProvider)
		assert.Nil(t, manager.toolsManager.pluginPipelineProvider())
	})

	t.Run("CodeMode dependencies injected", func(t *testing.T) {
		config := schemas.MCPConfig{}
		oauth2Provider := mockOAuth2Provider{}
		logger := mockLogger{}
		codeMode := &mockCodeMode{}

		manager := NewMCPManager(ctx, config, oauth2Provider, logger, codeMode)

		require.NotNil(t, manager)
		assert.NotNil(t, codeMode.deps)
		assert.Equal(t, manager, codeMode.deps.ClientManager)
		assert.Equal(t, codeMode, manager.toolsManager.codeMode)
	})

	t.Run("ClientConfigs processing with error and reconnecting tracking", func(t *testing.T) {
		isPingAvailable := true
		config := schemas.MCPConfig{
			ClientConfigs: []*schemas.MCPClientConfig{
				{
					ID:              "client1",
					Name:            "Client 1",
					ConnectionType:  schemas.MCPConnectionTypeSTDIO,
					IsPingAvailable: &isPingAvailable,
					StdioConfig: &schemas.MCPStdioConfig{
						Command: "nonexistent-command-that-will-fail",
						Args:    []string{"test"},
					},
				},
				{
					ID:              "client1", // Duplicate ID to test existing client map condition
					Name:            "Client 1 Duplicate",
					ConnectionType:  schemas.MCPConnectionTypeSTDIO,
					IsPingAvailable: &isPingAvailable,
					StdioConfig: &schemas.MCPStdioConfig{
						Command: "another-nonexistent-command",
						Args:    []string{"test"},
					},
				},
			},
		}
		oauth2Provider := mockOAuth2Provider{}
		logger := mockLogger{}
		var codeMode CodeMode = nil

		manager := NewMCPManager(ctx, config, oauth2Provider, logger, codeMode)

		require.NotNil(t, manager)

		assert.Eventually(t, func() bool {
			manager.mu.RLock()
			defer manager.mu.RUnlock()
			clientState, exists := manager.clientMap["client1"]
			if !exists {
				return false
			}
			return clientState.State == schemas.MCPConnectionStateDisconnected
		}, 2*time.Second, 50*time.Millisecond, "Expected client1 to be registered and in Disconnected state")

		manager.healthMonitorManager.StopAll()
	})

	t.Run("ClientConfigs missing isPingAvailable defaults to true in health check", func(t *testing.T) {
		config := schemas.MCPConfig{
			ClientConfigs: []*schemas.MCPClientConfig{
				{
					ID:             "client2",
					Name:           "Client 2",
					ConnectionType: schemas.MCPConnectionTypeSTDIO,
					StdioConfig: &schemas.MCPStdioConfig{
						Command: "nonexistent-command-that-will-fail",
						Args:    []string{"test"},
					},
				},
			},
		}
		oauth2Provider := mockOAuth2Provider{}
		logger := mockLogger{}
		var codeMode CodeMode = nil

		manager := NewMCPManager(ctx, config, oauth2Provider, logger, codeMode)

		require.NotNil(t, manager)

		assert.Eventually(t, func() bool {
			manager.mu.RLock()
			defer manager.mu.RUnlock()
			clientState, exists := manager.clientMap["client2"]
			if !exists {
				return false
			}
			return clientState.State == schemas.MCPConnectionStateDisconnected
		}, 2*time.Second, 50*time.Millisecond, "Expected client2 to be registered and in Disconnected state")

		manager.healthMonitorManager.StopAll()
	})
}
