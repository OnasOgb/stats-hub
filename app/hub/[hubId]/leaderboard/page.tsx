import { loadLeaderboardData } from "@/features/hub/lib/queries";
import { LeaderboardHeader } from "@/features/hub/components/LeaderboardHeader";
import { LeaderboardTabs } from "@/features/hub/components/LeaderboardTabs";

export const revalidate = 0;

interface LeaderboardPageProps {
  params: { hubId: string };
}

export default async function HubLeaderboardPage({
  params,
}: LeaderboardPageProps) {
  const { members, messages, statLogs } = await loadLeaderboardData(params.hubId);

  return (
    <>
      <LeaderboardHeader />

      <main className="mx-auto max-w-lg px-4 pt-4">
        <LeaderboardTabs
          hubId={params.hubId}
          initialMembers={members}
          initialMessages={messages}
          initialStatLogs={statLogs}
        />
      </main>
    </>
  );
}
