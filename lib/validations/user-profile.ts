import { z } from "zod";

export const userProfileUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .max(50, "昵称不能超过 50 字")
    .optional()
    .transform((value) => (value === "" ? null : value)),
  bio: z
    .string()
    .trim()
    .max(500, "简介不能超过 500 字")
    .optional()
    .transform((value) => (value === "" ? null : value)),
});

export type UserProfileUpdateInput = z.infer<typeof userProfileUpdateSchema>;
