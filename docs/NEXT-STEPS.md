# ▶️ Akash — Việc làm tiếp (cập nhật 2026-06-16, cuối phiên graph/3D)

> Đọc cùng: `docs/AKASH.md` (tổng) · `docs/WORKLOG.md` (nhật ký) · `docs/RAG-CHUNKING.md` (kiến trúc RAG) · memory `akash-project-state.md`.
> ⚠️ Path mới: dự án ở **`~/Desktop/Akash`** (đã đổi tên từ "Data Qi"). Chạy: `cd ~/Desktop/Akash/web && npm run dev`.

## A. Graph/Visualization — nicety còn lại
- [ ] **Click thẳng vào NGÔI SAO (tâm kho)** để bung dần tầng (hành tinh→tiểu HT→vệ tinh). Hiện đạt qua nút **TẦNG** (2D) / **Độ sâu hệ** (3D) + nút **◎** pivot. Sao là THREE mesh nên cần raycast riêng nếu muốn click trực tiếp.
- [ ] (tuỳ) Độ sâu RIÊNG từng thiên hà (giờ là global 1 nút cho cả 3 kho).
- [ ] (tuỳ) Hover: tô màu KHÁC nhau cho link-đi (forward) vs backlink (incoming) — hiện cùng highlight "hot".
- [ ] Soát warning React "useEffect deps changed size" (non-fatal, chưa rõ nguồn — không từ thay đổi gần đây).

## B. AI / RAG — khi founder cắm API key (Edge Function secret, KHÔNG NEXT_PUBLIC)
- [ ] **Băm chunk** (RAG-CHUNKING §2): Edge Function cắt md theo heading `##` + nhét metadata (kho/loại/level/8-chiều/emotion/keywords/confidence) → bảng `chunks`. Heuristic trước (miễn phí), chạy qua `ai_jobs`.
- [ ] **pgvector**: `create extension vector` + bảng `chunks(embedding vector)` + RPC `match_chunks` (hybrid: lọc metadata → vector → keyword, trộn RRF).
- [ ] **Agent hỏi-đáp** trả lời bằng **hồ sơ giọng** (writing_style / forbidden_words / favorite_quotes ở trang "Tôi là ai").
- [ ] Tổng hợp **DISC/MBTI** từ "3 câu hôm nay" vào chân dung MeMirror (heuristic được, không cần token).
- [ ] Auto-ingest nguồn ngoài (YouTube transcript / FB-IG post / meeting note) → md → vào kho → tự băm.

## C. Deploy (chờ founder thao tác)
- [ ] Founder chạy `vercel login` (OAuth, không QR) → mình deploy nốt: root = `web`, 2 env NEXT_PUBLIC Supabase → tạo link/QR live.

## D. Dọn dẹp
- [ ] Xoá thư mục rỗng cũ `~/Desktop/Data Qi` (chỉ còn `.next`).
- [ ] Mở lại project/Claude ở `~/Desktop/Akash` để dev + preview MCP trỏ đúng path.
