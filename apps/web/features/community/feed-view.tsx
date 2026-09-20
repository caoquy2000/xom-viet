import {
  ChevronDown,
  Clock3,
  Flame,
  LoaderCircle,
  Smile,
  TrendingUp,
} from "lucide-react";
import type {
  FeedQuery,
  FeedSort,
  Post,
  Topic,
  VoteValue,
} from "@xom/api-client";
import { PostCard } from "./post-card";
type Props = {
  posts: Post[];
  topics: Topic[];
  query: FeedQuery;
  loading: boolean;
  error: string;
  hasMore: boolean;
  busyPosts: ReadonlySet<string>;
  onSort(sort: FeedSort): void;
  onTopic(topic?: string): void;
  onPeriod(period: FeedQuery["period"]): void;
  onRetry(): void;
  onReset(): void;
  onMore(): void;
  onVote(post: Post, value: VoteValue): void;
  onSave(post: Post): void;
  onComments(post: Post): void;
  onReport(post: Post): void;
  onShare(post: Post): void;
};
export function FeedView(props: Props) {
  const { posts, topics, query, loading, error } = props;
  const topic = topics.find((item) => item.slug === query.topic);
  return (
    <main className="feed-column">
      <div className="feed-heading">
        <div>
          <div className="eyebrow">GÓC VUI CỦA NGƯỜI VIỆT</div>
          <h1>
            {query.saved
              ? "Để dành xem sau"
              : topic
                ? topic.name
                : query.query
                  ? "Chuyện bạn đang tìm"
                  : "Hôm nay có gì vui?"}
            <span className="heading-smile">
              {query.saved ? "📑" : topic?.emoji || "✳"}
            </span>
          </h1>
          <p>
            {query.saved
              ? "Những bài viết bạn đã lưu trong xóm."
              : topic?.description ||
                "Meme mới, chuyện hay. Vào xóm là có bạn."}
          </p>
        </div>
      </div>
      <div className="feed-controls">
        <div className="feed-tabs" role="group" aria-label="Sắp xếp bảng tin">
          {(
            [
              { id: "hot", label: "Đang hot", Icon: Flame },
              { id: "top", label: "Top", Icon: TrendingUp },
              { id: "new", label: "Mới nhất", Icon: Clock3 },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              className={query.sort === id ? "selected" : ""}
              aria-pressed={query.sort === id}
              onClick={() => props.onSort(id)}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </div>
        <label className="period-select">
          <select
            aria-label="Khoảng thời gian"
            value={query.period}
            onChange={(event) =>
              props.onPeriod(event.target.value as FeedQuery["period"])
            }
          >
            <option value="all">Mọi lúc</option>
            <option value="day">Hôm nay</option>
            <option value="week">Tuần này</option>
          </select>
          <ChevronDown size={15} />
        </label>
      </div>
      <div className="topic-chips">
        <button
          className={!topic ? "chip selected" : "chip"}
          onClick={() => props.onTopic()}
        >
          Tất cả
        </button>
        {topics.slice(0, 5).map((item) => (
          <button
            key={item.slug}
            className={`chip ${topic?.slug === item.slug ? "selected" : ""}`}
            onClick={() => props.onTopic(item.slug)}
          >
            {item.emoji} {item.name}
          </button>
        ))}
      </div>
      {error && (
        <div className="state-panel" role="alert">
          <p>{error}</p>
          <button className="primary-button" onClick={props.onRetry}>
            Thử lại
          </button>
        </div>
      )}
      {loading && !posts.length && (
        <div className="state-panel" role="status">
          <LoaderCircle className="spin" />
          <p>Đang hóng chuyện trong xóm...</p>
        </div>
      )}
      {!loading && !posts.length && !error && (
        <div className="state-panel">
          <Smile size={38} />
          <h2>
            {query.saved
              ? "Chưa có bài viết được lưu"
              : "Chưa tìm thấy chuyện nào"}
          </h2>
          <p>
            {query.saved
              ? "Nhấn biểu tượng lưu ở bài bạn thích để xem lại."
              : "Thử một từ khóa hoặc chủ đề khác nhé."}
          </p>
          <button className="primary-button" onClick={props.onReset}>
            Dạo một vòng trong xóm
          </button>
        </div>
      )}
      <div className="posts">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            topic={topics.find((item) => item.slug === post.topicSlug)}
            busy={props.busyPosts.has(post.id)}
            onVote={(value) => props.onVote(post, value)}
            onSave={() => props.onSave(post)}
            onComments={() => props.onComments(post)}
            onShare={() => props.onShare(post)}
            onReport={() => props.onReport(post)}
            onTopic={() => props.onTopic(post.topicSlug)}
          />
        ))}
      </div>
      {!!posts.length &&
        (props.hasMore ? (
          <button
            className="load-more"
            disabled={loading}
            onClick={props.onMore}
          >
            {loading ? (
              <LoaderCircle className="spin" size={18} />
            ) : (
              "Hóng thêm chuyện ↓"
            )}
          </button>
        ) : (
          <p className="feed-end">
            Bạn đã hóng hết chuyện rồi. Lát quay lại nhé ☕
          </p>
        ))}
    </main>
  );
}
