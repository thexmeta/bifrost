package main

import (
	"fmt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func main() {
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	if err != nil {
		panic(err)
	}
	if db.Statement != nil {
		fmt.Printf("Statement is not nil, Context is: %v\n", db.Statement.Context)
	} else {
		fmt.Println("Statement is nil")
	}
}
