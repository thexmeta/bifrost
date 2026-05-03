package mcp

import (
	"testing"

	"github.com/maximhq/bifrost/core/schemas"
	"github.com/stretchr/testify/assert"
)

func TestNoopLogger(t *testing.T) {
	logger := noopLogger{}

	assert.NotPanics(t, func() {
		logger.Debug("test debug", "arg1", "arg2")
		logger.Info("test info", "arg1", "arg2")
		logger.Warn("test warn", "arg1", "arg2")
		logger.Error("test error", "arg1", "arg2")
		logger.Fatal("test fatal", "arg1", "arg2")
		logger.SetLevel(schemas.LogLevelDebug)
		logger.SetOutputType(schemas.LoggerOutputTypeJSON)
	}, "noopLogger methods should not panic")

	assert.NotPanics(t, func() {
		builder := logger.LogHTTPRequest(schemas.LogLevelInfo, "test msg")
		assert.Equal(t, schemas.NoopLogEvent, builder, "LogHTTPRequest should return schemas.NoopLogEvent")
	}, "LogHTTPRequest should not panic and return correct value")
}
