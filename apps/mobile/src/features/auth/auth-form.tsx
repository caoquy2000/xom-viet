import { useState } from "react";
import { Pressable, Text, TextInput } from "react-native";
import { registrationError } from "@xom/api-client";
import { useServices, useSession } from "../../providers/app-provider";
import { Button } from "../../ui/button";
import { s } from "../../ui/styles";
export function AuthForm({ onSuccess }: { onSuccess(): void }) {
  const { api } = useServices();
  const { busy, session } = useSession();
  const [registering, setRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  async function submit() {
    const invalid = registering
      ? registrationError(name, email, password, confirmation)
      : null;
    setError(invalid ?? "");
    if (invalid) return;
    try {
      if (registering)
        await session.signUp(name.trim(), email.trim(), password, confirmation);
      else await session.signIn(email.trim(), password);
      setPassword("");
      setConfirmation("");
      onSuccess();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Không thể đăng nhập.");
    }
  }
  if (api.mode === "demo")
    return (
      <>
        <Text style={s.description}>
          Bản trải nghiệm chưa kết nối máy chủ tài khoản. Hồ sơ demo sẽ mất khi
          khởi động lại.
        </Text>
        <Button
          label="Dùng hồ sơ trải nghiệm"
          busy={busy}
          onPress={() => {
            void session
              .signIn("", "")
              .then(onSuccess)
              .catch((e) => setError(e.message));
          }}
        />
        {!!error && (
          <Text accessibilityRole="alert" style={s.error}>
            {error}
          </Text>
        )}
      </>
    );
  return (
    <>
      {registering && (
        <TextInput
          accessibilityLabel="Tên hiển thị"
          placeholder="Tên hiển thị"
          style={s.input}
          value={name}
          onChangeText={setName}
          maxLength={40}
          editable={!busy}
        />
      )}
      <TextInput
        accessibilityLabel="Email"
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        style={s.input}
        value={email}
        onChangeText={setEmail}
        maxLength={254}
        editable={!busy}
      />
      <TextInput
        accessibilityLabel="Mật khẩu"
        placeholder={registering ? "Mật khẩu (ít nhất 12 ký tự)" : "Mật khẩu"}
        secureTextEntry
        autoCapitalize="none"
        autoComplete={registering ? "new-password" : "current-password"}
        style={s.input}
        value={password}
        onChangeText={setPassword}
        editable={!busy}
      />
      {registering && (
        <TextInput
          accessibilityLabel="Nhập lại mật khẩu"
          placeholder="Nhập lại mật khẩu"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          style={s.input}
          value={confirmation}
          onChangeText={setConfirmation}
          editable={!busy}
        />
      )}
      {!!error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}
      <Button
        label={registering ? "Tạo tài khoản" : "Đăng nhập"}
        busy={busy}
        onPress={() => void submit()}
      />
      <Pressable
        disabled={busy}
        onPress={() => {
          setRegistering(!registering);
          setPassword("");
          setConfirmation("");
          setError("");
        }}
      >
        <Text style={s.switchAuth}>
          {registering
            ? "Đã có tài khoản? Đăng nhập"
            : "Chưa có tài khoản? Đăng ký"}
        </Text>
      </Pressable>
    </>
  );
}
