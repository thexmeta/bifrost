package bifrost

import (
	"testing"
)

func TestIsRateLimitErrorMessage_Basic(t *testing.T) {
	if !IsRateLimitErrorMessage("rate limit exceeded") {
		t.Error("Expected true")
	}
}
