# Data Qi — Engagement & Design (đã chốt hướng)

> Giải pháp cho rủi ro số 1: THÓI QUEN. Dùng design gây nghiện lành mạnh, gắn phần thưởng với hành vi tạo giá trị thật.

## 1. "Bộ não lớn dần" — game mechanic cốt lõi
- 🧠 **Não cá nhân:** to & xịn hơn theo số liên kết tri thức của user → động lực cá nhân.
- 🌐 **Não tập đoàn:** kho tổng QNET phình ra khi mọi người update → động lực tập thể + cảm giác thuộc về.
- Mỗi liên kết/insight mới → não tiến hóa nhìn thấy được → vòng lặp quay lại mỗi ngày.

### ⚠️ Lan can 1 — thưởng CHẤT không thưởng LƯỢNG
Không để "nhiều link = não to" → tránh spam link rác làm bẩn graph + đầu độc RAG.
Não lớn theo **liên kết có ý nghĩa**: được tham chiếu, được AI xác nhận liên quan, note được dùng làm content.

### ⚠️ Lan can 2 — Vivid ở sân khấu, Calm ở bàn làm việc
- **Rực rỡ/high-tech:** màn hình bộ não, dashboard, khoảnh khắc "wow", milestone.
- **Êm dịu:** editor & vault (nơi đọc/viết) — không nhảy màu, không phân tâm.
- Tôn trọng `prefers-reduced-motion`.

## 2. Hướng kỹ thuật visual
| Yêu cầu | Giải pháp | Lưu ý |
|---------|-----------|-------|
| Graph lớn (não tập đoàn hàng nghìn+ node) | **WebGL**: react-force-graph / Cosmograph / Sigma.js | KHÔNG D3/SVG (chết ~1-2k node) |
| Màu rực, gradient động, high-tech | CSS variables + animated gradient/shader | Giới hạn vùng sân khấu |
| White & dark mode | `next-themes` + CSS variables | Thiết kế palette cho cả 2 từ đầu |
| Truy cập trực quan | Dashboard kiểu Notion + graph click-to-page | |

## 3. Lớp gamification (gợi ý, cần chốt độ sâu)
- Não tiến hóa theo cấp (level brain).
- Streak ghi chú hằng ngày.
- Milestone: "100 liên kết", "đóng góp vào não tập đoàn".
- AI nhắc nhở/coach hằng ngày để giữ thói quen (gắn coaching engine — Flow C).

## 4. Quyết định liên quan
- **Monetization:** hoãn → connect qua quanlysukien sau. (Giữ lỗ hổng G9 trong tầm mắt.)
- **Metrics tăng trưởng kênh:** nhập tay hằng tuần + AI nhắc. (Gắn coaching.)

## 5. Đã chốt
- **Bộ não = màn hình chủ đạo (home).** Mở app thấy não mình trước → điểm chạm cảm xúc mỗi ngày.
- **Gamification:** bộ não tiến hóa + streak ghi chú + level. (Không full game layer.)
- **Leaderboard theo team** (đúng cây team QNET, thi đua lành mạnh).
  - ⚠️ Lưu ý: leaderboard có thể tạo áp lực → giữ "ghi chú thật". Cân nhắc: chỉ xếp hạng theo **đóng góp chất lượng** (liên kết có nghĩa), KHÔNG theo số lượng thô; cân nhắc cho member ẩn note private khỏi mọi thống kê.
