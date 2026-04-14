import { createFileRoute } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { mockPlayers } from "@/lib/mock-data";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Strider — Leaderboard" },
      { name: "description", content: "Weekly football club stat tracker leaderboard" },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Strider</h1>
            <p className="text-xs text-muted-foreground">Weekly Club Leaderboard</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-lg px-4 pt-4">
        <LeaderboardTable players={mockPlayers} />
      </main>

      <BottomNav />
    </div>
  );
}
