"use client";

import { useEffect, useRef } from "react";
import { getSupabase } from "@/shared/lib/supabase";
import { mutate } from "@/shared/lib/mutate";
import { useHub } from "@/features/hub/providers/HubContext";
import { useRealtimeList } from "@/features/hub/lib/use-realtime-list";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import type { MessageWithSender } from "../lib/types";

interface HubChatProps {
  hubId: string;
  initialMessages: MessageWithSender[];
}

export function HubChat({ hubId, initialMessages }: HubChatProps) {
  const { currentProfile } = useHub();
  const scrollRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="flex flex-col h-[calc(100vh-13rem)]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 px-1 py-3">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground pt-8">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              senderName={msg.profiles.name || "Anonymous"}
              senderAvatar={msg.profiles.avatar_url}
              content={msg.content}
              createdAt={msg.created_at}
              isOwn={msg.sender_id === currentProfile.id}
              isPending={pendingIds.has(msg.id)}
            />
          ))
        )}
      </div>
      <div className="border-t border-border pt-3 pb-1">
        <ChatInput onSend={handleSend} />
      </div>
    </div>
  );
}
