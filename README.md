# Xóm — cộng đồng meme Việt

MVP khởi đầu cho sản phẩm lấy cảm hứng từ trải nghiệm bảng tin của 9GAG, có thương hiệu và nội dung minh họa riêng. Backend **Ruby on Rails**, web **Next.js**, mobile **React Native / Expo**, dùng chung hợp đồng API bằng TypeScript.

**Bản xem trước hiện chạy chế độ demo trong bộ nhớ. Rails API đã có mã nguồn nhưng chưa được triển khai. Đây chưa phải một mạng xã hội production.** Bài đăng và tương tác demo mất khi tải lại trang hoặc khởi động lại ứng dụng. Không nhập dữ liệu cá nhân thật vào bản minh họa.

## Điểm bắt đầu

| Đường dẫn | Vai trò |
| --- | --- |
| `apps/api` | Rails API; PostgreSQL; xác thực; nghiệp vụ; kiểm duyệt; outbox |
| `apps/web` | Next.js + React + TypeScript; feed và các luồng cộng đồng |
| `apps/mobile` | React Native / Expo; feed, đăng nhập, đăng bài, bình luận, lưu bài |
| `packages/api-client` | Kiểu dữ liệu, interface `CommunityApi`, HTTP adapter và demo adapter |
| `docs/architecture.md` | Ranh giới module, SOLID, dữ liệu, concurrency, lộ trình microservices |
| `docs/openapi.yaml` | Hợp đồng REST API v1 |
| `docs/verification.md` | Những gì đã kiểm tra và những gì chưa thể xác nhận |
| `compose.yml` | PostgreSQL, Redis, Rails API, Sidekiq; relay theo profile riêng |

## Chạy web demo

Cần Node.js 22 trở lên. Chạy tại thư mục gốc:

```bash
npm ci
npm run dev
```

Mở `http://localhost:4173`. Chọn **Đăng nhập → Dùng hồ sơ trải nghiệm** để thử đăng bài, bình chọn và bình luận. Không tạo tài khoản thật trong chế độ này.

```bash
npm test
npm run typecheck
npm run check:ruby
npm run build
```

`check:ruby` dùng Prism để kiểm tra cú pháp; không thay thế kiểm thử Rails. Mặc định web xuất file tĩnh vào `out/`. `WEB_OUTPUT=server` cho phép build Next.js để triển khai bằng Node, tuy nhiên chưa có SSR feed hoặc trang SEO riêng cho từng bài.

## Chạy Rails API bằng Docker

Tại thư mục gốc, trên Docker Desktop hoặc Docker Engine:

```bash
docker compose up --build -d
docker compose logs -f api
```

API ở `http://localhost:3001`, kiểm tra sống tại `/up`. Khi `db:prepare` tạo DB lần đầu, seed tạo 6 chủ đề; không có user hay mật khẩu mặc định. Có thể chạy lại seed an toàn:

```bash
docker compose exec api bundle exec rails db:seed
```

Tạo `apps/web/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Khởi động lại `npm run dev`, đăng ký tài khoản bằng giao diện rồi đăng bài. Khi biến API được thiết lập, web dùng API thật và **không âm thầm chuyển sang demo khi API lỗi**.

```bash
docker compose exec -e RAILS_ENV=test api bundle exec rails db:prepare
docker compose exec -e RAILS_ENV=test api bundle exec rails zeitwerk:check
docker compose exec -e RAILS_ENV=test api bundle exec rails test
```

Chạy Rails trực tiếp cũng được: cài Ruby 3.4, PostgreSQL 17, Redis 7, vào `apps/api`, `bundle install`, xuất các biến môi trường, rồi `bundle exec rails db:prepare` và `bundle exec rails s -p 3001`. Rails không tự đọc `.env.example`; dùng shell hoặc cơ chế quản lý secret của nơi triển khai. Chốt `Gemfile.lock` sau lần `bundle install` đầu tiên và commit nó trước khi triển khai thực tế.

## Chạy mobile

Mobile có lockfile riêng để quản lý chính xác phiên bản React Native đi cùng Expo; shared package được liên kết qua `file:`.

```bash
cd apps/mobile
npm ci
npx expo start
```

Không đặt biến API: chạy demo với ảnh đóng gói trong app. Để dùng Rails thật, tạo `apps/mobile/.env`:

```dotenv
EXPO_PUBLIC_API_URL=http://10.0.2.2:3001
```

`10.0.2.2` dùng cho Android emulator. iOS Simulator trên macOS dùng `localhost`; điện thoại thật dùng IP LAN của máy chạy Rails và cùng mạng. Production phải dùng HTTPS. Web dùng cookie HttpOnly; mobile dùng token trong Expo SecureStore. Không đưa token vào AsyncStorage.

Mã mobile có đăng bài văn bản hoặc liên kết ảnh HTTPS. Chọn ảnh từ thư viện điện thoại, quay video và push notification chưa có. Bundle Android đã export, chưa build APK/IPA hoặc kiểm thử trên thiết bị.

## Nội dung có trong MVP

- Feed Hot / Top / Mới, lọc chủ đề, tìm kiếm, khoảng thời gian, phân trang.
- Đăng ký, đăng nhập, đăng xuất, session có hạn và có thể thu hồi.
- Tạo bài văn bản / ảnh; web hỗ trợ upload tối đa 8 MB; xóa bài qua API với kiểm tra chủ sở hữu.
- Upvote/downvote theo giá trị tuyệt đối, chống trùng ở DB, có thể đổi hoặc bỏ vote.
- Bình luận (API v1 hiện trả tối đa 100 bình luận đầu), bookmark.
- Báo cáo nội dung và API kiểm duyệt dành riêng cho moderator/admin. Chưa có màn hình quản trị.
- Outbox ghi trong transaction; adapter gửi sự kiện qua webhook có chữ ký HMAC, xử lý ít nhất một lần.
- Cấu hình Sidekiq, local storage hoặc S3/R2, CI cho web/Rails/mobile.

## Trước khi mở cộng đồng thật

Chạy toàn bộ kiểm thử Rails và kiểm thử tích hợp web/mobile với PostgreSQL thật; khóa phiên bản gem; thiết lập domain HTTPS và cookie cùng site; bổ sung khôi phục mật khẩu/xác minh email, quy trình kiểm duyệt, xóa/purge ảnh khỏi CDN, backup/restore và theo dõi lỗi. Thêm phân trang bình luận, trang chi tiết có SSR/SEO, pipeline xử lý ảnh/video và kiểm thử tải theo nhu cầu. Các hạng mục này có trong lộ trình, chưa được quảng cáo là đã hoạt động.

Thiết kế gốc tham khảo: [9GAG Top](https://9gag.com/top). Hướng dẫn nền tảng: [Rails API-only](https://guides.rubyonrails.org/api_app.html), [Next.js](https://nextjs.org/docs), [Expo](https://docs.expo.dev/). Ảnh minh họa và giấy phép tại `docs/assets.md`.
