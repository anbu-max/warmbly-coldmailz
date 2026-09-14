export interface WarmupCooldownTask {
    task_id: string;
    email_account_id: string;
    email: string;
    scheduled_at: string | null;
    seconds_remaining: number;
    total_cooldown_seconds: number;
    status: "in_cooldown" | "sending_now" | "scheduled_next" | "queued" | string;
}

export interface WarmupTelemetryStats {
    total_sent_today: number;
    total_target_today: number;
    reply_rate_percent: number;
    min_delay_seconds: number;
    active_window: string;
    healthy_mailbox_count: number;
    active_pool_count: number;
}

export interface WarmupTelemetryResponse {
    is_running: boolean;
    distribution_mode: "round_robin" | "standard" | string;
    current_cooldown: WarmupCooldownTask | null;
    next_in_line: WarmupCooldownTask | null;
    queue: WarmupCooldownTask[];
    stats: WarmupTelemetryStats;
}
