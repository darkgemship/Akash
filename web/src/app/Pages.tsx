'use client'
import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import { depthScore } from './Digest'
import { DIM_COLOR } from './Galaxy'
import { Wordmark, StatusLine, Constellation, Corners } from './Hud'

type N = { id: string; title: string | null; kind: string; parent_id: string | null }

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`hud-panel p-5 ${className}`}>{children}</div>
}
function Lbl({ children }: { children: React.ReactNode }) {
  return <div className="hud-label mb-2">{children}</div>
}

/* ---------- PROFILE (đổi mật khẩu thật + quản trị thành viên) ---------- */
const ROLE_NAME: Record<number, string> = { 5: '👑 Admin', 4: '✅ Tổng biên tập', 3: '✏️ Biên tập viên', 2: '🤝 Cộng tác viên', 1: '👤 Thành viên' }


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
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden"><div className="h-full bg-amber-400 text-black hover:bg-amber-300 transition-all" style={{ width: `${filled / 8 * 100}%` }} /></div>
      {open && (
        <div className="mt-3 space-y-2.5">
          {VOICE_QS.map((q2, i) => (
            <div key={i}>
              <div className="text-xs text-zinc-300 mb-1">{i + 1}. {q2}</div>
              <textarea value={ans[i]} onChange={e => setAns(a => a.map((x, j) => j === i ? e.target.value : x))} className="w-full h-12 rounded-xl bg-white/5 border border-white/10 p-2.5 text-xs outline-none focus:border-amber-400/50" />
            </div>
          ))}
          <button onClick={async () => {
            const { error } = await supabase.from('profiles').upsert({ id: me, voice: { answers: ans, updated_at: new Date().toISOString() } })
            setSaved(error ? '⚠️ ' + error.message : '✅ Đã lưu giọng của bạn')
            setTimeout(() => setSaved(''), 2500)
          }} className="w-full rounded-xl bg-amber-400 text-black hover:bg-amber-300 py-2.5 text-sm font-bold">💾 Lưu giọng</button>
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
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-blue-400" />
        <div>
          <h1 className="text-2xl font-extrabold">{user.email?.split('@')[0]}</h1>
          <p className="text-zinc-400 text-sm">{user.email} · {level ? ROLE_NAME[level] : '—'}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <Card><Lbl>⚡ Qi điểm</Lbl><div className="text-3xl font-black text-amber-300">{qi}</div><p className="text-[10px] text-zinc-600 mt-1">thấm 10 · content 5 · nối 3 · trang 1</p></Card>
        <Card><Lbl>🔥 Streak</Lbl><div className="text-3xl font-black">{streak}<span className="text-sm text-zinc-500"> ngày</span></div></Card>
        <Card><Lbl>🏆 Tổng Độ Chuyển hoá</Lbl><div className="text-3xl font-black text-zinc-50">{total}</div></Card>
        <Card><Lbl>🎓 Bài đã chuyển hoá</Lbl><div className="text-3xl font-black">{learned}</div></Card>
      </div>
      <VoiceCard me={user.id} />
      <Card className="mb-4">
        <Lbl>🔒 Đổi mật khẩu</Lbl>
        <div className="flex gap-2">
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Mật khẩu mới (≥ 6 ký tự)" className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none" />
          <button onClick={changePw} className="rounded-xl ak-cta px-4 text-sm font-semibold">Đổi</button>
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

/* ---------- STUDIO NHẬP LIỆU (dashboard riêng: raw → đề xuất → duyệt + phân việc) ---------- */
// taxonomy THỐNG NHẤT 7 loại (KHO-CHUAN §1) — blog/video là OUTPUT format (trục 2), không phải loại tri thức
const PT: [string, string][] = [['trai-nghiem', '🌱 Trải nghiệm'], ['bai-hoc', '🎓 Bài học'], ['quy-trinh', '📋 Quy trình'], ['ho-so', '👤 Hồ sơ'], ['nguon', '📚 Nguồn'], ['su-kien', '🌟 Sự kiện'], ['ghi-chu', '📝 Ghi chú']]
type SPage = { id: string; title: string | null; layer: string; kind: string; parent_id?: string | null; icon?: string | null; subtype?: string | null }
// liên kết bài mới ↔ trang có sẵn: dir 'out' = bài này nối tới trang, 'in' = backlink từ trang về bài này; dim = 1 trong 8 chiều FRAMEWORK
type Conn = { id: string; dir: 'out' | 'in'; dim: string }
const DIM_VI: [string, string][] = [['knowledge', 'Kiến thức'], ['experience', 'Trải nghiệm'], ['emotion', 'Cảm xúc'], ['values', 'Giá trị'], ['people', 'Con người'], ['time', 'Thời gian'], ['reference', 'Tham chiếu'], ['anchor', 'Neo']]
type Asg = { id: string; title: string; note: string | null; due: string | null; status: string; assignee: string; assigner: string; created_at: string }
const sw = (x: string) => (x ?? '').toLowerCase()

const DEFAULT_TPL: Record<string, string> = {
  'su-kien': '## 📍 Chuyện gì\n\n## 🌟 Vì sao là mốc\n',
  'ghi-chu': '## 💡 Ý chính\n- \n\n## 📌 Chi tiết\n',
  'bai-hoc': '## ⚡ Nguyên lý cốt lõi\n\n## 📖 Diễn giải\n\n## 🌍 Ví dụ thực tế\n\n## 🎯 Áp dụng\n- [ ] ',
  'trai-nghiem': '## 📍 Bối cảnh\n\n## ⚡ Chuyện gì xảy ra\n\n## ❤️ Cảm xúc\n\n## 🎓 Bài học rút ra\n',
    'quy-trinh': '## Các bước\n1. [ ] \n2. [ ] \n\n## Lưu ý\n',
  'ho-so': '## 👤 Thông tin\n\n## 💬 Lịch sử tương tác\n\n## 🚦 Trạng thái\n\n## ▶️ Bước tiếp\n- [ ] ',
  'nguon': '## 🧭 Một câu tóm tắt\n\n## 💡 3 ý đắt nhất\n1. \n\n## 📌 Quote\n> \n\n## 🎯 Áp dụng\n- [ ] ',
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
    setPtype(r.match(/quy trình|checklist|các bước|kịch bản|script/) ? 'quy-trinh' : r.match(/khách|chị |anh |tư vấn|hồ sơ/) ? 'ho-so' : r.match(/sách|chương|tác giả|podcast/) ? 'nguon' : r.match(/sự kiện|hội thảo|event|buổi lễ/) ? 'su-kien' : r.match(/bài học|nguyên lý|quy tắc/) ? 'bai-hoc' : r.match(/hôm nay|cảm thấy|mình đã/) ? 'trai-nghiem' : 'ghi-chu')
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
          className={`w-full flex items-center gap-1.5 rounded-lg py-1.5 pr-2 text-left text-xs border transition ${sel ? 'bg-violet-500/15 border-violet-400/50 text-white font-semibold' : 'border-transparent text-zinc-300 hover:bg-white/5'}`}>
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
    // KHÔNG nhét "# title" vào md — trang đã có title field, tránh 2 tiêu đề khổng lồ chồng nhau
    setDraft(`${head}\n\n${tpl}\n\n## 💎 Trích dẫn đắt\n> \n\n## 📥 Nội dung gốc\n\n${raw.trim()}`)
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

  const stepCls = (n: number) => `flex-1 text-center text-[11px] py-2 rounded-xl border transition ${step === n ? 'bg-violet-500/15 border-violet-400/40 text-white font-bold' : step > n ? 'bg-white/5 border-white/10 text-zinc-400' : 'bg-white/[0.02] border-white/5 text-zinc-600'}`
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
          <textarea value={raw} onChange={e => setRaw(e.target.value)} placeholder="Dán bất cứ gì: ghi chép buổi event, transcript video, bài copy từ nhóm, chương sách…" className="w-full h-64 rounded-xl bg-white/5 border border-white/10 p-4 text-sm outline-none focus:border-violet-400/50 mb-3" />
          <button onClick={analyze} disabled={!raw.trim()} className="w-full rounded-xl ak-cta py-3 text-sm font-bold disabled:opacity-40">⚡ Phân tích & đề xuất →</button>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <Lbl>🤖 Máy đề xuất — bấm chọn để xác nhận (AI thật sẽ hỏi sâu hơn khi cắm API)</Lbl>
          <div className="space-y-4 mt-2">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">Tiêu đề đề xuất — sửa được</div>
              <input value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-violet-400/50" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">Loại nội dung — máy đoán, bạn chỉnh</div>
              <div className="flex flex-wrap gap-1.5">{PT.map(([k, l]) => <button key={k} onClick={() => setPtype(k)} className={`px-3 py-1.5 rounded-lg text-xs border ${ptype === k ? 'bg-violet-500/25 border-violet-400/50 text-violet-100' : 'bg-white/5 border-white/10 text-zinc-400'}`}>{l}</button>)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">Đưa vào đâu? — chọn kho, cây folder bung ra bên dưới</div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                <button onClick={() => { setTarget('personal'); setDestId(null); setDestOpen(new Set()) }} className={`px-3 py-1.5 rounded-lg text-xs border ${target === 'personal' ? 'bg-violet-500/25 border-violet-400/50 text-violet-100' : 'bg-white/5 border-white/10 text-zinc-400'}`}>🧠 Kho của tôi (vào ngay)</button>
                <button onClick={() => { setTarget('humanity'); setDestId(null); setDestOpen(new Set()) }} className={`px-3 py-1.5 rounded-lg text-xs border ${target === 'humanity' ? 'bg-violet-500/25 border-violet-400/50 text-violet-100' : 'bg-white/5 border-white/10 text-zinc-400'}`}>♾️ Đề xuất Kho nhân loại (chờ duyệt)</button>
                {canEdit && <button onClick={() => { setTarget('corporate'); setDestId(null); setDestOpen(new Set()) }} className={`px-3 py-1.5 rounded-lg text-xs border ${target === 'corporate' ? 'bg-cyan-500/25 border-cyan-400/50 text-cyan-100' : 'bg-white/5 border-white/10 text-zinc-400'}`}>🌐 Kho QNET (chờ duyệt)</button>}
              </div>
              {/* 📂 cây folder của kho đang chọn — bấm chọn nơi nạp, ▸ mở cấp con */}
              <div className="max-h-44 overflow-auto rounded-lg bg-black/20 border border-white/5 p-1.5 space-y-0.5">
                <button onClick={() => setDestId(null)}
                  className={`w-full flex items-center gap-1.5 rounded-lg py-1.5 px-2 text-left text-xs border transition ${destId === null ? 'bg-violet-500/15 border-violet-400/50 text-white font-semibold' : 'border-transparent text-zinc-300 hover:bg-white/5'}`}>
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
                  <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet-400/50 [color-scheme:dark]" />
                </label>
                <label className="block">
                  <span className="text-[10px] text-zinc-500">🚩 Campaign — chiến dịch content (tuỳ chọn)</span>
                  <input value={campaign} onChange={e => setCampaign(e.target.value)} placeholder="vd: Tuyển thành viên T6" className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet-400/50" />
                </label>
              </div>
              <label className="block mb-2">
                <span className="text-[10px] text-zinc-500">✏️ Tóm tắt 1 câu — <b className="text-violet-300">bắt buộc</b>, AI dùng làm snippet khi trích dẫn</span>
                <input value={summary} onChange={e => setSummary(e.target.value)} placeholder="Một câu nói lên cốt lõi của bài…" className={`mt-1 w-full rounded-xl bg-white/5 border px-3 py-2 text-sm outline-none focus:border-violet-400/50 ${summary.trim() ? 'border-white/10' : 'border-amber-400/40'}`} />
              </label>
              <label className="block">
                <span className="text-[10px] text-zinc-500">🔗 Nguồn — sách / URL / người kể / tự trải nghiệm</span>
                <input value={source} onChange={e => setSource(e.target.value)} placeholder="vd: sách Atomic Habits ch.3 · buổi event 9/6 · tự trải nghiệm" className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet-400/50" />
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
                  {sugLinks.filter(({ pg }) => !conns.some(c => c.id === pg.id)).map(({ pg }) => <button key={pg.id} onClick={() => addConn(pg.id)} className="px-3 py-1.5 rounded-lg text-xs border bg-white/5 border-white/10 text-zinc-400 hover:border-violet-400/40">✨ {pg.icon || '📄'} {pg.title} <span className="text-zinc-600">· máy gợi ý</span></button>)}
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
              <button onClick={generate} disabled={!title.trim() || !summary.trim()} title={!summary.trim() ? 'Cần Tóm tắt 1 câu — trường bắt buộc theo chuẩn' : ''} className="flex-1 rounded-xl ak-cta py-2.5 text-sm font-bold disabled:opacity-40">🤖 AI tạo lại bản chuẩn →</button>
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
            <button onClick={publish} disabled={busy} className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-sm font-bold disabled:opacity-40">{busy ? 'Đang nộp…' : target === 'personal' ? `✓ OK — nạp vào ${destLbl}` : `📨 OK — nộp vào ${destLbl} & chờ duyệt`}</button>
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
              }} className="rounded-lg ak-cta px-4 py-2 text-xs font-bold">Giao việc</button>
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
                  <button onClick={async () => { await supabase.from('assignments').update({ status: 'submitted' }).eq('id', a.id); loadAsg() }} className="text-[10px] rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 px-2.5 py-1.5 shrink-0">📨 Nộp</button>
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
const CAP_TYPES: [string, string, string][] = [
  ['exp', '🌱 Trải nghiệm', 'Chuyện vừa xảy ra — vào 📓 Hành trình anh hùng'],
  ['insight', '💎 Insight', 'Ý chợt loé — vào 💎 Kim cương bài học'],
  ['quote', '💬 Quote đắt', 'Câu nói hay vừa nghe/đọc — kèm nguồn'],
]
export function Today({ user, role, stats, recent, pages, editorial = [], counts, onOpen, onOpenId, onCapture, onGalaxy, onDigest, onRaw, onKolAll }: {
  user: User
  role?: { level: number; can_edit: boolean; can_approve: boolean } | null
  stats: { pages: number; notes: number; links: number; dims?: number }
  recent: TodayNode[]
  pages: TodayNode[]            // note cá nhân — để tính "cần chuyển hoá"
  editorial?: (TodayNode & { status?: string; note?: string })[]
  counts?: { values: number; mantras: number; people: number; dated: number; pendingAll?: number }
  onOpen: (n: TodayNode) => void
  onOpenId: (id: string) => void
  onCapture: (title: string, type?: string, source?: string) => void
  onGalaxy: () => void
  onDigest: (n: TodayNode) => void
  onRaw?: () => void
  onKolAll?: () => void
}) {
  const [learnedIds, setLearnedIds] = useState<Set<string>>(new Set())
  const [dueIds, setDueIds] = useState<string[]>([])
  const [streak, setStreak] = useState(0)
  const [qi, setQi] = useState(0)
  const [cap, setCap] = useState('')
  const [capType, setCapType] = useState('exp')
  const [capSrc, setCapSrc] = useState('')
  const [myAsg, setMyAsg] = useState<{ id: string; title: string; due: string | null; node_id?: string | null }[]>([])
  const [kol, setKol] = useState<{ id: string; title: string; props: Record<string, unknown> }[]>([])
  const [quote, setQuote] = useState<{ text: string; from: string; id: string } | null>(null)
  const [qaOpen, setQaOpen] = useState(false)
  const [qaAns, setQaAns] = useState(['', '', ''])
  useEffect(() => {
    supabase.from('wisdom_depth').select('node_id,learned,next_review_at').eq('user_id', user.id).then(({ data }) => {
      setLearnedIds(new Set((data ?? []).filter(d => d.learned).map(d => d.node_id as string)))
      setDueIds((data ?? []).filter(d => d.learned && d.next_review_at && new Date(d.next_review_at as string) <= new Date()).map(d => d.node_id as string))
    })
    supabase.from('events').select('ts,type').eq('user_id', user.id).order('ts', { ascending: false }).limit(500).then(({ data }) => {
      const days = new Set((data ?? []).map(e => new Date(e.ts as string).toDateString()))
      let st = 0; const d = new Date()
      while (days.has(d.toDateString())) { st++; d.setDate(d.getDate() - 1) }
      setStreak(st)
      // P0 fix: Digest log event type 'tham' — key 'digest' cũ không bao giờ được ghi → Chuyển hoá được 0 Qi
      const PT2: Record<string, number> = { tham: 10, content: 5, link: 3, create: 1 }
      setQi(Math.round((data ?? []).reduce((s, e) => s + (PT2[e.type as string] ?? 0), 0)))
    })
    supabase.from('assignments').select('id,title,due,node_id,status,assignee').eq('assignee', user.id).neq('status', 'done').limit(5).then(({ data }) => setMyAsg((data as { id: string; title: string; due: string | null; node_id?: string | null }[]) ?? []))
    supabase.from('nodes').select('id,title,props').eq('subtype', 'kol_post').order('created_at', { ascending: false }).limit(30).then(({ data }) => {
      const all = (data as { id: string; title: string; props: Record<string, unknown> }[]) ?? []
      // xoay theo ngày để feed luôn mới
      const day = Math.floor(Date.now() / 86400000)
      setKol(all.length ? [0, 1, 2].map(i => all[(day * 3 + i) % all.length]) : [])
    })
    // quote sống: lấy 1 câu từ Kim Chỉ Nam
    supabase.from('nodes').select('id,md,title').eq('owner_id', user.id).eq('subtype', 'anchor_home').limit(1).maybeSingle().then(({ data }) => {
      const qs = (data?.md ?? '').split('\n').filter((l: string) => l.startsWith('> '))
      if (qs.length) { const day = Math.floor(Date.now() / 86400000); setQuote({ text: qs[day % qs.length].slice(2), from: 'Kim Chỉ Nam của bạn', id: data!.id as string }) }
    })
  }, [user.id])
  // đồng hồ HUD — chỉ chạy client để tránh lệch hydrate
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => { setNow(new Date()); const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])
  const hour = new Date().getHours()
  const greet = hour < 11 ? 'Chào buổi sáng' : hour < 14 ? 'Chào buổi trưa' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'
  const learnedCount = pages.filter(p => learnedIds.has(p.id)).length
  // gợi ý chuyển hoá — lý do TRUNG THỰC từ data thật (không bịa; AI thật thay khi cắm API)
  const sugDigest = pages.filter(p => !learnedIds.has(p.id)).slice(0, 3).map((p, i) => ({
    n: p,
    why: (p as TodayNode & { event_date?: string | null }).event_date
      ? `mốc ngày ${new Date((p as TodayNode & { event_date?: string }).event_date!).toLocaleDateString('vi')} — đan vào dòng đời khi còn nhớ rõ`
      : i === 0 ? 'đứng đầu hàng đợi chưa chuyển hoá' : 'kế tiếp trong hàng đợi',
  }))
  const pct = pages.length ? Math.round((learnedCount / pages.length) * 100) : 0
  const roleName = role?.level === 5 ? '👑 Admin' : role?.can_approve ? '✅ Tổng biên tập' : role?.can_edit ? '✏️ Biên tập viên' : '🌱 Thành viên'
  // ===== KHỐI CẦN LÀM (chỉ những việc THẬT) =====
  const todos: { icon: string; label: string; sub?: string; act: () => void; cta: string }[] = []
  for (const id of dueIds.slice(0, 3)) { const n = pages.find(p2 => p2.id === id) ?? recent.find(p2 => p2.id === id); if (n) todos.push({ icon: '🔁', label: `Ôn lại: ${n.title || 'Trang'}`, sub: 'đến hạn ôn theo lịch nhớ lâu', act: () => onDigest(n), cta: 'Ôn ngay' }) }
  for (const a of myAsg.slice(0, 3)) todos.push({ icon: '📋', label: a.title, sub: a.due ? `việc được giao · hạn ${new Date(a.due).toLocaleDateString('vi')}` : 'việc được giao', act: () => { if (a.node_id) onOpenId(a.node_id) }, cta: 'Mở việc' })
  for (const n of editorial.filter(e => e.status === 'draft').slice(0, 2)) todos.push({ icon: '🔁', label: `Sửa & nộp lại: ${n.title || 'Trang'}`, sub: (n as { note?: string }).note ? `BTV góp ý: ${(n as { note?: string }).note}` : 'bài bị trả lại', act: () => onOpen(n), cta: 'Sửa ngay' })
  if (role?.can_approve && (counts?.pendingAll ?? 0) > 0) todos.push({ icon: '📨', label: `${counts!.pendingAll} bài chờ bạn duyệt`, sub: 'thành viên đang đợi', act: () => onRaw?.(), cta: 'Vào duyệt' })
  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* ===== COMMAND BAR — đầu não Akash (wordmark · status · clock) ===== */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <Wordmark size="lg" dotted />
          <span className="hidden md:block"><StatusLine items={['CORE', 'MEMORY', 'LINK', 'ONLINE', 'ALIVE']} /></span>
        </div>
        <div className="hud-num text-right shrink-0" style={{ fontSize: '1.5rem' }}>
          {now ? now.toLocaleTimeString('vi', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
          <span className="hud-label ml-2" style={{ fontSize: 9 }}>{now ? now.toLocaleDateString('vi', { weekday: 'short', day: '2-digit', month: '2-digit' }) : ''}</span>
        </div>
      </div>
      <hr className="hud-rule mb-5" />
      {/* ===== IDENTITY strip ===== */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-lg ak-grad grid place-items-center text-lg font-mono font-bold text-white shrink-0 ring-1 ring-white/20">{(user.email ?? 'A')[0].toUpperCase()}</div>
        <div className="min-w-0 flex-1">
          <h1 className="ak-display text-2xl font-semibold truncate">{greet}, {user.email?.split('@')[0]} 👋</h1>
          <div className="flex items-center gap-2 text-[11px] flex-wrap mt-0.5">
            <span className="hud-label hud-label-accent">{roleName}</span>
            <span className="text-[var(--hud-dim)]">·</span>
            <span className="font-mono text-amber-400 font-semibold">⚡ {qi} QI</span>
            <span className="text-[var(--hud-dim)]">·</span>
            <span className={`font-mono ${streak > 0 ? 'text-orange-300' : 'text-[var(--hud-dim)]'}`}>🔥 {streak}D STREAK</span>
          </div>
        </div>
      </div>

      {/* ===== GHI NHANH có loại + nguồn (không sơ sài) ===== */}
      <div className="rounded-2xl p-[1.5px] bg-white/15 mb-3 shadow-lg shadow-violet-500/10">
        <div className="rounded-2xl bg-[#0d0d18] px-4 py-3">
          <div className="flex gap-1.5 mb-2">
            {CAP_TYPES.map(([k, l, hint]) => <button key={k} onClick={() => setCapType(k)} title={hint} className={`text-[10px] rounded-lg px-2.5 py-1 border transition ${capType === k ? 'bg-violet-500/25 border-violet-400/50 text-white font-bold' : 'bg-white/5 border-white/10 text-zinc-500'}`}>{l}</button>)}
            <span className="ml-auto text-[10px] text-zinc-600 self-center hidden sm:inline">{CAP_TYPES.find(c => c[0] === capType)?.[2]}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{capType === 'exp' ? '✍️' : capType === 'insight' ? '💎' : '💬'}</span>
            <input value={cap} onChange={e => setCap(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && cap.trim()) { onCapture(cap.trim(), capType, capSrc.trim()); setCap(''); setCapSrc('') } }}
              placeholder={capType === 'exp' ? 'Chuyện gì vừa xảy ra với bạn?…' : capType === 'insight' ? 'Insight vừa loé lên — viết một câu cho rõ…' : 'Dán nguyên văn câu quote đắt…'}
              className="flex-1 bg-transparent outline-none py-1.5 text-sm placeholder:text-zinc-600" />
            <button onClick={() => { if (cap.trim()) { onCapture(cap.trim(), capType, capSrc.trim()); setCap(''); setCapSrc('') } }} disabled={!cap.trim()}
              className="rounded-xl ak-cta px-4 py-2 text-xs font-bold disabled:opacity-40">Nạp vào kho</button>
          </div>
          {capType === 'quote' && <input value={capSrc} onChange={e => setCapSrc(e.target.value)} placeholder="Nguồn: ai nói / sách nào / link…" className="mt-2 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs outline-none focus:border-amber-400/40" />}
        </div>
      </div>
      <p className="text-[10px] text-zinc-600 mb-5 px-1">Mẹo bắt insight: ghi NGAY trong 30 giây khi nó loé — kèm bối cảnh "đang làm gì lúc nghĩ ra" để sau này kể lại được.</p>

      {/* ===== AI HIỂU BẠN — hero to rõ ===== */}
      {(() => {
        const c = counts ?? { values: 0, mantras: 0, people: 0, dated: 0 }
        const parts: [string, number, number, string][] = [
          ['⭐ Giá trị cốt lõi', Math.min(1, c.values / 3) * 20, 20, 'định nghĩa ≥3 giá trị'],
          ['⚓ Kim chỉ nam', Math.min(1, c.mantras / 3) * 15, 15, 'viết châm ngôn khi Chuyển hoá'],
          ['💎 Bài đã chuyển hoá', Math.min(1, learnedIds.size / 10) * 25, 25, 'đều tay mỗi ngày'],
          ['👥 Người thật', Math.min(1, c.people / 5) * 15, 15, 'kể chuyện người thật'],
          ['🔥 Nhịp sống', Math.min(1, streak / 7) * 15, 15, 'mỗi ngày 1 hành động'],
          ['📅 Mốc đời', Math.min(1, c.dated / 5) * 10, 10, 'gắn ngày thật cho trang'],
        ]
        const pctAI = Math.round(parts.reduce((s2, p2) => s2 + p2[1], 0))
        return (
          <Card className="mb-4 !p-6 relative overflow-hidden">
            <Corners />
            <div className="absolute inset-0 opacity-60 pointer-events-none"><Constellation height={300} density={86} accent="var(--hud-accent)" /></div>
            <div className="relative flex items-center gap-6 flex-wrap">
              <div className="relative shrink-0">
                <svg width="132" height="132" viewBox="0 0 132 132" className="-rotate-90">
                  <circle cx="66" cy="66" r="56" fill="none" stroke="rgba(127,127,160,.12)" strokeWidth="11" />
                  <circle cx="66" cy="66" r="56" fill="none" stroke="url(#aig)" strokeWidth="11" strokeLinecap="round" strokeDasharray={`${pctAI * 3.519} 999`} />
                  <defs><linearGradient id="aig"><stop offset="0%" stopColor="#8b5cf6" /><stop offset="50%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#22d3ee" /></linearGradient></defs>
                </svg>
                <div className="absolute inset-0 grid place-items-center -mt-1">
                  <div className="text-center"><div className="text-3xl font-black ak-grad-text">{pctAI}%</div><div className="text-[9px] uppercase tracking-widest text-zinc-500">AI hiểu bạn</div></div>
                </div>
              </div>
              <div className="flex-1 min-w-[230px]">
                <div className="text-sm font-bold mb-0.5">🤖 AI đang hiểu bạn đến đâu?</div>
                <p className="text-[11px] text-zinc-500 mb-3">AI chỉ được viết content bằng giọng bạn từ vùng nó ĐÃ hiểu. Lấp đầy 6 vùng để mở khoá:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-3">
                  {parts.map(([lb, v, max, hint]) => (
                    <div key={lb} title={hint} className="rounded-lg bg-white/[0.04] border border-white/10 px-2 py-1.5">
                      <div className="text-[10px] text-zinc-400 truncate">{lb}</div>
                      <div className="h-1 rounded-full bg-white/10 mt-1 overflow-hidden"><div className={`h-full ${v >= max ? 'bg-emerald-400' : 'ak-grad'}`} style={{ width: `${(v / max) * 100}%` }} /></div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => setQaOpen(true)} className="text-[11px] rounded-lg ak-cta px-3 py-1.5 font-bold">💬 Trả lời 3 câu hôm nay</button>
                  <button disabled title="Kết nối FB/Insta để AI đọc giọng content — khi cắm API" className="text-[11px] rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-zinc-600">🔗 FB/Insta · soon</button>
                </div>
              </div>
            </div>
          </Card>
        )
      })()}

      {/* ===== HÔM NAY BẠN CẦN LÀM — gộp ôn + việc giao + bài trả + duyệt; rỗng thì 1 dòng ===== */}
      {todos.length > 0 ? (
        <Card className="mb-4 border-amber-400/20">
          <Lbl>✅ Hôm nay bạn cần làm ({todos.length})</Lbl>
          <div className="space-y-1.5">
            {todos.map((t, i) => (
              <div key={i} className="flex items-center gap-2.5 rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2 hover:border-amber-400/40 transition">
                <span className="text-lg shrink-0">{t.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate text-zinc-200">{t.label}</div>
                  {t.sub && <div className="text-[10px] text-zinc-500 truncate">{t.sub}</div>}
                </div>
                <button onClick={t.act} className="text-[10px] rounded-lg bg-amber-400 text-black hover:bg-amber-300 px-2.5 py-1 font-bold shrink-0">{t.cta}</button>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <p className="text-xs text-zinc-600 mb-4 px-1">✨ Hôm nay chưa có việc tồn — ghi một trải nghiệm mới hoặc chuyển hoá một bài bên dưới.</p>
      )}

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        {/* CẦN CHUYỂN HOÁ — máy đề xuất 3 bài kèm lý do */}
        <Card>
          <div className="flex items-center justify-between mb-2">
            <Lbl>🔥 Cần chuyển hoá</Lbl>
            <span className="text-[10px] text-zinc-600">{pct}% kho đã chuyển hoá</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 mb-3 overflow-hidden"><div className="h-full bg-amber-400 text-black hover:bg-amber-300 transition-all" style={{ width: `${pct}%` }} /></div>
          <div className="space-y-1.5">
            {sugDigest.map(({ n, why }) => (
              <div key={n.id} className="rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2 hover:border-amber-400/40 transition group">
                <div className="flex items-center gap-2">
                  <span className="text-lg shrink-0">{n.icon || '📄'}</span>
                  <button onClick={() => onOpen(n)} className="flex-1 text-left text-sm truncate text-zinc-300 hover:text-white">{n.title || 'Trang'}</button>
                  <button onClick={() => onDigest(n)} className="text-[10px] rounded-lg bg-amber-400 text-black hover:bg-amber-300 px-2.5 py-1 font-bold shrink-0">Chuyển hoá</button>
                </div>
                <p className="text-[10px] text-zinc-600 pl-7">vì: {why}</p>
              </div>
            ))}
            {sugDigest.length === 0 && <p className="text-xs text-zinc-600 py-3 text-center">🏆 Mọi bài đều đã chuyển hoá. Viết trải nghiệm mới đi!</p>}
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

      {/* ===== WIDGET: quote sống + số thú vị ===== */}
      <div className="grid sm:grid-cols-[1.4fr_1fr] gap-3 mb-4">
        {quote ? (
          <button onClick={() => onOpenId(quote.id)} className="text-left rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-400/20 px-5 py-4 hover:border-amber-400/50 transition">
            <div className="text-[10px] uppercase tracking-widest text-amber-300/70 mb-1">⚓ Hôm nay nhớ lấy câu này</div>
            <p className="text-sm text-amber-100/90 italic leading-relaxed">“{quote.text}”</p>
            <p className="text-[10px] text-zinc-600 mt-1">— {quote.from}</p>
          </button>
        ) : (
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 px-5 py-4"><p className="text-xs text-zinc-600">⚓ Chưa có châm ngôn nào — viết câu đầu tiên khi Chuyển hoá một bài.</p></div>
        )}
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 px-5 py-4 grid grid-cols-3 gap-2 text-center">
          <div><div className="text-xl font-black text-white">{stats.pages}</div><div className="text-[9px] uppercase tracking-wider text-zinc-600">trang</div></div>
          <div><div className="text-xl font-black ak-grad-text">{stats.links}</div><div className="text-[9px] uppercase tracking-wider text-zinc-600">liên kết</div></div>
          <button onClick={onGalaxy} className="rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 grid place-items-center"><span className="text-base">🌌</span><span className="text-[9px] text-zinc-500">Galaxy</span></button>
        </div>
      </div>

      {/* ===== KOL FEED — đọc người khổng lồ, rút insight ===== */}
      {kol.length > 0 && (
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <Lbl>🌟 Người khổng lồ hôm nay</Lbl>
            <button onClick={onKolAll} className="text-[10px] rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-zinc-400 hover:text-white">Xem cả feed →</button>
          </div>
          <div className="grid sm:grid-cols-3 gap-2.5">
            {kol.map(k => {
              const img = k.props?.image_url as string | undefined
              return (
                <button key={k.id} onClick={() => onOpenId(k.id)} className="text-left rounded-xl overflow-hidden bg-white/[0.03] border border-white/10 hover:border-violet-400/50 transition group">
                  {img && <div className="h-24 bg-black/40 overflow-hidden"><img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>}
                  <div className="p-2.5">
                    <div className="text-[11px] font-semibold leading-snug line-clamp-2">{k.title}</div>
                    <div className="text-[9px] text-zinc-600 mt-1">{(k.props?.kol as string) === 'steve-jobs' ? '🍎 Steve Jobs' : '🪟 Bill Gates'} · {k.props?.year as string}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </Card>
      )}

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
              }} className="w-full rounded-xl ak-cta py-2.5 text-sm font-bold">✓ Lưu vào "Tôi là ai"</button>
            </div>
          </div>
        )
      })()}
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
      .not('props->>board', 'is', null)
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
      .not('props->>board', 'is', null)
      .order('position', { nullsFirst: true }).then(({ data }) => setCards((data as BCard[]) ?? []))
  }
  // thẻ mới: tự sống trong folder "🎬 Xưởng content" của kho cá nhân (tự tạo nếu chưa có)
  async function newCard(col: string) {
    if (!orgId) return
    let { data: studio } = await supabase.from('nodes').select('id').eq('org_id', orgId).eq('owner_id', userId).filter('props->>hub', 'eq', 'studio').limit(1).maybeSingle() // theo props.hub — khớp ensureHub, hết trang Xưởng trùng
    if (!studio) {
      const { data: kho } = await supabase.from('nodes').select('id').eq('org_id', orgId).eq('owner_id', userId).eq('kind', 'kho').limit(1).maybeSingle()
      const sid = crypto.randomUUID()
      await supabase.from('nodes').insert({ id: sid, org_id: orgId, owner_id: userId, layer: 'personal', kind: 'page', parent_id: kho?.id ?? null, title: 'Xưởng content', icon: '🎬', subtype: 'hub', status: 'published', min_level: 1, props: { hub: 'studio' } })
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
          <button onClick={() => setBview('kanban')} className={`px-3 py-1.5 rounded-lg ${bview === 'kanban' ? 'ak-cta text-white' : 'text-zinc-400'}`}>▦ Kanban</button>
          <button onClick={() => setBview('time')} className={`px-3 py-1.5 rounded-lg ${bview === 'time' ? 'ak-cta text-white' : 'text-zinc-400'}`}>📅 Campaign timeline</button>
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
                await supabase.from('content_results').insert({ org_id: orgId, user_id: userId, card_node_id: resultFor.id, source_node_id: (resultFor.props?.source_node_id as string) ?? resultFor.id, channel: res.channel, reach: +res.reach || 0, leads: +res.leads || 0, note: res.note || null })
                await supabase.from('events').insert({ user_id: userId, type: 'content_result', node_id: resultFor.id })
                setResultFor(null)
              }} className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-xs font-bold">✓ Lưu kết quả</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- ✨ MỤC LỤC ĐỜI (Phase 1 — Life Story Interview, KHO-CHUAN §2bis) ----------
   Một màn duy nhất: đời bạn là cuốn sách, viết mục lục 2-7 chương → mỗi chương thành
   một trang gốc trong 📓 Hành trình, kèm câu hỏi 8 cảnh then chốt gợi sẵn trong thân bài. */
export function LifeChaptersWizard({ onCreate, onClose }: {
  onCreate: (chapters: { title: string; year: string; summary: string }[]) => Promise<void>
  onClose: () => void
}) {
  const [rows, setRows] = useState([{ title: '', year: '', summary: '' }, { title: '', year: '', summary: '' }, { title: '', year: '', summary: '' }])
  const [busy, setBusy] = useState(false)
  const filled = rows.filter(r => r.title.trim())
  const set = (i: number, k: 'title' | 'year' | 'summary', v: string) => setRows(rs => rs.map((r, j) => j === i ? { ...r, [k]: v } : r))
  return (
    <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-md grid place-items-center p-6" onClick={onClose}>
      <div className="w-[640px] max-w-[94vw] max-h-[88vh] overflow-auto rounded-3xl bg-[#10121d] border border-white/10 shadow-2xl p-7" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-extrabold mb-1">✨ Nếu đời bạn là một cuốn sách…</h2>
        <p className="text-sm text-zinc-500 mb-5">…mục lục sẽ có những chương nào? Viết 2–7 chương — mỗi chương một cái tên, năm bắt đầu, một câu tóm tắt. Đây là nền móng để AI hiểu bạn (khung Life Story Interview — 30 năm nghiên cứu tâm lý học).</p>
        <div className="space-y-2.5 mb-4">
          {rows.map((r, i) => (
            <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/10 p-3">
              <div className="flex gap-2 mb-1.5">
                <span className="shrink-0 w-7 h-7 rounded-lg bg-white/5 border border-white/10 grid place-items-center text-[11px] text-zinc-500 font-mono">{i + 1}</span>
                <input value={r.title} onChange={e => set(i, 'title', e.target.value)} placeholder={['Tuổi thơ bên…', 'Những năm vấp ngã…', 'Làm lại từ…'][i] ?? 'Tên chương…'} className="flex-1 bg-transparent outline-none text-sm font-semibold placeholder:text-zinc-700" />
                <input value={r.year} onChange={e => set(i, 'year', e.target.value)} placeholder="năm" className="w-16 rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-xs outline-none text-center tabular-nums" />
                {rows.length > 2 && <button onClick={() => setRows(rs => rs.filter((_, j) => j !== i))} className="text-zinc-700 hover:text-red-300 px-1">✕</button>}
              </div>
              <input value={r.summary} onChange={e => set(i, 'summary', e.target.value)} placeholder="Một câu tóm tắt chương này…" className="w-full bg-transparent outline-none text-xs text-zinc-400 placeholder:text-zinc-700 pl-9" />
            </div>
          ))}
        </div>
        {rows.length < 7 && <button onClick={() => setRows(rs => [...rs, { title: '', year: '', summary: '' }])} className="text-xs rounded-lg border border-white/10 px-3 py-1.5 text-zinc-400 hover:text-white mb-4">＋ thêm chương</button>}
        <div className="flex items-center justify-between">
          <button onClick={onClose} className="text-xs text-zinc-600 hover:text-zinc-300">Để sau</button>
          <button disabled={filled.length < 2 || busy} onClick={async () => { setBusy(true); await onCreate(filled); setBusy(false) }}
            className="rounded-xl ak-cta px-7 py-2.5 text-sm font-bold disabled:opacity-30">{busy ? 'Đang viết mục lục…' : `📖 Tạo ${filled.length} chương đời`}</button>
        </div>
      </div>
    </div>
  )
}
