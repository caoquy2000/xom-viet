import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { FeedSort, Post } from "@xom/api-client";
import { useServices, useSession } from "@/providers/client-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { Sidebar } from "@/components/layout/sidebar";
import { CommunityAside } from "@/components/layout/community-aside";
import { AuthDialog } from "@/features/auth/auth-dialog";
import { CreatePostDialog } from "@/features/publishing/create-post-dialog";
import { CommentsDialog } from "@/features/engagement/comments-dialog";
import { ReportDialog } from "@/features/engagement/report-dialog";
import { usePostActions } from "@/features/engagement/use-post-actions";
import { FeedView } from "./feed-view";
import { useCommunity } from "./use-community";
import { useSearch } from "./use-search";
import { sharePost } from "./share-post";
import { GuidelinesDialog } from "./guidelines-dialog";
import { CreditsDialog } from "./credits-dialog";

type Dialog =
  | { kind: "login" | "register" | "create" | "guidelines" | "credits" }
  | { kind: "comments" | "report"; post: Post }
  | null;
/** Page composition. Each feature owns its form, requests and transient state. */
export function Community() {
  const { api } = useServices();
  const { user, status, busy, revision, error, session } = useSession();
  const feed = useCommunity(api, revision);
  const { search, setSearch } = useSearch(feed.setQuery);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [toast, setToast] = useState("");
  const actions = usePostActions(session, feed.updatePost, setToast, () =>
    setDialog({ kind: "login" }),
  );
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3600);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    let active = true;
    const id = new URLSearchParams(location.search).get("post");
    if (id)
      void api
        .post(id)
        .then((post) => {
          if (active) setDialog({ kind: "comments", post });
        })
        .catch((error) => {
          if (active) setToast(error.message);
        });
    return () => {
      active = false;
    };
  }, [api]);
  function requireUser(action: () => void) {
    if (status === "loading" || busy) return;
    user ? action() : setDialog({ kind: "login" });
  }
  function selectTopic(topic?: string) {
    feed.setQuery((q) => ({ ...q, topic, saved: false }));
    setMobileMenu(false);
  }
  function selectSort(sort: FeedSort) {
    feed.setQuery((q) => ({ ...q, sort, saved: false }));
    setMobileMenu(false);
  }
  function saved() {
    requireUser(() => {
      feed.setQuery((q) => ({ ...q, saved: true, topic: undefined }));
      setMobileMenu(false);
    });
  }
  function reset() {
    setSearch("");
    feed.setQuery({ sort: "hot", period: "all" });
  }
  const close = () => setDialog(null);
  return (
    <>
      <SiteHeader
        user={user}
        pending={status === "loading" || busy}
        search={search}
        onSearch={setSearch}
        onMenu={() => setMobileMenu(true)}
        onCreate={() => requireUser(() => setDialog({ kind: "create" }))}
        onLogin={() => setDialog({ kind: "login" })}
        onRegister={() => setDialog({ kind: "register" })}
        onLogout={() => {
          void session
            .signOut()
            .then(() => {
              close();
              feed.setQuery((q) => ({ ...q, saved: false }));
              setToast("Bạn đã đăng xuất.");
            })
            .catch((error) => setToast(error.message));
        }}
      />
      {mobileMenu && (
        <button
          className="sidebar-scrim"
          aria-label="Đóng menu"
          onClick={() => setMobileMenu(false)}
        />
      )}
      <div className="page-layout">
        <Sidebar
          query={feed.query}
          topics={feed.topics}
          mode={api.mode}
          mobileMenu={mobileMenu}
          onClose={() => setMobileMenu(false)}
          selectTopic={selectTopic}
          selectSort={selectSort}
          onSaved={saved}
          onInfo={(kind) => setDialog({ kind })}
        />
        <div className="feed-surface">
          {status === "error" && (
            <div className="session-notice" role="alert">
              {error}
              <button onClick={() => void session.restore()}>
                Kiểm tra lại phiên
              </button>
            </div>
          )}
          <FeedView
            posts={feed.posts}
            topics={feed.topics}
            query={feed.query}
            loading={feed.loading}
            error={feed.error}
            hasMore={Boolean(feed.nextCursor)}
            busyPosts={actions.busyPosts}
            onSort={selectSort}
            onTopic={selectTopic}
            onPeriod={(period) => feed.setQuery((q) => ({ ...q, period }))}
            onRetry={() => void feed.refresh()}
            onReset={reset}
            onMore={() => void feed.loadMore()}
            onVote={(post, value) =>
              requireUser(
                () => void actions.mutate(post, () => api.vote(post.id, value)),
              )
            }
            onSave={(post) =>
              requireUser(
                () =>
                  void actions.mutate(post, () =>
                    api.save(post.id, !post.saved),
                  ),
              )
            }
            onComments={(post) => setDialog({ kind: "comments", post })}
            onReport={(post) =>
              requireUser(() => setDialog({ kind: "report", post }))
            }
            onShare={(post) => void sharePost(post, api.mode, setToast)}
          />
        </div>
        <CommunityAside
          user={user}
          topics={feed.topics}
          onJoin={() =>
            user
              ? setDialog({ kind: "create" })
              : setDialog({ kind: "register" })
          }
          onSearch={(value) => {
            setSearch(value);
            feed.setQuery((q) => ({ ...q, topic: undefined, saved: false }));
          }}
          selectTopic={selectTopic}
          onGuidelines={() => setDialog({ kind: "guidelines" })}
        />
      </div>
      {(dialog?.kind === "login" || dialog?.kind === "register") && (
        <AuthDialog
          initialMode={dialog.kind}
          onClose={close}
          onSuccess={() => {
            close();
            setToast("Chào mừng bạn đến với xóm!");
          }}
        />
      )}
      {dialog?.kind === "create" && user && (
        <CreatePostDialog
          api={api}
          topics={feed.topics}
          topic={feed.query.topic}
          onClose={close}
          onCreated={() => {
            close();
            setSearch("");
            feed.setQuery({ sort: "new", period: "all" });
            setToast(
              api.mode === "demo"
                ? "Đã đăng bài trải nghiệm. Bài sẽ mất khi tải lại trang."
                : "Bài viết đã lên xóm!",
            );
          }}
        />
      )}
      {dialog?.kind === "comments" && (
        <CommentsDialog
          key={`${dialog.post.id}:${revision}`}
          api={api}
          post={dialog.post}
          user={user}
          onClose={close}
          onLogin={() => setDialog({ kind: "login" })}
          onUpdated={feed.updatePost}
        />
      )}
      {dialog?.kind === "report" && user && (
        <ReportDialog
          api={api}
          postId={dialog.post.id}
          onClose={close}
          onReported={() => {
            close();
            setToast(
              api.mode === "demo"
                ? "Đã thử thao tác báo cáo. Bản trải nghiệm chưa gửi cho kiểm duyệt viên."
                : "Đã gửi báo cáo cho kiểm duyệt viên.",
            );
          }}
        />
      )}
      {dialog?.kind === "guidelines" && <GuidelinesDialog onClose={close} />}
      {dialog?.kind === "credits" && <CreditsDialog onClose={close} />}
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
