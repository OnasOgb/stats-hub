import { Trophy } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { LeaderboardClient } from "@/components/LeaderboardClient";
import type { HubMemberWithProfile } from "@/lib/types";

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

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              {hub?.name ?? "Hub"}
            </h1>
            <p className="text-xs text-muted-foreground">
              /{hub?.invite_code}
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-lg px-4 pt-4">
        <LeaderboardClient
          hubId={params.hubId}
          initialMembers={(members as HubMemberWithProfile[]) ?? []}
          currentUserId={user?.id ?? null}
        />
      </main>
    </>
  );
}
