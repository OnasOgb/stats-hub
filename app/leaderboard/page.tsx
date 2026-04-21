import { Trophy } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { LeaderboardClient } from "@/components/LeaderboardClient";
import { BottomNav } from "@/components/BottomNav";
import type { Player } from "@/lib/types";

export const revalidate = 0;

export default async function LeaderboardPage() {
  const supabase = createServerSupabaseClient();
  const { data: players } = await supabase
    .from("players")
    .select("*")
    .order("goals", { ascending: false });

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Striders</h1>
            <p className="text-xs text-muted-foreground">
              Weekly Club Leaderboard
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-lg px-4 pt-4">
        <LeaderboardClient initialPlayers={(players as Player[]) ?? []} />
      </main>

      <BottomNav />
    </div>
  );
}
