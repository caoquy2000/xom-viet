import { useCallback, useRef, useState } from "react";
export function useAsyncAction() {
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = useCallback(async (action: () => Promise<void>) => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra. Bạn thử lại nhé.",
      );
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }, []);
  return { busy, error, setError, run };
}
