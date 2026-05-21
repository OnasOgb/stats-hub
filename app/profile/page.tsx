import { ProfileForm } from "@/features/profile/components/ProfileForm";
import { BackButton } from "@/features/navigation/components/BackButton";
import { loadProfile } from "@/features/hub/lib/queries";

export const revalidate = 0;

export default async function ProfilePage() {
  const { profile, email } = await loadProfile();

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
        <ProfileForm profile={profile} email={email} />
      </main>
    </div>
  );
}
