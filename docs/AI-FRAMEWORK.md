# Data Qi — AI Framework (thiết kế để AI chạy thông minh nhất)

> Mục tiêu: khi cắm Anthropic API vào, AI đọc kho như một "bộ não wiki" và sinh content chất lượng cao. Tài liệu này chốt **cách biến data thành tri thức** dựa trên best practices của các hệ LLM knowledge-base (RAG, GraphRAG, Obsidian/Notion AI).

## 1. Vì sao cấu trúc hiện tại đã AI-ready

| Nguyên tắc LLM wiki | Data Qi đã có |
|---|---|
| Stable IDs để trích dẫn | `nodes.id` UUID — không đổi khi sửa bài |
| Tách cây chứa (taxonomy) khỏi liên kết ngữ nghĩa | `parent_id` (CONTAINS) ≠ bảng `links` (8 chiều có type) |
| Chunk theo khối, không theo trang | `content` JSONB BlockNote — mỗi block có id riêng |
| Nguồn gốc kép cho mọi nội dung | `md` (text thuần cho embedding) + `content` (cấu trúc) |
| Metadata giàu cho filter | `layer`, `kind`, `status`, `min_level`, `props`, `icon` |
| Tín hiệu chất lượng | `wisdom_depth` (Độ Thấm) — bài "chín" mới được sinh content |
| Template chuẩn hoá đầu vào | 4 template (Bài học/Trải nghiệm/Khách/Sách) cấu trúc heading cố định |

## 2. Pipeline INGESTION (raw → trang chuẩn trong kho)

```
RAW (file .md, ghi chú thô, transcript)
  → B1. Upload (nút ⬆ .md) hoặc paste
  → B2. AI parse theo TEMPLATE phù hợp (Haiku đủ tốt, structured output JSON):
        { title, icon, summary_1cau, sections{...theo template}, suggested_links[], suggested_layer }
  → B3. Người duyệt sửa nhanh (human-in-the-loop) — KHÔNG auto-publish
  → B4. Lưu node (status: pending nếu kho chung) + tạo links từ suggested_links
  → B5. (sau) embedding theo block → pgvector
```

**Prompt skill `ingest_to_template`** (chạy server-side, Supabase Edge Function):
- System: "Bạn là biên tập viên kho tri thức QNET. Chuyển văn bản thô thành JSON theo template X. Giữ giọng người viết, không bịa thông tin, đánh dấu chỗ thiếu bằng `[cần bổ sung]`."
- Tools/structured output: JSON schema đúng các heading của template.
- Model: Haiku 4.5 cho khối lượng lớn; Sonnet/Opus cho canon kho tập đoàn (chất lượng tích luỹ).

## 3. Pipeline RETRIEVAL (đọc kho khi trả lời / sinh content)

1. **Hybrid search**: embedding (pgvector trên `md` từng block) + keyword + lọc metadata (`layer`, `status='published'`, `min_level <= user level`).
2. **Graph expansion (GraphRAG-lite)**: lấy top-k block → mở rộng 1 bước qua `links` (ưu tiên dimension `knowledge`/`reference`) + cha/con trực tiếp. Đường liên kết = ngữ cảnh quý nhất.
3. **Re-rank theo Độ Thấm**: bài user đã "thấm" sâu → ưu tiên trích khi sinh content cá nhân (đó là chất liệu thật của họ).
4. **Trích nguồn**: luôn trả `node_id` + title để UI link về trang gốc.

## 4. Pipeline CONTENT (bài chín → content dạy người khác)

```
Trang có Độ Thấm cao → nút "📣 → Content" → Board (Ý tưởng)
  → Engine chọn template content (FB post / Reel script / Email / Dàn ý 5')
  → AI nhận: nội dung trang + các trang liên kết + GIỌNG THƯƠNG HIỆU (20 câu onboarding)
  → Sinh 2-3 phương án → user chọn/sửa → Board (Đang làm → Đã đăng)
```

**Skill `voice_profile`**: 20 câu hỏi onboarding → JSON {tone, giá trị, từ hay dùng, điều kiêng kỵ} lưu `profiles`. Mọi prompt sinh content đều inject voice này — chống "giọng AI generic".

**Cổng chất lượng**: chỉ trang `wisdom_depth.learned=true` và score ≥ ngưỡng mới được sinh content → ép học thật trước khi dạy người khác (đúng triết lý RYTHM).

## 5. Quy tắc model & bảo mật

- API key **chỉ** ở server (Supabase Edge Function secret) — tuyệt đối không `NEXT_PUBLIC_*`.
- Ingestion hàng loạt: `claude-haiku-4-5` + structured outputs. Canon/content cuối: `claude-sonnet-4-6` trở lên.
- Luôn dùng batch API cho việc nền (rẻ hơn 50%).
- Mọi output AI qua human review trước khi vào kho chung (status pending → duyệt).

## 6. Nâng cấp tiếp theo (ưu tiên)

1. Edge Function `ai-ingest` + `ai-content` (cần user cấp API key).
2. Bảng `embeddings(node_id, block_id, vector)` + trigger khi `md` đổi.
3. "AI gợi ý hoàn thành" trong editor: gửi trang hiện tại + 5 trang liên quan → gợi ý đoạn tiếp/câu hỏi đào sâu.
4. Tự gợi ý link: sau khi lưu, AI đề xuất 3 trang nên nối (`links` dimension phù hợp) — user bấm chấp nhận.
