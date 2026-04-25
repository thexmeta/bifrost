package main

import (
	"context"
	"fmt"
	"gorm.io/gorm"
)

func main() {
	db := &gorm.DB{
		Statement: &gorm.Statement{Context: context.WithValue(context.Background(), "test", "test")},
	}
	ctx := db.Statement.Context
	fmt.Println(ctx)
}
