# AKASH FRAMEWORK — Gốc rễ (Single Source of Truth)

> **Đây là tài liệu hiến pháp.** Mọi feature, mọi prompt AI, mọi quyết định data đều phải truy về được tài liệu này. Phiên bản này THAY THẾ framework cũ ở điểm quan trọng: **8 CHIỀU LIÊN KẾT là gốc rễ** (trước đây gốc là radar 5 cạnh + nhánh "truyền dạy"). Nhánh "biến thành bài học dạy người khác" (transmission) **bị loại bỏ** — giá trị trao đi qua CONTENT, không qua cấu trúc riêng.

## 0. Tầm nhìn một câu

Akash = siêu bộ não thứ hai: **user sống → ghi → thấm → AI hiểu user sâu hơn mỗi ngày → content/coaching đúng người đúng thời điểm → kết quả kinh doanh → quay lại nuôi cuộc sống.** User vừa sống vui, vừa thông minh lên, vừa kiếm tiền bằng cách trao giá trị thật.

## 1. GỐC RỄ: 8 chiều liên kết

Tri thức không phải trang — tri thức là **liên kết giữa các trang**. Một trang chưa nối = chưa thuộc về cuộc đời bạn. 8 chiều, mỗi chiều một câu hỏi, một cách lưu, một giá trị cho AI:

| # | Chiều | Câu hỏi khi Thấm | Lưu thế nào | AI dùng làm gì |
|---|---|---|---|---|
| 1 | 💧 **Kiến thức** (knowledge) | "Nguyên lý cốt lõi bằng MỘT CÂU của riêng bạn là gì? Nó dựa trên / dẫn tới framework nào?" | 1 câu nguyên lý (props.principle) + link `knowledge` tới trang lý thuyết | Phần "dạy" trong content; kiểm tra bạn hiểu thật hay học vẹt (câu của bạn ≠ copy sách) |
| 2 | 🌱 **Trải nghiệm** (experience) | "Bạn đã SỐNG qua điều này khi nào? Kể lại." | Link `experience` tới trang nhật ký/trải nghiệm (tạo mới nếu chưa có) | Kho chuyện kể — anecdote, proof, authenticity |
| 3 | 🧡 **Cảm xúc** (emotion) | "Bài này chạm cảm xúc nào của bạn?" | `nodes.emotion` + link `emotion` | HOOK content — lan toả bắt đầu từ cảm xúc |
| 4 | 💜 **Giá trị** (values) | "Bài này phụng sự GIÁ TRỊ CỐT LÕI nào của bạn?" | Link `values` tới **Trang Giá Trị** (xem §2) | Trụ thương hiệu — content không truy về ≥1 giá trị = lạc giọng, loại |
| 5 | 💚 **Con người** (people) | "Bạn đã THẤY/NGHE/BIẾT chuyện thật của ai liên quan điều này?" | Link `people` tới trang người/chuyện người thật | Avatar khán giả sống + social proof |
| 6 | 💙 **Thời gian** (time) | "Sự kiện này xảy ra KHI NÀO trong thực tế?" | `nodes.event_date` (thời gian SỰ KIỆN, không phải ngày tạo trang — viết về lịch sử thì là quá khứ) + link `time` nối vào dòng đời | Timeline cuộc đời làm GỐC — càng nối càng sâu sắc chính cuộc đời mình; content "transformation" trước/sau |
| 7 | 💗 **Tham chiếu** (reference) | "Nguồn ở đâu? Trang nào hướng tới, trang nào trỏ về?" | Nguồn ngoài (props.refs: sách/URL/video) + link `reference` 2 chiều + **excerpt** (trích đoạn/quote cụ thể) | Chuỗi trích nguồn — credibility, chống bịa |
| 8 | ❤️ **Neo** (anchor) | "Rút thành câu CHÂM NGÔN CỦA CHÍNH BẠN?" | Quote của user → lưu vào trang **🧭 Kim Chỉ Nam** + link `anchor` về bài gốc | Căn tính bất biến — kim chỉ nam khi trend đổi; chữ ký tư tưởng trong mọi content |

**Quy tắc liên kết mức ĐOẠN/QUOTE:** liên kết quý nhất không trỏ tới cả trang mà tới **một câu cụ thể**. Bảng `links` có `excerpt` (trích đoạn nguồn) — khi nối, user có thể dán/chọn câu đắt nhất. AI trích đúng câu, không trích cả trang.

## 2. Hệ Giá Trị Cốt Lõi (trái tim của "đúng con người mình")

- User định nghĩa **3–7 Giá Trị Cốt Lõi** (trang đặc biệt trong trang cha "⭐ Giá trị cốt lõi", `props.role='value'`). Ví dụ: Tự do, Chính trực, Gia đình, Phụng sự.
- Mỗi lần Thấm, bước Giá trị hỏi: bài này phụng sự giá trị nào → link `values`.
- **Trang giá trị được trỏ về nhiều nhất = trụ thương hiệu số 1** của user. AI đo được "con người bạn" bằng phân bố này — không cần user tự mô tả.
- Trang "🧭 Kim Chỉ Nam" (`props.role='anchor'`) gom mọi quote user tự viết — đây là giọng nói tinh khiết nhất của họ.

## 3. Timeline cuộc đời làm gốc

- Mọi trang có thể mang `event_date` = **thời gian sự kiện thực tế** (không phải ngày tạo).
- **Dòng đời cá nhân là trục gốc**; sự kiện kho QNET/nhân loại neo theo trục đó.
- View Galaxy "📜 Dòng đời": trục thời gian, đời mình là xương sống, tri thức 2 kho kia bám quanh các mốc. Càng nối time → cuộc đời càng được "đan" dày → content hành trình cực mạnh.

## 4. Thước đo (2 tầng, đừng nhầm)

1. **Độ Thấm / trang** — radar 5 cạnh (Nối·Nghĩa·Chứng·Trải·Hành) chấm MỨC THẤM một bài. Được nuôi bằng việc đi qua 8 chiều khi Thấm (mapping trong THAM-DESIGN). Trang Thấm cao = node sáng + to trên Galaxy.
2. **Chỉ số AI-hiểu-bạn / user** — đo AI có đủ chất liệu hiểu con người này chưa (%):
   - Giá trị cốt lõi đã định nghĩa? Quote Kim Chỉ Nam? Bao nhiêu trang Thấm sâu? Mật độ liên kết 8 chiều có cân không? Nhật ký có đập (note 7 ngày gần nhất)? Trang Con người? Event_date phủ dòng đời? Voice profile?
   - **Tăng độ hiểu = "Thấm cùng AI"**: phiên hỏi-đáp AI phỏng vấn user về đời, cách nghĩ, cách nói (khi cắm API) — mỗi phiên lấp một vùng AI còn mù.
   - Van an toàn: AI **chỉ được viết content bằng giọng user** từ vùng đã hiểu (trang Thấm cao + giá trị đã nối). Vùng chưa hiểu → AI chỉ được hỏi/gợi ý học.

## 5. Vòng lặp lớn (kim chỉ nam sản phẩm)

```
SỐNG (trải nghiệm thật)
  → GHI (ghi nhanh Today / trang nhật ký, event_date)
  → THẤM (đi qua 8 chiều → radar sáng, graph dày, AI hiểu thêm)
  → CONTENT (AI: hook nhân loại + khung QNET + chuyện cá nhân + neo giá trị, theo giọng)
  → KẾT QUẢ (Board Đã đăng + ghi nhận phản hồi/khách hàng → trang Con người cập nhật nhu cầu)
  → COACHING (AI đọc pulse + kết quả → gợi ý sống/học/bán tiếp gì)
  → quay về SỐNG
```
Đứt mắt xích nào, sản phẩm chết mắt xích đó. Mọi sprint phải trả lời: "đang trám mắt xích nào?"

## 6. Nguyên tắc bất biến cho AI (khi cắm API)

1. Trích nguồn `node_id` + excerpt cho mọi câu — không truy vết được thì không nói.
2. Retrieval = hybrid search + mở rộng 1–2 bước qua links (ưu tiên chiều phù hợp mục đích) + re-rank theo Độ Thấm + trọng số thời gian (pulse 7–30 ngày).
3. Giọng = Kim Chỉ Nam + phân bố Giá trị + voice profile. Content phải neo ≥1 giá trị cốt lõi.
4. Link tạo lúc Thấm nặng hơn link @mention (cột `weight`).
5. Key chỉ ở server (Edge Function). Model: Haiku cho phân loại/đề xuất, Sonnet+ cho content cuối.
6. AI không auto-publish bất cứ gì — luôn human-in-the-loop.

## 7. Những gì đã LOẠI khỏi framework cũ

- ❌ Nhánh "transmission / biến thành bài học dạy người khác" như cấu trúc riêng — thay bằng: trao giá trị qua CONTENT trong vòng lặp lớn.
- ❌ Liên kết chỉ mức trang — nâng thành mức đoạn/quote (excerpt).
- ❌ Thời gian = ngày tạo trang — thay bằng event_date thực tế.
- ❌ Hai chữ "Học bài/Thẩm thấu" lẫn lộn — thống nhất một chữ: **Thấm**.
