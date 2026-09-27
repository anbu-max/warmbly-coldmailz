"use client";

import * as React from "react";
import {
    FlameIcon,
    ClockIcon,
    ArrowRightIcon,
    InfoIcon,
    CheckCircle2Icon,
    LayersIcon,
    ShuffleIcon,
    ActivityIcon,
    TimerIcon,
    SparklesIcon,
    RefreshCwIcon,
} from "lucide-react";
import useWarmupTelemetry from "@/lib/api/hooks/app/emails/useWarmupTelemetry";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

function formatSeconds(secs: number): string {
    if (secs <= 0) return "0s";
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    if (mins > 0) {
        return `${mins}m ${remaining}s`;
    }
    return `${remaining}s`;
}

export default function WarmupTelemetryButton() {
    const { data: telemetry, isLoading, refetch } = useWarmupTelemetry();
    const [open, setOpen] = React.useState(false);
    const [localSeconds, setLocalSeconds] = React.useState<number>(0);

    // Sync local countdown with server response
    React.useEffect(() => {
        if (telemetry?.current_cooldown?.seconds_remaining !== undefined) {
            setLocalSeconds(telemetry.current_cooldown.seconds_remaining);
        }
    }, [telemetry?.current_cooldown?.seconds_remaining]);

    // Local 1-second interval ticker for ultra-smooth countdowns
    React.useEffect(() => {
        if (localSeconds <= 0) return;
        const interval = setInterval(() => {
            setLocalSeconds((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [localSeconds]);

    const isRunning = Boolean(telemetry?.is_running && telemetry?.current_cooldown);
    const hasActiveTask = Boolean(telemetry?.current_cooldown);
    const currentEmail = telemetry?.current_cooldown?.email ?? "No active task in cooldown";
    const nextEmail = telemetry?.next_in_line?.email ?? (telemetry?.queue?.[1]?.email ?? "No scheduled mailbox");
    const totalCooldown = telemetry?.current_cooldown?.total_cooldown_seconds ?? 180;
    const progressPercent = hasActiveTask && totalCooldown > 0
        ? Math.min(100, Math.max(5, Math.round(((totalCooldown - localSeconds) / totalCooldown) * 100)))
        : 100;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    type="button"
                    title="Inspect live warmup cooldown and round-robin queue"
                    className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border text-[11.5px] font-medium transition-all shadow-xs shrink-0 cursor-pointer ${
                        isRunning && localSeconds > 0
                            ? "border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400"
                            : "border-slate-700 bg-slate-800/40 hover:bg-slate-800 text-slate-300"
                    }`}
                >
                    {isRunning && localSeconds > 0 ? (
                        <span className="relative flex size-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full size-2 bg-amber-500"></span>
                        </span>
                    ) : (
                        <span className="size-2 rounded-full bg-slate-500" />
                    )}
                    <FlameIcon className={`size-3 ${isRunning && localSeconds > 0 ? "text-amber-400" : "text-slate-400"}`} />
                    <span className="hidden sm:inline">Warmup:</span>
                    <span className={`font-mono tabular-nums font-semibold ${isRunning && localSeconds > 0 ? "text-amber-300" : "text-slate-300"}`}>
                        {isRunning && localSeconds > 0 ? `${formatSeconds(localSeconds)}` : (isRunning ? "Dispatching" : "Idle")}
                    </span>
                    <InfoIcon className="size-3 ml-0.5 text-slate-400 hover:text-slate-200" />
                </button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl bg-slate-950 text-slate-100 border-slate-800 shadow-2xl p-6">
                <DialogHeader className="space-y-1.5 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={`size-8 rounded-lg border flex items-center justify-center ${isRunning ? "bg-amber-500/15 border-amber-500/30 text-amber-400" : "bg-slate-800/60 border-slate-700 text-slate-400"}`}>
                                <FlameIcon className="size-4.5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-semibold text-slate-100">
                                    Warmup Cooldown & Distribution Inspector
                                </DialogTitle>
                                <DialogDescription className="text-xs text-slate-400">
                                    Real-time peer-to-peer warmup sequence & task dispatch queue
                                </DialogDescription>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pr-6">
                            <button
                                onClick={() => refetch()}
                                title="Refresh live telemetry"
                                className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                            >
                                <RefreshCwIcon className="size-3.5" />
                            </button>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                                isRunning 
                                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" 
                                    : "bg-slate-800 text-slate-400 border-slate-700"
                            }`}>
                                <span className={`size-1.5 rounded-full ${isRunning ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`} />
                                {isRunning ? "Running" : "Idle"}
                            </span>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    {/* Primary Two-Email Display */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {/* 1. Current Cooldown Email */}
                        <div className="relative rounded-xl border border-amber-500/30 bg-linear-to-b from-amber-500/10 to-amber-950/20 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                                    <TimerIcon className="size-3.5" />
                                    <span>1. Currently In Cooldown</span>
                                </div>
                                <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                                    {hasActiveTask 
                                        ? (localSeconds > 0 ? `Sends in ${formatSeconds(localSeconds)}` : "Dispatching now")
                                        : "Idle / No Active Task"}
                                </span>
                            </div>

                            <div>
                                <div className="text-[11px] text-slate-400 mb-0.5">Mailing Account:</div>
                                <div className="font-mono text-xs sm:text-[13px] font-bold text-amber-100 truncate select-all bg-slate-900/80 px-2.5 py-1.5 rounded-md border border-amber-500/20">
                                    {currentEmail}
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10.5px] text-slate-400">
                                    <span>Cooldown Progress</span>
                                    <span className="font-mono text-amber-300">{progressPercent}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-1000 ease-linear rounded-full"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 2. Next Email Scheduled */}
                        <div className="relative rounded-xl border border-sky-500/30 bg-linear-to-b from-sky-500/10 to-sky-950/20 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-sky-400 text-xs font-semibold uppercase tracking-wider">
                                    <ArrowRightIcon className="size-3.5" />
                                    <span>2. Next In Line</span>
                                </div>
                                <span className="text-xs px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-medium border border-sky-500/30">
                                    Scheduled Next
                                </span>
                            </div>

                            <div>
                                <div className="text-[11px] text-slate-400 mb-0.5">Next Mailbox (Round Robin):</div>
                                <div className="font-mono text-xs sm:text-[13px] font-bold text-sky-100 truncate select-all bg-slate-900/80 px-2.5 py-1.5 rounded-md border border-sky-500/20">
                                    {nextEmail}
                                </div>
                            </div>

                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                Once <span className="font-mono text-amber-300">{currentEmail.split("@")[0]}</span> finishes cooldown and delivers, this mailbox immediately initiates its warmup cycle.
                            </p>
                        </div>
                    </div>

                    {/* Mode & Telemetry Details */}
                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <ActivityIcon className="size-3.5 text-sky-400" />
                            <span>Warmup Engine Configuration</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                            <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                                <span className="text-[10.5px] text-slate-400 block mb-0.5">Distribution Mode</span>
                                <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                                    <ShuffleIcon className="size-3" />
                                    Round Robin Mesh
                                </span>
                            </div>

                            <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                                <span className="text-[10.5px] text-slate-400 block mb-0.5">Peer Reply Rate</span>
                                <span className="font-mono font-semibold text-sky-300">
                                    {telemetry?.stats.reply_rate_percent ?? 35}% Target
                                </span>
                            </div>

                            <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                                <span className="text-[10.5px] text-slate-400 block mb-0.5">Min Wait Jitter</span>
                                <span className="font-mono font-semibold text-amber-300">
                                    {telemetry?.stats.min_delay_seconds ?? 180}s (3-6 min)
                                </span>
                            </div>

                            <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                                <span className="text-[10.5px] text-slate-400 block mb-0.5">Sending Window</span>
                                <span className="font-medium text-purple-300">
                                    24/7 (Continuous)
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Queue Preview */}
                    {telemetry?.queue && telemetry.queue.length > 2 && (
                        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3 space-y-2">
                            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                                <span className="flex items-center gap-1">
                                    <LayersIcon className="size-3" />
                                    Upcoming Round Robin Queue ({telemetry.queue.length} tasks)
                                </span>
                                <span className="text-[10px] text-slate-500">Auto-staggered order</span>
                            </div>

                            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                                {telemetry.queue.slice(2, 7).map((item, idx) => (
                                    <div
                                        key={item.task_id}
                                        className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-md bg-slate-950/50 border border-slate-800/50"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-[10px] text-slate-500 w-4">
                                                #{idx + 3}
                                            </span>
                                            <span className="font-mono text-[11.5px] text-slate-200">
                                                {item.email}
                                            </span>
                                        </div>
                                        <span className="font-mono text-[10.5px] text-slate-400">
                                            {formatSeconds(item.seconds_remaining)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
