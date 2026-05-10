import { z } from "zod";

export const profileFormSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be 50 characters or less")
    .transform((s) => s.trim()),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
