"use client";

import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Send } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { PlayerAvatar } from "@/features/profile/components/PlayerAvatar";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { getSupabase } from "@/shared/lib/supabase";
import { mutate } from "@/shared/lib/mutate";
import { useHub } from "../providers/HubContext";
import { useRealtimeList } from "../lib/use-realtime-list";
import type { MessageWithSender } from "../lib/types";

interface HubChatProps {
  hubId: string;
  initialMessages: MessageWithSender[];
}

export function HubChat({ hubId, initialMessages }: HubChatProps) {
  const { currentProfile } = useHub();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");

  const { items: messages, pendingIds, addOptimistic, revertOptimistic } =
    useRealtimeList<MessageWithSender>({
      hubId,
      table: "messages",
      select: "*, profiles(*)",
      initialData: initialMessages,
      order: "append",
      events: ["INSERT"],
    });

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (content: string) => {
    const id = crypto.randomUUID();

    // Append optimistically — the hook confirms it when the realtime
    // INSERT arrives, or we revert on error.
    addOptimistic({
      id,
      hub_id: hubId,
      sender_id: currentProfile.id,
      content,
      created_at: new Date().toISOString(),
      profiles: currentProfile,
    });

    const { error } = await mutate({
      fn: () => getSupabase().from("messages").insert({
        id,
        hub_id: hubId,
        sender_id: currentProfile.id,
        content,
      }),
      context: "HubChat: message send",
      errorMessage: "Failed to send message",
    });

    if (error) {
      revertOptimistic(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || trimmed.length > 500) return;
    handleSend(trimmed);
    setInputValue("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-13rem)]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 px-1 py-3">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground pt-8">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === currentProfile.id;
            const isPending = pendingIds.has(msg.id);
            const senderName = msg.profiles.name || "Anonymous";

            return (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2 max-w-[85%]",
                  isOwn ? "ml-auto flex-row-reverse" : "",
                  isPending && "opacity-50"
                )}
              >
                {!isOwn && (
                  <PlayerAvatar name={senderName} avatarUrl={msg.profiles.avatar_url} size="sm" />
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
                    {msg.content}
                  </div>
                  <p
                    className={cn(
                      "text-[10px] text-muted-foreground px-1",
                      isOwn && "text-right"
                    )}
                  >
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="border-t border-border pt-3 pb-1">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            maxLength={500}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputValue.trim()}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
