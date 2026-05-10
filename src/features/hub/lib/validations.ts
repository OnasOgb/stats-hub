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
