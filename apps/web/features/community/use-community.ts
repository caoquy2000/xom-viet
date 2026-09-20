import { useCallback, useEffect, useRef, useState } from "react";
import {
  TOPICS,
  type FeedApi,
  type Post,
  type FeedQuery,
  type Topic,
} from "@xom/api-client";

/** Feed state knows only its read API and the current viewer revision. */
export function useCommunity(api: FeedApi, viewerRevision: number) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [topics, setTopics] = useState<Topic[]>(TOPICS);
  const [query, setQuery] = useState<FeedQuery>({ sort: "hot", period: "all" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadedViewer, setLoadedViewer] = useState(-1);
  const generation = useRef(0);
  const fetchingMore = useRef(false);
  const refresh = useCallback(async () => {
    const request = ++generation.current;
    setLoading(true);
    setError("");
    try {
      const page = await api.feed(query);
      if (generation.current !== request) return;
      setPosts(page.data);
      setNextCursor(page.nextCursor);
      setLoadedViewer(viewerRevision);
    } catch (error) {
      if (generation.current === request)
        setError(
          error instanceof Error ? error.message : "Không thể tải bảng tin.",
        );
    } finally {
      if (generation.current === request) setLoading(false);
    }
  }, [api, query, viewerRevision]);
  useEffect(() => {
    void refresh();
    return () => {
      ++generation.current;
    };
  }, [refresh]);
  useEffect(() => {
    let active = true;
    void api
      .topics()
      .then((data) => {
        if (active) setTopics(data);
      })
      .catch((error) => {
        if (active) setError(error.message);
      });
    return () => {
      active = false;
    };
  }, [api]);
  const updatePost = (post: Post) =>
    setPosts((current) =>
      current.map((item) => (item.id === post.id ? post : item)),
    );
  const loadMore = async () => {
    if (
      !nextCursor ||
      loading ||
      fetchingMore.current ||
      loadedViewer !== viewerRevision
    )
      return;
    fetchingMore.current = true;
    const request = generation.current;
    setLoading(true);
    try {
      const page = await api.feed({ ...query, cursor: nextCursor });
      if (generation.current !== request) return;
      setPosts((current) => [
        ...current,
        ...page.data.filter(
          (post) => !current.some((item) => item.id === post.id),
        ),
      ]);
      setNextCursor(page.nextCursor);
    } catch (error) {
      if (generation.current === request)
        setError(
          error instanceof Error ? error.message : "Không thể tải thêm bài.",
        );
    } finally {
      fetchingMore.current = false;
      if (generation.current === request) setLoading(false);
    }
  };
  return {
    posts: loadedViewer === viewerRevision ? posts : [],
    topics,
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
