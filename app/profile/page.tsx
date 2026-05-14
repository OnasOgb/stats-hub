import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/shared/lib/supabase-server";
import { pageLogger } from "@/shared/lib/logger";
import { ProfileForm } from "@/features/profile/components/ProfileForm";
import { BackButton } from "@/features/navigation/components/BackButton";

export const revalidate = 0;

export default async function ProfilePage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError) {
    pageLogger.error({ err: profileError }, "profile: failed to fetch profile");
  }

  if (!profile) {
    redirect("/auth");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md -mx-4 px-4">
        <div className="mx-auto flex max-w-lg items-center gap-3 py-4">
          <BackButton />
          <div>
            <h1 className="text-lg font-bold tracking-tight">Profile</h1>
            <p className="text-xs text-muted-foreground">
              Manage your account
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg pt-6 flex-1">
        <ProfileForm profile={profile} email={user.email ?? ""} />
      </main>
    </div>
  );
}
