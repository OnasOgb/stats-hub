"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import type { Player } from "@/lib/types";

interface LeaderboardClientProps {
  initialPlayers: Player[];
}

export function LeaderboardClient({ initialPlayers }: LeaderboardClientProps) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentPlayerId(localStorage.getItem("strider-player-id"));
  }, []);

  useEffect(() => {
    const channel = getSupabase()
      .channel("players-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "players" },
        (payload) => {
          setPlayers((prev) => [...prev, payload.new as Player]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "players" },
        (payload) => {
          setPlayers((prev) =>
            prev.map((p) =>
              p.id === (payload.new as Player).id ? (payload.new as Player) : p
            )
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "players" },
        (payload) => {
          setPlayers((prev) =>
            prev.filter((p) => p.id !== (payload.old as { id: string }).id)
          );
        }
      )
      .subscribe();

    return () => {
      getSupabase().removeChannel(channel);
    };
  }, []);

  return <LeaderboardTable players={players} currentPlayerId={currentPlayerId} />;
}
