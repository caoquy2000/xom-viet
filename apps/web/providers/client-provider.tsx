import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  createDemoApi,
  HttpCommunityApi,
  SessionStore,
  type CommunityApi,
} from "@xom/api-client";

type Services = { api: CommunityApi; session: SessionStore };
const Context = createContext<Services | null>(null);

/** Composition root: features receive interfaces; only this module chooses adapters. */
export function ClientProvider({
  children,
  api: injectedApi,
}: {
  children: ReactNode;
  api?: CommunityApi;
}) {
  const [services] = useState<Services>(() => {
    const api =
      injectedApi ??
      (process.env.NEXT_PUBLIC_API_URL !== undefined
        ? new HttpCommunityApi(process.env.NEXT_PUBLIC_API_URL)
        : createDemoApi());
    return { api, session: new SessionStore(api) };
  });
  useEffect(() => {
    void services.session.restore();
    const restore = () => {
      if (document.visibilityState === "visible")
        void services.session.restore();
    };
    document.addEventListener("visibilitychange", restore);
    return () => document.removeEventListener("visibilitychange", restore);
  }, [services]);
  return <Context.Provider value={services}>{children}</Context.Provider>;
}
export function useServices() {
  const services = useContext(Context);
  if (!services) throw new Error("ClientProvider is required.");
  return services;
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
