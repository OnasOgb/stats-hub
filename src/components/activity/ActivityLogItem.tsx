"use client";

import { Goal, Handshake, ShieldCheck, TrendingUp, TrendingDown } from "lucide-react";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { formatDistanceToNow } from "date-fns";

interface ActivityLogItemProps {
  actorName: string;
  actorAvatar?: string;
  playerName: string;
  statType: string;
  delta: number;
  createdAt: string;
  onRevert?: () => void;
  showRevert?: boolean;
}

const statIcons: Record<string, typeof Goal> = {
  goals: Goal,
  assists: Handshake,
  clean_sheets: ShieldCheck,
};

const statLabels: Record<string, string> = {
  goals: "goal",
  assists: "assist",
  clean_sheets: "clean sheet",
};

export function ActivityLogItem({
  actorName,
  actorAvatar,
  playerName,
  statType,
  delta,
  createdAt,
  onRevert,
  showRevert,
}: ActivityLogItemProps) {
  const Icon = statIcons[statType] ?? Goal;
  const label = statLabels[statType] ?? statType;
  const action = delta > 0 ? "added" : "removed";
  const TrendIcon = delta > 0 ? TrendingUp : TrendingDown;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
      <PlayerAvatar name={actorName} avatarUrl={actorAvatar} size="sm" />

      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <strong>{actorName}</strong> {action} a{" "}
          <span className="inline-flex items-center gap-1">
            <Icon className="inline h-3.5 w-3.5 text-primary" />
            <strong>{label}</strong>
          </span>{" "}
          for <strong>{playerName}</strong>
        </p>
        <div className="flex items-center gap-2 mt-1">
          <TrendIcon
            className={`h-3 w-3 ${delta > 0 ? "text-primary" : "text-destructive"}`}
          />
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>

      {showRevert && onRevert && (
        <button
          onClick={onRevert}
          className="shrink-0 text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          Undo
        </button>
      )}
    </div>
  );
}
