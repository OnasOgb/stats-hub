import type { Database } from "@/shared/lib/database.types";
import type { Profile } from "@/shared/lib/types";

export type Hub = Database["public"]["Tables"]["hubs"]["Row"];
export type HubMember = Database["public"]["Tables"]["hub_members"]["Row"];
export type HubMemberInsert = Database["public"]["Tables"]["hub_members"]["Insert"];
export type StatLog = Database["public"]["Tables"]["stat_logs"]["Row"];

export type HubMemberWithProfile = HubMember & { profiles: Profile };
export type StatLogWithDetails = StatLog & {
  profiles: Profile;
  hub_members: HubMember & { profiles: Profile };
};
