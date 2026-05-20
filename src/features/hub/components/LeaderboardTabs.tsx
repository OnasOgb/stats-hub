"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { LeaderboardClient } from "./LeaderboardClient";
import { HubChat } from "@/features/chat/components/HubChat";
import { ActivityFeed } from "@/features/activity/components/ActivityFeed";
import type { HubMemberWithProfile, StatLogWithDetails } from "../lib/types";
import type { MessageWithSender } from "@/features/chat/lib/types";

interface LeaderboardTabsProps {
  hubId: string;
  initialMembers: HubMemberWithProfile[];
  initialMessages: MessageWithSender[];
  initialStatLogs: StatLogWithDetails[];
}

export function LeaderboardTabs({
  hubId,
  initialMembers,
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
