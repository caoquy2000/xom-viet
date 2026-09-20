import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  TOPICS,
  type Post,
  type Comment,
  type User,
  type FeedSort,
} from "@xom/api-client";
import { api } from "./src/api";

const demoImages: Record<string, number> = {
  "/images/cat.jpg": require("../web/public/images/cat.jpg"),
  "/images/capybara.jpg": require("../web/public/images/capybara.jpg"),
  "/images/street.jpg": require("../web/public/images/street.jpg"),
};
export default function App() {
  return (
    <SafeAreaProvider>
      <XomApp />
    </SafeAreaProvider>
  );
}
function XomApp() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [sort, setSort] = useState<FeedSort>("hot");
  const [topic, setTopic] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [screen, setScreen] = useState<"auth" | "create" | "comments" | null>(
    null,
  );
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [createTopic, setCreateTopic] = useState("hai-huoc");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [signUp, setSignUp] = useState(false);
  const [busy, setBusy] = useState(false);
  const generation = React.useRef(0);
  async function load(more = false) {
    const g = more ? generation.current : ++generation.current;
    setLoading(true);
    setError("");
    try {
      const result = await api.feed({
        sort,
        topic,
        query,
        saved,
        cursor: more ? cursor || undefined : undefined,
      });
      if (g === generation.current) {
        setPosts((previous) =>
          more
            ? [
                ...previous,
                ...result.data.filter(
                  (p) => !previous.some((old) => old.id === p.id),
                ),
              ]
            : result.data,
        );
        setCursor(result.nextCursor);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải bảng tin.");
    } finally {
      if (g === generation.current) setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, [sort, topic, saved]);
  useEffect(() => {
    void api
      .currentUser()
      .then(setUser)
      .catch((e) => setError(e.message));
  }, []);
  async function perform(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    try {
      await action();
    } catch (e) {
      Alert.alert(
        "Chưa thực hiện được",
        e instanceof Error ? e.message : "Bạn thử lại nhé.",
      );
    } finally {
      setBusy(false);
    }
  }
  function authenticate(action: () => void) {
    user ? action() : setScreen("auth");
  }
  function update(post: Post) {
    setPosts((current) => current.map((p) => (p.id === post.id ? post : p)));
  }
  async function openComments(post: Post) {
    setActivePost(post);
    setComments([]);
    setScreen("comments");
    setBusy(true);
    try {
      setComments(await api.comments(post.id));
    } catch (e) {
      Alert.alert(
        "Không thể tải bình luận",
        e instanceof Error ? e.message : "Thử lại nhé.",
      );
    } finally {
      setBusy(false);
    }
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
          onPress={() =>
            user
              ? void perform(async () => {
                  await api.signOut();
                  setUser(null);
                })
              : setScreen("auth")
          }
          style={s.login}
        >
          <Text style={s.loginText}>
            {user ? `${user.avatar} Thoát` : "Đăng nhập"}
          </Text>
        </Pressable>
      </View>
      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        contentContainerStyle={s.feed}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => void load()}
            tintColor="#a48d28"
          />
        }
        ListHeaderComponent={
          <>
            <Text style={s.eyebrow}>GÓC VUI CỦA NGƯỜI VIỆT</Text>
            <Text style={s.heading}>
              {saved ? "Để dành xem sau" : "Hôm nay có gì vui? ✳"}
            </Text>
            <View style={s.searchRow}>
              <TextInput
                style={[s.input, s.flex]}
                placeholder="Tìm chuyện trong xóm..."
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => void load()}
                returnKeyType="search"
              />
              <Pressable style={s.searchButton} onPress={() => void load()}>
                <Text>Tìm</Text>
              </Pressable>
            </View>
            <View style={s.tabs}>
              {(
                [
                  ["hot", "🔥 Đang hot"],
                  ["top", "↗ Top"],
                  ["new", "◷ Mới nhất"],
                ] as const
              ).map(([value, label]) => (
                <Pressable
                  key={value}
                  style={[s.tab, sort === value && s.tabActive]}
                  onPress={() => setSort(value)}
                >
                  <Text style={[s.tabText, sort === value && s.tabTextActive]}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.chips}
            >
              <Pressable
                style={[s.chip, !topic && s.chipActive]}
                onPress={() => setTopic(undefined)}
              >
                <Text>Tất cả</Text>
              </Pressable>
              {TOPICS.map((t) => (
                <Pressable
                  key={t.slug}
                  style={[s.chip, topic === t.slug && s.chipActive]}
                  onPress={() => setTopic(t.slug)}
                >
                  <Text>
                    {t.emoji} {t.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            {api.mode === "demo" && (
              <Text style={s.demo}>
                Bản trải nghiệm · Dữ liệu đặt lại khi khởi động
              </Text>
            )}
            {error ? (
              <Pressable onPress={() => void load()}>
                <Text style={s.error}>{error} Nhấn để thử lại.</Text>
              </Pressable>
            ) : null}
          </>
        }
        renderItem={({ item: post }) => (
          <View style={s.card}>
            <View style={s.postPadding}>
              <Text style={s.author}>
                {post.author.avatar} {post.author.name}
              </Text>
              <Pressable onPress={() => void openComments(post)}>
                <Text style={s.postTitle}>{post.title}</Text>
              </Pressable>
              <Text style={s.meta}>
                {TOPICS.find((t) => t.slug === post.topicSlug)?.name}
              </Text>
            </View>
            {post.imageUrl ? (
              <Image
                source={demoImages[post.imageUrl] || { uri: post.imageUrl }}
                style={s.image}
                resizeMode="cover"
              />
            ) : (
              <Text style={s.textPost}>{post.body}</Text>
            )}
            <View style={s.actions}>
              <Pressable
                accessibilityLabel="Ủng hộ"
                disabled={busy}
                onPress={() =>
                  authenticate(
                    () =>
                      void perform(async () =>
                        update(
                          await api.vote(
                            post.id,
                            post.viewerVote === 1 ? 0 : 1,
                          ),
                        ),
                      ),
                  )
                }
              >
                <Text style={[s.action, post.viewerVote === 1 && s.voted]}>
                  ↑ {post.score}
                </Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Không thích"
                disabled={busy}
                onPress={() =>
                  authenticate(
                    () =>
                      void perform(async () =>
                        update(
                          await api.vote(
                            post.id,
                            post.viewerVote === -1 ? 0 : -1,
                          ),
                        ),
                      ),
                  )
                }
              >
                <Text style={[s.action, post.viewerVote === -1 && s.voted]}>
                  ↓
                </Text>
              </Pressable>
              <Pressable onPress={() => void openComments(post)}>
                <Text style={s.action}>◯ {post.commentCount}</Text>
              </Pressable>
              <Pressable
                style={s.saveAction}
                disabled={busy}
                onPress={() =>
                  authenticate(
                    () =>
                      void perform(async () =>
                        update(await api.save(post.id, !post.saved)),
                      ),
                  )
                }
              >
                <Text style={[s.action, post.saved && s.voted]}>
                  {post.saved ? "Đã lưu" : "Lưu"}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          !loading && !error ? (
            <Text style={s.empty}>
              {saved
                ? "Chưa có bài được lưu."
                : "Chưa có chuyện nào. Thử đổi chủ đề nhé."}
            </Text>
          ) : null
        }
        ListFooterComponent={
          cursor ? (
            <Pressable
              disabled={loading}
              style={s.more}
              onPress={() => void load(true)}
            >
              {loading ? (
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
          onPress={() => {
            setSaved(false);
            setTopic(undefined);
          }}
        >
          <Text style={[s.bottomText, !saved && s.bottomActive]}>
            ⌂ Bảng tin
          </Text>
        </Pressable>
        <Pressable
          style={s.compose}
          onPress={() => authenticate(() => setScreen("create"))}
        >
          <Text style={s.composeText}>＋</Text>
        </Pressable>
        <Pressable onPress={() => setSaved(true)}>
          <Text style={[s.bottomText, saved && s.bottomActive]}>▱ Đã lưu</Text>
        </Pressable>
      </View>
      <Modal
        visible={screen !== null}
        animationType="slide"
        onRequestClose={() => setScreen(null)}
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={s.safe}>
          <KeyboardAvoidingView
            style={s.flex}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>
                {screen === "auth"
                  ? "Về xóm thôi 👋"
                  : screen === "create"
                    ? "Có chuyện gì vui?"
                    : "Cả xóm nói gì?"}
              </Text>
              <Pressable
                accessibilityLabel="Đóng"
                onPress={() => setScreen(null)}
              >
                <Text style={s.close}>×</Text>
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={s.modalBody}
              keyboardShouldPersistTaps="handled"
            >
              {screen === "auth" && (
                <>
                  {api.mode === "demo" ? (
                    <>
                      <Text style={s.description}>
                        Dùng hồ sơ minh họa để thử các tính năng. Không cần nhập
                        thông tin cá nhân.
                      </Text>
                      <Button
                        label="Dùng hồ sơ trải nghiệm"
                        busy={busy}
                        onPress={() =>
                          void perform(async () => {
                            setUser(await api.signIn("", ""));
                            setScreen(null);
                          })
                        }
                      />
                    </>
                  ) : (
                    <>
                      {signUp && (
                        <TextInput
                          placeholder="Tên hiển thị"
                          style={s.input}
                          value={name}
                          onChangeText={setName}
                          maxLength={40}
                        />
                      )}
                      <TextInput
                        placeholder="Email"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoComplete="email"
                        style={s.input}
                        value={email}
                        onChangeText={setEmail}
                      />
                      <TextInput
                        placeholder="Mật khẩu (từ 12 ký tự)"
                        secureTextEntry
                        autoCapitalize="none"
                        style={s.input}
                        value={password}
                        onChangeText={setPassword}
                        maxLength={72}
                      />
                      <Button
                        label={signUp ? "Gia nhập xóm" : "Đăng nhập"}
                        busy={busy}
                        onPress={() =>
                          void perform(async () => {
                            setUser(
                              signUp
                                ? await api.signUp(name, email, password)
                                : await api.signIn(email, password),
                            );
                            setPassword("");
                            setScreen(null);
                            await load();
                          })
                        }
                      />
                      <Pressable onPress={() => setSignUp(!signUp)}>
                        <Text style={s.switchAuth}>
                          {signUp
                            ? "Đã có tài khoản? Đăng nhập"
                            : "Chưa có tài khoản? Đăng ký"}
                        </Text>
                      </Pressable>
                    </>
                  )}
                </>
              )}
              {screen === "create" && (
                <>
                  <TextInput
                    placeholder="Tiêu đề câu chuyện"
                    style={s.input}
                    value={title}
                    onChangeText={setTitle}
                    maxLength={200}
                  />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {TOPICS.map((t) => (
                      <Pressable
                        key={t.slug}
                        style={[s.chip, createTopic === t.slug && s.chipActive]}
                        onPress={() => setCreateTopic(t.slug)}
                      >
                        <Text>
                          {t.emoji} {t.name}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                  <TextInput
                    placeholder="Nội dung (không bắt buộc)"
                    multiline
                    style={[s.input, s.textarea]}
                    value={body}
                    onChangeText={setBody}
                    maxLength={5000}
                  />
                  <TextInput
                    placeholder="Liên kết ảnh HTTPS (không bắt buộc)"
                    style={s.input}
                    value={imageUrl}
                    onChangeText={setImageUrl}
                    autoCapitalize="none"
                  />
                  <Button
                    label="Góp vui cho xóm"
                    busy={busy}
                    onPress={() =>
                      void perform(async () => {
                        if (imageUrl && !imageUrl.startsWith("https://"))
                          throw new Error(
                            "Liên kết ảnh cần bắt đầu bằng https://",
                          );
                        await api.createPost({
                          title,
                          body,
                          topicSlug: createTopic,
                          imageUrl: imageUrl || undefined,
                        });
                        setTitle("");
                        setBody("");
                        setImageUrl("");
                        setScreen(null);
                        setSaved(false);
                        setSort("new");
                        setTopic(undefined);
                        await load();
                      })
                    }
                  />
                </>
              )}
              {screen === "comments" && (
                <>
                  <Text style={s.postTitle}>{activePost?.title}</Text>
                  {busy && <ActivityIndicator />}
                  {comments.map((comment) => (
                    <View key={comment.id} style={s.comment}>
                      <Text style={s.author}>
                        {comment.author.avatar} {comment.author.name}
                      </Text>
                      <Text style={s.commentBody}>{comment.body}</Text>
                    </View>
                  ))}
                  {!busy && !comments.length && (
                    <Text style={s.description}>Bạn mở lời trước nhé!</Text>
                  )}
                  {user ? (
                    <>
                      <TextInput
                        style={[s.input, s.textarea]}
                        value={text}
                        onChangeText={setText}
                        placeholder="Góp một câu chuyện vui..."
                        multiline
                        maxLength={2000}
                      />
                      <Button
                        label="Gửi bình luận"
                        busy={busy}
                        onPress={() =>
                          void perform(async () => {
                            if (!activePost) return;
                            const comment = await api.comment(
                              activePost.id,
                              text,
                            );
                            setComments((v) => [...v, comment]);
                            update(await api.post(activePost.id));
                            setText("");
                          })
                        }
                      />
                    </>
                  ) : (
                    <Button
                      label="Đăng nhập để góp chuyện"
                      onPress={() => setScreen("auth")}
                    />
                  )}
                </>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
function Button({
  label,
  onPress,
  busy,
}: {
  label: string;
  onPress(): void;
  busy?: boolean;
}) {
  return (
    <Pressable disabled={busy} style={s.button} onPress={onPress}>
      {busy ? (
        <ActivityIndicator color="#292f21" />
      ) : (
        <Text style={s.buttonText}>{label}</Text>
      )}
    </Pressable>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8f9f5" },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderBottomColor: "#e8ebdf",
    borderBottomWidth: 1,
  },
  logo: {
    fontSize: 39,
    fontWeight: "900",
    letterSpacing: -2,
    color: "#262b20",
  },
  logoDot: { color: "#e6ba2f" },
  login: { backgroundColor: "#ffdb55", padding: 11, borderRadius: 8 },
  loginText: { fontSize: 14, fontWeight: "600" },
  feed: { padding: 15 },
  eyebrow: { fontSize: 12, color: "#899478", letterSpacing: 1, marginTop: 10 },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -1,
    marginTop: 10,
    marginBottom: 17,
    color: "#292e21",
  },
  searchRow: { flexDirection: "row", gap: 8 },
  searchButton: {
    backgroundColor: "#ecefdf",
    padding: 13,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  input: {
    borderWidth: 1,
    borderColor: "#dfe5d4",
    borderRadius: 9,
    padding: 13,
    backgroundColor: "#fff",
    fontSize: 15,
    marginBottom: 13,
    color: "#292f21",
  },
  tabs: { flexDirection: "row", gap: 8, marginBottom: 16 },
  tab: { padding: 11, borderRadius: 8 },
  tabActive: { backgroundColor: "#2b3124" },
  tabText: { fontSize: 14, color: "#6f7c5d" },
  tabTextActive: { color: "#fff", fontWeight: "600" },
  chips: { marginBottom: 15 },
  chip: {
    padding: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e4e8da",
    borderRadius: 8,
    marginRight: 7,
  },
  chipActive: { backgroundColor: "#fff0b5", borderColor: "#e5cf70" },
  demo: { fontSize: 12, color: "#8b947c", marginBottom: 15 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 13,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e1e6d7",
    marginBottom: 19,
  },
  postPadding: { padding: 17 },
  author: { fontSize: 13, fontWeight: "600", color: "#74825f" },
  postTitle: {
    fontSize: 19,
    fontWeight: "700",
    lineHeight: 29,
    marginVertical: 11,
    color: "#2a3021",
  },
  meta: { fontSize: 12, color: "#94a07f" },
  image: { width: "100%", aspectRatio: 1.2 },
  textPost: {
    fontSize: 21,
    lineHeight: 35,
    padding: 26,
    backgroundColor: "#fff3c5",
    color: "#383e2b",
  },
  actions: { padding: 12, flexDirection: "row", gap: 12, alignItems: "center" },
  action: { fontSize: 15, padding: 6, color: "#71815a" },
  voted: { color: "#987107", fontWeight: "800" },
  saveAction: { marginLeft: "auto" },
  empty: {
    padding: 35,
    textAlign: "center",
    fontSize: 15,
    lineHeight: 25,
    color: "#7c8b67",
  },
  error: { color: "#ac4230", fontSize: 14, padding: 15 },
  more: {
    padding: 18,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    padding: 9,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e4e8dc",
  },
  bottomText: { fontSize: 14, color: "#92a07f" },
  bottomActive: { color: "#343f26", fontWeight: "700" },
  compose: {
    backgroundColor: "#ffdb55",
    width: 48,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
  },
  composeText: { fontSize: 29 },
  modalHeader: {
    padding: 21,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: { fontSize: 24, fontWeight: "800", color: "#2d3523" },
  close: { fontSize: 31, color: "#81936a" },
  modalBody: { padding: 21, paddingBottom: 50 },
  description: {
    fontSize: 16,
    lineHeight: 26,
    color: "#879572",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#ffdb55",
    borderRadius: 9,
    padding: 15,
    alignItems: "center",
    marginVertical: 12,
  },
  buttonText: { fontSize: 16, fontWeight: "700", color: "#343b29" },
  textarea: { minHeight: 110, textAlignVertical: "top", marginTop: 15 },
  switchAuth: {
    textAlign: "center",
    fontSize: 14,
    marginTop: 14,
    color: "#8d7e3b",
  },
  comment: {
    borderBottomWidth: 1,
    borderColor: "#e3e8d9",
    paddingVertical: 16,
  },
  commentBody: { fontSize: 16, lineHeight: 26, marginTop: 9, color: "#37452b" },
});
