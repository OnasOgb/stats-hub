import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { PlayerProfileClient } from "@/components/PlayerProfileClient";
import { BottomNav } from "@/components/BottomNav";

interface PlayerPageProps {
  params: { id: string };
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const supabase = createServerSupabaseClient();
  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!player) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <PlayerProfileClient player={player} />
      <BottomNav />
    </div>
  );
}
