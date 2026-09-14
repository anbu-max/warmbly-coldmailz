import Request from "../../Request";
import type { WarmupTelemetryResponse } from "@/lib/api/models/app/emails/WarmupTelemetry";

export default async function getWarmupTelemetry(): Promise<WarmupTelemetryResponse> {
    return await Request<WarmupTelemetryResponse>({
        method: "GET",
        url: `/emails/warmup-telemetry`,
        authorization: true,
    });
}
