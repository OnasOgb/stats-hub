"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { Loader2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Card, CardContent } from "@/shared/components/ui/card";
import { getSupabase } from "@/shared/lib/supabase";

const createHubSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(30),
});

type CreateHubValues = z.infer<typeof createHubSchema>;

const SAFE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function generateInviteCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += SAFE_ALPHABET[Math.floor(Math.random() * SAFE_ALPHABET.length)];
  }
  return code;
}

const MAX_RETRIES = 3;

export function CreateHubForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateHubValues>({
    resolver: zodResolver(createHubSchema),
    defaultValues: { name: "" },
  });

  const onSubmit = async (values: CreateHubValues) => {
    setSubmitting(true);
    setError("");

    try {
      const supabase = getSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      let hub = null;

      // Loop handles potential invite_code collisions
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const code = generateInviteCode();

        const { data, error: hubError } = await supabase
          .from("hubs")
          .insert({
            name: values.name,
            invite_code: code,
            created_by: user.id,
          })
          .select()
          .single();

        if (!hubError) {
          hub = data;
          break;
        }

        // Logic check: If it's a name conflict for this user, stop immediately
        if (hubError.message?.includes("hubs_name_created_by_key")) {
          throw new Error("You already have a hub with this name.");
        }

        // Only retry on generic unique violations (likely invite_code)
        if (hubError.code !== "23505") throw hubError;

        if (attempt === MAX_RETRIES - 1) {
          throw new Error("Could not generate a unique invite code. Please try again.");
        }
      }

      if (!hub) throw new Error("Failed to create hub");

      /**
       * NOTE: Manual 'hub_members' insertion removed.
       * The Database Trigger 'handle_new_hub_admin' in setup.sql
       * handles this automatically and atomically.
       */

      router.push(`/hub/${hub.id}/leaderboard`);
    } catch (err) {
      Sentry.captureException(err, { extra: { context: "CreateHubForm: hub creation" } });
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-border">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Hub Name</Label>
            <Input
              id="name"
              placeholder="Lekki Pro 2026"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Hub"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
