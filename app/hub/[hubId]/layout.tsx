import { loadHubSession } from "@/features/hub/lib/queries";
import { HubProvider } from "@/features/hub/providers/HubContext";
import { BottomNav } from "@/features/navigation/components/BottomNav";
import { Toaster } from "@/shared/components/ui/sonner";

interface HubLayoutProps {
  children: React.ReactNode;
  params: { hubId: string };
}

export default async function HubLayout({ children, params }: HubLayoutProps) {
  const { hub, member, profile } = await loadHubSession(params.hubId);

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
