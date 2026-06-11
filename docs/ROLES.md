# Akash — Roles & Chức năng (Role Functions)

> Ai làm được gì. Đồng bộ với schema (`memberships`) + RLS trong Supabase project **data QI** (`vntndprivvkgjbeutand`).

## 3 trục phân quyền (đã code)
1. **Clearance level (1–5)** — `memberships.level`. Thấy node official nếu `level ≥ node.min_level`.
2. **Editorial** — `memberships.can_edit` (sửa/up canon), `can_approve` (duyệt publish).
3. **Group** — `membership_groups` (Shakti/The V…) → `node` cần group tương ứng.
4. **Team** — `memberships.sponsor_id` (upline) → ISB/Admin xem insight downline.

## Bảng vai trò

| Vai | level | can_edit | can_approve | Thấy kho | Làm được |
|-----|:--:|:--:|:--:|----------|----------|
| **User / IR** | 1 | – | – | official L1 + vault cá nhân | đọc, ghi note, học digest, tạo bài học lớn cá nhân |
| **Lead** | 2 | – | – | official ≤2 | + build thương hiệu (content engine) |
| **Editor** | 3 | ✅ | – | official ≤3 | + up/sửa canon, AI ingestion, tạo link, version, gửi duyệt |
| **Tổng biên tập** | (cờ) | ✅ | ✅ | – | + **duyệt & publish** canon |
| **ISB** | 4 | tùy | tùy | official ≤4 (tài chính, hợp đồng mật) | + **xem insight team** (downline), coach |
| **Admin** | 5 | ✅ | ✅ | official ≤5 (legal) | toàn quyền: phân quyền, seed, xóa, thấy mọi insight |

## Map vào code (để chỉnh)
- Gán quyền: bảng `memberships` (cột level/can_edit/can_approve/sponsor_id).
- Gate đọc canon: RLS policy `node_select` (`my_level(org_id) >= min_level`).
- Quyền sửa canon: RLS `node_insert/node_update` (`can_edit_org(org_id)`).
- Seed canon: RPC `seed_qnet(p_org)` — yêu cầu `can_edit`.
- Bootstrap user mới: RPC `bootstrap_me()` → tạo org + membership **level 5** (tạm cho dev; production sẽ gán theo rank QLSK qua SSO).

## ⚠️ Ghi chú production
- Hiện mỗi user tự bootstrap 1 org riêng (dev). Production: org chung QNET + gán level theo rank từ quanlysukien (SSO + invite).
- Xem [ECOSYSTEM.md](../ECOSYSTEM.md) cho SSO/FDW.
