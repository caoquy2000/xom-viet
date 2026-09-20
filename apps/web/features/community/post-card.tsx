"use client";
import {
  ArrowUp,
  ArrowDown,
  MessageCircle,
  Share2,
  Bookmark,
  Flag,
} from "lucide-react";
import type { Post, Topic, VoteValue } from "@xom/api-client";

import { formatCount, timeAgo } from "@/lib/format";
type Props = {
  post: Post;
  topic?: Topic;
  busy?: boolean;
  onVote(value: VoteValue): void;
  onSave(): void;
  onComments(): void;
  onShare(): void;
  onReport(): void;
  onTopic(): void;
};
export function PostCard({
  post,
  topic,
  busy,
  onVote,
  onSave,
  onComments,
  onShare,
  onReport,
  onTopic,
}: Props) {
  return (
    <article className="post-card" id={`post-${post.id}`}>
      <div className="post-padding">
        <div className="post-meta">
          <span className="avatar">{post.author.avatar}</span>
          <span className="author-name">{post.author.name}</span>
          <span className="meta-dot">·</span>
          <time dateTime={post.createdAt}>{timeAgo(post.createdAt)}</time>
          <button
            className="icon-button post-report"
            title="Báo cáo bài viết"
            aria-label="Báo cáo bài viết"
            onClick={onReport}
          >
            <Flag size={16} />
          </button>
        </div>
        <h2 className="post-title">
          <button onClick={onComments}>{post.title}</button>
        </h2>
        <button className="topic-label" onClick={onTopic}>
          {topic?.emoji} {topic?.name}
        </button>
      </div>
      {post.imageUrl ? (
        <div className="post-image-wrap">
          <img
            className="post-image"
            src={post.imageUrl}
            alt={post.title}
            loading={post.id === "demo-1" ? "eager" : "lazy"}
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.parentElement!.classList.add("image-failed");
            }}
          />
          <span className="image-error">Ảnh này hiện không tải được.</span>
        </div>
      ) : (
        <div className="text-post">{post.body}</div>
      )}
      {post.imageUrl && post.body && <p className="post-body">{post.body}</p>}
      <div className="post-padding post-bottom">
        {post.tags.length > 0 && (
          <div className="post-tags">
            {post.tags.map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
        )}
        <div className="post-actions">
          <div
            className={`vote-control ${post.viewerVote === 1 ? "voted-up" : post.viewerVote === -1 ? "voted-down" : ""}`}
          >
            <button
              disabled={busy}
              aria-label="Ủng hộ bài viết"
              aria-pressed={post.viewerVote === 1}
              onClick={() => onVote(post.viewerVote === 1 ? 0 : 1)}
            >
              <ArrowUp size={20} />
            </button>
            <span>{formatCount(post.score)}</span>
            <button
              disabled={busy}
              aria-label="Không thích bài viết"
              aria-pressed={post.viewerVote === -1}
              onClick={() => onVote(post.viewerVote === -1 ? 0 : -1)}
            >
              <ArrowDown size={20} />
            </button>
          </div>
          <button
            className="action-button"
            onClick={onComments}
            aria-label={`${post.commentCount} bình luận`}
          >
            <MessageCircle size={19} />
            <span>{formatCount(post.commentCount)}</span>
          </button>
          <button className="action-button share-button" onClick={onShare}>
            <Share2 size={18} />
            <span>Chia sẻ</span>
          </button>
          <button
            className={`icon-button save-button ${post.saved ? "is-saved" : ""}`}
            disabled={busy}
            onClick={onSave}
            aria-label={post.saved ? "Bỏ lưu bài viết" : "Lưu bài viết"}
            aria-pressed={post.saved}
          >
            <Bookmark size={20} fill={post.saved ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
    </article>
  );
}
