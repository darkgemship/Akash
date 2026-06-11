# Akash — User Stories (luồng từng vai)

> Câu chuyện hành trình mỗi vai. Dùng để chỉnh tính năng có logic đồng bộ. Mỗi story: **As a … I want … so that …** + các bước + chạm vào file/function nào.

---

## 👤 STORY 1 — IR / User mới (level 1)
**As an** IR mới, **I want** học kho QNET + ghi lại trải nghiệm, **so that** biến bài học thành trí tuệ của riêng mình.

1. Nhận email mời → đăng nhập (SSO QLSK / email) → `bootstrap_me()` tạo vault.
2. Thấy **3 kho** ở sidebar. Mở **🌐 Kho tập đoàn** → đọc bài level 1 (Induction, Switch On…).
3. Tạo **bài học lớn** của mình (vd "Lãnh đạo bản thân") → thêm **note** → viết bằng **editor Notion** (gõ "/").
4. Bấm **🎓 Học bài** → digest 5 bước → **Độ Thấm** được chấm → bài "nối" tạo **link** → **Galaxy** sáng thêm.
5. Quay lại mỗi ngày → não lớn dần.

*Chạm:* `page.tsx` (vault, openNoteEditor), `Editor.tsx`, `Digest.tsx`, bảng `nodes/links/wisdom_depth`.

---

## 🚀 STORY 2 — Lead (level 2)
**As a** Lead, **I want** xây thương hiệu cá nhân từ trải nghiệm, **so that** thu hút prospect & kiếm $1–3k/tháng.

1. Như User + thấy kho ≤ L2.
2. (Phase 2) **Content Engine**: AI dùng giọng + trải nghiệm chín (Độ Thấm cao) → sinh caption/reel.
3. (Phase 2) Đưa content vào **Board** → media dựng → đăng → đo lead.

*Chạm:* (sẽ build) trang Content Engine, Board; bảng `content_pieces`, `wisdom_depth` (cổng chất lượng "bắn lên").

---

## ✍️ STORY 3 — Editor (level 3, can_edit)
**As an** Editor, **I want** up & cập nhật canon QNET toàn diện, **so that** kho tập đoàn luôn chuẩn & mới nhất.

1. Thấy nút **editor tools** trên bài canon: 📤 Upload · 🕘 Versions · 🔗 Link · 🔒 Quyền · ✅ Gửi duyệt.
2. **📤 Upload** raw (.md/paste) → AI hỏi trường (template) → gợi ý link → **gửi duyệt**.
3. Sửa block → **autosave** + tạo **version** (changelog).
4. Gửi **Tổng biên tập** duyệt → publish official.

*Chạm:* RPC `seed_qnet`/(sẽ có `upload`/`submit`), bảng `nodes(status)`, `node_versions`, `links`. RLS `can_edit_org`.

---

## 🧭 STORY 4 — ISB (level 4)
**As an** ISB, **I want** thấy team mình đang nghĩ gì, **so that** coach đúng & kịp thời.

1. Thấy kho ≤ L4 (tài chính, hợp đồng mật, The V).
2. Thấy **insight cá nhân của downline** (theo `sponsor_id`) → biết ai đang chững.
3. Coach: gợi ý bài học / hành động cho từng người.

*Chạm:* RLS personal vault (`level=4 AND owner ∈ downline`), `memberships.sponsor_id`.

---

## 👑 STORY 5 — Admin (level 5)
**As an** Admin, **I want** quản trị toàn hệ thống, **so that** vận hành chuẩn & an toàn.

1. **Phân quyền** (gán level/can_edit/can_approve/group).
2. **Seed** kho QNET (`Seed QNET`).
3. Duyệt/publish, xóa, archive, xem **mọi insight**.

*Chạm:* `memberships`, RPC `seed_qnet`, RLS level-5 policies.

---

## Trạng thái build (đồng bộ)
| Story | Đã chạy được |
|-------|--------------|
| 1 User | ✅ vault + editor + digest + galaxy |
| 2 Lead | 🔶 vault xong; content engine = Phase 2 |
| 3 Editor | 🔶 seed/can_edit xong; upload/version UI = đang build |
| 4 ISB | 🔶 RLS sẵn; UI team insight = Phase 2 |
| 5 Admin | 🔶 quyền sẵn; UI quản trị = đang build |
