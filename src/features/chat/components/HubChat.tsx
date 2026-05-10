"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabase } from "@/shared/lib/supabase";
import { useHub } from "@/features/hub/providers/HubContext";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { toast } from "sonner";
import type { MessageWithSender } from "../lib/types";

interface HubChatProps {
  hubId: string;
  initialMessages: MessageWithSender[];
}

export function HubChat({ hubId, initialMessages }: HubChatProps) {
  const { currentProfile } = useHub();
  const [messages, setMessages] = useState<MessageWithSender[]>(initialMessages);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const supabase = getSupabase();

    const channel = supabase
      .channel(`hub-${hubId}-messages`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `hub_id=eq.${hubId}`,
        },
        async (payload) => {
          const newMsg = payload.new as { id: string; sender_id: string };

          // Skip if it's our own optimistic message
          if (newMsg.sender_id === currentProfile.id) {
            // Mark as confirmed (remove pending status)
            setPendingIds((prev) => {
              const next = new Set(prev);
              next.delete(newMsg.id);
              return next;
            });
            return;
          }

          // Fetch full message with profile
          const { data } = await supabase
            .from("messages")
            .select("*, profiles(*)")
            .eq("id", newMsg.id)
            .single();

          if (data) {
            setMessages((prev) => {
              // De-duplicate
              if (prev.some((m) => m.id === data.id)) return prev;
              return [...prev, data as MessageWithSender];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hubId, currentProfile.id]);

  const handleSend = async (content: string) => {
    const id = crypto.randomUUID();

    // Build optimistic message
    const optimistic: MessageWithSender = {
      id,
      hub_id: hubId,
      sender_id: currentProfile.id,
      content,
      created_at: new Date().toISOString(),
      profiles: currentProfile,
    };

    // Append optimistically
    setMessages((prev) => [...prev, optimistic]);
    setPendingIds((prev) => new Set(prev).add(id));

    // Insert into DB
    const { error } = await getSupabase()
      .from("messages")
      .insert({
        id,
        hub_id: hubId,
        sender_id: currentProfile.id,
        content,
      });

    if (error) {
      // Remove optimistic on error
      setMessages((prev) => prev.filter((m) => m.id !== id));
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.error("Failed to send message");
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
