package bifrost

import (
	"testing"

	"github.com/maximhq/bifrost/core/mcp"
)

func TestIsCodemodeTool(t *testing.T) {
	tests := []struct {
		name     string
		toolName string
		expected bool
	}{
		{
			name:     "ToolTypeListToolFiles",
			toolName: mcp.ToolTypeListToolFiles,
			expected: true,
		},
		{
			name:     "ToolTypeReadToolFile",
			toolName: mcp.ToolTypeReadToolFile,
			expected: true,
		},
		{
			name:     "ToolTypeGetToolDocs",
			toolName: mcp.ToolTypeGetToolDocs,
			expected: true,
		},
		{
			name:     "ToolTypeExecuteToolCode",
			toolName: mcp.ToolTypeExecuteToolCode,
			expected: true,
		},
		{
			name:     "Empty string",
			toolName: "",
			expected: false,
		},
		{
			name:     "Regular tool",
			toolName: "get_weather",
			expected: false,
		},
		{
			name:     "Similar but wrong case",
			toolName: "listtoolfiles",
			expected: false,
		},
		{
			name:     "Invalid prefix",
			toolName: "mcp.listToolFiles",
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsCodemodeTool(tt.toolName)
			if result != tt.expected {
				t.Errorf("IsCodemodeTool(%q) = %v; expected %v", tt.toolName, result, tt.expected)
			}
		})
	}
}
