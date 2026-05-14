import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/shared/lib/supabase-server";
import { hubLogger } from "@/shared/lib/logger";
import { PlayerProfileClient } from "@/features/hub/components/PlayerProfileClient";
import type { HubMemberWithProfile } from "@/features/hub/lib/types";

interface PlayerPageProps {
  params: { hubId: string; memberId: string };
}

export default async function HubPlayerPage({ params }: PlayerPageProps) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch member with profile
  const { data: member, error: memberError } = await supabase
    .from("hub_members")
    .select("*, profiles(*)")
    .eq("id", params.memberId)
    .eq("hub_id", params.hubId)
    .single();

  if (memberError && memberError.code !== "PGRST116") {
    hubLogger.error({ err: memberError, hubId: params.hubId, memberId: params.memberId }, "player: failed to fetch member");
  }

  if (!member) {
    notFound();
  }

  const typedMember = member as HubMemberWithProfile;
  const isOwnProfile = typedMember.user_id === user?.id;

  return (
    <PlayerProfileClient
      member={typedMember}
      hubId={params.hubId}
      isOwnProfile={isOwnProfile}
    />
  );
}
