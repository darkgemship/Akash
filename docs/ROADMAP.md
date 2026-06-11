# Akash — Roadmap Siêu Bộ Não (từ audit đa agent, 2026-06-11)

> Kết luận audit: 12/15 lỗ hổng trám được KHÔNG cần AI API — "siêu bộ não" chủ yếu là vấn đề data model + vòng lặp. ✅ = đã có chỗ chứa (schema) sẵn.

## P0 — sống còn
1. ✅(schema) **Kết quả content** — bảng `content_results` đã tạo. Còn: UI nhập khi kéo card sang "Đã đăng" + hiện trên Today.
2. **Rút bài học từ kết quả** — card nhớ `source_node_id`, sau kết quả → nút "Rút bài học" tạo note + link evidence về trang gốc.
3. ✅(schema) **Lịch ôn SM-2** — cột `next_review_at/review_count` đã có, Thấm đã set mốc ôn. Còn: khối "Đến hạn ôn (n)" trên Today.
4. **Trang Con người có cấu trúc** — subtype `person` đã chạy (Thấm tạo). Còn: panel field (giai đoạn lạnh→ấm→ký, nhu cầu, lần chạm cuối) + view Pipeline khách.
5. **Voice profile 20 câu** — form "Giọng của tôi" lưu `profiles.voice` JSONB.
6. ✅(schema) **Event log** — bảng `events` đã tạo, Thấm đã ghi. Còn: ghi đủ loại event + streak trên Today.
7. **Embeddings** — bật pgvector, bảng `embeddings(node_id, block_id, vector)` + trigger md đổi → ghi `ai_jobs`.

## P1 — nâng cấp siêu bộ não
8. **"AI hiểu bạn N%"** — vòng tròn % trên Today: voice 20 câu (20) + hồ sơ đời (15) + ≥10 trang Thấm sâu (25) + ≥5 person (15) + ≥3 content có kết quả (15) + streak ≥7 (10). Mỗi mục thiếu = 1 CTA. Tăng độ hiểu = "Thấm cùng AI" (phiên AI phỏng vấn, cần API).
9. ✅(schema) **Câu hỏi mở** — bảng `open_questions` đã tạo. Còn: ô "Điều còn lấn cấn?" trong Thấm + 1 câu hỏi/ngày trên Today.
10. **Hồ sơ cuộc đời** — trang "Tôi là ai" + `profiles.life` (mục tiêu, con số kinh doanh, nỗi sợ/động lực) — AI luôn được inject.
11. ✅(schema) **ai_jobs** — đã tạo. Còn: các nút ✨ ghi job để sau thay ruột bằng Edge Function mà UI không đổi.
12. **Tín hiệu khách hàng** — bảng `customer_signals` + nút "Khách vừa hỏi gì?" trên trang person → nuôi cột Ý tưởng.
13. **Cây Sự Sống theo tiến độ + milestone** — thân cây sáng theo tổng Độ Thấm; bảng `milestones` + celebration full-screen.

## P2
14. **Weekly review chia sẻ được** — card "Tuần qua" export PNG khoe nhóm (viral loop QNET).
15. **Chống spam graph** — tính hub theo `links.weight` (Thấm=2, mention=1, decay/usage), không theo count thô.

## Thứ tự thi công: A(1,2,3) khép vòng lặp → B(4,5,10) chỗ chứa AI hiểu user → C(6,13,8) hành vi + nghiện → D(7,11,9) dọn đường API.


## 🪙 Token hoá (đường đi trung thực — yêu cầu founder #4)
Đêm nay đã có **Qi điểm**: ledger `events` (thấm 10 · content 5 · nối 3 · trang 1) + streak — chính là "token nội bộ" custodial, đủ cho gamification & thưởng đội nhóm. Đường lên blockchain THẬT khi cần:
1. **Giai đoạn 1 (đã xong):** điểm off-chain từ events — đổi thưởng nội bộ, leaderboard, milestone.
2. **Giai đoạn 2:** snapshot Qi định kỳ + ký hash bảng điểm (proof) đăng công khai — minh bạch không cần ví.
3. **Giai đoạn 3 (chỉ khi có lý do kinh tế thật):** mint điểm thành token trên chain rẻ (Base/Polygon), ví custodial cho user không rành crypto. ⚠️ lưu ý pháp lý VN về token + bản chất MLM — cần tư vấn trước khi phát hành. KHÔNG đưa nội dung kho lên chain (riêng tư), chỉ điểm/huy hiệu.

---

## 🚀 3 PHASE TIẾP THEO (chốt đêm build 2026-06-12 — sau khi đã có: 7 cây + 6 nhánh, Home mới, 4 hub, branding v2, 194 trang data thật)

### Phase 1 — NGƯỜI THẬT (2 tuần): "5 user dùng thật, không gãy"
- Deploy Vercel + rename Supabase project → Akash (NOTES-FOUNDER.md §1)
- Wizard "Mục lục đời" (LSI McAdams — bộ câu hỏi đã sẵn KHO-CHUAN §2bis) làm onboarding user mới; user mới tự có 7 cây
- Pilot 5–10 người thật; đo bằng events; North star: **số bài Chuyển hoá trọn/người/tuần**
- Mobile drawer + polish responsive

### Phase 2 — CẮM TRÍ TUỆ (3-4 tuần): "AI chạy thật qua ai_jobs"
- Edge Function + key server-only (rule §B5): Haiku (Studio chuẩn hoá, phân loại inbox, gợi ý liên kết) → Sonnet (content theo Hồ sơ Hồn — master prompt đã build) → Opus (chiến lược campaign)
- Chấm bản nháp 3 trục Hook/Hồn/Hành động; "Thấm cùng AI" phỏng vấn lấp vùng mù
- Job dọn kho tuần: trang 0 link / inbox quá hạn / thiếu loại → đề xuất gộp/xoá
- Embeddings/pgvector cho retrieval 8 chiều

### Phase 3 — KHÉP VÒNG KINH DOANH (4-6 tuần): "đăng → đo → tinh chỉnh tự động"
- Meta/TikTok API: đăng từ Board + kéo reach/lead về content_results gắn trang gốc
- Dashboard kết quả theo campaign + vòng lặp "thành công nối tiếp thành công" (bài tốt → nhân bản định dạng)
- Media pipeline thật (Flux/Kling/ElevenLabs qua ai_jobs) — luồng 8 bước trong CONTENT-ENGINE.md
- Qi điểm minh bạch + bảng vinh danh đội nhóm (token hoá thật vẫn CHỜ lý do kinh tế + pháp lý, theo DECISIONS §A10)
