"use client";

import { useState } from "react";
import { Link, Check } from "lucide-react";
import { toast } from "sonner";

interface CopyInviteLinkProps {
  inviteCode: string;
}

export function CopyInviteLink({ inviteCode }: CopyInviteLinkProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${window.location.origin}/join/${inviteCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Invite link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy invite link");
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-green-500" />
          <span className="text-green-500">Copied!</span>
        </>
      ) : (
        <>
          <Link className="h-3 w-3" />
          <span>Copy invite link</span>
        </>
      )}
    </button>
  );
}
