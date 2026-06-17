# 🌌 GRAPH-VISION — Bản chốt visual graph (founder duyệt qua hỏi-đáp 2026-06-16)

> File HỢP ĐỒNG cho phần graph. Đã iterate nhiều lần chưa ưng → đây là spec founder tự chọn từng mục.
> Khi code graph mâu thuẫn với cảm nhận, theo file này. Đọc cùng `RESEARCH-VIZ-ARCH.md` (cơ sở kỹ thuật) và `BRANDING.md`.
>
> ⚠️ **CẬP NHẬT 2026-06-17 (đè lên mọi chỗ ghi "8 chiều" bên dưới):** graph **chỉ vẽ 6 CHIỀU QUAN HỆ** (Kiến thức·Con người·Trải nghiệm·Tham chiếu·Giá trị·Neo). `time`→view Dòng đời, `emotion`→thuộc tính (trùng experience). **Màu chiều đã đổi** để tách khỏi 3 màu kho — nguồn sự thật `Galaxy.tsx DIM_COLOR` (xem `BRANDING.md`). Khung Chuyển hoá vẫn ĐỦ 8 cánh. Đề xuất view MỚI cho 6 chiều: `docs/AUDIT-2026-06-17.md` §C.

## 0. Một câu
Graph = **vũ trụ tri thức choáng ngợp, thơ** — mở ra để *chiêm ngưỡng* (vẻ đẹp là mục tiêu chính, không phải tiện ích kiểu Obsidian). 3 kho = 3 thiên hà, mỗi cái nổi bật riêng.

## 1. Linh hồn (vibe)
- **Vũ trụ / thiên hà**: không gian sâu, nebula glow, sao nền, hạt sáng. Nền tối vĩnh viễn (galaxy luôn dark, theo DECISIONS §A.1).
- Bỏ cảm giác "sơ đồ phẳng". Mọi view phải có chiều sâu thị giác.

## 2. Các view giữ lại (bỏ same-same)
Chỉ còn **4**: 
1. **Thiên hà 2D** (chính) — galaxy mode
2. **Cây Sự Sống** — mandala (thiền giả dưới, kho mở quạt lên)
3. **Dòng Thời Gian** — timeline theo event_date
4. **3D** — bay trong vũ trụ thật, ưu tiên **mượt**

→ Gỡ khỏi thanh chuyển view: Radar, Vòng (rings), Neuro (giữ code, ẩn nút).

## 3. MÀU — quy tắc vàng (gốc của "màu chưa như ý")
Trước đây trộn 3 hệ màu cùng lúc (5 tầng cầu vồng × 8 chiều × cảm xúc) → loạn. Chốt tách bạch:

- **NODE = màu theo KHO** (1 hue/kho, KHÔNG cầu vồng):
  - Đời tôi (personal) = **tím** `#8b5cf6`
  - QNET (corporate) = **vàng** `#f5b942`
  - Nhân loại (humanity) = **hồng** `#e879f9`
  - **Đậm/nhạt theo độ sâu**: level nông (gần tâm) = đậm/bão hoà; sâu = nhạt/mờ dần. (1 hue, đổi lightness+alpha, KHÔNG đổi hue.)
- **ĐƯỜNG NỐI = màu theo 8 CHIỀU** (DIM_COLOR giữ nguyên), là nhân vật chính: đậm hơn hiện tại, cong nhẹ, **mũi tên hướng**, **hạt năng lượng chạy dọc**.
- **BỎ khỏi mặc định**: màu cảm xúc 9 bậc + cầu vồng 5 tầng. (Có thể giữ làm toggle phụ, không bật sẵn.)
- Nguyên tắc: **node kể "thuộc về đâu", đường kể "quan hệ loại gì"**. Mắt không phải giải mã 3 hệ cùng lúc.

## 4. Layout — vòng tròn đồng tâm theo level (founder mô tả trực tiếp)
- Mỗi kho 1 **tâm thiên hà** (ngôi sao), 3 kho bố trí tam giác, mỗi thiên hà **nổi bật riêng** (glow/màu kho).
- Node con xếp **theo level thành quỹ đạo đồng tâm** quanh tâm kho:
  - **Level 1** = vòng trong, xoay quanh tâm trên **một đường tròn mờ** (vẽ guide-ring mờ).
  - **Level 2** = vòng rộng hơn; level sâu hơn = vòng ngoài hơn.
- **Vẽ các đường tròn quỹ đạo mờ** làm nền (như quỹ đạo hành tinh) — đây là yêu cầu rõ của founder.
- Áp cho cả 2D và 3D (3D = shell cầu đồng tâm + ring mờ).

## 5. Nhịp chuyển động — "vũ trụ ĐANG SỐNG"
- Hạt năng lượng chạy dọc đường nối (màu theo chiều).
- Sao nhấp nháy nhẹ, node "thở", thi thoảng 1 vùng "firing" sáng lên.
- Thiên hà tự xoay nhẹ (3D). Liều vừa phải — sống động nhưng không loè.

## 6. Khoảnh khắc WOW khi tương tác (founder chọn cả 2)
- **① Sao nở thành hệ**: click ngôi sao tâm kho → bung dần level 1 → 2 → 3 như pháo hoa nở chậm (staged reveal theo vòng).
- **② Hover → cả chòm bừng sáng**: rê lên 1 sao → chòm 1-hop bừng sáng như mạch điện lan, phần còn lại **mờ đi** (dim). Click → mở peek trang.

## 7. Ràng buộc kỹ thuật (giữ từ DECISIONS/RULES)
- Galaxy luôn dark. Emoji chỉ cho icon trang/nội dung, chrome dùng SVG. Math.round điểm int. hsla cho canvas (không ghép hex alpha vào hsl). 3D nhẹ GPU máy yếu (antialias off ok) nhưng phải **mượt** — ưu tiên fps.
- Một nguồn công thức điểm: `transformScore.ts`. Size/độ sáng node có thể buộc theo `total` (độ Chuyển hoá).

## 7bis. Phản hồi vòng 3 (founder, 2026-06-16, kèm ảnh + YouTube xHAZo1SmnhM)
- **Data đã tạo lại SẠCH** (scripts/seed-galaxy.mjs): cây hình tháp 7/6/6 nhánh → chủ đề → lá-theo-khía-cạnh. Cá nhân 100 · QNET 90 · Nhân loại 100. Lá đặt tên "{chủ đề} — {khía cạnh}" (Khái niệm/Ví dụ/Bài học/Câu hỏi mở/Ứng dụng…) đúng mục tiêu "hiểu 1 chủ đề ở nhiều khía cạnh". 160 link 8 chiều (65% trong kho, 35% xuyên kho, ~30% có quote→đậm). Chạy lại: `node scripts/seed-galaxy.mjs`.
- **Size + màu theo LEVEL ở MỌI view** (kể cả Cây sự sống): càng xa tâm → node **nhỏ hơn** + **màu nhạt hơn**. (galaxy đã có; cần áp cho mandala/khác.)
- **HOVER = hiện CHA + CON trước** (cấu trúc cây); **CLICK mới ra node THAM CHIẾU (8 chiều) bắn vào** (burst). [đã làm 2D]
- **3D — việc cần làm (ưu tiên cao, làm cho "thú vị + trực quan + mượt"):**
  1. **Căn tâm sao kho**: icon + tên + tâm glow của kho phải TRÙNG nhau (đang lệch mỗi nơi mỗi ngả).
  2. **Bỏ auto-reset camera**: bấm node/mắt xích bị "giật ra giật vào"; xoay thì cứ tự quay về view mặc định thấy cả 3 thiên hà → giữ nguyên góc, không ép frame-all.
  3. **Thêm vòng quỹ đạo** + **liên kết CHA–CON vẽ mũi tên thẳng bắn vào nhau**.
  4. **Liên kết 8 chiều (thẩm thấu) = đường CONG bắn vào**, màu theo chiều. Lưu ý: vài "chiều" chỉ là quote/parameter (không có cạnh bắc qua) → không phải mọi quan hệ đều là đường link.
  5. **Thẩm mỹ tham chiếu (ảnh 5)**: cầu màu to (size theo degree), nhãn rõ, layout force mượt — NHƯNG giữ cấu trúc orbital logic của ta. Mục tiêu: user hiểu 1 chủ đề ở nhiều khía cạnh + thấy liên kết tới page khác.
  6. **Mượt là điều kiện sống còn** (founder nhấn nhiều lần).

## 8. Thứ tự thực thi (đổi 80% cảm giác trước)
1. **Màu node theo kho (1 hue, đậm-nhạt theo level)** — gỡ cầu vồng 5 tầng. (2D + 3D)
2. **Đường nối 8 màu nổi + hạt chạy + mũi tên** (đặc biệt 3D đang xám).
3. **Vòng quỹ đạo mờ theo level** quanh mỗi tâm kho.
4. **Hover → chòm 1-hop bừng, còn lại dim.**
5. **Click sao kho → nở thành hệ từng tầng.**
6. Gỡ Radar/Vòng/Neuro khỏi thanh view (còn 4).
7. Tinh chỉnh nhịp sống (twinkle/breathe/firing) cho vừa liều.
