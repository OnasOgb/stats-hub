"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/shared/lib/supabase";
import { useHub } from "../providers/HubContext";
import { useRealtimeList } from "../lib/use-realtime-list";
import { LeaderboardTable } from "./LeaderboardTable";
import type { HubMemberWithProfile } from "../lib/types";

interface LeaderboardClientProps {
  hubId: string;
  initialMembers: HubMemberWithProfile[];
}

export function LeaderboardClient({
  hubId,
  initialMembers,
}: LeaderboardClientProps) {
  const { currentProfile } = useHub();
  const members = useRealtimeList<HubMemberWithProfile>({
    hubId,
    table: "hub_members",
    select: "*, profiles(*)",
    initialData: initialMembers,
  });

  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // Presence tracking (separate concern from postgres_changes)
  useEffect(() => {
    const supabase = getSupabase();
    const presenceChannel = supabase.channel(`hub-${hubId}-presence`);

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const online = new Set<string>();
        Object.values(state).forEach((presences) => {
          (presences as unknown as { user_id: string }[]).forEach((p) => {
            online.add(p.user_id);
          });
        });
        setOnlineUsers(online);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({ user_id: currentProfile.id });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [hubId, currentProfile.id]);

  return (
    <LeaderboardTable
      hubId={hubId}
      members={members}
      onlineUsers={onlineUsers}
    />
  );
}
