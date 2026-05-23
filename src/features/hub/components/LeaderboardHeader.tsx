"use client";

import { useState } from "react";
import Link from "next/link";
import { Trophy, Link as LinkIcon, Check } from "lucide-react";
import * as Sentry from "@sentry/nextjs";
import { toast } from "sonner";
import { useHub } from "../providers/HubContext";
import { PlayerAvatar } from "@/features/profile/components/PlayerAvatar";

export function LeaderboardHeader() {
  const { hub, isAdmin, currentProfile } = useHub();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${window.location.origin}/join/${hub.invite_code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Invite link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      Sentry.captureException(err, { extra: { context: "LeaderboardHeader: clipboard write" } });
      toast.error("Failed to copy invite link");
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
          <Trophy className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold tracking-tight truncate">
            {hub.name}
          </h1>
          {isAdmin && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">Copied!</span>
                </>
              ) : (
                <>
                  <LinkIcon className="h-3 w-3" />
                  <span>Copy invite link</span>
                </>
              )}
            </button>
          )}
        </div>
        <div className="shrink-0">
          <Link href="/profile" aria-label="Your profile">
            <PlayerAvatar
              name={currentProfile.name ?? ""}
              avatarUrl={currentProfile.avatar_url ?? undefined}
              size="sm"
              className="cursor-pointer transition-opacity hover:opacity-80"
            />
          </Link>
        </div>
      </div>
    </header>
  );
}
