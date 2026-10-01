import { z } from "zod";

export const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(3, "First name must be at least 3 characters")
    .max(50, "First name must be at most 50 characters"),
  last_name: z
    .string()
    .trim()
    .min(3, "Last name must be at least 3 characters")
    .max(50, "Last name must be at most 50 characters"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be at most 100 characters"),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const CreatePostSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title cannot exceed 200 characters"),
  content: z
    .string()
    .min(20, "Content must be at least 20 characters"),
  cover_image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  status: z.enum(["draft", "published"]).default("draft"),
  tags: z.array(z.string().trim().max(30)).max(10).default([]),
});

export type CreatePostInput = z.infer<typeof CreatePostSchema>;

export const UpdateProfileSchema = z.object({
  first_name: z.string().trim().min(2).max(50).optional(),
  last_name: z.string().trim().min(2).max(50).optional(),
  bio: z.string().max(500, "Bio cannot exceed 500 characters").optional(),
  avatar_url: z.string().url("Must be a valid image URL").optional().or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export const ChangePasswordSchema = z
  .object({
    old_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(8, "Minimum 8 characters"),
    confirm_password: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

export const AuthorRequestSchema = z.object({
  bio: z
    .string()
    .trim()
    .min(10, "Bio must be at least 10 characters")
    .max(1000, "Bio cannot exceed 1000 characters"),
  sample_links: z.array(z.string().url("Must be a valid URL")).default([]),
  motivation: z
    .string()
    .trim()
    .min(10, "Motivation must be at least 10 characters")
    .max(2000, "Motivation cannot exceed 2000 characters"),
});

export type AuthorRequestInput = z.infer<typeof AuthorRequestSchema>;

export const CommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment cannot exceed 2000 characters"),
  parent_id: z.string().optional(),
});

export type CommentInput = z.infer<typeof CommentSchema>;
