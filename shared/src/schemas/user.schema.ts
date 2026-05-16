import { z } from "zod";

const userRoles = ["super_admin", "admin", "pengurus", "bendahara", "pengawas"] as const;

export const createUserSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  nama: z.string().min(3, "Nama minimal 3 karakter"),
  role: z.enum(userRoles, { message: "Role tidak valid" }),
});

export const updateUserSchema = z.object({
  email: z.string().email("Email tidak valid").optional(),
  nama: z.string().min(3, "Nama minimal 3 karakter").optional(),
  role: z.enum(userRoles, { message: "Role tidak valid" }).optional(),
  aktif: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  passwordLama: z.string().min(6, "Password lama minimal 6 karakter"),
  passwordBaru: z.string().min(6, "Password baru minimal 6 karakter"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
