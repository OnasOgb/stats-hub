"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabase } from "@/shared/lib/supabase";
import type { Database } from "@/shared/lib/database.types";

type TableName = keyof Database["public"]["Tables"] & string;

interface UseRealtimeListOptions<T> {
  hubId: string;
  table: TableName;
  select: string;
  initialData: T[];
  order?: "append" | "prepend";
  events?: Array<"INSERT" | "UPDATE" | "DELETE">;
}

interface UseRealtimeListReturn<T> {
  items: T[];
  pendingIds: Set<string>;
  addOptimistic: (item: T) => void;
  revertOptimistic: (id: string) => void;
}

/**
 * Reactive list that stays in sync with a hub-scoped Supabase table via
 * realtime postgres_changes. Hides channel lifecycle, re-fetch on INSERT,
 * de-duplication, UPDATE merging, DELETE filtering, and cleanup.
 *
 * Also supports optimistic inserts: call addOptimistic(item) to append an
 * item immediately, and the hook will confirm it (remove from pendingIds)
 * when the matching realtime INSERT arrives. Call revertOptimistic(id) to
 * remove an optimistic item that failed to persist.
 */
export function useRealtimeList<T extends { id: string }>({
  hubId,
  table,
  select,
  initialData,
  order = "append",
  events = ["INSERT", "UPDATE", "DELETE"],
}: UseRealtimeListOptions<T>): UseRealtimeListReturn<T> {
  const [items, setItems] = useState<T[]>(initialData);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const optimisticIdsRef = useRef(new Set<string>());
  const eventsKey = events.join(",");

  const addOptimistic = (item: T) => {
    optimisticIdsRef.current.add(item.id);
    setItems((prev) => [...prev, item]);
    setPendingIds((prev) => new Set(prev).add(item.id));
  };

  const revertOptimistic = (id: string) => {
    optimisticIdsRef.current.delete(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
    setPendingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  useEffect(() => {
    const supabase = getSupabase();
    let channel = supabase.channel(`hub-${hubId}-${table}`);

    if (events.includes("INSERT")) {
      channel = channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table,
          filter: `hub_id=eq.${hubId}`,
        },
        async (payload) => {
          const newId = (payload.new as { id: string }).id;

          // If this INSERT confirms an optimistic item, just clear pending
          if (optimisticIdsRef.current.has(newId)) {
            optimisticIdsRef.current.delete(newId);
            setPendingIds((prev) => {
              const next = new Set(prev);
              next.delete(newId);
              return next;
            });
            return;
          }

          const { data } = await supabase
            .from(table as any)
            .select(select)
            .eq("id", newId)
            .single();

          if (data) {
            const row = data as unknown as T;
            setItems((prev) => {
              if (prev.some((item) => item.id === row.id)) return prev;
              return order === "prepend"
                ? [row, ...prev]
                : [...prev, row];
            });
          }
        }
      );
    }

    if (events.includes("UPDATE")) {
      channel = channel.on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table,
          filter: `hub_id=eq.${hubId}`,
        },
        (payload) => {
          setItems((prev) =>
            prev.map((item) =>
              item.id === (payload.new as { id: string }).id
                ? ({ ...item, ...payload.new } as T)
                : item
            )
          );
        }
      );
    }

    if (events.includes("DELETE")) {
      channel = channel.on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table,
          filter: `hub_id=eq.${hubId}`,
        },
        (payload) => {
          setItems((prev) =>
            prev.filter(
              (item) => item.id !== (payload.old as { id: string }).id
            )
          );
        }
      );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eventsKey is a stable string derived from events — safe to use as dep
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hubId, table, select, order, eventsKey]);

  return { items, pendingIds, addOptimistic, revertOptimistic };
}
