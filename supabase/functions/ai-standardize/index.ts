// ai-standardize — Studio Stage 3: chuẩn hoá bài viết bằng Claude Haiku ("cắm key là chạy").
// ĐÃ DEPLOY (project data QI). Xử lý hàng đợi ai_jobs(kind='ingest_to_template'): đọc bản thô →
// viết lại theo template → ghi nodes.md (trigger chunk_on_md tự băm lại). Cần Edge secret ANTHROPIC_API_KEY.
// Model Haiku theo docs/DECISIONS.md (khâu chuẩn hoá Studio = Haiku, rẻ). Gọi: POST /functions/v1/ai-standardize {limit?}
import Anthropic from 'npm:@anthropic-ai/sdk'
import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const KEY = Deno.env.get('ANTHROPIC_API_KEY')
  const sb = createClient(SUPABASE_URL, SERVICE)
  const body = await req.json().catch(() => ({} as Record<string, unknown>))
  const limit = Math.min(20, Number(body.limit) || 5)

  const { data: jobs, error } = await sb.from('ai_jobs').select('id, input').eq('kind', 'ingest_to_template').eq('status', 'queued').limit(limit)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!jobs || jobs.length === 0) return Response.json({ done: 0, note: 'không có job chờ' })
  if (!KEY) return Response.json({ skipped: true, reason: 'CHƯA cắm ANTHROPIC_API_KEY (Supabase Edge secret)', pending: jobs.length })

  const anthropic = new Anthropic({ apiKey: KEY })
  const SYS = 'Bạn là biên tập viên chuẩn hoá nội dung tri thức (tiếng Việt) cho app Akash. Nhận BẢN THÔ (gồm khung template các mục ## và phần "Nội dung gốc") và viết lại thành bài CHUẨN, mạch lạc: điền các mục ## theo template từ thông tin trong nội dung gốc, giữ giọng & ý của người viết, KHÔNG bịa số liệu/sự kiện không có. Trả về MARKDOWN THUẦN (giữ heading ## của template), KHÔNG thêm dòng tiêu đề "#" (trang đã có title riêng), không thêm lời dẫn trước/sau.'
  let done = 0
  for (const job of jobs) {
    const nodeId = (job.input as { node_id?: string } | null)?.node_id
    if (!nodeId) { await sb.from('ai_jobs').update({ status: 'error', output: { error: 'thiếu node_id' } }).eq('id', job.id); continue }
    const { data: n } = await sb.from('nodes').select('title, md, layer').eq('id', nodeId).maybeSingle()
    if (!n || !n.md || String(n.md).trim().length < 20) { await sb.from('ai_jobs').update({ status: 'error', output: { error: 'trang không đủ nội dung' } }).eq('id', job.id); continue }
    try {
      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 4000,
        system: SYS,
        messages: [{ role: 'user', content: `Tiêu đề: ${n.title ?? ''}\nKho: ${n.layer}\n\nBẢN THÔ cần chuẩn hoá:\n\n${n.md}` }],
      })
      const out = msg.content.filter((b) => b.type === 'text').map((b) => (b as { text: string }).text).join('\n').trim()
      if (out) {
        await sb.from('nodes').update({ md: out, content: null }).eq('id', nodeId)
        await sb.from('ai_jobs').update({ status: 'done', output: { chars: out.length }, tokens: msg.usage.input_tokens + msg.usage.output_tokens }).eq('id', job.id)
        done++
      } else await sb.from('ai_jobs').update({ status: 'error', output: { error: 'AI trả rỗng' } }).eq('id', job.id)
    } catch (e) {
      await sb.from('ai_jobs').update({ status: 'error', output: { error: String((e as Error)?.message || e) } }).eq('id', job.id)
    }
  }
  return Response.json({ done, processed: jobs.length })
})
