import {
  createContext,
  useContext,
  useState,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { AppState } from "react-native";
import { SessionStore, type CommunityApi } from "@xom/api-client";
import { api } from "../api";
type Services = { api: CommunityApi; session: SessionStore };
const Context = createContext<Services | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const [services] = useState(() => ({ api, session: new SessionStore(api) }));
  useEffect(() => {
    void services.session.restore();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void services.session.restore();
    });
    return () => subscription.remove();
  }, [services]);
  return <Context.Provider value={services}>{children}</Context.Provider>;
}
export function useServices() {
  const value = useContext(Context);
  if (!value) throw new Error("AppProvider is required");
  return value;
}
export function useSession() {
  const { session } = useServices();
  return {
    ...useSyncExternalStore(
      session.subscribe,
      session.getSnapshot,
      session.getServerSnapshot,
    ),
    session,
  };
}
