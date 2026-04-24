"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, User, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  hubId: string;
  memberId: string;
}

export function BottomNav({ hubId, memberId }: BottomNavProps) {
  const pathname = usePathname();

  const links = [
    {
      href: `/hub/${hubId}/leaderboard`,
      label: "Leaderboard",
      icon: Trophy,
    },
    {
      href: `/hub/${hubId}/player/${memberId}`,
      label: "My Stats",
      icon: User,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
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
