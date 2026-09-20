import { useEffect, useRef, useState } from "react";
import type { FeedApi, FeedQuery, Post } from "@xom/api-client";
export function useFeed(api: FeedApi, revision: number) {
  const [query, setQuery] = useState<FeedQuery>({ sort: "hot", period: "all" });
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [viewer, setViewer] = useState(-1);
  const [refreshKey, setRefreshKey] = useState(0);
  const generation = useRef(0);
  const moreLock = useRef(false);
  useEffect(() => {
    const id = ++generation.current;
    setLoading(true);
    setError("");
    void api
      .feed(query)
      .then((page) => {
        if (id !== generation.current) return;
        setPosts(page.data);
        setCursor(page.nextCursor);
        setViewer(revision);
      })
      .catch((e) => {
        if (id === generation.current) setError(e.message);
      })
      .finally(() => {
        if (id === generation.current) setLoading(false);
      });
    return () => {
      ++generation.current;
    };
  }, [api, query, revision, refreshKey]);
  async function more() {
    if (loading || !cursor || moreLock.current || viewer !== revision) return;
    moreLock.current = true;
    setLoading(true);
    const id = generation.current;
    try {
      const page = await api.feed({ ...query, cursor });
      if (id !== generation.current) return;
      setPosts((previous) => [
        ...previous,
        ...page.data.filter(
          (post) => !previous.some((item) => item.id === post.id),
        ),
      ]);
      setCursor(page.nextCursor);
    } catch (e) {
      if (id === generation.current)
        setError(e instanceof Error ? e.message : "Không thể tải thêm bài.");
    } finally {
      moreLock.current = false;
      if (id === generation.current) setLoading(false);
    }
  }
  return {
    query,
    setQuery,
    posts: viewer === revision ? posts : [],
    loading,
    error,
    cursor,
    more,
    refresh: () => setRefreshKey((key) => key + 1),
    update: (post: Post) =>
      setPosts((previous) =>
        previous.map((item) => (item.id === post.id ? post : item)),
      ),
  };
}
