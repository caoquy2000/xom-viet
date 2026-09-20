export function registrationError(
  name: string,
  email: string,
  password: string,
  confirmation: string,
): string | null {
  if (name.trim().length < 2 || name.trim().length > 40)
    return "Tên hiển thị cần từ 2 đến 40 ký tự.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    return "Bạn nhập một địa chỉ email hợp lệ nhé.";
  if ([...password].length < 12) return "Mật khẩu cần ít nhất 12 ký tự.";
  // BCrypt limits UTF-8 bytes, not JavaScript string length. Also works in React Native.
  if (encodeURIComponent(password).replace(/%[A-F\d]{2}/gi, "_").length > 72)
    return "Mật khẩu quá dài (tối đa 72 byte).";
  if (password !== confirmation) return "Hai mật khẩu chưa khớp nhau.";
  return null;
}
