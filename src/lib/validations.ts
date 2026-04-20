import { z } from "zod";

export const joinFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

export type JoinFormValues = z.infer<typeof joinFormSchema>;
