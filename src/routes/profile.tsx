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

  const increment = (stat: keyof typeof stats) => {
    setStats((prev) => ({ ...prev, [stat]: prev[stat] + 1 }));
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
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
            <p className="text-sm text-muted-foreground">Tap to update your stats</p>
          </div>
        </div>
      </header>

      {/* Stat Buttons */}
      <main className="mx-auto max-w-lg px-4 pt-6">
        <div className="grid grid-cols-3 gap-3">
          <StatButton
            label="+1 Goal"
            icon={Goal}
            count={stats.goals}
            onIncrement={() => increment("goals")}
          />
          <StatButton
            label="+1 Assist"
            icon={Handshake}
            count={stats.assists}
            onIncrement={() => increment("assists")}
          />
          <StatButton
            label="+1 CS"
            icon={ShieldCheck}
            count={stats.clean_sheets}
            onIncrement={() => increment("clean_sheets")}
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
