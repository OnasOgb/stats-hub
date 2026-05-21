"use client";

import { createContext, useContext, useMemo } from "react";
import type { Hub, HubMember } from "../lib/types";
import type { Profile } from "@/shared/lib/types";

interface HubContextValue {
  hub: Hub;
  currentMember: HubMember;
  currentProfile: Profile;
  /** Whether the current Hub Member has the Admin role. */
  isAdmin: boolean;
  /** Admins can increment/decrement Stats for any Hub Member. */
  canMutateStats: boolean;
  /** Only an Admin can delete a Hub. */
  canDeleteHub: boolean;
}

const HubContext = createContext<HubContextValue | null>(null);

export function HubProvider({
  hub,
  currentMember,
  currentProfile,
  children,
}: { hub: Hub; currentMember: HubMember; currentProfile: Profile; children: React.ReactNode }) {
  const value = useMemo<HubContextValue>(() => {
    const isAdmin = currentMember.role === "admin";
    return {
      hub,
      currentMember,
      currentProfile,
      isAdmin,
      canMutateStats: isAdmin,
      canDeleteHub: isAdmin,
    };
  }, [hub, currentMember, currentProfile]);

  return (
    <HubContext.Provider value={value}>
      {children}
    </HubContext.Provider>
  );
}

export function useHub() {
  const context = useContext(HubContext);
  if (!context) {
    throw new Error("useHub must be used within a HubProvider");
  }
  return context;
}
