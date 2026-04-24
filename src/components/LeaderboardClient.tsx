"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import type { HubMemberWithProfile } from "@/lib/types";

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
  const [members, setMembers] = useState<HubMemberWithProfile[]>(initialMembers);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = getSupabase();

    // Realtime subscription for hub_members changes
    const channel = supabase
      .channel(`hub-${hubId}-members`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "hub_members",
          filter: `hub_id=eq.${hubId}`,
        },
        async (payload) => {
          // Fetch the new member with profile
          const { data } = await supabase
            .from("hub_members")
            .select("*, profiles(*)")
            .eq("id", (payload.new as { id: string }).id)
            .single();

          if (data) {
            setMembers((prev) => [...prev, data as HubMemberWithProfile]);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "hub_members",
          filter: `hub_id=eq.${hubId}`,
        },
        (payload) => {
          setMembers((prev) =>
            prev.map((m) => {
              if (m.id === (payload.new as { id: string }).id) {
                return { ...m, ...payload.new } as HubMemberWithProfile;
              }
              return m;
            })
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "hub_members",
          filter: `hub_id=eq.${hubId}`,
        },
        (payload) => {
          setMembers((prev) =>
            prev.filter((m) => m.id !== (payload.old as { id: string }).id)
          );
        }
      )
      .subscribe();

    // Presence tracking
    const presenceChannel = supabase.channel(`hub-${hubId}-presence`);

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const online = new Set<string>();
        Object.values(state).forEach((presences) => {
          (presences as { user_id: string }[]).forEach((p) => {
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
      supabase.removeChannel(channel);
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
