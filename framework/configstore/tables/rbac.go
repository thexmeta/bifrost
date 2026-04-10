package tables

import (
	"time"
)

// TableRole represents an RBAC role
type TableRole struct {
	ID          string    `gorm:"type:varchar(255);primaryKey" json:"id"`
	Name        string    `gorm:"type:varchar(100);not null;uniqueIndex" json:"name"`
	Description string    `gorm:"type:text" json:"description"`
	IsDefault   bool      `gorm:"default:false" json:"is_default"`
	CreatedAt   time.Time `gorm:"index;not null" json:"created_at"`
	UpdatedAt   time.Time `gorm:"index;not null" json:"updated_at"`

	// Relationships
	Permissions []TableRolePermission `gorm:"foreignKey:RoleID;constraint:OnDelete:CASCADE" json:"permissions,omitempty"`
}

// TableName sets the table name
func (TableRole) TableName() string { return "rbac_roles" }

// TableRolePermission represents a permission grant for a role
type TableRolePermission struct {
	ID        uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	RoleID    string `gorm:"type:varchar(255);not null;uniqueIndex:idx_role_resource_op" json:"role_id"`
	Resource  string `gorm:"type:varchar(100);not null;uniqueIndex:idx_role_resource_op" json:"resource"`
	Operation string `gorm:"type:varchar(50);not null;uniqueIndex:idx_role_resource_op" json:"operation"`
	Allowed   bool   `gorm:"default:true" json:"allowed"`

	// Relationships
	Role TableRole `gorm:"foreignKey:RoleID" json:"-"`
}

// TableName sets the table name
func (TableRolePermission) TableName() string { return "rbac_role_permissions" }

// TableUserRole maps users to roles
type TableUserRole struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    string    `gorm:"type:varchar(255);not null;uniqueIndex:idx_user_role;index:idx_user_role_unique,unique"`
	RoleID    string    `gorm:"type:varchar(255);not null;uniqueIndex:idx_user_role;index:idx_user_role_unique,unique"`
	CreatedAt time.Time `gorm:"index;not null" json:"created_at"`

	// Relationships
	Role TableRole `gorm:"foreignKey:RoleID" json:"role,omitempty"`
}

// TableName sets the table name
func (TableUserRole) TableName() string { return "rbac_user_roles" }
