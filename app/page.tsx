"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import imageCompression from "browser-image-compression";
import { Trophy, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getSupabase } from "@/lib/supabase";
import { joinFormSchema, type JoinFormValues } from "@/lib/validations";

export default function JoinPage() {
  const router = useRouter();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<JoinFormValues>({
    resolver: zodResolver(joinFormSchema),
  });

  const nameValue = watch("name", "");

  const initials = nameValue
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 400,
        useWebWorker: true,
      });
      setPhotoFile(compressed);
      setPhotoPreview(URL.createObjectURL(compressed));
    } catch {
      setError("Failed to process image. Please try another.");
    }
  };

  const onSubmit = async (values: JoinFormValues) => {
    setSubmitting(true);
    setError("");

    try {
      let photo_url = "";

      // Upload photo if selected
      if (photoFile) {
        const fileExt = photoFile.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await getSupabase().storage
          .from("player-photos")
          .upload(fileName, photoFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = getSupabase().storage
          .from("player-photos")
          .getPublicUrl(fileName);

        photo_url = urlData.publicUrl;
      }

      // Insert player
      const { data: player, error: insertError } = await getSupabase()
        .from("players")
        .insert({ name: values.name, photo_url })
        .select()
        .single();

      if (insertError) {
        // Clean up orphan photo if upload succeeded but insert failed
        if (photo_url) {
          const path = photo_url.split("/").pop();
          if (path) {
            await getSupabase().storage.from("player-photos").remove([path]);
          }
        }
        throw insertError;
      }

      // Store player ID in localStorage and cookie
      localStorage.setItem("strider-player-id", player.id);
      document.cookie = `strider-player-id=${player.id}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;

      router.push(`/player/${player.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">Join the Club</h1>
            <p className="text-sm text-muted-foreground">
              Add yourself to the leaderboard
            </p>
          </div>
        </div>

        <Card className="border-border">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Photo upload */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <Avatar className="h-20 w-20 ring-2 ring-primary/30">
                    {photoPreview && (
                      <AvatarImage src={photoPreview} alt="Preview" />
                    )}
                    <AvatarFallback className="bg-primary/20 text-primary font-bold text-2xl">
                      {initials || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="photo"
                    className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110"
                  >
                    <Camera className="h-4 w-4" />
                  </label>
                  <input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Tap to add a photo (optional)
                </p>
              </div>

              {/* Name input */}
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  placeholder="Marcus Johnson"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join Strider"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
