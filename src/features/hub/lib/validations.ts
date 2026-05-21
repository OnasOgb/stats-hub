import { z } from "zod";

export const createHubSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(30),
});

export type CreateHubValues = z.infer<typeof createHubSchema>;

const SAFE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function generateInviteCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += SAFE_ALPHABET[Math.floor(Math.random() * SAFE_ALPHABET.length)];
  }
  return code;
}

export const messageSchema = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(500, "Message too long (max 500 characters)"),
});

export type MessageValues = z.infer<typeof messageSchema>;
