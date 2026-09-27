package emailverify

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCheckIfEmailExists(t *testing.T) {
	tests := []struct {
		name       string
		respJSON   string
		wantStatus Status
		wantSub    SubStatus
		wantCatch  bool
		wantMX     bool
	}{
		{
			name: "safe deliverable email",
			respJSON: `{
				"input": "good@example.com",
				"is_reachable": "safe",
				"mx": {"accepts_mail": true, "records": ["mx.example.com"]},
				"smtp": {"can_connect_smtp": true, "is_deliverable": true, "is_catch_all": false},
				"syntax": {"is_valid_syntax": true}
			}`,
			wantStatus: StatusValid,
			wantMX:     true,
		},
		{
			name: "invalid disposable email",
			respJSON: `{
				"input": "trash@mailinator.com",
				"is_reachable": "invalid",
				"misc": {"is_disposable": true},
				"mx": {"accepts_mail": false},
				"smtp": {"is_deliverable": false},
				"syntax": {"is_valid_syntax": true}
			}`,
			wantStatus: StatusInvalid,
			wantSub:    SubStatusDisposable,
		},
		{
			name: "invalid syntax",
			respJSON: `{
				"input": "broken@@email",
				"is_reachable": "invalid",
				"mx": {"accepts_mail": false},
				"syntax": {"is_valid_syntax": false}
			}`,
			wantStatus: StatusInvalid,
			wantSub:    SubStatusSyntax,
		},
		{
			name: "risky catch-all domain",
			respJSON: `{
				"input": "catch@company.com",
				"is_reachable": "risky",
				"mx": {"accepts_mail": true},
				"smtp": {"can_connect_smtp": true, "is_catch_all": true},
				"syntax": {"is_valid_syntax": true}
			}`,
			wantStatus: StatusRisky,
			wantSub:    SubStatusCatchAll,
			wantCatch:  true,
			wantMX:     true,
		},
		{
			name: "unknown probe failure",
			respJSON: `{
				"input": "timeout@domain.com",
				"is_reachable": "unknown",
				"mx": {"accepts_mail": true},
				"smtp": {"error": {"type": "Timeout", "message": "connection timed out"}},
				"syntax": {"is_valid_syntax": true}
			}`,
			wantStatus: StatusUnknown,
			wantMX:     true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusOK)
				_, _ = w.Write([]byte(tt.respJSON))
			}))
			defer server.Close()

			client := NewCheckIfEmailExists(server.URL)
			res, err := client.Check(context.Background(), "test@example.com")
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if res.Status != tt.wantStatus {
				t.Errorf("got status %q, want %q", res.Status, tt.wantStatus)
			}
			if tt.wantSub != "" && res.SubStatus != tt.wantSub {
				t.Errorf("got sub-status %q, want %q", res.SubStatus, tt.wantSub)
			}
			if res.IsCatchAll != tt.wantCatch {
				t.Errorf("got is_catch_all %v, want %v", res.IsCatchAll, tt.wantCatch)
			}
			if res.HasMX != tt.wantMX {
				t.Errorf("got has_mx %v, want %v", res.HasMX, tt.wantMX)
			}
		})
	}
}
