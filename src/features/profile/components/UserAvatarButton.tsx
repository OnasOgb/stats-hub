"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/shared/lib/supabase";
import { PlayerAvatar } from "./PlayerAvatar";
import { Skeleton } from "@/shared/components/ui/skeleton";
import type { Profile } from "@/shared/lib/types";

export function UserAvatarButton() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      const supabase = getSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) setProfile(data);
      setLoading(false);
    }

    fetchProfile();
  }, []);

  if (loading) {
    return <Skeleton className="h-8 w-8 rounded-full" />;
  }

  if (!profile) return null;

  return (
    <Link href="/profile" aria-label="Your profile">
      <PlayerAvatar
        name={profile.name}
        avatarUrl={profile.avatar_url}
        size="sm"
        className="cursor-pointer transition-opacity hover:opacity-80"
      />
    </Link>
  );
}
