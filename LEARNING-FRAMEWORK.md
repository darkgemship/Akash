> ⚠️ **LỊCH SỬ — đã thay thế.** Tài liệu sống & chuẩn hiện tại: [docs/AKASH.md](docs/AKASH.md) + docs/KHO-CHUAN.md + docs/FRAMEWORK.md. File này giữ làm tham khảo gốc.

# Akash — Framework Đọc Hiểu (Digest) & Data Ops

> Mục tiêu: người dùng THẬT SỰ thẩm thấu bài học (không đọc lướt), và editor up/cập nhật data toàn diện, tối ưu lưu trữ.

## A. Framework Đọc Hiểu — 5 bước (ăn khớp 5 tham số Độ Thấm)
Dựa trên khoa học học tập: active recall, elaboration (Feynman), elaborative interrogation, transfer, spaced repetition.

| Bước | Hành động | Nguyên lý | Nuôi param Độ Thấm |
|------|-----------|-----------|--------------------|
| 1 📖 **Đọc + Highlight** | Đọc kỹ, bôi đậm câu "đắt" | Encoding | (cổng vào) |
| 2 🧠 **Recall** | Nhớ lại 3 ý KHÔNG nhìn lại | **Active recall** (#1 cho trí nhớ) | nền hiểu |
| 3 ✍️ **Elaborate** | Giải thích bằng lời mình (dạy lại) | **Feynman** | 💗 Meaning |
| 4 🔗 **Connect** | Nối bài/trải nghiệm liên quan | Elaborative interrogation | 🔗 Connections + 🌱 Experience |
| 5 ⚡ **Apply** | Cam kết 1 hành động cụ thể | Transfer | ⚡ Action |
| 👁️ **Evidence** | Đánh dấu đã thấy ai áp dụng & thành công | Social proof | 👁️ Evidence |
| 🔁 **Review (sau)** | Ôn lại theo lịch (spaced repetition) | Củng cố | toàn bộ + bền |

**Logic chấm điểm:** Độ Thấm CHỈ được chấm SAU khi hoàn thành digest. Điểm tăng theo **mức độ hoàn thành từng bước** (làm đủ recall+elaborate+connect+action+evidence → điểm cao). → "AI cho học digest thì mới chấm Độ Thấm".

**Liên đới (compounding):** bước 4 (Connect) khiến các bài được nối **+Connections** → thẩm thấu bài này nâng cả bài liên quan. Spaced repetition nâng dần theo thời gian.

## B. Editor — Up data TOÀN DIỆN (storage = main function)
Tư duy như editor được giao up toàn bộ kho QNET. Cần đủ nút:

| Nút | Chức năng |
|-----|-----------|
| 📤 **Upload** | Dán/tải .md/.docx/PDF → AI cấu trúc vào template (ingestion) |
| ✏️ **Edit** | Sửa markdown/block, autosave |
| 🕘 **Versions** | Lịch sử phiên bản + changelog + khôi phục |
| 🔗 **Link** | Tạo/duyệt liên kết CÓ LOẠI giữa node |
| 🔒 **Quyền** | Đặt clearance level + nhóm (Shakti/The V) |
| 🗂️ **Move/Organize** | Di chuyển folder, sắp xếp taxonomy A/B/C/D |
| 📋 **Duplicate** | Nhân bản làm mẫu |
| ✅ **Submit/Approve** | Gửi duyệt → Tổng biên tập publish official |
| 🗑️ **Archive** | Lưu trữ (không xóa cứng) |

## C. Tối ưu LƯU TRỮ & UPDATE (main function)
1. **Block-JSON là nguồn** (BlockNote) + **export Markdown** → nhẹ, máy/AI đọc tốt.
2. **Autosave + optimistic update** → gõ tới đâu lưu tới đó, UI mượt.
3. **Versioning theo snapshot + changelog**; diff giữa version để tiết kiệm.
4. **UUID ổn định** + tách `contains`/`links` (xem DATA-MODEL-ANALYSIS) → update không gãy link.
5. **Embeddings cập nhật khi save** (debounce) → RAG luôn mới.
6. **Media = link object storage**, KHÔNG nhét DB (xem STORAGE).
7. **Soft-delete (archive)** + audit log mọi thay đổi → an toàn, truy vết.
8. **Block-level update** → chỉ ghi block đổi, không ghi cả trang → rẻ & nhanh.

→ Kết quả: đọc-hiểu thật sự (digest) + kho data sống, cập nhật rẻ, an toàn, AI-ready.
