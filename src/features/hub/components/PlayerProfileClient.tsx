"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { type LucideIcon, Goal, Handshake, ShieldCheck, Plus, Minus } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { PlayerAvatar } from "@/features/profile/components/PlayerAvatar";
import { useHub } from "../providers/HubContext";
import { useStatMutation } from "../lib/use-stat-mutation";
import type { HubMemberWithProfile } from "../lib/types";

interface PlayerProfileClientProps {
  member: HubMemberWithProfile;
  hubId: string;
}

function StatButton({
  label,
  icon: Icon,
  count,
  onIncrement,
  onDecrement,
}: {
  label: string;
  icon: LucideIcon;
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  const handleIncrement = () => {
    setFlash("up");
    onIncrement();
    setTimeout(() => setFlash(null), 300);
  };

  const handleDecrement = () => {
    if (count <= 0) return;
    setFlash("down");
    onDecrement();
    setTimeout(() => setFlash(null), 300);
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 transition-all",
        flash === "up" && "border-primary shadow-[0_0_24px_var(--color-primary)/0.25]",
        flash === "down" && "border-destructive/60 shadow-[0_0_24px_var(--color-destructive)/0.2]"
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary transition-transform",
          flash === "up" && "scale-110",
          flash === "down" && "scale-90"
        )}
      >
        <Icon className="h-6 w-6" />
      </div>

      <span className="text-3xl font-bold tabular-nums text-foreground">{count}</span>

      <span className="text-xs font-medium text-muted-foreground">{label}</span>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleDecrement}
          disabled={count <= 0}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-secondary text-secondary-foreground transition-all hover:bg-destructive/20 hover:border-destructive/40 hover:text-destructive active:scale-90 disabled:opacity-30 disabled:pointer-events-none"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={handleIncrement}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/40 bg-primary/15 text-primary transition-all hover:bg-primary/25 active:scale-90"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function PlayerProfileClient({
  member,
  hubId,
}: PlayerProfileClientProps) {
  const router = useRouter();
  const { currentProfile } = useHub();
  const { changeStat } = useStatMutation(hubId);
  const isOwnProfile = member.user_id === currentProfile.id;
  const [stats, setStats] = useState({
    goals: member.goals,
    assists: member.assists,
    clean_sheets: member.clean_sheets,
  });

  const handleChange = (
    stat: "goals" | "assists" | "clean_sheets",
    delta: 1 | -1,
  ) => {
    changeStat(member.id, stat, delta, {
      onOptimistic: () =>
        setStats((prev) => ({ ...prev, [stat]: Math.max(0, prev[stat] + delta) })),
      onRevert: () =>
        setStats((prev) => ({ ...prev, [stat]: Math.max(0, prev[stat] - delta) })),
      onSuccess: () => router.refresh(),
    });
  };

  return (
    <>
      <header className="border-b border-border bg-background/90">
        <div className="mx-auto max-w-lg px-4 py-8 relative">
          <div className="absolute top-4 right-4">
            <Link href="/profile" aria-label="Your profile">
              <PlayerAvatar
                name={currentProfile.name ?? ""}
                avatarUrl={currentProfile.avatar_url ?? undefined}
                size="sm"
                className="cursor-pointer transition-opacity hover:opacity-80"
              />
            </Link>
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
