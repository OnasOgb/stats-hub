"use client";

import { useHub } from "../providers/HubContext";
import { useRealtimeList } from "../lib/use-realtime-list";
import { useStatMutation } from "../lib/use-stat-mutation";
import { ActivityLogItem } from "./ActivityLogItem";
import type { StatLogWithDetails } from "../lib/types";

interface ActivityFeedProps {
  hubId: string;
  initialLogs: StatLogWithDetails[];
}

export function ActivityFeed({ hubId, initialLogs }: ActivityFeedProps) {
  const { canMutateStats } = useHub();
  const { revertStatLog } = useStatMutation(hubId);
  const { items: logs } = useRealtimeList<StatLogWithDetails>({
    hubId,
    table: "stat_logs",
    select: "*, profiles(*), hub_members(*, profiles(*))",
    initialData: initialLogs,
    order: "prepend",
    events: ["INSERT", "DELETE"],
  });

  return (
    <div className="space-y-2">
      {logs.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground pt-8">
          No activity yet. Stats changes will appear here.
        </p>
      ) : (
        logs.map((log) => (
          <ActivityLogItem
            key={log.id}
            actorName={log.profiles.name || "Anonymous"}
            actorAvatar={log.profiles.avatar_url}
            playerName={log.hub_members.profiles.name || "Anonymous"}
            statType={log.stat_type}
            delta={log.delta}
            createdAt={log.created_at}
            showRevert={canMutateStats}
            onRevert={() => revertStatLog(log)}
          />
        ))
      )}
    </div>
  );
}
