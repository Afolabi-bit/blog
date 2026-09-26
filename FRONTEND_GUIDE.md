# Frontend Integration & Architecture Guide

A comprehensive, developer-ready specification for building client applications (Next.js, React SPA, Mobile, Svelte, Vue) consuming **blog-api**.

---

## 1. System Overview & Quick Endpoint Reference

| Environment | Base URL | Swagger OpenAPI UI | Swagger JSON Spec |
| :--- | :--- | :--- | :--- |
| **Local Development** | `http://localhost:5000` | [http://localhost:5000/swagger/index.html](http://localhost:5000/swagger/index.html) | [http://localhost:5000/swagger/doc.json](http://localhost:5000/swagger/doc.json) |
| **Production (Render)** | `https://your-service.onrender.com` | `https://your-service.onrender.com/swagger/index.html` | `https://your-service.onrender.com/swagger/doc.json` |

### 1.1 API Response Envelopes

Every endpoint under `/auth`, `/user`, and `/api` produces a unified JSON envelope:

#### Success Response Envelope (`2xx`)
```typescript
export interface ApiResponse<T = any> {
  status: "success";
  message: string;
  data?: T;
}
```

#### Error Response Envelope (`4xx` / `5xx`)
```typescript
export interface ApiErrorResponse {
  status: "error";
  message: string;
}
```

#### Paginated Data Envelope
```typescript
export interface PaginationMeta {
  limit: number;
  has_next: boolean;
  next_cursor?: string;
  count?: number;
}

export interface PaginatedResult<K extends string, T> {
  [key in K]: T[];
} & {
  pagination: PaginationMeta;
}
```

---

### 1.2 Quick Endpoint Directory

| Method | Endpoint | Auth | Allowed Roles | Description | Anchor Link |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | None | Public | Healthcheck and DB status | [Details](#endpoint-get-health) |
| `POST` | `/auth/register` | None | Public | Register new user account | [Details](#endpoint-post-auth-register) |
| `POST` | `/auth/login` | None | Public | Authenticate with credentials | [Details](#endpoint-post-auth-login) |
| `POST` | `/auth/refresh` | None | Public | Exchange refresh token | [Details](#endpoint-post-auth-refresh) |
| `POST` | `/auth/logout` | Bearer | Any authenticated user | Revoke refresh tokens and sign out | [Details](#endpoint-post-auth-logout) |
| `GET` | `/user/iam` | Bearer | Any authenticated user | Fetch current user profile | [Details](#endpoint-get-user-iam) |
| `PATCH` | `/user/profile` | Bearer | Any authenticated user | Update user profile fields | [Details](#endpoint-patch-user-profile) |
| `PATCH` | `/user/change-password` | Bearer | Any authenticated user | Change password & revoke sessions | [Details](#endpoint-patch-user-change-password) |
| `POST` | `/user/author-request` | Bearer | `reader` | Submit author promotion application | [Details](#endpoint-post-user-author-request) |
| `GET` | `/user/author-request` | Bearer | Any authenticated user | Get current user's author request | [Details](#endpoint-get-user-author-request) |
| `GET` | `/api/posts` | Optional | Public / Authenticated | List published posts with cursor pagination | [Details](#endpoint-get-api-posts) |
| `GET` | `/api/posts/slug/:slug` | Optional | Public (Drafts: Author/Admin) | Get post by unique slug | [Details](#endpoint-get-api-posts-slug-slug) |
| `GET` | `/api/posts/:id` | Optional | Public (Drafts: Author/Admin) | Get post by MongoDB ID | [Details](#endpoint-get-api-posts-id) |
| `GET` | `/api/posts/:id/comments` | Optional | Public / Authenticated | List paginated comments for post | [Details](#endpoint-get-api-posts-id-comments) |
| `GET` | `/api/posts/:id/like` | Optional | Public / Authenticated | Get post like count & liked status | [Details](#endpoint-get-api-posts-id-like) |
| `POST` | `/api/posts/:id/comments` | Bearer | Any authenticated user | Create top-level or reply comment | [Details](#endpoint-post-api-posts-id-comments) |
| `DELETE` | `/api/comments/:id` | Bearer | Comment Author, Post Author, Admin | Delete comment | [Details](#endpoint-delete-api-comments-id) |
| `POST` | `/api/posts/:id/like` | Bearer | Any authenticated user | Toggle like/unlike on post | [Details](#endpoint-post-api-posts-id-like) |
| `POST` | `/api/posts` | Bearer | `author`, `admin` | Create new post (draft/published) | [Details](#endpoint-post-api-posts) |
| `GET` | `/api/my-posts` | Bearer | `author`, `admin` | Author post dashboard (drafts & published) | [Details](#endpoint-get-api-my-posts) |
| `PATCH` | `/api/posts/:id` | Bearer | Post Author, `admin` | Update post fields | [Details](#endpoint-patch-api-posts-id) |
| `DELETE` | `/api/posts/:id` | Bearer | Post Author, `admin` | Delete post | [Details](#endpoint-delete-api-posts-id) |
| `POST` | `/api/media/upload` | Bearer | `author`, `admin` | Upload image (R2/local, max 5MB) | [Details](#endpoint-post-api-media-upload) |
| `GET` | `/api/admin/posts` | Bearer | `admin` | Moderation list of all posts | [Details](#endpoint-get-api-admin-posts) |
| `DELETE` | `/api/admin/posts/:id` | Bearer | `admin` | Admin delete any post | [Details](#endpoint-delete-api-admin-posts-id) |
| `GET` | `/api/admin/author-requests` | Bearer | `admin` | List author applications | [Details](#endpoint-get-api-admin-author-requests) |
| `PATCH` | `/api/admin/author-requests/:id/review` | Bearer | `admin` | Approve or reject application | [Details](#endpoint-patch-api-admin-author-requests-id-review) |

---

## 2. Authentication, RBAC & Token Lifecycle

### 2.1 User Roles & Permissions
* **`reader`** (Default): Can view published posts, like posts, submit comments, and apply for author status via `/user/author-request`.
* **`author`**: All reader privileges + create, edit, and delete their own posts, upload media assets, and moderate comments on their articles.
* **`admin`**: System-wide administrative privileges + review author applications, moderate any post, and delete any comment.

### 2.2 Token Lifecycle & Silent Refresh
1. On **login** or **registration**, the backend returns:
   - `token`: Short-lived JWT Access Token (**15 minutes** validity) containing claims `{ sub: string, role: string }`.
   - `refresh_token`: Opaque cryptographic token (**7 days** validity) stored in the database.
2. In client applications:
   - Attach the access token in HTTP headers: `Authorization: Bearer <token>`.
   - Store `token` in memory (or secure cookie). Store `refresh_token` in secure storage (or `httpOnly` cookie).
   - When an API request returns `401 Unauthorized`, trigger silent refresh via `POST /auth/refresh`.

#### Production Axios Interceptor with Concurrent Queue:
```typescript
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Do not refresh if login or refresh itself failed
      if (originalRequest.url?.includes("/auth/login") || originalRequest.url?.includes("/auth/refresh")) {
        return Promise.reject(error);
      }

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
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { token, refresh_token: newRefreshToken } = res.data.data;
        localStorage.setItem("access_token", token);
        localStorage.setItem("refresh_token", newRefreshToken);

        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        processQueue(null, token);

        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
```

---

## 3. TypeScript Domain Models

```typescript
// User
export interface PublicUser {
  id: string;              // 24-character hex MongoDB ObjectID
  full_name: string;       // Concatenated firstName + lastName
  email: string;           // E-mail address
  role: "reader" | "author" | "admin";
  bio?: string;            // User biography
  avatar_url?: string;     // URL to avatar image
  created_at: string;      // ISO 8601 UTC timestamp
  updated_at: string;      // ISO 8601 UTC timestamp
}

export interface AuthResponse {
  token: string;           // JWT Bearer access token (15 mins)
  refresh_token?: string;  // Opaque refresh token (7 days)
  user: PublicUser;
}

// Blog Post
export interface Post {
  id: string;              // 24-character hex MongoDB ObjectID
  author_id: string;       // Author user ObjectID
  author_name: string;     // Display name of author
  title: string;           // Post title
  slug: string;            // Unique URL slug
  content: string;         // Full markdown or HTML content
  cover_image?: string;    // Image URL from R2 or uploads
  status: "draft" | "published";
  tags: string[];          // Array of topic tags
  likes_count: number;     // Aggregated total likes
  comments_count: number;  // Aggregated total comments
  created_at: string;      // ISO 8601 UTC timestamp
  updated_at: string;      // ISO 8601 UTC timestamp
}

// Comment
export interface Comment {
  id: string;              // 24-character hex MongoDB ObjectID
  post_id: string;         // Target Post ObjectID
  author_id: string;       // Author user ObjectID
  author_name: string;     // Display name of commenter
  parent_id?: string;      // Present if this is a reply to another comment
  content: string;         // Comment text (1-2000 chars)
  created_at: string;      // ISO 8601 UTC timestamp
  updated_at: string;      // ISO 8601 UTC timestamp
}

// Like Status
export interface LikeStatus {
  liked: boolean;          // Whether requester has liked this post
  likes_count: number;     // Updated total likes count
}

// Media Upload
export interface UploadResponse {
  url: string;             // Absolute URL of uploaded file (Cloudflare R2 or /uploads)
  filename: string;        // Stored filename on storage
  size: number;            // Size in bytes
  mime_type: string;       // MIME type (image/png, image/jpeg, etc.)
}

// Author Application Request
export interface AuthorRequest {
  id: string;              // 24-character hex MongoDB ObjectID
  user_id: string;         // Applicant user ObjectID
  user_email: string;      // Applicant email
  user_name: string;       // Applicant display name
  bio: string;             // 10-1000 characters
  sample_links: string[];  // Portfolio URLs
  motivation: string;      // 10-2000 characters
  status: "pending" | "approved" | "rejected";
  reviewed_by?: string;    // Reviewer admin ObjectID (if processed)
  review_notes?: string;   // Feedback note from reviewer (if processed)
  created_at: string;      // ISO 8601 UTC timestamp
  updated_at: string;      // ISO 8601 UTC timestamp
}
```

---

## 4. Comprehensive Endpoint Specifications

### 4.1 System & Health

<a id="endpoint-get-health"></a>
#### `GET /health`
* **Access**: Public
* **Headers**: None
* **Request Payload**: None
* **Success Response (`200 OK`)**:
```json
{
  "ok": true,
  "service": "go-blog",
  "database": "connected",
  "time": "2026-09-26T16:19:36.123456Z"
}
```
* **Failure Response (`503 Service Unavailable`)**:
```json
{
  "ok": false,
  "service": "go-blog",
  "database": "disconnected",
  "error": "connection timed out",
  "time": "2026-09-26T16:19:36.123456Z"
}
```

---

### 4.2 Authentication Endpoints

<a id="endpoint-post-auth-register"></a>
#### `POST /auth/register`
* **Access**: Public
* **Headers**: `Content-Type: application/json`
* **Request Body**:
```json
{
  "email": "jane@example.com",     // string, required, valid email
  "password": "secretpassword",    // string, required, min 6 chars
  "firstName": "Jane",             // string, required, min 3 chars (note camelCase: firstName)
  "lastName": "Doe",               // string, required, min 3 chars (note camelCase: lastName)
  "role": "reader"                 // string, optional: "reader", "author", "admin" (defaults to "reader")
}
```
* **Success Response (`201 Created`)**:
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmY1MGJmOGQiLCJyb2xlIjoicmVhZGVyIiwiZXhwIjoxNzI3Mzc3NzgxfQ...",
    "refresh_token": "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90",
    "user": {
      "id": "66f50bf8d2e8b1c4e7a8f901",
      "full_name": "Jane Doe",
      "email": "jane@example.com",
      "role": "reader",
      "bio": "",
      "avatar_url": "",
      "created_at": "2026-09-26T16:00:00Z",
      "updated_at": "2026-09-26T16:00:00Z"
    }
  }
}
```
* **Error Responses**:
  * `400 Bad Request`:
    ```json
    { "status": "error", "message": "email already registered" }
    ```
    or
    ```json
    { "status": "error", "message": "invalid json payload" }
    ```

<a id="endpoint-post-auth-login"></a>
#### `POST /auth/login`
* **Access**: Public
* **Headers**: `Content-Type: application/json`
* **Request Body**:
```json
{
  "email": "jane@example.com",     // string, required, valid email
  "password": "secretpassword"     // string, required
}
```
* **Success Response (`200 OK`)**:
```json
{
  "status": "success",
  "message": "User logged in successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90",
    "user": {
      "id": "66f50bf8d2e8b1c4e7a8f901",
      "full_name": "Jane Doe",
      "email": "jane@example.com",
      "role": "reader",
      "bio": "Developer and writer",
      "avatar_url": "https://pub-r2.dev/avatar.jpg",
      "created_at": "2026-09-26T16:00:00Z",
      "updated_at": "2026-09-26T16:05:00Z"
    }
  }
}
```
* **Error Responses**:
  * `400 Bad Request`: `{ "status": "error", "message": "invalid json payload" }`
  * `401 Unauthorized`: `{ "status": "error", "message": "invalid email or password" }`

<a id="endpoint-post-auth-refresh"></a>
#### `POST /auth/refresh`
* **Access**: Public
* **Headers**: `Content-Type: application/json`
* **Request Body**:
```json
{
  "refresh_token": "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90"
}
```
* **Success Response (`200 OK`)**:
```json
{
  "status": "success",
  "message": "Token refreshed successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new_access_token...",
    "refresh_token": "f0e9d8c7b6a5041322100fedcba9876543210fedcba9876543210fedcba98765",
    "user": {
      "id": "66f50bf8d2e8b1c4e7a8f901",
      "full_name": "Jane Doe",
      "email": "jane@example.com",
      "role": "reader",
      "bio": "Developer and writer",
      "avatar_url": "https://pub-r2.dev/avatar.jpg",
      "created_at": "2026-09-26T16:00:00Z",
      "updated_at": "2026-09-26T16:05:00Z"
    }
  }
}
```
* **Error Responses**:
  * `400 Bad Request`: `{ "status": "error", "message": "invalid json payload" }`
  * `401 Unauthorized`: `{ "status": "error", "message": "invalid or expired refresh token" }`

<a id="endpoint-post-auth-logout"></a>
#### `POST /auth/logout`
* **Access**: Authenticated (`Bearer` Token required)
* **Headers**:
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`
* **Request Body** *(Optional)*:
```json
{
  "refresh_token": "a1b2c3d4e5f60718293a4b5c6d7e8f90..." // optional. If provided, revokes this specific session; if omitted, revokes all active sessions for the user.
}
```
* **Success Response (`200 OK`)**:
```json
{
  "status": "success",
  "message": "User logged out successfully"
}
```
* **Error Responses**:
  * `401 Unauthorized`: `{ "status": "error", "message": "missing authorization header" }` or `{ "status": "error", "message": "invalid or expired token" }`

---

### 4.3 User Profile & Settings

<a id="endpoint-get-user-iam"></a>
#### `GET /user/iam`
* **Access**: Authenticated (`Bearer` Token required)
* **Headers**: `Authorization: Bearer <access_token>`
* **Request Body**: None
* **Success Response (`200 OK`)**:
```json
{
  "status": "success",
  "message": "User profile fetched successfully",
  "data": {
    "id": "66f50bf8d2e8b1c4e7a8f901",
    "full_name": "Jane Doe",
    "email": "jane@example.com",
    "role": "reader",
    "bio": "Developer, cloud architect, open-source enthusiast.",
    "avatar_url": "https://pub-r2.dev/1727271043-avatar.png",
    "created_at": "2026-09-26T16:00:00Z",
    "updated_at": "2026-09-26T16:20:00Z"
  }
}
```
* **Error Responses**:
  * `401 Unauthorized`: `{ "status": "error", "message": "unauthorized" }`
  * `404 Not Found`: `{ "status": "error", "message": "user not found" }`

<a id="endpoint-patch-user-profile"></a>
#### `PATCH /user/profile`
* **Access**: Authenticated (`Bearer` Token required)
* **Headers**:
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`
* **Request Body** *(All fields optional)*:
```json
{
  "first_name": "Jane",              // string, optional, 2-50 chars (note snake_case: first_name)
  "last_name": "Smith",              // string, optional, 2-50 chars (note snake_case: last_name)
  "bio": "Staff Engineer writing Go", // string, optional, max 500 chars
  "avatar_url": "https://pub-r2.dev/1727271043-avatar.png" // string, optional
}
```
* **Success Response (`200 OK`)**:
```json
{
  "status": "success",
  "message": "Profile updated successfully",
  "data": {
    "id": "66f50bf8d2e8b1c4e7a8f901",
    "full_name": "Jane Smith",
    "email": "jane@example.com",
    "role": "reader",
    "bio": "Staff Engineer writing Go",
    "avatar_url": "https://pub-r2.dev/1727271043-avatar.png",
    "created_at": "2026-09-26T16:00:00Z",
    "updated_at": "2026-09-26T16:30:00Z"
  }
}
```
* **Error Responses**:
  * `400 Bad Request`: `{ "status": "error", "message": "invalid json payload" }`
  * `401 Unauthorized`: `{ "status": "error", "message": "unauthorized" }`

<a id="endpoint-patch-user-change-password"></a>
#### `PATCH /user/change-password`
* **Access**: Authenticated (`Bearer` Token required)
* **Headers**:
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`
* **Request Body**:
```json
{
  "old_password": "currentPassword123", // string, required
  "new_password": "newSecurePassword456" // string, required, min 6 chars
}
```
* **Success Response (`200 OK`)**:
```json
{
  "status": "success",
  "message": "Password changed successfully"
}
```
* **Error Responses**:
  * `400 Bad Request`: `{ "status": "error", "message": "invalid json payload" }`
  * `401 Unauthorized`: `{ "status": "error", "message": "invalid credentials" }`

<a id="endpoint-post-user-author-request"></a>
#### `POST /user/author-request`
* **Access**: Authenticated Reader (`role: "reader"`)
* **Headers**:
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`
* **Request Body**:
```json
{
  "bio": "Senior Backend Developer with 7 years of production Go and distributed systems experience.", // string, required, 10-1000 chars
  "sample_links": [                                                                                    // string[], optional array of URLs
    "https://github.com/janesmith",
    "https://dev.to/janesmith/scaling-websockets-in-go"
  ],
  "motivation": "I want to share architectural deep-dives, concurrency patterns, and microservice benchmarks with the community." // string, required, 10-2000 chars
}
```
* **Success Response (`201 Created`)**:
```json
{
  "status": "success",
  "message": "Author request submitted successfully",
  "data": {
    "id": "66f50d998d2e8b1c4e7a8f98",
    "user_id": "66f50bf8d2e8b1c4e7a8f901",
    "user_email": "jane@example.com",
    "user_name": "Jane Smith",
    "bio": "Senior Backend Developer with 7 years of production Go and distributed systems experience.",
    "sample_links": [
      "https://github.com/janesmith",
      "https://dev.to/janesmith/scaling-websockets-in-go"
    ],
    "motivation": "I want to share architectural deep-dives, concurrency patterns, and microservice benchmarks with the community.",
    "status": "pending",
    "created_at": "2026-09-26T16:40:00Z",
    "updated_at": "2026-09-26T16:40:00Z"
  }
}
```
* **Error Responses**:
  * `400 Bad Request`: `{ "status": "error", "message": "user is already an author" }` or `{ "status": "error", "message": "invalid json payload" }`
  * `401 Unauthorized`: `{ "status": "error", "message": "unauthorized" }`
  * `409 Conflict`: `{ "status": "error", "message": "a pending request already exists" }`

<a id="endpoint-get-user-author-request"></a>
#### `GET /user/author-request`
* **Access**: Authenticated (`Bearer` Token required)
* **Headers**: `Authorization: Bearer <access_token>`
* **Request Body**: None
* **Success Response (`200 OK`)**:
```json
{
  "status": "success",
  "message": "Author request retrieved successfully",
  "data": {
    "id": "66f50d998d2e8b1c4e7a8f98",
    "user_id": "66f50bf8d2e8b1c4e7a8f901",
    "user_email": "jane@example.com",
    "user_name": "Jane Smith",
    "bio": "Senior Backend Developer with 7 years of production Go and distributed systems experience.",
    "sample_links": [
      "https://github.com/janesmith"
    ],
    "motivation": "I want to share architectural deep-dives...",
    "status": "pending", // "pending" | "approved" | "rejected"
    "reviewed_by": "66f500008d2e8b1c4e7a8f00", // optional, present if reviewed
    "review_notes": "Great portfolio!",          // optional, present if reviewed
    "created_at": "2026-09-26T16:40:00Z",
    "updated_at": "2026-09-26T16:45:00Z"
  }
}
```
* **Error Responses**:
  * `401 Unauthorized`: `{ "status": "error", "message": "unauthorized" }`
  * `404 Not Found`: `{ "status": "error", "message": "author request not found" }`

---

### 4.4 Public Posts & Reading

<a id="endpoint-get-api-posts"></a>
#### `GET /api/posts`
* **Access**: Public (Optional `Authorization: Bearer <token>`)
* **Headers**: None required
* **Query Parameters**:
  * `search`: string (optional, searches post title)
  * `tag`: string (optional, exact tag match e.g. `tag=golang`)
  * `limit`: integer (optional, default: `10`, maximum: `20`)
  * `cursor`: string (optional, MongoDB ObjectID of last post from previous batch)
* **Success Response (`200 OK`)**:
```json
{
  "status": "success",
  "message": "Fetched posts successfully",
  "data": {
    "posts": [
      {
        "id": "66f510008d2e8b1c4e7a8fa0",
        "author_id": "66f50bf8d2e8b1c4e7a8f901",
        "author_name": "Jane Smith",
        "title": "Mastering Concurrency Patterns in Go",
        "slug": "mastering-concurrency-patterns-in-go",
        "content": "# Mastering Concurrency Patterns in Go\n\nChannels, worker pools, and sync.WaitGroup...",
        "cover_image": "https://pub-r2.dev/1727271043-concurrency.png",
        "status": "published",
        "tags": ["golang", "concurrency", "backend"],
        "likes_count": 42,
        "comments_count": 8,
        "created_at": "2026-09-26T15:00:00Z",
        "updated_at": "2026-09-26T15:30:00Z"
      }
    ],
    "pagination": {
      "limit": 10,
      "has_next": true,
      "next_cursor": "66f510008d2e8b1c4e7a8fa0",
      "count": 1
    }
  }
}
```
* **Error Responses**:
  * `400 Bad Request`: `{ "status": "error", "message": "invalid query parameters" }`

<a id="endpoint-get-api-posts-slug-slug"></a>
#### `GET /api/posts/slug/:slug`
* **Access**: Public for published posts. (Drafts require Author or Admin token).
* **Headers**: Optional `Authorization: Bearer <token>`
* **Path Parameters**:
  * `:slug`: string (required, e.g. `mastering-concurrency-patterns-in-go`)
* **Success Response (`200 OK`)**:
```json
{
  "status": "success",
  "message": "Post fetched successfully",
  "data": {
    "id": "66f510008d2e8b1c4e7a8fa0",
    "author_id": "66f50bf8d2e8b1c4e7a8f901",
    "author_name": "Jane Smith",
    "title": "Mastering Concurrency Patterns in Go",
    "slug": "mastering-concurrency-patterns-in-go",
    "content": "# Mastering Concurrency Patterns in Go\n\nChannels, worker pools, and sync.WaitGroup...",
    "cover_image": "https://pub-r2.dev/1727271043-concurrency.png",
    "status": "published",
    "tags": ["golang", "concurrency", "backend"],
    "likes_count": 42,
    "comments_count": 8,
    "created_at": "2026-09-26T15:00:00Z",
    "updated_at": "2026-09-26T15:30:00Z"
  }
}
```
* **Error Responses**:
  * `403 Forbidden`: `{ "status": "error", "message": "permission denied: draft post" }`
  * `404 Not Found`: `{ "status": "error", "message": "post not found" }`

<a id="endpoint-get-api-posts-id"></a>
#### `GET /api/posts/:id`
* **Access**: Public for published posts. (Drafts require Author or Admin token).
* **Headers**: Optional `Authorization: Bearer <token>`
* **Path Parameters**:
  * `:id`: string (required, 24-char hex MongoDB ObjectID)
* **Success Response (`200 OK`)**:
```json
{
  "status": "success",
  "message": "Post fetched successfully",
  "data": {
    "id": "66f510008d2e8b1c4e7a8fa0",
    "author_id": "66f50bf8d2e8b1c4e7a8f901",
    "author_name": "Jane Smith",
    "title": "Mastering Concurrency Patterns in Go",
    "slug": "mastering-concurrency-patterns-in-go",
    "content": "# Mastering Concurrency Patterns in Go\n\nChannels, worker pools, and sync.WaitGroup...",
    "cover_image": "https://pub-r2.dev/1727271043-concurrency.png",
    "status": "published",
    "tags": ["golang", "concurrency", "backend"],
    "likes_count": 42,
    "comments_count": 8,
    "created_at": "2026-09-26T15:00:00Z",
    "updated_at": "2026-09-26T15:30:00Z"
  }
}
```
* **Error Responses**:
  * `400 Bad Request`: `{ "status": "error", "message": "invalid post id" }`
  * `403 Forbidden`: `{ "status": "error", "message": "permission denied: draft post" }`
  * `404 Not Found`: `{ "status": "error", "message": "post not found" }`

<a id="endpoint-get-api-posts-id-comments"></a>
#### `GET /api/posts/:id/comments`
* **Access**: Public (Optional `Authorization: Bearer <token>`)
* **Path Parameters**:
  * `:id`: string (required, 24-char hex MongoDB ObjectID of target post)
* **Query Parameters**:
  * `limit`: integer (optional, default: `10`, maximum: `20`)
  * `cursor`: string (optional, MongoDB ObjectID cursor)
* **Success Response (`200 OK`)**:
```json
{
  "status": "success",
  "message": "Comments fetched successfully",
  "data": {
    "comments": [
      {
        "id": "66f511508d2e8b1c4e7a8fb1",
        "post_id": "66f510008d2e8b1c4e7a8fa0",
        "author_id": "66f50bf8d2e8b1c4e7a8f901",
        "author_name": "Jane Smith",
        "content": "This is a root comment on the article.",
        "created_at": "2026-09-26T15:10:00Z",
        "updated_at": "2026-09-26T15:10:00Z"
      },
      {
        "id": "66f511998d2e8b1c4e7a8fb4",
        "post_id": "66f510008d2e8b1c4e7a8fa0",
        "author_id": "66f50a008d2e8b1c4e7a8f77",
        "author_name": "Alex Johnson",
        "parent_id": "66f511508d2e8b1c4e7a8fb1",
        "content": "This is a nested reply to Jane's comment.",
        "created_at": "2026-09-26T15:15:00Z",
        "updated_at": "2026-09-26T15:15:00Z"
      }
    ],
    "pagination": {
      "limit": 10,
      "has_next": false,
      "next_cursor": "66f511998d2e8b1c4e7a8fb4",
      "count": 2
    }
  }
}
```
* **Error Responses**:
  * `400 Bad Request`: `{ "status": "error", "message": "invalid post id" }`
  * `404 Not Found`: `{ "status": "error", "message": "post not found" }`

<a id="endpoint-get-api-posts-id-like"></a>
#### `GET /api/posts/:id/like`
* **Access**: Public / Authenticated (if `Authorization: Bearer <token>` is sent, `liked` reflects the user's status; otherwise `liked` is `false`).
* **Path Parameters**:
  * `:id`: string (required, 24-char hex MongoDB ObjectID of post)
* **Success Response (`200 OK`)**:
```json
{
  "status": "success",
  "message": "Like status fetched successfully",
  "data": {
    "liked": true,
    "likes_count": 42
  }
}
```
* **Error Responses**:
  * `400 Bad Request`: `{ "status": "error", "message": "invalid post id" }`
  * `404 Not Found`: `{ "status": "error", "message": "post not found" }`

---

### 4.5 Social Engagement (Comments & Likes)

<a id="endpoint-post-api-posts-id-comments"></a>
#### `POST /api/posts/:id/comments`
* **Access**: Authenticated (`Bearer` Token required)
* **Headers**:
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`
* **Path Parameters**:
  * `:id`: string (required, 24-char hex MongoDB ObjectID of post)
* **Request Body**:
```json
{
  "content": "Fantastic explanation of channels and select!", // string, required, 1-2000 chars
  "parent_id": "66f511508d2e8b1c4e7a8fb1"                    // string, optional (24-char hex MongoDB ObjectID for nested reply)
}
```
* **Success Response (`201 Created`)**:
```json
{
  "status": "success",
  "message": "Comment added successfully",
  "data": {
    "id": "66f512008d2e8b1c4e7a8fbc",
    "post_id": "66f510008d2e8b1c4e7a8fa0",
    "author_id": "66f50bf8d2e8b1c4e7a8f901",
    "author_name": "Jane Smith",
    "parent_id": "66f511508d2e8b1c4e7a8fb1",
    "content": "Fantastic explanation of channels and select!",
    "created_at": "2026-09-26T15:20:00Z",
    "updated_at": "2026-09-26T15:20:00Z"
  }
}
```
* **Error Responses**:
  * `400 Bad Request`: `{ "status": "error", "message": "invalid json payload" }` or `{ "status": "error", "message": "invalid post id" }`
  * `401 Unauthorized`: `{ "status": "error", "message": "unauthorized" }`
  * `404 Not Found`: `{ "status": "error", "message": "post not found" }` or `{ "status": "error", "message": "parent comment not found" }`

<a id="endpoint-delete-api-comments-id"></a>
#### `DELETE /api/comments/:id`
* **Access**: Authenticated (Allowed for Comment Author, Post Author, or Admin)
* **Headers**: `Authorization: Bearer <access_token>`
* **Path Parameters**:
  * `:id`: string (required, 24-char hex MongoDB ObjectID of comment)
* **Success Response (`200 OK`)**:
```json
{
  "status": "success",
  "message": "Comment deleted successfully"
}
```
* **Error Responses**:
  * `400 Bad Request`: `{ "status": "error", "message": "invalid comment id" }`
  * `401 Unauthorized`: `{ "status": "error", "message": "unauthorized" }`
  * `403 Forbidden`: `{ "status": "error", "message": "permission denied" }`
  * `404 Not Found`: `{ "status": "error", "message": "comment not found" }`

<a id="endpoint-post-api-posts-id-like"></a>
#### `POST /api/posts/:id/like`
* **Access**: Authenticated (`Bearer` Token required)
* **Headers**: `Authorization: Bearer <access_token>`
* **Path Parameters**:
  * `:id`: string (required, 24-char hex MongoDB ObjectID of post)
* **Request Body**: None
* **Success Response (`200 OK`)**:
```json
{
  "status": "success",
  "message": "Post liked", // or "Post unliked"
  "data": {
    "liked": true,        // boolean (true if liked, false if unliked)
    "likes_count": 43     // number
  }
}
```
* **Error Responses**:
  * `400 Bad Request`: `{ "status": "error", "message": "invalid post id" }`
  * `401 Unauthorized`: `{ "status": "error", "message": "unauthorized" }`
  * `404 Not Found`: `{ "status": "error", "message": "post not found" }`

---

### 4.6 Author Studio & Content Creation

<a id="endpoint-post-api-posts"></a>
#### `POST /api/posts`
* **Access**: Authenticated Author or Admin (`role: "author"` | `"admin"`)
* **Headers**:
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`
* **Request Body**:
```json
{
  "title": "Scaling Distributed Systems with Go and Kafka", // string, required
  "content": "# Scaling Systems\n\nDetailed markdown guide...", // string, required
  "cover_image": "https://pub-r2.dev/1727271043-kafka.png",   // string, optional
  "status": "published",                                      // string, required: "draft" | "published"
  "tags": ["golang", "kafka", "distributed-systems"]          // string[], optional array
}
```
* **Success Response (`201 Created`)**:
```json
{
  "status": "success",
  "message": "post successfully created",
  "data": {
    "id": "66f513308d2e8b1c4e7a8fca",
    "author_id": "66f50bf8d2e8b1c4e7a8f901",
    "author_name": "Jane Smith",
    "title": "Scaling Distributed Systems with Go and Kafka",
    "slug": "scaling-distributed-systems-with-go-and-kafka",
    "content": "# Scaling Systems\n\nDetailed markdown guide...",
    "cover_image": "https://pub-r2.dev/1727271043-kafka.png",
    "status": "published",
    "tags": ["golang", "kafka", "distributed-systems"],
    "likes_count": 0,
    "comments_count": 0,
    "created_at": "2026-09-26T16:00:00Z",
    "updated_at": "2026-09-26T16:00:00Z"
  }
}
```
* **Error Responses**:
  * `400 Bad Request`: `{ "status": "error", "message": "invalid json payload" }`
  * `401 Unauthorized`: `{ "status": "error", "message": "unauthorized" }`
  * `403 Forbidden`: `{ "status": "error", "message": "permission denied" }`

<a id="endpoint-get-api-my-posts"></a>
#### `GET /api/my-posts`
* **Access**: Authenticated Author or Admin (`role: "author"` | `"admin"`)
* **Headers**: `Authorization: Bearer <access_token>`
* **Query Parameters**:
  * `limit`: integer (optional, default: `10`, maximum: `20`)
  * `cursor`: string (optional, MongoDB ObjectID cursor)
* **Success Response (`200 OK`)**:
```json
{
  "status": "success",
  "message": "Fetched posts successfully",
  "data": {
    "posts": [
      {
        "id": "66f513308d2e8b1c4e7a8fca",
        "author_id": "66f50bf8d2e8b1c4e7a8f901",
        "author_name": "Jane Smith",
        "title": "Scaling Distributed Systems with Go and Kafka",
        "slug": "scaling-distributed-systems-with-go-and-kafka",
        "content": "# Scaling Systems...",
        "cover_image": "https://pub-r2.dev/1727271043-kafka.png",
        "status": "published",
        "tags": ["golang", "kafka"],
        "likes_count": 0,
        "comments_count": 0,
        "created_at": "2026-09-26T16:00:00Z",
        "updated_at": "2026-09-26T16:00:00Z"
      },
      {
        "id": "66f514408d2e8b1c4e7a8fcd",
        "author_id": "66f50bf8d2e8b1c4e7a8f901",
        "author_name": "Jane Smith",
        "title": "WIP: Raft Consensus in Practice",
        "slug": "wip-raft-consensus-in-practice",
        "content": "Draft in progress...",
        "cover_image": "",
        "status": "draft",
        "tags": ["raft", "consensus"],
        "likes_count": 0,
        "comments_count": 0,
        "created_at": "2026-09-26T16:10:00Z",
        "updated_at": "2026-09-26T16:15:00Z"
      }
    ],
    "pagination": {
      "limit": 10,
      "has_next": false,
      "next_cursor": "66f514408d2e8b1c4e7a8fcd",
      "count": 2
    }
  }
}
```
* **Error Responses**:
  * `400 Bad Request`: `{ "status": "error", "message": "invalid limit parameter" }`
  * `401 Unauthorized`: `{ "status": "error", "message": "unauthorized" }`
  * `403 Forbidden`: `{ "status": "error", "message": "permission denied" }`

<a id="endpoint-patch-api-posts-id"></a>
#### `PATCH /api/posts/:id`
* **Access**: Authenticated Post Author or Admin
* **Headers**:
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`
* **Path Parameters**:
  * `:id`: string (required, 24-char hex MongoDB ObjectID of post)
* **Request Body** *(All fields optional)*:
```json
{
  "title": "Scaling Distributed Systems with Go and Kafka (2026 Edition)", // string, optional
  "content": "# Updated Content...",                                        // string, optional
  "cover_image": "https://pub-r2.dev/1727271043-kafka-new.png",            // string, optional
  "status": "published",                                                   // string, optional: "draft" | "published"
  "tags": ["golang", "kafka", "scalability"]                               // string[], optional
}
```
* **Success Response (`200 OK`)**:
```json
{
  "status": "success",
  "message": "Post updated successfully",
  "data": {
    "id": "66f513308d2e8b1c4e7a8fca",
    "author_id": "66f50bf8d2e8b1c4e7a8f901",
    "author_name": "Jane Smith",
    "title": "Scaling Distributed Systems with Go and Kafka (2026 Edition)",
    "slug": "scaling-distributed-systems-with-go-and-kafka-2026-edition",
    "content": "# Updated Content...",
    "cover_image": "https://pub-r2.dev/1727271043-kafka-new.png",
    "status": "published",
    "tags": ["golang", "kafka", "scalability"],
    "likes_count": 0,
    "comments_count": 0,
    "created_at": "2026-09-26T16:00:00Z",
    "updated_at": "2026-09-26T16:30:00Z"
  }
}
```
* **Error Responses**:
  * `400 Bad Request`: `{ "status": "error", "message": "invalid json payload" }` or `{ "status": "error", "message": "invalid post id" }`
  * `401 Unauthorized`: `{ "status": "error", "message": "unauthorized" }`
  * `403 Forbidden`: `{ "status": "error", "message": "permission denied" }`
  * `404 Not Found`: `{ "status": "error", "message": "post not found" }`

<a id="endpoint-delete-api-posts-id"></a>
#### `DELETE /api/posts/:id`
* **Access**: Authenticated Post Author or Admin
* **Headers**: `Authorization: Bearer <access_token>`
* **Path Parameters**:
  * `:id`: string (required, 24-char hex MongoDB ObjectID of post)
* **Success Response (`200 OK`)**:
```json
{
  "status": "success",
  "message": "Post successfully deleted"
}
```
* **Error Responses**:
  * `400 Bad Request`: `{ "status": "error", "message": "invalid post id" }`
  * `401 Unauthorized`: `{ "status": "error", "message": "unauthorized" }`
  * `403 Forbidden`: `{ "status": "error", "message": "permission denied" }`
  * `404 Not Found`: `{ "status": "error", "message": "post not found" }`

<a id="endpoint-post-api-media-upload"></a>
#### `POST /api/media/upload`
* **Access**: Authenticated Author or Admin (`role: "author"` | `"admin"`)
* **Headers**:
  * `Authorization: Bearer <access_token>`
  * `Content-Type: multipart/form-data`
* **Request Body**:
  * Form field name: `file` (or `cover`, or `image`)
  * Allowed formats: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
  * Maximum size: **5 MB**
* **Success Response (`201 Created`)**:
```json
{
  "status": "success",
  "message": "Image uploaded successfully",
  "data": {
    "url": "https://pub-0e976d31bf7d402095617537d3b4dd09.r2.dev/1727271043-diagram.png",
    "filename": "1727271043-diagram.png",
    "size": 284910,
    "mime_type": "image/png"
  }
}
```
* **Error Responses**:
  * `400 Bad Request`: `{ "status": "error", "message": "no image file provided (expected 'file', 'cover', or 'image')" }` or `{ "status": "error", "message": "file exceeds max allowed size of 5MB" }` or `{ "status": "error", "message": "unsupported file type" }`
  * `401 Unauthorized`: `{ "status": "error", "message": "unauthorized" }`
  * `403 Forbidden`: `{ "status": "error", "message": "permission denied" }`

---

### 4.7 Admin Operations

<a id="endpoint-get-api-admin-posts"></a>
#### `GET /api/admin/posts`
* **Access**: Authenticated Admin (`role: "admin"`)
* **Headers**: `Authorization: Bearer <access_token>`
* **Query Parameters**:
  * `status`: string (optional, filter by `"draft"` or `"published"`)
  * `tag`: string (optional, filter by tag)
  * `search`: string (optional, search in titles)
  * `limit`: integer (optional, default: `10`, maximum: `20`)
  * `cursor`: string (optional, MongoDB ObjectID cursor)
* **Success Response (`200 OK`)**:
```json
{
  "status": "success",
  "message": "Fetched posts successfully",
  "data": {
    "posts": [
      {
        "id": "66f513308d2e8b1c4e7a8fca",
        "author_id": "66f50bf8d2e8b1c4e7a8f901",
        "author_name": "Jane Smith",
        "title": "Scaling Distributed Systems with Go and Kafka",
        "slug": "scaling-distributed-systems-with-go-and-kafka",
        "content": "Full content...",
        "cover_image": "https://pub-r2.dev/1727271043-kafka.png",
        "status": "published",
        "tags": ["golang"],
        "likes_count": 12,
        "comments_count": 2,
        "created_at": "2026-09-26T16:00:00Z",
        "updated_at": "2026-09-26T16:00:00Z"
      }
    ],
    "pagination": {
      "limit": 10,
      "has_next": false,
      "next_cursor": "66f513308d2e8b1c4e7a8fca",
      "count": 1
    }
  }
}
```
* **Error Responses**:
  * `400 Bad Request`: `{ "status": "error", "message": "invalid query parameters" }`
  * `401 Unauthorized`: `{ "status": "error", "message": "unauthorized" }`
  * `403 Forbidden`: `{ "status": "error", "message": "permission denied" }`

<a id="endpoint-delete-api-admin-posts-id"></a>
#### `DELETE /api/admin/posts/:id`
* **Access**: Authenticated Admin (`role: "admin"`)
* **Headers**: `Authorization: Bearer <access_token>`
* **Path Parameters**:
  * `:id`: string (required, 24-char hex MongoDB ObjectID of any post)
* **Success Response (`200 OK`)**:
```json
{
  "status": "success",
  "message": "Post successfully deleted"
}
```
* **Error Responses**:
  * `400 Bad Request`: `{ "status": "error", "message": "invalid post id" }`
  * `401 Unauthorized`: `{ "status": "error", "message": "unauthorized" }`
  * `403 Forbidden`: `{ "status": "error", "message": "permission denied" }`
  * `404 Not Found`: `{ "status": "error", "message": "post not found" }`

<a id="endpoint-get-api-admin-author-requests"></a>
#### `GET /api/admin/author-requests`
* **Access**: Authenticated Admin (`role: "admin"`)
* **Headers**: `Authorization: Bearer <access_token>`
* **Query Parameters**:
  * `status`: string (optional, filter by `"pending"`, `"approved"`, or `"rejected"`)
  * `limit`: integer (optional, default: `10`, maximum: `20`)
  * `cursor`: string (optional, MongoDB ObjectID cursor)
* **Success Response (`200 OK`)**:
```json
{
  "status": "success",
  "message": "Fetched author requests successfully",
  "data": {
    "requests": [
      {
        "id": "66f50d998d2e8b1c4e7a8f98",
        "user_id": "66f50bf8d2e8b1c4e7a8f901",
        "user_email": "jane@example.com",
        "user_name": "Jane Smith",
        "bio": "Senior Backend Developer with 7 years of production Go and distributed systems experience.",
        "sample_links": [
          "https://github.com/janesmith"
        ],
        "motivation": "I want to share architectural deep-dives...",
        "status": "pending",
        "created_at": "2026-09-26T16:40:00Z",
        "updated_at": "2026-09-26T16:40:00Z"
      }
    ],
    "pagination": {
      "limit": 10,
      "has_next": false,
      "next_cursor": "66f50d998d2e8b1c4e7a8f98",
      "count": 1
    }
  }
}
```
* **Error Responses**:
  * `400 Bad Request`: `{ "status": "error", "message": "invalid query parameters" }`
  * `401 Unauthorized`: `{ "status": "error", "message": "unauthorized" }`
  * `403 Forbidden`: `{ "status": "error", "message": "permission denied" }`

<a id="endpoint-patch-api-admin-author-requests-id-review"></a>
#### `PATCH /api/admin/author-requests/:id/review`
* **Access**: Authenticated Admin (`role: "admin"`)
* **Headers**:
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`
* **Path Parameters**:
  * `:id`: string (required, 24-char hex MongoDB ObjectID of request)
* **Request Body**:
```json
{
  "status": "approved",                              // string, required: "approved" | "rejected"
  "review_notes": "Impressive open-source profile! Welcome to the author team." // string, optional, max 500 chars
}
```
* **Success Response (`200 OK`)**:
```json
{
  "status": "success",
  "message": "Author request approved and user role elevated to author",
  "data": {
    "id": "66f50d998d2e8b1c4e7a8f98",
    "user_id": "66f50bf8d2e8b1c4e7a8f901",
    "user_email": "jane@example.com",
    "user_name": "Jane Smith",
    "bio": "Senior Backend Developer with 7 years of production Go and distributed systems experience.",
    "sample_links": [
      "https://github.com/janesmith"
    ],
    "motivation": "I want to share architectural deep-dives...",
    "status": "approved",
    "reviewed_by": "66f500008d2e8b1c4e7a8f00",
    "review_notes": "Impressive open-source profile! Welcome to the author team.",
    "created_at": "2026-09-26T16:40:00Z",
    "updated_at": "2026-09-26T16:55:00Z"
  }
}
```
*(When rejected, `message` will be `"Author request rejected"`).*
* **Error Responses**:
  * `400 Bad Request`: `{ "status": "error", "message": "invalid json payload" }` or `{ "status": "error", "message": "request has already been processed" }`
  * `401 Unauthorized`: `{ "status": "error", "message": "unauthorized" }`
  * `403 Forbidden`: `{ "status": "error", "message": "permission denied" }`
  * `404 Not Found`: `{ "status": "error", "message": "author request not found" }`

---

## 5. Page-by-Page Integration Specifications

### Page 1: Home / Feed (`/`)
* **Endpoint**: `GET /api/posts`
* **Query Parameters**:
  * `limit`: Items per page (default: `10`, max: `20`)
  * `cursor`: Cursor for the next page (ID of the last post in current batch)
  * `tag`: Tag filter (e.g. `?tag=golang`)
  * `search`: Title search (e.g. `?search=architecture`)
* **Pagination Pattern**:
  * Pass `cursor={lastPost.id}` when fetching the next page.
  * Stop when `res.data.data.pagination.has_next === false`.

---

### Page 2: Article Detail View (`/posts/[slug]`)
* **Endpoint**: `GET /api/posts/slug/:slug` (Fallback: `GET /api/posts/:id`)
* **Interactions**:
  1. **Like Status & Toggle**:
     - Check like state: `GET /api/posts/:id/like`
     - Toggle like: `POST /api/posts/:id/like`
     - *Optimistic UI*: Instantly update `liked = !liked` and `likes_count += liked ? 1 : -1`.
  2. **Comments**:
     - Fetch comments: `GET /api/posts/:id/comments?limit=10`
     - Post root comment: `POST /api/posts/:id/comments` with `{ "content": "..." }`
     - Post nested reply: `POST /api/posts/:id/comments` with `{ "content": "...", "parent_id": "<comment_id>" }`
     - Delete comment: `DELETE /api/comments/:id`

---

### Page 3: Author Studio & Post Editor (`/editor` & `/editor/[id]`)
* **Route Guard**: `user.role === 'author' || user.role === 'admin'`.
* **Cover Image Upload Flow**:
  1. User selects local image file.
  2. Send `POST /api/media/upload` with FormData `file`.
  3. Extract `data.url` and save into editor state.
* **Create Post**:
  - `POST /api/posts` with `{ "title": "...", "content": "...", "cover_image": "...", "status": "draft" | "published", "tags": [...] }`
* **Update Post**:
  - `PATCH /api/posts/:id` with changed fields.
* **Author Dashboard**:
  - `GET /api/my-posts` (returns published and drafts authored by current user).

---

### Page 4: "Become an Author" Application (`/settings/author-request`)
* **Route Guard**: `user.role === 'reader'`.
* **Workflow**:
  1. On mount, call `GET /user/author-request`.
     - `404 Not Found` $\to$ Show application submission form.
     - `status === "pending"` $\to$ Show pending review banner.
     - `status === "approved"` $\to$ Role updated to `author`; show link to Editor.
     - `status === "rejected"` $\to$ Show rejection notice and `review_notes`.
  2. Submitting Application:
     - `POST /user/author-request` with `{ "bio": "...", "sample_links": ["https://..."], "motivation": "..." }`.

---

### Page 5: Admin Panel (`/admin`)
* **Route Guard**: `user.role === 'admin'`.
* **Author Request Queue**:
  - List applications: `GET /api/admin/author-requests?status=pending`
  - Review: `PATCH /api/admin/author-requests/:id/review` with `{ "status": "approved", "review_notes": "Welcome!" }`.
* **Global Post Moderation**:
  - Browse all posts: `GET /api/admin/posts`
  - Delete violating post: `DELETE /api/admin/posts/:id`

---

### Page 6: User Settings (`/settings`)
* **Update Profile**:
  - `PATCH /user/profile` with `{ "first_name": "...", "last_name": "...", "bio": "...", "avatar_url": "..." }`.
* **Change Password**:
  - `PATCH /user/change-password` with `{ "old_password": "...", "new_password": "..." }`.
* **Sign Out**:
  - `POST /auth/logout` with `{ "refresh_token": "..." }`.
  - Clear local tokens and redirect to `/login`.

---

## 6. Recommended Frontend Directory Structure (Next.js App Router)

```text
src/
├── api/
│   ├── client.ts             # Axios client with queue-based silent refresh
│   ├── auth.ts               # register, login, refresh, logout
│   ├── user.ts               # iam, profile, change-password, author-request
│   ├── posts.ts              # listPublicPosts, getBySlug, getById, myPosts, create, update, delete
│   ├── comments.ts           # listComments, addComment, deleteComment
│   ├── likes.ts              # getStatus, toggleLike
│   └── media.ts              # uploadImage (FormData)
├── components/
│   ├── common/
│   │   ├── Navbar.tsx        # Responsive navigation, role badge, user menu
│   │   ├── PostCard.tsx      # Post thumbnail, meta, tags, likes/comments counters
│   │   └── ProtectedRoute.tsx# Role-based route guard
│   ├── editor/
│   │   ├── MarkdownEditor.tsx# Markdown textarea + live preview
│   │   └── CoverUploader.tsx # File drag-and-drop to /api/media/upload
│   └── post/
│       ├── CommentSection.tsx# Recursive comment tree and reply forms
│       └── LikeButton.tsx    # Optimistic like button
├── hooks/
│   ├── useAuth.ts            # User session, role checks, login/logout actions
│   ├── usePosts.ts           # TanStack useInfiniteQuery for feed
│   └── useLikes.ts           # Optimistic toggle like mutation
└── app/
    ├── layout.tsx            # Global providers (Auth, QueryClient)
    ├── page.tsx              # Home feed
    ├── posts/[slug]/page.tsx # Article detail & comments
    ├── editor/page.tsx       # Create new post
    ├── editor/[id]/page.tsx  # Edit post
    ├── settings/page.tsx     # Profile & Author request
    └── admin/page.tsx        # Moderation queue
```

---

## 7. Quick Smoke Test Script

Run this in your terminal or via curl to verify the backend is running and healthy:

```bash
# 1. Healthcheck
curl -i http://localhost:5000/health

# 2. Register a new user
curl -i -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'

# 3. Fetch published posts
curl -i http://localhost:5000/api/posts
```
