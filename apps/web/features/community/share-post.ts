import type { Post } from "@xom/api-client";
export async function sharePost(
  post: Post,
  mode: "demo" | "live",
  notify: (message: string) => void,
) {
  if (mode === "demo" && post.id.startsWith("local-")) {
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
  } catch (error) {
    if (!(error instanceof Error && error.name === "AbortError"))
      notify("Không thể sao chép liên kết trên trình duyệt này.");
  }
}
