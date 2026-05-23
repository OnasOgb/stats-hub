"use client";

import { cn } from "@/shared/lib/cn";
import { type LucideIcon, Plus, Minus } from "lucide-react";
import { useState } from "react";

interface StatButtonProps {
  label: string;
  icon: LucideIcon;
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

export function StatButton({ label, icon: Icon, count, onIncrement, onDecrement }: StatButtonProps) {
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
      {/* Icon */}
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary transition-transform",
          flash === "up" && "scale-110",
          flash === "down" && "scale-90"
        )}
      >
        <Icon className="h-6 w-6" />
      </div>

      {/* Count */}
      <span className="text-3xl font-bold tabular-nums text-foreground">{count}</span>

      {/* Label */}
      <span className="text-xs font-medium text-muted-foreground">{label}</span>

      {/* +/- buttons */}
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
