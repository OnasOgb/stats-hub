import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/shared/lib/supabase-server";
import { pageLogger } from "@/shared/lib/logger";
import { JoinHubFlow } from "@/features/hub/components/JoinHubFlow";
import { Trophy, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/shared/components/ui/button";

interface JoinCodePageProps {
  params: { code: string };
}

export default async function JoinCodePage({ params }: JoinCodePageProps) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth?next=/join/${params.code}`);
  }

  // Look up hub by invite code
  const { data: hub, error: hubError } = await supabase
    .from("hubs")
    .select("*")
    .eq("invite_code", params.code)
    .single();

  if (hubError && hubError.code !== "PGRST116") {
    pageLogger.error({ err: hubError, inviteCode: params.code }, "join: failed to look up hub");
  }

  if (!hub) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/15">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold">Hub Not Found</h1>
            <p className="text-sm text-muted-foreground">
              No hub exists with the invite code &quot;{params.code}&quot;.
              Double-check the code and try again.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/join">Try Another Code</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Check if already a member
  const { data: existing, error: existingError } = await supabase
    .from("hub_members")
    .select("id")
    .eq("hub_id", hub.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) {
    pageLogger.error({ err: existingError, hubId: hub.id }, "join: failed to check membership");
  }

  if (existing) {
    redirect(`/hub/${hub.id}/leaderboard`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">{hub.name}</h1>
            <p className="text-sm text-muted-foreground">
              You&apos;ve been invited to join this hub
            </p>
          </div>
        </div>

        <JoinHubFlow hubId={hub.id} hubName={hub.name} inviteCode={params.code} />
      </div>
    </div>
  );
}
