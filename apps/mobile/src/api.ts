import * as SecureStore from "expo-secure-store";
import { HttpCommunityApi, createDemoApi } from "@xom/api-client";
const baseUrl = process.env.EXPO_PUBLIC_API_URL;
export const api = baseUrl
  ? new HttpCommunityApi(baseUrl, {
      get: () => SecureStore.getItemAsync("xom_session"),
      set: (token) =>
        token
          ? SecureStore.setItemAsync("xom_session", token)
          : SecureStore.deleteItemAsync("xom_session"),
    })
  : createDemoApi();
