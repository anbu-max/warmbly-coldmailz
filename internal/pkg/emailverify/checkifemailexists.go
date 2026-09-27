package emailverify

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// CheckIfEmailExistsClient calls the check-if-email-exists (reacher) REST API.
type CheckIfEmailExistsClient struct {
	baseURL string
	client  *http.Client
}

// NewCheckIfEmailExists constructs a client for check-if-email-exists.
func NewCheckIfEmailExists(baseURL string) *CheckIfEmailExistsClient {
	if baseURL == "" {
		baseURL = "http://email-validator:8080"
	}
	return &CheckIfEmailExistsClient{
		baseURL: strings.TrimRight(baseURL, "/"),
		client:  &http.Client{Timeout: 30 * time.Second},
	}
}

type reacherResponse struct {
	Input       string `json:"input"`
	IsReachable string `json:"is_reachable"`
	Misc        struct {
		IsDisposable  bool `json:"is_disposable"`
		IsRoleAccount bool `json:"is_role_account"`
		IsB2C         bool `json:"is_b2c"`
	} `json:"misc"`
	MX struct {
		AcceptsMail bool     `json:"accepts_mail"`
		Records     []string `json:"records"`
	} `json:"mx"`
	SMTP struct {
		CanConnectSMTP bool `json:"can_connect_smtp"`
		HasFullInbox   bool `json:"has_full_inbox"`
		IsCatchAll     bool `json:"is_catch_all"`
		IsDeliverable  bool `json:"is_deliverable"`
		IsDisabled     bool `json:"is_disabled"`
		Error          *struct {
			Type    string `json:"type"`
			Message string `json:"message"`
		} `json:"error"`
	} `json:"smtp"`
	Syntax struct {
		Address         *string `json:"address"`
		Domain          string  `json:"domain"`
		IsValidSyntax   bool    `json:"is_valid_syntax"`
		Username        string  `json:"username"`
		NormalizedEmail *string `json:"normalized_email"`
		Suggestion      *string `json:"suggestion"`
	} `json:"syntax"`
}

// Verify implements the emailverify.Verifier interface.
func (c *CheckIfEmailExistsClient) Verify(ctx context.Context, email string) Result {
	res, _ := c.Check(ctx, email)
	return res
}

// Check implements the emailverify.ProviderClient interface.
func (c *CheckIfEmailExistsClient) Check(ctx context.Context, email string) (Result, error) {
	cleanEmail := strings.ToLower(strings.TrimSpace(email))
	res := Result{
		Email:     cleanEmail,
		CheckedAt: time.Now().UTC(),
		Status:    StatusUnknown,
		Provider:  ProviderCheckIfEmailExists,
	}

	payload, err := json.Marshal(map[string]string{"to_email": cleanEmail})
	if err != nil {
		res.Reason = "failed to encode request: " + err.Error()
		return res, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/v0/check_email", bytes.NewReader(payload))
	if err != nil {
		res.Reason = "check-if-email-exists request creation failed: " + err.Error()
		return res, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(req)
	if err != nil {
		res.Reason = "check-if-email-exists unreachable: " + err.Error()
		return res, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		res.Reason = fmt.Sprintf("check-if-email-exists HTTP %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
		return res, fmt.Errorf("check-if-email-exists: HTTP %d", resp.StatusCode)
	}

	var out reacherResponse
	bodyBytes, err := io.ReadAll(io.LimitReader(resp.Body, 64<<10))
	if err != nil {
		res.Reason = "failed to read response: " + err.Error()
		return res, err
	}

	if err := json.Unmarshal(bodyBytes, &out); err != nil {
		res.Reason = "failed to parse check-if-email-exists response: " + err.Error()
		return res, err
	}

	res.HasMX = out.MX.AcceptsMail
	res.IsCatchAll = out.SMTP.IsCatchAll

	switch strings.ToLower(out.IsReachable) {
	case "safe":
		res.Status = StatusValid
		res.Reason = "check-if-email-exists: mailbox verified deliverable"
		res.Confidence = 95
	case "risky":
		res.Status = StatusRisky
		if out.SMTP.IsCatchAll {
			res.SubStatus = SubStatusCatchAll
			res.Reason = "check-if-email-exists: catch-all domain detected"
		} else if out.Misc.IsRoleAccount {
			res.SubStatus = SubStatusRole
			res.Reason = "check-if-email-exists: role-based address"
		} else {
			res.Reason = "check-if-email-exists: risky address"
		}
		res.Confidence = 50
	case "invalid":
		res.Status = StatusInvalid
		if !out.Syntax.IsValidSyntax {
			res.SubStatus = SubStatusSyntax
			res.Reason = "check-if-email-exists: invalid syntax"
		} else if out.Misc.IsDisposable {
			res.SubStatus = SubStatusDisposable
			res.Reason = "check-if-email-exists: disposable email provider"
		} else if !out.MX.AcceptsMail {
			res.SubStatus = SubStatusNoMX
			res.Reason = "check-if-email-exists: domain has no valid MX records"
		} else if out.SMTP.HasFullInbox {
			res.SubStatus = SubStatusMailboxFull
			res.Reason = "check-if-email-exists: mailbox full"
		} else if out.SMTP.IsDisabled {
			res.Reason = "check-if-email-exists: account disabled"
		} else {
			res.Reason = "check-if-email-exists: undeliverable address"
		}
		res.Confidence = 90
	default:
		res.Status = StatusUnknown
		if out.SMTP.Error != nil {
			res.Reason = fmt.Sprintf("check-if-email-exists probe unknown: %s", out.SMTP.Error.Message)
		} else {
			res.Reason = "check-if-email-exists: unknown deliverability status"
		}
		res.Confidence = 20
	}

	return res, nil
}

// ObservesBalance reports false as self-hosted check-if-email-exists is unlimited.
func (c *CheckIfEmailExistsClient) ObservesBalance() bool { return false }

// Account returns nil as self-hosted check-if-email-exists requires no credits.
func (c *CheckIfEmailExistsClient) Account(ctx context.Context) (*int, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+"/", nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.client.Do(req)
	if err != nil {
		return nil, err
	}
	_ = resp.Body.Close()
	unlimited := 1000000
	return &unlimited, nil
}
