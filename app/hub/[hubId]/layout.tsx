import { redirect, notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/shared/lib/supabase-server";
import { hubLogger } from "@/shared/lib/logger";
import { HubProvider } from "@/features/hub/providers/HubContext";
import { BottomNav } from "@/features/navigation/components/BottomNav";
import { Toaster } from "@/shared/components/ui/sonner";

interface HubLayoutProps {
  children: React.ReactNode;
  params: { hubId: string };
}

export default async function HubLayout({ children, params }: HubLayoutProps) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Fetch hub
  const { data: hub, error: hubError } = await supabase
    .from("hubs")
    .select("*")
    .eq("id", params.hubId)
    .single();

  if (hubError) {
    hubLogger.error({ err: hubError, hubId: params.hubId }, "hub layout: failed to fetch hub");
  }

  if (!hub) {
    notFound();
  }

  // Fetch current user's membership
  const { data: member, error: memberError } = await supabase
    .from("hub_members")
    .select("*")
    .eq("hub_id", params.hubId)
    .eq("user_id", user.id)
    .single();

  if (memberError && memberError.code !== "PGRST116") {
    hubLogger.error({ err: memberError, hubId: params.hubId }, "hub layout: failed to fetch member");
  }

  if (!member) {
    // Not a member — redirect to join page
    redirect(`/join/${hub.invite_code}`);
  }

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError) {
    hubLogger.error({ err: profileError, hubId: params.hubId }, "hub layout: failed to fetch profile");
  }

  if (!profile) {
    redirect("/auth");
  }

  return (
    <HubProvider hub={hub} currentMember={member} currentProfile={profile}>
      <div className="min-h-screen bg-background pb-20">
        {children}
      </div>
      <BottomNav hubId={params.hubId} memberId={member.id} />
      <Toaster />
    </HubProvider>
  );
}
