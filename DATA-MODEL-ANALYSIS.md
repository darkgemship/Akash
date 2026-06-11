# Data Qi — Phân tích data model (vs Obsidian, cho AI-readiness)

> Kết luận: mô hình ~80% tối ưu, nhắm cao hơn Obsidian. Cần khóa 3 điểm để AI dùng mượt (map vào GraphRAG).

## 1. HAI cấu trúc tách biệt (đúng như Obsidian)
- **Cây / mind-map** = `contains` (kho → folder → nhánh con). Để TỔ CHỨC.
- **Graph / link "bắn qua"** = `links` (node ↔ node). Để LIÊN TƯỞNG.
- Hai trục CẮT NGANG nhau. 1 note ở 1 folder nhưng link nhiều nơi.

## 2. Nguyên tắc số 1: KHÔNG trộn 2 loại quan hệ
| Cạnh | Ý nghĩa |
|------|---------|
| `contains` | phân cấp (cây) |
| `links` | liên tưởng (graph), có hướng + backlink + TYPE + weight |
→ Trong DB phải là 2 quan hệ riêng. Trộn = AI nhầm "chứa" với "liên quan".

## 3. "Bắn node→node" — đúng logic, cần 3 điều kiện
1. Có hướng + tự sinh backlink.
2. Có LOẠI (typed, 6 chiều) — Obsidian KHÔNG có → ta vượt.
3. Trỏ UUID ổn định, KHÔNG theo tên (điểm yếu Obsidian).

## 4. So sánh
| Mô hình | Mạnh | Thiếu cho AI |
|---------|------|--------------|
| Obsidian | cây+graph+backlink, đơn giản | link vô loại, theo tên (gãy), không schema/embeddings, 1 người |
| Zettelkasten | note nguyên tử + link dày | thủ công |
| Roam/Logseq | link cấp BLOCK | phức tạp |
| Property graph (Neo4j) | node+cạnh có type/thuộc tính | hạ tầng |
| GraphRAG | graph + embeddings cho LLM | ← ĐÍCH của ta |

## 5. Checklist AI-readiness
| # | Cần | Trạng thái |
|---|-----|-----------|
| 1 | UUID ổn định mọi node | ⚠️ chốt |
| 2 | Tách `contains` vs `links` | ⚠️ tách DB |
| 3 | Cạnh type + weight | ✅ |
| 4 | Block-level ID (chunk RAG + link mịn) | ⚠️ thêm |
| 5 | Embeddings/node-block (pgvector) | ✅ chủ trương |
| 6 | Template ép cấu trúc | ✅ mạnh hơn Obsidian |
| 7 | Export Markdown+frontmatter+JSON graph | ⚠️ thêm |

→ Khóa #1, #2, #4 là map thẳng vào **GraphRAG**.

## 6. Khuyến nghị "links over folders"
- Cây NÔNG (kho→folder→note, nhánh tối đa 1-2 cấp).
- Sức mạnh & giá trị-AI nằm ở **GRAPH link dày + có loại**, không phải độ sâu cây.

## 7. Schema gợi ý (chốt cho AI mượt)
```
node(id uuid, kind[kho|folder|note|block], parent_id, title, layer, ...)   -- parent_id = cây (contains)
block(id uuid, node_id, idx, text, embedding vector)                        -- cấp block: chunk + link mịn
link(id, from_id, to_id, dimension, type, weight, source[user|ai|extracted]) -- graph, có hướng
-- backlink = truy ngược link theo to_id
```
