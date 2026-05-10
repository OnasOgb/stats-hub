import type { Database } from "@/shared/lib/database.types";
import type { Profile } from "@/shared/lib/types";

export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"];
export type MessageWithSender = Message & { profiles: Profile };
