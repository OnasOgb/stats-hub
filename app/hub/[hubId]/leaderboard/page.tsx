import { Trophy } from "lucide-react";
import { createServerSupabaseClient } from "@/shared/lib/supabase-server";
import { hubLogger } from "@/shared/lib/logger";
import { LeaderboardTabs } from "@/features/hub/components/LeaderboardTabs";
import { CopyInviteLink } from "@/features/hub/components/CopyInviteLink";
import { UserAvatarButton } from "@/features/profile/components/UserAvatarButton";
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch hub info
  const { data: hub, error: hubError } = await supabase
    .from("hubs")
    .select("*")
    .eq("id", params.hubId)
    .single();

  if (hubError) {
    hubLogger.error({ err: hubError, hubId: params.hubId }, "leaderboard: failed to fetch hub");
  }

  // Fetch all members with profiles
  const { data: members, error: membersError } = await supabase
    .from("hub_members")
    .select("*, profiles(*)")
    .eq("hub_id", params.hubId)
    .order("goals", { ascending: false });

  if (membersError) {
    hubLogger.error({ err: membersError, hubId: params.hubId }, "leaderboard: failed to fetch members");
  }

  const currentMember = members?.find((m) => m.user_id === user?.id);

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
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold tracking-tight truncate">
              {hub?.name ?? "Hub"}
            </h1>
            {currentMember?.role === "admin" && (
              <CopyInviteLink inviteCode={hub?.invite_code ?? ""} />
            )}
          </div>
          <div className="shrink-0">
            <UserAvatarButton />
          </div>
        </div>
      </header>

      {/* Content with Tabs */}
      <main className="mx-auto max-w-lg px-4 pt-4">
        <LeaderboardTabs
          hubId={params.hubId}
          initialMembers={(members as HubMemberWithProfile[]) ?? []}
          currentUserId={user?.id ?? null}
          initialMessages={(messages as MessageWithSender[]) ?? []}
          initialStatLogs={(statLogs as StatLogWithDetails[]) ?? []}
        />
      </main>
    </>
  );
}
