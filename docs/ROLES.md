# Akash — Roles & Phân quyền (cập nhật 2026-06-17)

> Ai làm được gì. Đồng bộ schema `memberships` + RLS trong Supabase project **data QI** (`vntndprivvkgjbeutand`).
> Nguồn chốt tên vai: `DECISIONS.md §A8`. Tài khoản **do Admin cấp** (Edge `admin-create-user`), KHÔNG tự đăng ký.

## Trục phân quyền (đã code)
1. **Level (1–5)** — `memberships.level`. Đọc node kho chung nếu `level ≥ node.min_level`.
2. **Editorial** — `can_edit` (soạn kho chung, qua duyệt), `can_approve` (duyệt & publish + thấy bài pending).
3. **Team** — `memberships.sponsor_id` (upline) → Admin/Tổng BT xem hành vi downline (panel Nhân sự).

## Bảng vai trò (5 vai)

| Vai | level | can_edit | can_approve | Làm được |
|-----|:--:|:--:|:--:|----------|
| **Thành viên** | 1 | – | – | Kho cá nhân riêng tư (toàn quyền của mình) + đọc bài kho chung đã publish ≤ level. Chuyển hoá/Đúc kết, ghi nhanh, giao diện Hôm nay. |
| **Cộng tác viên** | 2 | – | – | + đọc kho chung ≤2; tham gia Content Engine. |
| **Biên tập viên** | 3 | ✅ | – | + soạn/sửa bài kho chung (status `pending`, **qua duyệt**), tạo liên kết, nhận việc giao. |
| **Tổng biên tập** | 4 | ✅ | ✅ | + **duyệt/publish** bài kho chung, trả lại kèm góp ý, giao & **nghiệm thu** việc, chat Phòng biên tập, xem hành vi team. |
| **Admin** | 5 | ✅ | ✅ | toàn quyền: **cấp tài khoản**, đổi vai, seed kho chung, xoá. KHÔNG đọc được kho cá nhân của người khác (RLS chặn). |

> Khi Admin cấp tài khoản: `member`→level 1 · `editor`→level 2+can_edit · `chief`→level 4+can_edit+can_approve.

## Riêng tư & bảo mật (mới)
- **Kho cá nhân (`layer='personal'`)**: CHỈ chủ đọc/sửa/xoá. Admin/Tổng BT **không** đọc/can thiệp được (RLS `node_select/update/delete` chặn theo `owner_id`).
- **Liên kết** chỉ hiện khi thấy được cả 2 đầu (`can_see_node`) → link giữa 2 trang cá nhân người khác (kèm trích đoạn) bị ẩn hoàn toàn.
- **Giọng/branding** ở bảng riêng `user_voice` (owner-only), không nằm trong `profiles`.
- **Kho QNET (`corporate`) + Nhân loại (`humanity`)** = tài sản chung: thành viên đọc bài published theo level; biên tập soạn (qua duyệt); seed 1 lần qua `seed_qnet`.

## Map vào code
- Quyền: bảng `memberships` (level/can_edit/can_approve/sponsor_id) — sửa qua RPC `admin_set_member` hoặc UI Nhân sự.
- Cấp tài khoản: Edge Function `admin-create-user` (xác thực caller là Admin → service role tạo user + membership).
- Đọc kho chung: RLS `node_select` (`my_level ≥ min_level`). Sửa: `node_insert/update` (`can_edit_org`). Helper riêng tư: `can_see_node`.
- Khuôn cá nhân: RPC `bootstrap_me()` (kho + 7 hub + 🪞 Tôi là ai + 7 nhánh chủ đề có page_type). Reset: `vault_reset`. Sao lưu: `snapshot_create/restore`, cron `snapshot_auto_all` (2 ngày).

## ⚠️ Production
- Hiện mỗi user vào 1 org chung (user đầu = Admin). Tài khoản do Admin cấp tay (đã chặn tự đăng ký ở app; cần tắt signup ở Supabase Dashboard để khoá cứng).
- Tương lai: SSO + gán level theo rank từ quanlysukien (xem ROADMAP).
