// Sinh SQL tạo lại data SẠCH cho graph Akash — cây hình tháp cân đối + link 8 chiều.
// Chạy: node scripts/gen-galaxy-sql.mjs > scripts/galaxy-seed.sql
import { randomUUID } from 'crypto'

const ORG = 'f07a30d3-c0c6-4209-ae87-74a14a208b28'
const ADMIN = '6fe628df-7d71-4afd-8ef1-9a199b755ac9'
const KHO = { personal: '6df30ac3-a5a5-40ea-b054-e25f839cf7f0', corporate: 'eeb10fef-8848-452b-9b7f-f2f46706fe79', humanity: '0032a21c-b9db-4b6e-8239-b6ce69bdf6f2' }
const DIMS = ['knowledge', 'experience', 'emotion', 'time', 'people', 'values', 'anchor', 'reference']

// ───────────────── TAXONOMY: mỗi kho = nhánh (L1) → chủ đề (L2) → trang lá (L3) ─────────────────
// Mỗi nhánh: { t: tên, ic: icon, subs: [ [tên chủ đề, ic, [lá...]] ... ] }
const TREE = {
  personal: [
    ['Tuổi thơ & Gốc rễ', '🌱', [
      ['Gia đình & cội nguồn', '🏡', ['Ông bà & dòng họ', 'Ký ức tuổi thơ', 'Bài học từ cha mẹ']],
      ['Quê hương', '🌾', ['Nơi tôi lớn lên', 'Món ăn tuổi thơ']],
      ['Tính cách hình thành', '🧩', ['Tôi là ai', 'Điểm mạnh bẩm sinh', 'Nỗi sợ đầu đời']],
    ]],
    ['Học vấn & Tri thức', '🎓', [
      ['Hành trình học', '📖', ['Trường lớp', 'Người thầy đầu tiên', 'Vấp ngã khi học']],
      ['Cách tôi học', '🧠', ['Đọc sách', 'Ghi chú & hệ thống', 'Học từ thất bại']],
      ['Kỹ năng nền', '🛠️', ['Tư duy phản biện', 'Viết & diễn đạt']],
    ]],
    ['Sự nghiệp & Công việc', '💼', [
      ['Khởi đầu', '🚀', ['Công việc đầu tiên', 'Sếp đầu tiên', 'Bài học vỡ lòng']],
      ['Bước ngoặt', '🔀', ['Lần nghỉ việc', 'Dấn thân khởi nghiệp', 'Thất bại lớn nhất']],
      ['Giá trị nghề', '⭐', ['Vì sao tôi làm', 'Đỉnh cao đã đạt']],
    ]],
    ['Tình thân & Quan hệ', '❤️', [
      ['Bạn đời', '💍', ['Gặp gỡ', 'Khủng hoảng & hàn gắn']],
      ['Bạn bè & cố vấn', '🤝', ['Người thay đổi tôi', 'Cố vấn dẫn đường']],
      ['Con cái', '🧒', ['Lần đầu làm cha mẹ', 'Dạy con điều gì']],
    ]],
    ['Sức khoẻ & Thân tâm', '🧘', [
      ['Thân thể', '💪', ['Khủng hoảng sức khoẻ', 'Thói quen tập luyện']],
      ['Tâm trí', '🌬️', ['Lo âu & vượt qua', 'Thiền & tĩnh lặng', '10 ngày Vipassana']],
    ]],
    ['Tài chính & Tự do', '💰', [
      ['Quan hệ với tiền', '🪙', ['Bài học tiền đầu đời', 'Nợ & khủng hoảng']],
      ['Đầu tư', '📊', ['Triết lý đầu tư', 'Sai lầm tài chính']],
      ['Tự do', '🕊️', ['Định nghĩa đủ', 'Tự do tài chính nghĩa là']],
    ]],
    ['Tâm linh & Ý nghĩa', '✨', [
      ['Niềm tin', '🙏', ['Khủng hoảng hiện sinh', 'Điều tôi tin']],
      ['Ý nghĩa sống', '🧭', ['Ikigai của tôi', 'Di sản muốn để lại', 'Câu hỏi lớn']],
    ]],
  ],
  corporate: [
    ['Sản phẩm & Giải pháp', '📦', [
      ['Dòng sản phẩm', '🧴', ['HomePure', 'Nutriverse', 'Physio Radiance']],
      ['Định vị', '🎯', ['Vấn đề giải quyết', 'Khác biệt cạnh tranh']],
    ]],
    ['Kiến thức nền tảng', '📚', [
      ['Mô hình kinh doanh', '🏗️', ['Network marketing là gì', 'Thu nhập thụ động', 'Đòn bẩy hệ thống']],
      ['Sản phẩm & khoa học', '🔬', ['Công nghệ lõi', 'Chứng nhận & nghiên cứu']],
    ]],
    ['Kỹ năng bán hàng', '🤝', [
      ['Tư duy bán', '💡', ['Bán là phục vụ', 'Vượt qua từ chối', 'Lắng nghe nhu cầu']],
      ['Quy trình', '📋', ['Tiếp cận', 'Trình bày', 'Chốt đơn', 'Chăm sóc sau bán']],
      ['Công thức nội dung', '✍️', ['Hook mạnh', 'Storytelling', 'Call to action']],
    ]],
    ['Lãnh đạo & Đội nhóm', '👑', [
      ['Xây đội', '🧑‍🤝‍🧑', ['Tuyển & dìu dắt', 'Văn hoá đội nhóm']],
      ['Phát triển bản thân', '🌟', ['Kỷ luật', 'Quản lý thời gian', 'Tư duy lãnh đạo']],
    ]],
    ['Văn hoá & Giá trị', '🏛️', [
      ['Giá trị cốt lõi', '💎', ['Chính trực', 'Phụng sự', 'Bền bỉ']],
      ['Tầm nhìn', '🔭', ['Sứ mệnh QNET', 'Mục tiêu 2026']],
    ]],
    ['Câu chuyện & Case study', '📈', [
      ['Thành công', '🏆', ['Thủ lĩnh tỷ phú', 'Từ con số 0', 'Vượt khủng hoảng']],
      ['Bài học thất bại', '📉', ['Sai lầm thường gặp', 'Khi mất động lực']],
    ]],
  ],
  humanity: [
    ['Triết học & Minh triết', '🧠', [
      ['Khắc kỷ', '🏛️', ['Marcus Aurelius', 'Epictetus', 'Seneca']],
      ['Phương Đông', '☯️', ['Lão Tử & Vô vi', 'Thiền tông', 'Khổng Tử']],
      ['Hiện sinh', '🌀', ['Nietzsche', 'Ý nghĩa cuộc sống', 'Tự do & trách nhiệm']],
    ]],
    ['Tâm lý & Hành vi', '🫀', [
      ['Nhận thức', '🧩', ['Thiên kiến nhận thức', 'Hệ thống 1 & 2', 'Dopamine']],
      ['Động lực', '🔥', ['Tháp Maslow', 'Flow', 'Thói quen nguyên tử']],
      ['Quan hệ', '🤲', ['Thuyết gắn bó', 'Trí tuệ cảm xúc']],
    ]],
    ['Kinh tế & Kinh doanh', '💹', [
      ['Nguyên lý', '⚖️', ['Cung cầu', 'Lãi kép', 'Lợi thế cạnh tranh']],
      ['Đầu tư & tài chính', '🏦', ['Munger & mô hình tư duy', 'Giá trị nội tại', 'Quản trị rủi ro']],
      ['Đổi mới', '💡', ['Đổi mới sáng tạo', 'Hiệu ứng mạng lưới']],
    ]],
    ['Khoa học & Tự nhiên', '🔬', [
      ['Vũ trụ', '🌌', ['Big Bang', 'Vật lý lượng tử']],
      ['Sự sống', '🧬', ['Tiến hoá', 'Bộ não con người', 'Di truyền']],
      ['Tư duy khoa học', '🧪', ['Phương pháp khoa học', 'Xác suất & thống kê']],
    ]],
    ['Lịch sử & Văn minh', '🏺', [
      ['Cách mạng', '⚙️', ['Cách mạng nông nghiệp', 'Cách mạng công nghiệp', 'Gutenberg & in ấn']],
      ['Bài học lịch sử', '📜', ['Sự sụp đổ của đế chế', 'Chu kỳ lịch sử']],
      ['Văn minh', '🌍', ['Sapiens', 'Trật tự thế giới']],
    ]],
    ['Nghệ thuật & Sáng tạo', '🎨', [
      ['Sáng tạo', '🖌️', ['Quá trình sáng tạo', 'Đánh cắp như nghệ sĩ']],
      ['Kể chuyện', '🎭', ['Hành trình anh hùng', 'Cấu trúc 3 hồi']],
      ['Cái đẹp', '🌸', ['Wabi-sabi', 'Tối giản']],
    ]],
  ],
}

const ICON_LEAF = ['📄', '📝', '💭', '🔖', '📌', '🗒️']
const ASPECTS = ['Khái niệm cốt lõi', 'Ví dụ thực tế', 'Bài học rút ra', 'Câu hỏi mở', 'Ứng dụng', 'Góc nhìn phản biện', 'Trích dẫn hay', 'Liên hệ bản thân', 'Sai lầm thường gặp']
const TARGET = { personal: 99, corporate: 89, humanity: 99 }   // số node con/kho (kho L0 giữ riêng) → tổng 100/90/100
const rows = []  // node rows
const links = []
const leavesByLayer = { personal: [], corporate: [], humanity: [] }
const topicsByLayer = { personal: [], corporate: [], humanity: [] }  // {id, title, owner} để pad thêm lá theo khía cạnh

let li = 0
const pickIcon = () => ICON_LEAF[(li++) % ICON_LEAF.length]

for (const layer of Object.keys(TREE)) {
  const owner = layer === 'personal' ? `'${ADMIN}'` : 'null'
  for (const [bt, bic, subs] of TREE[layer]) {
    const bid = randomUUID()
    // mọi node = 'page' (kể cả nhánh/chủ đề) → có Properties + footer + thẩm thấu; vẫn chứa con qua parent_id. (KHÔNG dùng 'folder' vì folder bị coi là container, ẩn các phần đó)
    rows.push({ id: bid, layer, kind: 'page', parent: KHO[layer], title: bt, icon: bic, owner, sub: 'branch' })
    for (const [st, sic, leaves] of subs) {
      const sid = randomUUID()
      rows.push({ id: sid, layer, kind: 'page', parent: bid, title: st, icon: sic, owner, sub: 'topic' })
      topicsByLayer[layer].push({ id: sid, title: st, owner })
      for (const lt of leaves) {
        const lid = randomUUID()
        rows.push({ id: lid, layer, kind: 'page', parent: sid, title: lt, icon: pickIcon(), owner, sub: 'page' })
        leavesByLayer[layer].push(lid)
      }
    }
  }
  // PAD: thêm lá theo khía cạnh dưới các topic (round-robin) cho đủ TARGET — đúng ý "hiểu 1 chủ đề ở nhiều khía cạnh"
  const containers = rows.filter(r => r.layer === layer && r.sub !== 'page').length
  let need = TARGET[layer] - containers - leavesByLayer[layer].length
  let ai = 0, ti = 0
  const tps = topicsByLayer[layer]
  while (need > 0 && tps.length) {
    const tp = tps[ti % tps.length]; ti++
    const aspect = ASPECTS[ai % ASPECTS.length]; if (ti % tps.length === 0) ai++
    const lid = randomUUID()
    rows.push({ id: lid, layer, kind: 'page', parent: tp.id, title: `${tp.title} — ${aspect}`, icon: pickIcon(), owner: tp.owner, sub: 'page' })
    leavesByLayer[layer].push(lid); need--
  }
}

// ───────────────── LINKS 8 CHIỀU: lá ↔ lá, 65% cùng kho · 35% xuyên kho. Một số có quote (excerpt) ─────────────────
// PRNG deterministic (không Math.random để chạy lại giống nhau)
let seed = 1234567
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }
const pick = (a) => a[Math.floor(rnd() * a.length)]
const allLeaves = [...leavesByLayer.personal, ...leavesByLayer.corporate, ...leavesByLayer.humanity]
const layerOfLeaf = new Map()
for (const L of Object.keys(leavesByLayer)) for (const id of leavesByLayer[L]) layerOfLeaf.set(id, L)
// trọng số chiều: knowledge/reference/people hay gặp hơn
const DIM_BAG = ['knowledge', 'knowledge', 'knowledge', 'reference', 'reference', 'people', 'people', 'values', 'experience', 'emotion', 'time', 'anchor']
const QUOTES = ['"Điều quan trọng không phải bạn nhìn gì, mà bạn thấy gì."', '"Kỷ luật là tự do."', '"Gieo thói quen, gặt số phận."', '"Biết mình là khởi đầu của trí tuệ."', '"Chậm mà chắc."']
const seen = new Set()
for (const from of allLeaves) {
  const nOut = rnd() < 0.55 ? (rnd() < 0.3 ? 2 : 1) : 0
  for (let k = 0; k < nOut; k++) {
    const sameKho = rnd() < 0.65
    let pool = sameKho ? leavesByLayer[layerOfLeaf.get(from)] : allLeaves
    const to = pick(pool)
    if (to === from) continue
    const key = from < to ? from + to : to + from
    if (seen.has(key + k)) continue; seen.add(key + k)
    const dim = pick(DIM_BAG)
    const hasQuote = rnd() < 0.3
    links.push({ from, to, dim, excerpt: hasQuote ? pick(QUOTES) : null })
  }
}

// ───────────────── EMIT SQL ─────────────────
const q = (s) => s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`
const childIdsSql = `(select id from nodes where org_id='${ORG}' and kind<>'kho')`
let sql = ''
sql += `-- AUTO-GEN ${rows.length} nodes + ${links.length} links · cây cân đối 7/6/6 nhánh\nbegin;\n`
// xoá phụ thuộc rồi xoá node con (giữ 3 kho)
sql += `delete from links where org_id='${ORG}';\n`
for (const t of ['wisdom_depth', 'page_comments', 'open_questions', 'node_versions', 'node_groups'])
  sql += `delete from ${t} where node_id in ${childIdsSql};\n`
sql += `delete from content_results where org_id='${ORG}';\n`
sql += `delete from assignments where org_id='${ORG}';\n`
sql += `update events set node_id=null where node_id in ${childIdsSql};\n`
sql += `delete from nodes where org_id='${ORG}' and kind<>'kho';\n`
// insert nodes (cha trước con: rows đã theo thứ tự branch→topic→leaf nên parent luôn có trước)
const vals = rows.map(r => `(${q(r.id)}, '${ORG}', ${r.owner}, '${r.layer}', '${r.kind}', ${q(r.parent)}, ${q(r.title)}, ${q(r.icon)}, ${q(r.sub)}, 'published', 1, now(), now())`)
sql += `insert into nodes (id, org_id, owner_id, layer, kind, parent_id, title, icon, subtype, status, min_level, created_at, updated_at) values\n${vals.join(',\n')};\n`
// insert links
const lvals = links.map(l => `('${ORG}', ${q(l.from)}, ${q(l.to)}, '${l.dim}'::link_dim, ${q(l.excerpt)}, 'user', ${l.excerpt ? 1.5 : 1.0})`)
sql += `insert into links (org_id, from_node, to_node, dimension, excerpt, source, weight) values\n${lvals.join(',\n')};\n`
sql += `commit;\n`

export { rows, links, ORG, ADMIN }
// chỉ in SQL khi chạy trực tiếp (không phải khi được import bởi runner)
if (process.argv[1] && process.argv[1].endsWith('gen-galaxy-sql.mjs')) {
  process.stdout.write(sql)
  console.error(`nodes=${rows.length} links=${links.length} personal=${leavesByLayer.personal.length} corp=${leavesByLayer.corporate.length} hum=${leavesByLayer.humanity.length}`)
}
