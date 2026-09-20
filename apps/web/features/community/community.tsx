"use client";
import { flushSync } from "react-dom";
import { useEffect, useRef, useState } from "react";
import {
  Flame,
  TrendingUp,
  Clock3,
  Bookmark,
  Search,
  Plus,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Smile,
  ImagePlus,
  Send,
  LogOut,
  Compass,
  Hash,
  LoaderCircle,
  Heart,
  ShieldCheck,
} from "lucide-react";
import type { Comment, Post, VoteValue } from "@xom/api-client";
import { useCommunity } from "./use-community";
import { PostCard, timeAgo } from "./post-card";
import { Modal } from "@/components/modal";

export function Community() {
  const community = useCommunity();
  const [modal, setModal] = useState<
    "login" | "create" | "comments" | "report" | "guidelines" | "credits" | null
  >(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyPosts, setBusyPosts] = useState<Set<string>>(new Set());
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [signUp, setSignUp] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const commentsGeneration = useRef(0);
  const topic = community.topics.find((t) => t.slug === community.query.topic);
  const notify = (message: string) => setToast(message);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3600);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const t = setTimeout(
      () => community.setQuery((q) => ({ ...q, query: search })),
      280,
    );
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool(tool: object, options: object): void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: "start_xom_search",
            description: "Điền từ khóa và bắt đầu tìm kiếm trong bảng tin Xóm.",
            inputSchema: {
              type: "object",
              properties: { query: { type: "string", maxLength: 100 } },
              required: ["query"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: true },
            execute: async (input: unknown) => {
              if (
                !input ||
                typeof input !== "object" ||
                !("query" in input) ||
                typeof input.query !== "string" ||
                input.query.length > 100 ||
                Object.keys(input).some((key) => key !== "query")
              )
                throw new Error("query phải là chuỗi tối đa 100 ký tự.");
              flushSync(() => {
                setSearch(input.query as string);
                community.setQuery((q) => ({
                  ...q,
                  query: input.query as string,
                }));
              });
              return { query: input.query, status: "search_requested" };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => lifecycle.abort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const openShared = () => {
      const id = new URLSearchParams(location.search).get("post");
      if (id)
        void community.api
          .post(id)
          .then((p) => openComments(p))
          .catch((e) => notify(e.message));
    };
    openShared();
  }, [community.api]); // eslint-disable-line react-hooks/exhaustive-deps

  function openModal(value: typeof modal) {
    setFormError("");
    setModal(value);
  }
  function requireUser(action: () => void) {
    if (!community.user) openModal("login");
    else action();
  }
  async function guarded(action: () => Promise<void>) {
    setBusy(true);
    setFormError("");
    try {
      await action();
    } catch (e) {
      setFormError(
        e instanceof Error ? e.message : "Có lỗi xảy ra. Vui lòng thử lại.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function mutatePost(post: Post, action: () => Promise<Post>) {
    if (busyPosts.has(post.id)) return;
    setBusyPosts((current) => new Set(current).add(post.id));
    try {
      community.updatePost(await action());
    } catch (e) {
      notify(e instanceof Error ? e.message : "Không thể cập nhật bài.");
    } finally {
      setBusyPosts((current) => {
        const next = new Set(current);
        next.delete(post.id);
        return next;
      });
    }
  }
  async function openComments(post: Post) {
    const generation = ++commentsGeneration.current;
    setActivePost(post);
    setComments([]);
    setCommentsLoading(true);
    openModal("comments");
    try {
      const data = await community.api.comments(post.id);
      if (generation === commentsGeneration.current) setComments(data);
    } catch (e) {
      if (generation === commentsGeneration.current)
        setFormError(
          e instanceof Error ? e.message : "Không thể tải bình luận.",
        );
    } finally {
      if (generation === commentsGeneration.current) setCommentsLoading(false);
    }
  }
  function selectTopic(slug?: string) {
    community.setQuery((q) => ({ ...q, topic: slug, saved: false }));
    setMobileMenu(false);
  }
  function selectSort(sort: "hot" | "top" | "new") {
    community.setQuery((q) => ({ ...q, sort, saved: false }));
    setMobileMenu(false);
  }
  async function share(post: Post) {
    if (community.api.mode === "demo" && post.id.startsWith("local-")) {
      notify(
        "Bài trải nghiệm chỉ tồn tại trong phiên này, chưa có liên kết chia sẻ.",
      );
      return;
    }
    const url = `${location.origin}/?post=${encodeURIComponent(post.id)}`;
    try {
      if (navigator.share) await navigator.share({ title: post.title, url });
      else {
        await navigator.clipboard.writeText(url);
        notify("Đã sao chép liên kết bài viết.");
      }
    } catch (e) {
      if (!(e instanceof Error && e.name === "AbortError"))
        notify("Không thể sao chép liên kết trên trình duyệt này.");
    }
  }
  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <button
            className="icon-button mobile-menu-button"
            aria-label="Mở menu"
            onClick={() => setMobileMenu(true)}
          >
            <Menu size={23} />
          </button>
          <a className="brand" href="/" aria-label="Xóm — Trang chủ">
            xóm<span>.</span>
            <span className="brand-spark">✳</span>
          </a>
          <div className="header-divider" />
          <span className="brand-subtitle">Chuyện vui, người Việt.</span>
          <label className="search-box">
            <Search size={19} />
            <input
              aria-label="Tìm kiếm trong xóm"
              placeholder="Tìm chuyện vui trong xóm..."
              maxLength={100}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <kbd>/</kbd>
          </label>
          <div className="header-actions">
            <button
              className="create-button"
              onClick={() =>
                requireUser(() => {
                  setImageFile(null);
                  openModal("create");
                })
              }
            >
              <Plus size={19} />
              <span>Đăng bài</span>
            </button>
            {community.user ? (
              <button
                className="user-button"
                title="Đăng xuất"
                onClick={() =>
                  void guarded(async () => {
                    await community.api.signOut();
                    community.setUser(null);
                    await community.refresh();
                    notify("Bạn đã đăng xuất.");
                  })
                }
              >
                <span>{community.user.avatar}</span>
                <LogOut size={17} />
              </button>
            ) : (
              <button
                className="login-button"
                onClick={() => openModal("login")}
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      </header>
      {mobileMenu && (
        <button
          className="sidebar-scrim"
          aria-label="Đóng menu"
          onClick={() => setMobileMenu(false)}
        />
      )}
      <div className="page-layout">
        <aside className={`left-sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
          <div className="mobile-sidebar-heading">
            <span className="brand">xóm.</span>
            <button
              className="icon-button"
              aria-label="Đóng menu"
              onClick={() => setMobileMenu(false)}
            >
              <X />
            </button>
          </div>
          <nav aria-label="Bảng tin">
            <span className="nav-label">LƯỚT XÓM</span>
            <button
              className={`nav-item ${community.query.sort === "hot" && !community.query.saved && !community.query.topic ? "active" : ""}`}
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
              className={`nav-item ${community.query.sort === "top" && !community.query.saved ? "active" : ""}`}
              onClick={() => selectSort("top")}
            >
              <TrendingUp size={21} />
              <span>Top trong xóm</span>
            </button>
            <button
              className={`nav-item ${community.query.sort === "new" && !community.query.saved ? "active" : ""}`}
              onClick={() => selectSort("new")}
            >
              <Clock3 size={21} />
              <span>Mới nhất</span>
            </button>
            <button
              className={`nav-item ${community.query.saved ? "active" : ""}`}
              onClick={() => {
                community.setQuery((q) => ({
                  ...q,
                  saved: true,
                  topic: undefined,
                }));
                setMobileMenu(false);
              }}
            >
              <Bookmark size={21} />
              <span>Đã lưu</span>
            </button>
          </nav>
          <div className="sidebar-rule" />
          <nav aria-label="Chủ đề">
            <span className="nav-label">CHUYỆN THEO CHỦ ĐỀ</span>
            {community.topics.map((t) => (
              <button
                key={t.slug}
                className={`nav-item topic-nav ${community.query.topic === t.slug ? "topic-active" : ""}`}
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
              <button onClick={() => openModal("guidelines")}>
                Quy tắc cộng đồng
              </button>
              <button onClick={() => openModal("credits")}>Nguồn ảnh</button>
            </div>
            <span className="copyright">© 2026 Xóm</span>
            {community.api.mode === "demo" && (
              <span className="demo-label">
                Bản trải nghiệm · Dữ liệu minh họa
              </span>
            )}
          </div>
        </aside>
        <main className="feed-column">
          <div className="feed-heading">
            <div>
              <div className="eyebrow">GÓC VUI CỦA NGƯỜI VIỆT</div>
              <h1>
                {community.query.saved
                  ? "Để dành xem sau"
                  : topic
                    ? topic.name
                    : search
                      ? "Chuyện bạn đang tìm"
                      : "Hôm nay có gì vui?"}
                <span className="heading-smile">
                  {community.query.saved ? "📑" : topic?.emoji || "✳"}
                </span>
              </h1>
              <p>
                {community.query.saved
                  ? "Những bài viết bạn đã lưu trong xóm."
                  : topic?.description ||
                    "Meme mới, chuyện hay. Vào xóm là có bạn."}
              </p>
            </div>
          </div>
          <div className="feed-controls">
            <div
              className="feed-tabs"
              role="group"
              aria-label="Sắp xếp bảng tin"
            >
              {[
                { id: "hot", label: "Đang hot", Icon: Flame },
                { id: "top", label: "Top", Icon: TrendingUp },
                { id: "new", label: "Mới nhất", Icon: Clock3 },
              ].map(({ id, label, Icon }) => (
                <button
                  key={id}
                  className={community.query.sort === id ? "selected" : ""}
                  aria-pressed={community.query.sort === id}
                  onClick={() => selectSort(id as "hot" | "top" | "new")}
                >
                  <Icon size={17} />
                  {label}
                </button>
              ))}
            </div>
            <label className="period-select">
              <select
                aria-label="Khoảng thời gian"
                value={community.query.period}
                onChange={(e) =>
                  community.setQuery((q) => ({
                    ...q,
                    period: e.target.value as "all" | "day" | "week",
                  }))
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
              onClick={() => selectTopic()}
            >
              Tất cả
            </button>
            {community.topics.slice(0, 5).map((t) => (
              <button
                key={t.slug}
                className={`chip ${topic?.slug === t.slug ? "selected" : ""}`}
                onClick={() => selectTopic(t.slug)}
              >
                {t.emoji} {t.name}
              </button>
            ))}
          </div>
          {community.error && (
            <div className="state-panel" role="alert">
              <p>{community.error}</p>
              <button
                className="primary-button"
                onClick={() => void community.refresh()}
              >
                Thử lại
              </button>
            </div>
          )}
          {community.loading && !community.posts.length && (
            <div className="state-panel">
              <LoaderCircle className="spin" />
              <p>Đang hóng chuyện trong xóm...</p>
            </div>
          )}
          {!community.loading &&
            !community.posts.length &&
            !community.error && (
              <div className="state-panel">
                <Smile size={38} />
                <h2>
                  {community.query.saved
                    ? "Chưa có bài viết được lưu"
                    : "Chưa tìm thấy chuyện nào"}
                </h2>
                <p>
                  {community.query.saved
                    ? "Nhấn biểu tượng lưu ở bài bạn thích để xem lại."
                    : "Thử một từ khóa hoặc chủ đề khác nhé."}
                </p>
                <button
                  className="primary-button"
                  onClick={() => {
                    setSearch("");
                    community.setQuery({ sort: "hot", period: "all" });
                  }}
                >
                  Dạo một vòng trong xóm
                </button>
              </div>
            )}
          <div className="posts">
            {community.posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                topic={community.topics.find((t) => t.slug === post.topicSlug)}
                busy={busyPosts.has(post.id)}
                onVote={(value: VoteValue) =>
                  requireUser(
                    () =>
                      void mutatePost(post, () =>
                        community.api.vote(post.id, value),
                      ),
                  )
                }
                onSave={() =>
                  requireUser(
                    () =>
                      void mutatePost(post, () =>
                        community.api.save(post.id, !post.saved),
                      ),
                  )
                }
                onComments={() => void openComments(post)}
                onShare={() => void share(post)}
                onReport={() =>
                  requireUser(() => {
                    setActivePost(post);
                    openModal("report");
                  })
                }
                onTopic={() => selectTopic(post.topicSlug)}
              />
            ))}
          </div>
          {community.nextCursor ? (
            <button
              className="load-more"
              disabled={community.loading}
              onClick={() => void community.loadMore()}
            >
              {community.loading ? "Đang tải..." : "Hóng thêm chuyện"}
              <ChevronDown size={18} />
            </button>
          ) : (
            !community.loading &&
            community.posts.length > 0 && (
              <p className="feed-end">
                Bạn đã hóng hết chuyện rồi. Lát quay lại nhé ☕
              </p>
            )
          )}
        </main>
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
            <button
              onClick={() =>
                community.user ? openModal("create") : openModal("login")
              }
            >
              {community.user ? "Kể chuyện của bạn" : "Gia nhập xóm"}
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
                onClick={() => {
                  setSearch(item.tag);
                  community.setQuery((q) => ({
                    ...q,
                    topic: undefined,
                    saved: false,
                  }));
                }}
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
            {community.topics.slice(1, 4).map((t) => (
              <button
                className="community-row"
                key={t.slug}
                onClick={() => selectTopic(t.slug)}
              >
                <span className={`community-icon icon-${t.slug}`}>
                  {t.emoji}
                </span>
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
              <button onClick={() => openModal("guidelines")}>
                Cùng giữ xóm văn minh <ArrowUpRight size={13} />
              </button>
            </p>
          </div>
        </aside>
      </div>
      <Modal
        open={modal === "login"}
        onClose={() => setModal(null)}
        title={signUp ? "Chào hàng xóm mới 👋" : "Về xóm thôi 👋"}
        description={
          community.api.mode === "demo"
            ? "Trải nghiệm đăng bài, bình chọn và bình luận. Dữ liệu sẽ đặt lại khi tải lại trang."
            : "Đăng nhập để cùng góp chuyện trong xóm."
        }
      >
        {community.api.mode === "demo" ? (
          <button
            className="primary-button full-width"
            disabled={busy}
            onClick={() =>
              void guarded(async () => {
                community.setUser(await community.api.signIn("", ""));
                setModal(null);
                notify("Chào mừng bạn đến với xóm!");
              })
            }
          >
            Dùng hồ sơ trải nghiệm <ArrowUpRight size={18} />
          </button>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void guarded(async () => {
                const user = signUp
                  ? await community.api.signUp(
                      String(f.get("name")),
                      String(f.get("email")),
                      String(f.get("password")),
                    )
                  : await community.api.signIn(
                      String(f.get("email")),
                      String(f.get("password")),
                    );
                community.setUser(user);
                setModal(null);
                await community.refresh();
              });
            }}
          >
            {signUp && (
              <label className="form-field">
                Tên hiển thị
                <input name="name" required minLength={2} maxLength={40} />
              </label>
            )}
            <label className="form-field">
              Email
              <input name="email" type="email" required autoComplete="email" />
            </label>
            <label className="form-field">
              Mật khẩu
              <input
                name="password"
                type="password"
                required
                minLength={12}
                maxLength={72}
                autoComplete={signUp ? "new-password" : "current-password"}
              />
            </label>
            <button className="primary-button full-width" disabled={busy}>
              {busy ? "Đang xử lý..." : signUp ? "Tạo tài khoản" : "Đăng nhập"}
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => setSignUp(!signUp)}
            >
              {signUp
                ? "Đã có tài khoản? Đăng nhập"
                : "Chưa có tài khoản? Gia nhập xóm"}
            </button>
          </form>
        )}
        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}
      </Modal>
      <Modal
        open={modal === "create"}
        onClose={() => setModal(null)}
        title="Có chuyện gì vui?"
        description="Một chiếc meme hay một câu chuyện nhỏ đều được."
        wide
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            void guarded(async () => {
              await community.api.createPost({
                title: String(data.get("title")),
                body: String(data.get("body")),
                topicSlug: String(data.get("topic")),
                image: imageFile || undefined,
              });
              setModal(null);
              setImageFile(null);
              setSearch("");
              community.setQuery({ sort: "new", period: "all" });
              notify(
                community.api.mode === "demo"
                  ? "Đã đăng bài trải nghiệm. Bài sẽ mất khi tải lại trang."
                  : "Bài viết đã lên xóm!",
              );
            });
          }}
        >
          <label className="form-field">
            Tiêu đề
            <input
              name="title"
              placeholder="Kể cả xóm nghe nào..."
              required
              minLength={3}
              maxLength={200}
            />
          </label>
          <label className="form-field">
            Chủ đề
            <select
              name="topic"
              defaultValue={community.query.topic || "hai-huoc"}
            >
              {community.topics.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.emoji} {t.name}
                </option>
              ))}
            </select>
          </label>
          <input
            ref={fileInput}
            hidden
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (
                ![
                  "image/jpeg",
                  "image/png",
                  "image/webp",
                  "image/gif",
                ].includes(file.type) ||
                file.size > 8 * 1024 * 1024
              ) {
                setFormError("Chọn ảnh JPG, PNG, WebP hoặc GIF dưới 8 MB.");
                return;
              }
              setFormError("");
              setImageFile(file);
            }}
          />
          <button
            type="button"
            className="upload-area"
            onClick={() => fileInput.current?.click()}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Ảnh chuẩn bị đăng" />
            ) : (
              <>
                <ImagePlus size={30} />
                <strong>Thêm một chiếc ảnh</strong>
                <small>JPG, PNG, WebP, GIF · Tối đa 8 MB</small>
              </>
            )}
          </button>
          {imageFile && (
            <button
              type="button"
              className="text-button"
              onClick={() => setImageFile(null)}
            >
              Bỏ ảnh này
            </button>
          )}
          <label className="form-field">
            Nội dung <span className="optional">(không bắt buộc)</span>
            <textarea
              name="body"
              rows={3}
              maxLength={5000}
              placeholder="Thêm một chút chuyện..."
            />
          </label>
          {formError && (
            <p className="form-error" role="alert">
              {formError}
            </p>
          )}
          <button className="primary-button full-width" disabled={busy}>
            {busy ? "Đang đăng..." : "Góp vui cho xóm"}
            <Send size={18} />
          </button>
        </form>
      </Modal>
      <Modal
        open={modal === "comments"}
        onClose={() => {
          commentsGeneration.current++;
          setModal(null);
        }}
        title="Cả xóm nói gì?"
        wide
      >
        <h3 className="comment-post-title">{activePost?.title}</h3>
        <div className="comment-list">
          {commentsLoading ? (
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
        {community.user ? (
          <form
            className="comment-form"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const data = new FormData(form);
              void guarded(async () => {
                if (!activePost) return;
                const comment = await community.api.comment(
                  activePost.id,
                  String(data.get("body")),
                );
                setComments((current) => [...current, comment]);
                community.updatePost(await community.api.post(activePost.id));
                form.reset();
              });
            }}
          >
            <input
              aria-label="Viết bình luận"
              name="body"
              placeholder="Góp một câu chuyện vui..."
              required
              maxLength={2000}
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
          <button
            className="primary-button full-width"
            onClick={() => openModal("login")}
          >
            Đăng nhập để góp chuyện
          </button>
        )}
        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}
      </Modal>
      <Modal
        open={modal === "report"}
        onClose={() => setModal(null)}
        title="Báo cáo bài viết"
        description="Giúp xóm giữ một không gian vui và tôn trọng nhau."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void guarded(async () => {
              if (!activePost) return;
              await community.api.report(
                activePost.id,
                String(f.get("reason")),
              );
              setModal(null);
              notify(
                community.api.mode === "demo"
                  ? "Đã thử thao tác báo cáo. Bản trải nghiệm chưa gửi cho kiểm duyệt viên."
                  : "Đã gửi báo cáo cho kiểm duyệt viên.",
              );
            });
          }}
        >
          <label className="form-field">
            Lý do
            <select name="reason">
              <option value="spam">Spam hoặc quảng cáo</option>
              <option value="harassment">Quấy rối, xúc phạm</option>
              <option value="unsafe">Nội dung không phù hợp</option>
              <option value="copyright">Vi phạm bản quyền</option>
            </select>
          </label>
          {formError && <p className="form-error">{formError}</p>}
          <button className="primary-button full-width" disabled={busy}>
            Gửi báo cáo
          </button>
        </form>
      </Modal>
      <Modal
        open={modal === "guidelines"}
        onClose={() => setModal(null)}
        title="Vui cùng nhau, tôn trọng nhau"
      >
        <div className="guidelines">
          <p>
            <strong>01. Cười cùng nhau.</strong> Không công kích, kỳ thị hoặc
            tiết lộ thông tin riêng tư của người khác.
          </p>
          <p>
            <strong>02. Chia sẻ có tâm.</strong> Đăng nội dung bạn có quyền sử
            dụng và ghi nguồn khi cần.
          </p>
          <p>
            <strong>03. Giữ xóm dễ chịu.</strong> Không spam, nội dung bạo lực
            đồ họa hay nội dung tình dục.
          </p>
          <p>
            <strong>04. Thấy không ổn? Báo cáo.</strong> Dùng biểu tượng lá cờ
            trên bài viết để gửi phản ánh.
          </p>
        </div>
      </Modal>
      <Modal
        open={modal === "credits"}
        onClose={() => setModal(null)}
        title="Cảm ơn những người chụp ảnh"
      >
        <div className="credits">
          <p>
            Mèo bên máy tính —{" "}
            <a
              href="https://commons.wikimedia.org/wiki/File:Mac_on_the_Mac_(3379797626).jpg"
              target="_blank"
              rel="noreferrer"
            >
              Ryan Snyder
            </a>{" "}
            ·{" "}
            <a href="https://creativecommons.org/licenses/by/2.0/">CC BY 2.0</a>
            .
          </p>
          <p>
            Capybara —{" "}
            <a
              href="https://unsplash.com/photos/g8OQxw5ZwyY"
              target="_blank"
              rel="noreferrer"
            >
              Anna Roberts / Unsplash
            </a>{" "}
            · <a href="https://unsplash.com/license">Unsplash License</a>.
          </p>
          <p>
            Hàng rong Hà Nội —{" "}
            <a
              href="https://commons.wikimedia.org/wiki/File:Hanoi_Street_(31986563328).jpg"
              target="_blank"
              rel="noreferrer"
            >
              Rod Waddington
            </a>{" "}
            ·{" "}
            <a href="https://creativecommons.org/licenses/by-sa/2.0/">
              CC BY-SA 2.0
            </a>
            . Ảnh hiển thị có thể được cắt theo khung; phần ảnh chỉnh sửa giữ
            giấy phép này.
          </p>
          <p className="muted">
            Tiêu đề, tài khoản và bình luận trong bản trải nghiệm là dữ liệu
            minh họa.
          </p>
        </div>
      </Modal>
      {toast && (
        <div className="toast" role="status">
          {toast}
          <button aria-label="Đóng thông báo" onClick={() => setToast("")}>
            <X size={16} />
          </button>
        </div>
      )}
    </>
  );
}
