import { z } from "zod";

export const joinFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

export type JoinFormValues = z.infer<typeof joinFormSchema>;

export const createHubSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(30),
  invite_code: z
    .string()
    .min(3, "Code must be at least 3 characters")
    .max(50)
    .regex(
      /^[a-z0-9-]+$/,
      "Only lowercase letters, numbers, and hyphens allowed"
    ),
});

export type CreateHubValues = z.infer<typeof createHubSchema>;

export const messageSchema = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(500, "Message too long (max 500 characters)"),
});

export type MessageValues = z.infer<typeof messageSchema>;

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
