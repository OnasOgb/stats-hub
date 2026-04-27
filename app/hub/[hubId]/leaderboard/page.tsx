import { Trophy } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { LeaderboardClient } from "@/components/LeaderboardClient";
import { LeaderboardTabs } from "@/components/LeaderboardTabs";
import { CopyInviteLink } from "@/components/hub/CopyInviteCode";
import { UserAvatarButton } from "@/components/UserAvatarButton";
import type { HubMemberWithProfile, MessageWithSender, StatLogWithDetails } from "@/lib/types";

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
  const { data: hub } = await supabase
    .from("hubs")
    .select("*")
    .eq("id", params.hubId)
    .single();

  // Fetch all members with profiles
  const { data: members } = await supabase
    .from("hub_members")
    .select("*, profiles(*)")
    .eq("hub_id", params.hubId)
    .order("goals", { ascending: false });

  const currentMember = members?.find((m) => m.user_id === user?.id);

  // Fetch initial messages
  const { data: messages } = await supabase
    .from("messages")
    .select("*, profiles(*)")
    .eq("hub_id", params.hubId)
    .order("created_at", { ascending: true })
    .limit(50);

  // Fetch initial stat logs
  const { data: statLogs } = await supabase
    .from("stat_logs")
    .select("*, profiles(*), hub_members(*, profiles(*))")
    .eq("hub_id", params.hubId)
    .order("created_at", { ascending: false })
    .limit(50);

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
