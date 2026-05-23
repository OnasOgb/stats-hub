"use client";

import { formatDistanceToNow } from "date-fns";
import { Goal, Handshake, ShieldCheck, TrendingUp, TrendingDown } from "lucide-react";
import { PlayerAvatar } from "@/features/profile/components/PlayerAvatar";
import { useHub } from "../providers/HubContext";
import { useRealtimeList } from "../lib/use-realtime-list";
import { useStatMutation } from "../lib/use-stat-mutation";
import type { StatLogWithDetails } from "../lib/types";

const statIcons: Record<string, typeof Goal> = {
  goals: Goal,
  assists: Handshake,
  clean_sheets: ShieldCheck,
};

const statLabels: Record<string, string> = {
  goals: "goal",
  assists: "assist",
  clean_sheets: "clean sheet",
};

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
        logs.map((log) => {
          const actorName = log.profiles.name || "Anonymous";
          const playerName = log.hub_members.profiles.name || "Anonymous";
          const Icon = statIcons[log.stat_type] ?? Goal;
          const label = statLabels[log.stat_type] ?? log.stat_type;
          const action = log.delta > 0 ? "added" : "removed";
          const TrendIcon = log.delta > 0 ? TrendingUp : TrendingDown;

          return (
            <div key={log.id} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
              <PlayerAvatar name={actorName} avatarUrl={log.profiles.avatar_url} size="sm" />

              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <strong>{actorName}</strong> {action} a{" "}
                  <span className="inline-flex items-center gap-1">
                    <Icon className="inline h-3.5 w-3.5 text-primary" />
                    <strong>{label}</strong>
                  </span>{" "}
                  for <strong>{playerName}</strong>
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <TrendIcon
                    className={`h-3 w-3 ${log.delta > 0 ? "text-primary" : "text-destructive"}`}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>

              {canMutateStats && (
                <button
                  onClick={() => revertStatLog(log)}
                  className="shrink-0 text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Undo
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
