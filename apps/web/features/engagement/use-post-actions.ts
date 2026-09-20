import { useRef, useState } from "react";
import { ApiError, type Post, type SessionStore } from "@xom/api-client";
export function usePostActions(
  session: SessionStore,
  onUpdated: (post: Post) => void,
  notify: (message: string) => void,
  onLogin: () => void,
) {
  const locks = useRef(new Set<string>());
  const [busyPosts, setBusyPosts] = useState<ReadonlySet<string>>(new Set());
  async function mutate(post: Post, action: () => Promise<Post>) {
    if (locks.current.has(post.id)) return;
    const viewer = session.getSnapshot().revision;
    locks.current.add(post.id);
    setBusyPosts(new Set(locks.current));
    try {
      const changed = await action();
      if (session.getSnapshot().revision === viewer) onUpdated(changed);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await session.restore();
        onLogin();
      }
      notify(
        error instanceof Error ? error.message : "Không thể cập nhật bài.",
      );
    } finally {
      locks.current.delete(post.id);
      setBusyPosts(new Set(locks.current));
    }
  }
  return { busyPosts, mutate };
}
