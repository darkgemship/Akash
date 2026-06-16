# Akash — MVP v0.1: "The Growing Brain Vault"

> Nhỏ nhất có thể, nhưng chứng minh được giả thuyết sống còn: **member có hình thành thói quen ghi chú & bộ não có giữ chân họ không?**

## 1. Giả thuyết MVP kiểm chứng
1. Member chịu **ghi chú/reflect mỗi ngày** (thói quen).
2. **Bộ não lớn dần** tạo cảm giác tiến bộ → quay lại.
3. **AI gợi ý liên kết** vào kho tổng giúp học nhanh + thấy giá trị ngay.

→ Đo bằng: DAU, streak trung bình, số note/tuần, số liên kết/người, retention 30 ngày.

## 2. TRONG phạm vi MVP (chỉ những gì cần để test giả thuyết)
| Tính năng | Thuộc | Mức MVP |
|-----------|-------|---------|
| Đăng nhập | — | Auth cơ bản (xem mục 5) |
| **Org vault (đọc, level-gated)** | Flow A | Admin tự seed nội dung tay (CHƯA pipeline editor) |
| **Personal vault + daily note** | Flow B | Block editor (BlockNote), tạo/sửa note |
| **Liên kết `[[ ]]` + backlink** | Flow B | Có — vì đây là thứ làm não lớn |
| **Bộ não (home, lớn dần)** | Engagement | Bản cơ bản WebGL, node = page, link = liên kết |
| **Streak + level não** | Engagement | Đơn giản |
| **1 khoảnh khắc AI: gợi ý liên kết** | Flow B/C | Khi viết note, AI gợi ý page kho tổng liên quan |
| **Daily prompt + AI nhắc** | Flow B/C | Nhắc ghi chú mỗi ngày |
| Level gating + personal vault private | Permission | Cơ bản: thấy official ≤ level; vault riêng tư |
| White/Dark mode | Engagement | Có |

## 3. NGOÀI phạm vi MVP (hoãn, có lý do)
| Hoãn | Vì sao | Làm ở |
|------|--------|-------|
| Pipeline editor đa vai + AI ingestion + duyệt | 1 admin seed tay là đủ để test habit | v0.2 |
| Cây team đầy đủ + leadership visibility + leaderboard | Không cần để test habit cá nhân | v0.2 |
| Content engine đầy đủ (4 format, KOL feed) | Downstream của habit | v0.3 |
| Flow D media pipeline | Cần có content trước | v0.3 |
| Flow E metrics dashboard | Nhập tay nhẹ là đủ lúc đầu | v0.3 |
| Ecosystem integration (SSO/FDW/Edge Fn quanlysukien) | Isolated, bolt-on sau | trước launch thật |
| Monetize, landing page, email, ads, SEO | Phase 2-3 | sau |

## 4. Thứ tự build (slices)
- **S0 Scaffold** — Next.js + TS + Tailwind + Supabase + theme (white/dark) + auth.
- **S1 Personal Vault** — BlockNote editor + daily note + cây page.
- **S2 Org Vault** — admin seed page official + level gating (đọc).
- **S3 Liên kết & Backlink** — `[[ ]]` mention + panel backlink.
- **S4 Bộ não (home)** — WebGL graph lớn dần + streak + level.
- **S5 AI moment** — gợi ý liên kết khi viết note + daily prompt/nhắc.
→ Xong S5 = có thể cho nhóm member thật dùng thử & đo.

## 5. Auth cho MVP — ĐÃ CHỐT: SSO quanlysukien ngay từ S0
- Akash cấu hình **Third-Party Auth** tin JWT do quanlysukien phát (qua JWKS / signing keys bất đối xứng).
- User đăng nhập qua quanlysukien → token dùng được ở Akash → RLS chạy theo `sub` (user_id).
- Hệ quả: **clearance level DERIVE từ danh tính quanlysukien** (xem dưới), không quản trùng.

## 6. Định nghĩa "Done" của MVP
Một nhóm ~10-20 member QNET dùng 30 ngày, và ta đo được:
- Bao nhiêu % ghi chú ≥ 3 ngày/tuần?
- Streak trung bình? Retention ngày 30?
- Họ có "khoe" bộ não / quay lại vì nó không?
→ Trả lời được = đủ cơ sở đầu tư Flow C/D/E + ecosystem.
