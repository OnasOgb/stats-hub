"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/shared/lib/supabase";
import { useRealtimeList } from "../lib/use-realtime-list";
import { LeaderboardTable } from "./LeaderboardTable";
import type { HubMemberWithProfile } from "../lib/types";

interface LeaderboardClientProps {
  hubId: string;
  initialMembers: HubMemberWithProfile[];
  currentUserId: string | null;
}

export function LeaderboardClient({
  hubId,
  initialMembers,
  currentUserId,
}: LeaderboardClientProps) {
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
        if (status === "SUBSCRIBED" && currentUserId) {
          await presenceChannel.track({ user_id: currentUserId });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [hubId, currentUserId]);

  return (
    <LeaderboardTable
      hubId={hubId}
      members={members}
      currentUserId={currentUserId}
      onlineUsers={onlineUsers}
    />
  );
}
