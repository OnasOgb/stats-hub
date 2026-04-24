"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getSupabase } from "@/lib/supabase";

interface JoinHubFlowProps {
  hubId: string;
  hubName: string;
  inviteCode: string;
}

export function JoinHubFlow({ hubId, hubName, inviteCode }: JoinHubFlowProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingMembership, setCheckingMembership] = useState(true);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const supabase = getSupabase();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          window.location.href = `/auth?next=/join/${inviteCode}`;
          return;
        }

        const { data: existing } = await supabase
          .from("hub_members")
          .select("id")
          .eq("hub_id", hubId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (!cancelled) {
          setIsMember(!!existing);
          setCheckingMembership(false);
        }
      } catch {
        if (!cancelled) {
          setCheckingMembership(false);
        }
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [hubId, inviteCode]);

  const handleJoin = async () => {
    setLoading(true);
    setError("");

    try {
      const supabase = getSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = `/auth?next=/join/${inviteCode}`;
        return;
      }

      const { error: joinError } = await supabase
        .from("hub_members")
        .insert({
          hub_id: hubId,
          user_id: user.id,
          role: "player",
        });

      if (joinError) throw joinError;

      router.push(`/hub/${hubId}/leaderboard`);
    } catch (err: any) {
      if (err?.code === "23505") {
        router.push(`/hub/${hubId}/leaderboard`);
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to join hub");
      setLoading(false);
    }
  };

  if (checkingMembership) {
    return (
      <Card className="border-border">
        <CardContent className="pt-6 space-y-4">
          <Skeleton className="h-5 w-3/4 mx-auto" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isMember) {
    return (
      <Card className="border-border">
        <CardContent className="pt-6 space-y-4">
          <p className="text-sm text-center text-muted-foreground">
            You&apos;re already a member of <strong>{hubName}</strong>.
          </p>
          <Button
            onClick={() => router.push(`/hub/${hubId}/leaderboard`)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Enter Hub
          </Button>
        </CardContent>
      </Card>
    );
  }

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
        <Button onClick={handleJoin} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading}>
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
