import { redirect } from "next/navigation";
import { Trophy, Plus, LogIn } from "lucide-react";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { HubCard } from "@/components/hub/HubCard";

export const revalidate = 0;

export default async function HomePage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Fetch user's hubs with hub details
  const { data: memberships } = await supabase
    .from("hub_members")
    .select("*, hubs(*)")
    .eq("user_id", user.id);

  const hubs = memberships ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md -mx-4 px-4">
        <div className="mx-auto flex max-w-lg items-center gap-3 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">StatsHub</h1>
            <p className="text-xs text-muted-foreground">Your Hubs</p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg pt-6 flex-1">
        {hubs.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center gap-6 pt-16 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Trophy className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold">No hubs yet</h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                Create a hub for your football group or join one with an invite
                code.
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Button asChild>
                <Link href="/hub/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create a Hub
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/join">
                  <LogIn className="mr-2 h-4 w-4" />
                  Join with Invite Code
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          /* Hub list */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Your Hubs
              </h2>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" asChild>
                  <Link href="/join">
                    <LogIn className="mr-1 h-3 w-3" />
                    Join
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/hub/create">
                    <Plus className="mr-1 h-3 w-3" />
                    Create
                  </Link>
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {hubs.map((membership) => (
                <HubCard
                  key={membership.id}
                  hub={membership.hubs!}
                  role={membership.role}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
