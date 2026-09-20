export const formatCount = (n: number) =>
  Math.abs(n) >= 1000
    ? `${(n / 1000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}k`
    : n.toLocaleString("vi-VN");
export function timeAgo(date: string) {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(date).getTime()) / 60000),
  );
  return minutes < 1
    ? "Vừa xong"
    : minutes < 60
      ? `${minutes} phút trước`
      : minutes < 1440
        ? `${Math.floor(minutes / 60)} giờ trước`
        : `${Math.floor(minutes / 1440)} ngày trước`;
}
