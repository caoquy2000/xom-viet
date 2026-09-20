import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ApiError, type Post } from "@xom/api-client";
import { useServices, useSession } from "../../providers/app-provider";
import { s } from "../../ui/styles";
import { AuthForm } from "../auth/auth-form";
import { CreatePostForm } from "../publishing/create-post-form";
import { CommentsPanel } from "../engagement/comments-panel";
import { FeedHeader } from "./feed-header";
import { PostCard } from "./post-card";
import { useFeed } from "./use-feed";
type Screen =
  { kind: "auth" | "create" } | { kind: "comments"; post: Post } | null;
export function CommunityScreen() {
  const { api } = useServices();
  const {
    user,
    revision,
    status,
    busy: authBusy,
    error: sessionError,
    session,
  } = useSession();
  const feed = useFeed(api, revision);
  const [screen, setScreen] = useState<Screen>(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const close = () => setScreen(null);
  function requireUser(action: () => void) {
    if (status === "loading" || authBusy) return;
    user ? action() : setScreen({ kind: "auth" });
  }
  async function perform(action: () => Promise<void>) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    try {
      await action();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await session.restore();
        setScreen({ kind: "auth" });
      }
      Alert.alert(
        "Chưa thực hiện được",
        error instanceof Error ? error.message : "Bạn thử lại nhé.",
      );
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  async function mutate(action: () => Promise<Post>) {
    const viewer = session.getSnapshot().revision;
    await perform(async () => {
      const post = await action();
      if (viewer === session.getSnapshot().revision) feed.update(post);
    });
  }
  return (
    <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
      <StatusBar style="dark" />
      <View style={s.header}>
        <Text style={s.logo}>
          xóm<Text style={s.logoDot}>.</Text>
        </Text>
        <Pressable
          accessibilityRole="button"
          disabled={authBusy || status === "loading"}
          onPress={() =>
            user
              ? void perform(async () => {
                  await session.signOut();
                  close();
                  feed.setQuery((q) => ({ ...q, saved: false }));
                })
              : setScreen({ kind: "auth" })
          }
          style={s.login}
        >
          <Text style={s.loginText}>
            {user
              ? `${user.avatar} ${user.name} · Thoát`
              : status === "loading"
                ? "Đang kiểm tra..."
                : "Đăng nhập"}
          </Text>
        </Pressable>
      </View>
      <FlatList
        data={feed.posts}
        keyExtractor={(post) => post.id}
        contentContainerStyle={s.feed}
        refreshControl={
          <RefreshControl
            refreshing={feed.loading}
            onRefresh={feed.refresh}
            tintColor="#a48d28"
          />
        }
        ListHeaderComponent={
          <FeedHeader
            query={feed.query}
            search={search}
            mode={api.mode}
            error={sessionError || feed.error}
            onSearch={setSearch}
            onSubmitSearch={() =>
              feed.setQuery((q) => ({ ...q, query: search }))
            }
            onSort={(sort) =>
              feed.setQuery((q) => ({ ...q, sort, saved: false }))
            }
            onTopic={(topic) =>
              feed.setQuery((q) => ({ ...q, topic, saved: false }))
            }
            onRetry={() => {
              feed.refresh();
              void session.restore();
            }}
          />
        }
        renderItem={({ item: post }) => (
          <PostCard
            post={post}
            busy={busy || authBusy}
            onVote={(value) =>
              requireUser(() => void mutate(() => api.vote(post.id, value)))
            }
            onSave={() =>
              requireUser(
                () => void mutate(() => api.save(post.id, !post.saved)),
              )
            }
            onComments={() => setScreen({ kind: "comments", post })}
          />
        )}
        ListEmptyComponent={
          !feed.loading && !feed.error ? (
            <Text style={s.empty}>
              {feed.query.saved
                ? "Chưa có bài được lưu."
                : "Chưa có chuyện nào. Thử đổi chủ đề nhé."}
            </Text>
          ) : null
        }
        ListFooterComponent={
          feed.cursor ? (
            <Pressable
              disabled={feed.loading}
              style={s.more}
              onPress={() => void feed.more()}
            >
              {feed.loading ? (
                <ActivityIndicator />
              ) : (
                <Text>Hóng thêm chuyện ↓</Text>
              )}
            </Pressable>
          ) : (
            <View style={{ height: 30 }} />
          )
        }
      />
      <View style={s.bottomBar}>
        <Pressable
          onPress={() =>
            feed.setQuery((q) => ({ ...q, saved: false, topic: undefined }))
          }
        >
          <Text style={[s.bottomText, !feed.query.saved && s.bottomActive]}>
            ⌂ Bảng tin
          </Text>
        </Pressable>
        <Pressable
          style={s.compose}
          onPress={() => requireUser(() => setScreen({ kind: "create" }))}
        >
          <Text style={s.composeText}>＋</Text>
        </Pressable>
        <Pressable
          onPress={() =>
            requireUser(() => feed.setQuery((q) => ({ ...q, saved: true })))
          }
        >
          <Text style={[s.bottomText, feed.query.saved && s.bottomActive]}>
            ▱ Đã lưu
          </Text>
        </Pressable>
      </View>
      <Modal
        visible={screen !== null}
        animationType="slide"
        onRequestClose={close}
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={s.safe}>
          <KeyboardAvoidingView
            style={s.flex}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>
                {screen?.kind === "auth"
                  ? "Về xóm thôi 👋"
                  : screen?.kind === "create"
                    ? "Có chuyện gì vui?"
                    : "Cả xóm nói gì?"}
              </Text>
              <Pressable accessibilityLabel="Đóng" onPress={close}>
                <Text style={s.close}>×</Text>
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={s.modalBody}
              keyboardShouldPersistTaps="handled"
            >
              {screen?.kind === "auth" && <AuthForm onSuccess={close} />}
              {screen?.kind === "create" && user && (
                <CreatePostForm
                  api={api}
                  onCreated={() => {
                    close();
                    setSearch("");
                    feed.setQuery({ sort: "new", period: "all" });
                  }}
                />
              )}
              {screen?.kind === "comments" && (
                <CommentsPanel
                  key={`${screen.post.id}:${revision}`}
                  api={api}
                  post={screen.post}
                  user={user}
                  onUpdated={feed.update}
                  onLogin={() => setScreen({ kind: "auth" })}
                />
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
