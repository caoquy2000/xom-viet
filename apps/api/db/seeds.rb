topics = [
  ["hai-huoc", "Hài hước", "😂", "Một chiếc meme, một ngày vui."],
  ["thu-cung", "Thú cưng", "🐈", "Hội những người bị boss thao túng."],
  ["doi-song", "Đời sống", "☕", "Chuyện nhỏ mỗi ngày, kể cả xóm nghe."],
  ["gaming", "Gaming", "🎮", "Thắng thì gáy, thua thì… mạng lag."],
  ["cong-nghe", "Công nghệ", "💻", "Code, đồ công nghệ và những cú crash."],
  ["am-thuc", "Ẩm thực", "🍜", "Đói thì vào, no rồi vẫn vào."]
]
topics.each_with_index do |(slug, name, emoji, description), index|
  Publishing::Topic.find_or_initialize_by(slug: slug).update!(name: name, emoji: emoji, description: description, position: index)
end
puts "Đã tạo hoặc cập nhật #{topics.length} chủ đề. Tạo tài khoản bằng giao diện hoặc API; không có tài khoản mặc định."
