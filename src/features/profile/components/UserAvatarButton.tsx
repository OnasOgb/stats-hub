"use client";

import Link from "next/link";
import { PlayerAvatar } from "./PlayerAvatar";

interface UserAvatarButtonProps {
  name: string | null;
  avatarUrl: string | null;
}

export function UserAvatarButton({ name, avatarUrl }: UserAvatarButtonProps) {
  return (
    <Link href="/profile" aria-label="Your profile">
      <PlayerAvatar
        name={name ?? ""}
        avatarUrl={avatarUrl ?? undefined}
        size="sm"
        className="cursor-pointer transition-opacity hover:opacity-80"
      />
    </Link>
  );
}
