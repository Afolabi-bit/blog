# Frontend Integration & Architecture Guide

A comprehensive guide for frontend developers building client applications (Web, Mobile, SPA) for **blog-api**.

---

## 1. System Overview & Endpoints

| Environment             | Base URL                            | Swagger OpenAPI Docs                                   |
| :---------------------- | :---------------------------------- | :----------------------------------------------------- |
| **Local Development**   | `http://localhost:5000`             | `http://localhost:5000/swagger/index.html`             |
| **Production (Render)** | `https://go-blog-k1kn.onrender.com` | `https://go-blog-k1kn.onrender.com/swagger/index.html` |

All response payloads follow a unified JSON envelope:

```typescript
// Standard API Envelope
export interface ApiResponse<T> {
  status: "success" | "error";
  message: string;
  data?: T;
  error?: string;
}
```

---

## 2. Authentication & Role-Based Access Control (RBAC)

### 2.1 User Roles

- **`reader`** (Default): Can browse published posts, like posts, submit comments, and apply to become an author.
- **`author`**: Everything a reader can do + create, edit, delete their own posts, upload cover images, and moderate comments on their articles.
- **`admin`**: Full system access + review author applications, edit/delete any post or comment.

---

### 2.2 Token Lifecycle & Silent Refresh

1. On login or registration, the backend returns:
   - `token` (Short-lived JWT Access Token: **15 minutes**)
   - `refresh_token` (Long-lived Opaque Refresh Token: **7 days**)
2. Store the `token` in memory (or secure cookie/localStorage).
3. Store the `refresh_token` in secure storage (e.g. `httpOnly` cookie or secure storage).
4. When an API call returns `401 Unauthorized`, trigger silent refresh via `POST /auth/refresh`.

#### Production Axios Interceptor Example:

```typescript
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
});

// Attach JWT access token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Automatic token refresh on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { token, refresh_token: newRefreshToken } = res.data.data;
        localStorage.setItem("access_token", token);
        localStorage.setItem("refresh_token", newRefreshToken);

        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        failedQueue.forEach((prom) => prom.resolve(token));
        failedQueue = [];

        return api(originalRequest);
      } catch (refreshErr) {
        failedQueue.forEach((prom) => prom.reject(refreshErr));
        failedQueue = [];
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
```

---

## 3. Page-by-Page Integration Specifications

### Page 1: Home / Feed (`/`)

- **Endpoint**: `GET /api/posts`
- **Query Parameters**:
  - `limit`: Number of items (default: `10`, max: `50`)
  - `cursor`: Cursor for the next page (ID of the last post in current batch)
  - `tag`: Filter by tag (e.g. `?tag=golang`)
  - `search`: Full-text search term (e.g. `?search=architecture`)
- **Pagination Pattern**: Cursor-based.
  - If returned array length == `limit`, pass the `id` of the last post as `cursor` in the next request.
  - If returned array length < `limit`, the user has reached the end of the feed.

```typescript
export interface Post {
  id: string;
  author_id: string;
  author_name: string;
  title: string;
  slug: string;
  content: string;
  cover_image?: string;
  status: "draft" | "published";
  tags: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}
```

---

### Page 2: Article Detail View (`/posts/[slug]`)

- **Endpoint**: `GET /api/posts/slug/:slug` (SEO-friendly route using slug)
- **Fallback Endpoint**: `GET /api/posts/:id`
- **Interactions on this page**:
  1. **Like / Unlike Toggle**:
     - Check current user status: `GET /api/likes/posts/:id/status` (requires Auth)
     - Toggle reaction: `POST /api/likes/posts/:id/toggle` (requires Auth)
     - _Optimistic UI_: Increment or decrement `post.likes_count` immediately upon click.
  2. **Comments & Replies**:
     - Fetch top-level comments and replies: `GET /api/comments/posts/:id`
     - Post a new comment: `POST /api/comments/posts/:id` with `{ "content": "..." }`
     - Post a nested reply: `POST /api/comments/posts/:id` with `{ "content": "...", "parent_id": "<comment_id>" }`
     - Delete comment: `DELETE /api/comments/:id` (Allowed for comment author, article author, or admin).

```typescript
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
```

---

### Page 3: Author Studio & Post Editor (`/editor` or `/editor/[id]`)

- **Protected Route Guard**: `user.role === 'author' || user.role === 'admin'`.
- **Cover Image Upload**:
  1. User selects a local image (`<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" />`).
  2. Frontend sends `POST /api/media/upload` with FormData (`file`).
  3. API saves to Cloudflare R2 and returns:
     ```json
     {
       "data": {
         "url": "https://pub-0e976d31bf7d402095617537d3b4dd09.r2.dev/1727271043-abc.png"
       }
     }
     ```
  4. Store the returned `url` in the editor state.
- **Creating a Post**:
  - `POST /api/posts`
  - Body:
    ```json
    {
      "title": "Scaling Distributed Systems",
      "content": "Full markdown body text...",
      "cover_image": "https://pub-...r2.dev/1727271043-abc.png",
      "status": "published", // or "draft"
      "tags": ["golang", "devops"]
    }
    ```
- **Updating a Post**:
  - `PATCH /api/posts/:id` with updated fields.
- **Author Dashboard**:
  - `GET /api/posts/author/me` (lists all posts created by the logged-in author, including drafts).

---

### Page 4: "Become an Author" Application (`/settings/author-request`)

- **Audience**: Users with `reader` role.
- **Workflow**:
  1. On page load, call `GET /user/author-request` to check existing status:
     - `404 Not Found` $\to$ Show application submission form.
     - `status === "pending"` $\to$ Show "Your application is under review" badge.
     - `status === "approved"` $\to$ Role is now `author`; show link to Editor.
     - `status === "rejected"` $\to$ Show rejection notice and admin feedback note.
  2. Submitting application:
     - `POST /user/author-request`
     - Body:
       ```json
       {
         "bio": "Software engineer with 5 years experience in Go and distributed systems.",
         "sample_work": "https://github.com/my-profile or https://medium.com/@me",
         "reason": "I want to publish in-depth architectural tutorials."
       }
       ```

---

### Page 5: Admin Management Panel (`/admin`)

- **Protected Route Guard**: `user.role === 'admin'`.
- **Author Request Review Queue**:
  - List applications: `GET /api/admin/author-requests?status=pending`
  - Review an application: `PATCH /api/admin/author-requests/:id/review`
    ```json
    {
      "status": "approved", // or "rejected"
      "admin_note": "Great portfolio, welcome to the author team!"
    }
    ```
    _Note: When approved, the backend atomically promotes the user's role from `reader` to `author`._
- **All Posts Management**:
  - `GET /api/admin/posts` (view all published and draft posts across all authors).

---

### Page 6: User Profile & Security Settings (`/settings`)

- **Update Profile Details**:
  - `PATCH /user/profile` with `{ "username": "new_name", "bio": "updated bio" }`.
- **Change Password**:
  - `PATCH /user/change-password` with `{ "old_password": "...", "new_password": "..." }`.
  - _Note: On successful password change, all active refresh sessions are revoked for security._
- **Sign Out**:
  - `POST /auth/logout` with `{ "refresh_token": "..." }`.
  - Clear `access_token` and `refresh_token` from client storage and redirect to `/login`.

---

## 4. Recommended Frontend Architecture (Next.js / React)

```text
src/
├── api/
│   ├── client.ts             # Configured Axios instance with refresh interceptor
│   ├── auth.ts               # Login, register, refresh, logout, profile
│   ├── posts.ts              # Fetch feed, slug detail, create, edit, delete
│   ├── comments.ts           # List, post, reply, delete
│   ├── likes.ts              # Status, toggle
│   └── media.ts              # Multipart image upload to R2
├── components/
│   ├── common/
│   │   ├── Navbar.tsx        # Responsive nav, role badge, user menu
│   │   ├── PostCard.tsx      # Cover image, title, author, likes count, tags
│   │   └── ProtectedRoute.tsx# Role-based route guard wrapper
│   ├── editor/
│   │   ├── MarkdownEditor.tsx# Split editor + live preview
│   │   └── CoverPicker.tsx   # Drag-and-drop file upload to Cloudflare R2
│   └── post/
│       ├── CommentSection.tsx# Recursive reply thread
│       └── LikeButton.tsx    # Optimistic like button
├── hooks/
│   ├── useAuth.ts            # Current user session and role helpers
│   ├── usePosts.ts           # TanStack infinite query for feed pagination
│   └── useLikes.ts           # Optimistic like mutation
└── pages/ or app/
    ├── page.tsx              # Home / Feed
    ├── posts/[slug]/page.tsx # Article detail & comments
    ├── editor/page.tsx       # Create new post
    ├── editor/[id]/page.tsx  # Edit existing post
    ├── settings/page.tsx     # Profile & Author application
    └── admin/page.tsx        # Author request moderation queue
```

---

## 5. Quick Healthcheck Test for Frontend

To verify backend connectivity before launching the frontend:

```bash
curl -X GET http://localhost:5000/health
```

Expected Response (`200 OK`):

```json
{
  "status": "healthy",
  "database": "connected",
  "uptime": "2h15m",
  "timestamp": "2026-09-25T15:30:00Z"
}
```
