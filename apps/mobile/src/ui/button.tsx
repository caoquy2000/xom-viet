import { ActivityIndicator, Pressable, Text } from "react-native";
import { s } from "./styles";
export function Button({
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
