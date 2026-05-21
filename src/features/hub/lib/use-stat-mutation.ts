"use client";

import { useCallback } from "react";
import { getSupabase } from "@/shared/lib/supabase";
import { mutate } from "@/shared/lib/mutate";

type StatColumn = "goals" | "assists" | "clean_sheets";

interface StatLogEntry {
  id: string;
  member_id: string;
  stat_type: string;
  delta: number;
}

/**
 * Owns every Stat mutation in a Hub: increment, decrement, and revert.
 *
 * Callers supply an `onOptimistic` callback for immediate UI feedback
 * and an `onRevert` callback when the mutation fails. This keeps the
 * hook decoupled from any particular state shape — the component
 * decides how optimism looks; this module decides what to call and when
 * to roll back.
 */
export function useStatMutation(hubId: string) {
  const changeStat = useCallback(
    async (
      memberId: string,
      stat: StatColumn,
      delta: 1 | -1,
      { onOptimistic, onRevert, onSuccess }: {
        onOptimistic?: () => void;
        onRevert?: () => void;
        onSuccess?: () => void;
      } = {},
    ) => {
      onOptimistic?.();

      const rpcName = delta > 0 ? "increment_hub_stat" : "decrement_hub_stat";
      const { error } = await mutate({
        fn: () =>
          getSupabase().rpc(rpcName, {
            p_member_id: memberId,
            p_stat_column: stat,
            p_hub_id: hubId,
          }),
        context: `StatMutation: ${rpcName}`,
        extra: { stat, memberId, hubId },
      });

      if (error) {
        onRevert?.();
      } else {
        onSuccess?.();
      }
    },
    [hubId],
  );

  const revertStatLog = useCallback(
    async (log: StatLogEntry) => {
      const reverseRpc =
        log.delta > 0 ? "decrement_hub_stat" : "increment_hub_stat";

      const { error: rpcError } = await mutate({
        fn: () =>
          getSupabase().rpc(reverseRpc, {
            p_member_id: log.member_id,
            p_stat_column: log.stat_type,
            p_hub_id: hubId,
          }),
        context: "StatMutation: revert RPC",
        extra: { logId: log.id, statType: log.stat_type },
        errorMessage: "Failed to revert stat",
      });
      if (rpcError) return;

      await mutate({
        fn: () =>
          getSupabase().from("stat_logs").delete().eq("id", log.id),
        context: "StatMutation: delete stat log",
        extra: { logId: log.id },
        errorMessage: "Stat reverted but log entry couldn't be removed",
      });
    },
    [hubId],
  );

  return { changeStat, revertStatLog };
}
