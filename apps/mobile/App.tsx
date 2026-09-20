import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider } from "./src/providers/app-provider";
import { CommunityScreen } from "./src/features/community/community-screen";
export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <CommunityScreen />
      </AppProvider>
    </SafeAreaProvider>
  );
}
