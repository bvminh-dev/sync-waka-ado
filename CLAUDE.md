# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Dev server (Next.js, http://localhost:3000) |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | ESLint (`next/core-web-vitals`) |
| `npm run typecheck` | `tsc --noEmit` |

Không có test suite. Verify thủ công theo flow trong `README.md`.

## Architecture (big picture)

- **Stack**: Next.js 14 App Router (TypeScript) + Mongoose + Tailwind + Recharts + Radix primitives. Không có auth ở tầng app — open access nội bộ.
- **Dual-mode WakaTime auth**: mỗi `Employee` chọn `authType` = `api_key` hoặc `oauth`. `WakaTimeClient` trong `lib/wakatime.ts` dispatch theo loại: API key → `Authorization: Basic <base64(key)>`; OAuth → `Authorization: Bearer <accessToken>` và tự refresh khi token còn < 60s, persist token mới qua callback `onTokenRefresh` truyền vào client (xem `lib/sync.ts` cho cách wiring).
- **Encryption-at-rest**: mọi secret (`apiKey`, `clientId`, `clientSecret`, `accessToken`, `refreshToken`) đi qua `lib/crypto.ts` (AES-256-GCM, key 32 bytes hex từ `ENCRYPTION_KEY`). Trong Mongo lưu sub-doc `{ iv, tag, ct }` base64. Không log/trả secret qua API; route handlers chỉ trả flag boolean như `oauthAuthorized`.
- **Cache layer**: `DailySummary` (unique `employeeId+date`) là nguồn truth cho UI và aggregation. Đường đi: WakaTime → `lib/sync.ts#syncEmployeeRange` (fetch all-projects summary + per-project branch summary) → upsert. UI gọi `/api/employees/[id]/summary?date=` (đọc cache, miss → sync 1 ngày) hoặc `/api/employees/[id]/sync` (force range). Dashboard tổng chỉ đọc cache; user phải bấm Sync (`?sync=1`) để kéo mới cho toàn team.
- **Aggregation**: `lib/aggregate.ts` map-reduce in-memory từ `DailySummary` → `[{project, totalSeconds, people:[{name, totalSeconds, branches:[]}]}]`, sort desc. Không dùng Mongo aggregation pipeline để giữ logic đơn giản.
- **OAuth flow**: `/api/oauth/wakatime/authorize?employeeId=...` (dùng `client_id` đã lưu để build URL authorize) → WakaTime → `/api/oauth/wakatime/callback` (state = employeeId) → exchange code → encrypt tokens → redirect về `/employees/[id]`.
- **Theme**: Tokens trong `tailwind.config.ts` map 1-1 từ `DESIGN.md` (colors, radius, shadow, font Rubik). Dùng class Tailwind có sẵn (`bg-accent`, `shadow-card`, `rounded-xl`, ...) thay vì hardcode hex.
- **Mobile-first**: layout default 1-col, breakpoints `sm` (640px) → 2-col, `lg` (1024px) → 3-col. AppShell nav có hamburger < `md`. Container max-width `1440px`.

## Conventions

- Route handlers luôn `export const dynamic = "force-dynamic"` (cần Mongo connection runtime).
- Mongoose singleton: import từ `@/lib/mongodb` và `await connectDB()` ở đầu mỗi route, không tạo client mới.
- Tránh log secret. Nếu cần debug WakaTime response, log status code / `data` field, không log header `Authorization`.
- Khi thêm field secret mới, nhớ: (1) schema dùng `EncStringSchema`, (2) encrypt khi nhận từ client, (3) loại trừ khỏi projection trong `GET /api/employees`.
- Khi thay đổi shape cache `DailySummary`, cần xoá collection cũ (`db.dailysummaries.drop()`) vì code không có migration.

## DESIGN.md

`get-ticket-waka/DESIGN.md` là design system bắt buộc theo. Bảng token đầy đủ ở §2/§3/§6. Khi build UI mới: tuân thủ border radius (`xl` = 22px cho cards, `sm` = 4px cho buttons), spacing scale 8/12/16/20/24/40/72, font Rubik 400/600/700.
