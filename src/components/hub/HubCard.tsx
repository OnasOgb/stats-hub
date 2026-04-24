import Link from "next/link";
import { ChevronRight, Shield } from "lucide-react";
import type { Hub } from "@/lib/types";
import { cn } from "@/lib/utils";

interface HubCardProps {
  hub: Hub;
  role: string;
}

export function HubCard({ hub, role }: HubCardProps) {
  return (
    <Link
      href={`/hub/${hub.id}/leaderboard`}
      className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-card/80"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 text-primary font-bold text-lg">
        {hub.name.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold truncate">{hub.name}</h3>
          {role === "admin" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
              <Shield className="h-3 w-3" />
              Admin
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          /{hub.invite_code}
        </p>
      </div>

      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
    </Link>
  );
}
