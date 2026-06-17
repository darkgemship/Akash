// Thêm nhánh SÂU (level 4→7) dưới vài trang lá mỗi kho — để xem graph khi cây sâu hơn. Chạy: node scripts/seed-deep.mjs
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { randomUUID } from 'crypto'

const ORG = 'f07a30d3-c0c6-4209-ae87-74a14a208b28'
const ADMIN = '6fe628df-7d71-4afd-8ef1-9a199b755ac9'
const env = Object.fromEntries(readFileSync(new URL('../web/.env.local', import.meta.url), 'utf8').split('\n').filter(l => l.includes('=')).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
const { error: authErr } = await sb.auth.signInWithPassword({ email: 'ng.hongngoc1196@gmail.com', password: 'DataQi@2026' })
if (authErr) { console.error('AUTH FAIL', authErr.message); process.exit(1) }

// lấy toàn bộ node để tính level + chọn lá làm gốc nhánh sâu
const { data: all, error } = await sb.from('nodes').select('id,layer,kind,parent_id,title,subtype').eq('org_id', ORG)
if (error) { console.error(error.message); process.exit(1) }
const byId = new Map(all.map(n => [n.id, n]))
const levelOf = (id, seen = new Set()) => { const n = byId.get(id); if (!n || n.kind === 'kho' || !n.parent_id || seen.has(id)) return 0; seen.add(id); return 1 + levelOf(n.parent_id, seen) }

const ASPECTS = ['Chi tiết', 'Mở rộng', 'Trường hợp', 'Biến thể', 'Hệ quả', 'Ghi chú', 'Ví dụ con', 'Phản ví dụ']
const ICONS = ['🔹', '▪️', '◦', '·', '🔸']
const rows = []
const BREADTH = { 4: 3, 5: 2, 6: 2, 7: 1 }   // mỗi node ở tầng d sinh BREADTH[d+1] con
let ai = 0
function buildDeep(parentId, layer, owner, depth) {
  if (depth > 7) return
  const n = BREADTH[depth] ?? 0
  for (let i = 0; i < n; i++) {
    const id = randomUUID()
    rows.push({ id, org_id: ORG, owner_id: owner, layer, kind: 'page', parent_id: parentId, title: `${ASPECTS[ai++ % ASPECTS.length]} ${depth}.${i + 1}`, icon: ICONS[depth % ICONS.length], subtype: 'page', status: 'published', min_level: 1 })
    buildDeep(id, layer, owner, depth + 1)
  }
}

for (const layer of ['personal', 'corporate', 'humanity']) {
  const owner = layer === 'personal' ? ADMIN : null
  // chọn 2 lá (level 3) đầu tiên của kho làm gốc nhánh sâu
  const leaves = all.filter(n => n.layer === layer && n.kind === 'page' && levelOf(n.id) === 3).slice(0, 2)
  for (const leaf of leaves) buildDeep(leaf.id, layer, owner, 4)   // con của lá (lv3) = lv4 → … → lv7
  console.log(`${layer}: ${leaves.length} gốc sâu`)
}

// insert theo lô, GIỮ thứ tự (cha trước con — rows đã DFS nên parent luôn trước)
let ok = 0
for (let i = 0; i < rows.length; i += 80) {
  const { error: e } = await sb.from('nodes').insert(rows.slice(i, i + 80))
  if (e) { console.error('✗', e.message); break } else ok += Math.min(80, rows.length - i)
}
console.log(`deep nodes inserted: ${ok}/${rows.length}`)
