import { PlayerProfileClient } from "@/features/hub/components/PlayerProfileClient";
import { loadPlayerMember } from "@/features/hub/lib/queries";

interface PlayerPageProps {
  params: { hubId: string; memberId: string };
}

export default async function HubPlayerPage({ params }: PlayerPageProps) {
  const { member } = await loadPlayerMember(params.hubId, params.memberId);

  return (
    <PlayerProfileClient
      member={member}
      hubId={params.hubId}
    />
  );
}
