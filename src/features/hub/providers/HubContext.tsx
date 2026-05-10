"use client";

import { createContext, useContext } from "react";
import type { Hub, HubMember } from "../lib/types";
import type { Profile } from "@/shared/lib/types";

interface HubContextValue {
  hub: Hub;
  currentMember: HubMember;
  currentProfile: Profile;
}

const HubContext = createContext<HubContextValue | null>(null);

export function HubProvider({
  hub,
  currentMember,
  currentProfile,
  children,
}: HubContextValue & { children: React.ReactNode }) {
  return (
    <HubContext.Provider value={{ hub, currentMember, currentProfile }}>
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
