import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";
import { useState } from "react";

interface StatButtonProps {
  label: string;
  icon: LucideIcon;
  count: number;
  onIncrement: () => void;
}

export function StatButton({ label, icon: Icon, count, onIncrement }: StatButtonProps) {
  const [animating, setAnimating] = useState(false);

  const handleClick = () => {
    setAnimating(true);
    onIncrement();
    setTimeout(() => setAnimating(false), 300);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "group relative flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 transition-all active:scale-95",
        "hover:border-primary/40 hover:shadow-[0_0_20px_var(--color-primary)/0.15]",
        animating && "border-primary shadow-[0_0_30px_var(--color-primary)/0.3]"
      )}
    >
      <div
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary transition-transform",
          animating && "scale-125"
        )}
      >
        <Icon className="h-7 w-7" />
      </div>
      <span className="text-3xl font-bold tabular-nums text-foreground">{count}</span>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </button>
  );
}
