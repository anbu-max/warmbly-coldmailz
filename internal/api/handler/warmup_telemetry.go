package handler

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/warmbly/warmbly/internal/api/middleware"
	"github.com/warmbly/warmbly/internal/errx"
)

// WarmupCooldownTask represents a single task in the warmup queue.
type WarmupCooldownTask struct {
	TaskID               uuid.UUID  `json:"task_id"`
	EmailAccountID       uuid.UUID  `json:"email_account_id"`
	Email                string     `json:"email"`
	ScheduledAt          *time.Time `json:"scheduled_at"`
	SecondsRemaining     int        `json:"seconds_remaining"`
	TotalCooldownSeconds int        `json:"total_cooldown_seconds"`
	Status               string     `json:"status"` // "in_cooldown", "sending_now", "scheduled_next", "queued"
}

// WarmupTelemetryStats aggregates org-wide warmup metrics.
type WarmupTelemetryStats struct {
	TotalSentToday      int    `json:"total_sent_today"`
	TotalTargetToday    int    `json:"total_target_today"`
	ReplyRatePercent    int    `json:"reply_rate_percent"`
	MinDelaySeconds     int    `json:"min_delay_seconds"`
	ActiveWindow        string `json:"active_window"`
	HealthyMailboxCount int    `json:"healthy_mailbox_count"`
	ActivePoolCount     int    `json:"active_pool_count"`
}

// WarmupTelemetryResponse contains full live telemetry for the warmup inspector.
type WarmupTelemetryResponse struct {
	IsRunning        bool                 `json:"is_running"`
	DistributionMode string               `json:"distribution_mode"` // "round_robin"
	CurrentCooldown  *WarmupCooldownTask  `json:"current_cooldown"`
	NextInLine       *WarmupCooldownTask  `json:"next_in_line"`
	Queue            []WarmupCooldownTask `json:"queue"`
	Stats            WarmupTelemetryStats `json:"stats"`
}

// GetWarmupTelemetry returns live warmup status, current cooldown email, next scheduled email,
// and round-robin queue telemetry for the active organization.
func (h *Handler) GetWarmupTelemetry(c *gin.Context) {
	orgID := middleware.GetOrganizationID(c)
	if orgID == nil {
		errx.Handle(c, errx.ErrNoOrganization)
		return
	}

	if h.DB == nil {
		errx.Handle(c, errx.New(errx.InternalServer, "database connection unavailable"))
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	now := time.Now().UTC()

	// 1. Fetch pending warmup tasks ordered by scheduled_at ASC
	tasksQuery := `
		SELECT 
			t.id, 
			t.scheduled_at, 
			ea.id as email_account_id, 
			ea.email,
			COALESCE(ea.min_wait_time, 180) as min_wait_time,
			COALESCE(ea.warmup_reply_rate, 35) as warmup_reply_rate
		FROM tasks t
		JOIN email_accounts ea ON ea.id = t.email_account_id
		WHERE t.task_type = 'warmup'
		  AND t.status = 'pending'
		  AND ea.organization_id = $1
		ORDER BY t.scheduled_at ASC
		LIMIT 20;
	`

	rows, err := h.DB.Query(ctx, tasksQuery, *orgID)
	if err != nil {
		errx.Handle(c, errx.New(errx.InternalServer, "failed to query pending warmup tasks: "+err.Error()))
		return
	}
	defer rows.Close()

	var queue []WarmupCooldownTask
	for rows.Next() {
		var (
			taskID         uuid.UUID
			scheduledAt    *time.Time
			emailAccountID uuid.UUID
			email          string
			minWaitTime    int
			replyRate      int
		)
		if scanErr := rows.Scan(&taskID, &scheduledAt, &emailAccountID, &email, &minWaitTime, &replyRate); scanErr != nil {
			continue
		}

		secsRemaining := 0
		taskStatus := "queued"
		if scheduledAt != nil {
			diff := int(scheduledAt.Sub(now).Seconds())
			if diff > 0 {
				secsRemaining = diff
				taskStatus = "in_cooldown"
			} else {
				secsRemaining = 0
				taskStatus = "sending_now"
			}
		}

		queue = append(queue, WarmupCooldownTask{
			TaskID:               taskID,
			EmailAccountID:       emailAccountID,
			Email:                email,
			ScheduledAt:          scheduledAt,
			SecondsRemaining:     secsRemaining,
			TotalCooldownSeconds: minWaitTime,
			Status:               taskStatus,
		})
	}

	// 2. Query all accounts and daily stats for this organization
	accountsQuery := `
		SELECT 
			ea.id,
			ea.email,
			ea.status,
			ea.warmup,
			ea.warmup_paused_at,
			COALESCE(ea.min_wait_time, 180) as min_wait_time,
			COALESCE(ea.warmup_reply_rate, 35) as warmup_reply_rate,
			COALESCE(ws.emails_sent, 0) as emails_sent,
			COALESCE(ws.emails_replied, 0) as emails_replied,
			COALESCE(ws.target_volume, ea.warmup_max, 10) as target_volume
		FROM email_accounts ea
		LEFT JOIN warmup_statistics ws ON ws.email_account_id = ea.id AND ws.date = CURRENT_DATE
		WHERE ea.organization_id = $1;
	`

	accRows, err := h.DB.Query(ctx, accountsQuery, *orgID)
	if err != nil {
		errx.Handle(c, errx.New(errx.InternalServer, "failed to query email account statistics: "+err.Error()))
		return
	}
	defer accRows.Close()

	totalSentToday := 0
	totalTargetToday := 0
	healthyCount := 0
	activePoolCount := 0
	totalReplyRate := 0
	totalMinDelay := 0
	accountCount := 0

	for accRows.Next() {
		var (
			accID          uuid.UUID
			accEmail       string
			accStatus      string
			warmupStart    *time.Time
			warmupPausedAt *time.Time
			minWaitTime    int
			replyRate      int
			sent           int
			replied        int
			target         int
		)
		if scanErr := accRows.Scan(&accID, &accEmail, &accStatus, &warmupStart, &warmupPausedAt, &minWaitTime, &replyRate, &sent, &replied, &target); scanErr != nil {
			continue
		}

		accountCount++
		totalSentToday += sent
		totalTargetToday += target
		totalReplyRate += replyRate
		totalMinDelay += minWaitTime

		if accStatus == "active" {
			healthyCount++
		}
		if warmupStart != nil && warmupPausedAt == nil && accStatus == "active" {
			activePoolCount++
		}
	}

	avgReplyRate := 35
	avgMinDelay := 180
	if accountCount > 0 {
		avgReplyRate = totalReplyRate / accountCount
		avgMinDelay = totalMinDelay / accountCount
	}

	isRunning := (activePoolCount > 0) || (len(queue) > 0)

	var currentCooldown *WarmupCooldownTask
	var nextInLine *WarmupCooldownTask

	if len(queue) > 0 {
		first := queue[0]
		currentCooldown = &first
		if len(queue) > 1 {
			second := queue[1]
			second.Status = "scheduled_next"
			nextInLine = &second
		}
	}

	resp := WarmupTelemetryResponse{
		IsRunning:        isRunning,
		DistributionMode: "round_robin",
		CurrentCooldown:  currentCooldown,
		NextInLine:       nextInLine,
		Queue:            queue,
		Stats: WarmupTelemetryStats{
			TotalSentToday:      totalSentToday,
			TotalTargetToday:    totalTargetToday,
			ReplyRatePercent:    avgReplyRate,
			MinDelaySeconds:     avgMinDelay,
			ActiveWindow:        "24/7 (00:00 - 23:59)",
			HealthyMailboxCount: healthyCount,
			ActivePoolCount:     activePoolCount,
		},
	}

	c.JSON(http.StatusOK, resp)
}
