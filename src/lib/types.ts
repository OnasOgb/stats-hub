import type { Database } from "./database.types";

// Legacy types (kept temporarily for migration)
export type Player = Database["public"]["Tables"]["players"]["Row"];
export type PlayerInsert = Database["public"]["Tables"]["players"]["Insert"];

// New multi-tenant types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Hub = Database["public"]["Tables"]["hubs"]["Row"];
export type HubMember = Database["public"]["Tables"]["hub_members"]["Row"];
export type HubMemberInsert = Database["public"]["Tables"]["hub_members"]["Insert"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"];
export type StatLog = Database["public"]["Tables"]["stat_logs"]["Row"];

// Enriched types (with joined profile data)
export type HubMemberWithProfile = HubMember & {
  profiles: Profile;
};

export type MessageWithSender = Message & {
  profiles: Profile;
};

export type StatLogWithDetails = StatLog & {
  profiles: Profile;
  hub_members: HubMember & {
    profiles: Profile;
  };
};
