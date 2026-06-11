# Data Qi — Flows & Functions (đã chốt)

> File này ghi các luồng chạy & function đã thống nhất. Cập nhật dần khi chốt thêm.

---

## PERMISSION MODEL — 3 trục phân quyền ✅ ĐÃ CHỐT

> Tách 3 trục riêng biệt để RLS không rối. Đừng gộp "thấy gì" với "làm gì" với "thấy ai".

### Trục 1 — Clearance (THẤY gì trong kho official)
Cấp 1→5 (số), cấp cao thấy hết cấp thấp. Page official có `min_level`; user thấy nếu `clearance ≥ min_level`.
**Clearance do admin GÁN lúc mời** (gợi ý từ rank QLSK, vì rank phức tạp → không auto-derive cứng).

| Cấp | Rank QNET (gợi ý) | Thấy official | Nội dung nhạy cảm |
|-----|-------------------|---------------|-------------------|
| 1 | IR | min_level ≤ 1 | bài học cơ bản |
| 2 | Lead | ≤ 2 | |
| 3 | (tầng riêng nếu cần) | ≤ 3 | |
| 4 | ISB | ≤ 4 | tài chính, hợp đồng mật |
| 5 | Admin | ≤ 5 | legal, … |

→ **Editor KHÔNG nằm ở trục này** (xem Trục 2). Member theo clearance; Editor là đội sản xuất.

### Trục 2 — Editorial capability (đội sản xuất "não tập đoàn")
- `can_edit` / `can_upload`: **Editor** — tạo/sửa/upload nội dung vào org vault. Cờ gán linh hoạt cho bất kỳ ai (kể cả một ISB cũng có thể được gắn).
- `can_approve`: cờ riêng — duyệt & publish official ("Tổng biên tập"). KHÔNG gắn cứng vào clearance.

### Trục 3 — Leadership visibility (THẤY insight cá nhân của ai)
- **Admin (L5): thấy TẤT CẢ** insight cá nhân toàn hệ thống.
- **ISB (L4): chỉ thấy team mình** (downline).
- **Editor & Tổng biên tập: KHÔNG thấy** insight cá nhân — chỉ chạm content.
- → Bắt buộc mô hình **cây team upline–downline** (`memberships.sponsor_id`).

**RLS personal vault:**
```
đọc được nếu:  owner = viewer
            OR viewer.level = 5 (Admin)
            OR (viewer.level = 4 (ISB) AND owner ∈ downline(viewer))
```

### Trục 4 — Group access (THẤY nhóm đặc biệt) ⭐ MỚI
Quyền theo NHÓM, KHÔNG theo cấp. Cho nội dung độc quyền/giới hạn:
- Shakti (chỉ nữ) · The V (độc quyền) · Guru Maa · chương trình đặc biệt.
- Thấy page nếu user thuộc TẤT CẢ `required_groups` của page.
- Xem chi tiết: [[COLLECTIVE-KNOWLEDGE]] mục 4.

### Entity phân quyền
- `memberships(user_id, org_id, level int[1..5], can_edit bool, can_approve bool, sponsor_id)`
- `pages.min_level int` (chỉ áp dụng vault_type = org)
- `groups(id, org_id, name)` · `membership_groups(user_id, group_id)` · `page_groups(page_id, group_id)`

---

## FLOW A — Admin / Biên tập (Org Vault) ✅ ĐÃ CHỐT

### Vai (ánh xạ sang Permission Model ở trên)
| Vai | = | Quyền |
|-----|---|-------|
| 👑 Admin | L5 | Toàn quyền + thấy mọi insight |
| 📝 Tổng biên tập | bất kỳ ai có `can_approve` | Duyệt + xuất bản official |
| ✍️ Biên tập | L3 Editor (`can_edit`) | Tạo/sửa content → cần duyệt |
| 👤 Member | L1 User / L2 Lead | Đọc official theo level, ghi chú vault cá nhân |

### Pipeline xuất bản (state machine)
```
RAW ──► AI STRUCTURING (fields → links → review) ──► EDITOR SUBMIT
                                                          │
        OFFICIAL ◄── PUBLISH ◄── PENDING APPROVAL ────────┘
        (published)  (tổng BT/   (tổng BT/admin)
                      admin)           │ request_changes + comment
                                       ▼
                                  CHANGES_REQUESTED ──► (editor sửa) ──► SUBMIT lại
```

**Trạng thái page (org vault):**
`raw` → `structuring` → `pending_approval` → `published`
nhánh phụ: `changes_requested`, `archived`

### Quyết định đã chốt
1. **Template:** Admin định nghĩa trước các loại template (field schema). AI map nội dung raw vào đúng trường — KHÔNG tự chế cấu trúc.
2. **Input raw:** hỗ trợ cả upload `.md`/`.txt` (Supabase Storage) **và** dán/gõ text.
3. **Quyền duyệt:** Tổng biên tập/Admin **chỉ approve hoặc request_changes + comment**, KHÔNG sửa trực tiếp → audit trail rõ ai chịu trách nhiệm.
4. **Versioning:** mỗi lần publish tạo **version mới + changelog**, xem lịch sử & khôi phục được.

### AI Ingestion (bước structuring — phần khác biệt cốt lõi)
1. `aiExtractFields(pageId, templateId)` — AI đọc raw, điền các trường của template, **hỏi lại trường còn thiếu**.
2. `aiSuggestLinks(pageId)` — AI quét nội dung, gợi ý `[[link]]` tới page official liên quan; editor xác nhận.
3. `aiReviewContent(pageId)` — chấm chất lượng/đầy đủ, cờ trùng lặp, tóm tắt.

### Function list
| Function | Mô tả | Ai gọi |
|----------|-------|--------|
| `uploadRaw(file \| text, templateId)` | Tạo page `status=raw` | Biên tập+ |
| `aiExtractFields(pageId, templateId)` | AI điền trường + hỏi thiếu | hệ thống |
| `aiSuggestLinks(pageId)` | Gợi ý backlink | hệ thống |
| `aiReviewContent(pageId)` | Chấm chất lượng + cờ trùng | hệ thống |
| `submitForApproval(pageId)` | → `pending_approval` | Biên tập+ |
| `approve(pageId)` | → `published` + tạo version | Tổng BT/Admin |
| `requestChanges(pageId, comment)` | → `changes_requested` | Tổng BT/Admin |
| `publishOfficial(pageId)` | Ghi version + changelog | Tổng BT/Admin |
| `assignRole(userId, role)` | Gán vai | Admin |
| `createTemplate(fields[])` | Định nghĩa template | Admin |

### Bảng dữ liệu phát sinh
- `templates(id, org_id, name, fields jsonb)` — field schema do admin định nghĩa
- `page_versions(id, page_id, version, content jsonb, changelog text, published_by, published_at)`
- `review_comments(id, page_id, author_id, body, created_at)`
- `audit_log(id, org_id, actor_id, action, target, created_at)`
- `pages.status` enum: `raw|structuring|pending_approval|changes_requested|published|archived`

---

## FLOW B — Member ghi chú & học (Personal Vault) 🔶 ĐANG CHỐT

### Tài sản cốt lõi (con hào cạnh tranh)
1. **Emotional knowledge graph** — reflection note + cảm nhận thật của user link vào kho tổng → data vừa thông minh vừa "người" → RAG sinh content authentic.
2. **Self-model / persona** — AI hiểu dần giá trị, câu chuyện, giọng văn user qua việc document cuộc sống → content cá nhân hóa thật.

### Trải nghiệm member
- **Level-gated access:** user có cấp độ; truy cập kho official theo level (chiều phân quyền MỚI, ngoài role biên tập).
- **Daily note:** màn hình chính là nơi ghi chú/insight hằng ngày, học cách viết content.
- **AI link suggestion:** AI gợi ý page trong kho tổng liên quan → học nhanh hơn khối data lớn.
- **Reflection → link kho tổng:** viết cảm nhận/điều nhận ra về một bài học, link vào vault tổng (emotional layer).
- **Personal template:** user tạo template riêng.
- **Truy cập trực quan** kho official theo level.

### Coaching engine / Thử thách 30 ngày
- AI giúp user hiểu bản thân + hướng dẫn document cuộc sống.
- AI nhắc nhở, coach hằng ngày: vd "tập gym → ghi trải nghiệm → quay video", "đọc sách X → reflect → link trải nghiệm quá khứ".
- **Challenge 30 ngày build thương hiệu cá nhân** → cuối kỳ có content engine cá nhân hóa.
- Tầm nhìn: AI định hướng cuộc sống, user tập trung sống & trao giá trị.

### Đã chốt
- **Level:** hệ 5 cấp clearance (xem PERMISSION MODEL). User chỉ thấy official ≤ level mình.
- **Challenge 30 ngày:** khung cố định do founder thiết kế + AI biến tấu/cá nhân hóa từng task.
- **Vault cá nhân:** riêng tư; chia sẻ insight LÊN trên — Admin thấy tất cả, ISB thấy team mình; Editor/Tổng BT không thấy.

### Entity mới
- `levels(id, org_id, name, rank)` + `pages.min_level`
- `user_persona(user_id, values, story, voice_profile, updated_at)` — self-model
- `daily_notes(id, user_id, date, content, mood?)`
- `challenges(id, org_id, name, duration_days)`, `challenge_tasks(...)`, `user_challenge_progress(...)`
- `personal_templates(id, user_id, fields jsonb)`

---

## FLOW C — Content engine + KOL intelligence (L2) ✅ ĐÃ CHỐT

### Đã chốt
- **Format MVP:** sinh cả 4 — caption ngắn (FB/IG/Threads), kịch bản reel/TikTok, script YouTube dài, thread/blog. (Sinh nhẹ; ĐĂNG tự động làm dần ở Flow D.)
- **Voice quiz:** khung 20 câu cố định + AI hỏi đào sâu follow-up.
- **Audience personas:** AI đề xuất từ dữ liệu/insight → user chỉnh.
- **Nhịp tuần:** khung chuẩn (T2 review…) nhưng user đổi ngày/giờ; AI nhắc theo lịch user.

### C1. KOL Feed (trang "tin tức" — engagement hook)
- **2 tầng KOL:**
  - (a) **Global** — Admin chọn cho toàn hệ thống, chủ yếu **lãnh đạo QNET**.
  - (b) **Personal** — user tự thêm idol mà họ muốn content giống.
- App hiển thị dạng **news feed**: cập nhật KOL mới nhất → user đọc → **take-note insight ngay** (lưu để sau làm content).
- **Dữ liệu KOL:** caption + video/ảnh (dạng link) + nội dung text.
- **Nguồn nạp:** ⭐ curate THỦ CÔNG (admin/editor) là chính → né rủi ro scraping ToS; auto-scrape (YouTube API) là phụ.

### C2. Onboarding giọng (Voice discovery)
- Bộ **~20 câu hỏi** template → AI hiểu user → dựng `user_persona`.
- AI đồng hành, càng dùng càng hiểu thêm (cập nhật persona liên tục).

### C3. Content generation
- Bối cảnh 3 lớp: **self-model (giọng) + RAG kho tổng (kiến thức) + KOL insight (trend/hook)**.
- AI **đề xuất ý tưởng/góc TRƯỚC** → user thêm/chọn → mới viết full (caption/script/insight + hashtag + CTA).
- User review/sửa/regen → approved → sang Flow D.

### C4. Nhịp vận hành & kế hoạch
- AI hỏi **mức cam kết** của user → ra **tần suất** hợp lịch; gợi ý hằng ngày khi mở app.
- **Audience personas:** user liên tục xây persona khán giả (làm đầu vào chiến lược).
- **Nhịp tuần cố định (ritual):**
  - **T2:** review tuần qua + lên chiến lược content cả tháng + cập nhật persona khán giả + chốt số bài trong tuần.
  - **Giữa tuần:** quay content → chuyển đội media.
  - **Cuối tuần:** check khối lượng + AI gợi ý tuần tới để bám lộ trình.
- Mục tiêu: tạo **thói quen ghi chú insight** → biến cuộc sống thành kho trí tuệ.

### Entity mới
- `kols(id, org_id, scope[global|personal], owner_id?, name, platform, profile_url)`
- `kol_posts(id, kol_id, caption, text, media_links jsonb, source[manual|scraped], posted_at)`
- `kol_insights(id, kol_post_id, user_id, note)` — insight user ghi từ KOL post
- `onboarding_answers(user_id, q_id, answer)` → feed `user_persona`
- `audience_personas(id, user_id, name, description, pains, desires)`
- `content_ideas(id, user_id, angle, source_ref)` → `content_pieces` (đã có)
- `content_plans(id, user_id, period[month|week], strategy, created_at)`
- `commitment(user_id, level, posts_per_week, preferred_times)`

## FLOW D — Content project pipeline ✅ ĐÃ CHỐT

> Đăng bài (đã chốt): **app nhắc lịch, người tự đăng tay** — KHÔNG lưu mật khẩu kênh (an toàn, né duyệt app Meta/YouTube). Auto-post qua API để Phase sau. **Cả talent & media** đều đăng/đánh dấu "đã đăng" được.

### Pipeline (app chỉ TRACK, không ôm file)
```
Nguồn (reflection/trải nghiệm) ──► AI sinh caption/insight/kịch bản
   ──► [talent & media cùng sửa content] ──► GATE 1: talent duyệt script
   ──► media SX ngoài app (Premiere/CapCut) ──► upload LINK final (Drive video/ảnh)
   ──► GATE 2: talent duyệt bản final
   ──► SCHEDULE (nền tảng + giờ) ──► PUBLISH (đăng dần)
```

### Đã chốt
- **Media team = nhân sự riêng do talent mời vào** (ê-kíp per-talent), cùng lên kịch bản & chốt video/ảnh.
- **App chỉ track tiến độ + lưu LINK final** (Drive/ảnh). KHÔNG ôm file, KHÔNG dựng video. Raw nặng → Mac Mini.
- **Cả talent & media sửa được caption/content** (cộng tác).
- **2 gate duyệt:** (1) duyệt script trước SX; (2) duyệt bản final trước schedule.
- **Workshop KHÔNG tích hợp** — đã có app sự kiện riêng. Chỉ là nguồn content.

### Phân quyền
- Media collaborator: chỉ thấy/sửa **content project được giao** của talent đó.
- KHÔNG thấy insight/vault cá nhân của talent (đúng Permission Model — chạm content ≠ thấy con người).

### Entity mới
- `content_projects(id, talent_id, content_piece_id, status, created_at)`
  - status: `draft → script_approved → in_production → final_uploaded → final_approved → scheduled → published`
- `project_collaborators(project_id, user_id, role[media], invited_by)`
- `final_assets(id, project_id, type[video|image], url, note)` — chỉ LINK
- `schedule_posts(id, content_piece_id, platform, scheduled_at, status, published_at)`

## FLOW E — Đo lường & lead → QNET ✅ ĐÃ CHỐT

### Funnel
```
CONTENT đăng → REACH/ENGAGEMENT → LEAD → NURTURE → SIGN-UP QNET ($10k)
```
Mục tiêu: trả lời "chủ đề/format nào tạo lead & sign-up?" → AI nhân bản cái hiệu quả.
Đây là phép **kiểm chứng giả thuyết kinh doanh** cốt lõi.

### Feasibility tracking metrics (đã xác minh)
| Nền tảng | Dán URL lạ | Account của mình | Cơ chế |
|----------|-----------|------------------|--------|
| YouTube | ✅ số công khai | ✅ sâu (OAuth) | Data API v3 / Analytics API |
| Instagram | ❌ | ✅ Business/Creator (OAuth) | Graph API |
| Facebook | ❌ profile; ✅ Page | ✅ Page (OAuth) | Graph API |
| Meta Ads | — | ✅ (OAuth) | Marketing API — cần app review |

→ Đo content CỦA MÌNH = **connect OAuth**, KHÔNG phải dán URL. Dán URL chỉ hợp YouTube public + idol mức bề mặt.

### Đã chốt
- **Metrics MVP:** nhập tay vài số chính (view/like/lead) + YouTube public auto. OAuth IG/FB → Phase 2.
- **Lead:** chỉ đánh dấu đơn giản (số lead + ai sign-up), KHÔNG mini-CRM phễu.
- **Ads (Meta Marketing API):** Phase 3 — có overhead (Meta app + business verification + app review).
- **Dashboard:** report đẹp; cá nhân + lãnh đạo (ISB/Admin xem team — theo Permission Model).

### Phân tầng
| Giai đoạn | Đo lường |
|-----------|----------|
| MVP | Nhập tay + YouTube public auto |
| Phase 2 | OAuth: YouTube + IG Business + FB Page auto-pull |
| Phase 3 | Meta Ads + idol intelligence nâng cao |

### Entity mới
- `post_metrics(id, schedule_post_id, views, likes, shares, comments, leads, recorded_at, source[manual|api])`
- `leads(id, talent_id, content_piece_id?, status[lead|signed_up], note, created_at)`
