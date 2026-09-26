// ─── API Response Envelope ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  status: "success" | "error";
  message: string;
  data?: T;
  error?: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export type UserRole = "reader" | "author" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  bio?: string;
  picture?: string;
}

export interface AuthTokens {
  token: string;
  refresh_token: string;
}

export interface AuthResponse extends AuthTokens {
  user: AuthUser;
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export type PostStatus = "draft" | "published";

export interface Post {
  id: string;
  author_id: string;
  author_name: string;
  title: string;
  slug: string;
  content: string;
  cover_image?: string;
  status: PostStatus;
  tags: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

export interface PostsResponse {
  posts: Post[];
  next_cursor?: string;
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  user_name: string;
  parent_id?: string;
  content: string;
  created_at: string;
  updated_at: string;
  replies?: Comment[];
}

// ─── Likes ────────────────────────────────────────────────────────────────────

export interface LikeStatus {
  liked: boolean;
}

// ─── Author Requests ──────────────────────────────────────────────────────────

export type AuthorRequestStatus = "pending" | "approved" | "rejected";

export interface AuthorRequest {
  id: string;
  user_id: string;
  username: string;
  bio: string;
  sample_work: string;
  reason: string;
  status: AuthorRequestStatus;
  admin_note?: string;
  created_at: string;
}
