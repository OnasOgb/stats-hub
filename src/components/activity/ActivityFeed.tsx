"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { useHub } from "@/components/providers/HubContext";
import { ActivityLogItem } from "@/components/activity/ActivityLogItem";
import { toast } from "sonner";
import type { StatLogWithDetails } from "@/lib/types";

interface ActivityFeedProps {
  hubId: string;
  initialLogs: StatLogWithDetails[];
}

export function ActivityFeed({ hubId, initialLogs }: ActivityFeedProps) {
  const { currentMember } = useHub();
  const [logs, setLogs] = useState<StatLogWithDetails[]>(initialLogs);
  const isAdmin = currentMember.role === "admin";

  useEffect(() => {
    const supabase = getSupabase();

    const channel = supabase
      .channel(`hub-${hubId}-stat-logs`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "stat_logs",
          filter: `hub_id=eq.${hubId}`,
        },
        async (payload) => {
          const newLog = payload.new as { id: string };
          const { data } = await supabase
            .from("stat_logs")
            .select("*, profiles(*), hub_members(*, profiles(*))")
            .eq("id", newLog.id)
            .single();

          if (data) {
            setLogs((prev) => {
              if (prev.some((l) => l.id === data.id)) return prev;
              return [data as StatLogWithDetails, ...prev];
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "stat_logs",
          filter: `hub_id=eq.${hubId}`,
        },
        (payload) => {
          setLogs((prev) =>
            prev.filter((l) => l.id !== (payload.old as { id: string }).id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hubId]);

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
      toast.error("Failed to revert stat");
      return;
    }

    // Delete the log entry
    const { error: deleteError } = await supabase
      .from("stat_logs")
      .delete()
      .eq("id", log.id);

    if (deleteError) {
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
