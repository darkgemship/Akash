# AKASH BRANDING — Hệ nhận diện "Vũ trụ Kim cương" (v2 · 2026-06-12)

> Sứ mệnh thị giác: mỗi cuộc đời là một viên kim cương đang được mài trong vũ trụ tri thức vô hạn.
> Cảm hứng: 3 reference founder chọn — (1) Neurones/Colorpong: mạng neuron đa sắc trên nền đen, nét mảnh; (2) Data Flow: dòng chảy tím → xanh dương → cyan → HỘI TỤ THÀNH ÁNH SÁNG TRẮNG; (3) Vòng xoáy thời gian vàng kim trên nền xám than.
> Quy tắc tối thượng: **nền tối là vũ trụ, màu là ánh sáng** — màu chỉ dùng để dẫn mắt và mang nghĩa, không trang trí.

## 1. Bảng màu & Ý NGHĨA từng tone

### Nền — Hư Không (Akasha Void)
| Token | Hex | Dùng cho | Ý nghĩa |
|---|---|---|---|
| `--ak-void` | `#05060c` | body, galaxy | Hư không — nơi mọi tri thức được lưu (akasha) |
| `--ak-deep` | `#0a0b14` | panel nền | Tầng khí quyển thứ nhất |
| `--ak-surface` | `#10121d` | card | Bề mặt trạm không gian |
| `--ak-raise` | `#171a28` | modal/popover | Tầng nổi gần người dùng nhất |
Nguyên tắc: 4 tầng nền chênh nhau rất nhẹ + viền sáng mép trên (`inset 0 1px rgba(255,255,255,.07)`) — chiều sâu đến từ ánh sáng, không từ màu xám.

### Quang phổ chính — "Dòng chảy tri thức" (theo reference Data Flow)
| Token | Hex | Dùng cho | Ý nghĩa |
|---|---|---|---|
| `--ak-violet` | `#8b5cf6` | identity, tri thức, chiều sâu | TÍM AKASHA — tâm trí, trực giác, kho cá nhân. Màu gốc thương hiệu (giữ từ DECISIONS §A1) |
| `--ak-blue` | `#3b82f6` | cầu nối gradient, dữ liệu chảy | XANH PLASMA — dòng dữ liệu đang di chuyển giữa tâm trí (tím) và sự sống (cyan) |
| `--ak-cyan` | `#22d3ee` | kết nối, hiện tại, live | CYAN TINH THỂ — sự sống, liên kết thật, "đang xảy ra" |
| `--ak-diamond` | `#f6f8ff` | đỉnh hội tụ, khoảnh khắc chuyển hoá | KIM CƯƠNG — nơi dòng chảy hội tụ thành ánh sáng trắng: trang Thấm trọn, celebration, điểm đến |
**[CHỐT 12/6 — 1-ACCENT, founder duyệt]** Theo research Linear/Raycast/Geist (RESEARCH-VIZ-ARCH §3): chrome dùng **đúng 1 accent** `--ak-violet #8b5cf6` (`.ak-cta` solid, hover #9b75ff) + neutral; **gradient violet→blue→cyan CHỈ còn sống ở**: logo/wordmark (`.ak-logo-grad`), màn login + onboarding ("cửa sổ nhìn vào vũ trụ"), celebration, và canvas Galaxy (màu DATA). Surface ladder: #0c0d10 → #101113 → #1c1d21, viền 1px thay glow. Màu vàng = semantic riêng của luồng Chuyển hoá (nút `bg-amber-400 text-black`), emerald = duyệt/thành công. KHÔNG fuchsia/hồng trên chrome.

### Vàng Hoàng Đạo — trục thời gian & giá trị (theo reference vòng xoáy vàng)
| Token | Hex | Dùng cho | Ý nghĩa |
|---|---|---|---|
| `--ak-gold` | `#f5b942` | dòng đời, mốc sự kiện, quote/trích dẫn đắt, Qi điểm, luồng Chuyển hoá | VÀNG HOÀNG ĐẠO — thời gian là vàng; mỗi mốc đời là một hạt sáng trên vòng xoáy; sự CHUYỂN HOÁ (mài kim cương) mang màu của lửa rèn |
| `--ak-ember` | `#d97706` | hover/đậm của gold | Than hồng — chiều sâu của vàng |
Gold đứng MỘT MÌNH, không pha vào gradient tím-cyan: hai hệ ánh sáng (quang phổ lạnh của tri thức ↔ vàng ấm của thời gian/giá trị) tạo tương phản có nghĩa.

### Màu trạng thái (giữ tối giản)
| Vai trò | Class | Ghi chú |
|---|---|---|
| Thành công / vào kho | emerald 400-500 | đã dùng, giữ |
| Chờ duyệt | amber 300-400 | trùng hệ gold — hợp lý: "đang trong lò" |
| Trả lại / nguy hiểm | red 400 | dùng tiết chế |

### 8 chiều liên kết (BẤT BIẾN — theo FRAMEWORK.md §1, không đổi)
knowledge `#22d3ee` · experience `#f472b6` · emotion `#fbbf24` · values `#a78bfa` · people `#34d399` · time `#60a5fa` · reference `#e879f9` · anchor `#f87171`
Hồng/fuchsia chỉ còn tồn tại Ở ĐÂY (màu chiều trong graph) — không dùng cho chrome UI nữa.

## 2. Typography
| Vai trò | Font | Lý do |
|---|---|---|
| UI + nội dung | **Be Vietnam Pro** (400/500/600/700/800) | thiết kế CHO tiếng Việt — dấu đẹp, hình học hiện đại, đậm chất tech |
| HUD / số liệu / nhãn vũ trụ | **JetBrains Mono** (có subset vietnamese) | nhãn kiểu trạm không gian, số tabular |
Tầng chữ: Page title `text-4xl/800` là LỚN NHẤT trang — không nội dung nào được vượt (h1 trong thân bài ≤1.6em). Nhãn section: mono 10-11px uppercase tracking rộng. Body 15-16.5px/1.75.

## 3. Icon & hình khối
- Chrome chức năng = SVG line-icon 1.5px (Icons.tsx); emoji CHỈ cho icon trang do user chọn (rule DECISIONS §B11 — giữ).
- Bo góc: card 16px (`rounded-2xl`), chip 10-12px. Viền `white/10`, hover `white/20` hoặc màu nghĩa.
- Glow: dùng cho phần tử SỐNG (node đang firing, CTA chính, kim cương) — `shadow-[0_0_24px]` màu tương ứng; không glow đại trà.

## 4. Motion
- Nhanh và vật lý: 120-200ms ease-out cho hover; 350ms `cubic-bezier(.2,.8,.3,1)` cho xuất hiện.
- Mỗi view giữ "chất" riêng (rule §B13). Celebration = hội tụ ánh sáng trắng kim cương + confetti hệ quang phổ.
- Tôn trọng `prefers-reduced-motion`.

## 5. Giọng thương hiệu (brand voice)
- **Người dẫn đường trong vũ trụ** — không phải công cụ ghi chú: nói với user như người thầy ấm áp tin rằng họ là kim cương ("Bạn vừa thắp sáng một liên kết mới", không phải "Đã lưu thành công").
- Động từ chuyển hoá: nạp · thấm · chuyển hoá · mài · thắp · nối · toả sáng.
- Không hứa hẹn kết quả tiền bạc (compliance); hứa hẹn sự RÕ RÀNG và TRƯỞNG THÀNH.

## 6. Mapping cũ → mới (đã sweep trong code)
| Cũ ("quê") | Mới | 
|---|---|
| `from-fuchsia-500 to-violet-500` (CTA) | `from-violet-600 via-blue-600 to-cyan-500` |
| `via-fuchsia-500/300` trong gradient | `via-blue-600/400` |
| `from-pink-500 to-amber-*` (Thấm) | `from-amber-500 to-yellow-400` (lửa rèn — Chuyển hoá) |
| fuchsia đơn lẻ (text/bg/border/shadow) | violet tương ứng |
| pink đơn lẻ trong chrome | amber tương ứng |
| Geist Sans / Arial | Be Vietnam Pro |

## §6 — TRIẾT LÝ CLAUDE (founder yêu cầu 13/6: "thực sự clean như Claude")

Giữ tím Akash làm accent duy nhất (§1-accent không đổi), nhưng toàn bộ NỀN + CHỮ + NHỊP chuyển sang triết lý Anthropic/Claude:

1. **Giấy ấm thay đen lạnh.** Light (MẶC ĐỊNH mới): nền kem `#faf9f5` (pampas), panel `#f0eee6` (oat), card trắng viền mảnh; mực ấm `#1f1e1d / #4a4742 / #6b675f / #8f8a80`, viền `rgba(31,30,29,.09–.14)`. Dark: graphite ẤM `#1b1a18 → #21201e → #262523 → #2e2d2a` (hết tông xanh-đen #05060c cũ), chữ stone ấm `#faf9f5/#ece9e2/#c9c5bb/#a09c92` (remap text-zinc-* trong layer dark).
2. **Serif có hồn cho display** — Lora (subset vietnamese), vai trò như Copernicus của Claude: wordmark Akash, title trang, chào Home, h1/h2/h3 trong editor. UI vẫn Be Vietnam Pro, số liệu JetBrains Mono. Class: `.ak-display`.
3. **Heading trung tính** — bỏ h2 tím / h3 cyan trong editor; heading giờ là mực đậm serif + border mảnh. Màu chỉ còn ở LINK (tím), marker list (tím), CTA.
4. **Trích dẫn thanh lịch** — blockquote hết nền vàng: serif nghiêng, border trái tím nhạt, không nền.
5. **Viền mảnh thay glow** — code block mộc, shadow nhẹ hơn ở dark.
6. Theme mặc định cho user mới = LIGHT kem (chữ ký Claude); toggle 🌙/☀️ giữ nguyên; Galaxy vẫn là "cửa sổ vũ trụ" nền tối trên giấy.

> Đổi sang terracotta (#d97757 — màu Claude chính hiệu) nếu founder muốn full-Claude: chỉ cần đổi `--ak-violet`. Hiện giữ tím để Akash vẫn là Akash.
