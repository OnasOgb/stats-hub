import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { PlayerProfileClient } from "@/components/PlayerProfileClient";
import type { HubMemberWithProfile } from "@/lib/types";

interface PlayerPageProps {
  params: { hubId: string; memberId: string };
}

export default async function HubPlayerPage({ params }: PlayerPageProps) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch member with profile
  const { data: member } = await supabase
    .from("hub_members")
    .select("*, profiles(*)")
    .eq("id", params.memberId)
    .eq("hub_id", params.hubId)
    .single();

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
