# Template Tiêu Chuẩn — mọi file trong Akash (đồng nhất đầu vào)

> Mọi trang nhập qua Studio đều theo khung này. Admin chỉnh bản sống tại trang **📐 Template đầu vào** (kho QNET) — sửa ở đó là đổi chuẩn cho cả org. AI đọc các trường này để retrieval/sinh content chính xác.

## Cấu trúc chuẩn (thứ tự cố định)

```markdown
# {Tiêu đề — ngắn, có từ khoá}

**Loại:** {1 trong 8: Ghi chú/Bài học/Trải nghiệm/Blog/Video/Kịch bản/Khách hàng/Sách}
**Ngày sự kiện:** {ngày THỰC TẾ nội dung xảy ra — không phải ngày tạo}
**Campaign:** {chiến dịch content nếu có}

**Tóm tắt 1 câu:** {AI dùng làm mô tả khi trích — bắt buộc}

**Nguồn:** {sách/URL/người kể/tự trải nghiệm}

{— phần thân theo template riêng từng LOẠI (admin chỉnh) —}

## 💎 Trích dẫn đắt
> {1–3 câu nguyên văn đắt nhất — nguồn cho excerpt khi liên kết}

## 📥 Nội dung gốc
{raw nguyên bản — không xoá, để AI đối chiếu}
```

## Trường bắt buộc vs tuỳ chọn

| Trường | Bắt buộc | Vì sao AI cần |
|---|---|---|
| Tiêu đề | ✅ | định danh + keyword retrieval |
| Loại | ✅ | chọn template content đầu ra |
| Tóm tắt 1 câu | ✅ | snippet khi trích dẫn, chống đọc cả bài |
| Ngày sự kiện | nên có | xếp vào Dòng đời, content theo mùa |
| Nguồn | nên có | credibility, chuỗi tham chiếu |
| Trích dẫn đắt | nên có | excerpt mức câu cho liên kết & content |
| Campaign | tuỳ | gom theo chiến dịch trên Board |
| Nội dung gốc | ✅ (auto) | AI đối chiếu khi viết lại |

## Sau khi tạo trang, chuẩn còn nằm ở DB (máy tự lo)
`props.page_type` · `event_date` · `props.campaign` · `props.via='studio'` · `status` (luồng duyệt) · links 8 chiều (+`excerpt`) · `props.principle` (sau khi Thấm).

## Quy ước đặt tên
- Khách hàng: `Tên – trạng thái` (vd "Chị Lan – khách hàng đầu tiên")
- Sách: tên sách gốc; chương = trang con
- Trải nghiệm: bắt đầu bằng động từ/sự kiện, có mốc thời gian trong bài
