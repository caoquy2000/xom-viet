"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createDemoApi,
  HttpCommunityApi,
  type Post,
  type User,
  type FeedQuery,
  TOPICS,
} from "@xom/api-client";

export function useCommunity() {
  const api = useMemo(
    () =>
      process.env.NEXT_PUBLIC_API_URL
        ? new HttpCommunityApi(process.env.NEXT_PUBLIC_API_URL)
        : createDemoApi(),
    [],
  );
  const [posts, setPosts] = useState<Post[]>([]);
  const [topics, setTopics] = useState(TOPICS);
  const [user, setUser] = useState<User | null>(null);
  const [query, setQuery] = useState<FeedQuery>({ sort: "hot", period: "all" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const requestId = ++generation.current;
    setLoading(true);
    setError("");
    try {
      const page = await api.feed(query);
      if (generation.current === requestId) {
        setPosts(page.data);
        setNextCursor(page.nextCursor);
      }
    } catch (e) {
      if (generation.current === requestId)
        setError(e instanceof Error ? e.message : "Không thể tải bảng tin.");
    } finally {
      if (generation.current === requestId) setLoading(false);
    }
  }, [api, query]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    void Promise.all([api.topics(), api.currentUser()])
      .then(([t, u]) => {
        setTopics(t);
        setUser(u);
      })
      .catch((e) => setError(e.message));
  }, [api]);
  const updatePost = (post: Post) =>
    setPosts((current) => current.map((p) => (p.id === post.id ? post : p)));
  const loadMore = async () => {
    if (!nextCursor || loading) return;
    const requestId = generation.current;
    setLoading(true);
    try {
      const page = await api.feed({ ...query, cursor: nextCursor });
      if (generation.current === requestId) {
        setPosts((current) => [
          ...current,
          ...page.data.filter((p) => !current.some((c) => c.id === p.id)),
        ]);
        setNextCursor(page.nextCursor);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải thêm bài.");
    } finally {
      if (generation.current === requestId) setLoading(false);
    }
  };
  return {
    api,
    posts,
    topics,
    user,
    setUser,
    query,
    setQuery,
    loading,
    error,
    nextCursor,
    refresh,
    updatePost,
    loadMore,
  };
}
