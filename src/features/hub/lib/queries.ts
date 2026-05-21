import { redirect, notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/shared/lib/supabase-server";
import { hubLogger } from "@/shared/lib/logger";
import type { Hub, HubMember, HubMemberWithProfile, StatLogWithDetails } from "./types";
import type { MessageWithSender } from "@/features/chat/lib/types";
import type { Profile } from "@/shared/lib/types";

/**
 * Validates auth, fetches hub + member + profile in parallel.
 * Calls redirect() / notFound() on failure — never returns partial data.
 */
export async function loadHubSession(hubId: string): Promise<{
  hub: Hub;
  member: HubMember;
  profile: Profile;
}> {
  const supabase = createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth");
  }

  // All three queries only need hubId and user.id — run in parallel
  const [hubResult, memberResult, profileResult] = await Promise.all([
    supabase.from("hubs").select("*").eq("id", hubId).single(),
    supabase.from("hub_members").select("*").eq("hub_id", hubId).eq("user_id", user.id).single(),
    supabase.from("profiles").select("*").eq("id", user.id).single(),
  ]);

  if (hubResult.error) {
    hubLogger.error({ err: hubResult.error, hubId }, "loadHubSession: failed to fetch hub");
  }
  if (!hubResult.data) {
    notFound();
  }

  if (memberResult.error && memberResult.error.code !== "PGRST116") {
    hubLogger.error({ err: memberResult.error, hubId }, "loadHubSession: failed to fetch member");
  }
  if (!memberResult.data) {
    redirect(`/join/${hubResult.data.invite_code}`);
  }

  if (profileResult.error) {
    hubLogger.error({ err: profileResult.error, hubId }, "loadHubSession: failed to fetch profile");
  }
  if (!profileResult.data) {
    redirect("/auth");
  }

  return {
    hub: hubResult.data,
    member: memberResult.data,
    profile: profileResult.data,
  };
}

/**
 * Fetches members, messages, and stat logs for a hub in parallel.
 * Non-fatal: returns empty arrays on individual failures.
 */
export async function loadLeaderboardData(hubId: string): Promise<{
  members: HubMemberWithProfile[];
  messages: MessageWithSender[];
  statLogs: StatLogWithDetails[];
}> {
  const supabase = createServerSupabaseClient();

  const [membersResult, messagesResult, statLogsResult] = await Promise.all([
    supabase
      .from("hub_members")
      .select("*, profiles(*)")
      .eq("hub_id", hubId)
      .order("goals", { ascending: false }),
    supabase
      .from("messages")
      .select("*, profiles(*)")
      .eq("hub_id", hubId)
      .order("created_at", { ascending: true })
      .limit(50),
    supabase
      .from("stat_logs")
      .select("*, profiles(*), hub_members(*, profiles(*))")
      .eq("hub_id", hubId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (membersResult.error) {
    hubLogger.error({ err: membersResult.error, hubId }, "loadLeaderboardData: failed to fetch members");
  }
  if (messagesResult.error) {
    hubLogger.error({ err: messagesResult.error, hubId }, "loadLeaderboardData: failed to fetch messages");
  }
  if (statLogsResult.error) {
    hubLogger.error({ err: statLogsResult.error, hubId }, "loadLeaderboardData: failed to fetch stat logs");
  }

  return {
    members: (membersResult.data as HubMemberWithProfile[]) ?? [],
    messages: (messagesResult.data as MessageWithSender[]) ?? [],
    statLogs: (statLogsResult.data as StatLogWithDetails[]) ?? [],
  };
}
