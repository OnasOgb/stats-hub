"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  LogOut,
  MoreVertical,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { getSupabase } from "@/shared/lib/supabase";
import type { Hub } from "../lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";

interface HubCardProps {
  hub: Hub;
  role: string;
  memberCount: number;
  membershipId: string;
}

export function HubCard({ hub, role, memberCount, membershipId }: HubCardProps) {
  const router = useRouter();
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const isAdmin = role === "admin";

  async function handleLeaveHub() {
    setLoading(true);
    const supabase = getSupabase();
    const { error } = await supabase
      .from("hub_members")
      .delete()
      .eq("id", membershipId);

    if (error) {
      console.error("Failed to leave hub:", error);
      setLoading(false);
      return;
    }

    router.refresh();
  }

  async function handleDeleteHub() {
    setLoading(true);
    const supabase = getSupabase();
    const { error } = await supabase
      .from("hubs")
      .delete()
      .eq("id", hub.id);

    if (error) {
      console.error("Failed to delete hub:", error);
      setLoading(false);
      return;
    }

    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-card/80">
        <Link
          href={`/hub/${hub.id}/leaderboard`}
          className="flex flex-1 items-center gap-4 min-w-0"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 text-primary font-bold text-lg flex-shrink-0">
            {hub.name.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{hub.name}</h3>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
                  <Shield className="h-3 w-3" />
                  Admin
                </span>
              )}
            </div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {memberCount} {memberCount === 1 ? "member" : "members"}
            </p>
          </div>

          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors flex-shrink-0"
              aria-label="Hub options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isAdmin ? (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete Hub
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => setShowLeaveDialog(true)}
              >
                <LogOut className="h-4 w-4" />
                Leave Hub
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Leave Hub Confirmation */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave {hub.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              You will lose all your stats in this hub. You can rejoin later with
              an invite link, but your stats will not be restored.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={loading}
              onClick={handleLeaveHub}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Leaving..." : "Leave Hub"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Hub Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {hub.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the hub, all member stats, messages,
              and activity history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={loading}
              onClick={handleDeleteHub}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Deleting..." : "Delete Hub"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
