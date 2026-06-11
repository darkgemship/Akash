# Akash — Use case từng vai (2026-06-12)

> 5 persona, mỗi persona MỘT kịch bản đầu-cuối đi qua các màn THẬT trong code (`page.tsx`, `Pages.tsx`, `Hubs.tsx`, `Galaxy.tsx`, `Digest.tsx`, `PageFrame.tsx`).
> Ký hiệu: ✅ luồng mượt đúng code · ⚠️ GẬP GHỀNH = chỗ code thật làm user vấp (kèm file:dòng). Đọc cùng `docs/APP-FLOWS.md` (bản đồ nút) và `docs/KHO-CHUAN.md` (chuẩn kho).

---

## 1. 👤 Hà — thành viên mới cấp 1, NGÀY ĐẦU TIÊN

**As a** thành viên mới được sponsor mời, **I want** vào app là biết ghi gì và thấy kho lớn hơn mình, **so that** ngày đầu đã có "viên kim cương" đầu tiên.

1. **Đăng ký** — màn Warp, tab "Tạo tài khoản", email + mật khẩu ≥6 → `⌁ Tạo tài khoản & cất cánh`. Code tự signIn nếu auto-confirm bật (`page.tsx:118-122`); lỗi nào cũng có thông báo tiếng Việt (`viError`). ✅
2. **`bootstrap_me()`** tạo org + kho cá nhân; `my_membership` trả level 1 (không can_edit/can_approve) → rail chỉ có: Hôm nay · Kho tri thức · Người khổng lồ · Content Engine · Board · Hồ sơ (Review/Nhân sự ẩn, `page.tsx:634-635`). ✅
3. **Onboarding 3 bước** (3 tầng kho → 4 thao tác → vai "👤 Thành viên") → `✍️ Viết dòng đầu tiên` đáp xuống Hôm nay. ✅
4. **Ghi nhanh đầu tiên**: chọn 🌱 Trải nghiệm, gõ "Hôm nay đi event đầu tiên, run muốn xỉu" → Enter. `ensureHub('journey')` TỰ TẠO cây 📓 Hành trình của tôi (P0 fix audit 12/6, `page.tsx:337-347`), trang note sinh ra đủ event_date hôm nay + page_type + md template → nhảy sang Kho tri thức, trang mở sẵn. ✅
5. **Đọc kho chung**: sidebar thấy 🌐 Kho tập đoàn + ♾️ Kho nhân loại (đọc được, không sửa — `canEditLayer` false). Hà thử bấm đúp đổi tên bài QNET → không vào được chế độ rename vì `editable=false`. ✅ đúng phân quyền.
   - ⚠️ GẬP GHỀNH: nếu org mới mà kho chung RỖNG, nút `⬇ Seed` chỉ hiện cho người có `can_edit` (`page.tsx:710`) → Hà cấp 1 nhìn 2 tầng kho trống trơn không có hành động nào, chỉ dòng "Chưa có trang. Bấm ＋" mà ＋ cũng ẩn với cô.
6. **Người khổng lồ**: tab 🌟, đọc bài Steve Jobs, gõ insight 1 câu → `💎 Nạp vào kho` → trang mới trong 💎 Kim cương bài học + link `reference` về bài gốc, tự mở trang (`page.tsx:1085-1095`). ✅ vòng đọc→kho chạy ngay ngày đầu.
7. **Chuyển hoá lần đầu**: trong trang vừa tạo bấm `🔥 Chuyển hoá` → 7 màn Digest. Màn 6 lần đầu cho chọn 3–7 giá trị sống (tạo bộ ⭐ core_value) + viết câu ⚓ Kim Chỉ Nam → `🌸 Hoàn tất` → màn 🎉 celebration + điểm + hẹn ôn 1 ngày sau. `events` ghi `tham` = 10 Qi. ✅ — mọi chiều skip được, không bị ép.
8. Quay lại Hôm nay: vòng "AI hiểu bạn" đã nhích (giá trị + kim chỉ nam + 1 bài chuyển hoá + streak 1 ngày). Ngày đầu kết thúc có: 2 trang, 1+ liên kết, 1 mantra. ✅

---

## 2. 🌱 Minh — thành viên đang chuyển hoá ĐỀU (tuần thứ 3)

**As a** thành viên ghi đều mỗi tối, **I want** app nhắc đúng việc và biến bài chín thành content, **so that** kho thành máy ra bài chứ không phải nghĩa địa note.

1. **Mở app buổi tối** → Hôm nay: chào theo giờ + ⚡Qi + 🔥streak (đếm ngày liên tục từ `events`, `Pages.tsx:589-596`). Khối `✅ Hôm nay bạn cần làm` gom: 2 bài đến hạn ôn (`wisdom_depth.next_review_at <= now`) + 1 bài bị trả. ✅
2. **Ôn lại**: `Ôn ngay` → Digest mở lại, điểm 5 cạnh merge GREATEST (không bao giờ tụt), lịch ôn giãn 1→3→7→21→60 ngày (`Digest.tsx:261`). ✅
3. **Ghi trải nghiệm mới** qua ghi nhanh → vào 📓 Hành trình, có ngày local không lệch UTC (`page.tsx:1055`). ✅
4. **Galaxy soi kho**: Kho tri thức → `Galaxy` → thử 5 view. 🎯 Radar thấy chiều 💚 Con người tối thui → bấm `⚠ N trang chưa nối` mở danh sách mồ côi → mở trang, dùng PageFooter `＋ Nối` chiều people ngay tại chỗ (`PageFrame.tsx:288-307`). ✅ mỗi view một insight đúng RESEARCH-VIZ-ARCH.
5. **Nối trên galaxy**: bật `Nối`, click 2 node → modal chọn 1 trong 8 chiều → 💥 nổ + toast. `links` INSERT + 3 Qi. ✅
6. **Bài chín → content**: trang trải nghiệm tuần trước đã learned, header hiện `🎯 34 · 5/8` + nút vàng `📣 Content` → bấm → props.board='idea' → qua tab Board thấy thẻ ở cột 💡 Ý tưởng. ✅
7. **Content Engine**: lần đầu vào bị dẫn qua wizard Hồ sơ Hồn 5 màn — mỗi click LƯU NGAY (`saveMatrix`, `Hubs.tsx:205-209`), Minh thoát giữa chừng ở màn 3, hôm sau vào tiếp đúng chỗ thiếu. ✅. Xong hồ sơ: chọn preset 🌱 "Kể một chuyện thật" → gõ chủ đề → đính kèm 1 trang trải nghiệm → `📋 Copy prompt` dán vào ChatGPT. ✅ (AI in-app chưa có — by design "khi cắm key").
8. **Đăng xong quay lại Board**: kéo thẻ → ✅ Đã đăng → modal "📣 Đã đăng!" nhập kênh + reach + lead → `✓ Lưu kết quả` → `content_results`. ✅ vòng kho→content→kết quả khép.
   - ⚠️ GẬP GHỀNH: `content_results.source_node_id` luôn null (`Pages.tsx:1013` — không luồng nào ghi `props.source_node_id`) → tuần sau Minh không thể hỏi "bài gốc nào ra nhiều lead nhất"; lời hứa "AI học content nào ra tiền" chưa có dây nối.
   - ⚠️ GẬP GHỀNH: Minh từng `＋ Thẻ mới` trên Board trước khi dùng Engine — Board tạo trang "Xưởng content" theo title (`Pages.tsx:896`) không có `props.hub`, nên khi Engine `⚡ Tạo lịch → Xưởng content` chạy `ensureHub('studio')` (`page.tsx:338`) lại đẻ ra trang Xưởng content THỨ HAI → kho cá nhân có 2 xưởng song song.

---

## 3. ✏️ Lan — biên tập viên (level 3, can_edit, không can_approve)

**As a** biên tập viên, **I want** soạn kho chung theo chuẩn và nộp qua duyệt, **so that** kho QNET/nhân loại sạch và đồng nhất.

1. Rail của Lan vẫn KHÔNG có Trung tâm biên tập/Nhân sự (cần can_approve) — đúng: cô soạn, không duyệt. ✅
2. **Soạn trực tiếp kho chung**: sidebar 🌐 có nút ＋ (canEditLayer qua can_edit). Tạo trang ở kho chung với level 3 < 4 → status `pending` + toast "📨 Đã gửi chờ duyệt" (`page.tsx:354-358`), trang đeo badge ⏳ trong cây. ✅ chính người soạn cũng phải qua cổng duyệt.
3. **Nhập tài liệu dài qua Studio** (cuối tab Hôm nay): dán transcript → máy đoán loại → bước 2 Lan thấy thêm lựa chọn 🌐 Kho QNET (chỉ hiện khi canEdit, `Pages.tsx:338`), chọn folder đích trong cây, điền Tóm tắt 1 câu (bắt buộc — nút AI bị disable nếu thiếu, `Pages.tsx:422`), nối 2 trang liên quan đúng chiều → `📨 OK — nộp & chờ duyệt`. `nodes` pending + `links` + `ai_jobs` queued. ✅ cổng chính ép chuẩn đúng KHO-CHUAN §2.
4. **Bị trả bài**: tổng biên tập trả lại kèm note → sáng sau Hôm nay của Lan hiện todo "🔁 Sửa & nộp lại … BTV góp ý: …" (`Pages.tsx:627`) → mở trang thấy banner 💬 góp ý + nút `📨 Gửi duyệt lại` (`page.tsx:899-903`). ✅ vòng trả-sửa-nộp khép trong UI.
5. **Việc được giao**: tổng biên tập giao "Nhập chương 3 Atomic Habits" → hiện trong khối Cần làm.
   - ⚠️ GẬP GHỀNH: nút `Mở việc` không làm gì vì assignment không có `node_id` (`Pages.tsx:626`; INSERT tại `Pages.tsx:523` và `Hubs.tsx:641` đều bỏ trống) → Lan phải tự đi tìm trang trong kho.
   - ⚠️ GẬP GHỀNH: hai vòng đời việc lệch nhau — trong Studio cô tự bấm `✓ Hoàn thành` là việc đóng luôn (`Pages.tsx:537`), trong khi MembersHub kỳ vọng cô bấm `Nộp` rồi chờ nghiệm thu (`Hubs.tsx:658`) → tuỳ màn nào mở mà việc "xong" theo nghĩa khác nhau, Qi chỉ được cộng ở nhánh nghiệm thu.
6. **Thêm bài KOL**: màn Người khổng lồ chỉ ghi chú "Editor: thêm bài = tạo trang con trong 🌟 KOL Feed" (`Hubs.tsx:60`) — không có form; Lan phải vào Kho tri thức tạo trang con subtype/props bằng tay. ⚠️ GẬP GHỀNH nhẹ: yêu cầu biết đặt `props.kol/year/insight/image_url` thủ công, chưa có UI.

---

## 4. ✅ Tuấn — tổng biên tập (level 4, can_edit + can_approve)

**As a** tổng biên tập, **I want** mọi bài chờ duyệt dồn về một chỗ kèm bối cảnh đầy đủ, **so that** duyệt nhanh mà không hạ chuẩn.

1. Rail có thêm ✅ Trung tâm biên tập (badge đếm bài pending toàn cây, `page.tsx:644`) + 👥 Nhân sự. Hôm nay cũng nhắc "📨 N bài chờ bạn duyệt" → `Vào duyệt` nhảy thẳng tab review (`page.tsx:1068`). ✅
2. **ReviewHub**: mỗi bài thấy đủ — kho nào, 📂 breadcrumb nằm đâu, ✍️ ai viết (map email qua `admin_list_members`), 💡 lý do nếu là đề xuất nhân loại, 💬 số góp ý đang treo. `👁 Xem & duyệt` → sửa md TRỰC TIẾP trong textarea + xem trước → `✅ Đã đọc lại — Duyệt & xuất bản` (lưu luôn bản sửa + approved_by, `Hubs.tsx:452-458`) hoặc `↩ Trả lại kèm lý do`. ✅ đúng triết lý "xem-sửa-rồi-duyệt".
   - ⚠️ GẬP GHỀNH: textarea md là đường sửa THÔ — nếu trang gốc soạn bằng BlockNote, duyệt kiểu này chỉ update `md` mà KHÔNG đụng `content` (JSON); Editor ưu tiên `content` khi mở (`page.tsx:516-518`) → bản Tuấn sửa lúc duyệt có thể không phải bản hiển thị khi tác giả mở lại trang. Nút "mở bằng editor đầy đủ →" là lối thoát nhưng dễ bị bỏ qua.
3. **Duyệt ngay trong trang**: đi dạo kho thấy bài ⏳, PropsPanel có sẵn `✅ Duyệt`/`↩ Trả lại` tại chỗ (`page.tsx:879-895`) — không cần quay về hub. ✅
4. **Góp ý từ thành viên**: cột 💬 hiển thị `open_questions` status feedback, mở đúng bài, bấm `✓` resolve. ✅
5. **Chuẩn đầu vào**: trong Studio bấm `📐 Sửa template "Bài học"` → mở/tạo trang ingest_tpl trong kho tập đoàn → sửa template là toàn org nộp bài theo khuôn mới (`Pages.tsx:261-276`). ✅ (KHO-CHUAN §3#7 muốn dời nút này khỏi Studio sang khu quản trị — hiện vẫn nằm trong luồng user).
6. **Nhân sự**: vì can_approve nên Tuấn cũng `canAdmin` (`page.tsx:1098` truyền `role?.level === 5 || can_approve`) → đổi được cấp/quyền thành viên qua `admin_set_member`, giao việc, nghiệm thu (+Qi cho người làm). ✅
   - ⚠️ GẬP GHỀNH (chính sách): tổng biên tập chỉnh được cả LEVEL và quyền của người khác ngang admin — ranh giới vai 4 vs 5 trong ROLES.md không được code phân biệt ở màn này.

---

## 5. 👑 Vy — admin (level 5)

**As an** admin, **I want** dựng khung org, phân quyền và giữ kho chuẩn, **so that** hệ thống tự chạy không cần mình trực.

1. **Khởi tạo kho chung**: kho trống → nút `⬇ Seed` (sidebar, cần can_edit) chạy RPC `seed_qnet` đổ cây QNET/nhân loại mẫu. ✅
2. **Phân quyền**: Nhân sự → click từng người → set cấp 1-5, bật ✏️ Soạn kho chung / ✅ Quyền duyệt; thấy số trang từng người + 6 trang gần đây của họ (kho chung — kho riêng đúng là KHÔNG hiện, RLS). ✅
3. **Giao việc có vòng đời**: giao → người nhận `Nộp` → Vy `Nghiệm thu` → `events` cộng Qi cho người làm (`Hubs.tsx:659`). ✅ — nhưng vẫn dính 2 gập ghềnh assignment như persona 3 (không gắn trang, 2 vòng đời lệch).
4. **Giữ chuẩn nội dung**: sửa các trang `ingest_tpl` (qua Studio) + thêm "trường chuẩn" fix cứng ngay trên PropsPanel của trang kho chung (`＋ trường chuẩn`, PageFrame:134 — chỉ isEditor) → mọi người chỉ điền giá trị, không sửa được định nghĩa. ✅ đúng mô hình Tana/Capacities trong KHO-CHUAN §2bis.
5. **Theo dõi sức khoẻ kho**: Galaxy Radar/Neuro xem chiều lệch + trang mồ côi; Hôm nay thấy pendingAll. Job dọn kho tuần (KHO-CHUAN §2 luồng 5) chưa tồn tại trong code — mới là kế hoạch. ⚠️ (đúng roadmap P2, không phải bug).
6. **Điểm mù admin đáng biết**:
   - ⚠️ Nút "📥 Raw" header Kho tri thức là đường cụt: chỉ đá về tab Hôm nay (`page.tsx:663`), còn modal Raw→Trang chuẩn + `createFromRaw` thành code chết (`page.tsx:1169`, `404`) — user hỏi "nút Raw để làm gì" là câu trả lời đang sai với title của nút.
   - ⚠️ `📣 Content` hiện cả trên bài kho chung do user sở hữu (Studio đặt owner cho bài corporate/humanity, `Pages.tsx:287`) nhưng Board chỉ đọc thẻ `layer='personal'` (`Pages.tsx:873`) → bấm xong thẻ "biến mất", không ai thấy ở đâu.
   - ⚠️ Ghi nhanh 💬 Quote: nếu INSERT trang Kim Chỉ Nam lỗi (RLS/org), quote rơi xuyên xuống nhánh dưới và bị lưu thành 🌱 Trải nghiệm trong Hành trình, mất nguồn (`page.tsx:1046-1063`).

---

## Tổng hợp gập ghềnh (ưu tiên sửa)

| # | Gãy | Ảnh hưởng vai | Vị trí |
|---|---|---|---|
| 1 | Modal Raw→Trang chuẩn unreachable, nút "📥 Raw" sai chức năng | mọi vai | `page.tsx:663` vs `page.tsx:1169,404` |
| 2 | Assignment không gắn node → "Mở việc" câm | BTV, thành viên | `Pages.tsx:626,523` · `Hubs.tsx:641` |
| 3 | `source_node_id` luôn null → không truy "content nào ra tiền" | thành viên chuyển hoá | `Pages.tsx:1013` · `page.tsx:364` |
| 4 | 2 cơ chế tìm/tạo "Xưởng content" → trang trùng | thành viên | `Pages.tsx:896` vs `page.tsx:338` |
| 5 | `📣 Content` trên bài kho chung → thẻ không hiện trên Board | BTV trở lên | `page.tsx:824` vs `Pages.tsx:873` |
| 6 | Duyệt qua textarea md không sync `content` JSON | tổng biên tập | `Hubs.tsx:456` vs `page.tsx:516-518` |
| 7 | 2 vòng đời assignment lệch (Hoàn thành vs Nộp/Nghiệm thu) | BTV, admin | `Pages.tsx:537` vs `Hubs.tsx:658-659` |
| 8 | Quote capture mất nguồn khi anchor tạo lỗi | thành viên mới | `page.tsx:1046-1063` |
| 9 | Org mới: thành viên cấp 1 nhìn kho chung trống, không CTA | thành viên mới | `page.tsx:710` |
