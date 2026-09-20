# Kết quả kiểm tra

Kiểm tra ngày 19/09/2026. Không đánh đồng kiểm tra cú pháp hoặc tạo bundle với việc vận hành toàn bộ hệ thống.

| Hạng mục | Kết quả |
| --- | --- |
| Next.js production build/static export | Đã thành công với Next.js 16.3.5 |
| TypeScript web | Đã qua |
| TypeScript mobile | Đã qua |
| Shared API tests | 5/5: idempotent votes, auth guard, publish/comment/bookmark/search, xử lý HTTP failure, native token/logout |
| Ruby syntax | 56 file Ruby qua Prism; không có lỗi cú pháp |
| Ruby domain contracts | Đã thực thi hai use case bằng Ruby 3.4 WebAssembly: vote retry/reverse/clear/invalid, chuẩn hóa/kiểm tra post và ghi event |
| Android JavaScript/Hermes export | Thành công, 594 modules; chưa phải APK |
| Giao diện desktop | Đã quan sát bảng tin, ảnh và bộ lọc trong trình duyệt |
| WebMCP | Đã feature-detect và đăng ký khi được hỗ trợ; môi trường kiểm tra không có modelContext, chưa kiểm thử lời gọi |
| Rails boot, migration, PostgreSQL integration tests | Chưa thực thi trong môi trường này: không có Ruby native, PostgreSQL hoặc Docker; đã có test và CI để chạy trên môi trường phù hợp |
| iOS/Android device QA, APK/IPA | Chưa thực hiện |
| Load/concurrency benchmark, production deployment Rails/S3/Redis | Chưa thực hiện |

Các test Rails đi kèm kiểm tra auth/origin, quyền xóa, quyền kiểm duyệt, signed cursor, unique vote, retry vote và rollback khi outbox ghi lỗi. Chúng chưa được báo là pass. Chạy các lệnh trong README để xác nhận trên PostgreSQL thật. Ruby WASM domain checks không kiểm tra ActiveRecord, lock DB, hệ thống file media hoặc kết nối network.

Web dùng Next.js Pages Router để giữ đường xuất tĩnh đơn giản. Client logic nằm ngoài router. Không sử dụng Vinext thay thế Next.js. Trải nghiệm hiện được render phía client, chưa có SSR/SEO cho từng bài; đó là hạng mục tiếp theo khi triển khai Rails thật.

Bản kiểm tra nội bộ phục vụ đúng static export, vì Next.js dev có thể bị kẹt ở bước tải client trong môi trường này. Lệnh npm run dev thông thường vẫn sử dụng Next.js dev. Kết quả build/test nằm ở trên là các kiểm tra thực sự đã hoàn tất; xem bản triển khai để thử các luồng demo, dữ liệu không tồn tại sau reload.
