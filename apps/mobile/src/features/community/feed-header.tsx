import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { TOPICS, type FeedQuery, type FeedSort } from "@xom/api-client";
import { s } from "../../ui/styles";
type Props = {
  query: FeedQuery;
  search: string;
  mode: "live" | "demo";
  error: string;
  onSearch(value: string): void;
  onSubmitSearch(): void;
  onSort(sort: FeedSort): void;
  onTopic(slug?: string): void;
  onRetry(): void;
};
export function FeedHeader({
  query,
  search,
  mode,
  error,
  onSearch,
  onSubmitSearch,
  onSort,
  onTopic,
  onRetry,
}: Props) {
  return (
    <>
      <Text style={s.eyebrow}>GÓC VUI CỦA NGƯỜI VIỆT</Text>
      <Text style={s.heading}>
        {query.saved ? "Để dành xem sau" : "Hôm nay có gì vui? ✳"}
      </Text>
      <View style={s.searchRow}>
        <TextInput
          accessibilityLabel="Tìm chuyện trong xóm"
          style={[s.input, s.flex]}
          placeholder="Tìm chuyện trong xóm..."
          value={search}
          onChangeText={onSearch}
          onSubmitEditing={onSubmitSearch}
          returnKeyType="search"
        />
        <Pressable style={s.searchButton} onPress={onSubmitSearch}>
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
            style={[s.tab, query.sort === value && s.tabActive]}
            onPress={() => onSort(value)}
          >
            <Text style={[s.tabText, query.sort === value && s.tabTextActive]}>
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
          style={[s.chip, !query.topic && s.chipActive]}
          onPress={() => onTopic()}
        >
          <Text>Tất cả</Text>
        </Pressable>
        {TOPICS.map((topic) => (
          <Pressable
            key={topic.slug}
            style={[s.chip, query.topic === topic.slug && s.chipActive]}
            onPress={() => onTopic(topic.slug)}
          >
            <Text>
              {topic.emoji} {topic.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {mode === "demo" && (
        <Text style={s.demo}>
          Bản trải nghiệm · Dữ liệu đặt lại khi khởi động
        </Text>
      )}
      {!!error && (
        <Pressable onPress={onRetry}>
          <Text accessibilityRole="alert" style={s.error}>
            {error} Nhấn để thử lại.
          </Text>
        </Pressable>
      )}
    </>
  );
}
