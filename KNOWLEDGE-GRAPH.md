# Data Qi — Mô hình liên kết tri thức ĐA CHIỀU (đề xuất)

> Nâng từ "neuron link" thô (cạnh vô hướng, không loại) → đồ thị tri thức thông minh nhiều chiều.

## Vấn đề hiện tại
Liên kết hiện chỉ là cạnh A↔B: không biết **vì sao nối**, **nối ở chiều nào**, **mạnh yếu ra sao**. → Không truy vấn thông minh được.

---

## A. 6 CHIỀU kết nối (multi-dimensional)
Mỗi cạnh thuộc một (hoặc nhiều) chiều — đây là cách "data đa chiều" của bạn:

| Chiều | Nối cái gì | Ví dụ loại quan hệ |
|-------|-----------|--------------------|
| 🧠 **Knowledge** | concept ↔ concept | củng cố / mâu thuẫn / ví dụ-của / tiên-quyết-của |
| 🌱 **Experience** | trải nghiệm cá nhân ↔ bài học | "mình đã sống bài học này" |
| ❤️ **Emotion** | cảm xúc ↔ nội dung | resonance, breakthrough, struggle (valence + cường độ) |
| ⏳ **Time** | sự kiện ↔ sự kiện qua thời gian | "vang vọng từ 2 năm trước", "tiến hóa từ…" |
| 👥 **People** | người ↔ tri thức | học-từ / chia-sẻ-bởi / nói-về |
| 💎 **Values** | nội dung ↔ giá trị cốt lõi | "thể hiện giá trị Kỷ luật" |

→ Ví dụ bạn nêu map thẳng: *link page* = Knowledge · *trải nghiệm về bài học* = Experience · *emotion* = Emotion.

---

## B. 3 CÁCH một liên kết hình thành
Sức mạnh nằm ở chỗ **kết hợp cả ba**, không chỉ user tự nối:

1. **Explicit (user nối, CÓ LOẠI)** — như Obsidian nhưng cạnh có *type* (property graph). User chọn "đây là ví dụ của…", "mình thấy mâu thuẫn với…".
2. **Implicit (AI ngầm)** — **embeddings + pgvector** tìm nội dung gần nghĩa dù chưa ai nối → AI gợi ý "2 note này liên quan". Đây là phần "thông minh tự động".
3. **Structured/Extracted (trích xuất)** — metadata facet từ template (Chủ đề/Cảm xúc/Giá trị) + **AI trích triple** (chủ-vị-tân: "Mình — biết-ơn-khi — tập gym sáng") → dựng đồ thị thực thể.

---

## C. Lớp làm cho nó "THÔNG MINH"
- **Weighted edges** — sức mạnh cạnh theo: tần suất tham chiếu + độ mới + AI-relevance + **cường độ cảm xúc**. Cạnh mạnh → sáng & dày hơn.
- **Clustering (community detection)** — thuật toán tự gom thành **"chòm sao chủ đề"** → lộ ra chủ đề nổi trong second brain của bạn.
- **AI suggestion** — chủ động đề xuất liên kết khi viết (đã có trong mockup).
- **Emotion-glow** — cảm xúc mạnh → node phát sáng rực hơn (cảm xúc thành tín hiệu thị giác).
- **Latent paths** — AI tìm "đường đi" bất ngờ giữa 2 ý tưởng xa nhau → khơi gợi insight mới.

---

## D. Tech (khả thi trên Supabase)
```
edges(id, org_id, from_node, to_node,
      dimension[knowledge|experience|emotion|time|people|values],
      type,                 -- loại quan hệ ngữ nghĩa
      weight float,         -- sức mạnh
      source[user|ai|extracted],
      meta jsonb)
nodes = pages | concepts | people | emotions | values  (đa loại)
embeddings(... vector)      -- pgvector cho implicit links
```
- **Truy vấn đồ thị:** đủ dùng với Postgres + bảng edges. Nếu cần đệ quy sâu → **Apache AGE** (extension graph cho Postgres) hoặc Neo4j sau.
- **Clustering & embeddings:** chạy job định kỳ, lưu `cluster_id` + vector.

---

## ĐỀ XUẤT: Mô hình LAI
Đồ thị = **hợp của** (explicit-typed) + (implicit-embedding) + (extracted-triples), phủ **6 chiều**, có **weight + cluster**.
Giao diện cho **lọc/blend theo chiều**: xem riêng lớp Cảm xúc, hay Tri thức, hay tất cả.
→ Vừa giàu, vừa thông minh, vừa đẹp khi visualize (mỗi chiều một màu).
