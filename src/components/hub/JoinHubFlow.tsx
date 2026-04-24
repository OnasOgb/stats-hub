"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSupabase } from "@/lib/supabase";

interface JoinHubFlowProps {
  hubId: string;
  hubName: string;
}

export function JoinHubFlow({ hubId, hubName }: JoinHubFlowProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async () => {
    setLoading(true);
    setError("");

    try {
      const supabase = getSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      const { error: joinError } = await supabase
        .from("hub_members")
        .insert({
          hub_id: hubId,
          user_id: user.id,
          role: "player",
        });

      if (joinError) throw joinError;

      router.push(`/hub/${hubId}/leaderboard`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join hub");
      setLoading(false);
    }
  };

  return (
    <Card className="border-border">
      <CardContent className="pt-6 space-y-4">
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <p className="text-sm text-center text-muted-foreground">
          Join <strong>{hubName}</strong> to start tracking your football stats
          with the group.
        </p>
        <Button onClick={handleJoin} className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Joining...
            </>
          ) : (
            "Join Hub"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
