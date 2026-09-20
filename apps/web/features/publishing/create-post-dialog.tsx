import { useEffect, useRef, useState } from "react";
import { ImagePlus, Send } from "lucide-react";
import type { PublishingApi, Post, Topic } from "@xom/api-client";
import { Modal } from "@/components/modal";
import { useAsyncAction } from "@/hooks/use-async-action";
type Props = {
  api: PublishingApi;
  topics: Topic[];
  topic?: string;
  onClose(): void;
  onCreated(post: Post): void;
};
export function CreatePostDialog({
  api,
  topics,
  topic,
  onClose,
  onCreated,
}: Props) {
  const { busy, error, setError, run } = useAsyncAction();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return (
    <Modal
      open
      onClose={() => {
        if (!busy) onClose();
      }}
      title="Có chuyện gì vui?"
      description="Một chiếc meme hay một câu chuyện nhỏ đều được."
      wide
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          void run(async () => {
            onCreated(
              await api.createPost({
                title: String(data.get("title")),
                body: String(data.get("body")),
                topicSlug: String(data.get("topic")),
                image: file ?? undefined,
              }),
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
            disabled={busy}
          />
        </label>
        <label className="form-field">
          Chủ đề
          <select
            name="topic"
            defaultValue={topic ?? topics[0]?.slug}
            disabled={busy}
          >
            {topics.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.emoji} {t.name}
              </option>
            ))}
          </select>
        </label>
        <input
          ref={input}
          hidden
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(event) => {
            const chosen = event.target.files?.[0];
            if (!chosen) return;
            if (
              !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
                chosen.type,
              ) ||
              chosen.size > 8 * 1024 * 1024
            ) {
              setError("Chọn ảnh JPG, PNG, WebP hoặc GIF dưới 8 MB.");
              event.target.value = "";
              return;
            }
            setError("");
            setFile(chosen);
          }}
        />
        <button
          type="button"
          className="upload-area"
          disabled={busy}
          onClick={() => input.current?.click()}
        >
          {preview ? (
            <img src={preview} alt="Ảnh chuẩn bị đăng" />
          ) : (
            <>
              <ImagePlus size={30} />
              <strong>Thêm một chiếc ảnh</strong>
              <small>JPG, PNG, WebP, GIF · Tối đa 8 MB</small>
            </>
          )}
        </button>
        {file && (
          <button
            type="button"
            className="text-button"
            disabled={busy}
            onClick={() => {
              setFile(null);
              if (input.current) input.current.value = "";
            }}
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
            disabled={busy}
          />
        </label>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <button className="primary-button full-width" disabled={busy}>
          {busy ? "Đang đăng..." : "Góp vui cho xóm"}
          <Send size={18} />
        </button>
      </form>
    </Modal>
  );
}
