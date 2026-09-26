// ─── API Response Envelope ────────────────────────────────────────────────────

export interface ApiResponse<T = any> {
  status: "success" | "error";
  message: string;
  data?: T;
  error?: string;
}

export interface ApiErrorResponse {
  status: "error";
  message: string;
}

export interface PaginationMeta {
  limit: number;
  has_next: boolean;
  next_cursor?: string;
  count?: number;
}

// ─── Auth & Users ─────────────────────────────────────────────────────────────

export type UserRole = "reader" | "author" | "admin";

export interface PublicUser {
  id: string;              // 24-character hex MongoDB ObjectID
  full_name: string;       // Concatenated firstName + lastName
  email: string;           // E-mail address
  role: UserRole;
  bio?: string;            // User biography
  avatar_url?: string;     // URL to avatar image
  created_at: string;      // ISO 8601 UTC timestamp
  updated_at: string;      // ISO 8601 UTC timestamp
}

// AuthUser maintains backward-compatibility while exposing full PublicUser fields
export interface AuthUser extends Partial<PublicUser> {
  id: string;
  email: string;
  full_name?: string;
  username?: string;       // Alias for display compatibility
  role: UserRole;
  bio?: string;
  avatar_url?: string;
  picture?: string;        // Alias for display compatibility
  created_at?: string;
  updated_at?: string;
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
  pagination?: PaginationMeta;
  next_cursor?: string;
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export interface Comment {
  id: string;
  post_id: string;
  author_id?: string;
  author_name?: string;
  user_id?: string;
  user_name?: string;
  parent_id?: string;
  content: string;
  created_at: string;
  updated_at: string;
  replies?: Comment[];
}

// ─── Likes ────────────────────────────────────────────────────────────────────

export interface LikeStatus {
  liked: boolean;
  likes_count: number;
}

// ─── Media Upload ─────────────────────────────────────────────────────────────

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mime_type: string;
}

// ─── Author Requests ──────────────────────────────────────────────────────────

export type AuthorRequestStatus = "pending" | "approved" | "rejected";

export interface AuthorRequest {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  username?: string;
  bio: string;
  sample_links?: string[];
  sample_work?: string;
  motivation?: string;
  reason?: string;
  status: AuthorRequestStatus;
  reviewed_by?: string;
  review_notes?: string;
  admin_note?: string;
  created_at: string;
  updated_at?: string;
}
