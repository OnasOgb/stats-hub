"use client";

import { Trophy } from "lucide-react";
import { useHub } from "../providers/HubContext";
import { CopyInviteLink } from "./CopyInviteLink";
import { UserAvatarButton } from "@/features/profile/components/UserAvatarButton";

export function LeaderboardHeader() {
  const { hub, currentMember, currentProfile } = useHub();

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
          {currentMember.role === "admin" && (
            <CopyInviteLink inviteCode={hub.invite_code} />
          )}
        </div>
        <div className="shrink-0">
          <UserAvatarButton name={currentProfile.name} avatarUrl={currentProfile.avatar_url} />
        </div>
      </div>
    </header>
  );
}
