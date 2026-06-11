# AKASH — Quyết Định Cuối & Rules (chốt phiên 2026-06-10 → 11)

> File đóng phiên. Phiên mới đọc file này TRƯỚC TIÊN, sau đó FRAMEWORK.md → ROADMAP.md → WORKLOG.md.

## A. QUYẾT ĐỊNH CUỐI CÙNG (không bàn lại, chỉ thực thi)

1. **Tên & nhận diện**: App tên **Akash** (akasha — hư không lưu trữ tri thức). Logo chữ "A" gradient tím→cyan. Identity màu: tím #8b5cf6 · cyan #22d3ee; light theme "paper" #faf9fc giữ identity, galaxy + login vĩnh viễn dark.
2. **FRAMEWORK gốc rễ = 8 chiều liên kết** (knowledge/experience/emotion/values/people/time/reference/anchor — màu cố định trong FRAMEWORK.md §1). Radar 5 cạnh (Nối·Nghĩa·Chứng·Trải·Hành) là THƯỚC ĐO Độ Thấm, không phải gốc. Đã BỎ nhánh "truyền dạy/transmission".
3. **Một chữ thống nhất: "Thấm"** (không dùng Học bài/Thẩm thấu). Luồng Thấm = 7 màn đi qua 8 chiều, Hoa Thấm 8 cánh, learned cần ≥2 chiều, lịch ôn SM-2 (1-3-7-21-60 ngày).
4. **Thời gian = event_date thực tế** (viết về quá khứ → ngày quá khứ), KHÔNG phải ngày tạo trang. Dòng đời cá nhân là trục gốc.
5. **Liên kết mức câu/quote** (links.excerpt + from_block), không chỉ mức trang. Backlink tự động — đã giải thích trong UI.
6. **Taxonomy 2 trục** (đã chốt, build dở): Trục 1 = bản chất tri thức (Trải nghiệm/Bài học/Quy trình/Hồ sơ/Nguồn/Sự kiện/Câu hỏi mở) gắn mọi trang; Trục 2 = định dạng đầu ra (blog/video/reel/email/caption) CHỈ gắn thẻ Xưởng content.
7. **Luồng biên tập**: kho cá nhân tự do → "Đề xuất lên nhân loại" (kèm 3 câu lý do) tạo bản sao pending; kho QNET chỉ editor sửa, member "Góp ý sửa"; duyệt/trả lại kèm lý do; cấp <4 tạo bài kho chung = pending. Nhập liệu qua **Studio trong Home**: raw → máy đề xuất → AI tạo bản chuẩn theo template đầu vào (admin chỉnh tại trang 📐) → user sửa → nộp → history.
8. **Org duy nhất** (is_primary): user mới = Thành viên cấp 1. 5 vai: Admin 5 / Tổng biên tập 4 / Biên tập viên 3 / Cộng tác viên 2 / Thành viên 1. Admin = ng.hongngoc1196@gmail.com.
9. **Galaxy = 5 view, mỗi view một bản chất**: 🌌 cấu trúc · 🧘 Cây Sự Sống (thiền giả dưới, kho cá nhân→QNET→nhân loại mở quạt lên) · 🎯 Radar 8 trục (bấm trục solo) · 📜 Dòng đời (event_date) · 🧠 Neuro 3D (neuron soma méo + dendrite + nhịp tim lub-dub ~1.1s, mỗi nhịp 1 vùng firing + action potential).
10. **Token hoá**: Qi điểm off-chain từ bảng events (thấm 10 · content 5 · nối 3 · trang 1) — blockchain thật CHỈ khi có lý do kinh tế + tư vấn pháp lý (3 giai đoạn trong ROADMAP).
11. **Hướng đi đã chốt (chiến lược)**: DỪNG thêm tính năng → Tuần 1 deploy Vercel + test bằng acc Thành viên cấp 1 + mobile drawer → Tuần 2 pilot 5-10 người thật, đo bằng events → Tuần 3 cắm AI theo thứ tự: Studio chuẩn hoá (Haiku) → gợi ý liên kết → content theo giọng (Sonnet). North star: **số bài Thấm trọn/người/tuần**.

## B. RULES ĐÃ LẬP (mọi phiên sau phải theo)

### Quy trình làm việc
1. Mỗi đợt build: đọc docs → code → `npm run build` xanh → **test thật trên preview (đăng nhập acc thật, bấm từng nút, check DB)** → ghi WORKLOG. Không tin "build xanh = chạy đúng".
2. Checklist test chuẩn nằm cuối WORKLOG.md — chạy lại sau mỗi đợt lớn.
3. Việc lớn → tách sub-agent (persona QA, UX lead, audit) chạy song song; spec/finding của agent phải được lưu vào docs.
4. Vòng lặp chưa có data thật chảy qua thì KHÔNG xây tầng trên nó.

### Kỹ thuật
5. **API key AI chỉ ở server** (Supabase Edge Function secret) — tuyệt đối không NEXT_PUBLIC_*. Mọi việc AI đi qua bảng `ai_jobs` (đã xếp hàng sẵn, cắm key là chạy, UI không đổi).
6. **Không đụng project Supabase "BI event/quanlysukien"** (578 user thật). Chỉ làm trên "data QI" (vntndprivvkgjbeutand).
7. RLS own-only mặc định; approver được mở thêm bằng policy riêng. Sau mỗi DDL chạy security advisors.
8. Cột int không nhận số lẻ — Math.round mọi điểm trước khi upsert (bug đã gặp).
9. Màu hsl() không ghép hex alpha — dùng hsla (bug đã gặp). Canvas: toạ độ chiếu ghi đè pts mỗi frame để hit-test/tooltip dùng chung pipeline.
10. Lỗi overlay từ chrome-extension (Talisman) = không phải lỗi app — đã chặn bằng inline script trong layout (chạy trước Next).

### Thiết kế
11. **Emoji chỉ cho icon page/nội dung user chọn; chrome chức năng dùng SVG line-icon** (Icons.tsx).
12. Nút chức năng phải KHÁC NHAU nhìn thấy được (demo sống trong nút, màu active riêng per-mode).
13. Mỗi view dữ liệu phải có "chất" riêng (nền, motion, nhận diện 0.5 giây) — không same-same.
14. Học xong/hành động xong phải có celebration (confetti, synapse, bùng nổ) — gamification là tính năng lõi, không phải trang trí.
15. Trang = properties bar chuẩn cố định đầu trang (Loại · 📅 event_date · 🚩 Campaign · trạng thái · đính kèm); cấu trúc file chuẩn trong STANDARD-TEMPLATE.md.

## C. TRẠNG THÁI BÀN GIAO
- Code: `web/` Next.js 16 + Supabase, build xanh, chạy `cd web && npm run dev` (cổng 3000). Preview launch.json đã có.
- DB "data QI": ~95 nodes, 35+ links, đầy đủ bảng (nodes/links/wisdom_depth/events/content_results/open_questions/ai_jobs/assignments/profiles.voice).
- Acc test: ng.hongngoc1196@gmail.com / DataQi@2026 (Admin).
- **Việc dở dang**: taxonomy 2 trục (chốt rồi chưa build) · mobile drawer · deploy Vercel · bật Leaked Password Protection (dashboard) · dọn trang test "ádfsdfsd…" trong kho admin · embeddings/pgvector · milestones.
- Docs đọc theo thứ tự: DECISIONS.md (file này) → FRAMEWORK.md → ROADMAP.md → STANDARD-TEMPLATE.md → AI-FRAMEWORK.md → WORKLOG.md (lịch sử chi tiết).
