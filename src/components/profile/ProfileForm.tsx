"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import imageCompression from "browser-image-compression";
import { Camera, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { getSupabase } from "@/lib/supabase";
import {
  profileFormSchema,
  type ProfileFormValues,
} from "@/lib/validations";
import type { Profile } from "@/lib/types";

interface ProfileFormProps {
  profile: Profile;
  email: string;
}

export function ProfileForm({ profile, email }: ProfileFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar_url);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: profile.name },
  });

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 512,
        fileType: "image/webp",
      });

      setAvatarFile(compressed);
      setAvatarPreview(URL.createObjectURL(compressed));
    } catch {
      setError("Failed to process image. Try a different file.");
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    setSubmitting(true);
    setError("");

    try {
      const supabase = getSupabase();
      let newAvatarUrl = profile.avatar_url;

      // Upload new avatar if selected
      if (avatarFile) {
        const timestamp = Date.now();
        const filePath = `${profile.id}/avatar-${timestamp}.webp`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile, {
            contentType: "image/webp",
            upsert: false,
          });

        if (uploadError) throw new Error("Failed to upload avatar");

        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        newAvatarUrl = urlData.publicUrl;

        // Best-effort cleanup of old avatar (skip external URLs like Google OAuth)
        if (
          profile.avatar_url &&
          profile.avatar_url.includes("/storage/v1/object/public/avatars/")
        ) {
          const oldPath = profile.avatar_url.split("/avatars/")[1];
          if (oldPath) {
            supabase.storage.from("avatars").remove([oldPath]).catch(() => {});
          }
        }
      }

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          name: values.name,
          avatar_url: newAvatarUrl,
        })
        .eq("id", profile.id);

      if (updateError) throw new Error("Failed to update profile");

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = getSupabase();
    await supabase.auth.signOut();
    router.push("/auth");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Avatar upload */}
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={handleAvatarClick}
          className="relative group"
        >
          <PlayerAvatar
            name={profile.name}
            avatarUrl={avatarPreview}
            size="lg"
          />
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <Camera className="h-6 w-6 text-white" />
          </div>
        </button>
        <p className="text-xs text-muted-foreground">Tap to change photo</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Email (read-only) */}
      <div className="space-y-2">
        <Label>Email</Label>
        <p className="text-sm text-muted-foreground truncate">{email}</p>
      </div>

      {/* Display Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Display Name</Label>
        <Input id="name" placeholder="Your name" {...register("name")} />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Save */}
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Changes"
        )}
      </Button>

      <Separator />

      {/* Logout */}
      <Button
        type="button"
        variant="destructive"
        className="w-full"
        onClick={handleLogout}
        disabled={loggingOut}
      >
        {loggingOut ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Logging out...
          </>
        ) : (
          <>
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </>
        )}
      </Button>
    </form>
  );
}
