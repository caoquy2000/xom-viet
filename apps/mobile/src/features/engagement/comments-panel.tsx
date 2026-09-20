import { useEffect, useState } from "react";
import { ActivityIndicator, Text, TextInput, View } from "react-native";
import type {
  Comment,
  Post,
  User,
  EngagementApi,
  FeedApi,
} from "@xom/api-client";
import { Button } from "../../ui/button";
import { s } from "../../ui/styles";
type Props = {
  api: Pick<EngagementApi, "comments" | "comment"> & Pick<FeedApi, "post">;
  post: Post;
  user: User | null;
  onUpdated(post: Post): void;
  onLogin(): void;
};
export function CommentsPanel({ api, post, user, onUpdated, onLogin }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void api
      .comments(post.id)
      .then((data) => {
        if (active) setComments(data);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [api, post.id]);
  async function submit() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const comment = await api.comment(post.id, body);
      setComments((items) => [...items, comment]);
      setBody("");
      onUpdated(await api.post(post.id));
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Không thể gửi bình luận.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Text style={s.postTitle}>{post.title}</Text>
      {loading && <ActivityIndicator />}
      {comments.map((comment) => (
        <View key={comment.id} style={s.comment}>
          <Text style={s.author}>
            {comment.author.avatar} {comment.author.name}
          </Text>
          <Text style={s.commentBody}>{comment.body}</Text>
        </View>
      ))}
      {!loading && !comments.length && (
        <Text style={s.description}>Bạn mở lời trước nhé!</Text>
      )}
      {!!error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}
      {user ? (
        <>
          <TextInput
            accessibilityLabel="Bình luận"
            style={[s.input, s.textarea]}
            value={body}
            onChangeText={setBody}
            placeholder="Góp một câu chuyện vui..."
            multiline
            maxLength={2000}
            editable={!busy}
          />
          <Button
            label="Gửi bình luận"
            busy={busy}
            onPress={() => void submit()}
          />
        </>
      ) : (
        <Button label="Đăng nhập để góp chuyện" onPress={onLogin} />
      )}
    </>
  );
}
