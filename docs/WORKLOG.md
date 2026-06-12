# Akash — Worklog & Upgrade Flow

> Ghi lại mỗi đợt build để lần sau làm tốt hơn. Quy trình chuẩn: **đọc docs → sửa code → `npm run build` → test thật trên preview (đăng nhập, bấm từng nút) → cập nhật docs**.

## 2026-06-12 (đợt 2) — 💎 REDESIGN SẮC SẢO (feedback founder: thân chữ, 8 chiều, neuro nùi, engine rối, cắt thừa)
1. **Data + tầng chữ**: 10 trang md chứa `\n` chữ → newline thật; bắt thủ phạm bằng số đo: BlockNote set 3em ở BLOCK heading → thân trang 74.4px > title 36px → ghìm block 16.5px (giờ 36 > 24.75 > 16.5 ✓).
2. **Deep research 4 mũi** (docs/RESEARCH-VIZ-ARCH.md, nguồn kiểm chứng): graph-viz thực chiến (Obsidian/Gephi/ForceAtlas2/semantic-zoom) · kiến trúc derive-vs-store theo Anki/FSRS · premium dark UI (Linear/Raycast/Geist) · wizard UX (Typeform/GOV.UK/Jasper/HeyGen).
3. **8 CHIỀU THỐNG NHẤT — bỏ radar 5 cạnh** (DECISIONS §A2 cập nhật): điểm Chuyển hoá DERIVE từ links + tín hiệu nội tại — công thức duy nhất `web/src/lib/transformScore.ts` (sat 1-2^-x chống farm, experience+anchor nặng nhất, learned=≥2 chiều giữ nguyên); `wisdom_depth` chỉ còn lịch ôn SM-2; UI = `Dim8Bars` 8 thanh màu framework (header trang + popup + peek), popup chỉ luôn "chiều chưa sáng + câu hỏi để thắp".
4. **Neuro hết "khối nùi"** (theo research): orphan ring — trang 0 link KHÔNG vào khối não, treo vành ngoài thành vòng rỗng nét đứt pulse ("ký ức chưa được kết nối"), badge "⚠ N trang chưa nối — bấm mở & nối"; hover = focus 1-hop, mọi node khác lặn còn chấm mờ alpha 0.1; vị trí deterministic (seed cố định) — mental map ổn định.
5. **Content Engine v2 — hết cognitive load** (theo research mũi 4): tách quyết định MỘT LẦN khỏi MỖI LẦN. Hồ sơ chưa đủ → wizard 5 màn (vai → khán giả → điểm mạnh+vùng cấm → ≤3 trụ → nhịp+định dạng), mỗi màn ≤2 quyết định, lưu từng bước, progress bar. Đủ rồi → MỘT màn "Hôm nay tạo gì?": 4 preset góc kể → chủ đề + đính kèm 1 chuyện thật (md nguyên văn vào prompt) → copy prompt hoàn chỉnh. Thư viện/21 câu thành panel phụ.
6. **PropsPanel rõ ràng**: rừng chip → bảng label–value 2 cột, 2 section mono-eyebrow (Trường chuẩn tím / Trường của tôi cyan), input phẳng hover mới hiện viền.
7. **Cắt thừa**: xoá MembersAdmin/UsersPage/ReviewQueue/Engine cũ (~190 dòng) — đã thay bằng Hubs từ đợt 1.
8. **Timeline**: trục luôn chứa HÔM NAY + 6 tháng tương lai (hết hardcode 12/2025).
**Verify**: đo computed font-size thật trên preview; đi trọn wizard 5 màn bằng tay; prompt cuối 1.9k ký tự có HỒ SƠ HỒN + CHUYỆN THẬT đính kèm; badge neuro "⚠ 96 trang chưa nối" sống; build xanh từng mốc, commit từng phase.
**Bug tự gây & fix**: cắt dead code theo SỐ DÒNG sau khi file đã đổi → cắt chồng (mất VoiceCard/VOICE_QS) — bài học: cắt theo MARKER pattern, không theo line number; git checkout cứu.

## 2026-06-12 — 🌌 ĐÊM BUILD LỚN (5h tự hành, đa agent, deep research ×2)
**Đã có git repo** (root, checkpoint từng phase — lần đầu dự án có version control).
1. **Branding v2 "Vũ trụ Kim cương"** (docs/BRANDING.md): bỏ toàn bộ fuchsia/pink "quê" → quang phổ violet→blue→cyan→diamond + vàng hoàng đạo cho thời gian/Chuyển hoá; font Be Vietnam Pro + JetBrains Mono (subset vietnamese); tokens --ak-* + .ak-cta/.ak-grad; fix double-title (Studio không nhét `# title` vào md nữa, h1 thân bài 1.55em < title).
2. **DB tái cấu trúc theo KHO-CHUAN §2bis**: 7 cây cá nhân (Hành trình/La bàn/Kim cương/Quan hệ/Tủ nguồn/Xưởng/Thịnh vượng — props.hub) + 6 nhánh nhân loại; xoá 5 trang rác; dọn double-title toàn DB.
3. **Seed 194 trang data thật có hồn**: persona 30 tuổi đủ 5 chương đời + 8 cảnh McAdams + giá trị + Kim Chỉ Nam + hồ sơ người + tài chính; deep-research (7 agents, 100 tool calls) seed kho nhân loại 6 nhánh ~22 trang có nguồn, QNET facts public, **20 bài KOL Jobs/Gates ảnh Wikimedia**, ~100 hooks + kịch bản + title formulas, 21 câu hỏi brand voice; **45 links 8 chiều có excerpt** đan xuyên 3 kho.
4. **Home mới**: account block đầu trang (role+Qi+streak) · AI-hiểu-bạn hero to với 6 vùng progress · khối "✅ Hôm nay bạn cần làm" GỘP (ôn + việc giao + bài trả + chờ duyệt; rỗng = 1 dòng) · ghi nhanh 3 LOẠI (trải nghiệm→Hành trình, insight→Kim cương, quote→Kim Chỉ Nam, đủ trường chuẩn) · widget quote sống từ Kim Chỉ Nam + số liệu · KOL preview 3 bài xoay theo ngày.
5. **4 hub mới (Hubs.tsx)**: 🌟 KolFeed kiểu Instagram (stories row + grid ảnh + viewer + "rút insight → Kim cương bài học + tự link reference") · 🎛️ ContentEngine (ma trận content lưu node content_matrix + wizard 21 câu ghi vào "Tôi là ai" + thư viện hook copy 1 chạm + master prompt máy sinh + generator chiến lược 30/60/180 vào Xưởng content + pipeline media vẽ sẵn) · ✅ ReviewHub (kho › nhánh › ai viết › góp ý, màn xem-sửa-md-rồi-duyệt, approved_by) · 👥 MembersHub (cards theo cấp, toggle quyền, trang đang build, giao việc vòng đời giao→nộp→nghiệm thu + Qi).
6. **Chuyển hoá**: toàn bộ UI Thấm → Chuyển hoá; Digest vốn đã 7 màn × 8 chiều.
7. **Galaxy**: Dòng đời 3 làn rõ theo kho (NHÂN LOẠI/ĐỜI TÔI/QNET) + vạch ◆ HÔM NAY chia QUÁ KHỨ (chuyển hoá bài học) / TƯƠNG LAI (mốc cần lấp, sương vàng); Neuro xoay chậm 4.6× khi không kéo (user: "quay vòng vòng không nhìn được").
8. **Rename Akash**: docs headers + package name; Supabase project rename cần dashboard (NOTES-FOUNDER §1).
9. **Docs mới**: BRANDING.md · CONTENT-ENGINE.md (8 bước, model map) · NOTES-FOUNDER.md (việc founder + MCP + AI keys) · ROADMAP 3 phase mới.
**Verify thật trên preview** (login admin, 1440px): Home/KOL/Engine/Review/Members đều render; rút insight KOL → DB đúng (Kim cương + 1 link); sinh lịch 30 ngày → vào Xưởng content; duyệt bài: sửa md được lưu + status published + approved_by ✅. **Bug bắt & fix khi test**: bấm chip ma trận nhanh tạo N node trùng (race trước khi có mxId) → ensureMatrixId + dọn DB còn 1.
**Bug đã gặp**: Be_Vietnam_Pro cần weight tường minh; event_date năm -10000 vỡ timestamp (null hoá); node script ESM phải nằm trong web/ mới resolve node_modules.


- **Audit đa-persona cuối đêm** (4 persona, 12 agents, mọi P0 phản biện chéo): 8 P0 xác nhận → SỬA HẾT trong đêm (docs/AUDIT-2026-06-12.md); 19 P1 + 5 P2 thành backlog trước pilot. Security advisors sau migration: không lỗi mới.
## 2026-06-11 — 📂 Studio đợt 2: bước 2 hoàn thiện data nộp (user feedback)
- **Cây folder chuyển lên bước 2** ngay dưới "Đưa vào đâu?" — bấm kho nào cây của kho đó bung ra như mind map (user yêu cầu); bước 3 chỉ còn dòng tóm tắt `Sẽ nạp vào: … › … · 🕸️ N liên kết` + nút "✎ đổi" quay lại bước 2.
- **📋 Trường chuẩn ngay bước 2** (theo STANDARD-TEMPLATE.md): 📅 Ngày sự kiện (máy tự bắt "hôm nay/sáng nay…" → điền hôm nay; lưu cột `event_date`) · 🚩 Campaign (`props.campaign`) · ✏️ Tóm tắt 1 câu (máy lấy câu đầu raw; **bắt buộc** — thiếu thì viền hổ phách + khoá nút AI tạo) · 🔗 Nguồn. `generate()` đổ cả 4 vào head bản chuẩn.
- **🕸️ Nối trang function thật**: ô 🔍 tìm mọi trang theo tên + chip ✨ máy gợi ý; mỗi liên kết = 1 hàng: nút đổi chiều `bài này → nối tới` / `← backlink từ` + **8 chấm màu = 8 chiều FRAMEWORK** (màu từ `DIM_COLOR` Galaxy, mặc định Tham chiếu) + tên chiều + ✕ bỏ. `publish()` ghi links đúng chiều + dimension. State gộp `conns: {id, dir, dim}[]` (bỏ linkSel/backSel).
- **Verify trên preview + SQL**: nộp thử → bài nằm đúng folder, `event_date=2026-06-11`, `campaign='Kỷ luật T6'`, link `values` từ bài → trang "Kỷ luật" ✅ → đã xoá bài test. Lưu ý phiên: có session khác sửa page.tsx song song (PageFrame.tsx) — Fast Refresh reset state liên tục khi test; `npm run build` chung .next với dev server cũng gây reload.

## 2026-06-11 — 📂 Studio: chọn folder đích trước khi nộp (user yêu cầu)
- **Vấn đề**: `publish()` trong Studio luôn nhét bài vào thẳng gốc kho (`parent_id = kho.id`) — không chọn được folder/trang con.
- **Fix**: bước 3 (xem bản chuẩn xong) thêm khối "📂 Nạp vào đâu?" = **cây folder trực quan** của kho đã chọn ở bước 2: icon trang + thụt cấp + caret ▸/▾ mở cấp con + số trang con + highlight gradient tím dòng đang chọn "✓ nạp vào đây". Dưới cây có **breadcrumb sống**: `Sẽ nạp vào: 🧠 Kho của tôi › 📓 Nhật ký hành trình › 📄 <tên bài>`. Nút nộp đổi label theo đích: "✓ OK — nạp vào 📓 Nhật ký hành trình". Đổi kho ở bước 2 → reset folder. Cây lọc bỏ template (`ingest_tpl*`, `template*`).
- Kỹ thuật: `SPage` thêm `parent_id/icon/subtype` (page.tsx truyền thêm 3 field vào prop `pages` của Studio); state `destId` (null = ngoài cùng kho) + `destOpen`; `publish()` dùng `parent_id = destId ?? kho.id`.
- **Verify trên preview** (login acc admin, đi cả 4 bước): chọn folder "Nhật ký hành trình" → nộp → SQL check `parent_title = 'Nhật ký hành trình'` ✅ → đã xoá bài test khỏi DB. Build xanh, console sạch.

## 2026-06-11 tối — ⚡ Làm lại HẠ TẦNG VẼ Galaxy: hết lag (user báo Neuro lag nặng)
- **Nguyên nhân lag**: `shadowBlur` canvas trên màn retina (gấp 4 pixel) — mỗi neuron 4–8 tua × 2-3 nét đều đổ bóng, cộng quầng plasma `createRadialGradient` MỚI mỗi frame cho từng node.
- **Fix gốc rễ (mọi mode hưởng lợi)**:
  1. Bỏ 100% shadowBlur → **sprite glow vẽ sẵn 1 lần** (`glowSprite(color)` cache Map) rồi `drawImage` — GPU composite, nhanh hơn hàng chục lần. Quầng node/plasma/hạt năng lượng/xung điện/hạt radar-timeline đều dùng sprite.
  2. Quầng thân cây Mandala + xương sống Dòng đời = nét rộng mờ lót dưới (2 lần stroke) thay shadow; dây firing neuro cũng stroke 2 lần (path giữ nguyên).
  3. **Cache measureText** cho nhãn đóng khung neuro (đo chữ mỗi frame rất đắt).
  4. **Animation theo thời gian thực** (`t = performance.now()*0.06` + xoay theo dtMs) — máy chậm/nhanh nhịp tim & tốc độ xoay vẫn đều, không trôi theo FPS.
  5. **Adaptive quality**: đo EMA frame-time, máy đuối tự hạ độ phân giải render 1 → 0.75 → 0.5 (dpr cap 2); **cull** node ngoài màn hình; tua dendrite giảm/bỏ khi node chiếu quá nhỏ; dây neuro 14 → 10 đoạn.
- **Verify bằng Playwright** (headless retina ×2, login acc thật, bấm từng mode, đo FPS bằng rAF): Neuro **120fps** (trước đó lag nặng), kéo xoay 3D + zoom vẫn 111fps; Radar 120, Dòng đời 67, Galaxy 51, Mandala 49 (hai mode này còn vẽ gradient nền full-screen mỗi frame — trên GPU thật vẫn ~60, có thể cache gradient nếu cần thêm). 5 mode đều render đúng chất, não tự xoay, firing đổi vùng theo nhịp.

## 2026-06-11 chiều (2) — 🧠 Neuro v3: NEURON THẬT (hết hình tròn)
- **Soma méo hữu cơ**: thân neuron = blob 12 đỉnh với 2 tầng sóng bán kính (theo phase từng node) + màng rung nhẹ theo thời gian — không còn hình tròn.
- **Dendrites**: 4–8 tua nhánh cong toả từ thân (kho 8 tua, hub 6, note 4), sợi thuôn gốc dày–ngọn mảnh, nhánh con phân cấp ở sợi chẵn, đung đưa chậm; firing → đầu tua loé spark trắng.
- **Nhân neuron** sáng lệch tâm trong soma, sáng hơn khi firing.
- **⚡ Action potential**: khi vùng firing, xung trắng phóng dọc sợi axon từ đầu→cuối (đi đúng đường uốn lượn) kèm glow màu chiều.

## 2026-06-11 chiều — 🧠 Neuro v2: lõi to + dây thần kinh + nhịp tim
- **Lõi vùng to như clip**: kho = cục 18px + quầng plasma radial; trang chính phình theo số con + liên kết (max 16px), node >9px cũng có halo.
- **Dây thần kinh uốn lượn**: link trong neuro = đa khúc 14 đoạn, 2 tầng sóng sin lệch pha đung đưa chậm (envelope sin bám chặt 2 đầu) — như sợi axon sống, thay đường cong đơn.
- **❤️ Nhịp tim lub-dub ~1.1s**: toàn não phập phồng nhẹ theo nhịp kép; **mỗi nhịp một vùng não "firing"** — node vùng đó bừng sáng (glow +36, phình +32%, chấm trắng loé tâm) rồi tắt dần, dây thuộc vùng sáng theo. Như neuron đang phát tín hiệu trong clip.
- Bug tìm khi test: màu hsl() ghép hex alpha làm CanvasGradient nổ → fix hsla. Verify clean.

## 2026-06-11 trưa — 🧠 Neuro 3D (theo reference Z.E.R.O. neurolink)
- Mode thứ 5 trong Galaxy: **🧠 Neuro** — point-cloud 3D chiếu phối cảnh thuần canvas (không three.js): mỗi nhánh lớn = một "vùng não" trên mặt cầu fibonacci với màu hue riêng; **tự xoay chậm + kéo nền để xoay 2 trục**; chiều sâu thật (node gần to, xa nhỏ); nhãn folder/kho **đóng khung HUD monospace** kiểu neurolink; 4 khung góc + dòng "A.K.A.S.H — NEURO LINK · CONNECTED · N NEURONS · M SYNAPSES"; bụi sao nền. Hit-test/tooltip/nối/burst dùng chung pipeline (toạ độ chiếu ghi đè pts mỗi frame).
- HUD motion buttons có **demo sống trong nút** (chấm trôi/phập phồng/đứng yên, vạch dòng chảy chạy, 2 chấm nối nhau) — thấy ngay chức năng khác nhau.

## 2026-06-11 sáng (3) — Studio gom vào Home + vòng AI-chuẩn-hoá + history
- **Studio gộp vào Home** (bỏ mục rail riêng): khối "📥 Nhập liệu & nộp bài" nằm ngay dưới Today — một màn hình cho cả vòng sáng.
- **Quy trình lên 4 bước**: Dán raw → Bạn chọn (loại/đích/links) → **🤖 AI tạo lại bản chuẩn theo template đầu vào** (hiện đổ raw vào skeleton — AI thật thay khi cắm API) → **user sửa trực tiếp bản nháp** → OK mới nộp (cá nhân vào ngay / kho chung pending).
- **Template đầu vào admin chỉnh được**: trang "📐 Template đầu vào" (kho QNET) + trang con per loại (subtype ingest_tpl, props.tpl_for) — nút "📐 Sửa template" ngay đầu Studio (hiện cho can_approve), tự tạo từ skeleton mặc định lần đầu; Studio đọc template này khi chuẩn hoá → đầu vào thống nhất toàn org.
- **🗂️ Lịch sử nộp từ Studio**: trang gắn props.via='studio', list 10 bản gần nhất với trạng thái ✅ đã duyệt / ⏳ chờ / 📝 bị trả lại — bấm mở.

## 2026-06-11 sáng (2) — STUDIO NHẬP LIỆU (function xương sống)
- **Rail sắp lại**: 🏠 Hôm nay lên ĐẦU (landing mặc định), 📥 Studio nhập liệu thành mục riêng thứ 3.
- **Studio = dashboard riêng 3 bước**: (1) dán raw to → (2) **máy đề xuất, user bấm chọn**: tiêu đề sửa được + đoán loại nội dung theo keyword + chọn đích (kho tôi/đề xuất nhân loại/QNET nếu can_edit) + ✨ gợi ý trang để nối → (3) tạo trang: cá nhân vào ngay, kho chung tự `pending` vào luồng duyệt; kèm links + ai_jobs + event. Heuristic là placeholder cho AI hỏi sâu khi cắm API.
- **Phân việc biên tập**: bảng `assignments` (RLS: assigner can_approve insert, assignee/assigner xem & cập nhật) — admin/tổng biên tập giao việc (người + việc + hạn) ngay trong Studio, người nhận thấy ở cùng chỗ và bấm ✓ Hoàn thành. `admin_list_members` mở cho can_approve để chọn người giao.
- Nút 📥 Raw ở header + Home đều trỏ về Studio (modal cũ ngưng dùng).

## 2026-06-11 sáng — Vòng feedback founder + quét ROADMAP
- **Light premium**: gradient stops đậm lại ở light (hết chữ Akash nhạt), card/panel = trắng nổi khối shadow mềm thay xám bệt, hover tím nhạt.
- **Legend 8 chiều đủ framework**: luôn hiện cả 8 (kể cả Neo chưa có link), lưới 4×2, viền trái màu chiều + đếm số link + glow, chiều 0 link mờ — "soi độ cân" đúng nghĩa.
- **HUD khác biệt theo view**: Trôi/Nhịp/Tĩnh + Dòng chảy chỉ hiện ở Galaxy/Mandala (Radar/Timeline tự still); nút mode mỗi view một màu nhận diện (tím/hổ phách/hồng cánh sen/xanh dương).
- **Home (Today) thêm 3 khối ROADMAP**: vòng tròn **🤖 AI hiểu bạn %** (6 yếu tố: giá trị, mantra, bài Thấm, người thật, streak, mốc đời + CTA mục thiếu) · **⏰ Đến hạn ôn hôm nay** (next_review_at SM-2, bấm Thấm lại) · **📥 luồng Raw → Trang chuẩn** ngay Home.
- **Khép vòng kết quả (P0 #1)**: kéo thẻ sang "Đã đăng" → modal 20 giây nhập kênh/reach/lead/ghi chú → `content_results` + event. **Thấm thêm ô "❓ còn lấn cấn"** → `open_questions` (P1 #9).

## 2026-06-11 đêm — CA ĐÊM (đa agent, 5 đợt build liên tục)
**Agent đã chạy**: Persona QA (3 vai: thành viên mới/biên tập/tổng biên tập — 18 issue, top-5 đã sửa ngay trong đêm) · UI/UX Lead (3 spec: Radar 8 chiều, phân biệt 4 view, light theme — đã build đúng spec).

**ĐÊM-1 Page chuẩn**: PAGE_TYPES 8 loại + **properties bar cố định đầu trang** (Loại · 📅 event_date · 🚩 Campaign · trạng thái · ⚡ nguyên lý) · **🧩 Lưu template** (trang → template tái dùng, sửa trong trang 🧩 Template, hiện trong picker) · **📥 Raw → Trang chuẩn** (dán thô + chọn loại → trang chuẩn + ghi `ai_jobs` queued).

**ĐÊM-2 Vòng biên tập khép kín**: Duyệt/Trả lại ngay trong trang (kèm lý do → props.review_note + banner cho tác giả) · **📨 Gửi duyệt lại** (hết ngõ cụt draft) · **♾️ Đề xuất lên Kho nhân loại** từ trang cá nhân (bản sao pending) · **💬 Góp ý sửa** bài QNET cho thành viên (open_questions status feedback, RLS cho approver đọc) · ReviewQueue v2 (tác giả + excerpt + nguồn đề xuất + mục Góp ý) · badge số bài chờ trên rail · Today "📨 Bài của tôi" · approve snapshot last_published_md · onboarding đáp xuống Today · gate Seed/Content theo quyền + check error thật.

**ĐÊM-3 Galaxy 4 view khác biệt**: 🎯 **Radar 8 chiều** (bát giác neon 4 vòng, node đậu trục chiều mạnh nhất, hub gần tâm, vòng cung đa chiều quanh node, xung điện chạy trục, **bấm nhãn trục = solo**, tâm đếm tổng link, chip "chưa vào radar") · 📜 **Dòng đời** (xương sống phát sáng, tick năm, vạch hôm nay, 3 tầng kho trên/dưới, lane chống đè, clamp 60 năm — sách cổ ghim mép, chip "chưa gắn 📅") · nền/motion riêng từng view, resetCam khi đổi.

**ĐÊM-4 Nghiện đúng chất**: 🎉 **Celebration sau Thấm** (confetti 8 màu + hoa 8 cánh + Độ Thấm to + hẹn ôn) · **Board Campaign timeline** (toggle Kanban/📅, hàng theo 🚩campaign, thẻ chấm theo event_date màu giai đoạn, vạch hôm nay, đếm xong/tổng) · **⚡ Qi điểm** (ledger events: thấm 10 · content 5 · nối 3 · trang 1) + 🔥 streak trên Profile + log events ở create/link/content · tokenomics 3 giai đoạn ghi ROADMAP (trung thực về pháp lý).

**ĐÊM-5 Theme + an ninh**: ☀️ **Light theme** "paper sang trọng" (CSS override [data-theme] ~30 rule, script chống flash, toggle ở header, **galaxy + login giữ dark = cửa sổ nhìn vào vũ trụ** có khung nổi) · Supabase advisors: revoke anon mọi RPC, khoá trigger function khỏi API, seed_qnet guard can_edit · seed 12 event_date demo.

**Còn treo cho mai**: mobile drawer (QA A1 — cần session riêng), bật Leaked Password Protection (dashboard Auth, không làm được qua SQL), AI understanding % UI (đã thiết kế FRAMEWORK §4).

## 2026-06-11 — Đợt 9: FRAMEWORK v2 + Thấm 8 chiều (đa agent)
- **FRAMEWORK.md** = hiến pháp mới: 8 chiều liên kết là GỐC RỄ; bỏ nhánh "truyền dạy"; liên kết mức quote (excerpt); event_date thực tế; timeline cá nhân làm trục; thống nhất chữ "Thấm". ROADMAP.md = audit 15 lỗ hổng P0-P2 (đa agent).
- **Thấm 2.0** (Digest viết lại, 7 màn / 8 chiều): M1 Đọc&nhặt quote block-level (túi 3 quote) → M2 Kiến thức (nguyên lý 1 câu props.principle + nối 2 hướng) → M3 Tham chiếu (nguồn ngoài sách/URL thành node dưới 📚 Nguồn + chips 2 hướng reference) → M4 Cuộc đời (Trải→note Nhật ký, Cảm xúc→nodes.emotion, Người→node person dưới 👥) → M5 Thời gian (event_date + mốc 🌳 Dòng đời) → M6 Hồn cốt (lần đầu chọn 3-7 giá trị → trang ⭐, mantra → 🧭 Kim Chỉ Nam) → M7 Hành động. **Hoa Thấm 8 cánh** sáng theo chiều đã chạm; Neuro synapse màu theo chiều; radar merge GREATEST; learned cần ≥2 chiều; SM-2 next_review_at.
- **Schema**: nodes.subtype + event_date; links.from_block/to_block/excerpt/meta (bỏ unique trang-level); wisdom_depth.runs/dims/last_run_at; bảng mới content_results, events, open_questions, ai_jobs (RLS own). Trang hệ thống theo subtype, tự tạo khi cần.
- **Bug E2E tìm ra & fix**: meaning=5.5 vào cột int → upsert wisdom_depth fail lặng lẽ → Math.round tất cả; backfill row test. Verify DB: principle/emotion/3 trang giá trị/3 link values/event tham ✓.

## 2026-06-11 — Đợt 8: Bước Nối thông minh + khớp thần kinh + hub power
- **Digest bước 4 (Nối) làm lại**: hết đổ cả kho thành chip — giờ là ô 🔍 tìm + **✨ 6 gợi ý thông minh** (chấm điểm trùng từ khoá tiêu đề, chừa chỗ thay bằng AI thật) và **tách 2 hướng rõ**: "→ Bài này HƯỚNG TỚI" (link đi) và "← KÉO VỀ ĐÂY" (tạo backlink — bài khác trỏ về). finish() ghi link đúng 2 chiều.
- **Hiệu ứng khớp thần kinh (neuro-link)**: mỗi lần chọn nối → synapse SVG vẽ dần + xung sáng chạy + đầu nhận phát sáng, kèm dòng "⚡ Khớp thần kinh mới → …".
- **Hub power trên Galaxy**: node càng nhiều liên kết càng **to + glow mạnh** (degree map); hub ≥4 liên kết có **vầng hào quang thở**. Node drift giờ có **nhịp thở** (phập phồng ±7%). Bật ⚡ Dòng chảy: dây liên kết thành **mạch điện gạch sáng trôi** (lineDash animation) + hạt năng lượng.
- Fix: kho hết hiện badge "nháp" (status kho → published, bootstrap_me set published + org mới tên Akash).

## 2026-06-11 — Đợt 7: Mandala → Cây Sự Sống (quạt mở lên trời)
- Layout mandala đổi từ vòng tròn đồng tâm sang **cây quạt**: 🧘 ngồi dưới gốc (hào quang vàng + cánh sen), **thân cây sáng gradient** (xanh lá → cyan → hồng) mọc từ đỉnh đầu xuyên qua 3 mắt kho xếp dọc trục: Kho cá nhân (thấp nhất, ngay đỉnh đầu) → Kho QNET → Kho nhân loại (cao nhất); trang của mỗi kho trải trên **cung quạt ~148°** mở lên trời; **nhựa cây** (hạt sáng) chảy dọc thân lên trên.
- Khung liên kết rõ hơn: nhãn kho ghi bên phải node (không đè thân cây); nhãn folder/page chỉ hiện khi zoom >115% hoặc hover; node tránh trục giữa để thân cây luôn thoáng.

## 2026-06-11 — Đợt 6: Mandala galaxy + nối tri thức + Today action-center
- **Galaxy 3.0**: 2 layout — 🌌 Galaxy (radial) & **🧘 Mandala** (thiền giả ở tâm thở nhịp + cánh sen, 3 vòng kho: cá nhân trong → QNET giữa → nhân loại ngoài, cành chứa màu xanh lá như tán cây).
- **⚡ Dòng chảy**: hạt năng lượng màu theo chiều chạy dọc mọi liên kết (tự bật ở Mandala).
- **🔗 Chế độ Nối**: bấm 2 node → modal chọn 1 trong 8 chiều → tạo link + **animation bùng nổ** (vòng lan + 8 tia, như game) tại 2 đầu và giữa. **✨ Gợi ý nối**: heuristic từ khoá tiêu đề cross-layer (chừa chỗ AI thật), nút "Nối ngay".
- **Mạng liên kết 2 chiều** cuối trang: "→ Trang này nhắc tới" (đi) + "← Backlink · được nhắc tới bởi" (về, tự động) + dòng giải thích; @/[ chèn link xong tự refresh + toast.
- **Today action-center**: ô **ghi nhanh** (Enter → trang mới trong Nhật ký hành trình theo template trải nghiệm), khối **Cần thẩm thấu** (bài chưa học + % tiến độ + nút Thẩm ngay mở digest), Tiếp tục viết, dải stats gọn — hết trùng chức năng với sidebar.
- **Board**: nút **＋ Thẻ mới** mỗi cột — thẻ tự nằm trong trang **🎬 Xưởng content** (tự tạo trong kho cá nhân).
- Đổi tên nút học: **Học bài → Thẩm thấu** (bám framework Độ Thấm). Bỏ logo A trùng ở header. Ảnh/video trong trang tự co ≤440px, bo góc.

## 2026-06-10 — Đợt 5: Design system HUD + warp login
- **Tách ngôn ngữ thiết kế**: emoji chỉ dành cho icon page/nội dung (user chọn); toàn bộ chrome chức năng chuyển sang **SVG line-icon** tự vẽ ([Icons.tsx](../web/src/app/Icons.tsx), 25 icon stroke 1.8, kiểu HUD).
- Rail: icon SVG + active = pill gradient + thanh sáng cạnh trái. Header: segmented Trang/Galaxy có icon, nút .md (upload icon), Thoát (logout icon). Sidebar: search/chevron/⋯/＋ đều SVG, chevron xoay 90°. Cụm action trang: MD (code), radar (target), Ôn lại (refresh), Content (megaphone), Học bài (graduation), đóng (X). Peek: expand + X.
- **Login warp** ([Warp.tsx](../web/src/app/Warp.tsx)): canvas 420 sao bay xuyên màn hình (streak theo chiều sâu, 4 màu tím/cyan/hồng/trắng); đang xác thực → **speed ×16 = nhảy hyperspace** ("Đang nhảy hyperspace…", nút "⌁ Khởi động warp drive"). Trải nghiệm như game vũ trụ.

## 2026-06-10 — Đợt 4: Rebrand Akash + auth/onboarding high-tech
- **Rebrand**: Data Qi → **Akash** (akasha = hư không lưu trữ tri thức). Logo chữ "A" gradient glow (component `AkashMark`), đổi ở login/rail/header/onboarding/title tab + tên org trong DB.
- **Login mới**: hero 2 cột (trái: brand + 3 feature cards + tagline; phải: card viền gradient) — tab Đăng nhập/Tạo tài khoản, nhãn field, nút 👁️ hiện mật khẩu, spinner "Đang xác thực…", hint Enter.
- **Onboarding mới**: nền starfield + card viền gradient, progress bar + 3 dots bấm được, animation trượt từng bước; b1: 3 kho dạng card màu; b2: lưới 4 phím tắt (/, @, ⌘K, kéo-thả); b3: vòng lặp 🎓→🎯→📣→💰 + badge vai của user.
- **Chặn lỗi extension Talisman mạnh hơn**: thêm listener `error` (capture + stopImmediatePropagation) bên cạnh `unhandledrejection` — overlay đỏ của ví crypto không đè app nữa (chỉ xảy ra ở dev; bản production không bao giờ hiện).

## 2026-06-10 — Đợt 3: Galaxy 2.0 + role flows + ingestion

**Đã làm**
- Galaxy 2.0: wheel-zoom + nút ＋/−/⟳ (%), kéo nền để pan, 3 chế độ chuyển động (Trôi/Nhịp/Tĩnh), legend = bộ lọc chiều (bấm tắt/bật từng dimension), hạt sáng chạy trên link hover, label note hiện khi zoom >170%.
- **Peek panel**: bấm node trên galaxy mở trang ngay panel phải (không bay về view Trang) + nút "⤢ Toàn trang", cụm nút học, backlinks.
- Slash menu `/`: thêm mục **🗂️ Bảng dữ liệu** — chèn database embed ngay trong trang (block `dbembed`, tự tạo node con kind=database, render bảng/board đầy đủ).
- **Luồng học tách rõ**: chưa học → "🎓 Học bài"; đã học → chip 🎯 score (bấm ra **radar 5 cạnh** Nối-Nghĩa-Chứng-Trải-Hành + nút "Học lại để tăng điểm") + "🔁 Ôn lại bài" + "📣 → Content" (đẩy vào Board cột Ý tưởng).
- **Ingestion**: nút ⬆ .md (file → trang đẹp, tự lấy title từ `# heading`); menu ⋯ có "📑 Trang từ template" (4 template: Bài học/Trải nghiệm/Hồ sơ khách/Tóm tắt sách); nút `{ } MD` xem markdown gốc.
- **Role flows**: rail thêm ✅ Duyệt bài (chỉ can_approve) + 👑 Thành viên (chỉ admin, chuyển từ Profile sang). Biên tập viên (level<4) tạo bài kho chung → status `pending` (⏳ trong sidebar) → ban biên tập Duyệt/Trả lại.
- **Onboarding 3 bước** cho user mới (localStorage `dq-onboarded`) — giới thiệu 3 kho, phím tắt, luồng học, vai của họ.
- Docs: AI-FRAMEWORK.md (pipeline ingestion/retrieval/content + skill design).

**Bug đã gặp & fix**
- BlockNote 0.51: `insertOrUpdateBlock` → đổi tên `insertOrUpdateBlockForSlashMenu`; `createReactBlockSpec` trả factory → phải gọi `()`.

## 2026-06-10 — Đợt 2: Roles + demo + wow pass
- Org chung (`is_primary`) — user mới join làm Thành viên; admin = ng.hongngoc1196@gmail.com (L5). RPC `admin_list_members/admin_set_member/my_membership`.
- Seed 56 notes + 8 trang cha + 30 links (7 chiều) khắp 3 kho.
- ⌘K palette, backlinks, login starfield, Today dashboard thật, Board kanban kéo-thả (props.board), Engine templates, Galaxy đa kho radial.

## 2026-06-10 — Đợt 1: Notion-style
- "Mọi thứ là trang": cây đệ quy 3 kho, kho = page sửa được, inline full-page (bỏ modal), breadcrumb, cover+icon, slash menu tiếng Việt, đổi tên inline, kéo-thả, duplicate, xoá, @ pagelink ghi bảng links, database block (bảng/board, 5 kiểu cột).

## Checklist test mỗi đợt (đăng nhập ng.hongngoc1196@gmail.com)
1. Sidebar: tạo/đổi tên/kéo-thả/xoá trang; badge ⏳ với bài pending.
2. Trang: `/` (heading, bảng, 🗂️ database), `@` link, icon/cover, MD toggle, template.
3. Học: Học bài → digest → radar → Ôn lại → → Content (kiểm tra Board).
4. Galaxy: zoom/pan/filter/motion, bấm node → peek (KHÔNG đổi view), backlinks trong peek.
5. Role: rail ✅/👑 đúng quyền; duyệt bài pending; user thường không sửa kho chung.
6. ⌘K, Today (recent/stats), Board kéo thẻ, onboarding (xoá localStorage `dq-onboarded` để xem lại).

## 2026-06-11 — PageFrame: bộ khung chuẩn của mọi trang (đầu + chân trang)
- **File mới `web/src/app/PageFrame.tsx`** — tách "khoang code" trang ra khỏi page.tsx (~200 dòng gọn lại), gồm 2 component:
  - **`PropsPanel`** (ngay dưới title): ① 📌 **Trường chuẩn** — hệ thống (Loại · 📅 event_date · Tóm tắt · Từ khoá · Nguồn · Đầu ra/Campaign khi lên Board · bộ Hồ sơ) + trường ban biên tập tự thêm (`props.fixed_fields`, chip 🔖 tím) — **fix cứng**: thành viên thường chỉ điền giá trị, chỉ ban biên tập (kho cá nhân = chính chủ) thêm/xoá định nghĩa. ② ✏️ **Trường của tôi** — user thường tự thêm trường riêng (`props.custom_fields`, chip 🏷️, nút ＋ Thêm trường). Dải nút hành động (duyệt/đề xuất/template/đính kèm) truyền vào dạng children từ page.tsx.
  - **`PageFooter`** (cuối trang): 🗂 Trang con → ❤️ **Liên kết 8 chiều** (8 card đúng màu FRAMEWORK, đếm "x/8 chiều sáng", chiều trống hiện CÂU HỎI gợi của chiều đó, nút **＋ Nối** mở picker tìm trang → insert `links` với dimension ngay tại chỗ) → 🕸️ Liên kết & backlink → 💎 Tinh hoa (quote+excerpt) → 📚 References → 📎 Đính kèm.
- DIMS chuyển sang PageFrame.tsx, thêm `icon` + `q` (câu hỏi 8 chiều theo FRAMEWORK §1); PAGE_TYPES/OUTPUT_FORMATS cũng dọn về đây. page.tsx import lại.
- Sửa nốt 3 chỗ `linkSel/backSel` sót lại trong Pages.tsx (Studio đã refactor sang `conns` kèm chiều ở phiên song song) — build đỏ → xanh.
- **Đã test thật trên preview** (acc admin, trang 🎬 Xưởng content): thêm trường riêng "Độ ưu tiên" lưu DB OK; ＋ Nối chiều Cảm xúc → "Ý tưởng mới" ghi bảng links + card sáng 1/8 + toast. ⚠️ Dữ liệu test này còn trên trang Xưởng content (1 trường "Độ ưu tiên", 1 link emotion) — giữ làm demo hoặc xoá tay.
- Việc tiếp: nút gỡ liên kết ngay trong card 8 chiều; trường riêng per-user trên trang kho chung (cần overlay riêng vì RLS không cho member ghi node chung).

## 2026-06-12 (đợt 3) — 🎯 1-ACCENT chốt (founder: 'ok luôn')
- Sweep toàn app theo research Linear/Raycast: chrome = 1 accent tím solid (.ak-cta), gradient CHỈ còn logo/login/onboarding/celebration/canvas; surface ladder #0c0d10→#101113→#1c1d21; bỏ shadow màu trên nút; sửa 2 chuỗi marketing lỗi thời 'radar 5 cạnh' → 8 chiều. BRANDING.md cập nhật mapping. Build xanh, console sạch, verify login + Home trên preview 1440px.

## 2026-06-12 (đợt 4) — 🕹️ GALAXY TƯƠNG TÁC OBSIDIAN-STYLE (founder feedback)
- **Click chọn node** = highlight 1-hop (node khác lặn thành chấm mờ) + sóng trắng "bắn ra" trên hàng xóm + **mũi tên vector** ở đầu mỗi link đang sáng → thấy ngay link hướng về đâu / backlink từ đâu; click nền = bỏ chọn. **Kéo node** như Obsidian (mode 2D, trừ kho) — vị trí lưu manualPos, sống sót qua re-layout; kéo xong không mở nhầm trang (suppress click).
- **Dòng đời 3 THANG THỜI GIAN RIÊNG**: mỗi kho một trục min/max độc lập (nhân loại trải thế kỷ với tick bước 50-200 năm, QNET thập kỷ, đời tôi + 6 tháng tương lai); ◆ HÔM NAY trên từng band; band nhân loại vẽ **đoạn vàng "◆ đời bạn — một chấm của vô tận"** = đời user chiếu lên thang nhân loại; chân mốc rơi đúng spine kho mình, vạch QUÁ KHỨ/TƯƠNG LAI chỉ ở band ĐỜI TÔI.
- **Trackpad macbook chuẩn Figma**: native wheel listener passive:false (hết zoom cả trang) — pinch = zoom tại con trỏ (clamp 0.8-1.25/tick, verify 100→125%), 2 ngón = pan (neuro: 2 ngón = xoay não); **semantic node size** k^0.55 — zoom sâu node không choán màn.
- Verify: build xanh, tsc sạch, timeline 3 band render đúng trên preview, zoom đo bằng dispatch WheelEvent.

## 2026-06-12 (đợt 5) — ⏳ TIME-ZOOM quanh cột HÔM NAY + chống node đè
- **Dòng đời v3**: CỘT ◆ HÔM NAY thành trục tham chiếu CHUNG — cả 3 dòng thời gian (nhân loại/đời tôi/QNET) neo NOW vào cùng một cột X (78% màn); **pinch = zoom THỜI GIAN** quanh cột (×1→×120, không phải zoom camera): ra xa thấy nghìn năm, vào gần thấy từng tháng; tick năm tự đổi bước nice (1→2000 năm) theo mật độ px; verify: zoom 6 tick → band đời tôi hiện từng năm 2021-2028, 3 band thẳng hàng tại cột.
- **Chống node đè nhau** (galaxy + mandala): collision relaxation 22 vòng với spatial hash (minD = rA+rB+8) — node tách đều như Obsidian, kho đứng yên.
- Backlog ghi nhận: trích NGÀY nhắc trong nội dung page → mốc phụ lên trục time (cần select md toàn org — Phase 2, đã ghi AUDIT).
