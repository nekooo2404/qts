# QTS Technology

Ứng dụng full-stack gồm website doanh nghiệp QTS và cổng thông tin khách hàng QTS Portal. Website công khai tổ chức nội dung theo mô hình hệ sinh thái B2B, còn Portal cung cấp dashboard, dự án, công việc, ticket, tài liệu, hợp đồng, hóa đơn, thông báo và CMS theo vai trò.

Thiết kế tham khảo cấu trúc nội dung và nhịp trải nghiệm của AMIS MISA nhưng không sao chép mã nguồn, nội dung, tên sản phẩm, logo, hình ảnh hoặc nhận diện MISA. Toàn bộ bề mặt sản phẩm và dữ liệu demo thuộc hệ QTS.

## Công nghệ

- Next.js 16.3 App Router, React 19 và TypeScript strict
- Tailwind CSS 4 cùng hệ component nội bộ/Radix UI
- Lucide Icons, Framer Motion, React Hook Form và Zod
- Prisma 7 với SQLite cho demo local
- Xác thực session cookie lưu trong database, mật khẩu bcrypt và RBAC phía server
- Recharts, Vitest và Playwright
- ESLint và Prettier

## Chức năng chính

- Website: mega menu, hệ sinh thái sản phẩm/dịch vụ, giải pháp, dự án, blog, liên hệ và báo giá.
- Portal: dashboard theo vai trò, projects, tasks, tickets, documents, contracts, invoices, notifications và profile.
- Admin: user access, nội dung website, cấu hình và audit log.
- Bảo mật: kiểm tra quyền ở repository/API, giới hạn phạm vi organization, validation Zod, honeypot/rate limit cho form công khai và security headers.
- SEO/a11y: metadata, sitemap, robots, structured data, skip link, focus rõ, menu/dialog dùng bàn phím và reduced motion.

## Cấu trúc

```text
prisma/
  migrations/        Migration SQLite
  schema.prisma      Models, enums, indexes
  seed.ts            Dữ liệu và tài khoản demo
src/
  app/
    (marketing)/     Website công khai
    portal/          Portal auth, dashboard và admin
    api/             Route handlers
  components/
    public/          Header, catalogue, tabs, form, footer
    portal/          Dashboard, bảng, form và workflow
    shared/          Logo, error states
    ui/              Component primitives
  config/            Nội dung marketing và cấu hình Portal
  lib/               Auth, DB, domain, validation, security
  server/            Repository và truy vấn theo quyền
tests/e2e/            10 luồng Playwright quan trọng
```

## Yêu cầu môi trường

- Node.js `>=20.9.0`
- npm
- Windows, macOS hoặc Linux

Demo local không cần dịch vụ trả phí.

## Cài đặt

1. Cài dependency:

```bash
npm install
```

2. Tạo file môi trường:

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

3. Tạo database và Prisma Client:

```bash
npx prisma migrate dev
npm run db:generate
```

4. Seed dữ liệu demo:

```bash
npm run db:seed
```

5. Chạy development:

```bash
npm run dev
```

Mở `http://localhost:3000`.

Trên PowerShell chặn script `.ps1`, dùng các lệnh tương đương `npm.cmd` và `npx.cmd`.

## Biến môi trường

| Biến                                 | Bắt buộc      | Mục đích                                         |
| ------------------------------------ | ------------- | ------------------------------------------------ |
| `DATABASE_URL`                       | Có            | SQLite local mặc định: `file:./dev.db`           |
| `APP_URL`                            | Có khi deploy | Canonical URL và kiểm tra origin                 |
| `SESSION_COOKIE_NAME`                | Không         | Tên cookie session                               |
| `SESSION_TTL_DAYS`                   | Không         | Thời hạn session, mặc định 7 ngày                |
| `SEED_DEMO`                          | Chỉ local     | Phải là `true` để chạy seed                      |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Production    | Khóa base64 ổn định dùng chung giữa các instance |

Không commit file `.env`, database local hoặc secret.

## Tài khoản demo

Chỉ dùng trong development:

| Vai trò  | Email                | Mật khẩu          |
| -------- | -------------------- | ----------------- |
| ADMIN    | `admin@qts.local`    | `QtsAdmin123!`    |
| STAFF    | `staff@qts.local`    | `QtsStaff123!`    |
| CUSTOMER | `customer@qts.local` | `QtsCustomer123!` |

Seed bị khóa khi `NODE_ENV=production`.

## Lệnh kiểm tra

| Lệnh                   | Chức năng                                     |
| ---------------------- | --------------------------------------------- |
| `npm run lint`         | ESLint, không chấp nhận warning               |
| `npm run typecheck`    | TypeScript `--noEmit`                         |
| `npm run test`         | Unit test Vitest                              |
| `npm run test:e2e`     | Seed lại demo rồi chạy 12 kịch bản Playwright |
| `npm run format:check` | Kiểm tra Prettier                             |
| `npm run build`        | Production build                              |
| `npm run check`        | Lint, typecheck, unit test và build           |

Playwright tự chạy ứng dụng tại `http://127.0.0.1:3100`. Lệnh E2E sẽ reset dữ liệu demo.

## Route công khai

- `/`, `/gioi-thieu`, `/dich-vu`, `/san-pham`, `/giai-phap`
- `/dich-vu/[slug]`, `/san-pham/[slug]`, `/giai-phap/[slug]`
- `/du-an`, `/du-an/[slug]`, `/khach-hang`
- `/blog`, `/blog/[slug]`, `/tuyen-dung`
- `/lien-he`, `/bao-gia`
- `/chinh-sach-bao-mat`, `/dieu-khoan-su-dung`
- `/403`, `/404`, `/500`

## Route Portal

- Auth: `/portal/login`, `/portal/forgot-password`
- Công việc: `/portal/dashboard`, `/portal/projects`, `/portal/projects/[id]`, `/portal/tasks`, `/portal/tickets`, `/portal/tickets/[id]`
- Hồ sơ doanh nghiệp: `/portal/documents`, `/portal/contracts`, `/portal/invoices`, `/portal/notifications`, `/portal/announcements`, `/portal/profile`, `/portal/settings`
- Admin: `/portal/admin`, `/portal/admin/users`, `/portal/admin/roles`, `/portal/admin/content`, `/portal/admin/audit-logs`

## Thay logo và nội dung công ty

- Logo chữ hiện tại nằm trong `src/components/shared/qts-logo.tsx`.
- Khi có logo chính thức, đặt file tại `public/qts-logo.png`, dùng `next/image` trong component trên và cung cấp biến thể đủ tương phản cho nền sáng/tối.
- Nội dung điều hướng, sản phẩm và giải pháp nằm tại `src/config/marketing.ts`.
- CTA có thể chỉnh trong Portal Admin hoặc bảng `SiteSetting`.
- Thay toàn bộ placeholder liên hệ trong footer và dữ liệu seed trước khi phát hành.

## Placeholder còn lại

- Địa chỉ, điện thoại, email, mã số thuế và liên kết mạng xã hội QTS.
- Tổ chức/khách hàng demo, case study và kết quả dự án mẫu.
- Giá trị hợp đồng, hóa đơn và SLA trong Portal là dữ liệu demo.
- QTS Work và QTS CRM được ghi rõ là mẫu định hướng; QTS Portal là bề mặt demo hoạt động.
- Không có logo khách hàng, giải thưởng, chứng chỉ hoặc số liệu thành tích chưa được xác nhận.

## Chuyển SQLite sang PostgreSQL

Ứng dụng hiện cố ý dùng SQLite và `@prisma/adapter-better-sqlite3` cho demo. Khi triển khai PostgreSQL:

1. Tạo backup dữ liệu cần giữ và một database PostgreSQL riêng.
2. Cài driver: `npm install pg @prisma/adapter-pg` và type nếu cần.
3. Đổi `provider = "sqlite"` thành `provider = "postgresql"` trong `prisma/schema.prisma`.
4. Đặt `DATABASE_URL=postgresql://...` bằng secret của môi trường deploy.
5. Thay adapter SQLite trong `src/lib/db.ts` và `prisma/seed.ts` bằng `PrismaPg`.
6. Tạo migration baseline dành cho PostgreSQL trong nhánh triển khai, kiểm tra trên database staging, rồi chạy `npx prisma migrate deploy`.
7. Không chạy `db:seed` demo trong production; nhập dữ liệu thật bằng quy trình riêng.

Migration SQLite không nên áp thẳng lên PostgreSQL. Cần review kiểu dữ liệu, index và chiến lược chuyển dữ liệu trước khi cutover.

## Build và triển khai

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run start
```

Khi deploy:

- Dùng Node runtime có persistent database/network; không dùng SQLite trên filesystem tạm.
- Cấu hình `APP_URL`, `DATABASE_URL` và khóa encryption bằng secret manager.
- Chạy `npx prisma migrate deploy` trước khi đưa phiên bản mới nhận traffic.
- Tắt `SEED_DEMO`, bật HTTPS và kiểm tra cookie, security headers, backup/restore.
- Thay mọi placeholder và chạy lại lint, typecheck, unit, E2E, build cùng browser accessibility audit.
