import { Modal } from "@/components/modal";
export function GuidelinesDialog({ onClose }: { onClose(): void }) {
  return (
    <Modal open={true} onClose={onClose} title="Vui cùng nhau, tôn trọng nhau">
      <div className="guidelines">
        <p>
          <strong>01. Cười cùng nhau.</strong> Không công kích, kỳ thị hoặc tiết
          lộ thông tin riêng tư của người khác.
        </p>
        <p>
          <strong>02. Chia sẻ có tâm.</strong> Đăng nội dung bạn có quyền sử
          dụng và ghi nguồn khi cần.
        </p>
        <p>
          <strong>03. Giữ xóm dễ chịu.</strong> Không spam, nội dung bạo lực đồ
          họa hay nội dung tình dục.
        </p>
        <p>
          <strong>04. Thấy không ổn? Báo cáo.</strong> Dùng biểu tượng lá cờ
          trên bài viết để gửi phản ánh.
        </p>
      </div>
    </Modal>
  );
}
