# Triển khai Xóm

## Thành phần

- Next.js được build tĩnh và phục vụ trên Sites.
- `infrastructure/sites/gateway.mjs` chuyển `/api/v1/*` tới Rails trên Railway; chỉ chuyển cookie `xom_session`, không chuyển thông tin đăng nhập Sites.
- Rails dùng PostgreSQL, Redis private network và một persistent volume ở `/app/storage`.
- Mobile đặt `EXPO_PUBLIC_API_URL` bằng HTTPS origin của Rails; token nằm trong SecureStore.

Nguồn cấu hình upstream công khai: `infrastructure/sites/deployment.json`. Đây không phải credential. Không đưa password, database URL chứa password, cookie hoặc `SECRET_KEY_BASE` vào Git.

## Rails trên Railway

Chọn repo `caoquy2000/xom-viet`, root `/apps/api`, Dockerfile `Dockerfile`. Production theo dõi nhánh `main` sau khi CI đạt.

| Thiết lập   | Giá trị                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------- |
| Start       | `bundle exec puma -C config/puma.rb`                                                              |
| Pre-deploy  | `bundle exec rails db:prepare`                                                                    |
| Healthcheck | `/up`, timeout 120 giây                                                                           |
| Port        | `3001`                                                                                            |
| Variables   | `RAILS_ENV=production`, `API_HOST`, `WEB_ORIGINS`, `DATABASE_URL`, `REDIS_URL`, `SECRET_KEY_BASE` |
| Storage     | `STORAGE_SERVICE=local`, persistent volume `/app/storage`                                         |

`DATABASE_URL` và `REDIS_URL` tham chiếu credentials do Railway quản lý. PostgreSQL 18 dùng volume `/var/lib/postgresql/data`, `PGDATA=/var/lib/postgresql/data/pgdata`. Redis 7 bật AOF và requirepass; database không có public domain/TCP proxy. Docker entrypoint khởi tạo quyền volume rồi chạy bằng user `xom`.

`WEB_ORIGINS` phải khớp origin web HTTPS chính xác. Không thêm wildcard. `/up` được miễn kiểm tra Host để probe nội bộ hoạt động; các API khác vẫn kiểm tra Host.

## Web

```bash
npm ci
npm test
npm run build
```

Build đặt `NEXT_PUBLIC_API_URL` thành chuỗi rỗng để client gọi cùng origin. `dist/server/index.js` là Worker ESM; `dist/client` chứa Next.js export và assets; `dist/.openai/hosting.json` giữ project ID. API lỗi trả lỗi thật, không tự chuyển thành tài khoản demo.

Publish bằng Sites với đúng commit đã push và archive được tạo từ commit đó. Giữ nguyên quyền xem hiện có của Site. Cổng reverse proxy từ chối browser writes thiếu Origin hoặc có Origin khác web, và không cache response API.

## Nâng cấp và khôi phục

Migration chạy trước khi đưa API mới nhận traffic. Dùng migration tương thích ngược với phiên bản trước; rollback container không tự rollback schema. Giữ `Gemfile.lock` và lockfile npm đã kiểm tra. Trước thay đổi dữ liệu lớn, tạo backup PostgreSQL và thử restore trên database riêng.

Persistent volume hiện phù hợp một instance Rails. Trước khi tăng replicas, chuyển Active Storage sang S3-compatible storage dùng chung; deploy Sidekiq worker riêng với cùng storage. Cấu hình worker/outbox relay trong `compose.yml` phục vụ phát triển; chúng cần được cấp phát riêng khi bật xử lý ảnh nền hoặc gửi sự kiện trên môi trường live. Chưa có production worker/relay trong lần triển khai tài khoản này.

Chưa có xác minh email, khôi phục mật khẩu, APK/IPA, benchmark tải hay quy trình backup tự động. Những mục này là bước tiếp theo trước khi mở cộng đồng rộng rãi.

PostgreSQL live dùng template Railway `postgres-ssl:18`; CI chạy PostgreSQL 18 tương ứng. `compose.yml` vẫn dùng PostgreSQL 17 cho môi trường phát triển hiện có. Không hạ major version trên volume đã khởi tạo.
