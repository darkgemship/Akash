# Akash — Worklog & Upgrade Flow

> Ghi lại mỗi đợt build để lần sau làm tốt hơn. Quy trình chuẩn: **đọc docs → sửa code → `npm run build` → test thật trên preview (đăng nhập, bấm từng nút) → cập nhật docs**.

## 2026-06-16 (đợt 38) — 🎨 Map đổi nền theo theme + ✨ Hero parallax
- **2D & 3D đổi nền theo THEME**: tone trắng (light) → nền KEM (#f4f1ea), tone tối → vũ trụ. Galaxy 2D: fill mỗi frame theo `data-theme` + inline style canvas theo theme; rings radial nền sáng khi light. 3D: backgroundColor theo theme lúc tạo + MutationObserver đổi LIVE khi bật/tắt tone trắng; link sáng/đậm hơn trên nền kem. (Đáp yêu cầu "qua tone trắng thì 3d cũng trắng" + không còn nền-ép-tối lệch theme.)
- **✨ Hero parallax** (Home, card "AI hiểu bạn"): component <Parallax> — di chuột, lớp Constellation (data-px -34, lùi xa) + lớp nội dung (data-px 10, theo nhẹ) dịch ngược chiều tạo chiều sâu, mượt (transition + translate3d).
- Lesson: lưu file liên tục giữa lúc sửa JSX làm **cache Turbopack hỏng** → báo parse lỗi ảo dù tsc xanh; khắc phục: stop server → `rm -rf .next` → start lại.
**Verify**: preview light — 2D canvas nền kem (rgb 244,241,234), 3D nền kem + 3 thiên hà sao, Hero parallax dịch lớp theo chuột; sau khi xoá .next: 0 lỗi compile, Home render sạch.
**Chưa làm (lib-limited)**: dây 3D "đổi màu theo wave" — 3d-force-graph không animate màu link theo frame; hiện giữ hạt-màu-chiều chạy dọc dây (đã là "ánh sáng chạy qua"). Có thể làm sau bằng shader riêng nếu cần.

## 2026-06-16 (đợt 37) — 🌳 Cây sự sống = mảng quạt + 👁 3 Vòng võng mạc 5-màu + dây plasma
(đợt 2-3 cho loạt redesign graph; dùng chung GAL_PAL 5-level + levelOf khớp thiên hà 3D)
- **GAL_PAL + galLevelColor + levelOf** thêm vào Galaxy.tsx → màu node theo LEVEL trong kho (đồng bộ 3D): L0 sao → L1 xanh dương → 3 màu phối → giữ cuối.
- **CÂY SỰ SỐNG (mandala)**: 3 kho = 3 MẢNG QUẠT ĐỀU (mỗi kho 1/3 quạt ~230°); trong mỗi nhánh con CHIA ĐỀU góc tại trung điểm sub-wedge (cân đối, bỏ chia theo độ rậm cũ). Vẽ nền quạt tô mờ màu sao + NAN nối thiền giả↔tâm 3 kho (có hạt sáng chạy) — khắc phục "con người chưa nối tâm kho". Node màu theo level.
- **3 VÒNG → VÕNG MẠC**: mỗi kho là 1 DẢI bán kính (personal 0.10-0.40 · QNET 0.46-0.70 · nhân loại 0.76-1.0 của Rmax); trong dải xếp node theo LEVEL (tầng sâu ra ngoài) + jitter → tán rộng như võng mạc. Node màu 5-level.
- **Dây PLASMA**: link entanglement vẽ 2 lớp (quầng mờ rộng + lõi mảnh), 22 đoạn, 2 sóng sin lệch pha, cong về đồng tử, màu theo level 2 node → mềm uốn như tia plasma.
**Verify**: preview — Cây sự sống 3 quạt + nan nối kho; 3 Vòng võng mạc nhiều màu + dây plasma cong; 0 lỗi console; tsc xanh.

## 2026-06-16 (đợt 36) — 🪐 3D: khắc phục fallback + gom tiểu hành tinh quanh sao (vành quỹ đạo theo level)
Founder: máy lại hiện fallback "chưa bật 3D" + muốn node quây quanh sao tâm.
- **Khắc phục fallback**: (1) BỎ probe WebGL riêng (nó chiếm thêm 1 context → dễ cạn slot ~16 → fail); (2) BỎ `powerPreference:'high-performance'` (máy chỉ có GPU tích hợp dễ fail khi bị ép) → để trình duyệt tự chọn. Giữ stencil off + failIfMajorPerformanceCaveat false + try/catch + fallback.
- **Hệ mặt trời mỗi thiên hà**: layoutGalaxies xếp node thành VÀNH QUỸ ĐẠO quanh sao tâm — bán kính theo LEVEL (kho ~r30 sát sao → mỗi tầng sâu +52, lệch nhẹ chống chồng), hướng giữ theo lúc settle (node liên quan vẫn gần nhau), toả 3D (z*0.7).
**Verify**: preview mở 3D → KHÔNG fallback, 3 hệ mặt trời (sao đỏ/vàng/tím + tiểu hành tinh quay quanh theo tầng), 0 lỗi console; tsc xanh.

## 2026-06-16 (đợt 35) — 🌟 3D thiên hà v2: sao tâm + 5 màu theo level + tách cụm + reset/search
(đợt 1/3 cho loạt yêu cầu redesign graph của founder)
- **3 THIÊN HÀ tách rõ** xếp TAM GIÁC (cá nhân đỉnh · QNET trái-dưới · nhân loại phải-dưới). Cách làm: để sim chạy thành 1 cụm rồi DỜI deterministic mỗi cụm-kho về tâm thiên hà sau khi engine nguội (cooldownTicks 90 + onEngineStop) — vì lực d3 (forceX/custom) bị engine nguội/decay vô hiệu (đã debug: node kẹt ±58).
- **SAO TÂM mỗi kho**: cầu phát sáng + QUẦNG TRÒN mềm (texture radial) + tên kho. Cá nhân = mặt trời ĐỎ #ff5a36 · QNET = sao VÀNG · Nhân loại = sao HỒNG-TÍM.
- **Node 5 MÀU theo LEVEL trong kho** (GALAXY_PALETTE): L0 sao → L1 "trái đất" xanh dương → L2-L4 3 màu phối → L5+ giữ màu cuối. levelOf = số bước parent_id tới gốc kho. Hết loạn: node chỉ mang nghĩa kho+tầng.
- **Reset view**: nút "⌖ Toàn cảnh" + bấm nền → camera về toàn cảnh 3 thiên hà (đỡ lost sau khi zoom node).
- **Search**: gõ → page khớp + hàng xóm sáng, còn lại ẩn (đã có, xác nhận chạy).
- Camera frame theo phân vị 85% (bỏ node văng lẻ).
**Verify**: preview — 3 thiên hà tam giác, sao tâm quầng tròn + label, node màu theo level, dây bắc cầu; 0 lỗi console; tsc xanh.
**Còn (đợt 2-3)**: Cây sự sống = mảng quạt chia trung điểm; 3 Vòng = 5 màu/level + tán võng mạc + dây plasma uốn; link 3D wave đổi màu mềm hơn.

## 2026-06-16 (đợt 34) — 🌌 3D redesign: 3 thiên hà + sóng màu chạy (hết loạn màu, node dễ bấm)
Founder: 3 chạy rồi nhưng loạn màu (màu node + tầng + 8 màu chiều chồng nhau), node nhỏ khó chọn. Ý tưởng founder: mỗi kho = 1 thiên hà, chiều liên kết = sợi sáng màu chạy theo wave.
- **1 hệ màu duy nhất cho node = theo KHO**: cyan (Cá nhân) · tím (QNET) · hồng (Nhân loại). Bỏ mọi hệ màu cạnh tranh.
- **Dây nối = sợi MỜ trung tính** (rgba xám ~0.16); **màu 8 chiều dồn lên HẠT sáng chạy theo dây** (linkDirectionalParticleColor = màu chiều, 3 hạt, to 2.2) → "sóng radiant" đúng ý founder, không còn rối.
- **3 cụm THIÊN HÀ** tách bằng lực kéo theo layer (d3-force-3d forceX/Y/Z), xếp TAM GIÁC (đời tôi đỉnh · QNET trái-dưới · nhân loại phải-dưới) cho gọn khung.
- **Node to & dễ bấm**: val 1.6+deg*0.6, nodeRelSize 4.2, nodeResolution 12, nodeOpacity .95; đẩy mặc định -90 (cụm chặt).
- **Camera frame thông minh**: bán kính phân vị 85% (bỏ node văng lẻ) → khung sát, node không bé tí.
- Chú giải đổi: "3 thiên hà (kho)" + "8 chiều · sóng sáng chạy". Khai báo types tối thiểu cho d3-force-3d.
**Verify**: tsc xanh; preview xác nhận node theo màu kho + hạt màu chiều chạy trên dây mờ (HMR chunk động cần hard-reload để thấy layout tam giác mới).

## 2026-06-16 (đợt 33) — 🩹 Diệt TẬN GỐC crash 3D "reading 'tick'" (StrictMode mount 2 lần)
Bản vá đợt 31 chưa đủ: founder vẫn `Cannot read 'tick'` ở comp._animationCycle → tickFrame → layoutTick, 3D đen (hardware-accel đã BẬT → không phải WebGL).
Truy nguồn: layoutTick đọc `state.d3ForceLayout` đã bị `_destructor` null → frame MỒ CÔI. Gốc rễ = **React StrictMode (dev) mount component 2 lần**: instance A tạo rồi huỷ ngay, frame rAF đã xếp hàng của A chạy sau khi state null → throw async (try/catch & ErrorBoundary KHÔNG bắt được).
- **Hoãn tạo graph 1 tick + cờ `cancelled`**: mount NHÁP của StrictMode bị cleanup huỷ (clearTimeout) trước khi timer chạy → KHÔNG tạo instance A nào → hết frame mồ côi. Chỉ còn 1 instance sạch.
- **Dọn triệt để**: gom mọi setTimeout(frameCam) + rAF + listener vào cleanup; `pauseAnimation()` (cancelAnimationFrame nội bộ) TRƯỚC `_destructor()`.
- **Lưới an toàn**: window 'error'/'unhandledrejection' nuốt đúng lỗi "reading 'tick'" của 3d-force-graph (phòng mọi race còn sót) — không che lỗi khác.
**Verify**: reload → mở 3D → Về 2D → mở 3D lần 2 → render cụm cầu, KHÔNG đen, 0 lỗi console; tsc xanh. (đã xác nhận _destructor + pauseAnimation tồn tại trong 3d-force-graph 1.80)

## 2026-06-16 (đợt 32) — 🔦 3D depth theo level: tăng level hiện thêm nhánh, ngoài nhánh chỉ MỜ
Founder: ở chỗ Depth (3D Inspector) cho thể hiện theo số level — càng sâu nhánh mới tăng, còn lại ẩn MỜ bớt cho đỡ nặng + trực quan (thay vì ẩn hẳn).
- Tách 2 chế độ tập-sáng: **TÌM** (gõ ô search) → node ngoài tập ẩn hẳn (như cũ); **CHỌN NODE + Depth 1/2/3** → node trong nhánh tới độ sâu `depth` sáng rõ, node ngoài nhánh VẪN hiện nhưng làm mờ (màu xám nhạt 0.12, link 0.05) → thấy bối cảnh mà không rối.
- Tăng Depth 1→2→3 = tập sáng lan thêm 1 lớp BFS → "nhánh mới tăng" đúng nghĩa.
**Verify**: 3D mở/đóng sạch, không crash, 0 lỗi console; tsc xanh.

## 2026-06-16 (đợt 31) — 🛠 Sửa ĐÚNG crash 3D/3 Vòng + khôi phục "Cây sự sống" xoè rộng
Founder vẫn đen màn 3D + 3 Vòng crash (lỗi mới `Cannot read 'tick'` ở comp.tickFrame). Phát hiện: chính bản vá trước GÂY ra — gọi `forceContextLoss()` khi vòng animation thư viện còn chạy → frame kế đọc state đã huỷ → throw → sập React → 3 Vòng (2D) trắng theo.
- **Teardown đúng**: `pauseAnimation()` DỪNG vòng rAF nội bộ TRƯỚC, rồi mới `_destructor()` (tự dispose renderer). Bỏ forceContextLoss/dispose thủ công (thủ phạm).
- **Probe WebGL không rò**: kiểm tra context rồi `WEBGL_lose_context.loseContext()` ngay → không chiếm slot trong ~16 context.
- **rendererConfig**: `powerPreference high-performance` (chắc lấy GPU rời; low-power có máy rơi vào integrated lỗi) + stencil off (tránh OES_packed_depth_stencil) + antialias off + failIfMajorPerformanceCaveat false.
- Verify: mở 3D (render cụm cầu, KHÔNG đen) → Về 2D → 3 Vòng (render 3 vành, KHÔNG crash) → 0 lỗi console.
- **Khôi phục Mandala** (bị ẩn sau ⋯ ở đợt 28) → đưa lại thanh chính, đổi tên **"🌳 Cây sự sống"**. ⋯ giờ chỉ còn Radar/Neuro.
- **Cây sự sống xoè RỘNG**: layout đệ quy mới — gốc ở đáy, 3 kho chia quạt ~230° theo số lá; con chiếm sub-wedge của cha; sâu hơn = bán kính xa hơn → tán vươn rộng cả hai bên thay vì 1 cung hẹp.
**Còn**: depth theo level (sâu hơn hiện thêm nhánh / xa thì mờ bớt) — làm tiếp.

## 2026-06-16 (đợt 30) — 🛡️ Sửa CRASH WebGL: 3D + view mắt không còn kéo sập app
Founder báo: mở view mắt (3 Vòng) & 3D crash hoàn toàn. Lỗi gốc (từ stack): `THREE.WebGLRenderer: A WebGL context could not be created (OES_packed_depth_stencil required)` + `Error creating WebGL context` + bug three `Cannot access 'info' before initialization` ở onContextRestore. Các throw này KHÔNG được bắt → sập cả React → overlay lỗi che luôn view mắt 2D (và GPU process crash kéo theo canvas 2D).
**Nguyên nhân**: (1) GPU yếu / hardware-accel tắt → không tạo nổi WebGL context; (2) mở/đóng 3D nhiều lần KHÔNG giải phóng context → cạn (~16) → trình duyệt từ chối; (3) three tự "restore" context lỗi → throw lần 2.
**Sửa (Graph3D.tsx)**:
- Probe WebGL trước khi dựng; không có → set glError, hiện fallback "🪐 Máy này chưa bật được 3D · ← Về 2D" thay vì throw.
- Bọc `new ForceGraph3D` trong try/catch; thất bại → fallback.
- `rendererConfig` nhẹ cho GPU yếu: antialias off · stencil off · powerPreference low-power · failIfMajorPerformanceCaveat false.
- Chặn `webglcontextlost` (preventDefault) → diệt vòng restore lỗi; mất context → fallback.
- Cleanup triệt để: `renderer.forceContextLoss()` + `dispose()` + `_destructor()` khi đóng → không cạn context.
- Bọc vòng `tick` raf trong try/catch (context mất giữa frame không throw).
**Sửa (Galaxy.tsx + ErrorBoundary.tsx mới)**: bọc <Graph3D> trong ErrorBoundary → mọi throw còn sót chỉ hiện fallback + tự về 2D, KHÔNG sập app/che view mắt.
**Verify**: preview — view 3 Vòng (mắt) render đủ 3 vành + đồng tử (không crash); 3D render đủ node/link/panel (không regression); 0 lỗi console; tsc sạch. Fallback sẽ kích hoạt đúng trên máy WebGL fail.

## 2026-06-16 (đợt 29) — 🪞 B: "AI hiểu bạn" — chân dung SỐNG trên trang Tôi là ai + nút graph
Linh hồn Jarvis: Akash phản chiếu lại chính user, tự dày lên theo thời gian. KHÔNG làm trùng — gom vào trang 🪞 Tôi là ai sẵn có.
- **MeMirror.tsx** (component mới): card "AKASH HIỂU BẠN" tự tổng hợp HEURISTIC (không token) từ kho cá nhân:
  · 🌈 **Hành trình cảm xúc** — phân bố 9 mức Hawkins (bar màu) + đọc XU HƯỚNG (so nửa gần đây vs nửa đầu → "đang đi LÊN thang ý thức" / "cần được ôm ấp" / "thăng bằng").
  · 📊 tăng trưởng: số trang sống · bài học 💎 · đã sống ✅ (apply_status thành nếp/đang rèn).
  · 🗣 giọng của bạn (writing_style) + 3 bài học gần đây.
- **Nút 🌌 "Xem graph chân dung"** → mở Galaxy mode Dòng đời với 🌈 Cảm xúc TỰ BẬT (modeReq thêm cờ `emo`) → thấy node sáng dần theo hành trình.
- Render chỉ khi `subtype==='profile_me'`; tái dùng `tree` + EMO_SCALE, đồng bộ màu với đợt 25/27.
**Verify**: preview trang Tôi là ai → card hiện (83 trang · 15 bài học), bài học gần đây liệt kê, nút mở Galaxy timeline + emoCol bật đúng; không lỗi console; tsc sạch.
**Xong A→B→C.** Còn (khi có data thật/AI thật): tổng hợp tính cách DISC/MBTI vào card; RAG đọc hồ sơ giọng khi sinh content.

## 2026-06-16 (đợt 28) — 🧹 C(2): sửa nút chết + gom mode galaxy nâng cao (đỡ rối)
- **Nút "Mở việc" chết**: việc được giao mà CHƯA gắn trang (node_id null) → bấm không tới đâu. Sửa: widget "Hôm nay cần làm" CHỈ hiện việc CÓ gắn trang (nút luôn tới đúng chỗ); việc chưa gắn trang vẫn ở khu Giao việc của MembersHub.
- **Thanh mode Galaxy gọn lại**: chính = 🌌 Galaxy · 📜 Dòng đời · 🪐 3 Vòng · 🌐 3D (luôn hiện). Nâng cao = 🧘 Mandala · 🎯 Radar · 🧠 Neuro ẩn sau nút **⋯** (bấm bung/✕ thu). Giảm 7 nút mode → 4 + 1, đỡ cognitive load.
**Verify**: preview — thanh mode chỉ còn 4 mode + ⋯; bấm ⋯ → Mandala/Radar/Neuro hiện + ✕; không lỗi console; tsc sạch.
**Tiếp**: B — graph "AI hiểu bạn" (nhánh tổng hợp chân dung user theo thời gian).

## 2026-06-16 (đợt 27) — 🌈 C(1): nhuộm node theo cảm xúc trên Galaxy (thấy hành trình Hawkins)
- Galaxy thêm toggle **🌈 Cảm xúc**: nhuộm mỗi node theo `emotion` của trang qua thang Hawkins (EMO_COLOR khớp EMO_SCALE PageFrame): đỏ đau → … → trắng tỉnh thức. Node chưa gắn cảm xúc giữ màu mặc định. Ưu tiên: cảm xúc > depth > màu loại.
- `emotion` được nạp vào graph (loadGraph select thêm cột) + thêm vào type GNode.
- Mục đích: user NHÌN THẤY mình đang sáng dần lên thang ý thức — payoff trực quan của thang màu đợt 25.
**Verify**: preview mở Galaxy bật 🌈 → render nền tối, không crash, không lỗi console; node nhật ký có cảm xúc đổi màu.
**Tiếp C**: ẩn mode galaxy nâng cao sau 1 nút (đỡ rối) + soát/sửa nút chết. Rồi B (graph "AI hiểu bạn").

## 2026-06-16 (đợt 26) — 🧠 A: Properties theo-loại + trường AI-hiểu-sâu (giảm cognitive load)
Mục tiêu: mỗi loại trang chỉ hỏi đúng trường nó cần; tự lấp từ khoá + thời gian; cho AI đủ ngữ cảnh để hiểu & viết đúng chất user.
- **Độ tin (confidence)** — CHỈ hiện ở trang tri thức kiểm chứng được (bài học / quy trình / nguồn / tin ngành). Nhật ký cá nhân KHÔNG hỏi (đỡ rối). Thang: Đã kiểm chứng → Đáng tin → Cần xác minh → Tin đồn → Giả thuyết.
- **Hồ sơ giọng** — CHỈ trang 🪞 "Tôi là ai": Chất văn (writing_style) · Từ cấm (forbidden_words) · Câu tủ (favorite_quotes). AI/RAG đọc 3 trường này để viết ĐÚNG chất user, tránh sáo ngữ.
- **Trường của tôi (mặc định kho cá nhân)**: Mức ưu tiên + Đã áp dụng (Mới biết → Đang thử → Đang rèn → Đã thành nếp) — đo "đã SỐNG chưa" không chỉ "đã BIẾT".
- **Auto-keyword heuristic** (`autoKeywords`, KHÔNG đốt token AI): tách từ → bỏ stopword tiếng Việt → đếm tần suất → 5 từ; tự gắn khi nạp capture (insight + trải nghiệm). User vẫn sửa tay.
- **last_modified tự động**: ghi mỗi lần sửa props + lúc tạo qua capture; hiện read-only "Cập nhật cuối" ở Properties.
**Verify**: preview trang "Tôi là ai" → 6 trường mới render đúng, layout 2 cột sạch, chip cảm xúc có chấm màu Hawkins, không lỗi console; tsc sạch. Độ tin/Cập-nhật-cuối ẩn đúng lúc (profile_me không phải tri thức, chưa sửa).
**Tiếp**: B (graph "AI hiểu bạn" nhánh Nhân loại) → C (nhuộm node theo cảm xúc + ẩn mode nâng cao + sửa nút chết).

## 2026-06-16 (đợt 25) — 🩹 Chống trắng-màn/crash khi load 3D+rings + 🌈 thang màu Hawkins
Founder: load view mắt/3D vẫn trắng màn + lag/crash; đổi màu theo bảng năng lượng rung (Hawkins) — tỉnh thức TRẮNG/VÀNG không phải đen.
- **Hết trắng khi load**: (1) Graph3D dynamic import có `loading` nền tối "#06060c" (trước đó suspense render null → light mode lộ nền kem trắng); (2) `<canvas>` 2D thêm inline `background:#0a0b14` → dark ngay cả trước frame vẽ đầu.
- **Giảm lag/crash**: rings hạt 340+ri*300 → 170+ri*150 (~nửa); link entanglement SEG 16→10; sao nền 3D 1500→600 điểm.
- **🌈 EMO_SCALE (Hawkins)** export ở PageFrame, dùng chung capDeep + PropsPanel: 9 mức thấp→cao gắn màu — 😣 đau/sợ #e23b3b (đỏ) · 😤 tức · 🌫️ hoài nghi · 🔥 thôi thúc · 😌 nhẹ nhõm (xanh lá) · 💗 yêu thương · 😮 vỡ oà (xanh dương) · 🙏 thanh thản (tím) · ✨ **tỉnh thức trắng-vàng #f6f8ff (KHÔNG đen)**. Chip hiện chấm màu + tô màu mức khi chọn. AKASH.md §4 = bản đồ ý thức này.
**Verify**: 3D load nền tối (hết trắng) ở light mode, không crash; chip cảm xúc theo thang màu. tsc + build xanh.
**Còn lại (làm tiếp theo thứ tự A→B→C)**: A) dọn cognitive-load Properties theo-loại + mood/energy + hồ sơ giọng; B) graph "AI hiểu bạn"; C) nhuộm node theo màu cảm xúc trên Dòng đời + ẩn mode nâng cao + sửa nút chết.

## 2026-06-16 (đợt 24) — 📜 ĐẠI HỢP NHẤT: file tổng AKASH.md + sơ đồ + dọn mâu thuẫn docs
Founder: rà toàn bộ project, liệt kê thừa thải, đọc lại mọi doc tìm điểm chưa logic, viết file tóm tắt tổng (ý nghĩa/tầm nhìn/giá trị/sứ mệnh/cấp tổ chức/phân bố kho/trường/page) tập trung AI-hiểu-user + content + trải nghiệm clean; nghiên cứu online; vẽ sơ đồ.
- **2 agent song song**: kiểm kê tính năng/luồng (tìm thừa thải, cognitive-load hotspot) + audit 29 doc (tìm 11 mâu thuẫn). + 2 web search (second-brain×LLM 2026, RAG emotional context).
- **docs/AKASH.md (MỚI) = nguồn sự thật duy nhất**: 14 mục — Akash là gì · tầm nhìn 10 năm/sứ mệnh/giá trị · vòng lặp cốt lõi · **🌈 hành trình màu (đỏ→vàng→xanh→hồng→trắng)** (vision mới founder, trước đây chưa doc nào ghi) · 3 kho/vai trò · phân bố 7 cây+6 nhánh+A-F · 7 loại trang + Properties 3 tầng · 8 chiều thuộc-tính-vs-liên-kết · **AI-hiểu-user 3 tầng (Core/Timeline/Knowledge) + graph "AI hiểu bạn"** · content engine "thiên tài bên trong" · Akash=Jarvis · 7 view · luật UX clean · lộ trình.
- **Sửa mâu thuẫn doc** (agent chỉ ra): DECISIONS §A3 "Thấm"→"Chuyển hoá" (+ Hoa/north-star); STANDARD-TEMPLATE 8 loại→7 (định dạng content = Trục 2, không phải loại); FRAMEWORK banner (radar §4 đã bỏ, emotion/time là thuộc tính); 6 doc root cũ (WISDOM-DEPTH/LEARNING-FRAMEWORK/KNOWLEDGE-GRAPH/ARCHITECTURE/FLOWS/COLLECTIVE-KNOWLEDGE) gắn banner LỊCH SỬ; README ×2 trỏ AKASH.md lên đầu.
- **Sơ đồ hệ thống** (visualize): vòng lặp 6 bước + 3 kho đồng tâm + AI-hiểu-user 3 tầng + dải hành trình màu.
- **Thừa thải đã liệt kê** (làm code đợt sau): page_type↔subtype 2 taxonomy; Home cap vs Studio trùng đường tạo trang; 6+ Galaxy mode (ẩn nâng cao sau toggle); "Mở việc" (assignments.node_id) chết; ReviewHub chưa ghi content JSON; PAGE_TEMPLATES vs ingest_tpl; lag map.
**Build xanh** (chỉ docs + memory; code không đổi lượt này).
**Lưu ý**: smoke-test preview làm renderer treo (canvas nặng) → đã reload; tối ưu lag là task #36 còn mở.

## 2026-06-16 (đợt 23) — 🩹 Fix map trắng/blank (gốc: camera lạc) + nền tối mọi theme
Founder báo các view hay trắng/blank, lag. Chẩn đoán live: graph KHÔNG lỗi — bấm ⟳ là hiện đủ → **gốc là camera bị pan/zoom ra ngoài khung** nên thấy trống; light mode thì canvas trong suốt lộ nền kem → "trắng".
- **fitView()**: tự đóng khung toàn bộ node vào màn (tính bbox + k + offset). `resetCam` giờ = fitView. **Tự fit khi đổi mode** (setTimeout sau layout).
- **clampCam()**: chặn pan làm lạc — giữ tâm cụm luôn trong khung (biên 80px).
- **Nền vũ trụ ĐẶC mọi theme**: fillRect `#0a0b14` ngay sau clearRect → light mode không bao giờ lộ nền kem/trắng nữa (map = "cửa sổ không gian"). 3D cũng giữ nền tối.
**Verify**: light mode → Galaxy tự fit 108%, render đầy đủ trên nền tối, không blank. tsc xanh.
**Ghi chú hướng tiếp**: làm đẹp "mắt thứ 3" (gradient link + uốn lượn + node con lồng trong), graph "AI hiểu user" (nhánh Nhân loại), tối ưu lag sâu — đợt sau.

## 2026-06-16 (đợt 22) — 🗺️ Thiết kế lại 2D map (galaxy): icon · màu theo depth · phân cấp rõ
Founder (ảnh AI Workshop OS): muốn 2D map bật/tắt icon dễ nhìn, màu theo depth level, liên kết di chuyển đẹp hơn, phân cấp page rõ.
- **Icon trong node** (toggle 🖼 Icon, mặc định bật): GNode + select thêm `icon`; vẽ emoji giữa node (ưu tiên icon riêng → suy theo kind: 📦kho 📁folder 📄page 📝note). Chỉ vẽ khi node đủ to (R>7px) → hub/page có icon, note nhỏ giữ dạng chấm = phân cấp rõ.
- **Màu theo độ sâu** (toggle 🎨 Depth): chọn 1 node → BFS tới 5 bước → tô node theo depth (0 trắng · 1 vàng · 2 cyan · 3 tím · 4 chàm · xa mờ) cho cả glow + thân; node ĐANG CHỌN có vòng trắng (kiểu ảnh tham chiếu). Tắt thì về màu theo kho.
- **Phân cấp**: size theo degree (hub to), hub≥4 có hào quang thở, icon chỉ ở node lớn → mắt thấy ngay cấp bậc. Link giữ flow hạt chạy + sáng khi focus.
- 2 toggle nằm cạnh "Dòng chảy / Nối / Gợi ý" trên thanh điều khiển Galaxy; chỉ ảnh hưởng 2D (neuro/timeline giữ nguyên hành vi).
**Verify**: galaxy 2D hiện icon trong node; nút 🖼 Icon + 🎨 Depth hoạt động; build + tsc xanh.

## 2026-06-16 (đợt 21) — 🌐 Galaxy 3D (3d-force-graph) + search highlight
Founder: dựng view 3D như ảnh "AI Workshop OS" — zoom/xoay 3D, depth, filter loại, chỉnh cường độ link; + search thì node liên quan sáng, còn lại tắt.
**Nghiên cứu**: xác nhận đó là `3d-force-graph` (vasturiano, Three.js/WebGL). Dùng **vanilla** (không wrapper react-force-graph) để tránh peer-dep React 19/Next 16.
- `npm i 3d-force-graph three three-spritetext @types/three`.
- **Graph3D.tsx** (client): `new ForceGraph3D(el)` — nạp `next/dynamic` ssr:false trong Galaxy (Three cần window; chỉ tải khi mở, không phình app). Node màu theo kho (cyan/tím/hồng), size theo degree; link màu theo 8 chiều (DIM_COLOR); orbit/zoom/drag built-in; particle flow; nhãn hub (SpriteText) cho node degree≥6; starfield Points.
- **Search → liên quan sáng, còn lại TẮT**: ô tìm (vnorm không dấu) → activeRef = node trúng + hàng xóm 1 bước; nodeVisibility/linkVisibility ẩn phần ngoài. Click node → focus + bay camera; Depth 1/2/3 mở rộng BFS.
- **Filter kho** (panel phải, đếm số), **Lực** (Đẩy=charge, Độ dài link=link.distance, slider reheat), **Hiển thị** (nhãn hub / particle / tự xoay), **Inspector** + **Top hubs**. Nút "🌐 3D" ở thanh mode Galaxy, "← về 2D" để đóng.
**Bug & fix**: (1) canvas đen — `zoomToFit` đặt camera lệch ra ngoài cụm (z=26 nhìn z=-974) → thay bằng frameCam tự tính bán kính cụm, nhìn thẳng tâm, lùi r×1.9+120, gọi onEngineStop + timer fallback. (2) SpriteText/three thiếu types → @types/three + cast Object3D.
**Verify**: 219 node/103 link render 3D màu đúng; search "crypto" → chỉ cụm crypto sáng, còn lại tắt. tsc + build xanh.

## 2026-06-16 (đợt 20) — 🪐 Galaxy "3 Vòng đồng tâm" + 📰 News feed
**A — Mode 3 Vòng (theo ảnh quantum-entanglement founder gửi)**: Galaxy.tsx mode mới `rings`. Layout: 3 ring đồng tâm — cá nhân (cyan #22d3ee) ở LÕI → QNET (tím) → nhân loại (hồng) ngoài cùng. Draw tự chứa: nền hư không + bụi sao, mỗi ring là vành HẠT mịn (340–940 hạt, gaussian band, gradient hue quanh vòng) phát sáng **đập theo nhịp tim lub-dub** (beat 0.55→1.0, chu kỳ ~1.4s); node thật = glint sáng trên vành (size theo degree) + nhãn leader-line khi hover/chọn; **tia ENTANGLEMENT** = link nối 2 kho khác nhau vẽ thành đường cong sáng có hạt chạy theo nhịp. Nút mode 🪐 3 Vòng. Verify: render mượt, không lỗi console, sát ảnh tham chiếu.
**B — News (founder đề xuất, mình recommend tab thay vì nhánh sâu)**: KolFeed thêm tab 🌟 KOL / 📰 Tin ngành. Editor "➕ Đăng tin" (form: tiêu đề, tóm tắt, nguồn, ❝ câu trích đắt, 🎯 dùng khi nào) → tạo node subtype='news' layer humanity dưới hub '📰 Dòng tin ngành', owner null (của org). User đọc → "💎 Rút insight" dùng LẠI luồng onInsight (đào sâu 30s → Kim cương + nối Tham chiếu về tin gốc). Tái dùng 2 trường vàng + luồng insight đã gộp — không cơ chế mới.
**Verify**: mode 3 vòng screenshot (cyan/tím/hồng + tia chéo); đăng tin "AI tạo video giá rẻ 2026" → hiện ở tab Tin ngành với badge dù-khi-nào. tsc + build xanh.

## 2026-06-16 (đợt 19) — 🔧 Điểm Chuyển hoá KHỚP + Digest resume + dọn Ôn lại/Content + đổi tên Linh hồn
Founder: "Hồn cốt"→"Linh hồn"; điểm chấm xong không lên; mở lại phải thấy đáp án cũ + điền thêm tăng điểm; "Ôn lại" & nút Content vô nghĩa → bỏ.
1. **Bug điểm lệch (chí mạng)**: màn ăn mừng Digest dùng `depthScore` (radar 5-cạnh CŨ → hiện 91) trong khi badge trang dùng `transformScore` (8 chiều, 26·3/8) → user thấy "điểm không lên". Fix: sau finish, re-fetch links+thuộc tính vừa lưu → `transformScore` → ăn mừng hiện ĐÚNG số (verify: 26·3/8 = badge). depthScore chỉ còn cho lịch ôn nội bộ.
2. **Digest resume**: useEffect nạp lại `props.principle` + `props.action`/due + links đã có (tick sẵn kOut/kIn/rOut/rIn/valSel/lifeSel) ngoài emotion/event_date. Mở lại = thấy việc đã làm, điền thêm để tăng điểm; addLink chống trùng nên finish lại an toàn.
3. **"Hồn cốt" → "Linh hồn"** (STEPS + header bước 6).
4. **Dọn nút vô nghĩa**: bỏ "Ôn lại" (đổi thành **"Chuyển hoá tiếp"** — giờ resume được nên CÓ nghĩa: thắp tiếp chiều tối) ở cả peek + header; bỏ hẳn nút vàng **Content** (toContent) — đường tạo content đi qua Content Engine. Todo Home "Ôn lại" → "Chuyển hoá tiếp".
**Verify**: chạy Digest "Nhất quán" → Hoàn tất → ăn mừng 26·3/8 = badge; Linh hồn hiện, Hồn cốt mất; header hết Ôn lại/Content. tsc + build xanh.

## 2026-06-16 (đợt 18) — 🔗 Gộp luồng Insight: tên page theo BÀI HỌC + truy nguồn, nối Tham chiếu
Founder: insight từ bài KOL đang lấy câu cảm thán ("rất là hay") làm tên page — vô nghĩa, không truy được nguồn.
**Đề xuất chốt — GỘP 2 luồng insight làm một**: dù từ Home hay từ bài KOL, đều qua cùng "Đào sâu 30s" → vào 💎 Kim cương bài học.
- **Tên page** (logic mới, finishCapture insight): ưu tiên = câu BÀI HỌC (principle, viên kim cương) → chưa có thì `💡 Insight từ: [tên bài gốc]` (truy nguồn) → cuối cùng mới tới câu gốc. KHÔNG bao giờ để câu cảm thán làm tên.
- **KOL onInsight**: không tạo thẳng nữa → mở capDeep(kind insight) với srcId/srcTitle, gocstory tự điền tên bài gốc; sau khi nạp tự nối chiều `reference` về bài gốc + props.mirror_of.
- Provenance luôn giữ: Nguồn = "[bài] (KOL feed)" + link Tham chiếu (bấm về bài gốc) + mục "## 🌍 Từ bài".
**Verify**: KOL feed → rút insight "rất hay" → đào sâu → bài học "Đầu tư vào thứ chưa thấy hữu dụng…" → DB: title=bài học, pt=bai-hoc, via=kol, mirror_of=bài gốc, 1 ref link, parent=Kim cương. Dọn page test. build xanh.

## 2026-06-16 (đợt 17) — 🧠 Tách THUỘC TÍNH ↔ LIÊN KẾT (giảm cognitive load) + Properties theo kho + gợi ý tiêu đề
Founder: header đè chữ; AI gợi ý title; nghiên cứu lại Properties (trường tối thiểu hữu dụng, đặc biệt QNET/Nhân loại cho AI rẻ); đánh giá lại logic cảm xúc/8 chiều — đang quá tải, dễ bỏ sót, AI rối.
**Insight gốc**: trong "8 chiều", Cảm xúc & Thời gian KHÔNG phải quan hệ giữa 2 trang — chúng là THUỘC TÍNH của trang. Bắt user "nối trang để gắn cảm xúc" = category error → cognitive load. Tách rõ:
- **THUỘC TÍNH** (điền 1 lần ở Properties, KHÔNG nối): Cảm xúc (cột emotion), Thời gian (event_date), Tóm tắt 1 câu, Loại, Từ khoá. Điểm 8 chiều vẫn tự derive từ các cột này (transformScore không đổi).
- **LIÊN KẾT** (quan hệ trang↔trang, có picker ＋Nối): Kiến thức, Trải nghiệm, Con người, Giá trị, Tham chiếu, Neo (6 chiều).
1. **Footer**: tile 🧡 Cảm xúc + 💙 Thời gian → nhãn "TỰ ĐỘNG", bỏ picker; sáng theo cột emotion/event_date; hint trỏ về Properties (trang cá nhân) hoặc "🪞 Ánh xạ" (trang QNET/Nhân loại — cảm xúc chỉ thuộc kho cá nhân).
2. **Properties cá nhân**: thêm field **Cảm xúc** (7 chip → cột emotion, qua onSetEmotion/saveEmotion). User vẫn tự thêm "Trường của tôi".
3. **Properties kho chung (QNET/Nhân loại)**: 2 trường vàng cho AI rẻ viết hay — **🎯 Dùng khi nào** (when_to_use: bối cảnh nên trích) + **❝ Câu trích đắt** (key_quote: câu quotable sẵn). Cùng Tóm tắt 1 câu + Nguồn + Từ khoá = đủ để model thấp tạo content đúng ngữ cảnh.
4. **Gợi ý tiêu đề** (page.tsx): nút "✨ Gợi ý tiêu đề" hiện khi title generic + có nội dung → lấy từ Tóm tắt 1 câu (ưu tiên) hoặc câu có nghĩa đầu tiên. AI rewrite body = Phase 2 khi cắm key.
5. **Header hết đè chữ**: command bar Home + viewBar + know header → spacer flex-1 + status `xl:block min-w-0 overflow-hidden`, bỏ "ALIVE" cho gọn.
**Verify**: screenshot Home (clock không đè status), trang cá nhân (chip Cảm xúc ở Properties + footer Cảm xúc/Thời gian "tự động"), QNET (Dùng khi nào + Câu trích đắt). tsc + build xanh.

## 2026-06-13 (đợt 16) — 🧭 "3 câu hôm nay" theo DISC + MBTI + màn xác nhận
Founder: sau khi trả lời cho hiện xác nhận & lưu; câu hỏi lần tới dùng khung DISC / MBTI để hiểu tính cách.
1. **Bank câu hỏi theo khung tính cách** (Pages.tsx QA modal): 16 câu gắn nhãn — 8 DISC (D/I/S/C × 2) + 8 MBTI (E/I·S/N·T/F·J/P). Mỗi ngày chọn 3 câu, stride 5 (nguyên tố cùng nhau 16) → phủ cả 2 khung, xoay vòng theo ngày. Nhãn hiện dưới mỗi câu (hud-label).
2. **Lưu có cấu trúc**: ghi `**[DISC · D — quyết đoán] {câu}**\n{trả lời}` dưới mục `## 🧭 Tính cách · {ngày}` trong 🪞 "Tôi là ai" → AI đọc suy ra hồ sơ DISC/MBTI; event meta {framework:'disc_mbti', n}.
3. **Màn xác nhận sau khi lưu**: thay vì đóng câm → hiện "🪞 Đã lưu N câu vào Tôi là ai" + nút "Mở trang Tôi là ai" / "Xong" (state qaSaved). Modal khoác HUD (góc ngoặc + glow).
4. **Fix bug trùng trang**: lookup cũ `.limit(1).maybeSingle()` lỗi & tạo trùng khi đã lỡ có >1 "Tôi là ai" → đổi `.order(created_at).limit(1)` lấy [0]. Dọn DB còn 1 trang.
**Verify**: preview mở modal (nhãn DISC/MBTI), điền 2 câu → màn "Đã lưu 2 câu" + nút mở trang; DB lưu đúng format có nhãn. tsc + build xanh.

## 2026-06-13 (đợt 15) — 🧩 Account ở Home · wordmark mọi view · Insight đào sâu · fix Trích dẫn
Phản hồi founder sau khi duyệt HUD:
1. **Tài khoản/Thoát về Home** (thay vì Kho): tách `themeBtn` + `accountCluster` (theme · email · Thoát) trong Workspace. Home command bar + mọi view dùng accountCluster; Kho header chỉ còn themeBtn (đúng "log out ở home thay vì kho").
2. **Wordmark A·K·A·S·H mọi view**: thêm `viewBar` (Wordmark + StatusLine + accountCluster) bọc chung các view engine/kol/board/review/users/profile; Today & Know vốn đã có. (Galaxy neuro cũng đã có "A.K.A.S.H — NEURO LINK".)
3. **Insight cũng đào sâu 30s** (như trải nghiệm): capture insight giờ mở dialog 3 câu RIÊNG cho insight — ⚡ tinh chỉnh 1 câu sắc bén · 🌍 đến từ đâu (gốc) · 🎯 áp dụng 7 ngày tới. capDeep mang `kind`; finishCapture(skip) nhánh theo kind (insight→Kim cương bài học, exp→Hành trình). Verify DB: pt=bai-hoc, principle set, gốc/áp dụng vào md.
4. **Fix nhân đôi ngoặc ở "Trích dẫn"**: text blockquote đã có sẵn `"` nhưng render lại bọc thêm `&ldquo;&rdquo;` → `""…""`. Thêm stripQ (bỏ 💬 + lớp ngoặc ngoài) + splitAttr (tách "— nguồn" cuối câu thành src) + lọc dòng `> —` nối tiếp. Giờ mỗi câu 1 cặp “…” sạch, nguồn tách riêng.
**Verify**: screenshot Home (account+Thoát), Content Engine (viewBar wordmark), dialog insight đào sâu, Kim Chỉ Nam (trích dẫn hết nhân đôi). tsc + build xanh.

## 2026-06-13 (đợt 14) — 🚀 ĐỒNG BỘ HUD: login bay vào vũ trụ + Galaxy + quét nốt
**Founder**: "đồng bộ hết + login có hiệu ứng bay vào vũ trụ + toàn bộ phần còn lại".
1. **Login = warp drive** (Warp.tsx sẵn có, sao streak hyperspace): brand hero wordmark mono `A·K·A·S·H` + glow, eyebrow "AKASHIC KNOWLEDGE ENGINE", StatusLine `● CORE·MEMORY·LINK·WARP READY`, feature cards → hud-panel; form card bỏ viền gradient → hud-panel + hud-glow-edge + góc ngoặc Corners; nhãn Email/Mật khẩu → hud-label. (login luôn dark `dq-dark` — đúng tinh thần vũ trụ.)
2. **Galaxy**: panel nổi rounded-xl/2xl → rounded-md + viền `--hud-line`; eyebrow legend/gợi ý/orphan → hud-label (canvas vốn đã dùng font mono).
3. **Quét nốt**: eyebrow inline còn sót ở page.tsx (peek/radar) + Digest.tsx → hud-label.
**Verify**: screenshot login warp (desktop hero + mobile form) — sao bay xuyên vũ trụ, panel glow + góc ngoặc, wordmark mono. tsc sạch, build xanh.

## 2026-06-13 (đợt 13) — 🦾 REBRAND JARVIS HUD: Akash thành "bộ não" Command Center
**Founder** (kèm 4 ảnh V.A.U.L.T./Agentic OS): nghiên cứu UI high-tech (font, viền, node-link), làm KHÔNG quá Notion, vẫn mượt như Claude → rebrand toàn bộ thành bộ não kiểu Jarvis. Founder chốt: HUD cho CẢ 2 theme + skin toàn app + 1 màn Command Center.
**Triết lý tổng hợp**: Jarvis ở VỎ (chrome) — Claude ở RUỘT (đọc/viết). Chi tiết BRANDING §7.
1. **Hud.tsx** (mới): Corners (góc ngoặc ⌐¬⌙⌟), HudPanel, HudLabel, Dot/StatusLine (● CORE·MEMORY·LINK·ONLINE), Wordmark (A·K·A·S·H mono giãn cách), HudStat, **Constellation** (canvas chòm sao node-link phát sáng, mulberry32 seed cố định, drift+twinkle, resolve --hud-accent ra hex).
2. **globals.css**: token `--hud-*` riêng cho dark (graphite + glow tím) và light (kem + bóng); class .hud-label/.hud-panel/.hud-num/.hud-dot/.hud-wordmark/.hud-rule.
3. **Áp toàn app qua 3 component gốc**: Card/Lbl (Pages+Hubs) + Sect (PageFrame) → .hud-panel/.hud-label → mọi card hết bo tròn Notion, thành panel hairline; mọi eyebrow thành mono.
4. **Chrome**: nav rail active = hud-glow-edge + bar accent glow; AkashMark "A" mono bo nhẹ; header 'know' = Wordmark + StatusLine.
5. **Command Center** (Today reskin, GIỮ logic): command bar (wordmark + status + clock live client-only) → identity strip mono (ADMIN · 61 QI · 1D STREAK) → hero "AI hiểu bạn" trên nền Constellation + Corners.
**Verify**: screenshot dark ("HUD trong vũ trụ") + light ("HUD trên giấy") + trang know (vỏ Jarvis, ruột Claude). tsc sạch, build production xanh.
**Lưu ý**: clock dùng useState(null)+useEffect → tránh lệch hydrate; canvas phải resolve CSS var ra hex (ctx không hiểu var).

## 2026-06-13 (đợt 12) — 🪶 TRIẾT LÝ CLAUDE: giấy ấm + serif Lora + heading trung tính
**Founder**: "dùng triết lý design của claude bỏ vào Akash — thực sự clean như claude". Giữ 1-accent tím; đổi nền/chữ/nhịp (BRANDING §6 mới).
1. **globals.css**: light = giấy kem Claude (#faf9f5/#f0eee6/mực ấm 1f1e1d, viền rgba(31,30,29)); dark = graphite ấm (remap toàn bộ thang hex cũ #06060c…#1c1c26 → #1b1a18…#2e2d2a, kèm các biến thể /85–/97) + remap text-zinc-* lạnh → stone ấm; editor: h1/h2/h3 serif trung tính (bỏ tím/cyan), blockquote serif nghiêng border tím (bỏ nền vàng), code mộc.
2. **layout.tsx**: + font Lora (--font-display, subset vietnamese); mặc định theme = light cho user mới (localStorage null → 'light'); suppressHydrationWarning trên <html> (script theme chạy trước hydrate).
3. **`.ak-display`** áp cho: wordmark Akash, title trang (page.tsx), chào Home (Pages.tsx).
**Verify**: đo computed style (body #faf9f5, title/h2 Lora, h2 mực #1f1e1d), screenshot cả 2 theme. Build xanh.
**Bug & bài học**: (1) chạy `npm run build` khi dev server đang giữ `.next` → Turbopack cache persistent serve CSS CŨ kể cả sau restart server — phải `rm -rf .next`; từ nay build xong là xoá .next rồi mới start dev lại. (2) theme script + SSR → hydration warning hàng loạt: fix chuẩn suppressHydrationWarning.

## 2026-06-13 (đợt 11) — 🪞 Ánh xạ kho chung → kho tôi + Cây gốc thành property + 100% trang có loại
**Yêu cầu founder**: đổi "Hành trình" → "Hành trình anh hùng của tôi"; kho cá nhân có phần ánh xạ từ nhân loại/QNET vào (đi qua ánh xạ rồi mới link vào page cụ thể); phân đủ loại trang cho mọi page + "rơi vào cây nào" thành trường Properties cố định.
1. **Đổi tên cây 1**: DB (props->>hub='journey') + 2 chỗ ensureHub trong page.tsx + caption capture ở Pages.tsx.
2. **Luồng ánh xạ chốt** (KHO-CHUAN cây 5 cập nhật): trang kho chung (humanity/corporate, không phải container) có nút **🪞 Ánh xạ về kho tôi** → `mirrorToMyKho()` tạo trang "Cảm nhận: <gốc>" trong 📚 Tủ nguồn tinh hoa với `props.mirror_of` + link `reference` về bài gốc + md khung 3 mục (điều đắt nhất / chạm chuyện nào đời tôi / áp dụng); bấm lần 2 mở trang cảm nhận cũ (1 gốc = 1 trạm). Logic: ánh xạ TRƯỚC, từ trạm mới nối tiếp vào page cá nhân cụ thể; link thẳng vẫn được phép như tham chiếu nhanh.
3. **Cây gốc = trường chuẩn read-only**: PropsPanel nhận `hubLabel` (page.tsx derive từ ancestors: container gần kho nhất, fallback kho) — Row "Cây gốc · cố định" ngay cạnh Loại trang. Trang chỉ có MỘT nhà.
4. **Backfill loại trang 100%**: 11 trang kind=page (case-by-case) + toàn bộ kind=note theo nhánh (humanity→bai-hoc, B→nguon, C→ho-so, E→quy-trinh, A/D/F→bai-hoc, title ~'^(cách|kịch bản|quy trình|follow)'→quy-trinh, Ý tưởng content→ghi-chu, Mục tiêu 2026→quy-trinh) → **0/176 trang thiếu loại**.
**Verify preview**: "Hệ thống > mục tiêu" (Atomic Habits) hiện Cây gốc "🧘 Minh triết & triết lý · cố định" → bấm Ánh xạ → trang "Cảm nhận: Hệ thống > mục tiêu" mở ra trong Tủ nguồn, DB xác nhận mirror_of + 1 link reference. Build xanh.

## 2026-06-12 (đợt 10) — 🏷 PROPERTIES/FOOTER chính danh + trang tổng = mục lục thuần
**Yêu cầu founder**: đặt tên theo framework — các trường = **Properties**, các mục cuối trang = **Footer**; trang TỔNG của kho (cây/hub) không có mấy cái đó, chỉ page bên trong mới có; trang tổng cũng không có "học thẩm thấu".
1. **PageFrame.tsx**: PropsPanel thêm eyebrow mono `PROPERTIES — hồ sơ của trang, AI đọc từ đây`; PageFooter thêm eyebrow `FOOTER — chân trang…` + prop `lite` (true → chỉ render 🗂 Trang con, bỏ 8 chiều/liên kết/trích dẫn/nguồn/đính kèm).
2. **page.tsx**: helper `isContainer(n)` = kind ∈ {kho, folder} HOẶC subtype ∈ {hub, kol_home, viral_home, content_matrix}. Container → ẩn PropsPanel, PageFooter lite, ẩn nút Chuyển hoá/Ôn lại/điểm 8 chiều ở cả header toàn trang LẪN thanh peek. `anchor_home`/`person`/`core_value` vẫn là trang thật → giữ đủ.
3. **Data fix**: 3 nhánh QNET top-level (B. Sản phẩm / E. Kỹ năng bán hàng / F. Hệ thống & văn hoá) thiếu `subtype='hub'` → UPDATE DB (A/C/D vốn kind=folder nên đã được bắt).
**Verify preview**: hub "Kim cương bài học" chỉ còn FOOTER + Trang con, không nút Chuyển hoá; page con "Nhất quán thắng động lực" đủ PROPERTIES + điểm 26·3/8 + Ôn lại. Build xanh.
**Bug tự gây & fix**: script python tìm marker `## Đợt` trong WORKLOG nhưng format thật là `## 2026-… (đợt N)` → entry không được ghi mà commit vẫn chạy (lệnh nối bằng newline, không phải &&) — bài học: xem format file TRƯỚC khi viết script chèn, và nối lệnh phụ thuộc bằng `&&`.

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

## 2026-06-12 (đợt 6) — 🧹 GỌN + PHASE 1 hoàn tất
1. **Sạch 8 backlog luồng audit**: xoá dead modal Raw + createFromRaw · giao việc có ô GẮN VÀO TRANG (node_id, KHO-CHUAN §3#9) + 'Mở việc' sống · content_results.source_node_id fallback = card id (vòng đo khép) · Board tìm/tạo Xưởng theo props.hub (hết trang trùng) · nút Content chỉ hiện cho trang kho cá nhân · ReviewHub duyệt set content=null (bản BTV sửa = bản hiển thị) · vòng đời assignment thống nhất open→submitted→done · ô '❓ còn lấn cấn' khôi phục ở màn Hành động.
2. **Taxonomy THỐNG NHẤT 7 loại khắp nơi**: Studio bỏ blog/video/kich-ban/khach-hang/sach (là output format hoặc đổi tên) → dùng đúng 7 loại chuẩn; migrate DB page_type/tpl_for keys cũ — giờ 100% trang có loại đều thuộc 7 loại.
3. **award_qi RPC** (security definer, chỉ approver): nghiệm thu việc cộng Qi cho người làm — RLS không còn chặn.
4. **Kéo trang sang kho khác = đổi layer ĐỆ QUY** toàn bộ trang con.
5. **Phase 1**: ✨ wizard MỤC LỤC ĐỜI (LSI McAdams — banner Home khi chưa có chương, 1 màn 2-7 chương → trang gốc trong Hành trình kèm gợi ý cảnh then chốt) · mobile drawer (sidebar ẩn <md, nút ☰) · Digest ghi props.refs (tín hiệu reference sống) · font canvas về mono hệ thống · COVERS/COLOR hết pink lạc.
6. **Docs đủ bộ**: README.md root (chạy + kiến trúc 1 phút + thứ tự đọc) + docs/README.md index 16 file.
Verify: build xanh từng cụm, tsc sạch, banner wizard ẩn đúng với user đã có chương, taxonomy DB query sạch.

## 2026-06-12 (đợt 7) — 📈 PILOT TRACKING
- events.meta jsonb + sid (session per tab); logEvent(type, node, meta) phủ: session_start, nav (từng màn), capture (loại ghi nhanh), digest_start (đối chiếu với 'tham' = funnel bỏ dở), wizard_life (số chương). RPC admin_event_stats (security definer, can_approve) vì events RLS own-only.
- 📈 Panel 'Hành vi pilot' trong Nhân sự (admin): per-user 🔥 chuyển hoá trọn · ✍️ ghi nhanh · 🧭 lượt màn · Σ events · ngày hoạt động cuối + North star tổng. Kèm cách đọc số (0 🔥 sau 7 ngày = phỏng vấn; 🧭 cao 🔥 thấp = đi lạc). Verify: panel hiện data thật ngay trên preview.

## 2026-06-12 (đợt 8) — ✍️ TAKE-NOTE & PAGE theo feedback test thật của founder
1. Title ghi nhanh: trải nghiệm = 'Nhật ký 12/6 · 14h05' (nguyên văn vào thân '⚡ Chuyện gì xảy ra'); insight cắt 60 ký tự.
2. **Bug quote không hiện trong Kim Chỉ Nam** (Editor ưu tiên content JSON cũ hơn md mới append) → set content:null khi append; format nổi bật: > 💬 “câu” — *nguồn* · ngày. Verify end-to-end: quote Jim Rohn hiện thật.
3. Sort cây: mặc định 'Thông minh' (hub giữ vị trí, note MỚI NHẤT trên đầu) + menu Mới nhất / A→Z ở sidebar.
4. Trường chuẩn/của tôi dễ đọc: label 12px đậm màu, value 13.5px, hàng cao hơn, bỏ mono-eyebrow tí hin.
5. 📎 Đính kèm thành SECTION riêng trong panel (list + thêm/xoá tại chỗ); bỏ nút 'Lưu template' per-page (template org-level qua 📐 Studio — đúng ý setup cấp kho).

## 2026-06-12 (đợt 9) — 🧠 ĐÀO SÂU + SEARCH + 8 CHIỀU DỄ DÙNG
1. **Capture trải nghiệm → dialog Đào sâu 30 giây** (skip được): cảm xúc (chips) + ai liên quan + bài học 1 câu → emotion vào CỘT, bài học vào props.principle (thắp luôn chiều knowledge), người vào md. Verify DB: emotion='nhẹ nhõm', principle ghi đúng.
2. **Search thông minh**: bỏ dấu tiếng Việt + xếp hạng (prefix > đầu-từ > chứa > tóm-tắt/từ-khoá > mọi-từ-khớp semantic-lite) — áp cho cả sidebar lẫn ⌘K. Semantic thật (embeddings) = Phase 2.
3. **8 chiều dễ dùng hơn**: @mention tự đoán chiều theo LOẠI trang đích (hồ-sơ→Con người, trải-nghiệm→Trải nghiệm, sự-kiện→Thời gian, bài-học/quy-trình→Kiến thức, còn lại→Tham chiếu) — hết phải nghĩ 8 lựa chọn mỗi lần nối.
4. **Thuật ngữ chuẩn**: ❝ Trích dẫn ❞ (mức câu, link có excerpt) ≠ 🕸️ Liên kết (trỏ trang) ≠ 📚 Nguồn tham chiếu (chiều reference) — đổi label PageFooter.
5. **4 tính năng trang**: ➕ Ghi tương tác (hồ sơ người, append lịch sử theo ngày) · 🕓 Bản trước (xem md đã duyệt) · 📅 Xem trên Dòng đời (nhảy thẳng Galaxy timeline qua modeReq) · 📋 Copy nội dung. Share-link public cần RLS policy + route riêng → backlog Phase 2.
