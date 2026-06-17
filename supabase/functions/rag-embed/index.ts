// rag-embed — Stage 2: embed các chunk chưa có vector ("cắm key là chạy").
// ĐÃ DEPLOY lên Supabase (project data QI) qua MCP. Cần Edge secret OPENAI_API_KEY
// (model text-embedding-3-small, 1536 chiều). Chưa có key → trả {skipped:true}.
// Gọi: POST /functions/v1/rag-embed  body {limit?:number}  (Authorization: Bearer <jwt admin | service key>)
import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const OPENAI = Deno.env.get('OPENAI_API_KEY')
  const sb = createClient(SUPABASE_URL, SERVICE)
  const body = await req.json().catch(() => ({} as Record<string, unknown>))
  const limit = Math.min(200, Number(body.limit) || 100)

  const { data: chunks, error } = await sb.from('chunks').select('id, text').is('embedding', null).limit(limit)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!chunks || chunks.length === 0) return Response.json({ embedded: 0, remaining: 0, note: 'không còn chunk cần embed' })
  if (!OPENAI) return Response.json({ skipped: true, reason: 'CHƯA cắm OPENAI_API_KEY (Supabase Edge secret)', pending: chunks.length })

  let done = 0
  for (let i = 0; i < chunks.length; i += 20) {
    const batch = chunks.slice(i, i + 20)
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: batch.map((c: { text: string }) => c.text) }),
    })
    if (!res.ok) return Response.json({ error: 'OpenAI ' + res.status + ' ' + (await res.text()).slice(0, 200), done }, { status: 502 })
    const json = await res.json()
    for (let j = 0; j < batch.length; j++) {
      await sb.from('chunks').update({ embedding: json.data[j].embedding }).eq('id', batch[j].id)
      done++
    }
  }
  const { count } = await sb.from('chunks').select('id', { count: 'exact', head: true }).is('embedding', null)
  return Response.json({ embedded: done, remaining: count ?? 0 })
})
