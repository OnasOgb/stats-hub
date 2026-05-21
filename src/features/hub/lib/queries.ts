import { redirect, notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/shared/lib/supabase-server";
import { hubLogger, pageLogger } from "@/shared/lib/logger";
import type { Hub, HubMember, HubMemberWithProfile, MembershipWithHub, MessageWithSender, StatLogWithDetails } from "./types";
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

/**
 * Home page: validates auth then fetches all Hub memberships for the
 * current user, with Hub details and member counts.
 * Redirects to /auth if not authenticated.
 */
export async function loadHomePage(): Promise<{
  memberships: MembershipWithHub[];
}> {
  const supabase = createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth");
  }

  const { data: memberships, error } = await supabase
    .from("hub_members")
    .select("*, hubs(*, hub_members(count))")
    .eq("user_id", user.id);

  if (error) {
    pageLogger.error({ err: error }, "loadHomePage: failed to fetch hub memberships");
  }

  return { memberships: (memberships as MembershipWithHub[]) ?? [] };
}

/**
 * Profile page: validates auth then fetches the current user's Profile.
 * Redirects to /auth if not authenticated or profile missing.
 */
export async function loadProfile(): Promise<{
  profile: Profile;
  email: string;
}> {
  const supabase = createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    pageLogger.error({ err: error }, "loadProfile: failed to fetch profile");
  }
  if (!profile) {
    redirect("/auth");
  }

  return { profile, email: user.email ?? "" };
}

/**
 * Join-by-code page: validates auth, looks up Hub by Invite Code,
 * checks existing membership. Redirects to leaderboard if already
 * a member. Returns `hub: null` when no Hub matches the code (the
 * page renders its own "not found" UI for this case).
 */
export async function loadJoinPage(code: string): Promise<{
  hub: Hub | null;
}> {
  const supabase = createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/auth?next=/join/${code}`);
  }

  const { data: hub, error: hubError } = await supabase
    .from("hubs")
    .select("*")
    .eq("invite_code", code)
    .single();

  if (hubError && hubError.code !== "PGRST116") {
    pageLogger.error({ err: hubError, inviteCode: code }, "loadJoinPage: failed to look up hub");
  }

  if (!hub) {
    return { hub: null };
  }

  const { data: existing, error: existingError } = await supabase
    .from("hub_members")
    .select("id")
    .eq("hub_id", hub.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) {
    pageLogger.error({ err: existingError, hubId: hub.id }, "loadJoinPage: failed to check membership");
  }

  if (existing) {
    redirect(`/hub/${hub.id}/leaderboard`);
  }

  return { hub };
}

/**
 * Player profile page: fetches a Hub Member with their Profile.
 * Calls notFound() if the member doesn't exist in this Hub.
 * Auth is handled by the Hub layout above this page.
 */
export async function loadPlayerMember(
  hubId: string,
  memberId: string,
): Promise<{ member: HubMemberWithProfile }> {
  const supabase = createServerSupabaseClient();

  const { data: member, error } = await supabase
    .from("hub_members")
    .select("*, profiles(*)")
    .eq("id", memberId)
    .eq("hub_id", hubId)
    .single();

  if (error && error.code !== "PGRST116") {
    hubLogger.error({ err: error, hubId, memberId }, "loadPlayerMember: failed to fetch member");
  }
  if (!member) {
    notFound();
  }

  return { member: member as HubMemberWithProfile };
}
