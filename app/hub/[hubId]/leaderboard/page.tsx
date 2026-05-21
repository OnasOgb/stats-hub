import { loadLeaderboardData } from "@/features/hub/lib/queries";
import { LeaderboardHeader } from "@/features/hub/components/LeaderboardHeader";
import { LeaderboardClient } from "@/features/hub/components/LeaderboardClient";
import { ActivityFeed } from "@/features/hub/components/ActivityFeed";
import { HubChat } from "@/features/hub/components/HubChat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";

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
        <Tabs defaultValue="leaderboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard" className="mt-4">
            <LeaderboardClient
              hubId={params.hubId}
              initialMembers={members}
            />
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <ActivityFeed hubId={params.hubId} initialLogs={statLogs} />
          </TabsContent>

          <TabsContent value="chat" className="mt-4">
            <HubChat hubId={params.hubId} initialMessages={messages} />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
