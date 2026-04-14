import { PlayerAvatar } from "@/components/PlayerAvatar";
import type { Player } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface LeaderboardTableProps {
  players: Player[];
}

export function LeaderboardTable({ players }: LeaderboardTableProps) {
  const sorted = [...players].sort((a, b) => b.goals - a.goals);

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
      {sorted.map((player, i) => {
        const rank = i + 1;
        const isTop3 = rank <= 3;
        return (
          <div
            key={player.id}
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
              <PlayerAvatar name={player.full_name} avatarUrl={player.avatar_url} size="sm" />
              <span className="truncate text-sm font-medium">{player.full_name}</span>
            </div>

            <span className="text-center text-sm font-bold text-primary">{player.goals}</span>
            <span className="text-center text-sm font-medium text-foreground/80">{player.assists}</span>
            <span className="text-center text-sm font-medium text-foreground/80">{player.clean_sheets}</span>
          </div>
        );
      })}
    </div>
  );
}
