#!/bin/bash
cd core
# Revert the uncommitted changes we made earlier
git restore providers/openai/openai.go providers/nvidianim/nvidianim.go
go test -coverprofile=coverage.out -run TestIsRateLimitError bifrost_test.go bifrost.go utils.go logger.go
go tool cover -func=coverage.out | grep IsRateLimitErrorMessage
