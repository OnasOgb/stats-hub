"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlayerAvatar } from "@/features/profile/components/PlayerAvatar";
import { StatButton } from "./StatButton";
import { useHub } from "../providers/HubContext";
import { getSupabase } from "@/shared/lib/supabase";
import { mutate } from "@/shared/lib/mutate";
import type { HubMemberWithProfile } from "../lib/types";
import { Goal, Handshake, ShieldCheck } from "lucide-react";
import { UserAvatarButton } from "@/features/profile/components/UserAvatarButton";

interface PlayerProfileClientProps {
  member: HubMemberWithProfile;
  hubId: string;
}

export function PlayerProfileClient({
  member,
  hubId,
}: PlayerProfileClientProps) {
  const router = useRouter();
  const { currentProfile } = useHub();
  const isOwnProfile = member.user_id === currentProfile.id;
  const [stats, setStats] = useState({
    goals: member.goals,
    assists: member.assists,
    clean_sheets: member.clean_sheets,
  });

  const handleChange = async (
    stat: "goals" | "assists" | "clean_sheets",
    delta: number
  ) => {
    // Optimistic update
    setStats((prev) => ({
      ...prev,
      [stat]: Math.max(0, prev[stat] + delta),
    }));

    const rpcName = delta > 0 ? "increment_hub_stat" : "decrement_hub_stat";
    const { error } = await mutate({
      fn: () => getSupabase().rpc(rpcName, {
        p_member_id: member.id,
        p_stat_column: stat,
        p_hub_id: hubId,
      }),
      context: "PlayerProfile: stat update",
      extra: { stat, memberId: member.id },
    });

    if (error) {
      setStats((prev) => ({
        ...prev,
        [stat]: Math.max(0, prev[stat] - delta),
      }));
    } else {
      router.refresh();
    }
  };

  return (
    <>
      <header className="border-b border-border bg-background/90">
        <div className="mx-auto max-w-lg px-4 py-8 relative">
          <div className="absolute top-4 right-4">
            <UserAvatarButton />
          </div>
          <div className="flex flex-col items-center gap-4">
          <PlayerAvatar
            name={member.profiles.name}
            avatarUrl={member.profiles.avatar_url}
            size="lg"
          />
          <div className="text-center">
            <h1 className="text-xl font-bold">
              {member.profiles.name || "Anonymous"}
            </h1>
            {isOwnProfile ? (
              <p className="text-sm text-muted-foreground">
                Tap + or - to update your stats
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Tap + or - to update stats
              </p>
            )}
          </div>
        </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pt-6">
        <div className="grid grid-cols-3 gap-3">
          <StatButton
            label="Goals"
            icon={Goal}
            count={stats.goals}
            onIncrement={() => handleChange("goals", 1)}
            onDecrement={() => handleChange("goals", -1)}
          />
          <StatButton
            label="Assists"
            icon={Handshake}
            count={stats.assists}
            onIncrement={() => handleChange("assists", 1)}
            onDecrement={() => handleChange("assists", -1)}
          />
          <StatButton
            label="Clean Sheets"
            icon={ShieldCheck}
            count={stats.clean_sheets}
            onIncrement={() => handleChange("clean_sheets", 1)}
            onDecrement={() => handleChange("clean_sheets", -1)}
          />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Stats update instantly for all hub members
        </p>
      </main>
    </>
  );
}
