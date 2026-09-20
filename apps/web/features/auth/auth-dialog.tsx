import { useState } from "react";
import { ArrowUpRight, Eye, EyeOff } from "lucide-react";
import { registrationError } from "@xom/api-client";
import { Modal } from "@/components/modal";
import { useServices, useSession } from "@/providers/client-provider";

export function AuthDialog({
  initialMode,
  onClose,
  onSuccess,
}: {
  initialMode: "login" | "register";
  onClose(): void;
  onSuccess(): void;
}) {
  const { api } = useServices();
  const { session, busy } = useSession();
  const [mode, setMode] = useState(initialMode);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  const registering = mode === "register";
  async function submit(form: HTMLFormElement) {
    if (busy) return;
    const fields = new FormData(form);
    const email = String(fields.get("email") ?? "").trim();
    const password = String(fields.get("password") ?? "");
    const name = String(fields.get("name") ?? "").trim();
    const confirmation = String(fields.get("confirmation") ?? "");
    const invalid = registering
      ? registrationError(name, email, password, confirmation)
      : null;
    setError(invalid ?? "");
    if (invalid) return;
    try {
      if (registering)
        await session.signUp(name, email, password, confirmation);
      else await session.signIn(email, password);
      form.reset();
      onSuccess();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Không thể đăng nhập. Bạn thử lại nhé.",
      );
    }
  }
  return (
    <Modal
      open
      onClose={() => {
        if (!busy) onClose();
      }}
      title={registering ? "Chào hàng xóm mới 👋" : "Về xóm thôi 👋"}
      description={
        api.mode === "demo"
          ? "Bản trải nghiệm chưa kết nối máy chủ tài khoản. Hồ sơ demo chỉ tồn tại trong phiên này."
          : registering
            ? "Tạo tài khoản của bạn để cùng góp chuyện trong xóm."
            : "Đăng nhập để xem bài đã lưu và tiếp tục câu chuyện của bạn."
      }
    >
      {api.mode === "demo" ? (
        <button
          className="primary-button full-width"
          disabled={busy}
          onClick={() => {
            void session
              .signIn("", "")
              .then(onSuccess)
              .catch((e) => setError(e.message));
          }}
        >
          Dùng hồ sơ trải nghiệm <ArrowUpRight size={18} />
        </button>
      ) : (
        <form
          key={mode}
          onSubmit={(event) => {
            event.preventDefault();
            void submit(event.currentTarget);
          }}
          aria-busy={busy}
        >
          {registering && (
            <label className="form-field">
              Tên hiển thị
              <input
                name="name"
                required
                minLength={2}
                maxLength={40}
                autoComplete="nickname"
                autoFocus
                disabled={busy}
              />
            </label>
          )}
          <label className="form-field">
            Email
            <input
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus={!registering}
              disabled={busy}
            />
          </label>
          <label className="form-field">
            Mật khẩu
            <div className="password-input">
              <input
                name="password"
                type={visible ? "text" : "password"}
                required
                minLength={registering ? 12 : undefined}
                autoComplete={registering ? "new-password" : "current-password"}
                aria-describedby={registering ? "password-help" : undefined}
                disabled={busy}
              />
              <button
                type="button"
                className="icon-button"
                aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                aria-pressed={visible}
                onClick={() => setVisible(!visible)}
              >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          {registering && (
            <>
              <p id="password-help" className="form-help">
                Ít nhất 12 ký tự. Có thể dùng một cụm từ dễ nhớ.
              </p>
              <label className="form-field">
                Nhập lại mật khẩu
                <input
                  name="confirmation"
                  type={visible ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  disabled={busy}
                />
              </label>
            </>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="primary-button full-width" disabled={busy}>
            {busy
              ? "Đang xử lý..."
              : registering
                ? "Tạo tài khoản"
                : "Đăng nhập"}
          </button>
          <button
            type="button"
            className="text-button"
            disabled={busy}
            onClick={() => {
              setMode(registering ? "login" : "register");
              setError("");
              setVisible(false);
            }}
          >
            {registering
              ? "Đã có tài khoản? Đăng nhập"
              : "Chưa có tài khoản? Đăng ký"}
          </button>
        </form>
      )}
      {api.mode === "demo" && error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </Modal>
  );
}
