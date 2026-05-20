import { createServerSupabaseClient } from "@/shared/lib/supabase-server";
import { hubLogger } from "@/shared/lib/logger";
import { LeaderboardHeader } from "@/features/hub/components/LeaderboardHeader";
import { LeaderboardTabs } from "@/features/hub/components/LeaderboardTabs";
import type { HubMemberWithProfile, StatLogWithDetails } from "@/features/hub/lib/types";
import type { MessageWithSender } from "@/features/chat/lib/types";

export const revalidate = 0;

interface LeaderboardPageProps {
  params: { hubId: string };
}

export default async function HubLeaderboardPage({
  params,
}: LeaderboardPageProps) {
  const supabase = createServerSupabaseClient();

  // Fetch all members with profiles
  const { data: members, error: membersError } = await supabase
    .from("hub_members")
    .select("*, profiles(*)")
    .eq("hub_id", params.hubId)
    .order("goals", { ascending: false });

  if (membersError) {
    hubLogger.error({ err: membersError, hubId: params.hubId }, "leaderboard: failed to fetch members");
  }

  // Fetch initial messages
  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("*, profiles(*)")
    .eq("hub_id", params.hubId)
    .order("created_at", { ascending: true })
    .limit(50);

  if (messagesError) {
    hubLogger.error({ err: messagesError, hubId: params.hubId }, "leaderboard: failed to fetch messages");
  }

  // Fetch initial stat logs
  const { data: statLogs, error: statLogsError } = await supabase
    .from("stat_logs")
    .select("*, profiles(*), hub_members(*, profiles(*))")
    .eq("hub_id", params.hubId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (statLogsError) {
    hubLogger.error({ err: statLogsError, hubId: params.hubId }, "leaderboard: failed to fetch stat logs");
  }

  return (
    <>
      <LeaderboardHeader />

      <main className="mx-auto max-w-lg px-4 pt-4">
        <LeaderboardTabs
          hubId={params.hubId}
          initialMembers={(members as HubMemberWithProfile[]) ?? []}
          initialMessages={(messages as MessageWithSender[]) ?? []}
          initialStatLogs={(statLogs as StatLogWithDetails[]) ?? []}
        />
      </main>
    </>
  );
}
