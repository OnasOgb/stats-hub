"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { getSupabase } from "@/lib/supabase";
import { createHubSchema, type CreateHubValues, slugify } from "@/lib/validations";

export function CreateHubForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [codeAvailable, setCodeAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CreateHubValues>({
    resolver: zodResolver(createHubSchema),
    defaultValues: { name: "", invite_code: "" },
  });

  const nameValue = watch("name");
  const codeValue = watch("invite_code");

  // Auto-slugify name into invite_code
  useEffect(() => {
    if (nameValue) {
      setValue("invite_code", slugify(nameValue), { shouldValidate: true });
    }
  }, [nameValue, setValue]);

  // Debounced uniqueness check
  const checkAvailability = useCallback(async (code: string) => {
    if (!code || code.length < 3) {
      setCodeAvailable(null);
      return;
    }
    setChecking(true);
    const { data } = await getSupabase()
      .from("hubs")
      .select("id")
      .eq("invite_code", code)
      .maybeSingle();

    setCodeAvailable(data === null);
    setChecking(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkAvailability(codeValue);
    }, 400);
    return () => clearTimeout(timer);
  }, [codeValue, checkAvailability]);

  const onSubmit = async (values: CreateHubValues) => {
    setSubmitting(true);
    setError("");

    try {
      const supabase = getSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      // Insert hub
      const { data: hub, error: hubError } = await supabase
        .from("hubs")
        .insert({
          name: values.name,
          invite_code: values.invite_code,
          created_by: user.id,
        })
        .select()
        .single();

      if (hubError) throw hubError;

      // Add creator as admin
      const { error: memberError } = await supabase
        .from("hub_members")
        .insert({
          hub_id: hub.id,
          user_id: user.id,
          role: "admin",
        });

      if (memberError) throw memberError;

      router.push(`/hub/${hub.id}/leaderboard`);
    } catch (err) {
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

          <div className="space-y-2">
            <Label htmlFor="invite_code">Invite Code</Label>
            <div className="relative">
              <Input
                id="invite_code"
                placeholder="lekki-pro-2026"
                {...register("invite_code")}
              />
              {codeValue.length >= 3 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checking ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : codeAvailable === true ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : codeAvailable === false ? (
                    <X className="h-4 w-4 text-destructive" />
                  ) : null}
                </div>
              )}
            </div>
            {errors.invite_code && (
              <p className="text-sm text-destructive">
                {errors.invite_code.message}
              </p>
            )}
            {codeAvailable === false && (
              <p className="text-sm text-destructive">
                This invite code is already taken
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Share this code so others can join your hub
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={submitting || codeAvailable === false}
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
