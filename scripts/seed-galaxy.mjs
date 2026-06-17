// Nạp data graph SẠCH vào Supabase qua supabase-js (anon + login admin). Chạy: node scripts/seed-galaxy.mjs
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { rows, links, ORG, ADMIN } from './gen-galaxy-sql.mjs'

const env = Object.fromEntries(readFileSync(new URL('../web/.env.local', import.meta.url), 'utf8').split('\n').filter(l => l.includes('=')).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
const { error: authErr } = await sb.auth.signInWithPassword({ email: 'ng.hongngoc1196@gmail.com', password: 'DataQi@2026' })
if (authErr) { console.error('AUTH FAIL', authErr.message); process.exit(1) }

const nodeRows = rows.map(r => ({ id: r.id, org_id: ORG, owner_id: r.owner === 'null' ? null : ADMIN, layer: r.layer, kind: r.kind, parent_id: r.parent, title: r.title, icon: r.icon, subtype: r.sub, status: 'published', min_level: 1 }))
const linkRows = links.map(l => ({ org_id: ORG, from_node: l.from, to_node: l.to, dimension: l.dim, excerpt: l.excerpt, source: 'user', weight: l.excerpt ? 1.5 : 1.0 }))

async function batchInsert(table, data, chunk = 100) {
  let ok = 0
  for (let i = 0; i < data.length; i += chunk) {
    const { error } = await sb.from(table).insert(data.slice(i, i + chunk))
    if (error) { console.error(`✗ ${table} lô ${i}:`, error.message); return ok }
    ok += Math.min(chunk, data.length - i)
  }
  return ok
}

// nodes phải insert THEO THỨ TỰ cha trước con (rows đã đúng thứ tự branch→topic→leaf). Insert tuần tự từng lô giữ thứ tự.
const nOk = await batchInsert('nodes', nodeRows)
console.log(`nodes inserted: ${nOk}/${nodeRows.length}`)
const lOk = await batchInsert('links', linkRows)
console.log(`links inserted: ${lOk}/${linkRows.length}`)
process.exit(nOk === nodeRows.length && lOk === linkRows.length ? 0 : 1)
