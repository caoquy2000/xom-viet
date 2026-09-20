export type FeedSort = "hot" | "top" | "new";
export type VoteValue = -1 | 0 | 1;
export type User = {
  id: string;
  name: string;
  username: string;
  avatar: string;
};
export type Topic = {
  slug: string;
  name: string;
  emoji: string;
  description: string;
};
export type Post = {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  topicSlug: string;
  author: User;
  createdAt: string;
  score: number;
  commentCount: number;
  viewerVote: VoteValue;
  saved: boolean;
  tags: string[];
};
export type Comment = {
  id: string;
  body: string;
  author: User;
  createdAt: string;
};
export type FeedQuery = {
  sort?: FeedSort;
  topic?: string;
  query?: string;
  cursor?: string;
  period?: "day" | "week" | "all";
  saved?: boolean;
};
export type Page<T> = { data: T[]; nextCursor: string | null };
export type CreatePostInput = {
  title: string;
  body?: string;
  topicSlug: string;
  imageUrl?: string;
  image?: Blob;
};
export interface CommunityApi {
  readonly mode: "demo" | "live";
  topics(): Promise<Topic[]>;
  feed(query?: FeedQuery): Promise<Page<Post>>;
  post(id: string): Promise<Post>;
  createPost(input: CreatePostInput): Promise<Post>;
  vote(id: string, value: VoteValue): Promise<Post>;
  save(id: string, saved: boolean): Promise<Post>;
  comments(id: string): Promise<Comment[]>;
  comment(id: string, body: string): Promise<Comment>;
  report(id: string, reason: string): Promise<void>;
  signIn(email: string, password: string): Promise<User>;
  signUp(name: string, email: string, password: string): Promise<User>;
  signOut(): Promise<void>;
  currentUser(): Promise<User | null>;
}
