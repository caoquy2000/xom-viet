import { Modal } from "@/components/modal";
export function CreditsDialog({ onClose }: { onClose(): void }) {
  return (
    <Modal open={true} onClose={onClose} title="Cảm ơn những người chụp ảnh">
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
          · <a href="https://creativecommons.org/licenses/by/2.0/">CC BY 2.0</a>
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
          . Ảnh hiển thị có thể được cắt theo khung; phần ảnh chỉnh sửa giữ giấy
          phép này.
        </p>
        <p className="muted">
          Tiêu đề, tài khoản và bình luận trong bản trải nghiệm là dữ liệu minh
          họa.
        </p>
      </div>
    </Modal>
  );
}
