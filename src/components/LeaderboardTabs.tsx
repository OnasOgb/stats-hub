"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeaderboardClient } from "@/components/LeaderboardClient";
import { HubChat } from "@/components/chat/HubChat";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import type {
  HubMemberWithProfile,
  MessageWithSender,
  StatLogWithDetails,
} from "@/lib/types";

interface LeaderboardTabsProps {
  hubId: string;
  initialMembers: HubMemberWithProfile[];
  currentUserId: string | null;
  initialMessages: MessageWithSender[];
  initialStatLogs: StatLogWithDetails[];
}

export function LeaderboardTabs({
  hubId,
  initialMembers,
  currentUserId,
  initialMessages,
  initialStatLogs,
}: LeaderboardTabsProps) {
  return (
    <Tabs defaultValue="leaderboard" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="chat">Chat</TabsTrigger>
      </TabsList>

      <TabsContent value="leaderboard" className="mt-4">
        <LeaderboardClient
          hubId={hubId}
          initialMembers={initialMembers}
          currentUserId={currentUserId}
        />
      </TabsContent>

      <TabsContent value="activity" className="mt-4">
        <ActivityFeed hubId={hubId} initialLogs={initialStatLogs} />
      </TabsContent>

      <TabsContent value="chat" className="mt-4">
        <HubChat hubId={hubId} initialMessages={initialMessages} />
      </TabsContent>
    </Tabs>
  );
}
