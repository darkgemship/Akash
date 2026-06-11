# Akash — Bản đồ luồng & ý nghĩa từng màn/nút (cập nhật 2026-06-12)

> Viết lại 100% từ code thật: `web/src/app/{page.tsx, Pages.tsx, Hubs.tsx, Galaxy.tsx, Digest.tsx, PageFrame.tsx, Editor.tsx, Database.tsx}`.
> Mỗi màn: flow ASCII user đi → bảng TỪNG nút → ý nghĩa → ghi gì vào DB (bảng/cột).
> Đối chiếu chuẩn: `docs/KHO-CHUAN.md` (7 loại trang, 7 cây, gác cổng publish) + `docs/RESEARCH-VIZ-ARCH.md` (mũi 2: điểm 8 chiều derive từ links; mũi 4: wizard Hồ sơ Hồn).

## Bảng dữ liệu được app ghi/đọc (Supabase)

| Bảng | Cột app dùng | Ai ghi |
|---|---|---|
| `nodes` | id, org_id, owner_id, layer, kind, parent_id, title, icon, cover, md, content(JSON BlockNote), props(JSONB), subtype, status, min_level, position, event_date, emotion, db_columns | mọi màn |
| `links` | org_id, from_node, to_node, dimension(8 chiều), source, weight, excerpt, from_block, meta | Editor @, PageFooter, Galaxy Nối, Digest, Studio, KOL |
| `wisdom_depth` | node_id, user_id, connections/meaning/evidence/experience/action(0-10), learned, dims(JSONB 8 chiều), runs, last_run_at, next_review_at, review_count | chỉ Digest |
| `events` | user_id, type(`tham`=10 Qi · `content`=5 · `link`=3 · `create`=1 · `ai_qa` · `content_result`), node_id, ts | logEvent, Digest, Board, MembersHub |
| `ai_jobs` | user_id, kind(`ingest_to_template`), input(node_id, page_type), status(`queued`) | Studio publish, createFromRaw |
| `assignments` | org_id, assigner, assignee, title, note, due, status(open→submitted→done), node_id(⚠ chưa bao giờ được ghi) | Studio, MembersHub |
| `page_comments` | node_id, user_id, body, resolved | thảo luận cuối trang kho chung |
| `open_questions` | user_id, node_id, question, status(`open` từ Digest · `feedback` từ Góp ý sửa) | Digest M7, nút 💬 Góp ý sửa |
| `content_results` | org_id, user_id, card_node_id, source_node_id(⚠ luôn null), channel, reach, leads, note | Board modal kết quả |
| `profiles` | id, voice(JSONB 8 câu giọng) | Profile VoiceCard |
| `memberships` | level(1-5), can_edit, can_approve | RPC `admin_set_member` |
| RPC | `bootstrap_me()` (tạo org+kho lần đầu) · `my_membership()` · `admin_list_members()` · `admin_set_member()` · `seed_qnet(p_org)` | — |

---

## 0. Đăng nhập & Onboarding — `page.tsx` `Login()` (102) + onboarding (1226)

```
Mở app ──► chưa session ──► Login (Warp field bay sao)
   │  [Đăng nhập]/[Tạo tài khoản] tab → email + mật khẩu → [⌁ Khởi động warp drive]
   │      signUp → nếu auto-confirm bật → signInWithPassword ngay
   ▼
 có session ──► Workspace: RPC bootstrap_me() → org_id → loadTree + loadGraph
   │            RPC my_membership() → role {level, can_edit, can_approve}
   ▼
 localStorage chưa có 'dq-onboarded' ──► ONBOARDING 3 bước (modal)
   1/3 ba tầng kho → 2/3 bốn thao tác (/, @, ⌘K, kéo-thả) → 3/3 vòng lặp + vai của bạn
   [✍️ Viết dòng đầu tiên] → đáp xuống tab Hôm nay
```

| Nút | Ý nghĩa | Ghi DB |
|---|---|---|
| Tab `Đăng nhập` / `Tạo tài khoản` (175-176) | đổi mode in/up | không |
| 👁 hiện/ẩn mật khẩu (186) | toggle showPw | không |
| `⌁ Khởi động warp drive` / `⌁ Tạo tài khoản & cất cánh` (188) | `supabase.auth.signInWithPassword` / `signUp` (+ tự signIn nếu auto-confirm) | Supabase Auth (`auth.users`); lỗi dịch tiếng Việt qua `viError()` |
| Onboarding: dots, `← Trước`, `Tiếp →`, `Bỏ qua`, `✍️ Viết dòng đầu tiên` (1316-1321) | chuyển 3 bước; finish → tab Hôm nay | chỉ `localStorage['dq-onboarded']='1'` |

---

## 1. HÔM NAY (Home) — `Pages.tsx` `Today()` (556) render trong `page.tsx` (1026-1079), Studio dính ngay bên dưới

```
┌ Avatar + chào + vai + ⚡Qi + 🔥streak (tính từ bảng events)
├ GHI NHANH: chọn loại [🌱 Trải nghiệm|💎 Insight|💬 Quote đắt] → gõ → Enter/[Nạp vào kho]
│    exp     → tạo note trong hub 📓 "Hành trình của tôi" (ensureHub 'journey')
│    insight → tạo note trong hub 💎 "Kim cương bài học"   (ensureHub 'lessons')
│    quote   → APPEND "> quote — nguồn" vào md trang ⚓ Kim Chỉ Nam (tạo trong 🧭 La bàn nếu chưa có)
├ 🤖 AI HIỂU BẠN %: vòng tròn 6 vùng (giá trị/kim chỉ nam/bài chuyển hoá/người/streak/mốc đời)
│    [💬 Trả lời 3 câu hôm nay] → modal 3 câu (BANK 12 câu xoay theo ngày)
├ ✅ HÔM NAY BẠN CẦN LÀM: ôn đến hạn + việc được giao + bài bị trả + (approver) N bài chờ duyệt
├ 🔥 CẦN CHUYỂN HOÁ (3 bài + lý do thật)   │ ⏱️ TIẾP TỤC VIẾT (recent từ localStorage)
├ ⚓ quote sống từ Kim Chỉ Nam │ số trang/liên kết + nút 🌌 Galaxy
├ 🌟 NGƯỜI KHỔNG LỒ HÔM NAY (3 bài kol_post xoay theo ngày) → [Xem cả feed →]
└ 📥 STUDIO NHẬP LIỆU (component Studio — xem mục 10)
```

| Nút | Ý nghĩa | Ghi DB |
|---|---|---|
| Chip loại ghi nhanh (Pages 648) | đổi capType; quote hiện thêm ô Nguồn | không |
| `Nạp vào kho` / Enter (654-658) | onCapture → page.tsx:1035: exp/insight → `nodes` INSERT (kind note, layer personal, parent=hub tự tạo qua `ensureHub`, event_date=hôm nay local, props{page_type:'trai-nghiem'/'bai-hoc', via:'capture'}, md theo template chuẩn) + `events`(create); quote → `nodes` UPDATE md trang anchor_home (append) | `nodes`, `events` |
| `💬 Trả lời 3 câu hôm nay` (702) | mở modal; `✓ Lưu vào "Tôi là ai"` (833): tìm/tạo trang subtype `profile_me` 🪞, append md `## ngày + Q/A` | `nodes` INSERT/UPDATE, `events`(ai_qa) |
| `🔗 FB/Insta · soon` (703) | disabled — chờ cắm API | không |
| Todo `Ôn ngay` | mở Digest cho bài đến hạn (`wisdom_depth.next_review_at <= now`) | (Digest ghi) |
| Todo `Mở việc` (626) | ⚠ chỉ chạy `if (a.node_id)` — assignments không bao giờ có node_id → nút câm | không |
| Todo `Sửa ngay` (627) | mở bài status=draft bị trả, kèm note BTV | không |
| Todo `Vào duyệt` (628) | approver → `setPage('review')` (page.tsx:1068) | không |
| `Chuyển hoá` (746) | mở bài + bật modal Digest | (Digest ghi) |
| Card recent / quote / KOL / `🌌 Galaxy` / `Xem cả feed →` | điều hướng mở trang / Galaxy / tab Người khổng lồ | không |

---

## 2. KHO TRI THỨC — `page.tsx` (650-1024): header + sidebar cây + trang editor

```
Header: [Trang|Galaxy] toggle · [⬆ .md] import · [📥 Raw] · ☀️/🌙 · email · [Thoát]
Sidebar 260px: 🔍 tìm + ⌘K · 3 tầng kho (🧠 cá nhân / 🌐 tập đoàn / ♾️ nhân loại)
  mỗi dòng: ▸ expand · click mở · double-click đổi tên · hover [⋯ menu][＋ con] · kéo-thả
  menu ⋯: Mở trang / Đổi tên / ＋Thêm trang con / 🗂️ Bảng dữ liệu / 📑 Từ template / 📑 Sao chép / 🗑 Xoá
Trang mở:
  breadcrumb · [{ } MD] · [🎯 điểm·n/8 | 🔥 Chuyển hoá] · [🔁 Ôn lại] · [📣 Content] · [✕]
  cover (hover đổi 6 nền) → icon (picker 16 emoji) → title
  ① PropsPanel (PageFrame): Loại trang · Ngày sự kiện · Tóm tắt 1 câu · Nguồn · Từ khoá
     + trường chuẩn ban biên tập (fixed_fields) + Trường của tôi (custom_fields)
     + dải hành động: ⏳Chờ duyệt/✅Duyệt/↩Trả lại/📨Gửi duyệt lại/♾️Đề xuất/💬Góp ý/🧩Template/📎Đính kèm
  thân bài BlockNote (gõ "/" block, "@" nối trang)
  ② PageFooter: 🗂 trang con · ❤️ liên kết 8 chiều (+Nối tại chỗ) · 🕸️ đi/về · 💎 tinh hoa · 📚 references · 📎
  💬 Thảo luận (chỉ kho chung, kiểu Wikipedia Talk)
```

### Header & sidebar

| Nút | Ý nghĩa | Ghi DB |
|---|---|---|
| `Trang` / `Galaxy` (656-657) | đổi view giữa editor và Galaxy | không |
| `⬆ .md` (659-662) | importMd: file .md → `createPage` trong kho cá nhân, title = dòng `# ` đầu | `nodes` INSERT, `events`(create) |
| `📥 Raw` (663) | ⚠ chỉ `setPage('today')` (đẩy sang Hôm nay/Studio). Modal "📥 Dữ liệu thô → Trang chuẩn" (1169) + `createFromRaw` (404) **không còn nút nào mở** — luồng chết | (nhánh chết: `nodes` + `ai_jobs`) |
| ☀️/🌙 (666) | đổi theme, lưu `localStorage['akash-theme']` | không |
| `Thoát` (673) | `supabase.auth.signOut()` | Auth |
| 🔍 tìm sidebar (682) | lọc cây theo title (client) | không |
| `⌘K` (683 + phím tắt 289) | command palette: tìm/recent, ↑↓ Enter mở | localStorage `dq-recent` |
| `⬇ Seed` (710) | kho chung rỗng + can_edit → RPC `seed_qnet(p_org)` đổ dữ liệu mẫu | nhiều `nodes` (server-side) |
| `＋` cạnh tầng kho (711) | `createPage(null, layer)` — kho chung mà level<4 → status `pending` + toast "chờ duyệt" | `nodes` INSERT, `events`(create) |
| ▸ chevron (591) | expand/collapse | không |
| click tên trang (595) | `openNoteEditor`: SELECT nodes(content,md,icon,cover) + links đi/về + page_comments | chỉ đọc; localStorage recent |
| double-click / `✏️ Đổi tên` (595, 613) | rename inline → blur/Enter | `nodes` UPDATE title |
| kéo-thả dòng (580-585) | `moveNode`: thả vào giữa = con, mép trên/dưới = trước/sau (position trung bình cộng); đổi tầng kho thì đổi `layer` theo cha mới | `nodes` UPDATE parent_id, position, (layer) |
| `＋ Thêm trang con` (606, 614) | createPage con cùng layer | `nodes` INSERT, `events` |
| `🗂️ Thêm bảng dữ liệu` (615) | createPage kind='database' | `nodes` INSERT |
| `📑 Trang từ template` (616) | mở picker: 4 template cứng (Bài học/Trải nghiệm/Hồ sơ KH/Tóm tắt sách) + template user tự lưu (subtype `template`) → createPage với md template | `nodes` INSERT |
| `📑 Sao chép trang` (617) | duplicate cả cây con, remap id, title "(bản sao)" | `nodes` INSERT nhiều dòng |
| `🗑 Xoá trang` (618) | confirm → xoá node + toàn bộ con cháu | `nodes` DELETE IN(ids) |

### Trong trang

| Nút | Ý nghĩa | Ghi DB |
|---|---|---|
| breadcrumb (804) | mở trang tổ tiên | không |
| `{ } MD` (813) | xem markdown gốc read-only (fetch md mới nhất) | chỉ đọc |
| `🎯 {điểm} · n/8` (822) | popover Dim8Bars — điểm **derive từ links thật** (`transformScore(dimSignals(...))`, RESEARCH-VIZ-ARCH mũi 2), chiều yếu nhất + câu hỏi gợi | không |
| `🔥 Chuyển hoá` / `Chuyển hoá lại` (842, 836) | mở modal Digest 7 màn (mục 11) | (Digest ghi) |
| `🔁 Ôn lại` (823) | cũng mở Digest (bài đã learned) | (Digest ghi) |
| `📣 Content` (824) | `toContent`: bài chín của mình → props.board='idea' → thành thẻ Board | `nodes` UPDATE props.board, `events`(content) |
| `✕` (845) | đóng trang | không |
| đổi nền cover (852) | 6 gradient | `nodes` UPDATE cover |
| icon + picker (859-863) | 16 emoji / xoá icon | `nodes` UPDATE icon |
| ô title (868) | blur/Enter lưu | `nodes` UPDATE title |
| PropsPanel: Loại trang / Ngày sự kiện / Tóm tắt / Nguồn / Từ khoá (PageFrame 137-154) | trường chuẩn mọi trang (STANDARD-TEMPLATE) | `nodes` UPDATE props.page_type/summary/source/keywords; event_date cột riêng |
| `＋ trường chuẩn` / `＋ thêm trường` (PageFrame 134, 195) | ban biên tập thêm định nghĩa fixed_fields; user thêm custom_fields | `nodes` UPDATE props.fixed_fields / custom_fields |
| `✅ Duyệt` trong trang (881) | approver duyệt tại chỗ: status→published, props.last_published_md + approved_at | `nodes` UPDATE |
| `↩ Trả lại` (887) | prompt lý do → status→draft, props.review_note | `nodes` UPDATE |
| `📨 Gửi duyệt lại` (900) | tác giả bài draft → status→pending | `nodes` UPDATE |
| `♾️ Đề xuất lên nhân loại` (907) | mở modal 3 câu (lý do/ai hưởng lợi/đề xuất) → `📨 Gửi đề xuất` (1125): tạo **BẢN SAO** trang vào kho humanity, status pending, props{proposed_from, proposal} | `nodes` INSERT |
| `💬 Góp ý sửa` (911) | thành viên không có quyền sửa kho chung → prompt góp ý | `open_questions` INSERT (status 'feedback') |
| `🧩 Lưu template` (919) | lưu md trang thành template con của trang 🧩 Template (tự tạo template_home) | `nodes` INSERT (subtype template) |
| `📎 Đính kèm` (920) | prompt URL + tên → props.attachments[] | `nodes` UPDATE props |
| Editor thân bài (Editor.tsx 113) | auto-save debounce | `nodes` UPDATE content + md |
| `@` trong editor (Editor 167-175) | chèn mention + tạo liên kết | `links` INSERT |
| `/` → 🗂️ database nhúng (Editor 44, 144) | block dbembed tạo node database con | `nodes` INSERT |
| Database view (Database.tsx) | `＋ hàng` INSERT con; sửa ô UPDATE props/title; `＋ cột` UPDATE db_columns; xoá hàng DELETE | `nodes` |
| PageFooter `＋ Nối` theo chiều (PageFrame 288) | picker tìm trang → onLink (page.tsx 980): tạo liên kết đúng dimension | `links` INSERT, `events`(link) |
| Thảo luận: Enter gửi (1009), `✓ Xong` (1003) | comment kho chung / resolve | `page_comments` INSERT / UPDATE resolved |

---

## 3. GALAXY — `Galaxy.tsx` (toggle trong Kho tri thức, page.tsx 724-790)

```
[🌌 Galaxy] [🧘 Mandala] [🎯 Radar] [📜 Dòng đời] [🧠 Neuro]   [＋][−][⟳]
[chuyển động: drift/still…] [Dòng chảy] [Nối] [✨ Gợi ý]      chú giải 8 chiều (click tắt/bật chiều)
click node → PEEK PANEL bên phải (mở trang ngay trên galaxy, editor đầy đủ thu nhỏ)
chế độ Nối: click node A → click node B → modal "⚡ Nối tri thức" chọn 1 trong 8 chiều
```

5 view (Galaxy 1011-1015):
- **🌌 Galaxy** — cấu trúc kho: cái gì nằm trong cái gì (force layout theo parent).
- **🧘 Mandala** — "Cây Sự Sống", tri thức nở trên đỉnh; tự bật Dòng chảy.
- **🎯 Radar** — 8 trục = 8 chiều liên kết; **bấm nhãn trục để soi riêng một chiều** (onClick 902); node chưa nối chiều nào hiện cảnh báo.
- **📜 Dòng đời** — node có `event_date` đan vào trục thời gian thật.
- **🧠 Neuro** — não 3D tự xoay, kéo nền để XOAY, node mồ côi lơ lửng vành ngoài.

| Nút | Ý nghĩa | Ghi DB |
|---|---|---|
| 5 nút view | đổi mode + preset motion/flow | không |
| `＋ − ⟳` (1018-1020) | zoom/reset camera | không |
| chuyển động + `Dòng chảy` (1030, 1036) | hạt năng lượng chạy dọc liên kết | không |
| `Nối` (1037) | bật connect mode; click 2 node → `onConnect` → modal chọn chiều (page.tsx 1141-1166) → INSERT + toast "vụ nổ" | `links` INSERT, `events`(link) |
| `✨ Gợi ý` (1038) | máy soi cặp trang nên nối mà chưa nối → `⚡ Nối ngay` (1060) gọi onConnect | `links` INSERT (qua modal) |
| chú giải chiều (1082) | tắt/bật từng chiều trên canvas | không |
| `⚠ N trang chưa nối` (1098, view radar/timeline/neuro) | mở danh sách trang mồ côi → click mở trang để nối/gắn 📅 | không |
| click node | mở PEEK PANEL: `[⛶ Toàn trang]` quay về view folder, `[✕]` đóng, nút `Chuyển hoá bài này`/điểm/Ôn lại như trong trang | như mục 2 |

---

## 4. NGƯỜI KHỔNG LỒ (KOL Feed) — `Hubs.tsx` `KolFeed()` (36)

```
hàng stories (✦ Tất cả / 🍎 Jobs / 🪟 Gates + 📜 Hồ sơ) ──► lưới bài kiểu Instagram
click bài ──► viewer: ảnh + md + 💎 Insight gợi ý + quote
            ──► ô "✍️ Insight CỦA BẠN (1 câu)" ──► [💎 Nạp vào kho]
                 → trang mới trong 💎 Kim cương bài học + link reference về bài KOL gốc
```

| Nút | Ý nghĩa | Ghi DB |
|---|---|---|
| avatar story (70) | lọc feed theo KOL (data: nodes subtype `kol_post`/`kol_profile`) | không |
| `📜 Hồ sơ {KOL}` (76) / `📄 Mở trang gốc` (122) | mở trang node trong Kho tri thức | không |
| card bài (84) | mở viewer modal | không |
| `💎 Nạp vào kho` (117) | onInsight (page.tsx 1085-1095): `nodes` INSERT (note, hub 💎 Kim cương bài học qua ensureHub, event_date hôm nay, md template Bài học, props{page_type:'bai-hoc', via:'kol'}) + `links` INSERT (from=bài mới → to=bài KOL, dimension `reference`, source 'kol') + mở trang mới | `nodes`, `links`, `events`(create) |

Editor thêm bài KOL = tạo trang con trong 🌟 KOL Feed (kho tập đoàn) với subtype `kol_post` — không có form riêng trong màn này.

---

## 5. CONTENT ENGINE v2 — `Hubs.tsx` `ContentEngine()` (153)

```
vào tab ──► đọc nodes subtype 'content_matrix' của user
   │ chưa đủ (role+strengths+exploit+formats) ──► WIZARD HỒ SƠ HỒN 5 màn (lưu NGAY từng bước)
   │   0 Vai (4 lựa chọn) → 1 Viết cho ai (textarea+gợi ý) → 2 Điểm mạnh ≤5 + vùng cấm
   │   → 3 Trụ nội dung ≤3 → 4 Nhịp + định dạng ≤3 → [✓ Hoàn tất Hồ sơ Hồn]
   ▼ đã có hồ sơ
 MÀN "HÔM NAY TẠO GÌ?":
   1·Chọn góc kể (4 preset) → 2·Chủ đề + đính kèm 1 chuyện thật (trang trai-nghiem của bạn)
   → 3·[📋 Copy prompt hoàn chỉnh] (Hồ sơ Hồn + preset + chủ đề + md chuyện thật, dán vào Claude/ChatGPT)
   phụ: [Thư viện viral] [21 câu hỏi giọng] [⚙ Hồ sơ Hồn] · [⚡ Tạo lịch 30/60/180 ngày → Xưởng content]
```

| Nút | Ý nghĩa | Ghi DB |
|---|---|---|
| mọi lựa chọn trong wizard (269, 280, 295, 311, 320-322) | `saveMatrix`: tạo trang "🎛️ Hồ sơ Hồn" (subtype `content_matrix`) nếu chưa có rồi UPDATE props.matrix — **lưu từng click, thoát giữa chừng không mất** | `nodes` INSERT/UPDATE props.matrix |
| `← Để sau` (252) | thoát wizard (lần sau vào lại nếu hồ sơ vẫn thiếu) | không |
| 4 preset góc kể (386) | chọn angle cho prompt | không |
| chip 🌱 chuyện thật (400) | fetch md trang trải nghiệm làm "nguồn sự thật" của prompt | chỉ đọc |
| `📋 Copy prompt hoàn chỉnh` (411) | clipboard — AI tự chạy khi cắm key | không |
| `Thư viện viral` (336) | panel: trang viral_script/viral_titles + hooks theo nhóm, click hook = copy | không |
| `21 câu hỏi giọng` (337) → `Lưu & tiếp →` (370) | trả lời từng câu: lưu vào matrix.answers + **append vào trang 🪞 "Tôi là ai" nếu đã tồn tại** (373 — chưa có thì chỉ vào matrix) | `nodes` UPDATE props.matrix + UPDATE md profile_me |
| `⚙ Hồ sơ Hồn` (338) | mở lại wizard chỉnh sửa | (saveMatrix) |
| `⚡ Tạo lịch → Xưởng content` (418) | `genPlan` sinh md lịch tuần theo trụ/nhịp/định dạng → onCreatePlan (page.tsx 1080): createPage trong hub 🎬 Xưởng content, props{page_type:'quy-trinh', via:'engine'} | `nodes` INSERT, `events`(create) |

---

## 6. BOARD CONTENT — `Pages.tsx` `Board()` (864)

```
[▦ Kanban | 📅 Campaign timeline]
Kanban 4 cột: 💡 Ý tưởng → 🎥 Đang làm → 🗓️ Lên lịch → ✅ Đã đăng
  thẻ = nodes cá nhân của bạn có props.board · kéo-thả đổi cột · [＋ Thẻ mới] · click mở trang
  thả vào ✅ Đã đăng ──► modal "📣 Đã đăng!" nhập kênh/reach/lead/ghi chú → content_results
Timeline: nhóm theo props.campaign, chấm theo event_date, vạch "hôm nay"
```

| Nút | Ý nghĩa | Ghi DB |
|---|---|---|
| toggle view (913-914) | kanban/timeline | không |
| kéo thẻ qua cột (980, moveTo 878) | đổi giai đoạn content | `nodes` UPDATE props.board |
| `＋ Thẻ mới` (988) | tạo note "Ý tưởng mới" trong trang 🎬 Xưởng content (⚠ tìm theo **title** 'Xưởng content', tự tạo nếu thiếu — lệch với ensureHub tìm theo props.hub) | `nodes` INSERT (×2 nếu phải tạo Xưởng) |
| click thẻ (982) / chấm timeline (946) | mở trang thẻ trong Kho tri thức (gắn 🚩 campaign + 📅 ngày ở PropsPanel) | không |
| modal kết quả `✓ Lưu kết quả` (1012) | khép vòng kho→content→kết quả (ROADMAP P0#1); ⚠ `source_node_id` đọc từ props nhưng không nơi nào ghi → luôn null | `content_results` INSERT, `events`(content_result) |
| `Để sau` (1011) | bỏ qua nhập kết quả | không |

---

## 7. TRUNG TÂM BIÊN TẬP — `Hubs.tsx` `ReviewHub()` (426) — chỉ hiện khi `can_approve`; badge số bài pending trên rail (page.tsx 644)

```
Danh sách bài status='pending' (mọi kho): icon · title · kho nào · 📂 nằm đâu · ✍️ ai viết · 💡 lý do đề xuất · 💬 n góp ý
   [👁 Xem & duyệt] ──► màn đọc lại lần cuối:
      textarea sửa md trực tiếp │ Xem trước │ góp ý về bài
      [✅ Đã đọc lại — Duyệt & xuất bản]  [↩ Trả lại kèm lý do]  [mở bằng editor đầy đủ →]
Dưới: 💬 Góp ý từ thành viên (open_questions status='feedback') · 🕓 Duyệt gần đây
```

| Nút | Ý nghĩa | Ghi DB |
|---|---|---|
| `👁 Xem & duyệt` (487) | nạp md vào textarea | chỉ đọc |
| `✅ Duyệt & xuất bản` (543, approve 452) | status→published, **md = bản đã sửa trong textarea**, props{last_published_md, approved_at, approved_by} | `nodes` UPDATE |
| `↩ Trả lại kèm lý do` (544, reject 460) | prompt lý do → status→draft, props.review_note (tác giả thấy ở Home "Sửa & nộp lại") | `nodes` UPDATE |
| `mở bằng editor đầy đủ →` (545) | nhảy về Kho tri thức | không |
| góp ý: `mở bài →` (504) / `✓` (506) | mở trang / đánh dấu đã xử lý | `open_questions` UPDATE status='resolved' |
| 🕓 Duyệt gần đây (515) | 5 bài có props.approved_at mới nhất | chỉ đọc |

---

## 8. NHÂN SỰ & PHÂN QUYỀN — `Hubs.tsx` `MembersHub()` (556) — rail chỉ hiện khi `can_approve`; sửa quyền cần `canAdmin` (level 5 hoặc can_approve, page.tsx 1098)

```
Trái: danh sách thành viên (RPC admin_list_members) sort theo cấp
  click người ──► panel: [cấp 1-5 ▼] [✏️ Soạn kho chung ON/OFF] [✅ Quyền duyệt ON/OFF]
               + 📄 6 trang gần đây của họ (kho chung — bấm mở & comment)
Phải: 📋 Giao việc mới (người + việc + ghi chú + hạn) → [📨 Giao việc]
     🗂 Việc đang chạy: ⏳ giao → [Nộp] (người nhận) → 📨 → [Nghiệm thu] (admin) → ✅ (+Qi)
```

| Nút | Ý nghĩa | Ghi DB |
|---|---|---|
| chọn cấp / toggle quyền (601-605) | RPC `admin_set_member(p_user, p_level, p_can_edit, p_can_approve)` | `memberships` UPDATE (server) |
| trang gần đây của họ (613) | mở trang → thảo luận cuối trang | không |
| `📨 Giao việc` (638-645) | INSERT assignment status 'open' (⚠ org_id NOT NULL — đã báo lỗi rõ; ⚠ không gắn node_id dù state có sẵn trường) | `assignments` INSERT |
| `Nộp` (658) | người nhận đánh dấu đã làm | `assignments` UPDATE status='submitted' |
| `Nghiệm thu` (659) | admin chốt + cộng Qi cho người làm | `assignments` UPDATE status='done', `events` INSERT (type 'content' cho assignee) |

---

## 9. HỒ SƠ — `Pages.tsx` `Profile()` (70)

```
avatar + email + vai ─ 4 ô: ⚡Qi (events: tham10·content5·link3·create1) · 🔥Streak · 🏆 Tổng Độ Chuyển hoá (wisdom_depth) · 🎓 Bài đã chuyển hoá
🎙️ GIỌNG CỦA TÔI (n/8): 8 câu hỏi giọng ──► [💾 Lưu giọng]
🔒 Đổi mật khẩu ──► [Đổi]      ⚙️ [Đăng xuất]
```

| Nút | Ý nghĩa | Ghi DB |
|---|---|---|
| `✍️ Bắt đầu / Sửa / Thu gọn` (47) | mở 8 ô trả lời VOICE_QS | không |
| `💾 Lưu giọng` (58) | nguồn để AI viết đúng giọng | `profiles` UPSERT voice{answers, updated_at} |
| `Đổi` mật khẩu (123) | ≥6 ký tự | `supabase.auth.updateUser({password})` |
| `Đăng xuất` (129) | signOut | Auth |

---

## 10. STUDIO NHẬP LIỆU — `Pages.tsx` `Studio()` (155), nằm cuối tab Hôm nay

```
1·Dán raw ──[⚡ Phân tích & đề xuất →]──► 2·Bạn chọn ──[🤖 AI tạo lại bản chuẩn →]──► 3·AI tạo—bạn sửa ──[✓/📨 Nộp]──► 4·Xong
 bước 1: textarea dán bất cứ gì (heuristic analyze: đoán title + loại từ keyword)
 bước 2: title sửa được · 8 loại nội dung · ĐƯA VÀO ĐÂU (🧠 ngay | ♾️ chờ duyệt | 🌐 chờ duyệt, cần can_edit)
         + cây folder đích bung chọn vị trí · TRƯỜNG CHUẨN (📅 ngày sự kiện · 🚩 campaign · ✏️ tóm tắt 1 câu BẮT BUỘC · 🔗 nguồn)
         + 🕸️ nối trang: tìm/gợi ý, đổi chiều →/←, chọn 1 trong 8 dimension
 bước 3: draft = trường chuẩn + template loại (ưu tiên trang ingest_tpl admin chỉnh) + 💎 trích dẫn + 📥 nội dung gốc
         xem đẹp/sửa MD · ✨ đề xuất backlink + câu trích từ raw · tóm tắt nơi nạp [✎ đổi]
 bước 4: ✅/📨 + tự mở trang sau 0.9s · [＋ Nhập tài liệu tiếp]
Dưới: 🗂️ Lịch sử nộp từ Studio (10 bài via='studio') · 📋 Nhiệm vụ biên tập (giao việc nhanh nếu can_approve)
```

| Nút | Ý nghĩa | Ghi DB |
|---|---|---|
| `⚡ Phân tích & đề xuất →` (317, analyze 188) | heuristic đoán loại/title/summary/event_date — AI thật thay khi cắm API | không |
| chip loại / kho đích / cây folder (331-348) | quyết định parent + status (`personal`→published, khác→pending) | không (đến khi nộp) |
| `🤖 AI tạo lại bản chuẩn →` (422, generate 249) | đọc template `ingest_tpl` theo loại (admin chỉnh được) → dựng draft; disabled nếu thiếu Tóm tắt 1 câu | chỉ đọc |
| `📐 Sửa template "{loại}"` (304, editTemplate 261 — chỉ canApprove) | mở/tạo trang Template đầu vào trong kho tập đoàn (subtype ingest_tpl_home/ingest_tpl) | `nodes` INSERT khi chưa có |
| ✨ backlink / 💎 trích dẫn (456-463) | thêm conn dir 'in' / điền quote vào draft | không |
| `✓ OK — nạp vào …` / `📨 OK — nộp & chờ duyệt` (477, publish 278) | INSERT trang (layer/parent/status/event_date/props{page_type, via:'studio', campaign}) + mỗi conn 1 dòng links đúng chiều + xếp hàng AI job | `nodes` INSERT, `links` INSERT ×n (source 'studio'), `ai_jobs` INSERT (`ingest_to_template`, queued), `events`(create) |
| lịch sử nộp (498) | ✅ đã duyệt / ⏳ chờ / 📝 bị trả — click mở | chỉ đọc |
| `Giao việc` (521-525, canApprove) | giao nhanh không gắn node | `assignments` INSERT |
| `✓ Hoàn thành` (537) | người nhận tự đóng việc (luồng Studio cũ — khác vòng đời Nộp/Nghiệm thu của MembersHub) | `assignments` UPDATE status='done' |

---

## 11. LUỒNG CHUYỂN HOÁ 7 MÀN — `Digest.tsx` (modal mở từ nút 🔥/Ôn lại/Hôm nay/peek Galaxy)

```
header: 🔥 Chuyển hoá: {bài} + HOA 8 CÁNH (cánh sáng = chiều đã chạm) + [✕]
1·Đọc & nhặt   nhặt ≤3 câu đắt từ block/md bài (quote gắn vào liên kết MỨC ĐOẠN)
2·Kiến thức    nhớ lại 3 ý · ⚡ nguyên lý MỘT CÂU · nối →/← chiều knowledge
3·Tham chiếu   nguồn ngoài (sách/url/video → tạo note trong 📚 Nguồn) · nối →/← reference
4·Cuộc đời     🌱 kể 1 lần đã sống (☑ lưu note vào 📓 Hành trình) · 🧡 5 cảm xúc · 💚 người thật + chuyện
5·Thời gian    📅 ngày SỰ KIỆN thực tế · nối mốc đời có sẵn · ＋ mốc đời mới (subtype life_event)
6·Hồn cốt      ⭐ giá trị cốt lõi (lần đầu: chọn 3-7 → tạo bộ core_value) · ⚓ MỘT CÂU kim chỉ nam (mantra)
7·Hành động    1 hành động + hạn · ☑ đã thấy người khác thành công · điều còn lấn cấn → open_questions
[🌸 Hoàn tất Chuyển hoá] ──► finish() ghi tất cả ──► 🎉 màn celebration (điểm + n/8 + hẹn ôn)
mỗi lần nối/chọn → hiệu ứng Neuro "khớp thần kinh" ⚡
```

`finish()` (172-268) ghi:

| Dữ liệu màn | Ghi DB |
|---|---|
| M2 nối knowledge (kOut/kIn) | `links` INSERT dimension `knowledge`, source 'tham', excerpt = quote M1 (mức đoạn, from_block) |
| M3 nguồn ngoài | `nodes` INSERT note subtype `reference` trong trang 📚 Nguồn (sysPage 'sources_home') + `links` `reference` |
| M3 nối nội bộ rOut/rIn | `links` INSERT `reference` |
| M4 trải nghiệm (☑ lưu note) | `nodes` INSERT note 🌱 vào hub `journey` (fallback kho nếu thiếu — P0 fix audit 12/6) + `links` `experience` (+`emotion` nếu có cảm xúc) |
| M4 cảm xúc | `nodes` UPDATE emotion của bài |
| M4 người | `nodes` INSERT/ tái dùng subtype `person` trong 👥 Người + `links` `people` (meta.story) |
| M5 ngày + mốc đời | `nodes` UPDATE event_date; mốc mới: `nodes` INSERT subtype `life_event` trong 🌳 Dòng đời + `links` `time` |
| M6 giá trị + neo | lần đầu: `nodes` INSERT ⭐ values_home + từng `core_value`; `links` `values`; mantra: `nodes` INSERT subtype `mantra` trong 🧭 Kim Chỉ Nam + `links` `anchor` (từ mantra → bài) |
| nguyên lý + hành động | `nodes` UPDATE props.principle + props.action{text,due} |
| chấm điểm | `wisdom_depth` UPSERT: 5 cạnh merge GREATEST với lần trước, `learned` = score≥20 hoặc ≥2 chiều, `dims` 8 chiều OR-merge, `next_review_at` theo lịch 1/3/7/21/60 ngày |
| còn lấn cấn | `open_questions` INSERT status 'open' |
| Qi | `events` INSERT type `tham` (=10 Qi) |

---

## Phụ lục — các chỗ gãy luồng THẬT tìm thấy khi đọc code (2026-06-12)

1. **Modal "📥 Dữ liệu thô → Trang chuẩn" chết** — `page.tsx:663` nút "📥 Raw" chỉ `setPage('today')`; không còn chỗ nào `setRawOpen(true)` → modal (1169-1183) + `createFromRaw` (404-418) unreachable. Xoá hoặc nối lại nút.
2. **"Mở việc" trong Hôm nay luôn câm** — `Pages.tsx:626` cần `a.node_id`, nhưng cả 2 form giao việc (`Pages.tsx:523`, `Hubs.tsx:641`) đều không ghi `node_id` (MembersHub có state `na.node_id` nhưng không có ô nhập, không đưa vào INSERT). Trái KHO-CHUAN §3#9 "assignment gắn node_id".
3. **`content_results.source_node_id` luôn null** — `Pages.tsx:1013` đọc `props.source_node_id` nhưng không luồng nào ghi nó (toContent `page.tsx:364` không lưu nguồn vào thẻ; newCard cũng không) → chưa truy được "content nào ra tiền từ bài gốc nào".
4. **Hai cách tìm "Xưởng content" lệch nhau** — Board `Pages.tsx:896` tìm theo `title='Xưởng content'` và tạo KHÔNG có `props.hub`; Engine/Today dùng `ensureHub('studio')` so theo `props.hub` (`page.tsx:338`) → dễ sinh 2 trang Xưởng content trùng.
5. **Nút "📣 Content" có thể đẩy vào hư không** — nút hiện cho mọi trang `owner_id === user.id` (`page.tsx:824`), kể cả bài user nộp lên kho chung (Studio đặt owner = user cho corporate/humanity, `Pages.tsx:281-287`); nhưng Board chỉ query `layer='personal'` (`Pages.tsx:873`) → bấm Content trên bài kho chung, thẻ không bao giờ hiện.
6. **Quote ghi nhanh mất nguồn khi tạo anchor lỗi** — `page.tsx:1046-1052`: nếu không tạo được Kim Chỉ Nam, code rơi xuống nhánh dưới và lưu quote thành "🌱 Trải nghiệm" trong Hành trình (sai loại, mất source).
7. **2 vòng đời assignment song song** — Studio "✓ Hoàn thành" tự đóng (open→done, `Pages.tsx:537`) trong khi MembersHub là open→submitted→done có nghiệm thu + Qi (`Hubs.tsx:658-659`) → cùng bảng, 2 quy trình khác nhau.
