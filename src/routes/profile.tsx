import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { StatButton } from "@/components/StatButton";
import { mockCurrentUser } from "@/lib/mock-data";
import { Goal, Handshake, ShieldCheck, Camera } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Strider — My Stats" },
      { name: "description", content: "Your personal football stat pad" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const [stats, setStats] = useState({
    goals: mockCurrentUser.goals,
    assists: mockCurrentUser.assists,
    clean_sheets: mockCurrentUser.clean_sheets,
  });

  const change = (stat: keyof typeof stats, delta: number) => {
    setStats((prev) => ({ ...prev, [stat]: Math.max(0, prev[stat] + delta) }));
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-background/90">
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-8">
          <div className="relative">
            <PlayerAvatar name={mockCurrentUser.full_name} size="lg" />
            <button className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold">{mockCurrentUser.full_name}</h1>
            <p className="text-sm text-muted-foreground">Tap + or − to update your stats</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pt-6">
        <div className="grid grid-cols-3 gap-3">
          <StatButton
            label="Goals"
            icon={Goal}
            count={stats.goals}
            onIncrement={() => change("goals", 1)}
            onDecrement={() => change("goals", -1)}
          />
          <StatButton
            label="Assists"
            icon={Handshake}
            count={stats.assists}
            onIncrement={() => change("assists", 1)}
            onDecrement={() => change("assists", -1)}
          />
          <StatButton
            label="Clean Sheets"
            icon={ShieldCheck}
            count={stats.clean_sheets}
            onIncrement={() => change("clean_sheets", 1)}
            onDecrement={() => change("clean_sheets", -1)}
          />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Honor system — stats update instantly for everyone
        </p>
      </main>

      <BottomNav />
    </div>
  );
}
