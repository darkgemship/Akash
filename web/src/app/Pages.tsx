'use client'
import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import { depthScore } from './Digest'
import { DIM_COLOR } from './Galaxy'

type N = { id: string; title: string | null; kind: string; parent_id: string | null }

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-white/5 border border-white/10 p-5 ${className}`}>{children}</div>
}
function Lbl({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2 font-semibold">{children}</div>
}

/* ---------- PROFILE (đổi mật khẩu thật + quản trị thành viên) ---------- */
const ROLE_NAME: Record<number, string> = { 5: '👑 Admin', 4: '✅ Tổng biên tập', 3: '✏️ Biên tập viên', 2: '🤝 Cộng tác viên', 1: '👤 Thành viên' }

type Member = { user_id: string; email: string; full_name: string | null; level: number; can_edit: boolean; can_approve: boolean }

function MembersAdmin({ me }: { me: string }) {
  const [members, setMembers] = useState<Member[] | null>(null)
  const [msg, setMsg] = useState('')
  function load() { supabase.rpc('admin_list_members').then(({ data, error }) => { if (!error) setMembers((data as Member[]) ?? []) }) }
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  if (!members) return null // không phải admin → ẩn
  async function setMember(m: Member, patch: Partial<Member>) {
    const next = { ...m, ...patch }
    const { error } = await supabase.rpc('admin_set_member', { p_user: m.user_id, p_level: next.level, p_can_edit: next.can_edit, p_can_approve: next.can_approve })
    setMsg(error ? '⚠️ ' + error.message : '✅ Đã cập nhật quyền')
    load()
  }
  return (
    <Card className="mb-4">
      <Lbl>👑 Quản trị thành viên ({members.length})</Lbl>
      <div className="space-y-2">
        {members.map(m => (
          <div key={m.user_id} className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2 flex-wrap">
            <div className="flex-1 min-w-[140px]">
              <div className="text-sm font-medium truncate">{m.full_name || m.email.split('@')[0]} {m.user_id === me && <span className="text-zinc-500 text-xs">(bạn)</span>}</div>
              <div className="text-xs text-zinc-500 truncate">{m.email}</div>
            </div>
            <select value={m.level} disabled={m.user_id === me} onChange={e => setMember(m, { level: +e.target.value })} className="rounded-lg bg-[#15151f] border border-white/10 px-2 py-1.5 text-xs outline-none disabled:opacity-50">
              {[5, 4, 3, 2, 1].map(l => <option key={l} value={l}>{ROLE_NAME[l]}</option>)}
            </select>
            <label className={`text-xs flex items-center gap-1 ${m.user_id === me ? 'opacity-50' : 'cursor-pointer'}`}>
              <input type="checkbox" checked={m.can_edit} disabled={m.user_id === me} onChange={e => setMember(m, { can_edit: e.target.checked })} className="accent-violet-500" />Sửa kho chung
            </label>
            <label className={`text-xs flex items-center gap-1 ${m.user_id === me ? 'opacity-50' : 'cursor-pointer'}`}>
              <input type="checkbox" checked={m.can_approve} disabled={m.user_id === me} onChange={e => setMember(m, { can_approve: e.target.checked })} className="accent-violet-500" />Duyệt bài
            </label>
          </div>
        ))}
      </div>
      {msg && <p className="text-xs mt-2 text-zinc-300">{msg}</p>}
      <p className="text-xs text-zinc-600 mt-3">Người đăng ký mới tự vào org chung với vai 👤 Thành viên (chỉ đọc kho chung, có kho cá nhân riêng). Nâng vai tại đây.</p>
    </Card>
  )
}

const VOICE_QS = [
  'Bạn muốn người đọc cảm thấy gì sau mỗi bài của bạn?',
  '3 từ mô tả giọng nói của bạn (vd: chân thành, hài, thẳng)?',
  'Câu chuyện đời nào bạn kể đi kể lại nhiều nhất?',
  'Điều bạn TUYỆT ĐỐI không bao giờ nói/làm trong content?',
  'Cụm từ / câu cửa miệng đặc trưng của bạn?',
  'Khán giả của bạn là ai — họ đang kẹt ở đâu?',
  'Bạn khác gì với những người khác cùng làm QNET?',
  'Một niềm tin bạn sẵn sàng bảo vệ dù bị phản đối?',
]
function VoiceCard({ me }: { me: string }) {
  const [ans, setAns] = useState<string[]>(Array(8).fill(''))
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState('')
  useEffect(() => {
    supabase.from('profiles').select('voice').eq('id', me).maybeSingle().then(({ data }) => {
      const v = data?.voice as { answers?: string[] } | null
      if (v?.answers) setAns(a => a.map((_, i) => v.answers![i] ?? ''))
    })
  }, [me])
  const filled = ans.filter(a => a.trim()).length
  return (
    <Card className="mb-4">
      <div className="flex items-center justify-between">
        <Lbl>🎙️ Giọng của tôi — AI viết content ĐÚNG GIỌNG BẠN từ đây ({filled}/8)</Lbl>
        <button onClick={() => setOpen(o => !o)} className="text-xs rounded-lg bg-white/10 border border-white/10 px-3 py-1.5">{open ? 'Thu gọn' : filled ? 'Sửa' : '✍️ Bắt đầu'}</button>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden"><div className="h-full bg-gradient-to-r from-pink-500 to-amber-400 transition-all" style={{ width: `${filled / 8 * 100}%` }} /></div>
      {open && (
        <div className="mt-3 space-y-2.5">
          {VOICE_QS.map((q2, i) => (
            <div key={i}>
              <div className="text-xs text-zinc-300 mb-1">{i + 1}. {q2}</div>
              <textarea value={ans[i]} onChange={e => setAns(a => a.map((x, j) => j === i ? e.target.value : x))} className="w-full h-12 rounded-xl bg-white/5 border border-white/10 p-2.5 text-xs outline-none focus:border-pink-400/50" />
            </div>
          ))}
          <button onClick={async () => {
            const { error } = await supabase.from('profiles').upsert({ id: me, voice: { answers: ans, updated_at: new Date().toISOString() } })
            setSaved(error ? '⚠️ ' + error.message : '✅ Đã lưu giọng của bạn')
            setTimeout(() => setSaved(''), 2500)
          }} className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-amber-500 py-2.5 text-sm font-bold">💾 Lưu giọng</button>
          {saved && <p className="text-xs text-zinc-300">{saved}</p>}
        </div>
      )}
    </Card>
  )
}

export function Profile({ user }: { user: User }) {
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState('')
  const [total, setTotal] = useState(0)
  const [learned, setLearned] = useState(0)
  const [level, setLevel] = useState<number | null>(null)
  const [qi, setQi] = useState(0)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    supabase.from('wisdom_depth').select('connections,meaning,evidence,experience,action,learned').eq('user_id', user.id).then(({ data }) => {
      if (!data) return
      setLearned(data.filter(d => d.learned).length)
      setTotal(data.reduce((s, d) => s + depthScore(d), 0))
    })
    supabase.from('memberships').select('level').eq('user_id', user.id).maybeSingle().then(({ data }) => setLevel(data?.level ?? null))
    // Qi = tổng điểm hành động (thấm 10 · content 5 · link 3 · tạo trang 1) + streak ngày liên tục
    supabase.from('events').select('type,ts').eq('user_id', user.id).order('ts', { ascending: false }).limit(2000).then(({ data }) => {
      const W: Record<string, number> = { tham: 10, content: 5, link: 3, create: 1 }
      setQi((data ?? []).reduce((s, e) => s + (W[e.type as string] ?? 0), 0))
      const days = new Set((data ?? []).map(e => new Date(e.ts as string).toDateString()))
      let st = 0; const d = new Date()
      while (days.has(d.toDateString())) { st++; d.setDate(d.getDate() - 1) }
      setStreak(st)
    })
  }, [user.id])

  async function changePw() {
    if (pw.length < 6) { setMsg('⚠️ Mật khẩu cần ≥ 6 ký tự'); return }
    const { error } = await supabase.auth.updateUser({ password: pw })
    setMsg(error ? '⚠️ ' + error.message : '✅ Đã đổi mật khẩu'); setPw('')
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-pink-500" />
        <div>
          <h1 className="text-2xl font-extrabold">{user.email?.split('@')[0]}</h1>
          <p className="text-zinc-400 text-sm">{user.email} · {level ? ROLE_NAME[level] : '—'}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <Card><Lbl>⚡ Qi điểm</Lbl><div className="text-3xl font-black bg-gradient-to-r from-amber-300 to-pink-400 bg-clip-text text-transparent">{qi}</div><p className="text-[10px] text-zinc-600 mt-1">thấm 10 · content 5 · nối 3 · trang 1</p></Card>
        <Card><Lbl>🔥 Streak</Lbl><div className="text-3xl font-black">{streak}<span className="text-sm text-zinc-500"> ngày</span></div></Card>
        <Card><Lbl>🏆 Tổng Độ Thấm</Lbl><div className="text-3xl font-black bg-gradient-to-r from-violet-400 to-cyan-300 bg-clip-text text-transparent">{total}</div></Card>
        <Card><Lbl>🎓 Bài đã Thấm</Lbl><div className="text-3xl font-black">{learned}</div></Card>
      </div>
      <VoiceCard me={user.id} />
      <Card className="mb-4">
        <Lbl>🔒 Đổi mật khẩu</Lbl>
        <div className="flex gap-2">
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Mật khẩu mới (≥ 6 ký tự)" className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none" />
          <button onClick={changePw} className="rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-4 text-sm font-semibold">Đổi</button>
        </div>
        {msg && <p className="text-xs mt-2 text-zinc-300">{msg}</p>}
      </Card>
      <Card><Lbl>⚙️ Tài khoản</Lbl>
        <p className="text-sm text-zinc-400 mb-3">Đăng nhập qua Supabase · sau sẽ chuyển SSO quanlysukien.</p>
        <button onClick={() => supabase.auth.signOut()} className="rounded-xl bg-white/10 border border-white/10 px-4 py-2 text-sm">Đăng xuất</button>
      </Card>
    </div>
  )
}

/* ---------- USERS (👑 admin) ---------- */
export function UsersPage({ me }: { me: string }) {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-1">👑 Quản lý thành viên</h1>
      <p className="text-zinc-500 text-sm mb-6">Chỉ Admin thấy mục này. Phân vai, bật/tắt quyền sửa kho chung & duyệt bài.</p>
      <MembersAdmin me={me} />
      <Card>
        <Lbl>📜 Ma trận quyền</Lbl>
        <div className="text-xs text-zinc-400 space-y-1.5 leading-relaxed">
          <p>👑 <b className="text-zinc-200">Admin (5)</b> — toàn quyền + quản lý thành viên + duyệt bài</p>
          <p>✅ <b className="text-zinc-200">Tổng biên tập (4)</b> — sửa kho chung, bài đăng thẳng, duyệt bài người khác</p>
          <p>✏️ <b className="text-zinc-200">Biên tập viên (3)</b> — sửa kho chung, bài mới vào hàng <b>chờ duyệt</b></p>
          <p>🤝 <b className="text-zinc-200">Cộng tác viên (2)</b> — đề xuất nội dung (chờ duyệt) nếu được bật quyền sửa</p>
          <p>👤 <b className="text-zinc-200">Thành viên (1)</b> — kho cá nhân riêng + đọc kho chung, không sửa</p>
        </div>
      </Card>
    </div>
  )
}

/* ---------- REVIEW (✅ ban biên tập) ---------- */
type PendingNode = { id: string; title: string | null; icon: string | null; layer: string; kind: string; created_at: string; owner_id: string | null; md: string | null; props: Record<string, unknown> | null }
type Feedback = { id: string; node_id: string; question: string; created_at: string; status: string }
export function ReviewQueue({ orgId, onOpen, onChanged }: { orgId: string | null; onOpen: (id: string) => void; onChanged: () => void }) {
  const [items, setItems] = useState<PendingNode[]>([])
  const [fbs, setFbs] = useState<Feedback[]>([])
  const [emails, setEmails] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState('')
  const load = () => {
    if (!orgId) return
    supabase.from('nodes').select('id,title,icon,layer,kind,created_at,owner_id,md,props').eq('org_id', orgId).eq('status', 'pending').neq('kind', 'block').order('created_at', { ascending: false })
      .then(({ data }) => setItems((data as PendingNode[]) ?? []))
    supabase.from('open_questions').select('id,node_id,question,created_at,status').eq('status', 'feedback').order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => setFbs((data as Feedback[]) ?? []))
    supabase.rpc('admin_list_members').then(({ data }) => {
      if (data) setEmails(Object.fromEntries((data as { user_id: string; email: string }[]).map(m => [m.user_id, m.email])))
    })
  }
  useEffect(load, [orgId]) // eslint-disable-line react-hooks/exhaustive-deps
  async function approve(n: PendingNode) {
    const np = { ...(n.props ?? {}), last_published_md: n.md ?? '', approved_at: new Date().toISOString() }
    const { error } = await supabase.from('nodes').update({ status: 'published', props: np }).eq('id', n.id)
    setMsg(error ? '⚠️ ' + error.message : '✅ Đã duyệt & xuất bản')
    setTimeout(() => setMsg(''), 2500); load(); onChanged()
  }
  async function reject(n: PendingNode) {
    const note = window.prompt('Lý do trả lại (tác giả sẽ thấy trên trang):')
    if (note === null) return
    const np = { ...(n.props ?? {}), review_note: note || 'Cần chỉnh sửa thêm' }
    const { error } = await supabase.from('nodes').update({ status: 'draft', props: np }).eq('id', n.id)
    setMsg(error ? '⚠️ ' + error.message : '↩️ Đã trả lại kèm góp ý')
    setTimeout(() => setMsg(''), 2500); load(); onChanged()
  }
  const excerpt = (md: string | null) => (md ?? '').replace(/^#.*$/m, '').replace(/[#>*`\-\[\]]/g, '').trim().slice(0, 150)
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-1">✅ Duyệt bài</h1>
      <p className="text-zinc-500 text-sm mb-6">Bài chờ duyệt vào kho chung + góp ý từ thành viên. Duyệt = xuất bản cho cả tổ chức.</p>
      {items.length === 0 ? (
        <Card className="mb-5"><p className="text-sm text-zinc-500 text-center py-6">🎉 Không có bài nào chờ duyệt.</p></Card>
      ) : (
        <div className="space-y-2.5 mb-6">
          {items.map(n => (
            <div key={n.id} className="rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3.5">
              <div className="flex items-center gap-3">
                <span className="text-2xl shrink-0">{n.icon || '📄'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{n.title || 'Chưa đặt tên'}</div>
                  <div className="text-[11px] text-zinc-500">
                    {n.layer === 'corporate' ? '🌐 Kho tập đoàn' : '♾️ Kho nhân loại'} · ✍️ {n.owner_id ? (emails[n.owner_id] ?? 'thành viên').split('@')[0] : 'hệ thống'} · {new Date(n.created_at).toLocaleDateString('vi')}
                    {(n.props?.proposed_from as string) ? ' · 💡 đề xuất từ kho cá nhân' : ''}
                    {(n.props?.review_note as string) ? ' · 🔁 gửi lại sau góp ý' : ''}
                  </div>
                </div>
                <button onClick={() => onOpen(n.id)} className="text-xs rounded-lg bg-white/10 border border-white/10 px-3 py-1.5 hover:bg-white/15 shrink-0">👁 Xem</button>
                <button onClick={() => approve(n)} className="text-xs rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-3 py-1.5 font-semibold shrink-0">✅ Duyệt</button>
                <button onClick={() => reject(n)} className="text-xs rounded-lg bg-white/5 border border-white/10 text-zinc-400 px-3 py-1.5 hover:text-red-300 hover:border-red-400/40 shrink-0">↩ Trả lại</button>
              </div>
              {excerpt(n.md) && <p className="text-xs text-zinc-500 mt-2 pl-10 leading-relaxed">{excerpt(n.md)}…</p>}
              {(n.props?.proposal as { reason?: string; goal?: string } | undefined)?.reason && (
                <p className="text-[11px] text-fuchsia-200/80 mt-1.5 pl-10">💡 Lý do đề xuất: {(n.props!.proposal as { reason: string }).reason}{(n.props!.proposal as { goal?: string }).goal ? ` · 🎯 ${(n.props!.proposal as { goal: string }).goal}` : ''}</p>
              )}
            </div>
          ))}
        </div>
      )}
      {/* GÓP Ý TỪ THÀNH VIÊN (bài kho QNET) */}
      <Card>
        <Lbl>💬 Góp ý từ thành viên ({fbs.length})</Lbl>
        {fbs.length === 0 ? <p className="text-xs text-zinc-600">Chưa có góp ý nào.</p> : (
          <div className="space-y-1.5">
            {fbs.map(f => (
              <div key={f.id} className="flex items-start gap-2 rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2">
                <span className="text-sm shrink-0">💬</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-300 leading-relaxed">{f.question}</p>
                  <button onClick={() => onOpen(f.node_id)} className="text-[10px] text-cyan-300 hover:underline">mở bài liên quan →</button>
                </div>
                <button onClick={async () => { await supabase.from('open_questions').update({ status: 'resolved' }).eq('id', f.id); load() }} className="text-[10px] rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-zinc-500 hover:text-emerald-300 shrink-0">✓ Đã xử lý</button>
              </div>
            ))}
          </div>
        )}
      </Card>
      {msg && <p className="text-xs mt-3 text-zinc-300">{msg}</p>}
    </div>
  )
}


/* ---------- STUDIO NHẬP LIỆU (dashboard riêng: raw → đề xuất → duyệt + phân việc) ---------- */
const PT: [string, string][] = [['ghi-chu', '📝 Ghi chú'], ['bai-hoc', '🎓 Bài học'], ['trai-nghiem', '🌱 Trải nghiệm'], ['blog', '📰 Blog'], ['video', '🎬 Video'], ['kich-ban', '🎞️ Kịch bản'], ['khach-hang', '🤝 Khách hàng'], ['sach', '📕 Sách']]
type SPage = { id: string; title: string | null; layer: string; kind: string; parent_id?: string | null; icon?: string | null; subtype?: string | null }
// liên kết bài mới ↔ trang có sẵn: dir 'out' = bài này nối tới trang, 'in' = backlink từ trang về bài này; dim = 1 trong 8 chiều FRAMEWORK
type Conn = { id: string; dir: 'out' | 'in'; dim: string }
const DIM_VI: [string, string][] = [['knowledge', 'Kiến thức'], ['experience', 'Trải nghiệm'], ['emotion', 'Cảm xúc'], ['values', 'Giá trị'], ['people', 'Con người'], ['time', 'Thời gian'], ['reference', 'Tham chiếu'], ['anchor', 'Neo']]
type Asg = { id: string; title: string; note: string | null; due: string | null; status: string; assignee: string; assigner: string; created_at: string }
const sw = (x: string) => (x ?? '').toLowerCase()

const DEFAULT_TPL: Record<string, string> = {
  'ghi-chu': '## 💡 Ý chính\n- \n\n## 📌 Chi tiết\n',
  'bai-hoc': '## ⚡ Nguyên lý cốt lõi\n\n## 📖 Diễn giải\n\n## 🌍 Ví dụ thực tế\n\n## 🎯 Áp dụng\n- [ ] ',
  'trai-nghiem': '## 📍 Bối cảnh\n\n## ⚡ Chuyện gì xảy ra\n\n## ❤️ Cảm xúc\n\n## 🎓 Bài học rút ra\n',
  'blog': '## Hook mở bài\n\n## Thân bài\n\n## Kết + CTA\n',
  'video': '## 🎬 Hook 3 giây\n\n## Nội dung chính\n\n## CTA cuối\n',
  'kich-ban': '## Cảnh 1\n\n## Cảnh 2\n\n## Chốt\n',
  'khach-hang': '## 👤 Thông tin\n\n## 💬 Lịch sử tương tác\n\n## 🚦 Trạng thái\n\n## ▶️ Bước tiếp\n- [ ] ',
  'sach': '## 🧭 Một câu tóm tắt\n\n## 💡 3 ý đắt nhất\n1. \n\n## 📌 Quote\n> \n\n## 🎯 Áp dụng\n- [ ] ',
}

export function Studio({ orgId, user, canEdit, canApprove, pages, onOpen, onReload }: {
  orgId: string | null; user: User; canEdit: boolean; canApprove: boolean
  pages: SPage[]; onOpen: (id: string) => void; onReload: () => void
}) {
  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState('')          // bản AI tạo lại — user sửa trước khi nộp
  const [pretty, setPretty] = useState(true)      // xem kiểu Notion / MD
  const [history, setHistory] = useState<{ id: string; title: string | null; status: string; created_at: string }[]>([])
  const [raw, setRaw] = useState('')
  const [title, setTitle] = useState('')
  const [ptype, setPtype] = useState('ghi-chu')
  const [target, setTarget] = useState<'personal' | 'humanity' | 'corporate'>('personal')
  const [destId, setDestId] = useState<string | null>(null)   // folder đích trong kho — null = ngoài cùng
  const [destOpen, setDestOpen] = useState<Set<string>>(new Set())
  const [conns, setConns] = useState<Conn[]>([])              // liên kết ↔ trang có sẵn (chiều + dimension)
  const [connQ, setConnQ] = useState('')                      // ô tìm trang để nối
  const [eventDate, setEventDate] = useState('')              // 📅 ngày THỰC TẾ nội dung xảy ra
  const [campaign, setCampaign] = useState('')                // 🚩 chiến dịch content
  const [summary, setSummary] = useState('')                  // tóm tắt 1 câu — bắt buộc theo chuẩn
  const [source, setSource] = useState('')                    // nguồn: sách/URL/người kể…
  const [busy, setBusy] = useState(false)
  const [asgs, setAsgs] = useState<Asg[]>([])
  const [members, setMembers] = useState<{ user_id: string; email: string }[]>([])
  const [na, setNa] = useState({ assignee: '', title: '', note: '', due: '' })

  function loadAsg() {
    supabase.from('assignments').select('*').order('created_at', { ascending: false }).limit(30).then(({ data }) => setAsgs((data as Asg[]) ?? []))
    supabase.from('nodes').select('id,title,status,created_at').eq('owner_id', user.id).eq('props->>via', 'studio').order('created_at', { ascending: false }).limit(10).then(({ data }) => setHistory((data as { id: string; title: string | null; status: string; created_at: string }[]) ?? []))
    if (canApprove) supabase.rpc('admin_list_members').then(({ data }) => { if (data) setMembers(data as { user_id: string; email: string }[]) })
  }
  useEffect(loadAsg, [canApprove]) // eslint-disable-line react-hooks/exhaustive-deps

  // "AI" đề xuất (heuristic — thay bằng model thật khi cắm API)
  function analyze() {
    const t = raw.trim().split('\n')[0].replace(/^#+\s*/, '').slice(0, 80)
    setTitle(t)
    const r = sw(raw)
    setPtype(r.match(/video|quay|clip|reel/) ? 'video' : r.match(/kịch bản|script|cảnh/) ? 'kich-ban' : r.match(/khách|chị |anh |tư vấn/) ? 'khach-hang' : r.match(/sách|chương|tác giả/) ? 'sach' : r.match(/blog|bài viết/) ? 'blog' : r.match(/bài học|nguyên lý|quy tắc/) ? 'bai-hoc' : r.match(/hôm nay|cảm thấy|mình đã/) ? 'trai-nghiem' : 'ghi-chu')
    setConns([]); setConnQ('')
    // máy đề xuất trường chuẩn — user sửa được hết
    const firstSen = raw.trim().split(/[.!?\n]/).map(x => x.trim()).filter(x => x.length > 15)[0] ?? ''
    setSummary(firstSen.slice(0, 140))
    if (r.match(/hôm nay|sáng nay|chiều nay|tối nay/)) setEventDate(new Date().toISOString().slice(0, 10))
    setStep(2)
  }
  const sugLinks = useMemo(() => {
    const rw = new Set(sw(raw + ' ' + title).split(/[^a-zà-ỹ0-9]+/i).filter(w => w.length >= 4))
    return pages.filter(pg => pg.kind !== 'kho').map(pg => ({ pg, score: sw(pg.title ?? '').split(/[^a-zà-ỹ0-9]+/i).filter(w => w.length >= 4 && rw.has(w)).length })).filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 5)
  }, [raw, title, pages])

  // ----- chọn folder đích trong kho (bước 3) -----
  const TARGET_LBL: Record<string, string> = { personal: '🧠 Kho của tôi', humanity: '♾️ Kho nhân loại', corporate: '🌐 Kho QNET' }
  const khoRoot = useMemo(() => pages.find(pg => pg.kind === 'kho' && pg.layer === target) ?? null, [pages, target])
  const inDestTree = (pg: SPage) => pg.layer === target && pg.kind !== 'kho' && !sw(pg.subtype ?? '').startsWith('ingest_tpl') && pg.subtype !== 'template' && pg.subtype !== 'template_home'
  const destKids = (pid: string | null) => pages.filter(pg => inDestTree(pg) && (pid === null ? (pg.parent_id === khoRoot?.id || !pg.parent_id) : pg.parent_id === pid))
  const destCrumb = useMemo(() => {
    const out: SPage[] = []; let cur = destId ? pages.find(p => p.id === destId) : undefined; let g = 0
    while (cur && cur.kind !== 'kho' && g++ < 20) { out.unshift(cur); cur = pages.find(p => p.id === cur!.parent_id) }
    return out
  }, [destId, pages])
  const destLbl = destCrumb.length ? `${destCrumb[destCrumb.length - 1].icon || '📂'} ${destCrumb[destCrumb.length - 1].title || 'Chưa đặt tên'}` : TARGET_LBL[target]
  function renderDest(pg: SPage, depth: number): React.ReactNode {
    const kids = destKids(pg.id)
    const open = destOpen.has(pg.id)
    const sel = destId === pg.id
    return (
      <div key={pg.id}>
        <button onClick={() => setDestId(sel ? null : pg.id)} style={{ paddingLeft: 8 + depth * 18 }}
          className={`w-full flex items-center gap-1.5 rounded-lg py-1.5 pr-2 text-left text-xs border transition ${sel ? 'bg-gradient-to-r from-violet-500/30 to-fuchsia-500/15 border-violet-400/50 text-white font-semibold' : 'border-transparent text-zinc-300 hover:bg-white/5'}`}>
          <span onClick={e => { e.stopPropagation(); setDestOpen(s => { const n = new Set(s); if (n.has(pg.id)) n.delete(pg.id); else n.add(pg.id); return n }) }}
            className={`w-4 shrink-0 text-center text-[10px] ${kids.length ? 'text-zinc-500 hover:text-white cursor-pointer' : 'text-transparent'}`}>{open ? '▾' : '▸'}</span>
          <span className="shrink-0">{pg.icon || '📄'}</span>
          <span className="truncate">{pg.title || 'Chưa đặt tên'}</span>
          {sel ? <span className="ml-auto shrink-0 text-[10px] text-violet-200">✓ nạp vào đây</span>
            : kids.length > 0 ? <span className="ml-auto shrink-0 text-[10px] text-zinc-600">{kids.length}</span> : null}
        </button>
        {open && kids.map(k => renderDest(k, depth + 1))}
      </div>
    )
  }

  // ----- nối với trang nào: tìm kiếm + chiều (→/←) + 1 trong 8 dimension -----
  const pageOf = (id: string) => pages.find(p => p.id === id)
  const linkable = (pg: SPage) => pg.kind !== 'kho' && !sw(pg.subtype ?? '').startsWith('ingest_tpl') && pg.subtype !== 'template' && pg.subtype !== 'template_home'
  const connResults = useMemo(() => {
    const q = sw(connQ.trim())
    if (!q) return []
    return pages.filter(pg => linkable(pg) && sw(pg.title ?? '').includes(q) && !conns.some(c => c.id === pg.id)).slice(0, 6)
  }, [connQ, pages, conns]) // eslint-disable-line react-hooks/exhaustive-deps
  const addConn = (id: string, dir: 'out' | 'in' = 'out') => setConns(cs => cs.some(c => c.id === id) ? cs : [...cs, { id, dir, dim: 'reference' }])
  const patchConn = (id: string, p: Partial<Conn>) => setConns(cs => cs.map(c => c.id === id ? { ...c, ...p } : c))
  const rmConn = (id: string) => setConns(cs => cs.filter(c => c.id !== id))

  // "AI tạo lại toàn bộ theo chuẩn" — đổ raw vào template đầu vào (admin chỉnh được); AI thật thay chỗ này khi cắm API
  async function generate() {
    let tpl = DEFAULT_TPL[ptype] ?? ''
    const { data: t } = await supabase.from('nodes').select('md').eq('subtype', 'ingest_tpl').eq('props->>tpl_for', ptype).limit(1).maybeSingle()
    if (t?.md) tpl = (t.md as string).replace(/^#[^\n]*\n/, '')
    const tl = PT.find(x => x[0] === ptype)?.[1] ?? ''
    // TRƯỜNG CHUẨN đồng nhất mọi file (xem docs/STANDARD-TEMPLATE.md) — lấy từ form bước 2
    const head = `**Loại:** ${tl} · **Ngày sự kiện:** ${eventDate ? new Date(eventDate + 'T00:00:00').toLocaleDateString('vi') : '…'} · **Campaign:** ${campaign.trim() || '—'}\n\n**Tóm tắt 1 câu:** ${summary.trim()}\n\n**Nguồn:** ${source.trim() || '…'}`
    setDraft(`# ${title}\n\n${head}\n\n${tpl}\n\n## 💎 Trích dẫn đắt\n> \n\n## 📥 Nội dung gốc\n\n${raw.trim()}`)
    setStep(3)
  }
  // admin/biên tập mở trang template đầu vào để chỉnh — thống nhất đầu vào toàn org
  async function editTemplate() {
    if (!orgId) return
    const { data: ex } = await supabase.from('nodes').select('id').eq('subtype', 'ingest_tpl').eq('props->>tpl_for', ptype).limit(1).maybeSingle()
    if (ex) { onOpen(ex.id); return }
    let { data: home } = await supabase.from('nodes').select('id').eq('subtype', 'ingest_tpl_home').limit(1).maybeSingle()
    if (!home) {
      const corpKho = pages.find(pg => pg.kind === 'kho' && pg.layer === 'corporate')
      const hid = crypto.randomUUID()
      await supabase.from('nodes').insert({ id: hid, org_id: orgId, owner_id: null, layer: 'corporate', kind: 'page', parent_id: corpKho?.id ?? null, title: 'Template đầu vào', icon: '📐', subtype: 'ingest_tpl_home', status: 'published', min_level: 1 })
      home = { id: hid }
    }
    const tid = crypto.randomUUID()
    const tl = PT.find(x => x[0] === ptype)?.[1] ?? ptype
    await supabase.from('nodes').insert({ id: tid, org_id: orgId, owner_id: null, layer: 'corporate', kind: 'page', parent_id: home.id, title: `Template: ${tl}`, icon: '📐', subtype: 'ingest_tpl', props: { tpl_for: ptype }, md: `# Template: ${tl}\n\n${DEFAULT_TPL[ptype] ?? ''}`, status: 'published', min_level: 1 })
    onReload(); onOpen(tid)
  }

  async function publish() {
    if (!orgId || !title.trim()) return
    setBusy(true)
    const owner = user.id
    const status = target === 'personal' ? 'published' : 'pending'
    const md = draft
    const kho = pages.find(pg => pg.kind === 'kho' && pg.layer === target)
    const parent = destId ?? kho?.id ?? null   // folder user chọn ở bước 3; mặc định = ngoài cùng kho
    const id = crypto.randomUUID()
    const { error } = await supabase.from('nodes').insert({ id, org_id: orgId, owner_id: owner, layer: target, kind: 'page', parent_id: parent, title, md, event_date: eventDate || null, props: { page_type: ptype, via: 'studio', ...(campaign.trim() ? { campaign: campaign.trim() } : {}) }, status, min_level: 1 })
    if (!error) {
      for (const c of conns) await supabase.from('links').insert(c.dir === 'out'
        ? { org_id: orgId, from_node: id, to_node: c.id, dimension: c.dim, source: 'studio' }
        : { org_id: orgId, from_node: c.id, to_node: id, dimension: c.dim, source: 'studio' })
      await supabase.from('ai_jobs').insert({ user_id: user.id, kind: 'ingest_to_template', input: { node_id: id, page_type: ptype }, status: 'queued' })
      await supabase.from('events').insert({ user_id: user.id, type: 'create', node_id: id })
    }
    setBusy(false); setStep(4); onReload(); loadAsg()
    setTimeout(() => { onOpen(id) }, 900)
  }

  const stepCls = (n: number) => `flex-1 text-center text-[11px] py-2 rounded-xl border transition ${step === n ? 'bg-gradient-to-r from-fuchsia-500/30 to-violet-500/30 border-fuchsia-400/40 text-white font-bold' : step > n ? 'bg-white/5 border-white/10 text-zinc-400' : 'bg-white/[0.02] border-white/5 text-zinc-600'}`
  return (
    <div className="px-8 pb-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-extrabold">📥 Nhập liệu & nộp bài</h2>
        {canApprove && <button onClick={editTemplate} title="Chỉnh template đầu vào của loại đang chọn — thống nhất chuẩn cho cả org" className="text-xs rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-zinc-400 hover:text-white">📐 Sửa template "{PT.find(x => x[0] === ptype)?.[1]}"</button>}
      </div>
      <p className="text-zinc-500 text-sm mb-4">Raw → máy đề xuất → AI tạo bản chuẩn → bạn duyệt → nộp.</p>
      <div className="flex gap-1.5 mb-4">
        <button onClick={() => setStep(1)} className={stepCls(1)}>1 · Dán raw</button>
        <button onClick={() => raw.trim() && setStep(2)} className={stepCls(2)}>2 · Bạn chọn</button>
        <button onClick={() => draft && setStep(3)} className={stepCls(3)}>3 · AI tạo — bạn sửa</button>
        <div className={stepCls(4)}>4 · Nộp / duyệt</div>
      </div>

      {step === 1 && (
        <Card>
          <textarea value={raw} onChange={e => setRaw(e.target.value)} placeholder="Dán bất cứ gì: ghi chép buổi event, transcript video, bài copy từ nhóm, chương sách…" className="w-full h-64 rounded-xl bg-white/5 border border-white/10 p-4 text-sm outline-none focus:border-fuchsia-400/50 mb-3" />
          <button onClick={analyze} disabled={!raw.trim()} className="w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-500 py-3 text-sm font-bold disabled:opacity-40 shadow-lg shadow-fuchsia-500/25">⚡ Phân tích & đề xuất →</button>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <Lbl>🤖 Máy đề xuất — bấm chọn để xác nhận (AI thật sẽ hỏi sâu hơn khi cắm API)</Lbl>
          <div className="space-y-4 mt-2">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">Tiêu đề đề xuất — sửa được</div>
              <input value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-fuchsia-400/50" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">Loại nội dung — máy đoán, bạn chỉnh</div>
              <div className="flex flex-wrap gap-1.5">{PT.map(([k, l]) => <button key={k} onClick={() => setPtype(k)} className={`px-3 py-1.5 rounded-lg text-xs border ${ptype === k ? 'bg-fuchsia-500/25 border-fuchsia-400/50 text-fuchsia-100' : 'bg-white/5 border-white/10 text-zinc-400'}`}>{l}</button>)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">Đưa vào đâu? — chọn kho, cây folder bung ra bên dưới</div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                <button onClick={() => { setTarget('personal'); setDestId(null); setDestOpen(new Set()) }} className={`px-3 py-1.5 rounded-lg text-xs border ${target === 'personal' ? 'bg-violet-500/25 border-violet-400/50 text-violet-100' : 'bg-white/5 border-white/10 text-zinc-400'}`}>🧠 Kho của tôi (vào ngay)</button>
                <button onClick={() => { setTarget('humanity'); setDestId(null); setDestOpen(new Set()) }} className={`px-3 py-1.5 rounded-lg text-xs border ${target === 'humanity' ? 'bg-fuchsia-500/25 border-fuchsia-400/50 text-fuchsia-100' : 'bg-white/5 border-white/10 text-zinc-400'}`}>♾️ Đề xuất Kho nhân loại (chờ duyệt)</button>
                {canEdit && <button onClick={() => { setTarget('corporate'); setDestId(null); setDestOpen(new Set()) }} className={`px-3 py-1.5 rounded-lg text-xs border ${target === 'corporate' ? 'bg-cyan-500/25 border-cyan-400/50 text-cyan-100' : 'bg-white/5 border-white/10 text-zinc-400'}`}>🌐 Kho QNET (chờ duyệt)</button>}
              </div>
              {/* 📂 cây folder của kho đang chọn — bấm chọn nơi nạp, ▸ mở cấp con */}
              <div className="max-h-44 overflow-auto rounded-lg bg-black/20 border border-white/5 p-1.5 space-y-0.5">
                <button onClick={() => setDestId(null)}
                  className={`w-full flex items-center gap-1.5 rounded-lg py-1.5 px-2 text-left text-xs border transition ${destId === null ? 'bg-gradient-to-r from-violet-500/30 to-fuchsia-500/15 border-violet-400/50 text-white font-semibold' : 'border-transparent text-zinc-300 hover:bg-white/5'}`}>
                  <span className="w-4 shrink-0" /><span className="shrink-0">🏠</span><span className="truncate">{TARGET_LBL[target]} — ngoài cùng</span>
                  {destId === null && <span className="ml-auto shrink-0 text-[10px] text-violet-200">✓ nạp vào đây</span>}
                </button>
                {destKids(null).map(pg => renderDest(pg, 1))}
                {destKids(null).length === 0 && <p className="text-[11px] text-zinc-600 px-2 py-1">Kho này chưa có folder con — bài sẽ nằm ngoài cùng.</p>}
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-[11px] text-zinc-400 flex-wrap">
                <span className="text-zinc-600">Sẽ nạp vào:</span>
                <span className="text-zinc-300">{TARGET_LBL[target]}</span>
                {destCrumb.map(c => <span key={c.id} className="flex items-center gap-1"><span className="text-zinc-600">›</span><span className="text-violet-200">{c.icon || '📄'} {c.title || 'Chưa đặt tên'}</span></span>)}
                <span className="text-zinc-600">›</span><span className="text-emerald-300 font-semibold">📄 {title || 'bài này'}</span>
              </div>
            </div>

            {/* 📋 TRƯỜNG CHUẨN của trang — theo docs/STANDARD-TEMPLATE.md, để data nộp lên hoàn thiện */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">📋 Trường chuẩn — máy điền trước, bạn chỉnh cho đúng</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                <label className="block">
                  <span className="text-[10px] text-zinc-500">📅 Ngày sự kiện — ngày THỰC TẾ xảy ra, không phải hôm nay</span>
                  <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-fuchsia-400/50 [color-scheme:dark]" />
                </label>
                <label className="block">
                  <span className="text-[10px] text-zinc-500">🚩 Campaign — chiến dịch content (tuỳ chọn)</span>
                  <input value={campaign} onChange={e => setCampaign(e.target.value)} placeholder="vd: Tuyển thành viên T6" className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-fuchsia-400/50" />
                </label>
              </div>
              <label className="block mb-2">
                <span className="text-[10px] text-zinc-500">✏️ Tóm tắt 1 câu — <b className="text-fuchsia-300">bắt buộc</b>, AI dùng làm snippet khi trích dẫn</span>
                <input value={summary} onChange={e => setSummary(e.target.value)} placeholder="Một câu nói lên cốt lõi của bài…" className={`mt-1 w-full rounded-xl bg-white/5 border px-3 py-2 text-sm outline-none focus:border-fuchsia-400/50 ${summary.trim() ? 'border-white/10' : 'border-amber-400/40'}`} />
              </label>
              <label className="block">
                <span className="text-[10px] text-zinc-500">🔗 Nguồn — sách / URL / người kể / tự trải nghiệm</span>
                <input value={source} onChange={e => setSource(e.target.value)} placeholder="vd: sách Atomic Habits ch.3 · buổi event 9/6 · tự trải nghiệm" className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-fuchsia-400/50" />
              </label>
            </div>

            {/* 🕸️ NỐI VỚI TRANG NÀO — link/backlink thật + 8 chiều FRAMEWORK */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">🕸️ Nối với trang nào? — tìm trang, đổi chiều →/←, chấm màu = 8 chiều liên kết (tuỳ chọn)</div>
              <input value={connQ} onChange={e => setConnQ(e.target.value)} placeholder="🔍 Gõ tên trang để nối…" className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-cyan-400/50 mb-1.5" />
              {connResults.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {connResults.map(pg => <button key={pg.id} onClick={() => { addConn(pg.id); setConnQ('') }} className="px-3 py-1.5 rounded-lg text-xs border bg-white/5 border-white/10 text-zinc-300 hover:border-cyan-400/40">＋ {pg.icon || '📄'} {pg.title}</button>)}
                </div>
              )}
              {sugLinks.filter(({ pg }) => !conns.some(c => c.id === pg.id)).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {sugLinks.filter(({ pg }) => !conns.some(c => c.id === pg.id)).map(({ pg }) => <button key={pg.id} onClick={() => addConn(pg.id)} className="px-3 py-1.5 rounded-lg text-xs border bg-white/5 border-white/10 text-zinc-400 hover:border-fuchsia-400/40">✨ {pg.icon || '📄'} {pg.title} <span className="text-zinc-600">· máy gợi ý</span></button>)}
                </div>
              )}
              {conns.length === 0 && connResults.length === 0 && sugLinks.length === 0 && <p className="text-xs text-zinc-600">Chưa nối trang nào — bỏ qua được, nối sau trong trang cũng được.</p>}
              <div className="space-y-1.5">
                {conns.map(c => {
                  const pg = pageOf(c.id); if (!pg) return null
                  return (
                    <div key={c.id} className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/10 px-2.5 py-2">
                      <button onClick={() => patchConn(c.id, { dir: c.dir === 'out' ? 'in' : 'out' })} title="Bấm để đổi chiều liên kết"
                        className={`text-[10px] rounded-lg px-2 py-1 border shrink-0 transition ${c.dir === 'out' ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-200' : 'bg-violet-500/15 border-violet-400/40 text-violet-200'}`}>
                        {c.dir === 'out' ? 'bài này → nối tới' : '← backlink từ'}
                      </button>
                      <span className="text-xs truncate flex-1 text-zinc-200">{pg.icon || '📄'} {pg.title || 'Chưa đặt tên'}</span>
                      <div className="flex gap-1 shrink-0 items-center">
                        {DIM_VI.map(([k, l]) => (
                          <button key={k} onClick={() => patchConn(c.id, { dim: k })} title={l}
                            className={`w-3.5 h-3.5 rounded-full transition ${c.dim === k ? 'scale-[1.35] ring-2 ring-white/70' : 'opacity-40 hover:opacity-100'}`}
                            style={{ background: DIM_COLOR[k] }} />
                        ))}
                      </div>
                      <span className="text-[10px] w-[4.5rem] text-right shrink-0 font-semibold" style={{ color: DIM_COLOR[c.dim] }}>{DIM_VI.find(d => d[0] === c.dim)?.[1]}</span>
                      <button onClick={() => rmConn(c.id)} title="Bỏ liên kết" className="text-zinc-600 hover:text-red-300 shrink-0 text-xs px-1">✕</button>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-zinc-400">← Sửa raw</button>
              <button onClick={generate} disabled={!title.trim() || !summary.trim()} title={!summary.trim() ? 'Cần Tóm tắt 1 câu — trường bắt buộc theo chuẩn' : ''} className="flex-1 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-500 py-2.5 text-sm font-bold disabled:opacity-40">🤖 AI tạo lại bản chuẩn →</button>
            </div>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <Lbl>🤖 Bản chuẩn AI tạo — sửa trực tiếp rồi nộp</Lbl>
            <div className="flex gap-1 bg-white/5 border border-white/10 rounded-lg p-0.5 text-[10px]">
              <button onClick={() => setPretty(true)} className={`px-2.5 py-1 rounded ${pretty ? 'bg-violet-500/30 text-white' : 'text-zinc-500'}`}>✨ Xem đẹp</button>
              <button onClick={() => setPretty(false)} className={`px-2.5 py-1 rounded ${!pretty ? 'bg-violet-500/30 text-white' : 'text-zinc-500'}`}>{'{ }'} Sửa MD</button>
            </div>
          </div>
          {pretty ? (
            <div onClick={() => setPretty(false)} title="Bấm để sửa" className="w-full h-72 overflow-auto rounded-xl bg-white/[0.03] border border-white/10 p-5 mb-3 cursor-text space-y-2">
              {draft.split('\n').map((ln, i) => {
                const t2 = ln.trim()
                if (t2.startsWith('# ')) return <h1 key={i} className="text-2xl font-extrabold">{t2.slice(2)}</h1>
                if (t2.startsWith('## ')) return <h2 key={i} className="text-base font-bold mt-3 text-violet-200">{t2.slice(3)}</h2>
                if (t2.startsWith('> ')) return <blockquote key={i} className="border-l-2 border-cyan-400/50 pl-3 text-sm text-cyan-100/80 italic">{t2.slice(2)}</blockquote>
                if (t2.startsWith('- ')) return <li key={i} className="text-sm text-zinc-300 ml-4">{t2.slice(2)}</li>
                if (!t2) return <div key={i} className="h-1" />
                return <p key={i} className="text-sm text-zinc-300" dangerouslySetInnerHTML={{ __html: t2.replace(/\*\*(.+?)\*\*/g, '<b class="text-white">$1</b>') }} />
              })}
            </div>
          ) : (
            <textarea value={draft} onChange={e => setDraft(e.target.value)} className="w-full h-72 rounded-xl bg-white/5 border border-white/10 p-4 text-[13px] font-mono leading-relaxed outline-none focus:border-violet-400/50 mb-3" />
          )}
          {/* ✨ AI ĐỀ XUẤT THÊM: backlink + insight nhặt từ raw */}
          <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3 mb-3">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">✨ Đề xuất thêm — bấm để nhận</div>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {sugLinks.slice(0, 4).map(({ pg }) => (
                <button key={pg.id} onClick={() => conns.some(c => c.id === pg.id) ? rmConn(pg.id) : addConn(pg.id, 'in')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] border ${conns.some(c => c.id === pg.id) ? 'bg-violet-500/25 border-violet-400/50 text-violet-100' : 'bg-white/5 border-white/10 text-zinc-400'}`}>← backlink từ "{pg.title}"</button>
              ))}
              {raw.split(/[.!?\n]/).map(x => x.trim()).filter(x => x.length > 40 && x.length < 180).slice(0, 2).map((sen, i) => (
                <button key={'q' + i} onClick={() => setDraft(d => d.replace('## 💎 Trích dẫn đắt\n> ', `## 💎 Trích dẫn đắt\n> ${sen}`))}
                  className="px-2.5 py-1 rounded-lg text-[10px] border bg-white/5 border-white/10 text-amber-200/80 hover:border-amber-400/40">💎 "{sen.slice(0, 50)}…"</button>
              ))}
            </div>
          </div>
          {/* 📂 tóm tắt nơi nạp + liên kết — chốt lần cuối trước khi nộp (chọn ở bước 2) */}
          <div className="rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2.5 mb-3 flex items-center gap-1 text-[11px] text-zinc-400 flex-wrap">
            <span className="text-zinc-600">Sẽ nạp vào:</span>
            <span className="text-zinc-300">{TARGET_LBL[target]}</span>
            {destCrumb.map(c => <span key={c.id} className="flex items-center gap-1"><span className="text-zinc-600">›</span><span className="text-violet-200">{c.icon || '📄'} {c.title || 'Chưa đặt tên'}</span></span>)}
            <span className="text-zinc-600">›</span><span className="text-emerald-300 font-semibold">📄 {title || 'bài này'}</span>
            {conns.length > 0 && <span className="text-zinc-500">· 🕸️ {conns.length} liên kết</span>}
            <button onClick={() => setStep(2)} className="ml-auto shrink-0 text-[10px] rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-zinc-400 hover:text-white">✎ đổi</button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-zinc-400">← Chọn lại</button>
            <button onClick={publish} disabled={busy} className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-2.5 text-sm font-bold disabled:opacity-40">{busy ? 'Đang nộp…' : target === 'personal' ? `✓ OK — nạp vào ${destLbl}` : `📨 OK — nộp vào ${destLbl} & chờ duyệt`}</button>
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card className="text-center py-10">
          <div className="text-5xl mb-3 dq-pop">{target === 'personal' ? '✅' : '📨'}</div>
          <h2 className="text-xl font-bold mb-1">{target === 'personal' ? `Đã nạp vào ${destLbl}!` : `Đã gửi vào luồng duyệt — sẽ nằm ở ${destLbl}!`}</h2>
          <p className="text-sm text-zinc-500 mb-4">{conns.length > 0 ? `Kèm ${conns.length} liên kết · ` : ''}AI job đã xếp hàng chuẩn hoá sâu. Đang mở trang…</p>
          <button onClick={() => { setStep(1); setRaw(''); setTitle(''); setDestId(null); setDestOpen(new Set()); setConns([]); setConnQ(''); setEventDate(''); setCampaign(''); setSummary(''); setSource('') }} className="rounded-xl bg-white/10 border border-white/10 px-4 py-2 text-sm">＋ Nhập tài liệu tiếp</button>
        </Card>
      )}

      {/* LỊCH SỬ NỘP BÀI */}
      {history.length > 0 && (
        <div className="mt-4">
          <Card>
            <Lbl>🗂️ Lịch sử nộp từ Studio</Lbl>
            <div className="space-y-1">
              {history.map(h => (
                <button key={h.id} onClick={() => onOpen(h.id)} className="w-full flex items-center gap-2 text-left rounded-lg bg-white/[0.03] border border-white/10 px-2.5 py-1.5 hover:border-violet-400/40">
                  <span className="text-xs shrink-0">{h.status === 'published' ? '✅' : h.status === 'pending' ? '⏳' : '📝'}</span>
                  <span className="flex-1 text-xs truncate text-zinc-300">{h.title}</span>
                  <span className="text-[10px] text-zinc-600 shrink-0">{h.status === 'published' ? 'đã duyệt' : h.status === 'pending' ? 'chờ duyệt' : 'bị trả lại'} · {new Date(h.created_at).toLocaleDateString('vi')}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* PHÂN VIỆC BIÊN TẬP */}
      <div className="mt-6">
        <Card>
          <Lbl>📋 Nhiệm vụ biên tập {canApprove ? '— bạn phân việc xuống' : '— việc được giao cho bạn'}</Lbl>
          {canApprove && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              <select value={na.assignee} onChange={e => setNa({ ...na, assignee: e.target.value })} className="rounded-lg bg-[#15151f] border border-white/10 px-2 py-2 text-xs outline-none">
                <option value="">Giao cho…</option>
                {members.map(m => <option key={m.user_id} value={m.user_id}>{m.email.split('@')[0]}</option>)}
              </select>
              <input value={na.title} onChange={e => setNa({ ...na, title: e.target.value })} placeholder="Việc gì? (vd: Nhập chương 3 Atomic Habits)" className="flex-1 min-w-[200px] rounded-lg bg-white/5 border border-white/10 px-2.5 py-2 text-xs outline-none" />
              <input type="date" value={na.due} onChange={e => setNa({ ...na, due: e.target.value })} className="rounded-lg bg-[#15151f] border border-white/10 px-2 py-2 text-xs outline-none" />
              <button onClick={async () => {
                if (!na.assignee || !na.title.trim() || !orgId) return
                await supabase.from('assignments').insert({ org_id: orgId, assigner: user.id, assignee: na.assignee, title: na.title.trim(), note: na.note || null, due: na.due || null })
                setNa({ assignee: '', title: '', note: '', due: '' }); loadAsg()
              }} className="rounded-lg bg-gradient-to-r from-violet-500 to-cyan-500 px-4 py-2 text-xs font-bold">Giao việc</button>
            </div>
          )}
          <div className="space-y-1.5">
            {asgs.map(a => (
              <div key={a.id} className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 ${a.status === 'done' ? 'bg-white/[0.02] border-white/5 opacity-50' : 'bg-white/[0.04] border-white/10'}`}>
                <span>{a.status === 'done' ? '✅' : '🔖'}</span>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm truncate ${a.status === 'done' ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>{a.title}</div>
                  <div className="text-[10px] text-zinc-600">{a.assignee === user.id ? 'giao cho bạn' : 'bạn giao'}{a.due ? ` · hạn ${a.due}` : ''}</div>
                </div>
                {a.status !== 'done' && a.assignee === user.id && (
                  <button onClick={async () => { await supabase.from('assignments').update({ status: 'done' }).eq('id', a.id); loadAsg() }} className="text-[10px] rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 px-2.5 py-1.5 shrink-0">✓ Hoàn thành</button>
                )}
              </div>
            ))}
            {asgs.length === 0 && <p className="text-xs text-zinc-600 py-2">Chưa có nhiệm vụ nào.</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}

/* ---------- TODAY (trung tâm hành động — không trùng chức năng kho) ---------- */
type TodayNode = N & { icon?: string | null }
export function Today({ user, stats, recent, pages, editorial = [], counts, onOpen, onCapture, onGalaxy, onDigest, onRaw }: {
  user: User
  stats: { pages: number; notes: number; links: number }
  recent: TodayNode[]
  pages: TodayNode[]            // note cá nhân — để tính "cần thẩm thấu"
  editorial?: (TodayNode & { status?: string; note?: string })[]
  counts?: { values: number; mantras: number; people: number; dated: number }
  onOpen: (n: TodayNode) => void
  onCapture: (title: string) => void
  onGalaxy: () => void
  onDigest: (n: TodayNode) => void
  onRaw?: () => void
}) {
  const [learnedIds, setLearnedIds] = useState<Set<string>>(new Set())
  const [dueIds, setDueIds] = useState<string[]>([])
  const [streak, setStreak] = useState(0)
  const [cap, setCap] = useState('')
  const [qaOpen, setQaOpen] = useState(false)
  const [qaAns, setQaAns] = useState(['', '', ''])
  useEffect(() => {
    supabase.from('wisdom_depth').select('node_id,learned,next_review_at').eq('user_id', user.id).then(({ data }) => {
      setLearnedIds(new Set((data ?? []).filter(d => d.learned).map(d => d.node_id as string)))
      setDueIds((data ?? []).filter(d => d.learned && d.next_review_at && new Date(d.next_review_at as string) <= new Date()).map(d => d.node_id as string))
    })
    supabase.from('events').select('ts').eq('user_id', user.id).order('ts', { ascending: false }).limit(500).then(({ data }) => {
      const days = new Set((data ?? []).map(e => new Date(e.ts as string).toDateString()))
      let st = 0; const d = new Date()
      while (days.has(d.toDateString())) { st++; d.setDate(d.getDate() - 1) }
      setStreak(st)
    })
  }, [user.id])
  const hour = new Date().getHours()
  const greet = hour < 11 ? 'Chào buổi sáng' : hour < 14 ? 'Chào buổi trưa' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'
  const unlearned = pages.filter(p => !learnedIds.has(p.id)).slice(0, 5)
  const learnedCount = pages.filter(p => learnedIds.has(p.id)).length
  const pct = pages.length ? Math.round((learnedCount / pages.length) * 100) : 0
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-1">{greet}, {user.email?.split('@')[0]} 👋</h1>
      <p className="text-zinc-500 text-sm mb-6">Hôm nay bạn <b className="text-zinc-300">trải nghiệm</b> được điều gì?</p>

      {/* QUICK CAPTURE — hành động số 1 của mỗi ngày */}
      <div className="rounded-2xl p-[1.5px] bg-gradient-to-r from-violet-500/60 via-fuchsia-500/40 to-cyan-500/60 mb-6 shadow-lg shadow-violet-500/10">
        <div className="rounded-2xl bg-[#0d0d18] flex items-center gap-2 px-4 py-1.5">
          <span className="text-xl">✍️</span>
          <input value={cap} onChange={e => setCap(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && cap.trim()) { onCapture(cap.trim()); setCap('') } }}
            placeholder="Ghi nhanh 1 trải nghiệm / bài học hôm nay… (Enter để tạo trang)"
            className="flex-1 bg-transparent outline-none py-3 text-sm placeholder:text-zinc-600" />
          <button onClick={() => { if (cap.trim()) { onCapture(cap.trim()); setCap('') } }} disabled={!cap.trim()}
            className="rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-4 py-2 text-xs font-bold disabled:opacity-40">Tạo trang</button>
        </div>
      </div>

      {/* AI HIỂU BẠN % + ĐẾN HẠN ÔN + RAW (vòng lặp mỗi sáng) */}
      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        {(() => {
          const c = counts ?? { values: 0, mantras: 0, people: 0, dated: 0 }
          const parts: [string, number, number, string][] = [
            ['⭐ Giá trị cốt lõi (≥3)', Math.min(1, c.values / 3) * 20, 20, 'Thấm 1 bài → màn Hồn cốt'],
            ['⚓ Kim chỉ nam (≥3)', Math.min(1, c.mantras / 3) * 15, 15, 'viết mantra khi Thấm'],
            ['🎓 Bài đã Thấm (≥10)', Math.min(1, learnedIds.size / 10) * 25, 25, 'Thấm đều mỗi ngày'],
            ['👥 Người thật (≥5)', Math.min(1, c.people / 5) * 15, 15, 'kể chuyện người khi Thấm'],
            ['🔥 Streak (≥7 ngày)', Math.min(1, streak / 7) * 15, 15, 'mỗi ngày 1 hành động'],
            ['📅 Mốc đời (≥5)', Math.min(1, c.dated / 5) * 10, 10, 'gắn ngày sự kiện cho trang'],
          ]
          const pctAI = Math.round(parts.reduce((s2, p2) => s2 + p2[1], 0))
          const missing = parts.filter(p2 => p2[1] < p2[2])[0]
          return (
            <Card className="flex items-center gap-4">
              <svg width="74" height="74" viewBox="0 0 74 74" className="shrink-0 -rotate-90">
                <circle cx="37" cy="37" r="31" fill="none" stroke="rgba(127,127,160,.15)" strokeWidth="7" />
                <circle cx="37" cy="37" r="31" fill="none" stroke="url(#aig)" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${pctAI * 1.948} 999`} />
                <defs><linearGradient id="aig"><stop offset="0%" stopColor="#8b5cf6" /><stop offset="100%" stopColor="#22d3ee" /></linearGradient></defs>
              </svg>
              <div className="min-w-0">
                <div className="text-2xl font-black bg-gradient-to-r from-violet-400 to-cyan-300 bg-clip-text text-transparent">{pctAI}%</div>
                <Lbl>🤖 AI hiểu bạn</Lbl>
                {missing && <p className="text-[10px] text-zinc-500 leading-snug mb-1.5">Tăng tiếp: <b className="text-zinc-300">{missing[0]}</b> — {missing[3]}</p>}
                <div className="flex flex-wrap gap-1">
                  <button onClick={() => setQaOpen(true)} className="text-[10px] rounded-lg bg-gradient-to-r from-violet-500 to-cyan-500 px-2 py-1 font-bold">💬 Trả lời 3 câu hôm nay</button>
                  <button disabled title="Kết nối FB/Insta/YouTube để AI đọc giọng content của bạn — khi cắm API" className="text-[10px] rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-zinc-600">🔗 FB/Insta · soon</button>
                </div>
              </div>
            </Card>
          )
        })()}
        <Card>
          <Lbl>⏰ Đến hạn ôn hôm nay ({dueIds.length})</Lbl>
          {dueIds.length === 0 ? <p className="text-xs text-zinc-600 mt-1">Chưa có bài nào tới hạn — tuyệt!</p> : (
            <div className="space-y-1 mt-1">
              {dueIds.slice(0, 3).map(id => {
                const n = pages.find(p2 => p2.id === id) ?? recent.find(p2 => p2.id === id)
                return n ? (
                  <button key={id} onClick={() => onDigest(n)} className="w-full text-left text-xs rounded-lg bg-white/[0.04] border border-white/10 px-2.5 py-1.5 hover:border-violet-400/40 truncate">🔁 {n.title || 'Trang'}</button>
                ) : null
              })}
              {dueIds.length > 3 && <p className="text-[10px] text-zinc-600">+{dueIds.length - 3} bài nữa</p>}
            </div>
          )}
        </Card>
        <Card>
          <Lbl>⚡ Nạp dữ liệu & xét duyệt</Lbl>
          {editorial.length > 0 ? (
            <div className="space-y-1 mb-2">
              {editorial.slice(0, 2).map(n => (
                <button key={n.id} onClick={() => onOpen(n)} className="w-full text-left rounded-lg bg-white/[0.04] border border-white/10 px-2 py-1.5 hover:border-amber-400/40">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] shrink-0">{n.status === 'pending' ? '⏳' : '📝'}</span>
                    <span className="flex-1 text-[11px] truncate text-zinc-300">{n.title}</span>
                  </div>
                  {n.note && <p className="text-[10px] text-amber-200/80 truncate mt-0.5">💬 BTV: {n.note}</p>}
                </button>
              ))}
            </div>
          ) : <p className="text-[11px] text-zinc-500 leading-snug mb-2">Chưa có bài chờ duyệt. Raw → AI tạo bản chuẩn → bạn duyệt → nộp.</p>}
          <button onClick={onRaw} className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs font-bold text-zinc-300 hover:bg-white/10">↓ Tới khu nạp liệu</button>
        </Card>
      </div>

      {/* BÀI CỦA TÔI VỚI BAN BIÊN TẬP */}
      {editorial.length > 0 && (
        <Card className="mb-4">
          <Lbl>📨 Bài của tôi với ban biên tập ({editorial.length})</Lbl>
          <div className="space-y-1.5">
            {editorial.map(n => (
              <button key={n.id} onClick={() => onOpen(n)} className="w-full text-left rounded-xl px-3 py-2 bg-white/[0.03] border border-white/10 hover:border-amber-400/40 transition flex items-center gap-2">
                <span className="text-lg shrink-0">{n.icon || '📄'}</span>
                <span className="flex-1 text-sm truncate">{n.title || 'Trang'}</span>
                {n.status === 'pending'
                  ? <span className="text-[10px] rounded bg-amber-500/15 border border-amber-400/30 text-amber-300 px-1.5 py-0.5 shrink-0">⏳ chờ duyệt</span>
                  : <span className="text-[10px] rounded bg-zinc-500/15 border border-zinc-400/30 text-zinc-400 px-1.5 py-0.5 shrink-0" title={n.note}>📝 bị trả lại{n.note ? ' · có góp ý' : ''}</span>}
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        {/* CẦN THẨM THẤU — việc học hôm nay */}
        <Card>
          <div className="flex items-center justify-between mb-2">
            <Lbl>🎓 Cần thẩm thấu ({unlearned.length ? `${pages.length - learnedCount} bài` : 'xong!'})</Lbl>
            <span className="text-[10px] text-zinc-600">{pct}% kho đã Thấm</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 mb-3 overflow-hidden"><div className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all" style={{ width: `${pct}%` }} /></div>
          <div className="space-y-1.5">
            {unlearned.map(n => (
              <div key={n.id} className="flex items-center gap-2 rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2 hover:border-violet-400/40 transition group">
                <span className="text-lg shrink-0">{n.icon || '📄'}</span>
                <button onClick={() => onOpen(n)} className="flex-1 text-left text-sm truncate text-zinc-300 hover:text-white">{n.title || 'Trang'}</button>
                <button onClick={() => onDigest(n)} className="opacity-0 group-hover:opacity-100 text-[10px] rounded-lg bg-gradient-to-r from-violet-500 to-cyan-500 px-2.5 py-1 font-bold shrink-0">Thấm ngay</button>
              </div>
            ))}
            {unlearned.length === 0 && <p className="text-xs text-zinc-600 py-3 text-center">🏆 Mọi bài đều đã thẩm thấu. Viết trải nghiệm mới đi!</p>}
          </div>
        </Card>

        {/* TIẾP TỤC VIẾT */}
        <Card>
          <Lbl>⏱️ Tiếp tục viết</Lbl>
          <div className="space-y-1.5">
            {recent.slice(0, 5).map(n => (
              <button key={n.id} onClick={() => onOpen(n)} className="w-full text-left rounded-xl px-3 py-2 bg-white/[0.03] border border-white/10 hover:border-cyan-400/40 hover:bg-white/[0.06] transition flex items-center gap-2">
                <span className="text-lg shrink-0">{n.icon || '📄'}</span>
                <span className="text-sm truncate">{n.title || 'Trang mới'}</span>
              </button>
            ))}
            {recent.length === 0 && <p className="text-xs text-zinc-600 py-3 text-center">Chưa mở trang nào — bắt đầu từ ô ghi nhanh ↑</p>}
          </div>
        </Card>
      </div>

      {/* dải số liệu + galaxy mini-cta */}
      <div className="flex items-center gap-3 rounded-2xl bg-white/[0.03] border border-white/10 px-5 py-3.5 mb-4 text-sm">
        <span className="text-zinc-400">📄 <b className="text-white">{stats.pages}</b> trang</span>
        <span className="text-zinc-700">·</span>
        <span className="text-zinc-400">📝 <b className="text-white">{stats.notes}</b> note</span>
        <span className="text-zinc-700">·</span>
        <span className="text-zinc-400">🕸️ <b className="bg-gradient-to-r from-violet-400 to-cyan-300 bg-clip-text text-transparent">{stats.links}</b> liên kết</span>
        <button onClick={onGalaxy} className="ml-auto text-xs rounded-xl bg-white/10 border border-white/10 px-3 py-1.5 hover:bg-white/15">🌌 Mở Galaxy</button>
      </div>

      <Card><Lbl>📡 KOL feed (Phase 2)</Lbl>
        <p className="text-sm text-zinc-400">Cập nhật từ lãnh đạo QNET & idol bạn chọn — đọc xong take-note ngay.</p>
      </Card>

      {/* 💬 3 CÂU MỖI NGÀY — AI nắm dần con người bạn */}
      {qaOpen && (() => {
        const BANK = [
          'Điều gì hôm nay làm bạn tự hào nhất?', 'Nỗi sợ lớn nhất của bạn trong công việc hiện tại?', 'Nếu dư 1 giờ mỗi ngày, bạn làm gì?',
          'Khách hàng gần nhất hỏi bạn điều gì?', 'Câu nói nào của ai đó còn vang trong đầu bạn?', 'Bạn đang né tránh việc gì?',
          'Thành tựu 5 năm tới bạn muốn kể lại là gì?', 'Điều gì khiến bạn bắt đầu QNET?', 'Hôm nay ai làm bạn biết ơn?',
          'Bạn giỏi điều gì mà ít ai biết?', 'Một thói quen bạn muốn bỏ?', 'Nếu không sợ gì cả, ngày mai bạn làm gì?'
        ]
        const day = Math.floor(Date.now() / 86400000)
        const qs = [BANK[day % 12], BANK[(day + 4) % 12], BANK[(day + 8) % 12]]
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[58] grid place-items-center p-6" onClick={() => setQaOpen(false)}>
            <div className="w-[480px] max-w-[92vw] rounded-2xl bg-[#15151f] border border-white/10 shadow-2xl p-5" onClick={e => e.stopPropagation()}>
              <div className="text-sm font-bold mb-1">💬 3 câu hôm nay — để AI hiểu bạn sâu hơn</div>
              <p className="text-xs text-zinc-500 mb-3">Trả lời thật — tất cả vào trang "Tôi là ai" trong kho riêng của bạn.</p>
              {qs.map((q2, i) => (
                <div key={i} className="mb-2.5">
                  <div className="text-xs text-zinc-300 mb-1">{i + 1}. {q2}</div>
                  <textarea value={qaAns[i]} onChange={e => setQaAns(a => a.map((x, j) => j === i ? e.target.value : x))} className="w-full h-14 rounded-xl bg-white/5 border border-white/10 p-2.5 text-xs outline-none focus:border-violet-400/50" />
                </div>
              ))}
              <button onClick={async () => {
                const filled = qs.map((q2, i) => qaAns[i].trim() ? `**${q2}**\n${qaAns[i].trim()}` : null).filter(Boolean)
                if (!filled.length) { setQaOpen(false); return }
                let { data: me } = await supabase.from('nodes').select('id,md,org_id,parent_id').eq('owner_id', user.id).eq('subtype', 'profile_me').limit(1).maybeSingle()
                if (!me) {
                  const { data: kho } = await supabase.from('nodes').select('id,org_id').eq('owner_id', user.id).eq('kind', 'kho').limit(1).maybeSingle()
                  const nid = crypto.randomUUID()
                  await supabase.from('nodes').insert({ id: nid, org_id: kho?.org_id, owner_id: user.id, layer: 'personal', kind: 'page', parent_id: kho?.id ?? null, title: 'Tôi là ai', icon: '🪞', subtype: 'profile_me', md: '# Tôi là ai\n\nAI đọc trang này để hiểu con người bạn.', status: 'published', min_level: 1 })
                  me = { id: nid, md: '# Tôi là ai', org_id: kho?.org_id, parent_id: kho?.id }
                }
                const today = new Date().toLocaleDateString('vi')
                await supabase.from('nodes').update({ md: `${me.md ?? ''}\n\n## ${today}\n\n${filled.join('\n\n')}` }).eq('id', me.id)
                await supabase.from('events').insert({ user_id: user.id, type: 'ai_qa', node_id: me.id })
                setQaAns(['', '', '']); setQaOpen(false)
              }} className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 py-2.5 text-sm font-bold">✓ Lưu vào "Tôi là ai"</button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

/* ---------- CONTENT ENGINE (gallery template) ---------- */
const TEMPLATES = [
  { icon: '📘', name: 'Bài Facebook', desc: 'Storytelling 200–400 chữ từ một bài học đã chín.' },
  { icon: '🎬', name: 'Kịch bản Reel 30s', desc: 'Hook 3 giây → bài học → call-to-action.' },
  { icon: '📧', name: 'Tin nhắn chăm khách', desc: 'Follow-up cá nhân hoá theo từng khách hàng.' },
  { icon: '🎤', name: 'Dàn ý chia sẻ 5 phút', desc: 'Cho buổi event / zoom đội nhóm.' },
  { icon: '📝', name: 'Bài blog dài', desc: 'Tổng hợp nhiều note thành bài chuyên sâu có trích nguồn.' },
  { icon: '💬', name: 'Caption ngắn', desc: '3 phương án caption + hashtag theo giọng của bạn.' },
]
export function Engine({ folders }: { folders: N[] }) {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-1">✍️ Content Engine</h1>
      <p className="text-zinc-500 text-sm mb-6">Biến bài học đã chín thành content theo giọng của bạn. <span className="text-amber-300">(Phase 2 — chờ kết nối AI key)</span></p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {TEMPLATES.map(t => (
          <div key={t.name} className="group rounded-2xl bg-white/[0.04] border border-white/10 p-4 hover:border-violet-400/50 hover:bg-white/[0.06] transition cursor-not-allowed relative overflow-hidden">
            <div className="text-3xl mb-2">{t.icon}</div>
            <div className="font-semibold text-sm mb-1">{t.name}</div>
            <p className="text-xs text-zinc-500 leading-relaxed">{t.desc}</p>
            <span className="absolute top-3 right-3 text-[9px] uppercase tracking-wider rounded bg-amber-500/15 border border-amber-400/30 text-amber-300 px-1.5 py-0.5">soon</span>
          </div>
        ))}
      </div>
      <Card className="mb-4"><Lbl>🎙️ Giọng thương hiệu</Lbl>
        <p className="text-sm text-zinc-400">20 câu onboarding → AI hiểu giọng + giá trị của bạn để viết authentic, không giống ai.</p>
      </Card>
      <Card><Lbl>⚡ Bài học sẵn sàng tạo content</Lbl>
        <div className="flex flex-wrap gap-2 mt-1">
          {folders.slice(0, 12).map(f => <span key={f.id} className="text-xs rounded-lg bg-white/5 border border-white/10 px-3 py-1.5">📂 {f.title}</span>)}
          {folders.length === 0 && <span className="text-xs text-zinc-500">Tạo & học bài ở kho tri thức trước.</span>}
        </div>
        <p className="text-xs text-zinc-600 mt-3">Chỉ bài Độ Thấm cao mới đủ điều kiện sinh content (cổng chất lượng).</p>
      </Card>
    </div>
  )
}

/* ---------- BOARD (kanban thật, kéo-thả lưu vào props.board) ---------- */
type BCard = { id: string; title: string | null; icon: string | null; props: Record<string, unknown> | null; event_date?: string | null }
const BOARD_COLS = [
  { k: 'idea', t: '💡 Ý tưởng', tint: 'border-violet-400/30' },
  { k: 'doing', t: '🎥 Đang làm', tint: 'border-cyan-400/30' },
  { k: 'scheduled', t: '🗓️ Lên lịch', tint: 'border-amber-400/30' },
  { k: 'done', t: '✅ Đã đăng', tint: 'border-emerald-400/30' },
]
export function Board({ orgId, userId, onOpen }: { orgId: string | null; userId: string; onOpen?: (id: string) => void }) {
  const [cards, setCards] = useState<BCard[]>([])
  const [drag, setDrag] = useState<string | null>(null)
  const [over, setOver] = useState<string | null>(null)
  const [bview, setBview] = useState<'kanban' | 'time'>('kanban')
  const [resultFor, setResultFor] = useState<BCard | null>(null)
  const [res, setRes] = useState({ channel: 'facebook', reach: '', leads: '', note: '' })
  useEffect(() => {
    if (!orgId) return
    supabase.from('nodes').select('id,title,icon,props,event_date').eq('org_id', orgId).eq('owner_id', userId).eq('layer', 'personal').in('kind', ['note', 'page'])
      .order('position', { nullsFirst: true }).then(({ data }) => setCards((data as BCard[]) ?? []))
  }, [orgId, userId])
  function colOf(c: BCard) { return (c.props?.board as string) ?? 'idea' }
  async function moveTo(cardId: string, col: string) {
    setOver(null); setDrag(null)
    const card = cards.find(c => c.id === cardId); if (!card || colOf(card) === col) return
    const props = { ...(card.props ?? {}), board: col }
    setCards(cs => cs.map(c => (c.id === cardId ? { ...c, props } : c)))
    await supabase.from('nodes').update({ props }).eq('id', cardId)
    // khép vòng lặp: vừa ĐĂNG xong → hỏi kết quả (ROADMAP P0 #1)
    if (col === 'done') { setResultFor(card); setRes({ channel: 'facebook', reach: '', leads: '', note: '' }) }
  }
  function reload() {
    if (!orgId) return
    supabase.from('nodes').select('id,title,icon,props,event_date').eq('org_id', orgId).eq('owner_id', userId).eq('layer', 'personal').in('kind', ['note', 'page'])
      .order('position', { nullsFirst: true }).then(({ data }) => setCards((data as BCard[]) ?? []))
  }
  // thẻ mới: tự sống trong folder "🎬 Xưởng content" của kho cá nhân (tự tạo nếu chưa có)
  async function newCard(col: string) {
    if (!orgId) return
    let { data: studio } = await supabase.from('nodes').select('id').eq('org_id', orgId).eq('owner_id', userId).eq('title', 'Xưởng content').limit(1).maybeSingle()
    if (!studio) {
      const { data: kho } = await supabase.from('nodes').select('id').eq('org_id', orgId).eq('owner_id', userId).eq('kind', 'kho').limit(1).maybeSingle()
      const sid = crypto.randomUUID()
      await supabase.from('nodes').insert({ id: sid, org_id: orgId, owner_id: userId, layer: 'personal', kind: 'page', parent_id: kho?.id ?? null, title: 'Xưởng content', icon: '🎬', status: 'published', min_level: 1 })
      studio = { id: sid }
    }
    const id = crypto.randomUUID()
    await supabase.from('nodes').insert({ id, org_id: orgId, owner_id: userId, layer: 'personal', kind: 'note', parent_id: studio.id, title: 'Ý tưởng mới', icon: '💡', status: 'published', min_level: 1, props: { board: col } })
    reload()
    onOpen?.(id)
  }
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-3xl font-extrabold">📋 Board content</h1>
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 text-xs">
          <button onClick={() => setBview('kanban')} className={`px-3 py-1.5 rounded-lg ${bview === 'kanban' ? 'bg-gradient-to-r from-violet-500 to-cyan-500 text-white' : 'text-zinc-400'}`}>▦ Kanban</button>
          <button onClick={() => setBview('time')} className={`px-3 py-1.5 rounded-lg ${bview === 'time' ? 'bg-gradient-to-r from-violet-500 to-cyan-500 text-white' : 'text-zinc-400'}`}>📅 Campaign timeline</button>
        </div>
      </div>
      <p className="text-zinc-500 text-sm mb-6">Kéo-thả qua giai đoạn · gắn 🚩 campaign + 📅 ngày ngay trong trang thẻ → xem timeline chiến dịch.</p>
      {bview === 'time' ? (() => {
        const active = cards.filter(c => colOf(c) !== 'idea' || (c.props?.campaign as string) || c.event_date)
        const groups = [...new Set(active.map(c => (c.props?.campaign as string) || 'Chưa gắn campaign'))]
        const dated = active.filter(c => c.event_date)
        const ts = dated.map(c => new Date(c.event_date!).getTime())
        const mn = ts.length ? Math.min(...ts) : Date.now() - 14 * 86400000
        const mx = Math.max(ts.length ? Math.max(...ts) : 0, Date.now() + 14 * 86400000)
        const X = (tm: number) => ((tm - mn) / (mx - mn)) * 100
        const stageColor: Record<string, string> = { idea: '#a78bfa', doing: '#22d3ee', scheduled: '#fbbf24', done: '#34d399' }
        return (
          <div className="space-y-3">
            <div className="relative h-6 ml-44 mr-4">
              <div className="absolute inset-x-0 top-1/2 h-px bg-white/10" />
              <div className="absolute top-0 bottom-0 w-px bg-cyan-400/60" style={{ left: X(Date.now()) + '%' }} />
              <span className="absolute -top-1 text-[9px] text-cyan-300" style={{ left: `calc(${X(Date.now())}% + 4px)` }}>hôm nay</span>
            </div>
            {groups.map(g => {
              const items = active.filter(c => ((c.props?.campaign as string) || 'Chưa gắn campaign') === g)
              const done = items.filter(c => colOf(c) === 'done').length
              return (
                <div key={g} className="flex items-center gap-3">
                  <div className="w-40 shrink-0 text-right">
                    <div className="text-xs font-bold text-zinc-200 truncate">🚩 {g}</div>
                    <div className="text-[10px] text-zinc-600">{done}/{items.length} xong</div>
                  </div>
                  <div className="relative flex-1 h-12 rounded-xl bg-white/[0.03] border border-white/10 overflow-hidden">
                    <div className="absolute top-0 bottom-0 w-px bg-cyan-400/30" style={{ left: X(Date.now()) + '%' }} />
                    {items.filter(c => c.event_date).map(c => (
                      <button key={c.id} onClick={() => onOpen?.(c.id)} title={`${c.title} · ${c.event_date}`}
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 grid place-items-center rounded-full text-[10px] hover:scale-125 transition"
                        style={{ left: X(new Date(c.event_date!).getTime()) + '%', background: stageColor[colOf(c)] + '33', border: `1.5px solid ${stageColor[colOf(c)]}` }}>
                        {c.icon || '•'}
                      </button>
                    ))}
                    {items.filter(c => !c.event_date).length > 0 && (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600">⏳ {items.filter(c => !c.event_date).length} thẻ chưa hẹn ngày</span>
                    )}
                  </div>
                </div>
              )
            })}
            {groups.length === 0 && <p className="text-sm text-zinc-600 text-center py-10">Chưa có thẻ nào — gắn 🚩 campaign cho thẻ ở view Kanban.</p>}
            <div className="flex gap-3 ml-44 text-[10px] text-zinc-500">
              {Object.entries(stageColor).map(([k, c]) => <span key={k} className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: c }} />{k === 'idea' ? 'Ý tưởng' : k === 'doing' ? 'Đang làm' : k === 'scheduled' ? 'Lên lịch' : 'Đã đăng'}</span>)}
            </div>
          </div>
        )
      })() : (
      <div className="flex gap-4 overflow-x-auto pb-2">
        {BOARD_COLS.map(col => {
          const items = cards.filter(c => colOf(c) === col.k)
          return (
            <div key={col.k}
              onDragOver={e => { e.preventDefault(); setOver(col.k) }}
              onDragLeave={() => over === col.k && setOver(null)}
              onDrop={e => { e.preventDefault(); if (drag) moveTo(drag, col.k) }}
              className={`min-w-[250px] flex-1 rounded-2xl bg-white/[0.04] border p-3 transition ${over === col.k ? 'border-violet-400/70 bg-violet-500/10' : 'border-white/10'}`}>
              <div className="text-sm font-semibold text-zinc-300 mb-3 flex items-center justify-between">
                <span>{col.t}</span><span className="text-zinc-600 text-xs">{items.length}</span>
              </div>
              <div className="space-y-2 min-h-[60px]">
                {items.map(c => (
                  <div key={c.id} draggable
                    onDragStart={() => setDrag(c.id)} onDragEnd={() => { setDrag(null); setOver(null) }}
                    onClick={() => onOpen?.(c.id)}
                    className={`rounded-xl bg-[#10101c] border border-white/10 p-3 text-sm cursor-grab active:cursor-grabbing hover:border-violet-400/40 transition ${drag === c.id ? 'opacity-40' : ''}`}>
                    {c.icon || '📝'} {c.title || 'Chưa đặt tên'}
                  </div>
                ))}
                {items.length === 0 && <p className="text-xs text-zinc-600 text-center pt-4">thả vào đây</p>}
                <button onClick={() => newCard(col.k)} className="w-full text-left text-xs text-zinc-500 hover:text-zinc-200 rounded-xl border border-dashed border-white/10 hover:border-violet-400/40 px-3 py-2 transition">＋ Thẻ mới</button>
              </div>
            </div>
          )
        })}
      </div>
      )}
      <p className="text-xs text-zinc-600 mt-4">💡 Thẻ mới tự nằm trong trang <b className="text-zinc-400">🎬 Xưởng content</b> của kho cá nhân. Kéo thẻ đổi giai đoạn — lưu ngay. Bấm thẻ để mở trang.</p>
      {/* NHẬP KẾT QUẢ CONTENT — khép vòng kho → content → kết quả */}
      {resultFor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[58] grid place-items-center p-6" onClick={() => setResultFor(null)}>
          <div className="w-[420px] max-w-[92vw] rounded-2xl bg-[#15151f] border border-white/10 shadow-2xl p-5" onClick={e => e.stopPropagation()}>
            <div className="text-sm font-bold mb-1">📣 Đã đăng "{resultFor.title}"!</div>
            <p className="text-xs text-zinc-500 mb-3">Ghi kết quả 20 giây — AI sau này sẽ học "content nào ra tiền" từ chính số liệu này.</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <select value={res.channel} onChange={e => setRes({ ...res, channel: e.target.value })} className="rounded-lg bg-white/5 border border-white/10 px-2 py-2 text-xs outline-none">
                {['facebook', 'tiktok', 'zalo', 'instagram', 'youtube', 'khác'].map(c => <option key={c}>{c}</option>)}
              </select>
              <input value={res.reach} onChange={e => setRes({ ...res, reach: e.target.value })} placeholder="👁 Reach/View" type="number" className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-2 text-xs outline-none" />
              <input value={res.leads} onChange={e => setRes({ ...res, leads: e.target.value })} placeholder="🎯 Lead/tin nhắn" type="number" className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-2 text-xs outline-none" />
              <input value={res.note} onChange={e => setRes({ ...res, note: e.target.value })} placeholder="Ghi chú…" className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-2 text-xs outline-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setResultFor(null)} className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-zinc-400">Để sau</button>
              <button onClick={async () => {
                await supabase.from('content_results').insert({ org_id: orgId, user_id: userId, card_node_id: resultFor.id, source_node_id: (resultFor.props?.source_node_id as string) ?? null, channel: res.channel, reach: +res.reach || 0, leads: +res.leads || 0, note: res.note || null })
                await supabase.from('events').insert({ user_id: userId, type: 'content_result', node_id: resultFor.id })
                setResultFor(null)
              }} className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-3 py-2 text-xs font-bold">✓ Lưu kết quả</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
