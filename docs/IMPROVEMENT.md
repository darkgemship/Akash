# 🤝 Sổ hiểu nhau — Founder ⇄ Claude

> Mục đích: mỗi phiên làm việc, ghi lại điều giúp **mình hiểu bạn hơn** và **bạn hiểu mình hơn**, để lần sau cộng tác nhanh & đúng ý hơn. Đọc file này đầu mỗi phiên cùng với `docs/DECISIONS.md` và `docs/WORKLOG.md`.
> Quy ước: phần "Chân dung" + "Nguyên tắc" là đúc kết ổn định (sửa khi có gì đổi); phần "Nhật ký" chỉ thêm dòng mới, không xoá.

---

## 1. Chân dung bạn (founder Akash)
- **Vai trò**: founder Akash, **không phải dev**. Nghĩ theo **sản phẩm & trải nghiệm**, không theo code.
- **Cách làm việc**: từng đợt dài, nhiều phiên liên tiếp; bắn **nhiều yêu cầu nhanh**, hay kèm **ảnh chụp màn hình** chỉ thẳng vào chỗ chưa ổn.
- **Ngôn ngữ**: tiếng Việt, gõ nhanh (đôi khi có lỗi chính tả/dấu — mình tự hiểu ý, không bắt bẻ).
- **Gu**: trực giác mạnh về thẩm mỹ — lặp tới khi **"như ý"** mới thôi (graph/3D là ví dụ rõ nhất). Thích **gọn, mạch lạc, tách bạch**, ghét rối & "giật".
- **Cách quyết định**: hay uỷ quyền ("**theo ý của bạn**") nhưng với câu hỏi **triết lý sản phẩm** thì muốn **"biện luận với tôi"** trước khi code.
- **Giá trị cốt lõi**: bảo mật & riêng tư (key chỉ ở server; không đụng project thật 578 user); dữ liệu của user là của user.

## 2. Chân dung mình (Claude) — để bạn dùng mình tốt nhất
- **Mình luôn**: verify sau khi sửa (`tsc --noEmit` + server 200), ghi `WORKLOG.md`, chạy security advisor sau khi đổi DB, giữ key ở server.
- **Mình làm tốt nhất khi**: có **ảnh/ví dụ cụ thể** (vì mình **không thấy được UI đang chạy** — chỉ thấy qua ảnh bạn gửi); yêu cầu nói rõ "muốn gì" hơn là "sửa cái này".
- **Giới hạn của mình**: không bấm được **cài đặt Dashboard Supabase** (vd tắt signup) — phải nhờ bạn làm tay; không tự chạy `/code-review ultra` hay các lệnh bạn phải tự gõ; phiên rất dài thì context bị **nén** (mình vẫn tiếp tục được).
- **Cách mình phản hồi**: ưu tiên **khuyến nghị + lý do**, không liệt kê lan man; việc khó đảo ngược thì hỏi trước.

## 3. Nguyên tắc cộng tác đã chốt
- Việc **nhiều yêu cầu chồng nhau** → mình **gom batch**, làm xong **verify**, rồi báo + **liệt kê việc còn lại** cho bạn chọn thứ tự.
- Câu hỏi **"nên hay không / chiều nào"** → mình **bàn trước, không code** cho tới khi bạn chốt.
- Quyết định lớn → ghi vào `DECISIONS.md`; tiến độ → `WORKLOG.md`; cách hiểu nhau → **file này**.
- Mình **không tự giảm chất lượng** (vd model rẻ) để tiết kiệm — đó là quyết định của bạn.

## 4. Nhật ký hiểu nhau (thêm mỗi phiên)
### 2026-06-16
- Bạn xác nhận: thích kiểu **"biện luận trước khi code"** cho câu hỏi sản phẩm (vd Chuyển hoá nên áp cho kho cá nhân không → chốt phương án B: tách Nội hoá/Đúc kết). → Mình sẽ chủ động hỏi "bàn hay làm luôn?" khi gặp câu mang tính triết lý.
- Bạn làm việc kiểu **chỉ tay qua ảnh** rất nhiều → mình học cách **đọc kỹ ảnh + đối chiếu code** trước khi sửa, và xác nhận lại đúng chỗ bạn nói.
- Bạn quan tâm **bảo mật & phân quyền** sâu (kho cá nhân riêng tư, admin cấp tài khoản, chặn tự đăng ký) → mình ưu tiên vá RLS + dựng cơ chế đúng chuẩn, và nói rõ bước nào bạn phải tự làm.
- Bạn thích **mọi việc cần làm hiện realtime** (giao việc → "Cần làm" ngay) → mình dùng Supabase realtime thay vì bắt refresh.
- Phong cách bạn: **dồn dập nhưng tin tưởng uỷ quyền** → mình giữ nhịp "làm trọn từng mảng + verify + báo gọn", không hỏi vặt những thứ có mặc định hợp lý.

### 2026-06-17
- Bạn hay yêu cầu **"audit + đóng gói docs cho nhất quán"** sau các đợt build nhanh → mình học: các quyết định mới dễ chỉ nằm ở WORKLOG, phải chủ động đẩy về file "hiến pháp" (DECISIONS/BRANDING/ROLES/GRAPH-VISION) ngay trong phiên, lấy **code làm nguồn sự thật** (vd `DIM_COLOR`) thay vì chép WORKLOG cũ.
- Bạn thích **"đề xuất vài view mới cho đẹp hơn"** — gu sáng tạo + thẩm mỹ. → Mình nên luôn kèm 2–4 phương án có thứ tự ưu tiên (rẻ/đẹp trước) chứ không chỉ làm 1.
- Mình dùng **agent chạy song song** để audit docs + code khi khối lượng lớn → nhanh & đỡ sót; nên tiếp tục khi việc đọc trải rộng nhiều file.
- Bạn muốn cả **"function nào cần chuẩn bị"** → mình nên kết mỗi đợt bằng danh sách hạ tầng/RPC sắp cần, không chỉ việc UI.
