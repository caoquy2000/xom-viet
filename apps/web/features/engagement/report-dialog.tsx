import type { EngagementApi } from "@xom/api-client";
import { Modal } from "@/components/modal";
import { useAsyncAction } from "@/hooks/use-async-action";
export function ReportDialog({
  api,
  postId,
  onClose,
  onReported,
}: {
  api: Pick<EngagementApi, "report">;
  postId: string;
  onClose(): void;
  onReported(): void;
}) {
  const { busy, error, run } = useAsyncAction();
  return (
    <Modal
      open
      onClose={onClose}
      title="Báo cáo bài viết"
      description="Giúp xóm giữ một không gian vui và tôn trọng nhau."
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          void run(async () => {
            await api.report(postId, String(data.get("reason")));
            onReported();
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
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <button className="primary-button full-width" disabled={busy}>
          Gửi báo cáo
        </button>
      </form>
    </Modal>
  );
}
