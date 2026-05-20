"use client";

import { getSupabase } from "@/shared/lib/supabase";
import { useHub } from "@/features/hub/providers/HubContext";
import { useRealtimeList } from "@/features/hub/lib/use-realtime-list";
import { ActivityLogItem } from "./ActivityLogItem";
import * as Sentry from "@sentry/nextjs";
import { toast } from "sonner";
import type { StatLogWithDetails } from "@/features/hub/lib/types";

interface ActivityFeedProps {
  hubId: string;
  initialLogs: StatLogWithDetails[];
}

export function ActivityFeed({ hubId, initialLogs }: ActivityFeedProps) {
  const { currentMember } = useHub();
  const logs = useRealtimeList<StatLogWithDetails>({
    hubId,
    table: "stat_logs",
    select: "*, profiles(*), hub_members(*, profiles(*))",
    initialData: initialLogs,
    order: "prepend",
    events: ["INSERT", "DELETE"],
  });
  const isAdmin = currentMember.role === "admin";

  const handleRevert = async (log: StatLogWithDetails) => {
    const supabase = getSupabase();

    // Reverse the stat change
    const reverseRpc =
      log.delta > 0 ? "decrement_hub_stat" : "increment_hub_stat";
    const { error: rpcError } = await supabase.rpc(reverseRpc, {
      p_member_id: log.member_id,
      p_stat_column: log.stat_type,
      p_hub_id: hubId,
    });

    if (rpcError) {
      Sentry.captureException(rpcError, { extra: { context: "ActivityFeed: stat revert RPC", logId: log.id, statType: log.stat_type } });
      toast.error("Failed to revert stat");
      return;
    }

    // Delete the log entry
    const { error: deleteError } = await supabase
      .from("stat_logs")
      .delete()
      .eq("id", log.id);

    if (deleteError) {
      Sentry.captureException(deleteError, { extra: { context: "ActivityFeed: stat log deletion", logId: log.id } });
      toast.error("Stat reverted but log entry couldn't be removed");
    }
  };

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
            showRevert={isAdmin}
            onRevert={() => handleRevert(log)}
          />
        ))
      )}
    </div>
  );
}
