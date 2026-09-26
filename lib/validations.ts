import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password required"),
});

export const RegisterSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(30),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const CreatePostSchema = z.object({
  title: z.string().min(5, "Title too short").max(200),
  content: z.string().min(20, "Content too short"),
  cover_image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  status: z.enum(["draft", "published"]).default("draft"),
  tags: z.array(z.string().max(30)).max(10).default([]),
});

export const UpdateProfileSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  bio: z.string().max(500).optional(),
});

export const ChangePasswordSchema = z.object({
  old_password: z.string().min(1),
  new_password: z.string().min(8, "New password must be at least 8 characters"),
});

export const AuthorRequestSchema = z.object({
  bio: z.string().min(20, "Please provide a meaningful bio").max(1000),
  sample_work: z.string().url("Must be a valid URL"),
  reason: z.string().min(20, "Please explain your motivation").max(1000),
});
