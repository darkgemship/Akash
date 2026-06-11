# Data Qi — Hệ sinh thái 2 app (đã chốt)

> Data Qi không đứng một mình. Nó ghép với **quanlysukien.com** thành một flywheel.

## 1. Flywheel
```
   Data Qi  (Lead/ISB: build thương hiệu + content engine)
        │  content + landing page cá nhân thu hút
        ▼
   PROSPECT ──► quanlysukien.com (học online, sự kiện, phễu)
                    │ convert
                    ▼
                IR mới ──► một số lớn lên thành Lead/ISB ──► quay lại Data Qi
```
Data dùng chung → đo được: content của ai → kéo prospect nào → qua phễu nào → sign-up.
→ Đây là thứ làm **Flow E attribution thành thật** (không nhập tay).

## 2. Ranh giới — mỗi loại data MỘT chủ sở hữu
| | quanlysukien.com | Data Qi |
|---|---|---|
| Nguồn sự thật của | **CON NGƯỜI & PHỄU** (IR/prospect, funnel stage, sự kiện, học) | **TRI THỨC & CONTENT** (vault, insight, content engine, brand assets) |
| Vai | CRM + học tập + sự kiện (người tiêu thụ) | Công cụ sáng tạo (người sản xuất) |

**Quy tắc vàng:** KHÔNG nhân đôi data người/phễu ở cả hai. Data Qi đọc funnel từ QLSK, ghi lead ngược vào.

## 3. Kiến trúc tích hợp (ĐÃ CHỐT)
- **2 Supabase project riêng** (cô lập — không làm hỏng QLSK đang chạy thật).
- **quanlysukien = nguồn danh tính (SSO authority).**
- **Toàn quyền chỉnh QLSK** → dựng được cả 3 cầu.

### 3 cây cầu
```
   ┌──────────────────────────┐        ┌──────────────────────────┐
   │ quanlysukien (project A)  │        │   Data Qi (project B)     │
   │ • auth.users ★ nguồn      │        │ • pages, content, qi…     │
   │ • people / funnel         │        │ • đọc người + funnel      │
   │ • events, courses         │        │ • ghi lead                │
   └───────────┬──────────────┘        └───────────┬──────────────┘
   ① SSO       │ ◄── Data Qi tin token của A ───────┤  Third-Party Auth
   ② ĐỌC chéo  │ ◄── FDW: B đọc people của A ───────┤  Foreign Data Wrapper
   ③ GHI lead  │ ◄── Edge Function API của A ◄──────┤  đẩy lead vào funnel
```

| Cầu | Cơ chế | Chiều |
|-----|--------|-------|
| ① Danh tính | Supabase **Third-Party Auth**: Data Qi tin JWT do QLSK phát → đăng nhập 1 lần | A → B |
| ② Đọc funnel | **Foreign Data Wrapper**: Postgres Data Qi query bảng `people`/funnel của QLSK như bảng ngoại | A → B (read) |
| ③ Ghi lead | **Edge Function** của QLSK nhận lead từ landing page Data Qi | B → A (write) |

### Hai nhóm người (tách bạch)
| Nhóm | Là ai | Vai |
|------|-------|-----|
| Đội nội dung (admin-side) | Admin, Editor | Sản xuất não tập đoàn (`can_edit`/`can_upload`) |
| Member (user-side) | IR / Lead / ISB | Tiêu thụ + xây não cá nhân (clearance) |

→ **Editor = capability** thuộc đội nội dung, KHÔNG phải tầng clearance. Một ISB có thể được gắn thêm Editor.

### Onboarding: MỜI CÓ CHỌN LỌC (đã chốt)
```
Admin chọn user QLSK → gán clearance + (tùy chọn) quyền Editor
   → gửi email mời → user click → đăng nhập SSO (danh tính QLSK)
   → cấp tài khoản Data Qi
```
- **Clearance do admin GÁN lúc mời** (gợi ý từ rank QLSK, nhưng chỉnh được) — vì rank QLSK phức tạp, KHÔNG auto-derive cứng.
- Khớp controlled rollout của MVP (mời 10-20 người trước).
- **FDW đọc people/funnel** vẫn dùng riêng cho **Flow E attribution** (prospect/IR, phễu) — khác mục đích với clearance.
- ⚠️ Cần phía QLSK: bật signing keys bất đối xứng/JWKS cho Third-Party Auth; cho Data Qi đọc danh sách user để admin chọn mời.

### Entity mới (Data Qi)
- `invitations(id, qlsk_user_id, email, clearance, is_editor, status[sent|accepted], invited_by, created_at)`

### Dev implication
- Để code SSO từ S0 cần: thông tin project QLSK (JWKS/issuer) + bảng `people`.
- Local dev: mock token issuer + bảng `people` giả để không chặn tiến độ.

## 4. Tầm nhìn dashboard cá nhân (Phase 2-3)
Lead/ISB build thương hiệu → mỗi người một dashboard riêng:
- **Landing page cá nhân** — bản templated + form bắt lead (đẩy vào phễu QLSK qua cầu ③).
- **Workshop** — ⚠️ KHÔNG xây lại; tận dụng QLSK (vốn đã quản sự kiện). Data Qi tạo → đẩy sang QLSK vận hành.
- **Email marketing** — tích hợp dịch vụ có sẵn (Resend/SendGrid…), KHÔNG tự code engine.

## 5. Việc cần làm phía quanlysukien (khi tích hợp)
- [ ] Bật Third-Party Auth để Data Qi tin token (hoặc cấu hình JWT chung).
- [ ] Mở quyền đọc bảng `people`/funnel cho FDW của Data Qi (read-only, RLS).
- [ ] Viết Edge Function nhận lead từ Data Qi.
- [ ] Chuẩn hóa bảng `people` (type: IR/prospect/lead/ISB/admin + funnel_stage).
