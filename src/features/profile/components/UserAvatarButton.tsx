"use client";

import Link from "next/link";
import { useHub } from "@/features/hub/providers/HubContext";
import { PlayerAvatar } from "./PlayerAvatar";

export function UserAvatarButton() {
  const { currentProfile } = useHub();

  return (
    <Link href="/profile" aria-label="Your profile">
      <PlayerAvatar
        name={currentProfile.name}
        avatarUrl={currentProfile.avatar_url}
        size="sm"
        className="cursor-pointer transition-opacity hover:opacity-80"
      />
    </Link>
  );
}
