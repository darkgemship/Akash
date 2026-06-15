'use client'
/* =====================================================================
   HUBS — 4 khu chức năng lớn (đêm build 2026-06-12, docs/KHO-CHUAN.md + FLOWS.md)
   🌟 KolFeed       — dòng tin người khổng lồ kiểu Instagram → rút insight về kho
   🎛️ ContentEngine — ma trận content + 21 câu hỏi + thư viện viral + prompt/chiến lược
   ✅ ReviewHub     — trung tâm biên tập: thấy kho/trang/comment, xem-sửa-rồi-duyệt
   👥 MembersHub    — nhân sự: profile + role + việc được giao + trang đang build
===================================================================== */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

type AnyNode = { id: string; title: string | null; layer?: string; parent_id?: string | null; icon?: string | null; status?: string; subtype?: string | null; owner_id?: string | null; md?: string | null; created_at?: string; props?: Record<string, unknown> | null }

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => <div className={`hud-panel p-5 ${className}`}>{children}</div>
const Lbl = ({ children }: { children: React.ReactNode }) => <div className="hud-label mb-2">{children}</div>

/* render md đơn giản (đồng bộ kiểu với Studio pretty view) */
function MiniMd({ md }: { md: string }) {
  return (
    <div className="space-y-1.5">
      {md.split('\n').map((ln, i) => {
        const t = ln.trim()
        if (t.startsWith('## ')) return <h2 key={i} className="text-sm font-bold mt-3 text-violet-200">{t.slice(3)}</h2>
        if (t.startsWith('# ')) return <h2 key={i} className="text-base font-bold mt-3 text-white">{t.slice(2)}</h2>
        if (t.startsWith('> ')) return <blockquote key={i} className="border-l-2 border-amber-400/60 pl-3 text-sm text-amber-100/85 italic">{t.slice(2)}</blockquote>
        if (t.startsWith('- ')) return <li key={i} className="text-[13px] text-zinc-300 ml-4">{t.slice(2)}</li>
        if (!t) return <div key={i} className="h-1" />
        return <p key={i} className="text-[13px] text-zinc-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: t.replace(/\*\*(.+?)\*\*/g, '<b class="text-white">$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>') }} />
      })}
    </div>
  )
}

/* ========================== 🌟 KOL FEED ========================== */
export function KolFeed({ canEdit, onOpenPage, onInsight }: {
  canEdit: boolean
  onOpenPage: (id: string) => void
  onInsight: (text: string, sourceTitle: string, sourceId: string) => void
}) {
  const [posts, setPosts] = useState<AnyNode[]>([])
  const [profiles, setProfiles] = useState<AnyNode[]>([])
  const [who, setWho] = useState<string>('all')
  const [open, setOpen] = useState<AnyNode | null>(null)
  const [insightDraft, setInsightDraft] = useState('')
  useEffect(() => {
    supabase.from('nodes').select('id,title,md,props,subtype,created_at').in('subtype', ['kol_post', 'kol_profile']).order('position').then(({ data }) => {
      const all = (data as AnyNode[]) ?? []
      setPosts(all.filter(n => n.subtype === 'kol_post'))
      setProfiles(all.filter(n => n.subtype === 'kol_profile'))
    })
  }, [])
  const kols = useMemo(() => Array.from(new Set(posts.map(p => p.props?.kol as string).filter(Boolean))), [posts])
  const shown = posts.filter(p => who === 'all' || (p.props?.kol as string) === who)
  const kolName = (k: string) => k === 'steve-jobs' ? '🍎 Steve Jobs' : k === 'bill-gates' ? '🪟 Bill Gates' : k
  return (
    <div className="px-8 py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
        <h2 className="text-xl font-extrabold">🌟 Người khổng lồ</h2>
        {canEdit && <span className="text-[10px] text-zinc-600">Editor: thêm bài = tạo trang con trong 🌟 KOL Feed (kho tập đoàn)</span>}
      </div>
      <p className="text-zinc-500 text-sm mb-4">Đọc một lát cắt đời người lớn → rút <b className="text-amber-300">insight của bạn</b> → nạp vào kho → thành content.</p>
      {/* stories row — hồ sơ KOL */}
      <div className="flex gap-3 mb-4 overflow-x-auto pb-1">
        <button onClick={() => setWho('all')} className={`shrink-0 flex flex-col items-center gap-1 ${who === 'all' ? '' : 'opacity-60'}`}>
          <div className={`w-14 h-14 rounded-full p-[2px] ${who === 'all' ? 'ak-grad' : 'bg-white/10'}`}><div className="w-full h-full rounded-full bg-[#0d0d18] grid place-items-center text-xl">✦</div></div>
          <span className="text-[10px] text-zinc-400">Tất cả</span>
        </button>
        {kols.map(k => (
          <button key={k} onClick={() => setWho(k)} className={`shrink-0 flex flex-col items-center gap-1 ${who === k ? '' : 'opacity-60 hover:opacity-100'}`}>
            <div className={`w-14 h-14 rounded-full p-[2px] ${who === k ? 'ak-grad' : 'bg-white/10'}`}><div className="w-full h-full rounded-full bg-[#0d0d18] grid place-items-center text-2xl">{k === 'steve-jobs' ? '🍎' : '🪟'}</div></div>
            <span className="text-[10px] text-zinc-400">{kolName(k).split(' ').slice(1).join(' ')}</span>
          </button>
        ))}
        {profiles.filter(p => who === 'all' || (p.props?.kol as string) === who).map(p => (
          <button key={p.id} onClick={() => onOpenPage(p.id)} title="Mở hồ sơ đầy đủ" className="shrink-0 self-center ml-2 text-[10px] rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-zinc-400 hover:text-white">📜 Hồ sơ {kolName((p.props?.kol as string) ?? '')}</button>
        ))}
      </div>
      {/* lưới bài kiểu instagram */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {shown.map(p => {
          const img = p.props?.image_url as string | undefined
          return (
            <button key={p.id} onClick={() => { setOpen(p); setInsightDraft('') }} className="text-left rounded-2xl overflow-hidden bg-white/[0.04] border border-white/10 hover:border-violet-400/50 transition group">
              <div className="h-40 bg-black/50 overflow-hidden relative">
                {img ? <img src={img} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full grid place-items-center text-4xl">{(p.props?.kol as string) === 'steve-jobs' ? '🍎' : '🪟'}</div>}
                <span className="absolute top-2 left-2 text-[9px] rounded-md bg-black/60 backdrop-blur px-1.5 py-0.5 text-zinc-200">{kolName((p.props?.kol as string) ?? '')} · {p.props?.year as string}</span>
              </div>
              <div className="p-3">
                <div className="text-sm font-bold leading-snug line-clamp-2 mb-1">{p.title}</div>
                <p className="text-[11px] text-zinc-500 line-clamp-2">💎 {p.props?.insight as string}</p>
              </div>
            </button>
          )
        })}
        {shown.length === 0 && <p className="text-sm text-zinc-600 col-span-3 py-10 text-center">Chưa có bài — editor tạo trang con trong 🌟 KOL Feed.</p>}
      </div>
      {/* viewer */}
      {open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] grid place-items-center p-6" onClick={() => setOpen(null)}>
          <div className="w-[640px] max-w-[94vw] max-h-[88vh] overflow-auto rounded-2xl bg-[#10121d] border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
            {(open.props?.image_url as string) && <img src={open.props!.image_url as string} alt="" className="w-full max-h-60 object-cover" />}
            <div className="p-5">
              <div className="text-[10px] text-zinc-500 mb-1">{kolName((open.props?.kol as string) ?? '')} · {open.props?.year as string} · ảnh: {open.props?.image_credit as string}</div>
              <h3 className="text-lg font-extrabold mb-3">{open.title}</h3>
              <MiniMd md={(open.md ?? '').split('## 💎 Insight')[0].split('\n').slice(6).join('\n')} />
              <div className="mt-4 rounded-xl bg-amber-500/10 border border-amber-400/25 px-4 py-3">
                <div className="text-[10px] uppercase tracking-wider text-amber-300/80 mb-1">💎 Insight gợi ý</div>
                <p className="text-sm text-amber-100/90">{open.props?.insight as string}</p>
                {(open.props?.quote as string) && <p className="text-xs text-zinc-400 italic mt-2">“{open.props?.quote as string}”</p>}
              </div>
              {/* RÚT INSIGHT CỦA RIÊNG BẠN — vòng lặp đọc → kho → content */}
              <div className="mt-3">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">✍️ Insight CỦA BẠN từ bài này (1 câu) — sẽ thành trang trong 💎 Kim cương bài học, tự nối nguồn</div>
                <div className="flex gap-2">
                  <input value={insightDraft} onChange={e => setInsightDraft(e.target.value)} placeholder="vd: Mình cũng đang có một 'lớp thư pháp' chưa biết dùng vào đâu — cứ học đã…" className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs outline-none focus:border-amber-400/50" />
                  <button onClick={() => { if (insightDraft.trim()) { onInsight(insightDraft.trim(), open.title ?? '', open.id); setOpen(null) } }} disabled={!insightDraft.trim()} className="rounded-xl bg-amber-400 text-black hover:bg-amber-300 px-4 py-2 text-xs font-bold disabled:opacity-40 shrink-0">💎 Nạp vào kho</button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-[10px] text-zinc-600 truncate">Nguồn: {((open.props?.sources as string[]) ?? []).slice(0, 2).join(' · ')}</span>
                <button onClick={() => { onOpenPage(open.id); setOpen(null) }} className="text-[11px] rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-zinc-300 hover:text-white shrink-0">📄 Mở trang gốc</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ========================== 🎛️ CONTENT ENGINE v2 ==========================
   Research mũi 4 (Typeform/GOV.UK/Jasper/HeyGen): tách quyết định MỘT LẦN khỏi quyết định MỖI LẦN.
   - Chưa có Hồ sơ Hồn → wizard 5 màn, mỗi màn ≤2 quyết định, lưu ngay từng bước.
   - Đã có → MỘT màn "Hôm nay tạo gì?": preset → chủ đề → copy prompt. Hết rừng chip. */
type Matrix = { role?: string; audience?: string; strengths: string[]; exploit: string[]; avoid: string[]; freq: string; formats: string[]; channels: string[]; answers?: Record<string, string> }
const EMPTY_MATRIX: Matrix = { strengths: [], exploit: [], avoid: [], freq: '3/tuần', formats: [], channels: [] }
const FORMATS = ['📰 Bài viết dài', '🎞️ Reel/Short', '🎬 Video dài', '💬 Caption + ảnh', '📧 Email/tin nhắn', '🎤 Bài chia sẻ']
const FREQS = ['1/tuần', '3/tuần', '5/tuần', 'mỗi ngày']
const ROLES: [string, string, string][] = [
  ['kol', '🌟 Người truyền cảm hứng', 'kể chuyện đời mình để dẫn dắt cộng đồng'],
  ['builder', '🏗️ Người xây đội nhóm', 'content nuôi và tuyển những người đồng hành'],
  ['educator', '🎓 Người dạy', 'biến kiến thức thành bài học dễ hiểu'],
  ['seller', '🤝 Người bán tử tế', 'content tạo niềm tin trước khi bán'],
]
const PRESETS: { key: string; icon: string; name: string; desc: string; angle: string }[] = [
  { key: 'story', icon: '🌱', name: 'Kể một chuyện thật', desc: 'một cảnh đời của bạn → bài học', angle: 'Kể lại MỘT cảnh thật trong đời tôi (đính kèm), theo 3 hồi: bối cảnh ngắn → khoảnh khắc bước ngoặt → bài học một câu. Không tô hồng.' },
  { key: 'lesson', icon: '💎', name: 'Bài học từ sách/người thầy', desc: 'tri thức + góc nhìn riêng của bạn', angle: 'Lấy MỘT ý từ nguồn (đính kèm) + đối chiếu với trải nghiệm thật của tôi. Kết bằng câu hỏi mở cho người đọc.' },
  { key: 'behind', icon: '🎬', name: 'Hậu trường nghề', desc: 'một ngày làm việc thật, không màu mè', angle: 'Tả MỘT khoảnh khắc hậu trường hôm nay (từ chối, cuộc gặp, thói quen sáng). Chân thật, có chi tiết cụ thể, không dạy đời.' },
  { key: 'transform', icon: '🔥', name: 'Trước — Sau', desc: 'hành trình chuyển hoá của bạn', angle: 'So sánh TÔI CŨ và TÔI NAY quanh một chủ đề (đính kèm cảnh đời cũ). Trung thực về cái giá phải trả. Không hứa hẹn kết quả cho ai.' },
]

export function ContentEngine({ user, orgId, pages, onOpenPage, onCreatePlan }: {
  user: User
  orgId?: string | null
  pages: AnyNode[]
  onOpenPage: (id: string) => void
  onCreatePlan: (title: string, md: string) => void
}) {
  const [mx, setMx] = useState<Matrix>(EMPTY_MATRIX)
  const [mxId, setMxId] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [wizard, setWizard] = useState(false)        // mở wizard (lần đầu tự bật; sau bấm "chỉnh Hồ sơ Hồn")
  const [wStep, setWStep] = useState(0)
  const [preset, setPreset] = useState<string | null>(null)
  const [topic, setTopic] = useState('')
  const [srcPage, setSrcPage] = useState<AnyNode | null>(null)
  const [lib, setLib] = useState<AnyNode[]>([])
  const [hooks, setHooks] = useState<{ text_vi: string; category: string }[]>([])
  const [panel, setPanel] = useState<'none' | 'lib' | 'voice'>('none')
  const [qs, setQs] = useState<{ q_vi: string; why_vi: string; maps_to: string }[]>([])
  const [qIdx, setQIdx] = useState(0)
  const [qAns, setQAns] = useState('')
  const [copied, setCopied] = useState('')
  const [planDays, setPlanDays] = useState<30 | 60 | 180>(30)
  useEffect(() => {
    supabase.from('nodes').select('id,props').eq('owner_id', user.id).eq('subtype', 'content_matrix').limit(1).maybeSingle().then(({ data }) => {
      const m = { ...EMPTY_MATRIX, ...((data?.props as { matrix?: Matrix })?.matrix ?? {}) }
      if (data) setMxId(data.id)
      setMx(m); setLoaded(true)
      if (!(m.role && m.strengths.length && m.exploit.length && m.formats.length)) setWizard(true) // hồ sơ chưa đủ → dẫn từng bước
    })
    supabase.from('nodes').select('id,title,md,props,subtype').in('subtype', ['brand_questions', 'viral_hooks', 'viral_script', 'viral_titles']).then(({ data }) => {
      const all = (data as AnyNode[]) ?? []
      setQs(((all.find(n => n.subtype === 'brand_questions')?.props?.questions) as { q_vi: string; why_vi: string; maps_to: string }[]) ?? [])
      setHooks(((all.find(n => n.subtype === 'viral_hooks')?.props?.hooks) as { text_vi: string; category: string }[]) ?? [])
      setLib(all.filter(n => n.subtype !== 'brand_questions'))
    })
  }, [user.id])
  const myValues = pages.filter(n => (n.props?.role as string) === 'value' || n.subtype === 'core_value')
  const myStories = pages.filter(n => (n.props?.page_type as string) === 'trai-nghiem' && n.owner_id === user.id).slice(0, 8)
  const creatingRef = useRef<Promise<string> | null>(null)
  async function ensureMatrixId(first: Matrix): Promise<string> {
    if (mxId) return mxId
    if (!creatingRef.current) creatingRef.current = (async () => {
      const { data: ex } = await supabase.from('nodes').select('id').eq('owner_id', user.id).eq('subtype', 'content_matrix').limit(1).maybeSingle()
      if (ex) { setMxId(ex.id); return ex.id as string }
      const kho = pages.find(n => n.owner_id === user.id && n.layer === 'personal' && !n.parent_id)
      const id = crypto.randomUUID()
      await supabase.from('nodes').insert({ id, org_id: orgId, owner_id: user.id, layer: 'personal', kind: 'page', parent_id: kho?.id ?? null, title: 'Hồ sơ Hồn', icon: '🎛️', subtype: 'content_matrix', status: 'published', min_level: 1, props: { matrix: first } })
      setMxId(id); return id
    })()
    return creatingRef.current
  }
  async function saveMatrix(next: Matrix) {
    setMx(next)
    const id = await ensureMatrixId(next)
    await supabase.from('nodes').update({ props: { matrix: next } }).eq('id', id)
  }
  function copy(t: string, key: string) { navigator.clipboard?.writeText(t); setCopied(key); setTimeout(() => setCopied(''), 1500) }
  const toggle = (arr: string[], v: string) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]
  const chip = (on: boolean) => `px-3 py-1.5 rounded-lg text-xs border transition ${on ? 'bg-violet-500/25 border-violet-400/50 text-white' : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/30'}`

  // ===== prompt hoàn chỉnh = Hồ sơ Hồn + preset + chủ đề + trang nguồn =====
  const pst = PRESETS.find(x => x.key === preset)
  const finalPrompt = `Bạn viết content thay tôi — đúng GIỌNG TÔI, không phải giọng AI.

HỒ SƠ HỒN CỦA TÔI:
- Vai: ${ROLES.find(r => r[0] === mx.role)?.[1] ?? '—'}
- Viết cho: ${mx.audience || '—'}
- Giá trị cốt lõi: ${myValues.map(v => v.title).join(', ') || '—'}
- Điểm mạnh: ${mx.strengths.join(', ')}
- TUYỆT ĐỐI KHÔNG nhắc: ${mx.avoid.join(', ') || 'không có'} · không hứa hẹn thu nhập · không thổi phồng

BÀI HÔM NAY:
- Góc kể: ${pst?.angle ?? '(chọn preset)'}
- Chủ đề/từ khoá: ${topic || '(bạn điền)'}
- Định dạng: ${mx.formats[0] ?? 'bài viết'} · mở đầu bằng 1 hook giữ chân · kết bằng câu hỏi mở
${srcPage ? `\nCHUYỆN THẬT ĐÍNH KÈM (nguồn sự thật — không bịa thêm chi tiết):\n${(srcPage.md ?? '').slice(0, 1500)}` : '\n[ĐÍNH KÈM 1 CHUYỆN THẬT: chọn ở mục "chất liệu" bên dưới]'}`

  function genPlan() {
    const perWeek = mx.freq === 'mỗi ngày' ? 7 : parseInt(mx.freq) || 3
    const weeks = Math.round(planDays / 7)
    const pillars = [...mx.exploit].slice(0, 4); if (!pillars.length) pillars.push('Câu chuyện chuyển hoá của tôi')
    const fmts = mx.formats.length ? mx.formats : ['💬 Caption + ảnh']
    let md = `**Loại:** 📋 Quy trình · **Campaign:** Chiến lược ${planDays} ngày\n\n**Tóm tắt 1 câu:** Lịch ${planDays} ngày — ${perWeek} bài/tuần xoay ${pillars.length} trụ: ${pillars.join(' · ')}.\n\n**Nguồn:** Hồ sơ Hồn + kho chuyện thật\n\n## Nguyên tắc\n- Mỗi bài neo về 1 chuyện thật/giá trị (link 8 chiều)\n- Tỉ lệ 4-1-1: 4 trao giá trị · 1 chuyện đời · 1 mời gọi nhẹ\n- Cuối tuần ghi kết quả vào Board → tinh chỉnh tuần sau\n`
    for (let w = 1; w <= weeks; w++) {
      md += `\n## Tuần ${w} — trụ: ${pillars[(w - 1) % pillars.length]}\n`
      for (let d2 = 0; d2 < perWeek; d2++) md += `- [ ] ${fmts[d2 % fmts.length]} · góc: ${['chuyện thật', 'bài học rút ra', 'sai lầm thường gặp', 'hỏi đáp', 'trích nguồn + cảm nhận', 'hậu trường', 'kết quả thật'][d2 % 7]}\n`
    }
    md += `\n## Đo & tinh chỉnh\n- [ ] Tuần: cập nhật reach/lead vào Board\n- [ ] Tháng: bài tốt nhất → nhân bản định dạng khác`
    onCreatePlan(`Chiến lược content ${planDays} ngày (${new Date().toLocaleDateString('vi')})`, md)
  }

  if (!loaded) return <div className="px-8 py-10 text-sm text-zinc-600">Đang mở Engine…</div>

  /* ════════ WIZARD HỒ SƠ HỒN — 5 màn, mỗi màn ≤2 quyết định, lưu từng bước ════════ */
  if (wizard) {
    const steps = 5
    const Next = ({ ok, label = 'Tiếp tục →' }: { ok: boolean; label?: string }) => (
      <div className="flex items-center justify-between mt-8">
        <button onClick={() => wStep > 0 ? setWStep(s => s - 1) : setWizard(false)} className="text-xs text-zinc-600 hover:text-zinc-300">← {wStep > 0 ? 'Quay lại' : 'Để sau'}</button>
        <button onClick={() => wStep < steps - 1 ? setWStep(s => s + 1) : setWizard(false)} disabled={!ok}
          className="rounded-xl ak-cta px-8 py-2.5 text-sm font-bold disabled:opacity-30">{wStep === steps - 1 ? '✓ Hoàn tất Hồ sơ Hồn' : label}</button>
      </div>
    )
    return (
      <div className="min-h-full grid place-items-center px-8 py-10">
        <div className="w-full max-w-xl">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-1 flex-1 rounded-full bg-white/5 overflow-hidden"><div className="h-full ak-grad transition-all duration-500" style={{ width: `${((wStep + 1) / steps) * 100}%` }} /></div>
            <span className="font-mono text-[10px] text-zinc-600 tabular-nums">bước {wStep + 1}/{steps}</span>
          </div>
          {wStep === 0 && (<div className="dq-step-in">
            <h2 className="text-2xl font-extrabold mb-1.5">Bạn viết với tư cách gì?</h2>
            <p className="text-sm text-zinc-500 mb-6">Akash đọc kho của bạn để viết đúng hồn — bắt đầu từ chiếc mũ bạn đội.</p>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {ROLES.map(([k, name, desc]) => (
                <button key={k} onClick={() => saveMatrix({ ...mx, role: k })} className={`text-left rounded-2xl border p-4 transition ${mx.role === k ? 'bg-violet-500/15 border-violet-400/50' : 'bg-white/[0.03] border-white/10 hover:border-white/25'}`}>
                  <div className="text-sm font-bold mb-0.5">{name}</div>
                  <div className="text-[11px] text-zinc-500">{desc}</div>
                </button>
              ))}
            </div>
            <Next ok={!!mx.role} />
          </div>)}
          {wStep === 1 && (<div className="dq-step-in">
            <h2 className="text-2xl font-extrabold mb-1.5">Bạn viết cho ai?</h2>
            <p className="text-sm text-zinc-500 mb-6">Một câu mô tả người sẽ đọc — càng cụ thể content càng trúng.</p>
            <textarea value={mx.audience ?? ''} onChange={e => setMx({ ...mx, audience: e.target.value })} onBlur={() => saveMatrix(mx)}
              placeholder="vd: người 28–35 đi làm văn phòng, muốn thêm thu nhập nhưng sợ bị lừa…" className="w-full h-28 rounded-2xl bg-white/[0.04] border border-white/10 p-4 text-sm outline-none focus:border-violet-400/40" />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {['người trẻ đang mất phương hướng sự nghiệp', 'bố mẹ bỉm sữa muốn thêm thu nhập tại nhà', 'người từng thất bại kinh doanh đang làm lại'].map(s => (
                <button key={s} onClick={() => saveMatrix({ ...mx, audience: s })} className="text-[11px] rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-zinc-400 hover:text-white">{s}</button>
              ))}
            </div>
            <Next ok={!!mx.audience?.trim()} />
          </div>)}
          {wStep === 2 && (<div className="dq-step-in">
            <h2 className="text-2xl font-extrabold mb-1.5">Điểm mạnh & vùng cấm</h2>
            <p className="text-sm text-zinc-500 mb-5">Chọn ≤5 điểm mạnh để khai thác — và những điều AI không bao giờ được nhắc.</p>
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-violet-300/80 mb-2">Điểm mạnh</div>
            <div className="flex flex-wrap gap-1.5 mb-5">
              {['Kể chuyện thật', 'Kiên trì sau thất bại', 'Phân tích số liệu', 'Lắng nghe sâu', 'Hài hước tự trào', 'Kỷ luật buổi sáng', 'Kiến thức đầu tư', 'Trải nghiệm du học', 'Làm cha mẹ', 'Networking tử tế', 'Đọc sách & đúc rút', 'Thiền & tĩnh tâm'].map(s => (
                <button key={s} onClick={() => saveMatrix({ ...mx, strengths: toggle(mx.strengths, s).slice(0, 5) })} className={chip(mx.strengths.includes(s))}>{s}</button>
              ))}
            </div>
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-red-300/70 mb-2">Không nhắc tới</div>
            <div className="flex flex-wrap gap-1.5">
              {['Số thu nhập cụ thể', 'So sánh công ty khác', 'Chính trị/tôn giáo', 'Chuyện riêng gia đình lớn', 'Khoe của', 'Hứa hẹn kết quả', 'Drama cá nhân'].map(s => (
                <button key={s} onClick={() => saveMatrix({ ...mx, avoid: toggle(mx.avoid, s) })} className={`px-3 py-1.5 rounded-lg text-xs border transition ${mx.avoid.includes(s) ? 'bg-red-500/20 border-red-400/50 text-red-200' : 'bg-white/5 border-white/10 text-zinc-400'}`}>{s}</button>
              ))}
            </div>
            <Next ok={mx.strengths.length > 0} />
          </div>)}
          {wStep === 3 && (<div className="dq-step-in">
            <h2 className="text-2xl font-extrabold mb-1.5">Chọn tối đa 3 trụ nội dung</h2>
            <p className="text-sm text-zinc-500 mb-6">Trụ = chủ đề bạn sẽ xoay vòng. Ít trụ, sâu — hơn nhiều trụ, loãng.</p>
            <div className="flex flex-wrap gap-1.5">
              {['Hành trình vấp ngã → đứng dậy', 'Tài chính cá nhân tử tế', 'Thói quen & kỷ luật', 'Chuyện gia đình & làm cha', 'Bài học kinh doanh', 'Sách & người thầy', 'Hậu trường nghề', 'Phát triển đội nhóm'].map(s => (
                <button key={s} onClick={() => saveMatrix({ ...mx, exploit: toggle(mx.exploit, s).slice(0, 3) })} className={chip(mx.exploit.includes(s))}>{s}</button>
              ))}
            </div>
            <Next ok={mx.exploit.length > 0} />
          </div>)}
          {wStep === 4 && (<div className="dq-step-in">
            <h2 className="text-2xl font-extrabold mb-1.5">Nhịp & định dạng</h2>
            <p className="text-sm text-zinc-500 mb-6">Cam kết được bao nhiêu, đặt bấy nhiêu — nhất quán thắng động lực.</p>
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500 mb-2">Nhịp ra bài</div>
            <div className="flex gap-1.5 mb-5">{FREQS.map(f => <button key={f} onClick={() => saveMatrix({ ...mx, freq: f })} className={chip(mx.freq === f)}>{f}</button>)}</div>
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500 mb-2">Định dạng mạnh (chọn ≤3)</div>
            <div className="flex flex-wrap gap-1.5">{FORMATS.map(f => <button key={f} onClick={() => saveMatrix({ ...mx, formats: toggle(mx.formats, f).slice(0, 3) })} className={chip(mx.formats.includes(f))}>{f}</button>)}</div>
            <Next ok={mx.formats.length > 0} />
          </div>)}
        </div>
      </div>
    )
  }

  /* ════════ MÀN CHÍNH "HÔM NAY TẠO GÌ?" — 1 luồng: preset → chủ đề → copy ════════ */
  return (
    <div className="px-8 py-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-extrabold">Hôm nay tạo gì?</h2>
        <div className="flex items-center gap-1.5 text-[11px]">
          <button onClick={() => setPanel(panel === 'lib' ? 'none' : 'lib')} className={`rounded-lg border px-2.5 py-1 ${panel === 'lib' ? 'bg-white/10 border-white/20 text-white' : 'border-white/10 text-zinc-500 hover:text-white'}`}>Thư viện viral</button>
          <button onClick={() => { const next = panel === 'voice' ? 'none' : 'voice'; setPanel(next as 'none' | 'voice'); if (next === 'voice') setQAns(mx.answers?.[qs[qIdx]?.q_vi] ?? '') }} className={`rounded-lg border px-2.5 py-1 ${panel === 'voice' ? 'bg-white/10 border-white/20 text-white' : 'border-white/10 text-zinc-500 hover:text-white'}`}>21 câu hỏi giọng</button>
          <button onClick={() => { setWizard(true); setWStep(0) }} className="rounded-lg border border-white/10 px-2.5 py-1 text-zinc-500 hover:text-white" title="Sửa vai, khán giả, điểm mạnh, trụ, nhịp">⚙ Hồ sơ Hồn</button>
        </div>
      </div>
      <p className="text-sm text-zinc-500 mb-5">{ROLES.find(r => r[0] === mx.role)?.[1]} · viết cho <span className="text-zinc-300">{(mx.audience ?? '').slice(0, 48)}…</span> · {mx.freq}</p>

      {panel === 'lib' && (
        <Card className="mb-4">
          <div className="grid md:grid-cols-2 gap-2 mb-3">
            {lib.filter(n => n.subtype !== 'viral_hooks').map(n => (
              <button key={n.id} onClick={() => onOpenPage(n.id)} className="text-left rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2 hover:border-violet-400/40 text-xs">{n.subtype === 'viral_titles' ? '✨' : '🎬'} {n.title}</button>
            ))}
          </div>
          <div className="max-h-48 overflow-auto space-y-2 pr-1">
            {Object.entries(hooks.reduce<Record<string, string[]>>((a, h) => { (a[h.category] ??= []).push(h.text_vi); return a }, {})).map(([cat, hs]) => (
              <div key={cat}>
                <div className="text-[10px] font-mono uppercase tracking-wider text-amber-300/60 mb-1">{cat}</div>
                <div className="flex flex-wrap gap-1">{hs.slice(0, 8).map((h, i) => <button key={i} onClick={() => copy(h, cat + i)} className={`text-left text-[11px] rounded-md border px-2 py-0.5 ${copied === cat + i ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200' : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:border-amber-400/30'}`}>{copied === cat + i ? '✓' : h}</button>)}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
      {panel === 'voice' && (
        <Card className="mb-4">
          {qs.length === 0 ? <p className="text-xs text-zinc-600">Chưa nạp bộ câu hỏi.</p> : (
            <>
              <div className="flex items-center justify-between mb-2"><Lbl>Câu {qIdx + 1}/{qs.length}</Lbl><span className="text-[10px] text-zinc-600">đã trả lời {Object.values(mx.answers ?? {}).filter(Boolean).length}</span></div>
              <h3 className="text-base font-bold mb-1">{qs[qIdx].q_vi}</h3>
              <p className="text-[10px] text-zinc-600 mb-2">{qs[qIdx].why_vi}</p>
              <textarea value={qAns} onChange={e => setQAns(e.target.value)} className="w-full h-24 rounded-xl bg-white/5 border border-white/10 p-3 text-sm outline-none focus:border-violet-400/40 mb-2" />
              <div className="flex gap-2">
                {qIdx > 0 && <button onClick={() => { setQIdx(i => i - 1); setQAns(mx.answers?.[qs[qIdx - 1].q_vi] ?? '') }} className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-zinc-400">←</button>}
                <button onClick={async () => {
                  // KHÔNG ghi đè rỗng lên câu trả lời đã lưu (bug audit 12/6 — mất dữ liệu)
                  const answers = qAns.trim() ? { ...(mx.answers ?? {}), [qs[qIdx].q_vi]: qAns.trim() } : (mx.answers ?? {})
                  await saveMatrix({ ...mx, answers })
                  if (qAns.trim()) { const me = pages.find(n => n.subtype === 'profile_me' && n.owner_id === user.id); if (me) { const { data } = await supabase.from('nodes').select('md').eq('id', me.id).single(); await supabase.from('nodes').update({ md: `${data?.md ?? ''}\n\n**${qs[qIdx].q_vi}**\n${qAns.trim()}` }).eq('id', me.id) } }
                  setQAns(answers[qs[qIdx + 1]?.q_vi] ?? ''); setQIdx(i => Math.min(i + 1, qs.length - 1))
                }} className="flex-1 rounded-lg ak-cta py-1.5 text-xs font-bold">Lưu & tiếp →</button>
              </div>
            </>
          )}
        </Card>
      )}

      {/* BƯỚC 1 — chọn preset (1 quyết định) */}
      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500 mb-2">1 · Chọn góc kể</div>
      <div className="grid sm:grid-cols-2 gap-2.5 mb-5">
        {PRESETS.map(ps => (
          <button key={ps.key} onClick={() => setPreset(ps.key)} className={`text-left rounded-2xl border p-4 transition ${preset === ps.key ? 'bg-violet-500/15 border-violet-400/50' : 'bg-white/[0.03] border-white/10 hover:border-white/25'}`}>
            <div className="text-xl mb-1">{ps.icon}</div>
            <div className="text-sm font-bold">{ps.name}</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">{ps.desc}</div>
          </button>
        ))}
      </div>

      {/* BƯỚC 2 — chủ đề + chất liệu (2 quyết định) */}
      {preset && (<div className="dq-step-in">
        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500 mb-2">2 · Chủ đề & chất liệu thật</div>
        <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Chủ đề hôm nay — vd: lần đầu bị khách từ chối…" className="w-full rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm outline-none focus:border-violet-400/40 mb-2.5" />
        <div className="flex flex-wrap gap-1.5 mb-5">
          {myStories.map(s => (
            <button key={s.id} onClick={async () => { const { data } = await supabase.from('nodes').select('id,title,md').eq('id', s.id).single(); setSrcPage((data as AnyNode) ?? s) }}
              className={`text-[11px] rounded-lg border px-2.5 py-1 transition ${srcPage?.id === s.id ? 'bg-amber-500/20 border-amber-400/50 text-amber-100' : 'bg-white/5 border-white/10 text-zinc-400 hover:border-amber-400/30'}`}>🌱 {s.title}</button>
          ))}
          {myStories.length === 0 && <span className="text-[11px] text-zinc-600">Chưa có chuyện thật — ghi 1 trải nghiệm ở Home trước, content sẽ có hồn.</span>}
        </div>

        {/* BƯỚC 3 — một nút */}
        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500 mb-2">3 · Lấy prompt — dán vào Claude/ChatGPT (AI tự chạy khi cắm key)</div>
        <div className="rounded-2xl border border-white/10 bg-black/30 p-3.5 mb-2.5 max-h-44 overflow-auto">
          <pre className="text-[11px] leading-relaxed text-zinc-400 whitespace-pre-wrap font-mono">{finalPrompt}</pre>
        </div>
        <button onClick={() => copy(finalPrompt, 'fp')} className={`w-full rounded-2xl py-3 text-sm font-bold transition ${copied === 'fp' ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-200' : 'ak-cta'}`}>{copied === 'fp' ? '✓ Đã copy — dán vào AI của bạn' : '📋 Copy prompt hoàn chỉnh'}</button>
      </div>)}

      {/* phụ: chiến lược dài hạn */}
      <div className="mt-8 pt-5 border-t border-white/[0.06] flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-zinc-600">Chiến lược dài hạn:</span>
        {([30, 60, 180] as const).map(d2 => <button key={d2} onClick={() => setPlanDays(d2)} className={`text-[11px] rounded-lg border px-2.5 py-1 ${planDays === d2 ? 'bg-white/10 border-white/25 text-white' : 'border-white/10 text-zinc-500'}`}>{d2} ngày</button>)}
        <button onClick={genPlan} className="text-[11px] rounded-lg border border-amber-400/30 bg-amber-500/10 text-amber-200 px-3 py-1 hover:bg-amber-500/20">⚡ Tạo lịch → Xưởng content</button>
      </div>
    </div>
  )
}

/* ========================== ✅ REVIEW HUB ========================== */
type PendingNode = AnyNode & { org_id?: string }
export function ReviewHub({ me, onOpen, onChanged }: { me: string; onOpen: (id: string) => void; onChanged: () => void }) {
  const [items, setItems] = useState<PendingNode[]>([])
  const [tree, setTree] = useState<AnyNode[]>([])
  const [fbs, setFbs] = useState<{ id: string; node_id: string; question: string }[]>([])
  const [cmts, setCmts] = useState<{ id: string; node_id: string; body: string; resolved: boolean }[]>([])
  const [emails, setEmails] = useState<Record<string, string>>({})
  const [openId, setOpenId] = useState<string | null>(null)
  const [draftMd, setDraftMd] = useState('')
  const [busy, setBusy] = useState(false)
  const [recentOk, setRecentOk] = useState<AnyNode[]>([])
  const load = () => {
    supabase.from('nodes').select('id,title,icon,layer,parent_id,owner_id,md,props,created_at,status').eq('status', 'pending').order('created_at', { ascending: false }).then(({ data }) => setItems((data as PendingNode[]) ?? []))
    supabase.from('nodes').select('id,title,icon,parent_id,layer,kind').neq('kind', 'block').then(({ data }) => setTree((data as AnyNode[]) ?? []))
    supabase.from('open_questions').select('id,node_id,question').eq('status', 'feedback').then(({ data }) => setFbs((data as { id: string; node_id: string; question: string }[]) ?? []))
    supabase.from('page_comments').select('id,node_id,body,resolved').eq('resolved', false).then(({ data }) => setCmts((data as { id: string; node_id: string; body: string; resolved: boolean }[]) ?? []))
    supabase.rpc('admin_list_members').then(({ data }) => { if (data) setEmails(Object.fromEntries((data as { user_id: string; email: string }[]).map(m => [m.user_id, m.email]))) })
    supabase.from('nodes').select('id,title,icon,props').not('props->>approved_at', 'is', null).order('props->>approved_at', { ascending: false }).limit(5).then(({ data }) => setRecentOk((data as AnyNode[]) ?? []))
  }
  useEffect(load, []) // eslint-disable-line react-hooks/exhaustive-deps
  const crumb = (id: string | null | undefined): string => {
    const out: string[] = []; let cur = tree.find(t => t.id === id); let g = 0
    while (cur && g++ < 10) { out.unshift(`${cur.icon ?? ''}${cur.title ?? ''}`); cur = tree.find(t => t.id === cur!.parent_id) }
    return out.join(' › ')
  }
  const layerLbl = (l?: string) => l === 'corporate' ? '🌐 Kho tập đoàn' : l === 'humanity' ? '♾️ Kho nhân loại' : '🧠 Kho cá nhân'
  const opened = items.find(i => i.id === openId)
  async function approve() {
    if (!opened) return
    setBusy(true)
    const np = { ...((opened.props ?? {}) as Record<string, unknown>), last_published_md: draftMd, approved_at: new Date().toISOString(), approved_by: me }
    const { error } = await supabase.from('nodes').update({ status: 'published', md: draftMd, content: null, props: np }).eq('id', opened.id) // content=null: Editor dựng lại từ md đã duyệt — bản sửa của BTV là bản hiển thị
    setBusy(false)
    if (!error) { setOpenId(null); load(); onChanged() }
  }
  async function reject() {
    if (!opened) return
    const note = window.prompt('Lý do trả lại (tác giả sẽ thấy):'); if (note === null) return
    const np = { ...((opened.props ?? {}) as Record<string, unknown>), review_note: note || 'Cần chỉnh sửa thêm' }
    await supabase.from('nodes').update({ status: 'draft', md: draftMd, content: null, props: np }).eq('id', opened.id)
    setOpenId(null); load(); onChanged()
  }
  return (
    <div className="px-8 py-6 max-w-5xl mx-auto">
      <h2 className="text-xl font-extrabold mb-1">✅ Trung tâm biên tập</h2>
      <p className="text-zinc-500 text-sm mb-4">Mỗi bài: thấy rõ <b className="text-zinc-300">kho nào · nằm đâu · ai viết · góp ý gì</b> — đọc lại lần cuối, sửa tại chỗ, rồi mới duyệt.</p>
      {!opened ? (
        <>
          <div className="space-y-2 mb-5">
            {items.map(n => {
              const fb = fbs.filter(f => f.node_id === n.id); const cm = cmts.filter(c => c.node_id === n.id)
              return (
                <div key={n.id} className="rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 hover:border-amber-400/40 transition">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl shrink-0">{n.icon || '📄'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{n.title || 'Chưa đặt tên'}</div>
                      <div className="text-[11px] text-zinc-500 truncate">{layerLbl(n.layer)} <span className="text-zinc-700">·</span> 📂 {crumb(n.parent_id) || 'ngoài cùng'} <span className="text-zinc-700">·</span> ✍️ {n.owner_id ? (emails[n.owner_id] ?? 'thành viên').split('@')[0] : 'hệ thống'} · {n.created_at ? new Date(n.created_at).toLocaleDateString('vi') : ''}</div>
                      {(n.props?.proposal as { reason?: string })?.reason && <p className="text-[11px] text-violet-200/80 truncate mt-0.5">💡 {(n.props!.proposal as { reason: string }).reason}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {(fb.length + cm.length) > 0 && <span className="text-[10px] rounded-lg bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 px-2 py-1">💬 {fb.length + cm.length} góp ý</span>}
                      <button onClick={() => { setOpenId(n.id); setDraftMd(n.md ?? '') }} className="text-xs rounded-lg bg-amber-400 text-black hover:bg-amber-300 px-3 py-1.5 font-bold">👁 Xem & duyệt</button>
                    </div>
                  </div>
                </div>
              )
            })}
            {items.length === 0 && <Card><p className="text-sm text-zinc-600 text-center py-6">🎉 Không còn bài chờ duyệt.</p></Card>}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <Lbl>💬 Góp ý từ thành viên ({fbs.length})</Lbl>
              <div className="space-y-1.5">
                {fbs.map(f => (
                  <div key={f.id} className="flex items-start gap-2 rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2">
                    <span className="text-sm shrink-0">💬</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-300">{f.question}</p>
                      <button onClick={() => onOpen(f.node_id)} className="text-[10px] text-cyan-300 hover:underline">mở bài: {crumb(f.node_id).split(' › ').pop()} →</button>
                    </div>
                    <button onClick={async () => { await supabase.from('open_questions').update({ status: 'resolved' }).eq('id', f.id); load() }} className="text-[10px] rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-zinc-500 hover:text-emerald-300 shrink-0">✓</button>
                  </div>
                ))}
                {fbs.length === 0 && <p className="text-xs text-zinc-600">Chưa có góp ý nào.</p>}
              </div>
            </Card>
            <Card>
              <Lbl>🕓 Duyệt gần đây</Lbl>
              <div className="space-y-1">
                {recentOk.map(n => <button key={n.id} onClick={() => onOpen(n.id)} className="w-full text-left text-xs rounded-lg bg-white/[0.03] border border-white/10 px-2.5 py-1.5 hover:border-emerald-400/40 truncate">✅ {n.icon} {n.title}</button>)}
                {recentOk.length === 0 && <p className="text-xs text-zinc-600">Chưa có.</p>}
              </div>
            </Card>
          </div>
        </>
      ) : (
        /* ===== màn XEM LẠI LẦN CUỐI — sửa tại chỗ rồi mới duyệt ===== */
        <div className="grid lg:grid-cols-[1fr_320px] gap-4">
          <Card>
            <div className="flex items-center justify-between mb-2">
              <Lbl>👁 Đọc lại lần cuối — sửa trực tiếp được</Lbl>
              <button onClick={() => setOpenId(null)} className="text-[11px] text-zinc-500 hover:text-white">← Danh sách</button>
            </div>
            <h3 className="text-lg font-extrabold mb-1">{opened.icon} {opened.title}</h3>
            <div className="text-[11px] text-zinc-500 mb-3">{layerLbl(opened.layer)} · 📂 {crumb(opened.parent_id)} · ✍️ {opened.owner_id ? (emails[opened.owner_id] ?? '').split('@')[0] : 'hệ thống'}</div>
            <textarea value={draftMd} onChange={e => setDraftMd(e.target.value)} className="w-full h-[420px] rounded-xl bg-black/30 border border-white/10 p-4 text-[13px] font-mono leading-relaxed outline-none focus:border-amber-400/40" />
          </Card>
          <div className="space-y-3">
            <Card>
              <Lbl>Xem trước</Lbl>
              <div className="max-h-72 overflow-auto"><MiniMd md={draftMd} /></div>
            </Card>
            <Card>
              <Lbl>💬 Góp ý về bài này</Lbl>
              {[...fbs.filter(f => f.node_id === opened.id).map(f => f.question), ...cmts.filter(c => c.node_id === opened.id).map(c => c.body)].map((q, i) => <p key={i} className="text-xs text-zinc-300 mb-1.5">• {q}</p>)}
              {fbs.filter(f => f.node_id === opened.id).length + cmts.filter(c => c.node_id === opened.id).length === 0 && <p className="text-xs text-zinc-600">Không có.</p>}
            </Card>
            <button onClick={approve} disabled={busy} className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-sm font-bold disabled:opacity-50">✅ Đã đọc lại — Duyệt & xuất bản</button>
            <button onClick={reject} className="w-full rounded-xl bg-white/5 border border-white/10 py-2.5 text-sm text-zinc-400 hover:text-red-300 hover:border-red-400/40">↩ Trả lại kèm lý do</button>
            <button onClick={() => { onOpen(opened.id) }} className="w-full text-[11px] text-zinc-500 hover:text-white py-1">mở bằng editor đầy đủ →</button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── 📈 HÀNH VI PILOT — admin đọc events 14 ngày qua admin_event_stats (record để chỉnh) ── */
function BehaviorPanel({ members }: { members: { user_id: string; email: string }[] }) {
  const [rows, setRows] = useState<{ user_id: string; type: string; d: string; n: number }[]>([])
  useEffect(() => { supabase.rpc('admin_event_stats', { p_days: 14 }).then(({ data }) => setRows((data as typeof rows) ?? [])) }, [])
  const by = new Map<string, { total: number; tham: number; capture: number; nav: number; last: string }>()
  for (const r of rows) {
    const b = by.get(r.user_id) ?? { total: 0, tham: 0, capture: 0, nav: 0, last: '' }
    b.total += r.n
    if (r.type === 'tham') b.tham += r.n
    if (r.type === 'capture') b.capture += r.n
    if (r.type === 'nav') b.nav += r.n
    if (r.d > b.last) b.last = r.d
    by.set(r.user_id, b)
  }
  const star = [...by.values()].reduce((s2, b) => s2 + b.tham, 0)
  return (
    <Card className="mb-4 border-amber-400/15">
      <div className="flex items-center justify-between mb-2">
        <Lbl>📈 Hành vi pilot — 14 ngày</Lbl>
        <span className="text-[11px] text-amber-300 font-semibold tabular-nums">⭐ North star: {star} bài chuyển hoá trọn</span>
      </div>
      {by.size === 0 ? <p className="text-xs text-zinc-600">Chưa có hành vi nào được ghi.</p> : (
        <div className="space-y-1">
          {[...by.entries()].sort((a, b) => b[1].total - a[1].total).map(([uid, b]) => (
            <div key={uid} className="flex items-center gap-3 rounded-lg bg-white/[0.03] border border-white/10 px-3 py-1.5 text-[11px] tabular-nums">
              <span className="flex-1 truncate text-zinc-300">{members.find(m => m.user_id === uid)?.email.split('@')[0] ?? uid.slice(0, 8)}</span>
              <span className="text-amber-300" title="bài chuyển hoá trọn">🔥 {b.tham}</span>
              <span className="text-cyan-300" title="lần ghi nhanh">✍️ {b.capture}</span>
              <span className="text-zinc-500" title="lượt chuyển màn">🧭 {b.nav}</span>
              <span className="text-zinc-500" title="tổng events">Σ {b.total}</span>
              <span className="text-zinc-600 shrink-0" title="hoạt động gần nhất">{b.last.slice(5)}</span>
            </div>
          ))}
        </div>
      )}
      <p className="text-[10px] text-zinc-600 mt-2">Đọc số này mỗi tuần: ai 0 🔥 sau 7 ngày = phỏng vấn họ kẹt ở đâu; màn 🧭 cao mà 🔥 thấp = đi lạc, cần dẫn lối lại.</p>
    </Card>
  )
}

/* ========================== 👥 MEMBERS HUB ========================== */
type Member = { user_id: string; email: string; full_name: string | null; level: number; can_edit: boolean; can_approve: boolean }
const LEVEL_NAME: Record<number, string> = { 5: '👑 Admin', 4: '✅ Tổng biên tập', 3: '✏️ Biên tập viên', 2: '🤝 Cộng tác viên', 1: '🌱 Thành viên' }
export function MembersHub({ me, orgId, canAdmin, pages = [], onOpenPage }: { me: string; orgId?: string | null; canAdmin: boolean; pages?: AnyNode[]; onOpenPage: (id: string) => void }) {
  const [members, setMembers] = useState<Member[]>([])
  const [pagesBy, setPagesBy] = useState<Record<string, AnyNode[]>>({})
  const [statsBy, setStatsBy] = useState<Record<string, { pages: number; links: number }>>({})
  const [asgs, setAsgs] = useState<{ id: string; title: string; note: string | null; due: string | null; status: string; assignee: string; assigner: string; node_id?: string | null }[]>([])
  const [focus, setFocus] = useState<string | null>(null)
  const [na, setNa] = useState({ assignee: '', title: '', note: '', due: '', node_id: '' })
  const [msg, setMsg] = useState('')
  const load = () => {
    supabase.rpc('admin_list_members').then(({ data }) => setMembers((data as Member[]) ?? []))
    supabase.from('assignments').select('*').order('created_at', { ascending: false }).limit(40).then(({ data }) => setAsgs((data as typeof asgs) ?? []))
    // trang đang build của từng người (kho chung — RLS cho đọc)
    supabase.from('nodes').select('id,title,icon,owner_id,status,created_at,layer').neq('kind', 'block').not('owner_id', 'is', null).order('created_at', { ascending: false }).limit(400).then(({ data }) => {
      const by: Record<string, AnyNode[]> = {}; const st: Record<string, { pages: number; links: number }> = {}
      for (const n of (data as AnyNode[]) ?? []) { (by[n.owner_id as string] ??= []).push(n); st[n.owner_id as string] = { pages: (st[n.owner_id as string]?.pages ?? 0) + 1, links: 0 } }
      setPagesBy(by); setStatsBy(st)
    })
  }
  useEffect(load, [])
  async function setMember(m: Member, patch: Partial<Member>) {
    const next = { ...m, ...patch }
    const { error } = await supabase.rpc('admin_set_member', { p_user: m.user_id, p_level: next.level, p_can_edit: next.can_edit, p_can_approve: next.can_approve })
    if (error) setMsg(error.message); else { setMsg('✓ đã cập nhật'); load() }
    setTimeout(() => setMsg(''), 2000)
  }
  const grouped = [...members].sort((a, b) => b.level - a.level)
  const fm = members.find(m => m.user_id === focus)
  return (
    <div className="px-8 py-6 max-w-5xl mx-auto">
      <h2 className="text-xl font-extrabold mb-1">👥 Nhân sự & phân quyền</h2>
      <p className="text-zinc-500 text-sm mb-4">Toàn bộ thành viên theo cấp bậc — bật/tắt quyền, xem trang họ đang build, giao việc gắn vào trang cụ thể. {msg && <b className="text-emerald-300">{msg}</b>}</p>
      {canAdmin && <BehaviorPanel members={members} />}
      <div className="grid lg:grid-cols-[1fr_360px] gap-4">
        <div className="space-y-2">
          {grouped.map(m => (
            <div key={m.user_id} className={`rounded-2xl border px-4 py-3 transition cursor-pointer ${focus === m.user_id ? 'bg-violet-500/10 border-violet-400/40' : 'bg-white/[0.04] border-white/10 hover:border-white/25'}`} onClick={() => setFocus(focus === m.user_id ? null : m.user_id)}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl ak-grad grid place-items-center text-sm font-black text-white shrink-0">{m.email[0].toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{m.full_name || m.email.split('@')[0]} {m.user_id === me && <span className="text-[9px] text-zinc-500">(bạn)</span>}</div>
                  <div className="text-[11px] text-zinc-500 truncate">{m.email} · 📄 {statsBy[m.user_id]?.pages ?? 0} trang</div>
                </div>
                <span className="text-[11px] rounded-lg bg-white/5 border border-white/10 px-2 py-1 shrink-0">{LEVEL_NAME[m.level] ?? m.level}</span>
              </div>
              {focus === m.user_id && canAdmin && (
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                  <select value={m.level} onChange={e => setMember(m, { level: parseInt(e.target.value) })} className="rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 text-xs outline-none text-zinc-300">
                    {[1, 2, 3, 4, 5].map(l => <option key={l} value={l}>{LEVEL_NAME[l]}</option>)}
                  </select>
                  <button onClick={() => setMember(m, { can_edit: !m.can_edit })} className={`text-[11px] rounded-lg border px-2.5 py-1.5 ${m.can_edit ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-200' : 'bg-white/5 border-white/10 text-zinc-500'}`}>✏️ Soạn kho chung {m.can_edit ? 'ON' : 'OFF'}</button>
                  <button onClick={() => setMember(m, { can_approve: !m.can_approve })} className={`text-[11px] rounded-lg border px-2.5 py-1.5 ${m.can_approve ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200' : 'bg-white/5 border-white/10 text-zinc-500'}`}>✅ Quyền duyệt {m.can_approve ? 'ON' : 'OFF'}</button>
                </div>
              )}
              {focus === m.user_id && (
                <div className="mt-3 pt-3 border-t border-white/10" onClick={e => e.stopPropagation()}>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">📄 Trang gần đây của {m.email.split('@')[0]} — bấm mở & comment</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(pagesBy[m.user_id] ?? []).slice(0, 6).map(n => (
                      <button key={n.id} onClick={() => onOpenPage(n.id)} className="text-[11px] rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-zinc-300 hover:border-cyan-400/40 max-w-[200px] truncate">{n.icon} {n.title}{n.status === 'pending' ? ' ⏳' : ''}</button>
                    ))}
                    {(pagesBy[m.user_id] ?? []).length === 0 && <p className="text-xs text-zinc-600">Chưa thấy trang nào (kho riêng không hiển thị).</p>}
                  </div>
                  <p className="text-[10px] text-zinc-600 mt-1.5">💬 Mở trang kho chung của họ → khung Thảo luận cuối trang để trao đổi trực tiếp.</p>
                </div>
              )}
            </div>
          ))}
          {grouped.length === 0 && <Card><p className="text-sm text-zinc-600 text-center py-4">Chỉ admin/tổng biên tập xem được danh sách.</p></Card>}
        </div>
        {/* GIAO VIỆC — gắn node + vòng đời */}
        <div className="space-y-3">
          {canAdmin && (
            <Card>
              <Lbl>📋 Giao việc mới {fm ? `cho ${fm.email.split('@')[0]}` : ''}</Lbl>
              <select value={na.assignee || focus || ''} onChange={e => setNa({ ...na, assignee: e.target.value })} className="w-full rounded-lg bg-white/5 border border-white/10 px-2 py-2 text-xs outline-none text-zinc-300 mb-2">
                <option value="">— chọn người —</option>
                {members.map(m => <option key={m.user_id} value={m.user_id}>{m.email}</option>)}
              </select>
              <input value={na.title} onChange={e => setNa({ ...na, title: e.target.value })} placeholder="Việc gì? (vd: Viết bài HomePure góc chuyện thật)" className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs outline-none mb-2" />
              <input value={na.note} onChange={e => setNa({ ...na, note: e.target.value })} placeholder="Ghi chú / tiêu chí nghiệm thu…" className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs outline-none mb-2" />
              <div className="flex gap-2 mb-2">
                <input type="date" value={na.due} onChange={e => setNa({ ...na, due: e.target.value })} className="flex-1 rounded-lg bg-white/5 border border-white/10 px-2 py-2 text-xs outline-none [color-scheme:dark]" />
              </div>
              <select value={na.node_id} onChange={e => setNa({ ...na, node_id: e.target.value })} title="Gắn việc vào trang cụ thể — người nhận bấm 'Mở việc' là tới đúng chỗ" className="w-full rounded-lg bg-white/5 border border-white/10 px-2 py-2 text-xs outline-none text-zinc-300 mb-2">
                <option value="">— gắn vào trang (tuỳ chọn) —</option>
                {pages.filter(pg => pg.layer !== 'personal' && (pg as AnyNode & { kind?: string }).kind !== 'kho').slice(0, 80).map(pg => <option key={pg.id} value={pg.id}>{pg.icon ?? ''} {pg.title}</option>)}
              </select>
              <button onClick={async () => {
                const assignee = na.assignee || focus; if (!assignee || !na.title.trim()) return
                // P0 fix: org_id NOT NULL — thiếu là insert fail im lặng; giờ báo lỗi rõ
                const { error } = await supabase.from('assignments').insert({ org_id: orgId, assignee, assigner: me, title: na.title.trim(), note: na.note || null, due: na.due || null, node_id: na.node_id || null, status: 'open' })
                if (error) { setMsg('✗ ' + error.message); setTimeout(() => setMsg(''), 4000); return }
                setMsg('✓ đã giao'); setTimeout(() => setMsg(''), 2000)
                setNa({ assignee: '', title: '', note: '', due: '', node_id: '' }); load()
              }} disabled={!(na.assignee || focus) || !na.title.trim()} className="w-full rounded-xl ak-cta py-2 text-xs font-bold disabled:opacity-40">📨 Giao việc</button>
            </Card>
          )}
          <Card>
            <Lbl>🗂 Việc đang chạy ({asgs.filter(a => a.status !== 'done').length})</Lbl>
            <div className="space-y-1.5 max-h-80 overflow-auto">
              {asgs.map(a => {
                const who = members.find(m => m.user_id === a.assignee)
                return (
                  <div key={a.id} className={`rounded-xl border px-3 py-2 ${a.status === 'done' ? 'bg-white/[0.02] border-white/5 opacity-50' : 'bg-white/[0.03] border-white/10'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs shrink-0">{a.status === 'done' ? '✅' : a.status === 'submitted' ? '📨' : '⏳'}</span>
                      <span className="flex-1 text-xs truncate text-zinc-300">{a.title}</span>
                      {a.status !== 'done' && a.assignee === me && <button onClick={async () => { await supabase.from('assignments').update({ status: 'submitted' }).eq('id', a.id); load() }} className="text-[10px] rounded bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 px-1.5 py-0.5 shrink-0">Nộp</button>}
                      {a.status === 'submitted' && canAdmin && <button onClick={async () => { await supabase.from('assignments').update({ status: 'done' }).eq('id', a.id); await supabase.rpc('award_qi', { p_user: a.assignee, p_type: 'content', p_node: (a as { node_id?: string | null }).node_id ?? null }); load() }} className="text-[10px] rounded bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 px-1.5 py-0.5 shrink-0">Nghiệm thu</button>}
                    </div>
                    <div className="text-[10px] text-zinc-600 pl-5">→ {who?.email.split('@')[0] ?? '?'}{a.due ? ` · hạn ${new Date(a.due).toLocaleDateString('vi')}` : ''}{a.note ? ` · ${a.note}` : ''}</div>
                  </div>
                )
              })}
              {asgs.length === 0 && <p className="text-xs text-zinc-600">Chưa có việc nào.</p>}
            </div>
            <p className="text-[10px] text-zinc-600 mt-2">Vòng đời: ⏳ giao → 📨 nộp → ✅ nghiệm thu (tự cộng Qi cho người làm).</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
