# 🌌 Akash — Vũ trụ tri thức của bạn

> Bộ não thứ hai cho người làm kinh doanh: **sống → ghi → chuyển hoá (8 chiều) → AI hiểu bạn → content đúng giọng → kết quả**. Mỗi cuộc đời là một viên kim cương đang được mài.

## Chạy
```bash
cd web && npm install && npm run dev   # http://localhost:3000
npm run build                          # build phải xanh trước khi commit
```
Stack: **Next.js 16 + Supabase** (project "data QI" → đổi tên Akash trong dashboard) · BlockNote editor · canvas 2D thuần cho Galaxy. Acc test admin: xem docs/DECISIONS.md §C.

## Kiến trúc trong 1 phút
- **3 kho**: 🧠 cá nhân (7 cây gốc) · 🌐 QNET (A–F) · ♾️ nhân loại (6 nhánh) — mọi trang CÓ GỐC, ánh xạ ra bằng **8 chiều liên kết** (bảng `links`, có excerpt mức câu).
- **7 loại trang** (taxonomy thống nhất): trải nghiệm / bài học / quy trình / hồ sơ / nguồn / sự kiện / ghi chú.
- **Độ Chuyển hoá = derive từ links** (`web/src/lib/transformScore.ts`) — không lưu điểm tay; `wisdom_depth` chỉ giữ lịch ôn SM-2.
- UI: `page.tsx` (workspace + cây + editor) · `Pages.tsx` (Today/Studio/Board/Profile/wizard Mục lục đời) · `Hubs.tsx` (KOL/Engine/Review/Members) · `Galaxy.tsx` (5 view canvas) · `Digest.tsx` (luồng Chuyển hoá 7 màn) · `PageFrame.tsx` (PropsPanel/PageFooter/DIMS).

## Đọc docs theo thứ tự
0. [docs/AKASH.md](docs/AKASH.md) — 🌟 BẢN TỔNG: ý nghĩa, tầm nhìn, 3 kho, 7 loại, AI-hiểu-user, hành trình màu (mở phiên làm việc mới)
1. [docs/DECISIONS.md](docs/DECISIONS.md) — hiến pháp: quyết định chốt + rules
2. [docs/KHO-CHUAN.md](docs/KHO-CHUAN.md) — framework kho + 7 cây + 6 nhánh (§2bis là bản chốt)
3. [docs/WORKLOG.md](docs/WORKLOG.md) — nhật ký build (mục mới nhất trước)
4. [docs/APP-FLOWS.md](docs/APP-FLOWS.md) — từng màn, từng nút → ghi gì vào DB
5. [docs/BRANDING.md](docs/BRANDING.md) — 1-accent, cấm fuchsia trên chrome
6. [docs/NOTES-FOUNDER.md](docs/NOTES-FOUNDER.md) — việc chờ founder + ROADMAP 3 phase

Quy trình chuẩn mỗi đợt: đọc docs → code → `npm run build` xanh → **test thật trên preview** → ghi WORKLOG → commit.
