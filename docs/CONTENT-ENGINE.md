# CONTENT ENGINE — thiết kế & lộ trình (deep-research Higgsfield/Runway/HeyGen/OpusClip/Jasper · 2026-06-12)

> Triết lý lõi (rút từ nghiên cứu): Higgsfield train "Soul ID" từ 10–20 tấm ảnh để giữ KHUÔN MẶT nhất quán. Akash đi xa hơn một tầng — train **"Hồ sơ Hồn"** từ kho tri thức 8 chiều (chuyện thật, giá trị, bài học, con người) để giữ **TÂM HỒN nhất quán**. Khuôn mặt nhất quán làm người ta nhận ra bạn; tâm hồn nhất quán làm người ta TIN bạn. Đó là moat mà tool sinh video không có.

## 4 nguyên tắc vận hành (đã kiểm chứng từ sản phẩm thật)
1. **Preset, không prompt** — user chọn công thức kể chuyện, không bao giờ nhìn ô trống (mô hình Higgsfield).
2. **Orchestration, không tự build model** — Akash là lớp điều phối, dùng model tốt nhất từng khâu.
3. **Mọi fact trong content trỏ về một trang trong kho** — chống bịa (DNA Akash, FRAMEWORK §6).
4. **Người duyệt cuối, luôn luôn** — OpusClip loại 20–40% clip máy sinh; Trung tâm biên tập là cổng bắt buộc.

## Luồng 8 bước (đích đến — "vài dòng lệnh ra chiến dịch")
0. **Nạp Hồn** (1 lần): Ma trận content + 21 câu hỏi + Kim Chỉ Nam + chuyện đời → Hồ sơ Hồn. ✅ ĐÃ BUILD (Engine tab 1+2)
1. **Chọn chiến dịch & khung 30/60/180 ngày** ✅ ĐÃ BUILD (generator rule-based; AI thay khi cắm key)
2. **Chọn preset content** (thư viện hook/kịch bản/title đã seed ~100+) ✅ ĐÃ BUILD (tab 3)
3. **Sinh kịch bản chữ**: prompt 3 lớp [Hồ sơ Hồn] + [Preset] + [Mảnh tri thức nguyên văn] ✅ master prompt ĐÃ BUILD (tab 4, copy tay; Claude Sonnet khi cắm key)
4. **Sinh media đa model**: ảnh → Flux/Midjourney · video → Kling/Runway/Higgsfield · voice → ElevenLabs ⏳ chờ key (pipeline đã vẽ trong UI + `ai_jobs` sẵn)
5. **Chấm điểm bản nháp** theo 3 trục: Hook (3s đầu) · Hồn (đúng giọng?) · Hành động (CTA rõ?) ⏳ Phase 2
6. **Duyệt** (human-in-the-loop) → Trung tâm biên tập ✅ ĐÃ BUILD
7. **Xuất bản & vòng lặp học**: số liệu reach/lead về `content_results` gắn vào trang gốc → tinh chỉnh tuần sau ✅ Board đã có modal kết quả; tự động hoá ở Phase 3 (Meta/TikTok API)

## Model map khi cắm key
| Khâu | Model | Ghi chú |
|---|---|---|
| Chiến lược 30/60/180 | Claude Opus | đọc Hồ sơ Hồn + mục tiêu → campaign brief |
| Kịch bản/caption | Claude Sonnet | giữ giọng tiếng Việt, mặc định |
| Phân loại/gợi ý nhanh | Claude Haiku | rẻ, chạy mọi nơi |
| Ảnh/thumbnail | Flux · Midjourney | kèm ảnh tham chiếu user |
| Video ngắn | Kling · Runway · Higgsfield | preset cinematic |
| Voice | ElevenLabs | clone giọng (có consent) |

## Đã seed sẵn trong DB (subtype)
`viral_hooks` (~100 hook theo category) · `viral_script` (kịch bản PAS/AIDA/BAB/3 hồi/listicle…) · `viral_titles` (công thức title) · `brand_questions` (21 câu) · `content_matrix` (per user) · `kol_post/kol_profile` (20 bài Jobs/Gates làm chất liệu đọc-rút-insight).
