package main

import (
	"fmt"
	"gorm.io/gorm"
)

func main() {
	db := &gorm.DB{}
	if db.Statement != nil {
		fmt.Println("Statement exists")
	} else {
		fmt.Println("Statement is nil")
	}
}
