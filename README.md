# Waka Tracker

Next.js fullstack app để quản lý team dev qua [WakaTime API](https://wakatime.com/developers). Theme dựa trên `DESIGN.md`, mobile-first.

## Tính năng

- **Quản lý nhân sự**: tạo nhân sự với Tên + (API Key WakaTime) hoặc (client_id/client_secret OAuth2)
- **Dashboard nhân sự**: chọn ngày → giờ làm theo project & branch
- **Dashboard tổng**: filter ngày/tuần/tháng/quý/năm → project → người → branch
- Cache `DailySummary` trong MongoDB để giảm lưu lượng gọi WakaTime
- Secret WakaTime mã hoá **AES-256-GCM** at-rest

## Yêu cầu

- Node.js 18+
- MongoDB chạy local hoặc Atlas

## Cài đặt

```bash
cp .env.local.example .env.local
# Sinh key 32 byte:
openssl rand -hex 32   # paste vào ENCRYPTION_KEY

npm install
npm run dev
# http://localhost:3000
```

## ENV

| Biến | Mô tả |
|---|---|
| `MONGODB_URI` | Mongo connection string |
| `ENCRYPTION_KEY` | 64 ký tự hex (32 bytes) cho AES-256-GCM |
| `WAKATIME_OAUTH_REDIRECT` | Callback URL khớp với WakaTime app, mặc định `http://localhost:3000/api/oauth/wakatime/callback` |

## Sử dụng

1. Vào `/employees` → **Thêm nhân sự**
   - Chọn **API Key**: paste WakaTime personal API key → lưu xong là sẵn dùng.
   - Chọn **OAuth2**: nhập `client_id`/`client_secret` từ WakaTime app → lưu → vào trang detail bấm **Authorize WakaTime**.
2. Vào detail employee, chọn ngày → xem chart project + branch.
3. Vào `/` (Dashboard) → chọn preset thời gian → bấm **Sync WakaTime** để kéo dữ liệu mới cho toàn team → xem aggregate theo project/người/branch.

## Scripts

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Dev server với HMR |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | ESLint (next/core-web-vitals) |
| `npm run typecheck` | `tsc --noEmit` |

## Kiến trúc

```
app/                Next.js App Router
  api/              Route handlers (employees CRUD, summary, sync, dashboard, oauth)
  employees/        UI list + detail
  page.tsx          Dashboard tổng
components/         AppShell, RangePicker, EmployeeForm, HoursBarChart, ui/*
lib/
  mongodb.ts        Mongoose singleton (cached qua globalThis)
  crypto.ts         AES-256-GCM encrypt/decrypt
  wakatime.ts       WakaTimeClient (hỗ trợ api_key & OAuth2, tự refresh token)
  sync.ts           Fetch WakaTime + upsert DailySummary cache
  aggregate.ts      Aggregate cross-employee → project → người → branch
  ranges.ts         Preset day/week/month/quarter/year → DateRange
models/
  Employee.ts       Nhân sự (encrypted secrets)
  DailySummary.ts   Cache giờ làm theo ngày
```
