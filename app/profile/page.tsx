import { redirect } from "next/navigation";
import { ArrowLeft, User } from "lucide-react";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { ProfileForm } from "@/components/profile/ProfileForm";

export const revalidate = 0;

export default async function ProfilePage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/auth");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md -mx-4 px-4">
        <div className="mx-auto flex max-w-lg items-center gap-3 py-4">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 transition-colors hover:bg-primary/25"
          >
            <ArrowLeft className="h-5 w-5 text-primary" />
          </Link>
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
