import { LogOut, Menu, Plus, Search, UserRound } from "lucide-react";
import type { User } from "@xom/api-client";
type Props = {
  user: User | null;
  pending: boolean;
  search: string;
  onSearch(value: string): void;
  onMenu(): void;
  onCreate(): void;
  onLogin(): void;
  onRegister(): void;
  onLogout(): void;
};
export function SiteHeader({
  user,
  pending,
  search,
  onSearch,
  onMenu,
  onCreate,
  onLogin,
  onRegister,
  onLogout,
}: Props) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <button
          className="icon-button mobile-menu-button"
          aria-label="Mở menu"
          onClick={onMenu}
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
            onChange={(e) => onSearch(e.target.value)}
          />
          <kbd>/</kbd>
        </label>
        <div className="header-actions">
          <button
            className="create-button"
            onClick={onCreate}
            disabled={pending}
          >
            <Plus size={19} />
            <span>Đăng bài</span>
          </button>
          {user ? (
            <div className="account-controls">
              <span className="account-name">
                <span>{user.avatar}</span>
                {user.name}
              </span>
              <button
                className="icon-button"
                aria-label="Đăng xuất"
                title="Đăng xuất"
                onClick={onLogout}
                disabled={pending}
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <>
              <button
                className="login-button"
                onClick={onLogin}
                disabled={pending}
              >
                {pending ? "Đang kiểm tra..." : "Đăng nhập"}
              </button>
              <button
                className="register-button"
                onClick={onRegister}
                disabled={pending}
              >
                <UserRound size={17} />
                <span>Đăng ký</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
