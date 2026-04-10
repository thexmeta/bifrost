// Package handlers provides HTTP request handlers for RBAC management.
package handlers

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/fasthttp/router"
	"github.com/maximhq/bifrost/core/schemas"
	"github.com/maximhq/bifrost/framework/configstore"
	"github.com/maximhq/bifrost/framework/configstore/tables"
	"github.com/valyala/fasthttp"
)

// RBACHandler manages RBAC HTTP operations
type RBACHandler struct {
	store configstore.ConfigStore
}

// NewRBACHandler creates a new RBAC handler
func NewRBACHandler(store configstore.ConfigStore) *RBACHandler {
	return &RBACHandler{store: store}
}

// RegisterRoutes registers RBAC routes
func (h *RBACHandler) RegisterRoutes(r *router.Router, middlewares ...schemas.BifrostHTTPMiddleware) {
	// Roles CRUD
	r.GET("/api/rbac/roles", h.chain(h.listRoles, middlewares...))
	r.GET("/api/rbac/roles/{id}", h.chain(h.getRole, middlewares...))
	r.POST("/api/rbac/roles", h.chain(h.createRole, middlewares...))
	r.PUT("/api/rbac/roles/{id}", h.chain(h.updateRole, middlewares...))
	r.DELETE("/api/rbac/roles/{id}", h.chain(h.deleteRole, middlewares...))

	// Role permissions
	r.GET("/api/rbac/roles/{id}/permissions", h.chain(h.getRolePermissions, middlewares...))
	r.PUT("/api/rbac/roles/{id}/permissions", h.chain(h.updateRolePermissions, middlewares...))

	// User roles
	r.GET("/api/rbac/users/{user_id}/roles", h.chain(h.getUserRoles, middlewares...))
	r.POST("/api/rbac/users/{user_id}/roles", h.chain(h.assignUserRole, middlewares...))
	r.DELETE("/api/rbac/users/{user_id}/roles/{role_id}", h.chain(h.removeUserRole, middlewares...))

	// Permission check
	r.GET("/api/rbac/check", h.chain(h.checkPermission, middlewares...))
}

// chain applies middlewares to a handler
func (h *RBACHandler) chain(handler func(ctx *fasthttp.RequestCtx), middlewares ...schemas.BifrostHTTPMiddleware) func(ctx *fasthttp.RequestCtx) {
	wrapped := func(ctx *fasthttp.RequestCtx) { handler(ctx) }
	for i := len(middlewares) - 1; i >= 0; i-- {
		mw := middlewares[i]
		prev := wrapped
		wrapped = func(ctx *fasthttp.RequestCtx) {
			mw(func(ctx *fasthttp.RequestCtx) { prev(ctx) })(ctx)
		}
	}
	return wrapped
}

// listRoles handles GET /api/rbac/roles
func (h *RBACHandler) listRoles(ctx *fasthttp.RequestCtx) {
	roles, err := h.store.GetRoles(ctx)
	if err != nil {
		SendError(ctx, fasthttp.StatusInternalServerError, fmt.Sprintf("Failed to get roles: %v", err))
		return
	}
	SendJSON(ctx, map[string]any{"roles": roles, "total": len(roles)})
}

// getRole handles GET /api/rbac/roles/{id}
func (h *RBACHandler) getRole(ctx *fasthttp.RequestCtx) {
	id := ctx.UserValue("id").(string)
	role, err := h.store.GetRole(ctx, id)
	if err != nil {
		SendError(ctx, fasthttp.StatusNotFound, "Role not found")
		return
	}
	SendJSON(ctx, map[string]any{"role": role})
}

// createRole handles POST /api/rbac/roles
func (h *RBACHandler) createRole(ctx *fasthttp.RequestCtx) {
	var req struct {
		ID          string `json:"id"`
		Name        string `json:"name"`
		Description string `json:"description"`
		IsDefault   bool   `json:"is_default"`
	}
	if err := json.Unmarshal(ctx.PostBody(), &req); err != nil {
		SendError(ctx, fasthttp.StatusBadRequest, "Invalid JSON")
		return
	}
	if req.Name == "" {
		SendError(ctx, fasthttp.StatusBadRequest, "Role name is required")
		return
	}

	role := &tables.TableRole{
		ID: req.ID, Name: req.Name, Description: req.Description, IsDefault: req.IsDefault,
	}
	if err := h.store.CreateRole(ctx, role); err != nil {
		SendError(ctx, fasthttp.StatusInternalServerError, fmt.Sprintf("Failed to create role: %v", err))
		return
	}
	ctx.SetStatusCode(fasthttp.StatusCreated)
	SendJSON(ctx, map[string]any{"message": "Role created", "role": role})
}

// updateRole handles PUT /api/rbac/roles/{id}
func (h *RBACHandler) updateRole(ctx *fasthttp.RequestCtx) {
	id := ctx.UserValue("id").(string)
	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		IsDefault   bool   `json:"is_default"`
	}
	if err := json.Unmarshal(ctx.PostBody(), &req); err != nil {
		SendError(ctx, fasthttp.StatusBadRequest, "Invalid JSON")
		return
	}

	role := &tables.TableRole{ID: id, Name: req.Name, Description: req.Description, IsDefault: req.IsDefault}
	if err := h.store.UpdateRole(ctx, role); err != nil {
		SendError(ctx, fasthttp.StatusInternalServerError, fmt.Sprintf("Failed to update role: %v", err))
		return
	}
	SendJSON(ctx, map[string]any{"message": "Role updated", "role": role})
}

// deleteRole handles DELETE /api/rbac/roles/{id}
func (h *RBACHandler) deleteRole(ctx *fasthttp.RequestCtx) {
	id := ctx.UserValue("id").(string)
	if err := h.store.DeleteRole(ctx, id); err != nil {
		SendError(ctx, fasthttp.StatusInternalServerError, fmt.Sprintf("Failed to delete role: %v", err))
		return
	}
	SendJSON(ctx, map[string]any{"message": "Role deleted"})
}

// getRolePermissions handles GET /api/rbac/roles/{id}/permissions
func (h *RBACHandler) getRolePermissions(ctx *fasthttp.RequestCtx) {
	id := ctx.UserValue("id").(string)
	perms, err := h.store.GetRolePermissions(ctx, id)
	if err != nil {
		SendError(ctx, fasthttp.StatusInternalServerError, fmt.Sprintf("Failed to get permissions: %v", err))
		return
	}
	SendJSON(ctx, map[string]any{"permissions": perms, "total": len(perms)})
}

// updateRolePermissions handles PUT /api/rbac/roles/{id}/permissions
func (h *RBACHandler) updateRolePermissions(ctx *fasthttp.RequestCtx) {
	id := ctx.UserValue("id").(string)
	var req struct {
		Permissions []struct {
			Resource  string `json:"resource"`
			Operation string `json:"operation"`
			Allowed   bool   `json:"allowed"`
		} `json:"permissions"`
	}
	if err := json.Unmarshal(ctx.PostBody(), &req); err != nil {
		SendError(ctx, fasthttp.StatusBadRequest, "Invalid JSON")
		return
	}

	for _, p := range req.Permissions {
		perm := &tables.TableRolePermission{
			RoleID: id, Resource: p.Resource, Operation: p.Operation, Allowed: p.Allowed,
		}
		if err := h.store.UpsertRolePermission(ctx, perm); err != nil {
			SendError(ctx, fasthttp.StatusInternalServerError, fmt.Sprintf("Failed to upsert permission: %v", err))
			return
		}
	}
	SendJSON(ctx, map[string]any{"message": "Permissions updated", "count": len(req.Permissions)})
}

// getUserRoles handles GET /api/rbac/users/{user_id}/roles
func (h *RBACHandler) getUserRoles(ctx *fasthttp.RequestCtx) {
	userID := ctx.UserValue("user_id").(string)
	roles, err := h.store.GetUserRoles(ctx, userID)
	if err != nil {
		SendError(ctx, fasthttp.StatusInternalServerError, fmt.Sprintf("Failed to get user roles: %v", err))
		return
	}
	SendJSON(ctx, map[string]any{"user_id": userID, "roles": roles})
}

// assignUserRole handles POST /api/rbac/users/{user_id}/roles
func (h *RBACHandler) assignUserRole(ctx *fasthttp.RequestCtx) {
	userID := ctx.UserValue("user_id").(string)
	var req struct {
		RoleID string `json:"role_id"`
	}
	if err := json.Unmarshal(ctx.PostBody(), &req); err != nil {
		SendError(ctx, fasthttp.StatusBadRequest, "Invalid JSON")
		return
	}
	if req.RoleID == "" {
		SendError(ctx, fasthttp.StatusBadRequest, "role_id is required")
		return
	}

	if err := h.store.AssignUserRole(ctx, userID, req.RoleID); err != nil {
		SendError(ctx, fasthttp.StatusInternalServerError, fmt.Sprintf("Failed to assign role: %v", err))
		return
	}
	ctx.SetStatusCode(fasthttp.StatusCreated)
	SendJSON(ctx, map[string]any{"message": "Role assigned"})
}

// removeUserRole handles DELETE /api/rbac/users/{user_id}/roles/{role_id}
func (h *RBACHandler) removeUserRole(ctx *fasthttp.RequestCtx) {
	userID := ctx.UserValue("user_id").(string)
	roleID := ctx.UserValue("role_id").(string)
	if err := h.store.RemoveUserRole(ctx, userID, roleID); err != nil {
		SendError(ctx, fasthttp.StatusInternalServerError, fmt.Sprintf("Failed to remove role: %v", err))
		return
	}
	SendJSON(ctx, map[string]any{"message": "Role removed"})
}

// checkPermission handles GET /api/rbac/check?user_id=xxx&resource=yyy&operation=zzz
func (h *RBACHandler) checkPermission(ctx *fasthttp.RequestCtx) {
	userID := string(ctx.QueryArgs().Peek("user_id"))
	resource := string(ctx.QueryArgs().Peek("resource"))
	operation := string(ctx.QueryArgs().Peek("operation"))

	if userID == "" || resource == "" || operation == "" {
		SendError(ctx, fasthttp.StatusBadRequest, "user_id, resource, and operation are required")
		return
	}

	allowed, err := h.store.CheckUserPermission(context.Background(), userID, resource, operation)
	if err != nil {
		SendError(ctx, fasthttp.StatusInternalServerError, fmt.Sprintf("Failed to check permission: %v", err))
		return
	}
	SendJSON(ctx, map[string]any{"user_id": userID, "resource": resource, "operation": operation, "allowed": allowed})
}
