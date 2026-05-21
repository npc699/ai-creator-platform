import { z } from "zod";

import { isValidAuthEmail, normalizePhone } from "./validators";

export const authEmailSchema = z
  .string()
  .trim()
  .transform((email) => email.toLowerCase())
  .refine(isValidAuthEmail, "请输入有效邮箱");

export const authPhoneSchema = z
  .string()
  .trim()
  .transform(normalizePhone)
  .refine((phone) => /^1[3-9]\d{9}$/.test(phone), "请输入有效手机号");

const optionalEmailSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  authEmailSchema.optional()
);

const optionalPhoneSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  authPhoneSchema.optional()
);

// 登录：邮箱或手机号 + 密码。
export const credentialsSchema = z.object({
  identifier: z.string().trim().min(1, "请输入邮箱或手机号"),
  password: z.string().min(6, "密码至少需要 6 位"),
});

// 注册：邮箱与手机号至少填一项，可同时填写。
export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "请输入用户名")
      .max(20, "用户名不能超过 20 个字符"),
    email: optionalEmailSchema,
    phone: optionalPhoneSchema,
    password: z
      .string()
      .min(6, "密码至少需要 6 位")
      .max(32, "密码不能超过 32 位"),
  })
  .superRefine((data, context) => {
    if (!data.email && !data.phone) {
      context.addIssue({
        code: "custom",
        message: "请至少填写邮箱或手机号",
        path: ["email"],
      });
    }
  });
