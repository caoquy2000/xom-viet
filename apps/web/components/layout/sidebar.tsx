import {
  Bookmark,
  Clock3,
  Compass,
  Flame,
  Heart,
  TrendingUp,
  X,
} from "lucide-react";
import type { FeedQuery, FeedSort, Topic } from "@xom/api-client";
type Props = {
  query: FeedQuery;
  topics: Topic[];
  mode: "live" | "demo";
  mobileMenu: boolean;
  onClose(): void;
  selectTopic(slug?: string): void;
  selectSort(sort: FeedSort): void;
  onSaved(): void;
  onInfo(kind: "guidelines" | "credits"): void;
};
export function Sidebar({
  query,
  topics,
  mode,
  mobileMenu,
  onClose,
  selectTopic,
  selectSort,
  onSaved,
  onInfo,
}: Props) {
  return (
    <aside className={`left-sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
      <div className="mobile-sidebar-heading">
        <span className="brand">xóm.</span>
        <button
          className="icon-button"
          aria-label="Đóng menu"
          onClick={() => onClose()}
        >
          <X />
        </button>
      </div>
      <nav aria-label="Bảng tin">
        <span className="nav-label">LƯỚT XÓM</span>
        <button
          className={`nav-item ${query.sort === "hot" && !query.saved && !query.topic ? "active" : ""}`}
          onClick={() => {
            selectTopic();
            selectSort("hot");
          }}
        >
          <Flame size={21} />
          <span>Đang hot</span>
          <span className="hot-dot" />
        </button>
        <button
          className={`nav-item ${query.sort === "top" && !query.saved ? "active" : ""}`}
          onClick={() => selectSort("top")}
        >
          <TrendingUp size={21} />
          <span>Top trong xóm</span>
        </button>
        <button
          className={`nav-item ${query.sort === "new" && !query.saved ? "active" : ""}`}
          onClick={() => selectSort("new")}
        >
          <Clock3 size={21} />
          <span>Mới nhất</span>
        </button>
        <button
          className={`nav-item ${query.saved ? "active" : ""}`}
          onClick={onSaved}
        >
          <Bookmark size={21} />
          <span>Đã lưu</span>
        </button>
      </nav>
      <div className="sidebar-rule" />
      <nav aria-label="Chủ đề">
        <span className="nav-label">CHUYỆN THEO CHỦ ĐỀ</span>
        {topics.map((t) => (
          <button
            key={t.slug}
            className={`nav-item topic-nav ${query.topic === t.slug ? "topic-active" : ""}`}
            onClick={() => selectTopic(t.slug)}
          >
            <span className="topic-emoji">{t.emoji}</span>
            <span>{t.name}</span>
          </button>
        ))}
        <button
          className="nav-item explore-link"
          onClick={() => {
            selectTopic();
            document
              .querySelector(".topic-chips")
              ?.scrollIntoView({ block: "center", behavior: "smooth" });
          }}
        >
          <Compass size={20} />
          <span>Khám phá cả xóm</span>
        </button>
      </nav>
      <div className="sidebar-bottom">
        <div className="tiny-brand">
          Một chút vui, mỗi ngày <Heart size={13} />
        </div>
        <div className="sidebar-links">
          <button onClick={() => onInfo("guidelines")}>
            Quy tắc cộng đồng
          </button>
          <button onClick={() => onInfo("credits")}>Nguồn ảnh</button>
        </div>
        <span className="copyright">© 2026 Xóm</span>
        {mode === "demo" && (
          <span className="demo-label">Bản trải nghiệm · Dữ liệu minh họa</span>
        )}
      </div>
    </aside>
  );
}
