package configstore

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/maximhq/bifrost/framework/configstore/tables"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// ─────────────────────────────────────────────────────────────
// RBAC — Roles
// ─────────────────────────────────────────────────────────────

func (s *RDBConfigStore) GetRoles(ctx context.Context) ([]tables.TableRole, error) {
	var roles []tables.TableRole
	if err := s.db.WithContext(ctx).Order("name ASC").Find(&roles).Error; err != nil {
		return nil, fmt.Errorf("failed to get roles: %w", err)
	}
	return roles, nil
}

func (s *RDBConfigStore) GetRole(ctx context.Context, id string) (*tables.TableRole, error) {
	var role tables.TableRole
	if err := s.db.WithContext(ctx).Preload("Permissions").Where("id = ?", id).First(&role).Error; err != nil {
		return nil, err
	}
	return &role, nil
}

func (s *RDBConfigStore) GetDefaultRole(ctx context.Context) (*tables.TableRole, error) {
	var role tables.TableRole
	if err := s.db.WithContext(ctx).Preload("Permissions").Where("is_default = ?", true).First(&role).Error; err != nil {
		return nil, err
	}
	return &role, nil
}

func (s *RDBConfigStore) CreateRole(ctx context.Context, role *tables.TableRole, tx ...*gorm.DB) error {
	db := s.db
	if len(tx) > 0 && tx[0] != nil {
		db = tx[0]
	}
	if role.ID == "" {
		role.ID = uuid.New().String()
	}
	if err := db.WithContext(ctx).Create(role).Error; err != nil {
		return fmt.Errorf("failed to create role: %w", err)
	}
	return nil
}

func (s *RDBConfigStore) UpdateRole(ctx context.Context, role *tables.TableRole, tx ...*gorm.DB) error {
	db := s.db
	if len(tx) > 0 && tx[0] != nil {
		db = tx[0]
	}
	if err := db.WithContext(ctx).Where("id = ?", role.ID).Updates(map[string]any{
		"name":        role.Name,
		"description": role.Description,
		"is_default":  role.IsDefault,
	}).Error; err != nil {
		return fmt.Errorf("failed to update role: %w", err)
	}
	return nil
}

func (s *RDBConfigStore) DeleteRole(ctx context.Context, id string, tx ...*gorm.DB) error {
	db := s.db
	if len(tx) > 0 && tx[0] != nil {
		db = tx[0]
	}
	if err := db.WithContext(ctx).Where("id = ?", id).Delete(&tables.TableRole{}).Error; err != nil {
		return fmt.Errorf("failed to delete role: %w", err)
	}
	return nil
}

// ─────────────────────────────────────────────────────────────
// RBAC — Role Permissions
// ─────────────────────────────────────────────────────────────

func (s *RDBConfigStore) GetRolePermissions(ctx context.Context, roleID string) ([]tables.TableRolePermission, error) {
	var perms []tables.TableRolePermission
	if err := s.db.WithContext(ctx).Where("role_id = ?", roleID).Find(&perms).Error; err != nil {
		return nil, fmt.Errorf("failed to get role permissions: %w", err)
	}
	return perms, nil
}

func (s *RDBConfigStore) UpsertRolePermission(ctx context.Context, perm *tables.TableRolePermission, tx ...*gorm.DB) error {
	db := s.db
	if len(tx) > 0 && tx[0] != nil {
		db = tx[0]
	}
	if err := db.WithContext(ctx).Clauses(
		clause.OnConflict{
			Columns:   []clause.Column{{Name: "role_id"}, {Name: "resource"}, {Name: "operation"}},
			DoUpdates: clause.Assignments(map[string]any{"allowed": perm.Allowed}),
		},
	).Create(perm).Error; err != nil {
		return fmt.Errorf("failed to upsert role permission: %w", err)
	}
	return nil
}

func (s *RDBConfigStore) DeleteRolePermission(ctx context.Context, roleID, resource, operation string, tx ...*gorm.DB) error {
	db := s.db
	if len(tx) > 0 && tx[0] != nil {
		db = tx[0]
	}
	if err := db.WithContext(ctx).
		Where("role_id = ? AND resource = ? AND operation = ?", roleID, resource, operation).
		Delete(&tables.TableRolePermission{}).Error; err != nil {
		return fmt.Errorf("failed to delete role permission: %w", err)
	}
	return nil
}

// ─────────────────────────────────────────────────────────────
// RBAC — User Roles
// ─────────────────────────────────────────────────────────────

func (s *RDBConfigStore) GetUserRoles(ctx context.Context, userID string) ([]tables.TableRole, error) {
	var roles []tables.TableRole
	if err := s.db.WithContext(ctx).
		Table("rbac_user_roles").
		Select("rbac_roles.*").
		Joins("JOIN rbac_roles ON rbac_roles.id = rbac_user_roles.role_id").
		Where("rbac_user_roles.user_id = ?", userID).
		Find(&roles).Error; err != nil {
		return nil, fmt.Errorf("failed to get user roles: %w", err)
	}
	return roles, nil
}

func (s *RDBConfigStore) AssignUserRole(ctx context.Context, userID, roleID string, tx ...*gorm.DB) error {
	db := s.db
	if len(tx) > 0 && tx[0] != nil {
		db = tx[0]
	}
	ur := tables.TableUserRole{UserID: userID, RoleID: roleID}
	if err := db.WithContext(ctx).Clauses(
		clause.OnConflict{
			DoNothing: true,
		},
	).Create(&ur).Error; err != nil {
		return fmt.Errorf("failed to assign user role: %w", err)
	}
	return nil
}

func (s *RDBConfigStore) RemoveUserRole(ctx context.Context, userID, roleID string, tx ...*gorm.DB) error {
	db := s.db
	if len(tx) > 0 && tx[0] != nil {
		db = tx[0]
	}
	if err := db.WithContext(ctx).
		Where("user_id = ? AND role_id = ?", userID, roleID).
		Delete(&tables.TableUserRole{}).Error; err != nil {
		return fmt.Errorf("failed to remove user role: %w", err)
	}
	return nil
}

func (s *RDBConfigStore) CheckUserPermission(ctx context.Context, userID, resource, operation string) (bool, error) {
	var allowed bool
	err := s.db.WithContext(ctx).
		Table("rbac_role_permissions").
		Select("COALESCE(MAX(rbac_role_permissions.allowed), FALSE)").
		Joins("JOIN rbac_user_roles ON rbac_user_roles.role_id = rbac_role_permissions.role_id").
		Where("rbac_user_roles.user_id = ? AND rbac_role_permissions.resource = ? AND rbac_role_permissions.operation = ?", userID, resource, operation).
		Find(&allowed).Error
	if err != nil {
		return false, fmt.Errorf("failed to check user permission: %w", err)
	}

	// If user has no roles (no explicit permission), deny by default
	if !allowed {
		return false, nil
	}
	return true, nil
}
