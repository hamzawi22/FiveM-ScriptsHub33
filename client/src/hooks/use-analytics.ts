import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

type TrackAnalyticsInput = z.infer<typeof api.analytics.track.input>;

export function useTrackAnalytics() {
  return useMutation({
    mutationFn: async (data: TrackAnalyticsInput) => {
      const res = await fetch(api.analytics.track.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to track analytics");
      return api.analytics.track.responses[201].parse(await res.json());
    },
  });
}

export function useScriptStats(scriptId: number) {
  return useQuery({
    queryKey: [api.analytics.stats.path, scriptId],
    queryFn: async () => {
      const url = buildUrl(api.analytics.stats.path, { id: scriptId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return api.analytics.stats.responses[200].parse(await res.json());
    },
    enabled: !isNaN(scriptId),
  });
}
