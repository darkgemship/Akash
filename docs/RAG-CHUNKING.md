# 🧠 Akash → RAG: cách tự "băm" tri thức để AI truy xuất thông minh nhất

> Trả lời câu hỏi của founder: Obsidian = nguồn gốc (source of truth), chunk + embedding = lớp kỹ thuật cho AI tìm nhanh.
> Akash đã có lợi thế Obsidian KHÔNG có: **dữ liệu đã cấu trúc sẵn** (3 kho · 7 loại trang · 8 chiều liên kết · Properties · level). Tận dụng cái này để chunk THÔNG MINH hơn chia-theo-token mù.

## 1. Mô hình 3 lớp (giống research, áp cho Akash)

```
TRANG Akash (nodes.md + props + links)      ← "não bộ" — user đọc & sửa  (= Obsidian Vault)
        ↓  (Indexer tự băm)
CHUNK (đoạn ngữ nghĩa + metadata kho/loại/level/8-chiều)   ← máy tạo, user không cần thấy
        ↓  (Embedding model)
VECTOR (pgvector trong Supabase)            ← toạ độ để tìm chunk liên quan
        ↓
LLM Agent  ← hỏi → tìm chunk → kéo trang gốc → tổng hợp → trả lời bằng GIỌNG user
```

Khác Obsidian: Akash **không cắt mù theo 500 token**. Akash cắt theo **CẤU TRÚC SẴN CÓ** → chunk sạch nghĩa hơn → RAG chính xác hơn.

## 2. Akash băm chunk thế nào (semantic chunking, không phải fixed-size)

Mỗi trang Akash vốn có khung chuẩn (## Nguyên lý · ## Trải nghiệm gốc · ## Áp dụng…). Băm theo các mốc đó:

```
Trang "Đêm tài khoản crypto bốc hơi 70%" (loại: trải nghiệm, kho: cá nhân, level 2)
  ├─ Chunk A = Tóm tắt 1 câu + Cảm xúc + Bài học        (đoạn "vàng" — ưu tiên RAG)
  ├─ Chunk B = ## Chuyện gì xảy ra                       (bối cảnh)
  └─ Chunk C = ## Áp dụng 7 ngày tới                     (hành động)
```

**Luật băm (heuristic, KHÔNG tốn token):**
1. Tách theo **heading `##`** trong md → mỗi mục 1 chunk.
2. Mục > ~800 token → cắt tiếp theo đoạn văn (giữ câu trọn vẹn), **overlap ~80 token** giữa 2 chunk liền (không mất ngữ cảnh ranh giới).
3. Mục < ~120 token → **gộp** với mục kế (tránh chunk vụn).
4. **Luôn nhét metadata vào đầu mỗi chunk** (để embedding "hiểu" bối cảnh):
   `[Kho cá nhân · Trải nghiệm · level 2 · cảm xúc: vỡ oà · từ khoá: crypto, kỷ luật] <nội dung>`

## 3. Metadata vàng Akash có sẵn (Obsidian không có) → lọc trước khi tìm vector

Mỗi chunk lưu kèm (đã có sẵn trong DB, chỉ copy xuống):
- `node_id, kho (layer), page_type, level, event_date, emotion, keywords, confidence`
- `dims`: 8 chiều liên kết của trang (knowledge/experience/values/people…) — để query kiểu "tìm bài về GIÁ TRỊ liên quan X".

→ RAG 2 bước **hybrid** (chính xác hơn vector thuần):
```
1. LỌC metadata trước  (WHERE kho='cá nhân' AND page_type='bai-hoc' AND confidence>=tin-được)
2. VECTOR search trong tập đã lọc  (ORDER BY embedding <=> query_vec)
3. + Full-text keyword (bù khi vector trượt thuật ngữ riêng)
→ trộn điểm (RRF) → top-k chunk → kéo trang gốc → LLM tổng hợp
```

## 4. Hạ tầng trên Supabase (đã có, chỉ bật thêm)

- **pgvector**: `create extension vector;` → bảng `chunks(id, node_id, ord, text, meta jsonb, embedding vector(1536))`.
- **Băm**: chạy trong Edge Function khi trang `published`/sửa (debounce) → ghi `chunks`. Re-chunk chỉ trang đổi (so `last_modified`), không build lại toàn bộ.
- **Embedding**: gọi model embedding (OpenAI text-embedding-3-small / Voyage / local) — **chỉ ở server (Edge secret)**, không NEXT_PUBLIC.
- **Hàng đợi**: tái dùng bảng `ai_jobs` sẵn có → job `chunk_and_embed` (input node_id). Nay làm heuristic chunk trước (miễn phí), cắm embedding sau khi founder có key.
- **Truy vấn**: RPC `match_chunks(query_embedding, filter jsonb, k)` trả top-k + node_id.

## 5. Lộ trình (rẻ → thông minh dần)

| Giai đoạn | Làm gì | Tốn token? |
|---|---|---|
| **0 — giờ** | Mỗi trang đã có Properties + 8 chiều + level + keywords (heuristic). Đây LÀ metadata cho RAG. | Không |
| **1** | Edge Function băm md theo `##` + metadata (luật §2), ghi bảng `chunks`. Xem được chunk trong UI (tab "Chunk" ẩn cho dev). | Không |
| **2** | Bật pgvector + embedding chunk (khi có key) → `match_chunks`. | Có (rẻ) |
| **3** | Agent hỏi-đáp: hybrid retrieve (§3) → trả lời bằng hồ sơ giọng (writing_style/từ-cấm/câu-tủ ở trang "Tôi là ai"). | Có |
| **4** | Auto-ingest nguồn ngoài (YouTube transcript, FB/IG post, meeting note) → md → vào kho → tự băm. | Có |

## 6. Vì sao Akash sẽ RAG tốt hơn "Obsidian + chunk mù"
1. **Chunk theo nghĩa** (heading + loại trang) thay vì cắt 500 token cứng → ít chunk rác.
2. **Lọc metadata trước vector** (kho/loại/độ-tin/8-chiều) → thu hẹp nhiễu → câu trả lời đúng nguồn.
3. **Hành trình cảm xúc + level** → agent biết "đây là trải nghiệm THẬT của user" vs "kiến thức tham khảo" → viết content có hồn, đúng chất.
4. **Giọng user** (hồ sơ Linh hồn) nạp vào prompt cuối → AI viết NHƯ user, không generic.

---
*Tạo 2026-06-16. Khi bắt tay code RAG: §4 (pgvector + ai_jobs) trước, §2 (luật băm) là phần lõi.*
