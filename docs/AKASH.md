# 🌌 AKASH — Bản tổng (Single Source of Truth)

> Cập nhật 2026-06-16. File này là **nguồn sự thật duy nhất** cho ý nghĩa · tầm nhìn · giá trị · cách tổ chức của Akash. Mọi doc khác là chi tiết kỹ thuật; khi mâu thuẫn → theo file này. Đọc cùng: [DECISIONS](DECISIONS.md) (luật) · [KHO-CHUAN](KHO-CHUAN.md) (kho+trường) · [FRAMEWORK](FRAMEWORK.md) (8 chiều) · [WORKLOG](WORKLOG.md) (nhật ký build).

---

## 1. Akash là gì — trong một câu
**Akash** (akasha — "hư không lưu trữ mọi tri thức") là **bộ não thứ hai biết thấu cảm**: bạn *sống* → *ghi lại* → Akash giúp *chuyển hoá* trải nghiệm thành tri thức có liên kết → **AI hiểu bạn sâu hơn mỗi ngày** → trả lại bạn *content đúng giọng* + *lời khuyên đúng người đúng lúc* → ra *kết quả thật* → nuôi lại cuộc sống.

Không phải kho lưu trữ tĩnh. Là **người bạn tâm giao + trợ lý thiên tài (Jarvis)** mọc ra từ chính cuộc đời bạn, mạnh dần khi ghép với các model LLM mới nhất.

## 2. Tầm nhìn 10 năm · Sứ mệnh · Giá trị
- **Tầm nhìn**: Thay đổi *cách con người học, nắm và sắp xếp thông tin* — biến thông tin xáo rỗng thành **giá trị sống được**. Mỗi người có một "phiên bản số hoá hoàn hảo của chính mình" đồng hành.
- **Sứ mệnh**: Để **AI lo phần thông minh, con người lo phần SỐNG** — sống nhiều trải nghiệm tích cực, kết nối sâu, mạnh mẽ bên trong. Akash là cây cầu giữa hai phần đó.
- **Giá trị cốt lõi**: ① Mỗi cuộc đời là một viên kim cương đang được mài. ② Tri thức = liên kết, không phải trang rời. ③ Ghi để SỐNG rõ hơn, không phải để tích trữ. ④ Ít thao tác — sâu ý nghĩa (chống cognitive load). ⑤ Dữ liệu của bạn là của bạn.

## 3. Vòng lặp cốt lõi (xương sống mọi luồng)
```
SỐNG  →  GHI (30s, có khung)  →  CHUYỂN HOÁ (nối 8 chiều + rút 1 câu)
   ↑                                              ↓
KẾT QUẢ  ←  CONTENT (đúng giọng)  ←  AI HIỂU BẠN (RAG + ngữ cảnh cảm xúc)
```
Mỗi trang đi trọn vòng = một mặt kim cương được mài sáng.

## 4. 🌈 HÀNH TRÌNH MÀU SẮC (linh hồn cảm xúc của Akash)
Mỗi trải nghiệm mang một **màu cảm xúc**. Việc của Akash không chỉ là lưu — mà **dìu người dùng đi qua phổ màu**:

| Màu | Trạng thái | Akash làm gì |
|---|---|---|
| 🔴 Đỏ | đau, sợ, tổn thương, bế tắc | đón nhận, không phán xét; lục lại lần trước bạn đã vượt qua thế nào |
| 🟡 Vàng | lo âu, hoài nghi, do dự | làm rõ nghĩa bằng câu hỏi đào sâu; biến mơ hồ → 1 bài học |
| 🟢 Xanh | bình an, tăng trưởng, kỷ luật | củng cố thành nếp; nối vào giá trị cốt lõi |
| 🩷 Hồng | vui, biết ơn, kết nối, yêu thương | khuếch đại; thành content truyền cảm hứng |
| 🤍 Trắng kim cương | hội tụ, tỉnh thức, kết nối với GOD/sức mạnh bên trong | đỉnh chuyển hoá — viên kim cương sáng trọn |

**Nguyên tắc**: người mới thường đỏ/vàng nhiều. Làm việc với Akash đều đặn → tỉ lệ chuyển dần sang xanh → hồng → trắng. **Dòng đời (timeline)** và **Galaxy** *nhuộm node theo màu cảm xúc* để bạn NHÌN THẤY hành trình mình đang sáng dần lên — đây là thước đo phát triển thật nhất, hơn mọi con số. (Triển khai: cột `emotion` + `vibe_color`; band cảm xúc trên Dòng đời; thẻ mẫu hình ở Home.)

## 5. Cấp độ tổ chức — 3 vòng đồng tâm ("con mắt thứ ba")
```
🧠 CÁ NHÂN (lõi)  →  🌐 QNET (giữa)  →  ♾️ NHÂN LOẠI (ngoài)
   riêng tư            của tổ chức         tri thức chung
```
- Tri thức **chảy LÊN** (cá nhân → chung) qua *nộp · duyệt · đề xuất*; **chảy XUỐNG** (chung → cá nhân) qua *ánh xạ* (🪞 đọc bài chung → ghi cảm nhận riêng → nối Tham chiếu).
- **Vai trò** (chuẩn, theo DECISIONS §A8): Admin 5 · Tổng biên tập 4 · Biên tập viên 3 · Cộng tác viên 2 · Thành viên 1. Kho chung do ban biên tập gác cổng; kho cá nhân chính chủ toàn quyền.

## 6. Phân bố file trong các kho
- **🧠 Cá nhân — 7 cây gốc**: 📓 Hành trình anh hùng · 🧭 La bàn giá trị (+ Kim Chỉ Nam) · 💎 Kim cương bài học · 🤝 Vòng tròn quan hệ · 📚 Tủ nguồn tinh hoa · 🎬 Xưởng content · 💰 Dòng chảy thịnh vượng. + trang đặc biệt: 🪞 **Tôi là ai** (hồ sơ AI hiểu bạn) · ⚙️ Thiết lập kho.
- **🌐 QNET — A–F**: A.Kiến thức căn bản · B.Sản phẩm · C.Founders & The V · D.Guru Maa · E.Kỹ năng bán hàng · F.Hệ thống & văn hoá. (+ 📐 Chuẩn nội dung admin-only.)
- **♾️ Nhân loại — 6 nhánh**: Dòng thời gian · Thế giới & khoa học · Minh triết & triết lý · Con người & xã hội · Kinh tế & kinh doanh · Người thầy & vĩ nhân. + 📰 Dòng tin ngành (News) + 🪞 **AI hiểu cộng đồng/user** (xem §9).
- **Nguyên tắc sắt**: mỗi trang chỉ có MỘT nhà (cây gốc theo loại); mọi nơi khác cần → **liên kết**, không copy.

## 7. 7 loại trang + Properties theo loại (3 tầng — chống cognitive load)
**7 loại** (Trục 1): 🌱 trải nghiệm · 🎓 bài học · 📋 quy trình · 👤 hồ sơ · 📚 nguồn · 🌟 sự kiện · 📝 ghi chú (inbox — trạng thái chờ phân loại, KHÔNG phải loại cố định). Trục 2 (định dạng content ở Xưởng): blog/video/reel/email/caption/talk.

**Properties = 3 tầng cộng dồn:**
- **Tầng 1 — Máy tự lo** (user không gõ): id · Cây gốc · Loại trang · Ngày · `last_modified` · **Từ khoá auto 5** (heuristic, 0 token) · tier Chuyển hoá (derive).
- **Tầng 2 — Theo loại** (xem bảng): trải nghiệm → Cảm xúc+màu, người liên quan, bài học 1 câu, `mood/energy/intent`; bài học/quy trình/nguồn/tin → `confidence` (độ tin); nguồn/tin → link ngoài + câu trích đắt + dùng khi nào; hồ sơ → giai đoạn/nhu cầu/kênh.
- **Tầng 3 — Theo kho**: cá nhân + "Trường của tôi" (Mức ưu tiên · Trạng thái áp dụng · tự thêm); QNET/Nhân loại do ban biên tập khoá + 2 trường vàng cho AI.

→ Mỗi trang chỉ thấy trường của loại nó. **`confidence` chỉ ở tri thức (bài học/quy trình/nguồn/tin)** — nhật ký không cần.

## 8. 8 chiều — tách THUỘC TÍNH ↔ LIÊN KẾT (lõi chống rối, KHO-CHUAN §5)
- **Thuộc tính** (điền trên trang, KHÔNG nối): 🧡 Cảm xúc · 💙 Thời gian · (📚 Nguồn ngoài = url).
- **Liên kết** (quan hệ trang↔trang, 1 nút "＋ Nối", máy TỰ gán chiều theo loại đích): 💧 Kiến thức · 🌱 Trải nghiệm · 💚 Con người · 💜 Giá trị · ❤️ Neo · 💗 Tham chiếu.
- **Điểm Chuyển hoá** = `transformScore.ts` derive từ links + thuộc tính (bão hoà chống farm; experience+anchor nặng nhất). **Không cần AI/token.**

## 9. ⭐ AI HIỂU USER (trọng tâm) — 3 tầng dữ liệu
Theo nghiên cứu "Semantic & Emotional Context": để AI thành tâm giao, dữ liệu chia 3 tầng:
1. **CORE (la bàn)** — 🪞 *Tôi là ai* + La bàn giá trị + Kim Chỉ Nam + **DISC/MBTI** + **Hồ sơ giọng** (`writing_style`, `forbidden_words` — chặn AI dùng "đột phá/vượt trội", `favorite_quotes`). AI dùng làm la bàn: mọi lời khuyên/content không đi ngược bản chất bạn.
2. **TIMELINE cảm xúc** — nhật ký theo ngày + `mood`/`energy_level`/màu. AI nhận **mẫu hình** ("3 ngày liền pin ≤3 → nghỉ"), và **đổi tone** theo trạng thái (buồn → giọng ấm, lục bài thành công cũ để khích lệ).
3. **KNOWLEDGE** — Kim cương/Tủ nguồn/QNET/Nhân loại. AI dùng để thực thi (viết content trộn *kiến thức tầng 3* + *giọng tầng 1*).

**🪞 Graph "AI hiểu bạn"** (nhánh trong Nhân loại — sẽ build): mỗi *lát* (Giá trị · Cảm xúc · Kỹ năng · Mẫu hình · Tính cách) là 1 node, **AI tổng hợp định kỳ** về bạn, **lưu mốc theo thời gian** → mở ra thấy AI hiểu mình rõ hơn ở đâu, và bản thân phát triển thế nào. Chỉ số "% AI hiểu bạn" hiện có = cửa vào nhánh này.

**RAG khi cắm key**: props (= YAML frontmatter) + body → embedding (pgvector). Truy xuất theo `mood`/`tags`/`type` → prompt ẩn ("user mood sad → lục note status completed → giọng warm"). summary+tags+type = mỏ neo vector → rẻ token, nhanh 5–10×.

## 10. User UP CONTENT + Content Engine — "con người thiên tài bên trong"
Vòng: **đọc/sống → rút insight (đào sâu 30s) → vào 💎 Kim cương → AI trộn với Hồ sơ giọng → ra content đúng giọng không ai biết là máy → đăng → kết quả → mốc mới.**
- 3 nguồn cảm hứng đổ về Kim cương: Người khổng lồ (KOL) · Tin ngành (News) · ghi nhanh ở Home — cùng một luồng đào sâu.
- Content Engine: setup hồ sơ MỘT LẦN (vai/khán giả/điểm mạnh/vùng cấm/trụ/nhịp) → mỗi ngày "Hôm nay tạo gì?" 1 bấm → prompt hoàn chỉnh (gắn chuyện thật + giọng).

## 11. Akash = Jarvis khi ghép LLM mới nhất
Akash chuẩn bị sẵn "ngữ cảnh + cảm xúc" (Properties giàu, 3 tầng dữ liệu, graph). Khi cắm Claude/GPT mới nhất qua `ai_jobs`: phân loại inbox · gợi ý nối · viết content đúng giọng · phát hiện mẫu hình cảm xúc · coaching theo la bàn giá trị. **AI key chỉ ở server** (Edge Function secret).

## 12. Các góc nhìn (Galaxy) — ý nghĩa, không trùng
🌌 Galaxy (cấu trúc/phân cấp) · 🧘 Mandala (cây sự sống — thẩm mỹ) · 🎯 Radar (8 chiều cân/lệch — chẩn đoán) · 📜 Dòng đời (3 thang thời gian + màu cảm xúc) · 🧠 Neuro (não — node cô lập = chưa nối) · 🪐 3 Vòng/Mắt thứ ba (3 kho giao thoa) · 🌐 3D (xoay/zoom/search-sáng-node-liên-quan). *Toggle: 🖼 Icon · 🎨 Depth. Tất cả auto-canh-khung, nền vũ trụ mọi theme.*

## 13. Nguyên tắc UX (luật vàng)
1. **Khung xương sống dẫn dắt**: user không đối diện trang trắng — luôn có khung câu hỏi/loại trang gợi mở.
2. **Máy điền tối đa, user nghĩ tối thiểu** (1–2 trường thật sự cần).
3. **Tách quyết-định-một-lần khỏi mỗi-lần** (setup hồ sơ 1 lần; ghi hằng ngày nhẹ).
4. **Một chữ, một số**: "Chuyển hoá" + điểm 8 chiều — không hai hệ điểm đá nhau.
5. **Đẹp có nghĩa**: glow/màu/animation phục vụ hiểu, không loè.

## 14. Lộ trình
- **Bây giờ (0 token)**: heuristic — keyword, mẫu hình, điểm, search. Pilot 5 user thật, đọc panel Hành vi.
- **Cắm key (Phase 2)**: embedding pgvector + RAG + prompt ẩn + AI tổng hợp "AI hiểu bạn" + viết content.
- **Khép vòng (Phase 3)**: kết quả kinh doanh → nuôi lại; cầu nối hệ sinh thái QNET.

---
*Phụ lục — dọn dẹp đang theo dõi (xem [WORKLOG](WORKLOG.md) & cleanup list): gộp page_type↔subtype về 1 taxonomy; gộp luồng tạo trang (Home cap vs Studio); ẩn mode Galaxy nâng cao sau toggle "thử nghiệm"; sửa nút "Mở việc" (assignments.node_id) chết; ReviewHub ghi content JSON; tối ưu lag map.*
