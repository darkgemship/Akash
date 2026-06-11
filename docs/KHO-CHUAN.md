# KHO CHUẨN — Luồng data đồng nhất + Audit Home (phiên 2026-06-12)

> Trả lời câu hỏi của founder: "data phải có gốc rễ rồi ánh xạ đi ra, tổng bao nhiêu dạng page, kho tiêu chuẩn là gì". Đọc cùng FRAMEWORK.md (8 chiều) và STANDARD-TEMPLATE.md (khung trang).
> **§2bis là bản CHỐT sau deep-research 2026-06-12** (106 agents, 24 nguồn, 25 luận điểm kiểm chứng 3 phiếu — nguồn chính: Life Story Interview II của McAdams/Northwestern, VIA Institute, docs Tana/Capacities/LYT, Wikipedia Main Topic Classifications). §2 cũ giữ làm lịch sử.

## 0. Hiện trạng đo được (DB 2026-06-12, 90 trang)

| Chỉ số | Số | Nghĩa là |
|---|---|---|
| Trang 0 liên kết | 42 (47%) | Gần nửa kho "chưa thuộc về cuộc đời ai" (vi phạm gốc rễ FRAMEWORK §1) |
| Trang không event_date | 78 (87%) | Dòng đời (trục gốc) gần như rỗng |
| Trang không page_type | ~85 (94%) | AI không biết trang là gì để dùng |
| Trang title rác (ádfsdf…) | 5 | Cần xoá |
| Trang mồ côi không cha | 0 | Cây vật lý ổn — vấn đề nằm ở NGHĨA, không ở chỗ đặt |

**Chẩn đoán gốc**: app có nhiều cửa tạo trang (Tạo trang ở Home, sidebar ＋, Studio, Digest tạo nhánh…) nhưng chỉ Studio ép chuẩn → trang sinh ra từ cửa khác là trang "tự do" không loại, không link, không ngày.

## 1. TỔNG DẠNG PAGE (chốt — không thêm nữa)

**3 nhóm, user chỉ thấy 2 nhóm đầu:**

### Trục 1 — BẢN CHẤT TRI THỨC (7 loại, gắn MỌI trang kho)
| # | Loại | page_type | Trường bắt buộc riêng | Cây gốc mặc định |
|---|---|---|---|---|
| 1 | 🌱 Trải nghiệm | `trai-nghiem` | event_date | 📓 Dòng đời |
| 2 | 🎓 Bài học / Khái niệm | `bai-hoc` | principle 1 câu (sau Thấm) | 🎓 Bài học |
| 3 | 📋 Quy trình / Checklist | `quy-trinh` | bước [ ] | 🎓 Bài học |
| 4 | 👤 Hồ sơ (người/khách) | `ho-so` | trạng thái quan hệ | 🤝 Con người |
| 5 | 📚 Nguồn (sách/tài liệu) | `nguon` | tác giả/nguồn gốc | 📚 Tủ nguồn |
| 6 | 🌟 Sự kiện / Mốc | `su-kien` | event_date | 📓 Dòng đời |
| 7 | ❓ Câu hỏi mở | `cau-hoi-mo` | — | ❓ Hộp câu hỏi |

⚠️ **Lệch cần chốt**: DECISIONS §A6 ghi trục 1 có "Câu hỏi mở", nhưng PageFrame.tsx đang thay nó bằng `ghi-chu`. Đề xuất: **giữ Câu hỏi mở trong 7 loại**; `ghi-chu` không phải loại — nó là **trạng thái "chưa phân loại"** (inbox). Ghi nhanh rơi vào inbox, luồng Thấm/AI phải chuyển hoá nó thành 1 trong 7 rồi mới được published.

### Trục 2 — ĐỊNH DẠNG ĐẦU RA (6, CHỈ gắn thẻ Xưởng content)
`blog · video · reel · email · caption · talk` — content KHÔNG phải tri thức gốc; nó là **ánh xạ** của tri thức (phải link `experience/knowledge/values` về trang gốc).

### Nhóm hệ thống (subtype — máy quản, user không tạo tay)
`kho` · `hub` (trang gốc cây) · `value` + `values_home` · `anchor` (Kim Chỉ Nam) · `ingest_tpl(_home)` · `template(_home)` · `database/board` · `core_value`.

## 2. KHO TIÊU CHUẨN — cây gốc cố định, mọi thứ ánh xạ ra

**Nguyên tắc sắt: KHÔNG trang nào sinh ra lơ lửng.** Mỗi trang nằm vật lý ở ĐÚNG MỘT cây gốc (theo loại), mọi chỗ khác cần nó thì LIÊN KẾT 8 chiều trỏ về (không copy). "Câu chuyện bản thân" gốc luôn ở cây Dòng đời — content/bài học kể lại chuyện đó chỉ link `experience` về.

### 🧠 Kho cá nhân — 7 cây (hiện có 6 hub, cần map lại)
```
📓 Dòng đời & câu chuyện   ← Trải nghiệm + Sự kiện/Mốc (event_date bắt buộc; "Mục tiêu 2026" = mốc TƯƠNG LAI nằm đây)
🎓 Bài học của tôi          ← Bài học + Quy trình cá nhân
⭐ Giá trị cốt lõi (3–7 value) + 🧭 Kim Chỉ Nam (anchor)
🤝 Con người của tôi        ← Hồ sơ khách/đội nhóm/người thân
📚 Tủ nguồn cá nhân         ← Nguồn đang đọc/đã đọc (sách chương = trang con)
🎬 Xưởng content            ← Ý tưởng + nháp + đã đăng (trục 2 ở đây; gộp "✍️ Ý tưởng content" vào làm cột)
❓ Hộp câu hỏi mở           ← từ Thấm "còn lấn cấn" + ghi nhanh chưa phân loại (inbox)
```
Map hiện trạng: Nhật ký hành trình→Dòng đời · Mục tiêu 2026→mốc trong Dòng đời · Khách hàng & đội nhóm→Con người · Ý tưởng content→cột trong Xưởng · 3 trang rác→xoá.

### 🌐 Kho QNET — giữ A–F + 1 khu admin
```
A. Kiến thức căn bản (bai-hoc)   B. Sản phẩm (nguon/ho-so)   C. Founders & The V (ho-so)
D. Guru Maa (ho-so/nguon)        E. Kỹ năng bán hàng (quy-trinh)   F. Hệ thống & văn hoá (bai-hoc)
📐 Chuẩn nội dung (admin-only: template đầu vào 7 loại + trường chuẩn khoá) — RỜI khỏi Studio
```

### ♾️ Kho nhân loại — mỗi cây = MỘT NGUỒN
Folder nguồn (sách/triết lý, page_type=nguon) → chương/khái niệm là trang con. **Không nhận trang lẻ** ngoài cây nguồn; "Xưởng content" lạc trong kho này → xoá/chuyển.

### Luồng sinh trang duy nhất (chống page ngẫu nhiên)
1. **Studio = cổng chính**: chọn loại → máy TỰ đề xuất cây gốc đúng theo bảng trên (user chỉ chọn vị trí TRONG cây đó, không chọn lung tung).
2. **Ghi nhanh Home** = rơi vào ❓ inbox với event_date hôm nay — sau đó Thấm/AI chuyển hoá thành loại thật + dọn về đúng cây.
3. **Tạo trang ở sidebar** chỉ cho trang con trong cây đang đứng (kế thừa loại của hub).
4. **Gác cổng publish (data lint)**: published đòi đủ `{loại ≠ inbox, tóm tắt 1 câu, event_date nếu loại 1/6, ≥1 link 8 chiều}` — thiếu thì ở draft và bị nhắc trong "Hôm nay cần làm".
5. **Job dọn kho** (tuần): list trang 0 link / inbox quá 7 ngày / title rác → đề xuất gộp/xoá/phân loại (AI khi cắm API).

## 2bis. FRAMEWORK KHO CHỐT (sau deep-research — thay thế §2 phần cây)

### Nền tảng nghiên cứu (đã kiểm chứng, xem nguồn cuối mục)
1. **Cấu trúc cứng đặt ở LOẠI TRANG + FORM, không ở cây sâu.** Tana ("content IS the tag" — node là object có kiểu, mang form trường điền sẵn + default values) và Capacities ("mọi content là object có type; không phải quyết định file vào đâu trước khi tạo") là 2 tiền lệ thương mại đã chạy. Cây thư mục chỉ là "xương sống nhỏ ship sẵn" — Capacities gọi là clear spine.
2. **Chính McAdams phản đối phân cấp cứng cho câu chuyện đời**: bản sắc tự sự giống "tuyển tập truyện ngắn cùng tác giả" — kết dính bằng GIỌNG kể + CHỦ ĐỀ lặp lại, không phải cây lồng nhau. → Cây gốc Akash chỉ để CẮM RỄ; sự thống nhất thật đến từ 8 chiều liên kết + giọng AI học được. Khớp 100% triết lý "gốc rễ rồi ánh xạ ra".
3. **Không pre-seed folder rỗng** (LYT/Nick Milo: chỉ thêm cấu trúc khi chạm "Mental Squeeze Point"; vault thương mại của chính Milo chỉ ship 3 folder). → Ship cây cấp 1, KHÔNG tạo sẵn cấp 2-3 rỗng.
4. **Khung "khai thác kim cương" có sẵn 30 năm chuẩn hoá**: Life Story Interview II (McAdams 2007) = chương đời (2–7 chương) + 8 cảnh then chốt + kịch bản tương lai + thử thách; MỌI cảnh kèm follow-up cố định "chuyện gì/khi nào/ở đâu/ai/nghĩ-cảm gì + cảnh này nói gì về con người bạn". Con số 2–7 chương ủng hộ giới hạn 7 cây cấp 1.
5. **Gắn nhãn điểm mạnh bằng VIA 24 character strengths** ("ai cũng sở hữu đủ 24 điểm mạnh ở mức khác nhau" — trùng khít "ai cũng là viên kim cương"). Chỉ dùng lớp 24, không dùng lớp 6 đức hạnh (tranh cãi học thuật). AI chấm chuyện theo chiều đã chuẩn hoá: agency/communion, redemption/contamination, meaning-making.
6. **Wikipedia có 33 nhánh cấp 1 — quá rộng**; kho nhân loại phải cherry-pick ≤6 nhánh theo use-case phát triển bản thân + kinh doanh.

### 🧠 KHO CÁ NHÂN — 7 cây (tên gợi cảm hứng, mỗi loại trang có cây mặc định)

| # | Cây | Chứa gì | Loại trang rơi vào | Map từ hiện trạng |
|---|---|---|---|---|
| 1 | 📓 **Hành trình của tôi** | Chương đời (2–7 chương user tự đặt tên) + 8 cảnh then chốt (đỉnh cao/vực sâu/bước ngoặt/2 ký ức tuổi thơ/ký ức trưởng thành/trải nghiệm thiêng liêng/khoảnh khắc khôn ngoan) + nhật ký hằng ngày; event_date bắt buộc | 🌱 trải nghiệm · 🌟 sự kiện-mốc | Nhật ký hành trình |
| 2 | 🧭 **La bàn giá trị** | 3–7 giá trị cốt lõi + Kim Chỉ Nam (châm ngôn) + hệ tư tưởng + TẦM NHÌN/kịch bản tương lai (Future Script). Mốc tương lai đạt được → chuyển thành sự kiện bên cây 1. **Cây 1↔2 phải link chặt** — lý thuyết coi quá khứ + tương lai là MỘT câu chuyện | 🎓 bài học · ❓ câu hỏi mở | Giá trị cốt lõi + Kim Chỉ Nam + Mục tiêu 2026 |
| 3 | 💎 **Kim cương bài học** | Insight/ý tưởng/nguyên lý TỰ RÚT; mỗi bài học bắt buộc link `experience` về trải nghiệm gốc ở cây 1 (không có gốc = chưa phải kim cương của mình) | 🎓 bài học · 📋 quy trình cá nhân · ❓ câu hỏi mở | (mới — tách từ notes rải rác) |
| 4 | 🤝 **Vòng tròn quan hệ** | Hồ sơ người: gia đình, đội nhóm, khách hàng, mentor; trạng thái quan hệ + nhu cầu | 👤 hồ sơ | Khách hàng & đội nhóm |
| 5 | 📚 **Tủ nguồn tinh hoa** | Bài học từ NGƯỜI KHÁC: sách/khoá học/video + ghi chú cá nhân; là trạm ÁNH XẠ — trang con trỏ `reference` về kho nhân loại/QNET kèm cảm nhận riêng | 📚 nguồn | (mới) |
| 6 | 🎬 **Xưởng content** | Ý tưởng → nháp → đã đăng (trục 2: blog/video/reel/email/caption/talk); mỗi content link về câu chuyện/bài học gốc — content là ánh xạ, không phải gốc | 📋 quy trình + thẻ trục 2 | Xưởng content + Ý tưởng content (gộp làm cột) |
| 7 | 💰 **Dòng chảy thịnh vượng** | Tài chính cá nhân + kết quả kinh doanh: mốc thu nhập, deal, chi tiêu-đầu tư, mục tiêu tiền. GIỮ CÂY RIÊNG vì với user QNET tiền vừa là mục tiêu vừa là BẰNG CHỨNG kể được (mốc thu nhập = sự kiện-mốc → ánh xạ sang cây 1 làm chuyện transformation) | 🌟 sự kiện-mốc · 📋 quy trình | (mới — theo draft founder) |

Ghi chú trung thực: vị trí cây Tài chính là quyết định founder + đặc thù QNET — các nguồn Wheel of Life/12 life areas không sống sót qua kiểm chứng nên không có hậu thuẫn học thuật; chấp nhận được, theo dõi khi pilot.

### 🌐 KHO QNET — giữ A–F hiện tại + 📐 Chuẩn nội dung (admin-only). Không đổi.

### ♾️ KHO NHÂN LOẠI — 6 nhánh (cherry-pick từ 33 nhánh Wikipedia)

| # | Nhánh | Chứa gì | Loại trang |
|---|---|---|---|
| 1 | 🕰️ **Dòng thời gian nhân loại** | Facts lịch sử theo timeline (event_date) | sự kiện-mốc · nguồn |
| 2 | 🌍 **Thế giới & khoa học** | Địa lý, khoa học tự nhiên, sức khoẻ | nguồn · bài học |
| 3 | 🧘 **Minh triết & triết lý** | Tinh hoa sách, triết lý sống, tôn giáo (Khắc kỷ, Ikigai, Atomic Habits…) | nguồn · bài học · câu hỏi mở |
| 4 | 👥 **Con người & xã hội** | Tâm lý, hành vi, giao tiếp, văn hoá | nguồn · bài học |
| 5 | 📈 **Kinh tế & kinh doanh** | Tư duy tiền bạc, mô hình kinh doanh, lịch sử thương mại | nguồn · quy trình |
| 6 | 🏛️ **Người thầy & vĩ nhân** | Guru, vĩ nhân, tác giả, khoá học (hồ sơ + tư tưởng chính) | hồ sơ · nguồn |

Quy tắc: mỗi cây con = MỘT nguồn/chủ đề (sách = folder, chương = trang con); mọi trang sẵn chiều `reference` để user ánh xạ về Tủ nguồn cá nhân. Không nhận trang lẻ ngoài 6 nhánh.

### 💎 BỘ CÂU HỎI "KHAI THÁC KIM CƯƠNG" (wizard nhiều phiên, mỗi câu trả lời = 1 trang trải nghiệm tự sinh đủ trường 8 chiều)

- **Phiên 1 — Mục lục đời**: "Nếu đời bạn là cuốn sách, mục lục có những chương nào? (2–7 chương, đặt tên + tóm tắt)" → sinh khung chương trong cây Hành trình.
- **Phiên 2 — 8 cảnh then chốt** (mỗi cảnh đúng follow-up chuẩn McAdams: chuyện gì? khi nào, ở đâu? ai liên quan? lúc đó nghĩ gì, cảm gì? → **"cảnh này nói gì về con người bạn?"**): đỉnh cao nhất đời · vực sâu nhất · bước ngoặt · ký ức tuổi thơ đẹp · ký ức tuổi thơ buồn · ký ức trưởng thành sống động · trải nghiệm thiêng liêng · khoảnh khắc khôn ngoan nhất.
- **Phiên 3 — Nghịch cảnh 2 bước** (Pals 2006: bước 1 → tăng trưởng, bước 2 → hạnh phúc): (khám phá) "Thử thách lớn nhất đời bạn? Nó hình thành thế nào, cảm giác ra sao?" → (cam kết) "Bạn đã/đang giải quyết thế nào? Nó cho bạn món quà gì mà người chưa trải qua không có?"
- **Phiên 4 — Tương lai & sợi chỉ đỏ**: "Chương tiếp theo là gì? Dự án đời bạn?" (→ La bàn giá trị) · "Nhìn lại toàn bộ, sợi chỉ đỏ xuyên suốt là gì?" (→ Life Theme).
- **AI gắn nhãn** mỗi chuyện: 24 điểm mạnh VIA + agency/communion + redemption/contamination + meaning-making → gợi ý góc content ("chuyện vực sâu→quà tặng của bạn là chất liệu transformation").
- ⚠️ Caveat: khung redemption mang màu văn hoá Mỹ, nghiên cứu trên mẫu Mỹ — cần thử với user Việt; đào sâu cảnh tiêu cực thiếu điều hướng dễ thành nhai lại tiêu cực (luôn đóng phiên bằng bước cam kết/bài học).

### 🧭 5 NGUYÊN TẮC DẪN DẮT USER (guided onboarding)
1. **Không trang trắng**: mọi trang sinh từ chọn 1 trong 7 loại → loại quyết định form trường bắt buộc (Tana/Capacities model).
2. **Form thay folder**: user trả lời "ai? khi nào? cảm xúc? giá trị?" — hệ thống tự cắm trang vào cây gốc theo loại; user không phải nghĩ "file vào đâu".
3. **Xương sống nhỏ ship sẵn, mở rộng dần**: ship 7 cây cá nhân + 6 nhánh nhân loại cấp 1; KHÔNG tạo sẵn cây con rỗng — nhánh con mọc khi đủ trang (Mental Squeeze Point).
4. **Default values**: trang từ wizard chương đời tự mang chiều time + neo về chương; ghi nhanh tự mang event_date hôm nay.
5. **Câu hỏi rút nghĩa bắt buộc**: mọi form trải nghiệm kết bằng "điều này nói gì về bạn?" — cơ chế Thấm chuyển facts → bản sắc; trang nào cũng vừa có GỐC (cây+loại) vừa có NGHĨA (chiều giá trị).

### Câu hỏi còn mở (theo dõi khi pilot)
1. Tài chính: cây riêng hay nhánh của Hành trình? (chưa có hậu thuẫn học thuật — quyết định founder)
2. Khung redemption với văn hoá Việt/tập thể — có cần thay bằng khung "chấp nhận"?
3. LLM chấm agency/redemption có đạt độ tin cậy như coder người? (chưa có nghiên cứu xác lập)

### Nguồn chính (đã kiểm chứng 3 phiếu)
McAdams, Life Story Interview II (2007, Foley Center/Northwestern — PDF gốc) · McAdams & McLean 2013, Current Directions in Psychological Science · McAdams 2018, Imagination, Cognition & Personality · VIA Institute (viacharacter.org) · Tana docs (supertags) · Capacities docs (object types vs folders) · LYT Kit (MOCs Overview) · Wikipedia Category:Main_topic_classifications (snapshot 2026-06-12, 33 nhánh).

## 3. AUDIT HOME (feedback founder 2026-06-12)

| # | Hiện tại | Vấn đề | Đề xuất |
|---|---|---|---|
| 1 | Tài khoản nằm ở 👤 cuối rail | Home không thấy "mình" | Khối account ngay đầu Home: avatar + tên + vai trò + Qi + streak, bấm mở Profile |
| 2 | ⚡ Nạp dữ liệu & xét duyệt | Dư — Studio đã ở ngay dưới | Bỏ khối; approver thấy 1 dòng "📨 N bài chờ duyệt" trong khối Cần làm |
| 3 | ⏰ Đến hạn ôn (0) | Khối rỗng vẫn chiếm chỗ | Gộp vào **"✅ Hôm nay bạn cần làm"**: bài đến hạn ôn + việc được giao + bài bị trả + (approver) bài chờ duyệt + trang mồ côi cần hoàn thiện. Rỗng → ẩn, thay bằng 1 dòng mời ghi trải nghiệm |
| 4 | 📨 Bài của tôi với ban biên tập | Không rõ chức năng | Tan vào khối Cần làm (bị trả = task "sửa & nộp lại"); trạng thái chờ = 1 dòng status |
| 5 | Cần thẩm thấu (35 bài) | List dài, không dẫn lối | AI/heuristic đề xuất **3 bài** kèm lý do (nối giá trị đang mạnh, cùng campaign, gần event_date) + **resume bài Thấm dở** (lưu tiến độ qua màn/chiều) |
| 6 | Tiếp tục viết | Chưa practical | Lấy từ cột nháp Xưởng, sort theo lần sửa cuối, hiện % đủ trường chuẩn, bấm vào đúng chỗ dừng |
| 7 | 📐 Sửa template trong Studio | Lẫn vai admin vào luồng user | Chuyển thành trang "📐 Chuẩn nội dung" trong khu quản trị (xem §2 QNET) |
| 8 | Lịch sử nộp chỉ icon | Khó quét mắt | Pill màu: ✅ emerald đã duyệt · ⏳ amber chờ · 🔁 đỏ trả lại (kèm lý do) · 📝 zinc nháp + filter |
| 9 | Giao việc rời rạc | Không gắn vật | Assignment gắn `node_id` + loại việc (viết/sửa/duyệt/thấm) + hạn; vòng đời giao→nhận→nộp→nghiệm thu; hiện trong khối Cần làm của người nhận; xong tự ghi event + Qi |

## 4. Thứ tự làm (không phình tính năng — khớp DECISIONS §A11)
- **P0 (dọn + gom)**: Home gộp khối "Cần làm" + bỏ 2 khối dư + account lên Home · gác cổng publish · map 6 hub vào 7 cây + xoá 5 trang rác + dọn "Xưởng content" lạc kho nhân loại · chốt lại `cau-hoi-mo` vs `ghi-chu` (sửa DECISIONS hoặc PageFrame).
- **P1**: đề xuất Thấm heuristic + resume Thấm dở · Tiếp tục viết theo Xưởng · 📐 trang admin · pill màu lịch sử · giao việc gắn node.
- **P2**: job dọn kho tuần · migration phân loại 85 trang cũ (AI khi cắm API) · "Thấm cùng AI".
