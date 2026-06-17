// admin-create-user — Admin cấp tài khoản (email + mật khẩu) cho thành viên. KHÔNG cho tự đăng ký.
// Bảo mật: xác thực JWT người gọi → phải là Admin (level 5) → dùng SERVICE ROLE tạo user + membership cùng org.
// Gọi từ app: supabase.functions.invoke('admin-create-user', { body: { email, password, role } })
import { createClient } from 'jsr:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const sb = createClient(SUPABASE_URL, SERVICE)

    // 1) xác thực người gọi
    const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
    if (!jwt) return json(401, { error: 'Chưa đăng nhập' })
    const { data: u } = await sb.auth.getUser(jwt)
    const caller = u?.user
    if (!caller) return json(401, { error: 'Phiên không hợp lệ' })

    // 2) phải là ADMIN (level 5)
    const { data: m } = await sb.from('memberships').select('org_id, level').eq('user_id', caller.id).maybeSingle()
    if (!m || (m.level ?? 0) < 5) return json(403, { error: 'Chỉ Admin được cấp tài khoản' })

    // 3) dữ liệu
    const body = await req.json().catch(() => ({} as Record<string, unknown>))
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')
    const role = String(body.role ?? 'member')   // 'member' | 'editor' | 'chief'
    if (!email || !email.includes('@')) return json(400, { error: 'Email không hợp lệ' })
    if (password.length < 6) return json(400, { error: 'Mật khẩu cần ≥ 6 ký tự' })

    // 4) tạo user (đã xác nhận sẵn, không cần email confirm)
    const { data: created, error: ce } = await sb.auth.admin.createUser({ email, password, email_confirm: true })
    if (ce || !created?.user) return json(400, { error: ce?.message ?? 'Không tạo được tài khoản (email có thể đã tồn tại)' })

    // 5) gắn vào ORG của admin với vai tương ứng
    const lv = role === 'chief' ? 4 : role === 'editor' ? 2 : 1
    const can_edit = role === 'editor' || role === 'chief'
    const can_approve = role === 'chief'
    const { error: me } = await sb.from('memberships').insert({ org_id: m.org_id, user_id: created.user.id, level: lv, can_edit, can_approve })
    if (me) return json(500, { error: 'Đã tạo user nhưng gắn vai lỗi: ' + me.message, user_id: created.user.id })

    return json(200, { ok: true, user_id: created.user.id, email, role })
  } catch (e) {
    return json(500, { error: String((e as Error)?.message ?? e) })
  }
})
