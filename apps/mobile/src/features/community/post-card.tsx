import { Image, Pressable, Text, View } from "react-native";
import { TOPICS, type Post, type VoteValue } from "@xom/api-client";
import { s } from "../../ui/styles";
const images: Record<string, number> = {
  "/images/cat.jpg": require("../../../../web/public/images/cat.jpg"),
  "/images/capybara.jpg": require("../../../../web/public/images/capybara.jpg"),
  "/images/street.jpg": require("../../../../web/public/images/street.jpg"),
};
type Props = {
  post: Post;
  busy: boolean;
  onVote(value: VoteValue): void;
  onSave(): void;
  onComments(): void;
};
export function PostCard({ post, busy, onVote, onSave, onComments }: Props) {
  return (
    <View style={s.card}>
      <View style={s.postPadding}>
        <Text style={s.author}>
          {post.author.avatar} {post.author.name}
        </Text>
        <Pressable onPress={onComments}>
          <Text style={s.postTitle}>{post.title}</Text>
        </Pressable>
        <Text style={s.meta}>
          {TOPICS.find((t) => t.slug === post.topicSlug)?.name}
        </Text>
      </View>
      {post.imageUrl ? (
        <Image
          source={images[post.imageUrl] || { uri: post.imageUrl }}
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
          onPress={() => onVote(post.viewerVote === 1 ? 0 : 1)}
        >
          <Text style={[s.action, post.viewerVote === 1 && s.voted]}>
            ↑ {post.score}
          </Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Không thích"
          disabled={busy}
          onPress={() => onVote(post.viewerVote === -1 ? 0 : -1)}
        >
          <Text style={[s.action, post.viewerVote === -1 && s.voted]}>↓</Text>
        </Pressable>
        <Pressable onPress={onComments}>
          <Text style={s.action}>◯ {post.commentCount}</Text>
        </Pressable>
        <Pressable style={s.saveAction} disabled={busy} onPress={onSave}>
          <Text style={[s.action, post.saved && s.voted]}>
            {post.saved ? "Đã lưu" : "Lưu"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
