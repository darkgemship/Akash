# RESEARCH — Data-viz · Kiến trúc 8 chiều · Premium UI · Wizard UX (2026-06-12, 4 agents, nguồn kiểm chứng)

> Nền tảng cho đợt redesign "sắc sảo, tinh tế, không dư thừa". Mỗi mục có nguồn đi kèm trong key_findings.



---

## 🕸️ MŨI 1 — Knowledge-graph viz có nghĩa

### Key findings
- Obsidian graph view có sẵn bộ pattern đáng copy: filter 'Orphans' bật/tắt node không có link, 'Groups' tô màu theo query, 'Text fade threshold' điều khiển độ mờ label theo zoom, và Local graph có 'Depth slider' (hiện node cách trang đang mở 1..n bước). Người dùng còn yêu cầu thêm chế độ 'orphans only' — chứng tỏ nhu cầu tìm-trang-mồ-côi là use case thật, không phải tính năng phụ.
  - nguồn: https://obsidian.md/help/plugins/graph và https://forum.obsidian.md/t/orphans-only-local-graph-filter/53841
- Cambridge Intelligence (hãng làm KeyLines/ReGraph): cách hết hairball KHÔNG phải là tinh chỉnh layout mà là 'design for the user workflow, not the raw data model' — filter bớt loại node/link, aggregate (gộp node thành combo), và dùng chỉ số mạng (degree, betweenness centrality) để chỉ highlight node quan trọng. Câu chốt: 'hairball trong data là tốt — đừng để nó chạm vào UI'.
  - nguồn: https://cambridge-intelligence.com/blog/hairball-effect-in-graph-visualization/
- Paper ForceAtlas2 (PLOS One 2014, layout mặc định của Gephi): thiết kế cho mạng scale-free 10–10.000 node — đúng cỡ Akash. Chế độ LinLog làm cụm co chặt lại và tương ứng trực tiếp với modularity (cấu trúc cộng đồng) — cho cảm giác 'thùy não' rõ rệt; Gravity giữ các đảo rời không trôi ra xa; Prevent Overlap chỉ bật sau khi layout đã ổn định.
  - nguồn: https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0098679
- Kỹ thuật semantic zoom cho label (rtopmap, ZMLT): sắp node theo trọng số (degree), label của node thứ i chỉ hiện ở mức zoom j nếu bounding box của nó không đè lên label có ưu tiên cao hơn; node đã hiện ở mức zoom ngoài phải tiếp tục hiện ở mọi mức zoom sâu hơn (semantic consistency). Đây là thuật toán greedy đơn giản, code được ngay trên canvas 2D bằng occupancy grid.
  - nguồn: https://arxiv.org/abs/1906.05996 và https://arxiv.org/pdf/1706.04979
- Bài học phản diện từ Roam/Logseq: global graph bị chính cộng đồng người dùng gọi là 'almost useless except to show off' — đẹp nhưng không trả lời câu hỏi nào. Cái được dùng thật hằng ngày là LOCAL graph (n hops quanh trang đang đọc) + filter theo tag. Kết luận cho Akash: Neuro view phải mặc định trả lời một câu hỏi cụ thể (trang nào mồ côi? cụm nào đang phình?), không phải 'xem toàn bộ não'.
  - nguồn: https://discuss.logseq.com/t/confusion-about-the-graph-view-whats-the-point-of-it-if-you-rely-on-blocks-and-journals/28136 và https://medium.com/alvistor/comparing-roamresearch-graph-view-with-logseq-and-obsidian-b0c1fd51c2ee
- Neo4j Bloom: dùng rule-based styling — size node scale theo điểm trung tâm (PageRank/degree) qua rule số học, màu theo category, và Legend panel luôn hiện để người xem giải mã được màu/size. Với Akash (8 dimension màu cố định) thì legend 8 màu + size-theo-degree là chuẩn ngành, không phải trang trí.
  - nguồn: https://neo4j.com/docs/bloom-user-guide/current/bloom-visual-tour/legend-panel/
- Cộng đồng Louvain chạy được hoàn toàn client-side bằng graphology-communities-louvain (npm), trả về nhãn cụm 0..n cho từng node; với 200–500 node chạy trong vài ms — đủ để tính cụm mỗi lần mở view rồi dùng làm lực gom cụm + vị trí đặt label cụm.
  - nguồn: https://graphology.github.io/standard-library/communities-louvain.html
- Edge bundling (FDEB - Holten & van Wijk) giảm rối cho đồ thị dày, nhưng chi phí tính cao và chủ yếu đáng giá khi >1000 edges; với cỡ 200–500 node, các nguồn thực chiến khuyên dùng filtering/aggregation + giảm alpha edge trước, bundling chỉ là bước cuối.
  - nguồn: https://classes.engineering.wustl.edu/cse557/readings/holten-edgebundling.pdf và https://www.microsoft.com/en-us/research/wp-content/uploads/2018/12/TrimmingTheHairball.pdf

## MŨI 1 — Knowledge Graph Viz thực chiến cho Neuro view (canvas 2D, ~200–500 nodes)

### (a) Làm sao hết "hairball"?

Nguyên tắc gốc (Cambridge Intelligence): **đừng render data thô — render câu trả lời cho một câu hỏi**. Cụ thể 4 tầng, làm theo thứ tự:

1. **Mặc định KHÔNG mở global graph.** Neuro view mở ra ở chế độ **local graph depth-1 quanh trang gần nhất user đọc** (pattern Obsidian local graph + bài học Roam/Logseq: global graph bị user chê "useless", local graph mới được dùng hằng ngày). Có nút "Toàn cảnh" để mở rộng.
2. **Giảm mực edge trước khi nghĩ đến bundling.** Với 200–500 node: edge vẽ bằng quadratic curve nhẹ (control point lệch 8–12% chiều dài), `globalAlpha = 0.06–0.12` ở overview, màu theo dimension. Hover/click node → 1-hop neighborhood lên `alpha = 1`, phần còn lại dim xuống `alpha = 0.08` (cả node lẫn edge). Đây là cú "hết nùi" rẻ nhất và mạnh nhất.
3. **Lọc edge theo trọng số ở overview:** mỗi node chỉ vẽ top-k link (k=4) theo weight (số lần link/recency); edge còn lại chỉ hiện khi hover. (Tinh thần "spanning subgraph giữ strong ties" của Microsoft Trimming the Hairball.)
4. **Cụm + nhãn cụm:** chạy `graphology-communities-louvain` (client-side, <10ms với 500 node) mỗi lần build graph → mỗi node có `communityId`. Dùng để (i) thêm lực gom cụm, (ii) vẽ nhãn cụm, (iii) chế độ "gộp": khi zoom out quá ngưỡng, vẽ mỗi cụm thành 1 meta-node (size = số trang, màu = dimension trội) — đây là aggregation/combo mà Cambridge Intelligence khuyên.

**Không làm FDEB edge bundling** ở cỡ này — chi phí cao, lợi ích chỉ rõ khi >1000 edges.

### (b) Highlight node mồ côi / cần nối — cách tốt nhất

Obsidian chỉ có toggle Orphans (ẩn/hiện) và user phải xin thêm "orphans only" — Akash làm hơn hẳn bằng cách biến nó thành **chế độ hành động "Cần nối"**:

1. **Vành mồ côi (orphan ring):** orphan không tham gia force simulation chính. Đặt chúng trên một **vành tròn ngoài** bán kính `R = maxRadiusCủaGraphChính + 80px`, sắp theo góc = hash(id), sort ưu tiên trang tạo gần đây vào vị trí 12h. Ẩn dụ thị giác: "ký ức chưa được não kết nối, lơ lửng ở rìa".
2. **Mã hoá:** orphan = vòng tròn **viền đứt nét, ruột rỗng, xám nhạt + pulse nhẹ** (scale 1→1.15, chu kỳ 2s, chỉ pulse 3 trang mới nhất để không loè loẹt). Node degree=1 ("sắp mồ côi") tô viền vàng nhạt.
3. **Badge đếm:** góc trên "⚠ 12 trang chưa nối" — click → camera zoom ra vành + dim graph chính.
4. **Click orphan → panel gợi ý nối:** liệt kê 5 ứng viên (cùng kho/cây, trùng tag, title/text similarity), mỗi ứng viên 1 nút "Nối + chọn dimension". Vẽ **đường nối ma (ghost edge, nét đứt)** từ orphan tới ứng viên ngay trên canvas khi hover gợi ý. Đây là điểm biến view từ "ngắm" thành "làm" — đúng yêu cầu founder.

### (c) Layout cho cảm giác "não bộ" mà vẫn đọc được — thuật toán + tham số

Dùng **d3-force (hoặc tự viết tương đương trên canvas)** với cấu hình theo tinh thần ForceAtlas2 LinLog (chế độ làm cụm co chặt, tương ứng modularity — chính là cái cho hình dạng "thùy não"):

```js
simulation
  .force('charge', d3.forceManyBody().strength(-120).theta(0.9).distanceMax(400))
  .force('link', d3.forceLink(links).distance(60)
        .strength(l => 1 / Math.min(deg(l.source), deg(l.target)))) // hub không bị xé
  .force('collide', d3.forceCollide(d => r(d) + 4).strength(0.8).iterations(2))
  .force('x', d3.forceX(W/2).strength(0.05))   // thay forceCenter — đảo không trôi
  .force('y', d3.forceY(H/2).strength(0.05))
  // LỰC GOM CỤM (tự viết, ~10 dòng): kéo node về centroid cụm Louvain
  .force('cluster', alpha => nodes.forEach(n => {
      const c = centroid(n.communityId);
      n.vx += (c.x - n.x) * 0.15 * alpha;
      n.vy += (c.y - n.y) * 0.15 * alpha;
  }));
```

- **Mental map ổn định (quan trọng nhất):** seed vị trí ban đầu deterministic — mỗi cụm Louvain gán 1 góc quanh tâm (`angle = i/k * 2π`, bán kính 250), node con jitter quanh đó bằng hash(id). **Lưu (x,y) cuối vào DB**, lần sau mở dùng làm vị trí khởi tạo với `alpha = 0.1` (chỉ "rung nhẹ" cho node mới) — não thật không tự sắp xếp lại mỗi lần mở mắt.
- **Tắt mô phỏng:** `alphaDecay = 0.0228` (mặc định), `alphaMin = 0.001`, dừng hẳn sau ~300 tick; chỉ reheat (`alpha = 0.3`) khi thêm/xoá node.
- **Size node theo degree** (chuẩn Neo4j Bloom): `r = 4 + 2.2 * Math.sqrt(degree)`, cap 18px. Hub to tự nhiên = "vùng não đậm".
- **Chất "não" nằm ở render, không ở 3D:** nền tối, node có glow (`shadowBlur = r*1.5`, shadowColor = màu dimension); edge cong alpha thấp như sợi thần kinh; khi hover, animate gradient chạy dọc edge 1-hop (hiệu ứng "xung điện") — vẫn canvas 2D thuần, 60fps dễ với 500 node nếu vẽ edge trước, node sau, label cuối.
- **Legend 8 dimension cố định** góc màn hình (pattern Bloom): không có legend thì 8 màu chỉ là pháo hoa.

### (d) Labels: khi nào hiện/ẩn

Theo thuật toán semantic zoom của rtopmap/ZMLT + "Text fade threshold" của Obsidian:

1. **Ưu tiên = degree.** Sort node giảm dần theo degree. Mỗi frame, duyệt theo thứ tự đó, label được vẽ nếu bbox của nó (đo bằng `ctx.measureText`, padding 4px) không đè bbox label đã vẽ — dùng occupancy grid ô 32px cho O(1) check. ~500 label check vẫn dưới 1ms.
2. **Ngưỡng theo zoom:** `k < 0.5`: chỉ label cụm (tên cụm = trang degree cao nhất trong cụm hoặc tên kho, font 14–16px, đặt tại centroid, LUÔN hiện). `0.5 ≤ k < 1.2`: thêm label của node có `degree ≥ p75`. `k ≥ 1.2`: mọi node qua được bước greedy ở (1). Fade bằng alpha tuyến tính quanh mỗi ngưỡng (±0.15 k) thay vì bật/tắt phụt.
3. **Font cố định theo màn hình** (11–12px): vẽ label sau `ctx.setTransform(1,0,0,1,0,0)` reset — chữ không phình/teo theo zoom.
4. **Ngoại lệ luôn hiện:** node đang hover + 1-hop neighbors, node đang chọn, và orphan đang ở chế độ "Cần nối" — bất kể zoom.
5. **Nhất quán:** node đã có label ở mức zoom ngoài thì không được mất label khi zoom vào (chỉ thêm, không bớt) — tránh cảm giác "nhảy chữ".

### Khác biệt giữa các view (đáp yêu cầu "mỗi view một insight")
- **Neuro** = "cấu trúc + lỗ hổng": cụm Louvain, hub, orphan ring, hành động nối link.
- **Local graph** (mở từ một trang) = "ngữ cảnh đang đọc": depth slider 1–3, chỉ neighborhood.
- Galaxy/Dòng đời giữ trục **thời gian** — Neuro tuyệt đối không pha thời gian vào, để hai view không dẫm chân nhau.

**Nguồn chính:** [Obsidian Graph view docs](https://obsidian.md/help/plugins/graph) · [Cambridge Intelligence — fixing hairballs](https://cambridge-intelligence.com/blog/hairball-effect-in-graph-visualization/) · [ForceAtlas2 paper, PLOS One](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0098679) · [ZMLT semantic zoom](https://arxiv.org/abs/1906.05996) · [rtopmap label priority](https://arxiv.org/pdf/1706.04979) · [Neo4j Bloom legend & rule-based styling](https://neo4j.com/docs/bloom-user-guide/current/bloom-visual-tour/legend-panel/) · [graphology-communities-louvain](https://graphology.github.io/standard-library/communities-louvain.html) · [Holten FDEB](https://classes.engineering.wustl.edu/cse557/readings/holten-edgebundling.pdf) · [Microsoft Trimming the Hairball](https://www.microsoft.com/en-us/research/wp-content/uploads/2018/12/TrimmingTheHairball.pdf) · [Logseq graph view criticism](https://discuss.logseq.com/t/confusion-about-the-graph-view-whats-the-point-of-it-if-you-rely-on-blocks-and-journals/28136) · [So sánh graph Roam/Logseq/Obsidian](https://medium.com/alvistor/comparing-roamresearch-graph-view-with-logseq-and-obsidian-b0c1fd51c2ee) · [Obsidian forum — orphans only filter request](https://forum.obsidian.md/t/orphans-only-local-graph-filter/53841)

---

## 🧮 MŨI 2 — Kiến trúc điểm Chuyển hoá 8 chiều

### Key findings
- Hiện trạng Akash: điểm 5 cạnh đang được TÍNH HEURISTIC một lần lúc Thấm rồi GHI CỨNG vào bảng wisdom_depth (merge GREATEST với điểm cũ), kèm dims jsonb 8 boolean — tức là điểm là snapshot tay, không phải derive từ links. Nếu user nối thêm link sau khi Thấm, điểm KHÔNG đổi; nếu xoá link, điểm cũng không giảm → điểm và graph lệch nhau ngay từ thiết kế.
  - nguồn: /Users/nguyenvanhongngoc/Desktop/Akash/web/src/app/Digest.tsx (dòng 241-263, công thức fresh + merged + upsert wisdom_depth)
- BUG lịch ôn: wisdom_depth.review_count được ĐỌC (old?.review_count ?? 0) nhưng KHÔNG có chỗ nào trong web/src ghi tăng nó → next_review_at luôn = now + [1,3,7,21,60][0] = +1 ngày mãi mãi. Luồng 'Ôn lại' chưa tồn tại; Pages.tsx chỉ đọc next_review_at để hiện badge due.
  - nguồn: /Users/nguyenvanhongngoc/Desktop/Akash/web/src/app/Digest.tsx:261 và web/src/app/Pages.tsx:736-738 (grep toàn src không có write nào vào review_count)
- Nguyên tắc derive-vs-store (DDIA/Kleppmann + thực hành denormalization): giữ bảng nguồn chuẩn hoá làm source of truth, lớp derived (view/materialized view/bảng cache) phải LUÔN tính lại được từ nguồn; chỉ denormalize trường ít đổi và đọc nhiều — trường đổi thường xuyên mà nhúng vào nhiều nơi là tự ký hợp đồng đồng bộ thủ công. Materialized view = persist kết quả query, tự chọn lịch refresh.
  - nguồn: https://dataintensive.net/ ; https://www.datacamp.com/tutorial/denormalization ; https://docs.oracle.com/cd/E11882_01/server.112/e25554/basicmv.htm
- FSRS tách 3 tầng rạch ròi: (1) review log append-only (Anki revlog: mỗi lần ôn 1 dòng), (2) memory state lưu trên card chỉ 2 số Stability + Difficulty, (3) Retrievability TÍNH ON-THE-FLY R(t)=(1+F·t/S)^C, interval kế = S(Rd^(1/C)−1)/F theo desired retention 0.9. Lịch ôn là state riêng, không trộn với điểm hiểu.
  - nguồn: https://borretti.me/article/implementing-fsrs-in-100-lines ; https://github.com/open-spaced-repetition/fsrs4anki/wiki
- Các app chấm 'độ hiểu một note' đều DERIVE chứ không lưu tay: Anki 'mature' = interval ≥ 21 ngày (tính từ scheduler state, stats tính từ revlog); RemNote 6 mức mastery (New/Acquiring <3d/Growing 3d-3w/Solidifying 3w-3m/Retaining 3m+/Stale quá hạn) suy từ interval giữa 2 lần ôn; WaniKani 9 stage Apprentice→Burned suy từ đúng/sai từng review (đúng +1 stage, sai tụt ≥1); Readwise Mastery dùng exponential decay + feedback soon/later/someday/never.
  - nguồn: https://docs.ankiweb.net/stats.html ; https://help.remnote.com/en/articles/7970392-flashcard-statistics ; https://knowledge.wanikani.com/wanikani/srs-stages/ ; https://help.readwise.io/article/26-how-does-the-readwise-spaced-repetition-algorithm-work
- Schema links hiện tại đã đủ để derive 8 chiều: links(org_id, from_node, to_node, dimension ∈ 8 giá trị, excerpt, from_block, source) + tín hiệu nội tại trang đã có sẵn chỗ lưu (nodes.emotion, nodes.event_date, props.principle, props.refs, props.action, trang mantra subtype='mantra' link anchor về bài gốc). NHƯNG links thiếu created_by → điểm cá nhân trong kho org chưa attribute được cho từng user.
  - nguồn: /Users/nguyenvanhongngoc/Desktop/Akash/web/src/app/page.tsx:280-281,971 ; web/src/app/Digest.tsx:230-240 ; docs/FRAMEWORK.md §1
- Quy mô 200 trang/user, ~vài trăm links: plain SQL view/RPC tính on-read mất vài ms — CHƯA cần materialized view hay event sourcing đầy đủ; bảng events hiện có (type='tham') đã là event log nhẹ đủ dùng làm audit trail. Materialized view chỉ cần khi >10k nodes.
  - nguồn: docs/DECISIONS.md mục C (DB ~95 nodes, 35+ links) + nguyên tắc hybrid normalized-source/derived-layer từ https://www.splunk.com/en_us/blog/learn/data-denormalization.html

# Kiến trúc "Độ chuyển hoá 8 chiều" — DERIVE từ links, KHÔNG lưu bảng điểm

## Kết luận một câu
**Điểm 8 chiều phải là DERIVED DATA tính từ bảng `links` + tín hiệu nội tại trang; bảng `wisdom_depth` thu gọn thành `review_state` chỉ giữ lịch ôn SM-2.** Đây đúng pattern mọi hệ SRS lớn đang dùng: Anki/FSRS lưu *scheduler state* trên card còn "mature" (interval ≥ 21 ngày) và mọi stats đều derive; RemNote derive 6 mức mastery từ interval; WaniKani derive 9 stage từ lịch sử đúng/sai. Không hệ nào lưu "điểm hiểu" ghi tay song song với dữ liệu gốc — vì sẽ lệch (đúng cái đang xảy ra ở Akash: nối thêm link sau khi Thấm, radar không đổi).

## 1. Mô hình 3 tầng (theo đúng FSRS/Anki)

```
TẦNG NGUỒN (source of truth — ghi, không bao giờ tính):
  links(from_node, to_node, dimension, excerpt, from_block, source, created_by*)
  nodes(emotion, event_date, props.principle, props.refs, props.action)
  trang mantra (subtype='mantra') + link anchor
  events(type='tham'|'on_lai', node_id)            ← event log nhẹ, append-only

TẦNG LỊCH ÔN (state nhỏ, mutable — như FSRS stability/difficulty):
  review_state(node_id, user_id, learned, runs, review_count,
               next_review_at, last_run_at, peak_score)

TẦNG ĐIỂM (derived — KHÔNG có bảng, chỉ view/RPC + 1 hàm TS thuần):
  transformation_scores(node_id) → 8 subscore + tổng 0-100 + tier
```

## 2. Công thức điểm — code được ngay

File mới `web/src/lib/transformScore.ts` (pure function, dùng chung cho Galaxy/Digest/Home — một nguồn công thức duy nhất):

```ts
// Tín hiệu mỗi chiều = số link chiều đó (in + out, distinct theo trang đối diện)
// link có excerpt (mức câu/quote) đếm 1.5 thay vì 1  ← thưởng link quý nhất theo FRAMEWORK §1
// + tín hiệu nội tại: knowledge += props.principle?1:0 ; emotion += nodes.emotion?1:0
//   time += event_date?1:0 ; reference += min(props.refs.length, 3)
//   experience += props.action?.text?1:0 (+2 nữa khi action done)
//   anchor += số trang mantra trỏ về (link anchor chiều in)

const W: Record<Dim, number> = {            // tổng = 1.00, tinh thần trọng số cũ (Action 2.5 nặng nhất):
  knowledge: 0.12, reference: 0.10, emotion: 0.10, time: 0.10,
  people: 0.11, values: 0.13, experience: 0.17, anchor: 0.17,
}                                            // experience + anchor = bằng chứng chuyển hoá THẬT → nặng nhất

const sat = (x: number) => 1 - Math.pow(2, -x)   // bão hoà: 1 tín hiệu=50%, 2=75%, 3=87.5%
// → link đầu tiên của MỖI CHIỀU đáng giá nhất; farm 50 link knowledge không ăn được điểm

export function transformScore(x: Record<Dim, number>) {
  const total = Math.round(100 * DIMS.reduce((s, d) => s + W[d] * sat(x[d]), 0))  // Math.round: rule #8
  const covered = DIMS.filter(d => x[d] >= 1).length
  return { total, covered, learned: covered >= 2 }   // giữ rule đã chốt "learned ≥ 2 chiều"
}
```

Tier hiển thị (derive, không lưu — như Anki young/mature, RemNote 6 mức): `<20 Hạt mầm · 20-49 Đang thấm · 50-79 Thấm sâu · ≥80 Chuyển hoá`. Trên Galaxy: size/độ sáng node = `total`; node quá hạn ôn (`next_review_at < now`) làm mờ đi kiểu "Stale" của RemNote — hai trục độc lập: **độ sâu (graph) × độ tươi (lịch ôn)**.

Phía DB, 1 RPC trả tín hiệu thô cho cả org trong 1 query (đủ nhanh cho 200 trang, KHÔNG cần materialized view):

```sql
create or replace function dim_signals(p_org uuid)
returns table(node_id uuid, dimension text, x numeric)
language sql stable as $$
  select node_id, dimension, sum(w) from (
    select from_node, dimension, case when excerpt is not null then 1.5 else 1 end as w
      from links where org_id = p_org
    union all
    select to_node, dimension, case when excerpt is not null then 1.5 else 1 end
      from links where org_id = p_org
  ) t(node_id, dimension, w)
  group by node_id, dimension
$$;
-- tín hiệu nội tại (emotion/event_date/props) đọc cùng query nodes sẵn có, cộng ở TS
```

## 3. Migration path từ wisdom_depth (4 bước, không mất gì)

1. **Bước 0 (1 migration):** `alter table links add column created_by uuid default auth.uid()`; unique index `(from_node, to_node, dimension)`; check `from_node <> to_node`; FK on delete cascade. Tạo `transformScore.ts` + RPC, hiển thị điểm mới CẠNH radar cũ 1 tuần để soát.
2. **Đổi tên, không drop:** `alter table wisdom_depth rename to review_state`. Giữ: `learned, runs, review_count, next_review_at, last_run_at`. Thêm `peak_score int default 0` (đỉnh từng đạt — cho celebration). 5 cột điểm cũ + `dims` GIỮ NGUYÊN 1 release làm tham chiếu "điểm trước đây" rồi mới drop.
3. **Digest.tsx ngừng ghi điểm:** khối dòng 241-263 chỉ còn ghi (a) links/props/emotion/event_date như hiện tại, (b) upsert `review_state` phần schedule, (c) `learned` lấy từ `transformScore(...)` derive ngay sau khi insert links. Radar 5 cạnh cũ nếu còn hiển thị thì map derive: Nối=Σlinks · Nghĩa=values+anchor · Chứng=reference+people · Trải=experience+emotion+time · Hành=props.action — render từ cùng một derive, không lưu.
4. **Backfill = không cần:** 35+ links hiện có tự sinh điểm mới khi derive chạy. Chạy 1 script so điểm cũ/mới cho ~95 nodes, ghi WORKLOG.

**Fix kèm lịch ôn (bug có thật):** thêm flow "Ôn lại" — khi user ôn xong: `review_count = review_count + 1`, `next_review_at = now + [1,3,7,21,60][min(4, review_count)]`, insert `events(type='on_lai')`. Hiện `review_count` không bao giờ tăng nên lịch kẹt +1 ngày vĩnh viễn. Sau này muốn nâng cấp: thay ladder bằng FSRS (lib `ts-fsrs`) — chỉ cần thêm 2 cột `stability float, difficulty float` vào `review_state`, đúng kiến trúc đã tách.

## 4. Edge cases phải xử (đã soát theo schema thật)

| # | Edge case | Xử lý |
|---|-----|-----|
| 1 | Links là org-level, không biết AI nối → điểm của ai trong kho QNET | cột `created_by`; điểm cá nhân chỉ đếm link `created_by = user` HOẶC chấp nhận điểm là của-trang (per-org) — chốt với founder, đề xuất per-org cho đơn giản vì North star là /user/tuần đo bằng events |
| 2 | Nối trùng (same from,to,dimension) để farm | unique index ở bước 0 + `sat()` bão hoà |
| 3 | Self-link, link tới trang đã xoá | check constraint + FK cascade |
| 4 | Xoá link → điểm TỤT (derive mà) | đây là FEATURE (điểm trung thực); celebration so với `review_state.peak_score` chứ không so điểm hiện tại → không bao giờ "ăn mừng lại" |
| 5 | Link AI gợi ý (source='ai'/'kol') chưa được user xác nhận | đếm hệ số 0.5 hoặc 0 cho tới khi user confirm — lọc theo cột `source` sẵn có |
| 6 | Cột int + điểm lẻ (bug đã gặp, rule #8) | `Math.round` trong transformScore, `peak_score` là int |
| 7 | Trang chưa từng chạy luồng Thấm nhưng đã nhiều link | điểm vẫn hiện (đúng tinh thần "tri thức là liên kết"), nhưng badge 🔥 Thấm trọn yêu cầu `review_state.runs ≥ 1` |
| 8 | Backlink đếm đôi (A→B tính cho cả A và B) | đúng chủ đích (cả 2 trang giàu lên), nhưng đếm distinct theo (trang đối diện, dimension) để 1 cặp trang không cộng 2 lần cùng chiều |

## 5. Vì sao KHÔNG lưu bảng điểm riêng / KHÔNG event sourcing đầy đủ
- Quy mô 200 trang/user: derive on-read 1 query GROUP BY là vài ms — materialized view/cache table là phức tạp trả trước vô ích; chỉ cân nhắc khi >10k nodes (lúc đó: materialized view refresh concurrently theo cron, hoặc bảng cache update bằng trigger trên links).
- Bảng `events` hiện có đã là event-log nhẹ đủ cho Qi điểm + audit; điểm 8 chiều tính lại được 100% từ nguồn → đúng nguyên tắc DDIA "derived data phải recomputable", sai công thức chỉ cần sửa 1 hàm TS, không cần migrate dữ liệu điểm.
- Thứ DUY NHẤT phải lưu vì không derive được: input chủ quan của user (emotion, principle, mantra, action) — nhưng chúng đã có chỗ ở `nodes`/`props`, không phải ở bảng điểm.

Nguồn: [Anki Manual — Stats/maturity](https://docs.ankiweb.net/stats.html) · [RemNote Mastery Levels](https://help.remnote.com/en/articles/7970392-flashcard-statistics) · [WaniKani SRS Stages](https://knowledge.wanikani.com/wanikani/srs-stages/) · [Readwise Mastery](https://help.readwise.io/article/26-how-does-the-readwise-spaced-repetition-algorithm-work) · [Implementing FSRS in 100 Lines](https://borretti.me/article/implementing-fsrs-in-100-lines) · [FSRS4Anki wiki](https://github.com/open-spaced-repetition/fsrs4anki/wiki) · [DDIA — Kleppmann](https://dataintensive.net/) · [DataCamp — Denormalization](https://www.datacamp.com/tutorial/denormalization) · [Oracle — Materialized Views](https://docs.oracle.com/cd/E11882_01/server.112/e25554/basicmv.htm) · [Splunk — Data Denormalization](https://www.splunk.com/en_us/blog/learn/data-denormalization.html)

---

## 💎 MŨI 3 — Premium dark UI

### Key findings
- Cốt lõi của cảm giác 'sang' ở Linear là RESTRAINT có hệ thống: toàn bộ theme chỉ sinh từ 3 biến (base color, accent color, contrast) trong không gian màu LCH (đều sáng theo cảm nhận mắt người, khác HSL), thay vì 98 biến rời rạc như trước. Chỉ 1 accent duy nhất (#5e6ad2 tím) trên nền xám gần đen; depth tạo bằng 'surface ladder' (#010102 → #0f1011 → #141516 → #18191a) + border 1px hairline (#23252a), KHÔNG dùng drop-shadow.
  - nguồn: https://linear.app/now/how-we-redesigned-the-linear-ui ; https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/linear.app/DESIGN.md
- Text trong app dark 'sang' luôn có 3–4 tầng tương phản cố định, không bao giờ trắng tinh #fff trên nền đen tuyền: Linear dùng #f7f8f8 (primary) / #d0d6e0 (muted) / #8a8f98 (subtle) / #62666d (tertiary); Raycast dùng #f4f4f6 / #cdcdcd / #9c9c9d / #6a6b6c. Trắng tinh trên đen tuyền gây 'halation' (chữ nhòe viền) — một dấu hiệu UI nghiệp dư.
  - nguồn: https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/linear.app/DESIGN.md ; https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/raycast/DESIGN.md ; https://inkbotdesign.com/dark-mode/
- Quy tắc màu accent của Raycast cực kỳ đáng học cho Akash (vốn có 8 màu dimension): 'saturated accents chỉ xuất hiện bên trong imagery/data — KHÔNG BAO GIỜ trên chrome (nút, chữ, viền)'. Màu bão hoà khi cần làm nền badge thì dùng dạng soft rgba(color, 0.15). Vercel Geist cũng vậy: 'hiếm khi dùng màu ngoài neutral, coi accent như dấu câu (punctuation)'. Mỗi scale màu Geist có đúng 10 bậc với vai trò cố định: 1–3 nền component (default/hover/active), 4–6 border, 7–8 nền high-contrast, 9–10 text/icon.
  - nguồn: https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/raycast/DESIGN.md ; https://www.designsystems.one/design-systems/vercel-geist ; https://vercel.com/geist/colors
- Spacing và typography của các app này đều nằm trên lưới 4px với scale ngắn, lặp lại nghiêm ngặt: Linear spacing 4/8/12/16/24/32/48 (section 96), radius 4/6/8/12/16 + pill 9999; Raycast spacing 2/4/8/12/16/24/32, radius 4/6/8/10/16. Typography chỉ dùng 3 weight (400/500/600), Inter/Inter Display; heading lớn có letter-spacing ÂM (Linear: −0.6px ở 28px tới −3px ở 80px), body của Raycast tracking dương nhẹ 0.1–0.4px tạo cảm giác 'thoáng' trên nền tối; Geist dùng tabular numerals (số đơn cách đều) cho mọi bảng/metric.
  - nguồn: https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/linear.app/DESIGN.md ; https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/raycast/DESIGN.md ; https://www.designsystems.one/design-systems/vercel-geist
- Các lỗi làm dark UI 'rẻ tiền' được nguồn thật chỉ đích danh: (1) nền #000000 thuần trên OLED gây smearing khi scroll + halation với chữ trắng; (2) glassmorphism/backdrop-blur lạm dụng — 'decoration mặc định của UI do AI sinh ra'; (3) gradient tương phản cao tạo vệt gắt; (4) quá nhiều màu accent và badge nền đặc loè. Khắc phục: nền #0a0a0c–#121212, card lệch nền 1 bậc (#1E1E1E mức), phân tách bằng border mảnh thay glow.
  - nguồn: https://inkbotdesign.com/dark-mode/ ; https://dev.to/raxxostudios/dark-mode-design-that-doesnt-look-ai-2cn3 ; https://muz.li/blog/dark-mode-design-systems-a-complete-guide-to-patterns-tokens-and-hierarchy/
- Về emoji: 'với professional tools, dùng emoji quá nhiều làm xói mòn cảm giác nghiêm túc và đáng tin'; emoji render khác nhau giữa OS, là ảnh full-color không theo được text-tier/accent system, và 'không được thay icon nếu icon đang giữ vai trò chức năng'. Các app sang (Linear, Raycast, Vercel) dùng icon set monochrome đồng bộ stroke, tô bằng currentColor để icon tự thừa kế tầng tương phản của text; emoji chỉ chấp nhận được trong nội dung do user tạo (kiểu Notion page icon), không nằm trong chrome của app.
  - nguồn: https://medium.com/@garbermm/do-emojis-belong-in-ui-design-evaluating-their-place-in-modern-products-a0e579a3e3db ; https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/raycast/DESIGN.md
- Apple (visionOS/HIG) xác nhận nguyên tắc phân tầng bằng 'vibrancy' 3 mức (primary/secondary/tertiary) cho text-symbol-fill trên material tối, và depth qua lớp vật liệu chứ không qua viền sáng dày — củng cố cho mô hình '3 tầng chữ + surface ladder' thay vì shadow/glow.
  - nguồn: https://developer.apple.com/design/human-interface-guidelines/foundations/materials/ ; https://www.createwithswift.com/ensuring-interface-legibility-and-contrast-in-visionos/

## MŨI 3 — Premium Dark UI cho Akash: nguyên tắc + token + checklist code được

### (a) Vì sao Linear/Raycast/Vercel "sang": công thức restraint

Cả 3 app đều dùng đúng MỘT công thức, khác nhau chỉ ở tham số:

| Thành phần | Linear | Raycast | Vercel Geist |
|---|---|---|---|
| Accent trên chrome | 1 màu duy nhất `#5e6ad2` | 0 — CTA là pill TRẮNG `#fff` | 1 màu `#0070f3`, "như dấu câu" |
| Màu bão hoà khác | chỉ trong data/semantic | chỉ trong illustration, **cấm trên nút/chữ/viền** | chỉ trong chart/badge dạng soft |
| Depth | surface ladder + border 1px, **không drop-shadow** | surface ladder + border 1px, **không drop-shadow** | border `#333` hairline thay shadow |
| Tầng chữ | 4 tầng hex cố định | 4 tầng hex cố định | 2 bậc cuối của scale 10 bậc (9=secondary, 10=primary) |

Nguồn: [Linear redesign](https://linear.app/now/how-we-redesigned-the-linear-ui), [Linear DESIGN.md](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/linear.app/DESIGN.md), [Raycast DESIGN.md](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/raycast/DESIGN.md), [Geist colors](https://vercel.com/geist/colors), [DesignSystems.one — Geist](https://www.designsystems.one/design-systems/vercel-geist).

Ba cơ chế cụ thể:

1. **Surface ladder thay shadow.** Linear: canvas `#010102` → surface1 `#0f1011` → surface2 `#141516` → surface3 `#18191a`. Raycast: `#07080a` → `#0d0d0d` → `#101111` → `#121212`. Mỗi bậc cách nhau ~3–5 đơn vị lightness; element càng "nổi" càng SÁNG hơn nền 1 bậc, kèm border `1px solid rgba(255,255,255,0.08)`. Hover = nhảy lên 1 bậc surface, không glow.
2. **3–4 tầng chữ, không bao giờ #fff/#000 thuần.** Linear: `#f7f8f8` / `#d0d6e0` / `#8a8f98` / `#62666d`. Tỉ lệ dùng thực tế: ~10% diện tích chữ là tầng 1 (tiêu đề), ~60% tầng 2 (body), ~30% tầng 3–4 (meta). Chữ trắng tinh trên đen tuyền gây halation — chữ nhòe ([Inkbot](https://inkbotdesign.com/dark-mode/)).
3. **Accent = 1, màu data = nhiều nhưng bị "giam".** Đây là chìa khoá cho Akash: 8 màu dimension là **màu data**, không phải accent UI — chúng chỉ được sống trong canvas graph (cạnh nối, chấm node) và badge dạng soft; chrome (sidebar, nút, tab, viền) tuyệt đối neutral + 1 accent.

### (b) Spacing & typography scale thực tế (copy được luôn)

```css
:root {
  /* Surface ladder — theo mô hình Linear, ấm hơn 1 chút */
  --bg-canvas:   #0a0a0c;   /* không #000 thuần: tránh OLED smearing */
  --bg-surface1: #101113;   /* card, sidebar */
  --bg-surface2: #16171a;   /* hover row, input */
  --bg-surface3: #1c1d21;   /* active, popover */
  --border:        rgba(255,255,255,0.08);  /* mặc định, 1px */
  --border-strong: rgba(255,255,255,0.16);  /* focus/divider đậm */

  /* 4 tầng chữ */
  --text-1: #f7f8f8;  /* heading, số liệu chính */
  --text-2: #d0d6e0;  /* body */
  --text-3: #8a8f98;  /* label, meta, placeholder */
  --text-4: #62666d;  /* disabled */

  /* 1 accent duy nhất cho chrome */
  --accent: #5e6ad2; --accent-hover: #828fff;

  /* Spacing: lưới 4px, scale ngắn (Linear) */
  --sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px;
  --sp-5: 24px; --sp-6: 32px; --sp-7: 48px;

  /* Radius: CHỈ 3 giá trị + pill */
  --r-sm: 6px;   /* row, badge, input */
  --r-md: 8px;   /* nút, card nhỏ */
  --r-lg: 12px;  /* card lớn, modal */
}
```

Typography (Inter, đúng 3 weight 400/500/600 — theo Linear + Raycast):
- Display 28–32px / 600 / tracking **−0.6px**; Heading 20px / 500 / −0.2px; Body 14–16px / 400 / 0; Label-meta 12–13px / 400–500; Eyebrow 12px / 500 / **+0.4px** UPPERCASE.
- Số liệu (điểm 8 chiều, đếm link): `font-variant-numeric: tabular-nums` — chi tiết Geist dùng để bảng số nhìn "đắt tiền" ([DesignSystems.one](https://www.designsystems.one/design-systems/vercel-geist)).
- Nút/padding chuẩn Linear: nút `8px 14px` cao 32–36px; input `8px 12px`; card `16–24px`; badge `2px 8px`.

### (c) 8 lỗi làm UI "rẻ tiền" (đối chiếu để soi Akash)

1. Nền `#000000` thuần → smearing trên OLED + halation ([Inkbot](https://inkbotdesign.com/dark-mode/)).
2. Chữ `#ffffff` thuần cho cả body → dùng cho 100% chữ là dấu hiệu không có tầng tương phản.
3. **Glassmorphism/backdrop-blur tràn lan** — "decoration mặc định của UI do AI sinh" ([dev.to](https://dev.to/raxxostudios/dark-mode-design-that-doesnt-look-ai-2cn3)). Chỉ giữ blur cho đúng 1 chỗ (modal overlay).
4. Gradient nhiều và gắt; nếu dùng chỉ dark-to-dark cùng hue (kiểu keycap Raycast `#121212→#0d0d0d`).
5. Viền sáng dày/viền màu glow quanh card — thay bằng `1px rgba(255,255,255,0.08)`.
6. Bo góc lộn xộn (card 16px cạnh nút 4px cạnh input 12px) — khoá về 3 giá trị.
7. **Badge nền đặc màu loè** — công thức sang: chữ = màu, nền = `rgba(color, 0.12)`, border = `rgba(color, 0.25)` hoặc không border (mô hình "soft" của Raycast: `rgba(87,193,255,0.15)`).
8. **Emoji lẫn icon trong chrome** — emoji là ảnh full-color, render khác nhau giữa OS, phá hệ tầng tương phản, và "làm xói mòn cảm giác nghiêm túc của professional tool" ([Medium/Garber](https://medium.com/@garbermm/do-emojis-belong-in-ui-design-evaluating-their-place-in-modern-products-a0e579a3e3db)). Cách app sang xử lý: icon set monochrome duy nhất (Lucide/Phosphor), stroke 1.5px, size 16px, `color: currentColor` để icon tự ăn theo tầng chữ; muốn icon "có màu" thì đặt trong ô `--bg-surface2` bo 6px (kiểu app tile Raycast). Emoji CHỈ giữ ở nội dung user tạo (icon trang kiểu Notion), không bao giờ ở menu/nút/heading hệ thống.

### (d) Checklist 10 việc áp lên Akash (làm theo thứ tự, 1–5 đổi 80% cảm giác)

1. **Đặt token surface ladder 4 bậc** như block CSS trên; grep toàn codebase thay mọi hex nền rời rạc về 4 biến.
2. **Ép 4 tầng chữ**: mọi `text-white`/`#fff` → `--text-1`; body → `--text-2`; mọi label/timestamp/count → `--text-3`.
3. **Xoá toàn bộ `box-shadow` màu/glow trên card**; thay bằng `border: 1px solid var(--border)` + nền surface cao hơn nền cha 1 bậc.
4. **Giảm về 1 accent**: chỉ nút primary, link, focus ring, tab active được dùng `--accent`. 8 màu dimension rút khỏi chrome — chỉ còn trong graph edges, chấm 8 chiều, và badge soft `rgba(dim, 0.12)`.
5. **Thay emoji hệ thống bằng Lucide icons** (16px, stroke 1.5, currentColor). Một icon set, một size, một stroke — không trộn.
6. **Khoá radius 6/8/12 + pill**; sửa mọi giá trị lẻ.
7. **Snap spacing về lưới 4px**, padding card 16–24px, gap section 48px; tăng khoảng trắng quanh khối quan trọng (Stripe: "generous padding là thứ tạo cảm giác airy/polished" — [DESIGN.md Stripe breakdown](https://www.designmd.run/blog/stripe-design-system-breakdown)).
8. **Typography**: Inter 400/500/600, tracking −0.6px cho heading ≥24px, +0.4px uppercase cho eyebrow, `tabular-nums` cho mọi con số.
9. **Chuẩn hoá badge/chip** theo công thức soft (mục c.7) — đặc biệt 8 dimension chips.
10. **Interaction states câm lặng**: hover = surface+1 bậc (không đổi màu chữ sang accent), active = surface+2, focus = `box-shadow: 0 0 0 2px rgba(94,106,210,0.5)`; transition 120–150ms ease-out. Đây là phần "polish over flashiness" mà Linear nhấn mạnh ([Linear redesign](https://linear.app/now/how-we-redesigned-the-linear-ui)).

**Nguồn chính:** [Linear — How we redesigned the Linear UI](https://linear.app/now/how-we-redesigned-the-linear-ui) · [Linear DESIGN.md tokens](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/linear.app/DESIGN.md) · [Raycast DESIGN.md tokens](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/raycast/DESIGN.md) · [Vercel Geist Colors](https://vercel.com/geist/colors) · [DesignSystems.one — Geist breakdown](https://www.designsystems.one/design-systems/vercel-geist) · [Inkbot — Dark Mode best practices](https://inkbotdesign.com/dark-mode/) · [dev.to — Dark mode that doesn't look AI](https://dev.to/raxxostudios/dark-mode-design-that-doesnt-look-ai-2cn3) · [Muzli — Dark mode design systems](https://muz.li/blog/dark-mode-design-systems-a-complete-guide-to-patterns-tokens-and-hierarchy/) · [Garber — Do emojis belong in UI design](https://medium.com/@garbermm/do-emojis-belong-in-ui-design-evaluating-their-place-in-modern-products-a0e579a3e3db) · [Apple HIG — Materials](https://developer.apple.com/design/human-interface-guidelines/foundations/materials/) · [Stripe design breakdown](https://www.designmd.run/blog/stripe-design-system-breakdown)

---

## 🪜 MŨI 4 — Wizard/Profile UX cho Content Engine

### Key findings
- Form kiểu 'một câu hỏi mỗi màn' (Typeform) đạt completion rate 40-60% so với 15-20% của form truyền thống cùng số câu hỏi; trung bình 47.3% — hơn gấp đôi industry rate. Sweet spot là ≤10 câu hỏi, lý tưởng 6; quá 12-14 câu bắt đầu giảm conversion. → Wizard 'Hồ sơ Hồn' của Akash phải gói trong tối đa 7 màn.
  - nguồn: https://startupspells.com/p/typeform-one-field-onboarding-ux-gas-snapchat-duolingo-spotify-signup-conversion ; https://www.fillout.com/blog/one-question-at-a-time-form ; https://hackceleration.com/labs/review/typeform
- NN/g: wizard là dạng 'staged disclosure' — chỉ hợp khi các bước ĐỘC LẬP nhau, hỏng khi user phải nhảy qua lại giữa các bước. Tối đa 2 tầng disclosure (quá 2 tầng user bị lạc). Phải hiển thị sẵn thứ user dùng thường xuyên, chỉ giấu thứ hiếm dùng — nếu không là 'dời' complexity chứ không giảm. → Content Engine hiện tại (nhiều tab + rừng chip) chính là lỗi 'dời complexity': mọi quyết định đều phơi ra cùng lúc, không phân tầng theo tần suất dùng.
  - nguồn: https://www.nngroup.com/articles/progressive-disclosure/
- GOV.UK pattern 'one thing per page': mỗi màn 1 câu hỏi/1 quyết định giúp user hiểu rõ đang được hỏi gì, lỗi dễ phát hiện-sửa, branching có điều kiện dễ làm, và 'accelerates repeat user experiences'. Case study Just Eat áp dụng pattern này tăng thêm 2 triệu đơn/năm. NN/g bổ sung: cần progress indicator dạng 'Bước 3/5', single-column, smart defaults, label ngoài input.
  - nguồn: https://designnotes.blog.gov.uk/2015/07/03/one-thing-per-page/ ; https://www.smashingmagazine.com/2017/05/better-form-design-one-thing-per-page/ ; https://www.nngroup.com/articles/4-principles-reduce-cognitive-load/
- Jasper Brand Voice = mẫu chuẩn cho 'setup once, run many' của AI writing tool: tách profile thành 2 phần — Tone & Style (CÁCH nói: upload tối đa 8 bài mẫu/.txt/.pdf/URL, AI phân tích rồi trả về MÔ TẢ voice + excerpts để user bật/tắt xác nhận) và Memory (NÓI GÌ: facts về sản phẩm, audience). Có nút Preview ngay trong setup (chọn thử Blog/LinkedIn/Product Description + 1 topic). Cho phép NHIỀU brand voice, áp dụng được vào mọi nơi (editor, chat, agents). → Đây chính là blueprint cho 'Hồ sơ Hồn' nhiều bộ của Akash, và Akash có lợi thế: thay vì bắt upload, AI đọc thẳng ~200 trang sẵn có trong kho để đề xuất voice.
  - nguồn: https://help.jasper.ai/hc/en-us/articles/18618693085339-Brand-Voice ; https://www.the-brand-algorithm.com/jasper-brand-voice-complete-guide/
- Superhuman onboarding: học theo Apple Genius Bar/khách sạn 5 sao — dẫn dắt bằng HỘI THOẠI có chủ đích thay vì phơi tính năng; 'practice-first' (làm thử trên dữ liệu giả trước khi đụng dữ liệu thật) tăng 67% feature adoption và 20% shortcut usage so với self-guided; nhân đôi activation. → Màn cuối wizard nên là 'sinh thử 1 bài ngay bằng hồ sơ vừa tạo' để user thấy giá trị trước khi lưu.
  - nguồn: https://review.firstround.com/superhuman-onboarding-playbook/ ; https://www.growthmates.news/p/onboarding-lab-how-superhuman-and
- Linear 'anti-onboarding': KHÔNG bắt chọn role/permission/workflow lúc đầu — workflow opinionated mặc định (Triage→Backlog→In Progress) giảm decision fatigue; workspace pre-populated demo data 'models perfection' để user học bằng cách NHÌN trạng thái lý tưởng. → Wizard Akash phải có default thông minh ở MỌI màn (đoán sẵn từ 200 trang), user chỉ confirm/sửa chứ không điền từ trắng.
  - nguồn: https://www.candu.ai/blog/linear-onboarding-teardown
- HeyGen template/preset picker: luồng tạo lặp lại = chọn 1 template card từ library (filter theo use case: marketing/training/social), dán nội dung, 1 nút tạo; Video Agent còn có 'Auto mode' — bỏ trống lựa chọn thì AI tự chọn giúp. → Màn 'Hôm nay tạo gì?' nên là grid preset card + 1 input topic + 1 nút, kèm chế độ 'Để Akash tự chọn'.
  - nguồn: https://community.heygen.com/public/resources/how-to-use-templates-in-heygen-to-streamline-video-creation ; https://community.heygen.com/public/resources/how-to-create-high-quality-videos-in-minutes-with-video-agent

# MŨI 4 — Redesign Content Engine thành "Hồ sơ Hồn" + "Hôm nay tạo gì?"

## Chẩn đoán theo nguồn
Content Engine hiện tại phạm đúng lỗi NN/g cảnh báo: phơi toàn bộ quyết định (tab + rừng chip) cùng lúc thay vì phân tầng theo tần suất. Quyết định "một lần" (giọng văn, khán giả, trụ nội dung) đang bị trộn với quyết định "mỗi lần" (hôm nay viết gì, format nào). Fix = tách 2 luồng:

1. **Lần đầu (hoặc khi tạo profile mới):** Wizard ≤7 màn kiểu Typeform/GOV.UK → lưu thành **Hồ sơ Hồn** (nhiều bộ được, như Jasper Brand Voice).
2. **Mỗi lần sau:** MỘT màn duy nhất "Hôm nay tạo gì?" kiểu HeyGen preset picker: preset card + 1 input + 1 nút.

Nguyên tắc cứng: **mỗi màn ≤2 quyết định** (GOV.UK one-thing-per-page; Typeform 47.3% completion vs ~20% form thường), **tối đa 2 tầng disclosure** (NN/g), **mọi field có smart default từ ~200 trang sẵn có** (Linear: user confirm chứ không điền từ trắng).

---

## A. Data model (code được ngay)

```ts
// supabase: bảng soul_profiles
interface SoulProfile {
  id: string;
  name: string;                    // "Hồn KOL tâm linh", "Hồn builder"
  role: 'kol' | 'builder' | 'educator' | 'seller';   // màn 1
  audience: { description: string; painPoints: string[] }; // màn 2
  voice: {                         // màn 3 — mô phỏng Jasper Tone&Style
    sourcePageIds: string[];       // 3–8 trang trong kho làm mẫu giọng
    aiDescription: string;         // AI tóm tắt giọng, user sửa được
    approvedExcerpts: string[];    // trích đoạn user bật/tắt (Jasper pattern)
  };
  pillars: string[];               // màn 4 — ≤3 trụ, map vào 8 dimension
  defaults: { format: Format; length: 'short'|'medium'|'long'; ctaStyle: string }; // màn 5
  updatedAt: string;
}

interface ContentPreset {          // bảng content_presets
  id: string; profileId: string;
  label: string;                   // "Post hook mạnh cho FB"
  icon: string;
  format: Format; framework?: string; dimension?: Dimension;
  promptOverrides?: Record<string, string>;
  lastUsedAt: string; useCount: number; // sort preset theo tần suất
}
```

Wizard state: reducer đơn giản `{step, draft}` + route `?step=n` (back/forward của browser hoạt động — lợi ích GOV.UK), **auto-save draft mỗi step** vào localStorage + Supabase, Enter = next (Typeform), progress bar "Bước 3/6" (NN/g Transparency).

---

## B. Wizard "Hồ sơ Hồn" — 7 màn, từng màn cụ thể

Layout chung: single-column, 1 câu hỏi to ở giữa (font display, như Typeform), progress mảnh trên cùng, nút "← Quay lại" + "Tiếp tục →", phím Enter.

**Màn 0 — Mở đầu (0 quyết định).** "Akash đã đọc 200 trang của bạn. Trả lời 6 câu để nó viết đúng *hồn* bạn." + estimated time "≈3 phút" (NN/g: báo trước thời lượng). 1 nút: *Bắt đầu*.

**Màn 1 — Vai (1 quyết định).** "Bạn viết với tư cách gì?" — 4 card lớn (KOL / Builder / Người dạy / Người bán), card được AI pre-select sẵn dựa trên phân bố dimension của kho (Linear: opinionated default, user chỉ confirm).

**Màn 2 — Khán giả (1 quyết định).** "Bạn viết cho ai?" — 1 textarea + 3 chip gợi ý sinh từ dữ liệu kho (vd "người 28–35 đang tìm hướng đi"). Click chip = điền vào textarea, sửa tiếp được.

**Màn 3 — Giọng văn (2 quyết định).** Mô phỏng Jasper: (a) "Chọn 3–8 trang nghe *giống bạn nhất*" — list trang kho có checkbox, AI đã tick sẵn 5 trang nó cho là đặc trưng; (b) AI trả về ngay **mô tả giọng** ("thẳng, ấm, hay dùng câu hỏi tu từ…") + 3 trích đoạn bật/tắt → user sửa mô tả hoặc Đồng ý. *(Đây là màn duy nhất 2 bước con — vẫn 1 chủ đề, đúng one-THING-per-page.)*

**Màn 4 — Trụ nội dung (1 quyết định).** "Chọn tối đa 3 trụ" — chip multi-select sinh từ 8 dimension + cluster trang, mỗi chip mang đúng màu dimension cố định của Akash. Đã pre-select 3 trụ có nhiều trang nhất.

**Màn 5 — Mặc định đầu ra (2 quyết định).** (a) Format hay dùng nhất: 4 card (FB post / Thread / Script video / Bài dài); (b) Độ dài: 3 nút radio. Hết — KHÔNG hỏi framework/hook/CTA ở đây; mấy thứ đó là tầng-2 lúc chạy.

**Màn 6 — Chạy thử & lưu (1 quyết định).** Superhuman practice-first: sinh ngay 1 bài mẫu bằng hồ sơ vừa tạo (topic lấy từ trang mới nhất trong kho). Hỏi đúng 1 câu: "Đúng hồn bạn chưa?" → *Lưu Hồ sơ* / *Chỉnh giọng* (quay về màn 3, giữ nguyên các màn khác). Đặt tên hồ sơ ở đây (input pre-fill "Hồn chính").

Tổng: 6 câu hỏi thực — đúng sweet spot Typeform.

---

## C. Màn chạy hằng ngày "Hôm nay tạo gì?" — thay toàn bộ tab hiện tại

Một màn duy nhất, ≤2 quyết định trước khi bấm nút:

```
┌──────────────────────────────────────────────┐
│ Hồn: [Hồn KOL ▾]            + Hồ sơ mới      │  ← dropdown, default = profile dùng gần nhất
│                                              │
│  HÔM NAY TẠO GÌ?                             │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌───────┐  │
│  │ Post   │ │ Thread │ │ Script │ │  ✦    │  │  ← ContentPreset cards, sort theo useCount
│  │ hook   │ │ chuyện │ │ video  │ │ Tự do │  │     (HeyGen template library)
│  │ mạnh   │ │ nghề   │ │ 60s    │ │       │  │
│  └────────┘ └────────┘ └────────┘ └───────┘  │
│                                              │
│  Chủ đề: [ gợi ý: "trang X bạn vừa viết" ▾ ] │  ← optional; bỏ trống = Auto mode
│                                              │     (HeyGen Video Agent: AI tự chọn)
│            [ ⚡ TẠO NGAY ]                    │  ← 1 nút primary duy nhất
│  ▸ Tuỳ chỉnh thêm (framework, 21 câu hỏi…)   │  ← accordion ĐÓNG mặc định = tầng 2
└──────────────────────────────────────────────┘
```

- **Quyết định 1:** chọn preset card (default = preset dùng nhiều nhất, viền sáng sẵn).
- **Quyết định 2 (optional):** topic — input có dropdown gợi ý từ trang mới/Triage; bỏ trống → AI tự chọn từ trụ nội dung (Auto mode kiểu HeyGen).
- **Toàn bộ rừng chip cũ** (framework, ma trận, 21 câu hỏi, dimension, prompt) dọn vào accordion "Tuỳ chỉnh thêm" — tầng disclosure thứ 2 và là tầng CUỐI (NN/g: quá 2 tầng là hỏng). Khi user chỉnh trong đó và bấm "Lưu thành preset mới" → thành 1 card mới.
- **Sau khi generate** mới hiện chip row chỉnh nhanh ngay dưới output: `[Ngắn hơn] [Dài hơn] [Đổi hook] [Giọng mạnh hơn] [Đổi CTA]` — sửa SAU khi thấy kết quả rẻ hơn quyết định TRƯỚC khi thấy gì (giảm số quyết định tiên nghiệm về 0–2).

## D. Thứ tự code
1. Bảng `soul_profiles` + `content_presets` + migration seed 1 profile từ data hiện có.
2. `<SoulWizard/>`: 7 step component + reducer + autosave (1–2 ngày).
3. `<TodayScreen/>` thay tab hiện tại; map chip cũ → accordion + preset (1 ngày).
4. Endpoint `analyze-voice`: nhận pageIds → trả `{aiDescription, excerpts}` (prompt LLM, giống Jasper).
5. Chip row hậu-generate (vài giờ).

## Nguồn
- [NN/g — Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/) · [NN/g — 4 Principles to Reduce Cognitive Load in Forms](https://www.nngroup.com/articles/4-principles-reduce-cognitive-load/)
- [GOV.UK Design Notes — One thing per page](https://designnotes.blog.gov.uk/2015/07/03/one-thing-per-page/) · [Smashing Magazine — One Thing Per Page case study](https://www.smashingmagazine.com/2017/05/better-form-design-one-thing-per-page/)
- [Typeform one-field UX & completion 47.3%](https://startupspells.com/p/typeform-one-field-onboarding-ux-gas-snapchat-duolingo-spotify-signup-conversion) · [Fillout — one-question-at-a-time vs single page](https://www.fillout.com/blog/one-question-at-a-time-form)
- [Jasper Help — Brand Voice](https://help.jasper.ai/hc/en-us/articles/18618693085339-Brand-Voice) · [Jasper Brand Voice complete guide](https://www.the-brand-algorithm.com/jasper-brand-voice-complete-guide/)
- [First Round Review — Superhuman's Onboarding Playbook](https://review.firstround.com/superhuman-onboarding-playbook/) · [Growthmates — Superhuman onboarding lab](https://www.growthmates.news/p/onboarding-lab-how-superhuman-and)
- [Candu — Linear Onboarding Teardown](https://www.candu.ai/blog/linear-onboarding-teardown)
- [HeyGen — Templates guide](https://community.heygen.com/public/resources/how-to-use-templates-in-heygen-to-streamline-video-creation) · [HeyGen — Video Agent](https://community.heygen.com/public/resources/how-to-create-high-quality-videos-in-minutes-with-video-agent)