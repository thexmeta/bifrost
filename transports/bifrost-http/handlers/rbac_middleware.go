// Package handlers provides RBAC middleware for access control.
package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/maximhq/bifrost/framework/configstore"
	"github.com/valyala/fasthttp"
)

// RBACMiddleware enforces role-based access control on API requests.
type RBACMiddleware struct {
	store   configstore.ConfigStore
	enabled bool
}

// NewRBACMiddleware creates a new RBAC middleware.
func NewRBACMiddleware(store configstore.ConfigStore, enabled bool) *RBACMiddleware {
	return &RBACMiddleware{store: store, enabled: enabled}
}

// Middleware returns the RBAC middleware function.
func (m *RBACMiddleware) Middleware() func(next func(ctx *fasthttp.RequestCtx)) func(ctx *fasthttp.RequestCtx) {
	return func(next func(ctx *fasthttp.RequestCtx)) func(ctx *fasthttp.RequestCtx) {
		return func(ctx *fasthttp.RequestCtx) {
			if !m.enabled {
				next(ctx)
				return
			}

			// Get user ID from header (set by auth middleware or API key)
			userID := string(ctx.Request.Header.Peek("X-BF-User-ID"))
			if userID == "" {
				// No user identity — allow (unauthenticated requests handled by auth middleware)
				next(ctx)
				return
			}

			// Derive resource and operation from request path and method
			resource := pathToResource(string(ctx.Path()))
			operation := methodToOperation(ctx.Method())

			if resource == "" || operation == "" {
				// Unknown resource/operation — allow (default-open for safety)
				next(ctx)
				return
			}

			allowed, err := m.store.CheckUserPermission(context.Background(), userID, resource, operation)
			if err != nil {
				ctx.SetStatusCode(fasthttp.StatusInternalServerError)
				ctx.Response.Header.Set("Content-Type", "application/json")
				body, _ := json.Marshal(map[string]string{
					"error": fmt.Sprintf("Failed to check permission: %v", err),
				})
				ctx.SetBody(body)
				return
			}

			if !allowed {
				ctx.SetStatusCode(fasthttp.StatusForbidden)
				ctx.Response.Header.Set("Content-Type", "application/json")
				body, _ := json.Marshal(map[string]string{
					"error":     "Forbidden",
					"message":   fmt.Sprintf("You don't have permission to %s %s", operation, resource),
					"resource":  resource,
					"operation": operation,
				})
				ctx.SetBody(body)
				return
			}

			next(ctx)
		}
	}
}

// pathToResource maps URL paths to RBAC resource names.
func pathToResource(path string) string {
	segments := strings.Split(strings.TrimPrefix(path, "/"), "/")
	if len(segments) == 0 || segments[0] == "" {
		return ""
	}

	// Skip api prefix
	if segments[0] == "api" {
		if len(segments) < 2 {
			return ""
		}
		segments = segments[1:]
	}

	first := segments[0]

	resourceMap := map[string]string{
		"providers":       "ModelProvider",
		"governance":      "Governance",
		"virtual-keys":    "VirtualKeys",
		"mcp-clients":     "MCPGateway",
		"mcp":             "MCPGateway",
		"plugins":         "Plugins",
		"logs":            "Logs",
		"observability":   "Observability",
		"customers":       "Customers",
		"teams":           "Teams",
		"rbac":            "RBAC",
		"routing-rules":   "RoutingRules",
		"users":           "Users",
		"audit-logs":      "AuditLogs",
		"config":          "Settings",
		"guardrails":      "GuardrailsConfig",
		"keys":            "ModelProvider",
		"models":          "ModelProvider",
		"health":          "",
		"version":         "",
		"session":         "",
	}

	if r, ok := resourceMap[first]; ok {
		return r
	}
	return first // fallback: use first segment as-is
}

// methodToOperation maps HTTP methods to RBAC operations.
func methodToOperation(method []byte) string {
	switch string(method) {
	case "GET", "HEAD", "OPTIONS":
		return "View"
	case "POST":
		return "Create"
	case "PUT", "PATCH":
		return "Update"
	case "DELETE":
		return "Delete"
	default:
		return ""
	}
}
