# NOTES CHO FOUNDER — những gì Akash cần từ bạn (đêm build 2026-06-12)

## 1. Việc CHỈ BẠN làm được (10 phút)
- **Đổi tên project Supabase** "data QI" → "Akash": Dashboard → Settings → General → Project name. (MCP không có quyền rename — code/docs/package đã đổi hết thành Akash rồi.)
- **Bật Leaked Password Protection**: Dashboard → Authentication → Policies (việc tồn từ DECISIONS).
- **Deploy Vercel** (Tuần 1 theo hướng đã chốt): `cd web && npx vercel` — đã có git repo sạch để connect.

## 2. Để Neuro/Galaxy đẹp hơn nữa — bạn hỏi tôi cần gì, đây:
- **3 reference đêm nay đã đủ dùng** (Neurones/Colorpong, Data Flow tím→cyan→trắng, vòng xoáy vàng) — palette đã chốt theo đúng chúng (BRANDING.md).
- Nếu muốn nâng cấp nữa, thứ giúp NHIỀU NHẤT theo thứ tự:
  1. **Figma file** (hoặc ảnh export) layout bạn mơ ước cho 2 màn: Home + Galaxy — tôi code theo pixel.
  2. Mua bộ vector **Colorpong Neurones** ($5) nếu muốn dùng làm texture/asset thật thay vì canvas tự vẽ.
  3. Một buổi 15 phút bạn quay màn hình kể "tôi muốn cảm giác gì ở từng view" — giọng nói của bạn ra design tốt hơn mọi mô tả chữ.
- KHÔNG cần AI design tool riêng — canvas hiện tại đủ sức làm mọi hiệu ứng đã thấy.

## 3. AI APIs cần cắm (Phase kế — key CHỈ đặt ở server/Edge Function, rule §B5)
| Khâu | Model đề xuất | Dùng cho |
|---|---|---|
| Phân loại/đề xuất nhanh | Claude Haiku | Studio chuẩn hoá, gợi ý liên kết, phân loại inbox |
| Content theo giọng | Claude Sonnet | Xưởng content, master prompt đã build sẵn trong Engine |
| Ảnh | Flux / Midjourney | storyboard, ảnh post |
| Video | Kling / Runway / Higgsfield | reel từ script (pipeline đã vẽ trong Engine) |
| Voice | ElevenLabs | voice-over reel |
Hàng đợi `ai_jobs` đã sẵn trong DB — cắm key là chạy, UI không phải đổi.

## 4. MCP nên kết nối (cánh tay nối dài)
- **GitHub MCP / remote**: đẩy repo lên GitHub → backup + CI + review (repo local đã có, chỉ cần `gh repo create`).
- **Vercel MCP**: deploy + xem log production ngay trong phiên Claude.
- **Figma MCP**: tôi đọc design file trực tiếp khi bạn vẽ.
- **Notion/Drive MCP**: hút tài liệu mkt cũ của bạn vào Tủ nguồn.
- **Meta/TikTok API (Phase 3)**: tự đăng content từ Board + kéo số liệu reach/lead về `content_results` — khép vòng lặp đo & tinh chỉnh.

## 5. Ý tưởng đã ghi nhận nhưng CHƯA build (chờ data thật — rule §B4)
- Wizard "Mục lục đời" làm onboarding bắt buộc cho user mới (đã có bộ câu hỏi LSI trong KHO-CHUAN §2bis; nên pilot tay trước với 2-3 người).
- AI chấm chuyện theo agency/communion/redemption (chưa có bằng chứng LLM chấm chuẩn — xem caveat KHO-CHUAN).
- Tag màu lịch sử nộp Studio (đã có icon ✅⏳📝, pill màu nâng sau).
