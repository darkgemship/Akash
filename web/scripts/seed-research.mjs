// Seed kết quả deep-research vào DB Akash — chạy: cd web && node ../scripts/seed-research.mjs
// Đọc output workflow (JSON), đăng nhập acc admin, insert nodes qua supabase-js (RLS thật).
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const OUT = '/private/tmp/claude-501/-Users-nguyenvanhongngoc-Desktop-Data-Qi/e0104f47-3964-4a35-ad57-46aee638d586/tasks/w64aocuiy.output'
const env = Object.fromEntries(readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n').filter(l => l.includes('=')).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

const ORG = 'f07a30d3-c0c6-4209-ae87-74a14a208b28'
const ADMIN = '6fe628df-7d71-4afd-8ef1-9a199b755ac9'
const KHO_CORP = 'eeb10fef-8848-452b-9b7f-f2f46706fe79'
const HUM_HUBS = {
  'Dòng thời gian': 'bbbb2222-0000-4000-8000-000000000001',
  'Thế giới': 'bbbb2222-0000-4000-8000-000000000002',
  'Minh triết': 'bbbb2222-0000-4000-8000-000000000003',
  'Con người': 'bbbb2222-0000-4000-8000-000000000004',
  'Kinh tế': 'bbbb2222-0000-4000-8000-000000000005',
  'Người thầy': 'bbbb2222-0000-4000-8000-000000000006',
}
const QNET_SECTIONS = { A: '2f50272d-461b-4169-a57f-cc4dbbac0112', B: '3e26cb2c-5d83-419c-876f-9873365772ef', C: 'd0da5a7b-c026-48e4-ad77-7ec7b1e99115', D: '7090ec81-7b2c-43c6-a2d1-706c9509e4c3', E: 'c115b4d1-d85c-4853-bea4-7c071af606c0', F: '08eab7d5-86fe-4adc-8f1a-b3cacc5b0dab' }
const PT_LABEL = { 'trai-nghiem': '🌱 Trải nghiệm', 'bai-hoc': '🎓 Bài học', 'quy-trinh': '📋 Quy trình', 'ho-so': '👤 Hồ sơ', 'nguon': '📚 Nguồn', 'su-kien': '🌟 Sự kiện / Mốc', 'cau-hoi-mo': '❓ Câu hỏi mở' }

const raw = JSON.parse(readFileSync(OUT, 'utf8'))
const R = raw.result ?? raw
const { error: authErr } = await sb.auth.signInWithPassword({ email: 'ng.hongngoc1196@gmail.com', password: 'DataQi@2026' })
if (authErr) { console.error('AUTH FAIL', authErr.message); process.exit(1) }

let ok = 0, fail = 0
async function ins(row) {
  const { error } = await sb.from('nodes').insert(row)
  if (error) { fail++; console.error('✗', row.title?.slice(0, 40), '—', error.message) } else ok++
}
const head = (pt, summary, source) => `**Loại:** ${PT_LABEL[pt] ?? pt} · **Campaign:** —\n\n**Tóm tắt 1 câu:** ${summary}\n\n**Nguồn:** ${source}`
const firstSentence = (md) => (md.replace(/[#*>`]/g, '').split(/[.!?\n]/).map(s => s.trim()).find(s => s.length > 20) ?? '').slice(0, 160)

// ---------- 1. KHO NHÂN LOẠI ----------
for (const br of R.humanity?.branches ?? []) {
  const hubId = Object.entries(HUM_HUBS).find(([k]) => br.key.includes(k))?.[1]
  if (!hubId) { console.error('? nhánh không khớp:', br.key); continue }
  let pos = 10
  for (const pg of br.pages) {
    await ins({
      org_id: ORG, owner_id: ADMIN, layer: 'humanity', kind: 'page', parent_id: hubId,
      title: pg.title, icon: pg.icon || '📄', status: 'published', min_level: 1, position: pos++,
      event_date: pg.event_date || null,
      props: { page_type: pg.page_type, via: 'seed-research' },
      md: `${head(pg.page_type, firstSentence(pg.md), (pg.sources ?? []).slice(0, 2).join(' · ') || 'tổng hợp có kiểm chứng')}\n\n${pg.md}`,
    })
  }
}

// ---------- 2. KHO QNET ----------
let qpos = 20
for (const pg of R.qnet?.pages ?? []) {
  const parent = QNET_SECTIONS[pg.section?.trim()?.[0]?.toUpperCase()] ?? KHO_CORP
  await ins({
    org_id: ORG, owner_id: ADMIN, layer: 'corporate', kind: 'page', parent_id: parent,
    title: pg.title, icon: pg.icon || '📄', status: 'published', min_level: 1, position: qpos++,
    props: { page_type: 'nguon', via: 'seed-research' },
    md: `${head('nguon', firstSentence(pg.md), (pg.sources ?? []).slice(0, 2).join(' · ') || 'thông tin công khai')}\n\n${pg.md}`,
  })
}

// ---------- 3. KOL FEED (corporate, subtype kol) ----------
const KOL_HOME = 'dddd4444-0000-4000-8000-000000000001'
await ins({ id: KOL_HOME, org_id: ORG, owner_id: ADMIN, layer: 'corporate', kind: 'page', parent_id: KHO_CORP, title: 'KOL Feed', icon: '🌟', subtype: 'kol_home', status: 'published', min_level: 1, position: 90, md: '**Loại:** 🌟 Khu hệ thống\n\nDòng tin người khổng lồ — đọc, rút insight, bỏ vào kho, đưa qua Xưởng content. Editor thêm bài bằng cách tạo trang con.' })
for (const [who, data] of [['steve-jobs', R.jobs], ['bill-gates', R.gates]]) {
  if (!data) continue
  await ins({
    org_id: ORG, owner_id: ADMIN, layer: 'corporate', kind: 'page', parent_id: KOL_HOME,
    title: `Hồ sơ: ${data.profile.name}`, icon: '🏛️', subtype: 'kol_profile', status: 'published', min_level: 1, position: who === 'steve-jobs' ? 1 : 2,
    props: { page_type: 'ho-so', kol: who, key_lessons: data.profile.key_lessons, via: 'seed-research' },
    md: `${head('ho-so', `Hồ sơ ${data.profile.name} — tiểu sử + bài học cốt lõi.`, 'Wikipedia & nguồn dẫn trong bài')}\n\n${data.profile.bio_md}\n\n## 💎 Bài học cốt lõi\n${data.profile.key_lessons.map(l => `- ${l}`).join('\n')}`,
  })
  let p = 10
  for (const post of data.posts) {
    await ins({
      org_id: ORG, owner_id: ADMIN, layer: 'corporate', kind: 'page', parent_id: KOL_HOME,
      title: post.title, icon: who === 'steve-jobs' ? '🍎' : '🪟', subtype: 'kol_post', status: 'published', min_level: 1, position: (who === 'steve-jobs' ? 100 : 200) + p++,
      event_date: post.year ? `${post.year.match(/\d{4}/)?.[0] ?? '2000'}-01-01` : null,
      props: { page_type: 'nguon', kol: who, image_url: post.image_url, image_credit: post.image_credit, year: post.year, insight: post.insight, quote: post.quote || '', sources: post.sources, via: 'seed-research' },
      md: `${head('nguon', post.insight.slice(0, 160), (post.sources ?? []).slice(0, 2).join(' · '))}\n\n${post.body_md}\n\n## 💎 Insight\n${post.insight}${post.quote ? `\n\n## 💬 Quote\n> ${post.quote}` : ''}\n\n*Ảnh: ${post.image_credit}*`,
    })
  }
}

// ---------- 4. THƯ VIỆN VIRAL (corporate, cho Xưởng content) ----------
const VIRAL_HOME = 'dddd4444-0000-4000-8000-000000000002'
await ins({ id: VIRAL_HOME, org_id: ORG, owner_id: ADMIN, layer: 'corporate', kind: 'page', parent_id: KHO_CORP, title: 'Thư viện viral', icon: '🧨', subtype: 'viral_home', status: 'published', min_level: 1, position: 91, md: '**Loại:** 🧨 Khu hệ thống\n\nKho framework content: hooks, kịch bản, công thức title — Xưởng content đọc từ đây.' })
const hooksByCat = {}
for (const h of R.hooks?.hooks ?? []) (hooksByCat[h.category] ??= []).push(h.text_vi)
let vp = 1
await ins({
  org_id: ORG, owner_id: ADMIN, layer: 'corporate', kind: 'page', parent_id: VIRAL_HOME,
  title: `${(R.hooks?.hooks ?? []).length} mẫu câu Hook`, icon: '🪝', subtype: 'viral_hooks', status: 'published', min_level: 1, position: vp++,
  props: { page_type: 'quy-trinh', hooks: R.hooks?.hooks ?? [], via: 'seed-research' },
  md: `${head('quy-trinh', 'Thư viện hook mở đầu giữ chân người xem — điền vào chỗ trống là dùng được.', 'tổng hợp copywriting có kiểm chứng')}\n\n${Object.entries(hooksByCat).map(([cat, hs]) => `## ${cat}\n${hs.map(h => `- ${h}`).join('\n')}`).join('\n\n')}`,
})
for (const s of R.hooks?.scripts ?? []) {
  await ins({
    org_id: ORG, owner_id: ADMIN, layer: 'corporate', kind: 'page', parent_id: VIRAL_HOME,
    title: `Kịch bản: ${s.name}`, icon: '🎬', subtype: 'viral_script', status: 'published', min_level: 1, position: vp++,
    props: { page_type: 'quy-trinh', use_case: s.use_case, via: 'seed-research' },
    md: `${head('quy-trinh', s.use_case.slice(0, 160), 'framework content chuẩn ngành')}\n\n${s.structure_md}`,
  })
}
await ins({
  org_id: ORG, owner_id: ADMIN, layer: 'corporate', kind: 'page', parent_id: VIRAL_HOME,
  title: `${(R.hooks?.title_formulas ?? []).length} công thức Title viral`, icon: '✨', subtype: 'viral_titles', status: 'published', min_level: 1, position: vp++,
  props: { page_type: 'quy-trinh', formulas: R.hooks?.title_formulas ?? [], via: 'seed-research' },
  md: `${head('quy-trinh', 'Công thức đặt tiêu đề khiến người ta phải bấm vào.', 'tổng hợp copywriting')}\n\n${(R.hooks?.title_formulas ?? []).map(t => `- **${t.formula_vi}**\n  - vd: ${t.example_vi}`).join('\n')}`,
})

// ---------- 5. 21 CÂU HỎI BRAND VOICE (node config cho Content Engine) ----------
await ins({
  org_id: ORG, owner_id: ADMIN, layer: 'corporate', kind: 'page', parent_id: VIRAL_HOME,
  title: '21 câu hỏi khai mở giọng thương hiệu', icon: '🎙️', subtype: 'brand_questions', status: 'published', min_level: 1, position: vp++,
  props: { page_type: 'quy-trinh', questions: R.brandq?.questions ?? [], via: 'seed-research' },
  md: `${head('quy-trinh', 'Bộ 21 câu hỏi Akash dùng phỏng vấn user để hiểu và khai thác giá trị của họ.', 'McAdams LSI · StoryBrand · VIA · NN/g tone dimensions')}\n\n${(R.brandq?.questions ?? []).map((q, i) => `## ${i + 1}. ${q.q_vi}\n*Vì sao:* ${q.why_vi}\n*Đổ vào:* ${q.maps_to}`).join('\n\n')}`,
})

console.log(`DONE ok=${ok} fail=${fail}`)
process.exit(fail > 5 ? 1 : 0)
