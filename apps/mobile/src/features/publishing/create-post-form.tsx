import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput } from "react-native";
import { TOPICS, type PublishingApi } from "@xom/api-client";
import { Button } from "../../ui/button";
import { s } from "../../ui/styles";
export function CreatePostForm({
  api,
  onCreated,
}: {
  api: PublishingApi;
  onCreated(): void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [topic, setTopic] = useState("hai-huoc");
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (busy) return;
    setBusy(true);
    try {
      if (imageUrl && !imageUrl.startsWith("https://"))
        throw new Error("Liên kết ảnh cần bắt đầu bằng https://");
      await api.createPost({
        title,
        body,
        topicSlug: topic,
        imageUrl: imageUrl || undefined,
      });
      onCreated();
    } catch (error) {
      Alert.alert(
        "Chưa đăng được",
        error instanceof Error ? error.message : "Bạn thử lại nhé.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <TextInput
        accessibilityLabel="Tiêu đề câu chuyện"
        placeholder="Tiêu đề câu chuyện"
        style={s.input}
        value={title}
        onChangeText={setTitle}
        maxLength={200}
        editable={!busy}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {TOPICS.map((item) => (
          <Pressable
            key={item.slug}
            disabled={busy}
            style={[s.chip, topic === item.slug && s.chipActive]}
            onPress={() => setTopic(item.slug)}
          >
            <Text>
              {item.emoji} {item.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <TextInput
        accessibilityLabel="Nội dung"
        placeholder="Nội dung (không bắt buộc)"
        multiline
        style={[s.input, s.textarea]}
        value={body}
        onChangeText={setBody}
        maxLength={5000}
        editable={!busy}
      />
      <TextInput
        accessibilityLabel="Liên kết ảnh"
        placeholder="Liên kết ảnh HTTPS (không bắt buộc)"
        style={s.input}
        value={imageUrl}
        onChangeText={setImageUrl}
        autoCapitalize="none"
        editable={!busy}
      />
      <Button
        label="Góp vui cho xóm"
        busy={busy}
        onPress={() => void submit()}
      />
    </>
  );
}
