"use client";

import { PlayerAvatar } from "@/features/profile/components/PlayerAvatar";
import { cn } from "@/shared/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ChatMessageProps {
  senderName: string;
  senderAvatar?: string;
  content: string;
  createdAt: string;
  isOwn: boolean;
  isPending?: boolean;
}

export function ChatMessage({
  senderName,
  senderAvatar,
  content,
  createdAt,
  isOwn,
  isPending,
}: ChatMessageProps) {
  return (
    <div
      className={cn(
        "flex gap-2 max-w-[85%]",
        isOwn ? "ml-auto flex-row-reverse" : "",
        isPending && "opacity-50"
      )}
    >
      {!isOwn && (
        <PlayerAvatar name={senderName} avatarUrl={senderAvatar} size="sm" />
      )}

      <div className={cn("space-y-1", isOwn ? "items-end" : "items-start")}>
        {!isOwn && (
          <p className="text-xs font-medium text-muted-foreground px-1">
            {senderName}
          </p>
        )}
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-sm",
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-secondary text-secondary-foreground rounded-bl-md"
          )}
        >
          {content}
        </div>
        <p
          className={cn(
            "text-[10px] text-muted-foreground px-1",
            isOwn && "text-right"
          )}
        >
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
