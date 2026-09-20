import type {
  CommunityApi,
  User,
  Post,
  Comment,
  Topic,
  Page,
  FeedQuery,
  CreatePostInput,
  VoteValue,
} from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
export type TokenStorage = {
  get(): Promise<string | null>;
  set(token: string | null): Promise<void>;
};
export class HttpCommunityApi implements CommunityApi {
  readonly mode = "live" as const;
  constructor(
    private baseUrl: string,
    private tokens?: TokenStorage,
  ) {}
  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = await this.tokens?.get();
    const response = await fetch(
      `${this.baseUrl.replace(/\/$/, "")}/api/v1${path}`,
      {
        ...options,
        credentials: this.tokens ? "omit" : "include",
        headers: {
          ...(options.body instanceof FormData
            ? {}
            : { "Content-Type": "application/json" }),
          ...(this.tokens ? { "X-Xom-Client": "native" } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
      },
    );
    if (response.status === 204) return undefined as T;
    const data = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new ApiError(
        data.error?.message || "Không thể kết nối. Bạn thử lại nhé.",
        response.status,
      );
    return data as T;
  }
  topics() {
    return this.request<Topic[]>("/topics");
  }
  feed(query: FeedQuery = {}) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== "") params.set(key, String(value));
    });
    return this.request<Page<Post>>(`/posts?${params}`);
  }
  post(id: string) {
    return this.request<Post>(`/posts/${encodeURIComponent(id)}`);
  }
  createPost(input: CreatePostInput) {
    if (input.image) {
      const form = new FormData();
      form.set("title", input.title);
      form.set("body", input.body || "");
      form.set("topic_slug", input.topicSlug);
      form.set("image", input.image, "upload");
      return this.request<Post>("/posts", { method: "POST", body: form });
    }
    return this.request<Post>("/posts", {
      method: "POST",
      body: JSON.stringify({
        title: input.title,
        body: input.body,
        topic_slug: input.topicSlug,
        image_url: input.imageUrl,
      }),
    });
  }
  vote(id: string, value: VoteValue) {
    return this.request<Post>(`/posts/${encodeURIComponent(id)}/vote`, {
      method: "PUT",
      body: JSON.stringify({ value }),
    });
  }
  save(id: string, saved: boolean) {
    return this.request<Post>(`/posts/${encodeURIComponent(id)}/bookmark`, {
      method: saved ? "PUT" : "DELETE",
    });
  }
  comments(id: string) {
    return this.request<Comment[]>(`/posts/${encodeURIComponent(id)}/comments`);
  }
  comment(id: string, body: string) {
    return this.request<Comment>(`/posts/${encodeURIComponent(id)}/comments`, {
      method: "POST",
      body: JSON.stringify({ body }),
    });
  }
  async report(id: string, reason: string) {
    await this.request(`/posts/${encodeURIComponent(id)}/reports`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }
  private async authenticate(path: string, body: object) {
    const result = await this.request<{ user: User; token?: string }>(path, {
      method: "POST",
      body: JSON.stringify({ ...body, client: this.tokens ? "mobile" : "web" }),
    });
    if (this.tokens && result.token) await this.tokens.set(result.token);
    return result.user;
  }
  signIn(email: string, password: string) {
    return this.authenticate("/sessions", { email, password });
  }
  signUp(
    name: string,
    email: string,
    password: string,
    passwordConfirmation?: string,
  ) {
    return this.authenticate("/users", {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation ?? password,
    });
  }
  async signOut() {
    try {
      await this.request("/session", { method: "DELETE" });
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) throw error;
    }
    await this.tokens?.set(null);
  }
  async currentUser() {
    try {
      return await this.request<User>("/me");
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        await this.tokens?.set(null);
        return null;
      }
      throw e;
    }
  }
}
