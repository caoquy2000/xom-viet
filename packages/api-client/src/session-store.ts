import type { AuthApi, User } from "./types";

export type SessionSnapshot = Readonly<{
  status: "loading" | "authenticated" | "anonymous" | "error";
  user: User | null;
  error: string;
  busy: boolean;
  revision: number;
}>;
const initial: SessionSnapshot = {
  status: "loading",
  user: null,
  error: "",
  busy: false,
  revision: 0,
};

/** Application state shared by web and native. Storage and transport belong to AuthApi. */
export class SessionStore {
  private snapshot = initial;
  private listeners = new Set<() => void>();
  private generation = 0;
  constructor(private readonly auth: AuthApi) {}
  getSnapshot = () => this.snapshot;
  getServerSnapshot = () => initial;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private publish(update: Partial<SessionSnapshot>) {
    this.snapshot = { ...this.snapshot, ...update };
    this.listeners.forEach((listener) => listener());
  }
  async restore() {
    if (this.snapshot.busy) return;
    const generation = ++this.generation;
    try {
      const user = await this.auth.currentUser();
      if (generation !== this.generation) return;
      const changed = user?.id !== this.snapshot.user?.id;
      this.publish({
        user,
        status: user ? "authenticated" : "anonymous",
        error: "",
        revision: this.snapshot.revision + Number(changed),
      });
    } catch (error) {
      if (generation === this.generation)
        this.publish({
          status: "error",
          user: null,
          error:
            error instanceof Error
              ? error.message
              : "Không thể kiểm tra phiên đăng nhập.",
          revision: this.snapshot.revision + 1,
        });
    }
  }
  private async change(action: () => Promise<User | null>) {
    if (this.snapshot.busy)
      throw new Error("Đang xử lý tài khoản. Bạn đợi một chút nhé.");
    ++this.generation;
    this.publish({ busy: true, error: "" });
    try {
      const user = await action();
      this.publish({
        user,
        status: user ? "authenticated" : "anonymous",
        revision: this.snapshot.revision + 1,
      });
      return user;
    } catch (error) {
      this.publish({
        error:
          error instanceof Error
            ? error.message
            : "Không thể cập nhật tài khoản.",
      });
      throw error;
    } finally {
      this.publish({ busy: false });
    }
  }
  signIn = (email: string, password: string) =>
    this.change(() => this.auth.signIn(email, password));
  signUp = (
    name: string,
    email: string,
    password: string,
    confirmation: string,
  ) => this.change(() => this.auth.signUp(name, email, password, confirmation));
  signOut = () =>
    this.change(async () => {
      await this.auth.signOut();
      return null;
    });
}
