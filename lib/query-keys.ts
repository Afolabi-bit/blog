export const queryKeys = {
  posts: {
    all: ["posts"] as const,
    list: (filters?: { tag?: string; cursor?: string; limit?: number }) =>
      ["posts", "list", filters] as const,
    detail: (slug: string) => ["posts", "detail", slug] as const,
    detailById: (id: string) => ["posts", "detailById", id] as const,
    myPosts: (status?: string) => ["posts", "my-posts", status] as const,
  },
  likes: {
    status: (postId: string) => ["likes", postId] as const,
  },
  comments: {
    list: (postId: string, cursor?: string) => ["comments", postId, cursor] as const,
  },
  user: {
    me: ["user", "me"] as const,
    authorRequest: ["user", "author-request"] as const,
  },
  admin: {
    posts: (cursor?: string) => ["admin", "posts", cursor] as const,
    authorRequests: (status?: string) => ["admin", "author-requests", status] as const,
  },
};
