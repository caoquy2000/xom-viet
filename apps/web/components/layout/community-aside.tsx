import {
  ArrowUpRight,
  ChevronRight,
  Hash,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import type { Topic, User } from "@xom/api-client";
type Props = {
  user: User | null;
  topics: Topic[];
  onJoin(): void;
  onSearch(query: string): void;
  selectTopic(slug?: string): void;
  onGuidelines(): void;
};
export function CommunityAside({
  user,
  topics,
  onJoin,
  onSearch,
  selectTopic,
  onGuidelines,
}: Props) {
  return (
    <aside className="right-sidebar">
      <div className="welcome-card">
        <div className="welcome-top">
          <span>XÓM MÌNH NÈ</span>
          <span className="welcome-flower">✳</span>
        </div>
        <h2>
          Internet rộng lắm.
          <br />
          Về xóm cho vui.
        </h2>
        <p>
          Chia sẻ một chiếc meme.
          <br />
          Nhận lại cả xóm cùng cười.
        </p>
        <button onClick={() => onJoin()}>
          {user ? "Kể chuyện của bạn" : "Gia nhập xóm"}
          <ArrowUpRight size={20} />
        </button>
        <div className="welcome-avatars">
          <span>🐱</span>
          <span>👩🏻</span>
          <span>🥑</span>
          <span>😎</span>
          <small>Hàng xóm đang đợi bạn</small>
        </div>
      </div>
      <section className="trending-section">
        <div className="section-heading">
          <h2>
            <TrendingUp size={19} /> Xóm đang bàn
          </h2>
          <Hash size={17} />
        </div>
        {[
          { tag: "chuyencongso", text: "Đi làm có gì vui?", icon: "💼" },
          { tag: "capybara", text: "Hệ điều hành bình thản", icon: "🦫" },
          { tag: "vietnam", text: "Việt Nam trong mắt mình", icon: "🇻🇳" },
        ].map((item, i) => (
          <button
            className="trending-item"
            key={item.tag}
            onClick={() => onSearch(item.tag)}
          >
            <span className="trend-rank">0{i + 1}</span>
            <span className="trend-copy">
              <strong>#{item.tag}</strong>
              <small>{item.text}</small>
            </span>
            <span className="trend-icon">{item.icon}</span>
          </button>
        ))}
      </section>
      <section className="communities-section">
        <div className="section-heading">
          <h2>Hội hợp gu bạn</h2>
        </div>
        {topics.slice(1, 4).map((t) => (
          <button
            className="community-row"
            key={t.slug}
            onClick={() => selectTopic(t.slug)}
          >
            <span className={`community-icon icon-${t.slug}`}>{t.emoji}</span>
            <span>
              <strong>Hội {t.name.toLocaleLowerCase("vi")}</strong>
              <small>
                {t.slug === "thu-cung"
                  ? "Boss là nhất, sen là nhì"
                  : t.slug === "doi-song"
                    ? "Chuyện gì cũng có người nghe"
                    : "Gặp đồng đội cùng tần số"}
              </small>
            </span>
            <ChevronRight size={17} />
          </button>
        ))}
      </section>
      <div className="kindness-note">
        <ShieldCheck size={24} />
        <p>
          Vui thôi, đừng vui quá.
          <br />
          <button onClick={() => onGuidelines()}>
            Cùng giữ xóm văn minh <ArrowUpRight size={13} />
          </button>
        </p>
      </div>
    </aside>
  );
}
