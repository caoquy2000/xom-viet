import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import type {
  Comment,
  Post,
  User,
  EngagementApi,
  FeedApi,
} from "@xom/api-client";
import { Modal } from "@/components/modal";
import { useAsyncAction } from "@/hooks/use-async-action";
import { timeAgo } from "@/lib/format";
type Props = {
  api: Pick<EngagementApi, "comments" | "comment"> & Pick<FeedApi, "post">;
  post: Post;
  user: User | null;
  onClose(): void;
  onLogin(): void;
  onUpdated(post: Post): void;
};
export function CommentsDialog({
  api,
  post,
  user,
  onClose,
  onLogin,
  onUpdated,
}: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const { busy, error, setError, run } = useAsyncAction();
  useEffect(() => {
    let active = true;
    setLoading(true);
    void api
      .comments(post.id)
      .then((data) => {
        if (active) setComments(data);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [api, post.id, setError]);
  return (
    <Modal open onClose={onClose} title="Cả xóm nói gì?" wide>
      <h3 className="comment-post-title">{post.title}</h3>
      <div className="comment-list">
        {loading ? (
          <p className="muted">Đang tải bình luận...</p>
        ) : comments.length ? (
          comments.map((comment) => (
            <div className="comment" key={comment.id}>
              <span className="avatar">{comment.author.avatar}</span>
              <div>
                <strong>{comment.author.name}</strong>
                <small>{timeAgo(comment.createdAt)}</small>
                <p>{comment.body}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="muted">Chưa có bình luận. Bạn mở lời trước nhé!</p>
        )}
      </div>
      {user ? (
        <form
          className="comment-form"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new FormData(form);
            void run(async () => {
              const comment = await api.comment(
                post.id,
                String(data.get("body")),
              );
              setComments((previous) => [...previous, comment]);
              form.reset();
              onUpdated(await api.post(post.id));
            });
          }}
        >
          <input
            aria-label="Viết bình luận"
            name="body"
            placeholder="Góp một câu chuyện vui..."
            required
            maxLength={2000}
            disabled={busy}
          />
          <button
            className="primary-button"
            aria-label="Gửi bình luận"
            disabled={busy}
          >
            <Send size={18} />
          </button>
        </form>
      ) : (
        <button className="primary-button full-width" onClick={onLogin}>
          Đăng nhập để góp chuyện
        </button>
      )}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </Modal>
  );
}
