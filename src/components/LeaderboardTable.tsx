"use client";

import Link from "next/link";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import type { HubMemberWithProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LeaderboardTableProps {
  hubId: string;
  members: HubMemberWithProfile[];
  currentUserId?: string | null;
  onlineUsers?: Set<string>;
}

export function LeaderboardTable({
  hubId,
  members,
  currentUserId,
  onlineUsers,
}: LeaderboardTableProps) {
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
        const isCurrentUser = member.user_id === currentUserId;
        const isOnline = onlineUsers?.has(member.user_id);

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
