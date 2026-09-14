import { useQuery } from "@tanstack/react-query";
import getWarmupTelemetry from "@/lib/api/client/app/emails/getWarmupTelemetry";

export const WARMUP_TELEMETRY_KEY = ["emails", "warmup-telemetry"] as const;

export default function useWarmupTelemetry(enabled = true) {
    return useQuery({
        queryKey: WARMUP_TELEMETRY_KEY,
        queryFn: getWarmupTelemetry,
        enabled,
        refetchInterval: 3000, // Poll every 3 seconds for accurate real-time cooldown countdown
        staleTime: 2000,
    });
}
