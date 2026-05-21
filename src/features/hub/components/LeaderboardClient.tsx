"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/shared/lib/supabase";
import { PlayerAvatar } from "@/features/profile/components/PlayerAvatar";
import { useHub } from "../providers/HubContext";
import { useRealtimeList } from "../lib/use-realtime-list";
import { cn } from "@/shared/lib/utils";
import type { HubMemberWithProfile } from "../lib/types";

interface LeaderboardClientProps {
  hubId: string;
  initialMembers: HubMemberWithProfile[];
}

/**
 * Real-time Leaderboard: owns data subscription, presence tracking,
 * sorting, and rendering. Callers pass `hubId` and `initialMembers`
 * and get a complete live leaderboard.
 */
export function LeaderboardClient({
  hubId,
  initialMembers,
}: LeaderboardClientProps) {
  const { currentProfile } = useHub();
  const { items: members } = useRealtimeList<HubMemberWithProfile>({
    hubId,
    table: "hub_members",
    select: "*, profiles(*)",
    initialData: initialMembers,
  });

  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // Presence tracking
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

  const sorted = [...members].sort((a, b) => b.goals - a.goals);

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid grid-cols-[2.5rem_1fr_2.5rem_2.5rem_2.5rem] items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <span className="text-center">#</span>
        <span>Player</span>
        <span className="text-center">G</span>
        <span className="text-center">A</span>
        <span className="text-center">CS</span>
      </div>

      {/* Rows */}
      {sorted.map((member, i) => {
        const rank = i + 1;
        const isTop3 = rank <= 3;
        const isCurrentUser = member.user_id === currentProfile.id;
        const isOnline = onlineUsers.has(member.user_id);

        return (
          <Link
            key={member.id}
            href={`/hub/${hubId}/player/${member.id}`}
            className={cn(
              "grid grid-cols-[2.5rem_1fr_2.5rem_2.5rem_2.5rem] items-center gap-2 rounded-xl px-4 py-3 transition-colors",
              isTop3
                ? "bg-primary/10 border border-primary/20"
                : "bg-card border border-transparent hover:border-border"
            )}
          >
            <span
              className={cn(
                "text-center text-sm font-bold",
                rank === 1 && "text-yellow-400",
                rank === 2 && "text-gray-400",
                rank === 3 && "text-amber-600",
                !isTop3 && "text-muted-foreground"
              )}
            >
              {rank}
            </span>

            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <PlayerAvatar
                  name={member.profiles.name}
                  avatarUrl={member.profiles.avatar_url}
                  size="sm"
                />
                {isOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-primary" />
                )}
              </div>
              <span className="truncate text-sm font-medium">
                {member.profiles.name || "Anonymous"}
                {isCurrentUser && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
                    You
                  </span>
                )}
              </span>
            </div>

            <span className="text-center text-sm font-bold text-primary">
              {member.goals}
            </span>
            <span className="text-center text-sm font-medium text-foreground/80">
              {member.assists}
            </span>
            <span className="text-center text-sm font-medium text-foreground/80">
              {member.clean_sheets}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
