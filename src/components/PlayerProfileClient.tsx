"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { StatButton } from "@/components/StatButton";
import { getSupabase } from "@/lib/supabase";
import type { Player } from "@/lib/types";
import { Goal, Handshake, ShieldCheck } from "lucide-react";

interface PlayerProfileClientProps {
  player: Player;
}

export function PlayerProfileClient({ player }: PlayerProfileClientProps) {
  const router = useRouter();
  const [stats, setStats] = useState({
    goals: player.goals,
    assists: player.assists,
    clean_sheets: player.clean_sheets,
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

    const rpcName = delta > 0 ? "increment_stat" : "decrement_stat";
    const { error } = await getSupabase().rpc(rpcName, {
      player_id: player.id,
      stat_column: stat,
    });

    if (error) {
      // Revert on failure
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
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-8">
          <PlayerAvatar
            name={player.name}
            avatarUrl={player.photo_url}
            size="lg"
          />
          <div className="text-center">
            <h1 className="text-xl font-bold">{player.name}</h1>
            <p className="text-sm text-muted-foreground">
              Tap + or - to update your stats
            </p>
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
          Honor system — stats update instantly for everyone
        </p>
      </main>
    </>
  );
}
