# Kết quả kiểm tra

Ngày 20/09/2026. Bằng chứng CI: [GitHub Actions](https://github.com/caoquy2000/xom-viet/actions).

| Hạng mục                                      | Kết quả                                                |
| --------------------------------------------- | ------------------------------------------------------ |
| Rails trên Ruby 3.4 + PostgreSQL 17 + Redis 7 | 16 tests, 89 assertions, không lỗi                     |
| Rails boot, migration, Zeitwerk               | Đạt trong GitHub Actions                               |
| Brakeman                                      | 0 security warnings                                    |
| Client và gateway                             | 15 tests đạt                                           |
| TypeScript web và mobile                      | Đạt                                                    |
| Next.js production build                      | Đạt, static export + Worker gateway                    |
| Android Expo/Hermes export                    | Đạt trong GitHub Actions; chưa phải APK                |
| Ruby syntax                                   | 66 file qua Prism; không thay thế Rails runtime tests  |
| Giao diện                                     | Đã kiểm tra bố cục và dialog đăng ký trong trình duyệt |

Kiểm thử tài khoản gồm BCrypt, xác nhận mật khẩu, Unicode vượt 72 bytes, email trùng/chuẩn hóa, login sai, cookie HttpOnly/SameSite, session hết hạn, logout thu hồi token, xoay phiên khi đổi user và phân tách bookmark. Transaction tạo user/phiên được kiểm tra rollback khi lưu phiên thất bại. Client kiểm tra request restore cũ, auth chạy đồng thời, logout lỗi mạng, 401 khác 5xx và xóa SecureStore đúng lúc.

Kiểm thử gateway xác nhận cookie/identity của Sites không bị gửi sang Rails, cookie phiên được giữ, write từ Origin lạ bị chặn và API lỗi không chuyển sang demo. CI cũng kiểm tra phân trang, quyền xóa, quyền kiểm duyệt, vote idempotent và rollback outbox.

Lỗi thực tế đã sửa: JSON 3 không còn nhận positional options từ Rails 8.1, làm JSON request trả 400 và đọc cursor lỗi. `Gemfile` giới hạn JSON major 2; `Gemfile.lock` khóa bộ dependency đã qua CI.

Chưa thực hiện kiểm thử trên thiết bị iOS/Android, APK/IPA, load test hoặc backup/restore tự động. Kết quả deploy và smoke test live được ghi nhận sau khi hosting xác nhận thành công; CI đạt không đồng nghĩa hạ tầng đã chạy.
