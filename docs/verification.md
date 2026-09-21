# Kết quả kiểm tra

CI ngày 20/09/2026: [kết quả Rails, web và mobile](https://github.com/caoquy2000/xom-viet/actions/runs/35544737023).

| Hạng mục                                      | Kết quả                                                |
| --------------------------------------------- | ------------------------------------------------------ |
| Rails trên Ruby 3.4 + PostgreSQL 18 + Redis 7 | 16 tests, 89 assertions, không lỗi                     |
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

Chưa thực hiện kiểm thử trên thiết bị iOS/Android, APK/IPA, load test hoặc backup/restore tự động.

## Backend live — 21/09/2026

Railway xác nhận Rails, PostgreSQL 18 và Redis 7 đều `SUCCESS`. Healthcheck `/up` trả 200. PostgreSQL, Redis và ảnh tải lên có ba volume riêng, mỗi volume 500 MB; database chỉ dùng mạng nội bộ.

`scripts/smoke-accounts.mjs` đã đạt 15 kiểm tra HTTP trên backend live: health, đọc chủ đề, từ chối request Origin lạ, đăng ký web/native, khôi phục phiên, login sai/đúng, xoay phiên, logout và phân tách hai user. Kiểm tra đồng thời xác nhận cookie Secure/HttpOnly/SameSite=Lax, response no-store và không trả token web trong JSON. Hai tài khoản kiểm thử dùng địa chỉ `example.invalid`; tất cả phiên kiểm thử đã được thu hồi. Không tạo bài viết thử trên feed.

Chạy lại thủ công bằng `SMOKE_API_ORIGIN=<Rails HTTPS origin> SMOKE_WEB_ORIGIN=<web HTTPS origin> node scripts/smoke-accounts.mjs`. Mỗi lần chạy tạo hai tài khoản kiểm thử mới, vì vậy không tự động chạy trên mỗi deploy.
