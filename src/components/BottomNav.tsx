"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const [playerId, setPlayerId] = useState<string | null>(null);

  useEffect(() => {
    setPlayerId(localStorage.getItem("strider-player-id"));
  }, []);

  const myStatsHref = playerId ? `/player/${playerId}` : "/";

  const links = [
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: myStatsHref, label: "My Stats", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/leaderboard"
              ? pathname === "/leaderboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  isActive && "drop-shadow-[0_0_6px_var(--primary)]"
                )}
              />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
