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

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => <div className={`rounded-2xl bg-white/5 border border-white/10 p-5 ${className}`}>{children}</div>
const Lbl = ({ children }: { children: React.ReactNode }) => <div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2 font-semibold">{children}</div>

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
export function KolFeed({ user, canEdit, onOpenPage, onInsight }: {
  user: User; canEdit: boolean
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
                  <button onClick={() => { if (insightDraft.trim()) { onInsight(insightDraft.trim(), open.title ?? '', open.id); setOpen(null) } }} disabled={!insightDraft.trim()} className="rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black px-4 py-2 text-xs font-bold disabled:opacity-40 shrink-0">💎 Nạp vào kho</button>
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

/* ========================== 🎛️ CONTENT ENGINE ========================== */
type Matrix = { strengths: string[]; exploit: string[]; avoid: string[]; freq: string; formats: string[]; channels: string[]; answers?: Record<string, string> }
const EMPTY_MATRIX: Matrix = { strengths: [], exploit: [], avoid: [], freq: '3/tuần', formats: [], channels: [] }
const FORMATS = ['📰 Bài viết dài', '🎞️ Reel/Short', '🎬 Video dài', '💬 Caption + ảnh', '📧 Email/tin nhắn', '🎤 Bài chia sẻ']
const CHANNELS = ['Facebook cá nhân', 'Group/Cộng đồng', 'TikTok', 'Instagram', 'YouTube', 'Zalo']
const FREQS = ['1/tuần', '3/tuần', '5/tuần', 'mỗi ngày']

export function ContentEngine({ user, orgId, pages, onOpenPage, onCreatePlan }: {
  user: User
  orgId?: string | null
  pages: AnyNode[]   // toàn bộ tree — để lấy giá trị, chuyện đời, viral lib
  onOpenPage: (id: string) => void
  onCreatePlan: (title: string, md: string) => void
}) {
  const [tab, setTab] = useState<'matrix' | 'voice' | 'lib' | 'prompt'>('matrix')
  const [mx, setMx] = useState<Matrix>(EMPTY_MATRIX)
  const [mxId, setMxId] = useState<string | null>(null)
  const [qs, setQs] = useState<{ q_vi: string; why_vi: string; maps_to: string }[]>([])
  const [qIdx, setQIdx] = useState(0)
  const [qAns, setQAns] = useState('')
  const [hooks, setHooks] = useState<{ text_vi: string; category: string }[]>([])
  const [lib, setLib] = useState<AnyNode[]>([])
  const [copied, setCopied] = useState('')
  const [planDays, setPlanDays] = useState<30 | 60 | 180>(30)
  useEffect(() => {
    // ma trận content của tôi (node ẩn trong kho cá nhân)
    supabase.from('nodes').select('id,props').eq('owner_id', user.id).eq('subtype', 'content_matrix').limit(1).maybeSingle().then(({ data }) => {
      if (data) { setMxId(data.id); setMx({ ...EMPTY_MATRIX, ...((data.props as { matrix?: Matrix })?.matrix ?? {}) }) }
    })
    supabase.from('nodes').select('id,title,md,props,subtype').in('subtype', ['brand_questions', 'viral_hooks', 'viral_script', 'viral_titles']).then(({ data }) => {
      const all = (data as AnyNode[]) ?? []
      setQs(((all.find(n => n.subtype === 'brand_questions')?.props?.questions) as { q_vi: string; why_vi: string; maps_to: string }[]) ?? [])
      setHooks(((all.find(n => n.subtype === 'viral_hooks')?.props?.hooks) as { text_vi: string; category: string }[]) ?? [])
      setLib(all.filter(n => n.subtype === 'viral_script' || n.subtype === 'viral_titles' || n.subtype === 'viral_hooks'))
    })
  }, [user.id])
  const myValues = pages.filter(n => (n.props?.role as string) === 'value' || n.subtype === 'core_value')
  const myStories = pages.filter(n => (n.props?.page_type as string) === 'trai-nghiem' && n.owner_id === user.id).slice(0, 8)
  // chống race: bấm chip liên tiếp trước khi node tồn tại → CHỈ tạo 1 lần (bug bắt được khi test 12/6)
  const creatingRef = useRef<Promise<string> | null>(null)
  async function ensureMatrixId(first: Matrix): Promise<string> {
    if (mxId) return mxId
    if (!creatingRef.current) creatingRef.current = (async () => {
      const { data: ex } = await supabase.from('nodes').select('id').eq('owner_id', user.id).eq('subtype', 'content_matrix').limit(1).maybeSingle()
      if (ex) { setMxId(ex.id); return ex.id as string }
      const kho = pages.find(n => n.owner_id === user.id && n.layer === 'personal' && !n.parent_id)
      const id = crypto.randomUUID()
      await supabase.from('nodes').insert({ id, org_id: orgId, owner_id: user.id, layer: 'personal', kind: 'page', parent_id: kho?.id ?? null, title: 'Ma trận content của tôi', icon: '🎛️', subtype: 'content_matrix', status: 'published', min_level: 1, props: { matrix: first } })
      setMxId(id); return id
    })()
    return creatingRef.current
  }
  async function saveMatrix(next: Matrix) {
    setMx(next)
    const id = await ensureMatrixId(next)
    await supabase.from('nodes').update({ props: { matrix: next } }).eq('id', id)
  }
  const chip = (on: boolean) => `px-2.5 py-1 rounded-lg text-[11px] border transition ${on ? 'bg-violet-500/25 border-violet-400/50 text-white' : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/30'}`
  const toggle = (arr: string[], v: string) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]
  function copy(t: string, key: string) { navigator.clipboard?.writeText(t); setCopied(key); setTimeout(() => setCopied(''), 1500) }
  // ===== PROMPT máy sinh từ ma trận + kho =====
  const anchor = pages.find(n => n.subtype === 'anchor_home' && n.owner_id === user.id)
  const masterPrompt = `Bạn là người viết content thay tôi. GIỌNG CỦA TÔI:\n- Giá trị cốt lõi: ${myValues.map(v => v.title).join(', ') || '(chưa khai báo)'}\n- Điểm mạnh khai thác: ${mx.strengths.join(', ') || '(chưa chọn)'}\n- Chủ đề tôi muốn nói: ${mx.exploit.join(', ') || '(chưa chọn)'}\n- TUYỆT ĐỐI KHÔNG nhắc tới: ${mx.avoid.join(', ') || '(không có)'}\n- Không hứa hẹn thu nhập, không thổi phồng. Kể chuyện thật, có chi tiết cụ thể.\n\nCHẤT LIỆU: dùng câu chuyện thật của tôi (đính kèm bên dưới) + châm ngôn của tôi.\nNHIỆM VỤ: viết {định dạng} về chủ đề {chủ đề}, mở đầu bằng 1 hook từ thư viện, kết bằng câu hỏi mở cho người đọc.\n\n[DÁN CHUYỆN THẬT CỦA BẠN VÀO ĐÂY — mở trang trong 📓 Hành trình và copy]`
  function genPlan() {
    const perWeek = mx.freq === 'mỗi ngày' ? 7 : parseInt(mx.freq) || 3
    const weeks = Math.round(planDays / 7)
    const pillars = [...mx.exploit, ...myValues.map(v => v.title ?? '')].filter(Boolean).slice(0, 4)
    if (!pillars.length) pillars.push('Câu chuyện chuyển hoá của tôi')
    const fmts = mx.formats.length ? mx.formats : ['💬 Caption + ảnh']
    let md = `**Loại:** 📋 Quy trình · **Campaign:** Chiến lược ${planDays} ngày\n\n**Tóm tắt 1 câu:** Lịch content ${planDays} ngày — ${perWeek} bài/tuần xoay ${pillars.length} trụ: ${pillars.join(' · ')}.\n\n**Nguồn:** Ma trận content + kho chuyện thật của tôi\n\n## Nguyên tắc\n- Mỗi bài PHẢI neo về 1 chuyện thật hoặc 1 giá trị (link 8 chiều)\n- Tỉ lệ 4-1-1: 4 trao giá trị · 1 kể chuyện đời · 1 mời gọi nhẹ\n- Sau mỗi tuần: ghi lại bài nào chạy tốt vào Board → tinh chỉnh tuần sau\n`
    for (let w = 1; w <= weeks; w++) {
      md += `\n## Tuần ${w} — trụ: ${pillars[(w - 1) % pillars.length]}\n`
      for (let d2 = 0; d2 < perWeek; d2++) md += `- [ ] Bài ${d2 + 1}: ${fmts[d2 % fmts.length]} · góc: ${['chuyện thật của tôi', 'bài học rút ra', 'sai lầm thường gặp', 'hỏi đáp khán giả', 'trích sách + cảm nhận', 'hậu trường công việc', 'số liệu/kết quả thật'][d2 % 7]}\n`
    }
    md += `\n## Đo & tinh chỉnh\n- [ ] Cuối mỗi tuần: cập nhật kết quả vào Board (reach/lead/phản hồi)\n- [ ] Cuối tháng: bài tốt nhất → nhân bản thành ${fmts.length > 1 ? 'định dạng khác' : 'series'}\n- [ ] Vòng lặp: thành công nối tiếp thành công — giữ gì, bỏ gì, thử gì mới?`
    onCreatePlan(`Chiến lược content ${planDays} ngày (${new Date().toLocaleDateString('vi')})`, md)
  }
  const TABS: [typeof tab, string][] = [['matrix', '🎯 Ma trận content'], ['voice', '🎙️ 21 câu hỏi giọng'], ['lib', '🧨 Thư viện viral'], ['prompt', '🤖 Prompt & chiến lược']]
  return (
    <div className="px-8 py-6 max-w-5xl mx-auto">
      <h2 className="text-xl font-extrabold mb-1">🎛️ Content Engine</h2>
      <p className="text-zinc-500 text-sm mb-4">Chọn điểm mạnh → né vùng cấm → đặt nhịp → lấy prompt & lịch — vài dòng lệnh dùng cả kho tri thức của bạn.</p>
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {TABS.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`text-xs rounded-xl px-3.5 py-2 border transition ${tab === k ? 'ak-cta text-white font-bold border-transparent' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'}`}>{l}</button>)}
      </div>

      {tab === 'matrix' && (
        <div className="space-y-4">
          <Card>
            <Lbl>💪 Điểm mạnh của tôi — chọn từ chuyện đời thật (tối đa 5)</Lbl>
            <div className="flex flex-wrap gap-1.5">
              {['Kể chuyện thật', 'Kiên trì sau thất bại', 'Phân tích số liệu', 'Lắng nghe sâu', 'Hài hước tự trào', 'Kỷ luật buổi sáng', 'Kiến thức đầu tư', 'Trải nghiệm du học', 'Làm cha mẹ', 'Networking tử tế', 'Đọc sách & đúc rút', 'Thiền & tĩnh tâm'].map(s => (
                <button key={s} onClick={() => saveMatrix({ ...mx, strengths: toggle(mx.strengths, s).slice(0, 5) })} className={chip(mx.strengths.includes(s))}>{s}</button>
              ))}
            </div>
          </Card>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <Lbl>🎯 Điều tôi muốn khai thác</Lbl>
              <div className="flex flex-wrap gap-1.5">
                {['Hành trình vấp ngã → đứng dậy', 'Tài chính cá nhân tử tế', 'Thói quen & kỷ luật', 'Chuyện gia đình & làm cha', 'Bài học kinh doanh', 'Sách & người thầy', 'Hậu trường nghề', 'Phát triển đội nhóm'].map(s => (
                  <button key={s} onClick={() => saveMatrix({ ...mx, exploit: toggle(mx.exploit, s) })} className={chip(mx.exploit.includes(s))}>{s}</button>
                ))}
              </div>
            </Card>
            <Card>
              <Lbl>🚫 Vùng KHÔNG nhắc tới — AI sẽ tránh tuyệt đối</Lbl>
              <div className="flex flex-wrap gap-1.5">
                {['Số thu nhập cụ thể', 'So sánh công ty khác', 'Chính trị/tôn giáo', 'Chuyện riêng gia đình lớn', 'Khoe của', 'Hứa hẹn kết quả', 'Drama cá nhân'].map(s => (
                  <button key={s} onClick={() => saveMatrix({ ...mx, avoid: toggle(mx.avoid, s) })} className={`px-2.5 py-1 rounded-lg text-[11px] border transition ${mx.avoid.includes(s) ? 'bg-red-500/20 border-red-400/50 text-red-200' : 'bg-white/5 border-white/10 text-zinc-400'}`}>{s}</button>
                ))}
              </div>
            </Card>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <Card><Lbl>📆 Nhịp ra bài</Lbl><div className="flex flex-wrap gap-1.5">{FREQS.map(f => <button key={f} onClick={() => saveMatrix({ ...mx, freq: f })} className={chip(mx.freq === f)}>{f}</button>)}</div></Card>
            <Card><Lbl>🎬 Định dạng mạnh</Lbl><div className="flex flex-wrap gap-1.5">{FORMATS.map(f => <button key={f} onClick={() => saveMatrix({ ...mx, formats: toggle(mx.formats, f) })} className={chip(mx.formats.includes(f))}>{f}</button>)}</div></Card>
            <Card><Lbl>📡 Kênh</Lbl><div className="flex flex-wrap gap-1.5">{CHANNELS.map(f => <button key={f} onClick={() => saveMatrix({ ...mx, channels: toggle(mx.channels, f) })} className={chip(mx.channels.includes(f))}>{f}</button>)}</div></Card>
          </div>
          <Card className="border-violet-400/20">
            <Lbl>📖 Chất liệu sẵn có từ kho của bạn</Lbl>
            <div className="flex flex-wrap gap-1.5">
              {myValues.map(v => <span key={v.id} className="text-[11px] rounded-lg bg-violet-500/15 border border-violet-400/30 text-violet-200 px-2 py-1">⭐ {v.title}</span>)}
              {myStories.map(s => <button key={s.id} onClick={() => onOpenPage(s.id)} className="text-[11px] rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-zinc-400 hover:text-white">🌱 {s.title}</button>)}
              {myValues.length + myStories.length === 0 && <p className="text-xs text-zinc-600">Chưa có — ghi trải nghiệm & giá trị trước, content sẽ có hồn.</p>}
            </div>
          </Card>
        </div>
      )}

      {tab === 'voice' && (
        <Card>
          {qs.length === 0 ? <p className="text-sm text-zinc-600">Chưa nạp bộ câu hỏi (trang “21 câu hỏi khai mở giọng thương hiệu” trong Thư viện viral).</p> : (
            <>
              <div className="flex items-center justify-between mb-3">
                <Lbl>🎙️ Câu {qIdx + 1}/{qs.length}</Lbl>
                <div className="h-1.5 w-40 rounded-full bg-white/10 overflow-hidden"><div className="h-full ak-grad" style={{ width: `${((qIdx) / qs.length) * 100}%` }} /></div>
              </div>
              <h3 className="text-lg font-bold mb-1">{qs[qIdx].q_vi}</h3>
              <p className="text-[11px] text-zinc-500 mb-1">Vì sao hỏi: {qs[qIdx].why_vi}</p>
              <p className="text-[10px] text-zinc-600 mb-3">→ đổ vào: {qs[qIdx].maps_to}</p>
              <textarea value={qAns} onChange={e => setQAns(e.target.value)} placeholder="Kể thật — càng cụ thể càng quý…" className="w-full h-32 rounded-xl bg-white/5 border border-white/10 p-3 text-sm outline-none focus:border-violet-400/50 mb-3" />
              <div className="flex gap-2">
                {qIdx > 0 && <button onClick={() => { setQIdx(i => i - 1); setQAns(mx.answers?.[qs[qIdx - 1].q_vi] ?? '') }} className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-zinc-400">← Trước</button>}
                <button onClick={async () => {
                  const answers = { ...(mx.answers ?? {}), [qs[qIdx].q_vi]: qAns.trim() }
                  await saveMatrix({ ...mx, answers })
                  if (qAns.trim()) {
                    // ghi vào trang "Tôi là ai" để AI đọc
                    const me = pages.find(n => n.subtype === 'profile_me' && n.owner_id === user.id)
                    if (me) { const { data } = await supabase.from('nodes').select('md').eq('id', me.id).single(); await supabase.from('nodes').update({ md: `${data?.md ?? ''}\n\n**${qs[qIdx].q_vi}**\n${qAns.trim()}` }).eq('id', me.id) }
                  }
                  setQAns(answers[qs[qIdx + 1]?.q_vi] ?? ''); setQIdx(i => Math.min(i + 1, qs.length - 1))
                }} className="flex-1 rounded-xl ak-cta py-2 text-sm font-bold">{qIdx === qs.length - 1 ? '✓ Hoàn thành' : 'Lưu & câu tiếp →'}</button>
              </div>
              <p className="text-[10px] text-zinc-600 mt-2">Đã trả lời: {Object.values(mx.answers ?? {}).filter(Boolean).length}/{qs.length} — câu trả lời tự ghi vào trang “Tôi là ai” cho AI đọc.</p>
            </>
          )}
        </Card>
      )}

      {tab === 'lib' && (
        <div className="space-y-4">
          <Card>
            <Lbl>🪝 Hook giữ chân ({hooks.length}) — bấm để copy</Lbl>
            <div className="max-h-72 overflow-auto space-y-3 pr-1">
              {Object.entries(hooks.reduce<Record<string, string[]>>((acc, h) => { (acc[h.category] ??= []).push(h.text_vi); return acc }, {})).map(([cat, hs]) => (
                <div key={cat}>
                  <div className="text-[10px] uppercase tracking-wider text-amber-300/70 mb-1">{cat}</div>
                  <div className="flex flex-wrap gap-1.5">{hs.map((h, i) => <button key={i} onClick={() => copy(h, cat + i)} className={`text-left text-[11px] rounded-lg border px-2 py-1 transition ${copied === cat + i ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200' : 'bg-white/5 border-white/10 text-zinc-300 hover:border-amber-400/40'}`}>{copied === cat + i ? '✓ đã copy' : h}</button>)}</div>
                </div>
              ))}
              {hooks.length === 0 && <p className="text-xs text-zinc-600">Chưa nạp hooks.</p>}
            </div>
          </Card>
          <div className="grid md:grid-cols-2 gap-3">
            {lib.filter(n => n.subtype !== 'viral_hooks').map(n => (
              <button key={n.id} onClick={() => onOpenPage(n.id)} className="text-left rounded-2xl bg-white/[0.04] border border-white/10 p-4 hover:border-violet-400/50 transition">
                <div className="text-2xl mb-1">{n.subtype === 'viral_titles' ? '✨' : '🎬'}</div>
                <div className="text-sm font-bold">{n.title}</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">{(n.props?.use_case as string) ?? 'mở để xem cấu trúc từng beat'}</div>
              </button>
            ))}
          </div>
          <Card>
            <Lbl>📤 Nạp skill/tài liệu marketing của bạn</Lbl>
            <p className="text-xs text-zinc-500 mb-2">Có tài liệu hay lượm trên mạng? Dán vào <b className="text-zinc-300">📥 Nhập liệu</b> (Home) chọn loại 📋 Quy trình → nó vào kho và Engine dùng được ngay. File .md thì kéo vào nút <b className="text-zinc-300">.md</b> trên thanh Kho tri thức.</p>
          </Card>
        </div>
      )}

      {tab === 'prompt' && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-2"><Lbl>🤖 Master prompt — giọng của bạn (máy sinh từ ma trận + kho)</Lbl>
              <button onClick={() => copy(masterPrompt, 'mp')} className={`text-[10px] rounded-lg border px-2.5 py-1 ${copied === 'mp' ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'}`}>{copied === 'mp' ? '✓ đã copy' : '📋 Copy'}</button>
            </div>
            <pre className="text-[11px] leading-relaxed text-zinc-300 whitespace-pre-wrap font-mono bg-black/30 rounded-xl border border-white/10 p-3 max-h-56 overflow-auto">{masterPrompt}</pre>
            <p className="text-[10px] text-zinc-600 mt-2">Dán vào Claude/ChatGPT kèm 1 chuyện thật từ 📓 Hành trình — khi cắm API, Akash tự làm bước này. {anchor ? '⚓ Kim Chỉ Nam của bạn sẽ được đính kèm tự động.' : ''}</p>
          </Card>
          <Card>
            <Lbl>📅 Sinh chiến lược content {planDays} ngày từ ma trận</Lbl>
            <div className="flex items-center gap-2 mb-3">
              {([30, 60, 180] as const).map(d2 => <button key={d2} onClick={() => setPlanDays(d2)} className={chip(planDays === d2)}>{d2} ngày</button>)}
              <span className="text-[10px] text-zinc-600">nhịp {mx.freq} · {mx.formats.length || 1} định dạng · trụ từ "điều muốn khai thác"</span>
            </div>
            <button onClick={genPlan} className="w-full rounded-xl ak-cta py-2.5 text-sm font-bold">⚡ Tạo lịch {planDays} ngày → lưu vào 🎬 Xưởng content</button>
            <p className="text-[10px] text-zinc-600 mt-2">Lịch = trang checklist trong Xưởng content: mỗi tuần một trụ, tỉ lệ 4-1-1, có mục đo & tinh chỉnh cuối tuần — vòng lặp thành công nối tiếp thành công.</p>
          </Card>
          <Card>
            <Lbl>🎥 Pipeline media (chuẩn bị cho AI — theo nghiên cứu Higgsfield/Runway/HeyGen)</Lbl>
            <div className="grid sm:grid-cols-5 gap-1.5 text-center">
              {[['📖', 'Chuyện thật', 'từ kho của bạn'], ['✍️', 'Script', 'Claude — giọng bạn'], ['🖼️', 'Ảnh/Storyboard', 'Flux/Midjourney'], ['🎬', 'Video', 'Kling/Runway/Higgsfield'], ['🗣️', 'Voice', 'ElevenLabs']].map(([ic, t, d2]) => (
                <div key={t} className="rounded-xl bg-white/[0.04] border border-white/10 px-2 py-3"><div className="text-xl mb-1">{ic}</div><div className="text-[11px] font-bold">{t}</div><div className="text-[9px] text-zinc-600">{d2}</div></div>
              ))}
            </div>
            <p className="text-[10px] text-zinc-600 mt-2">Mỗi khâu đã có hàng đợi <code className="text-cyan-300">ai_jobs</code> trong DB — cắm key là chạy, human-in-the-loop trước khi đăng.</p>
          </Card>
        </div>
      )}
    </div>
  )
}

/* ========================== ✅ REVIEW HUB ========================== */
type PendingNode = AnyNode & { org_id?: string }
export function ReviewHub({ orgId, me, onOpen, onChanged }: { orgId: string | null; me: string; onOpen: (id: string) => void; onChanged: () => void }) {
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
    const { error } = await supabase.from('nodes').update({ status: 'published', md: draftMd, props: np }).eq('id', opened.id)
    setBusy(false)
    if (!error) { setOpenId(null); load(); onChanged() }
  }
  async function reject() {
    if (!opened) return
    const note = window.prompt('Lý do trả lại (tác giả sẽ thấy):'); if (note === null) return
    const np = { ...((opened.props ?? {}) as Record<string, unknown>), review_note: note || 'Cần chỉnh sửa thêm' }
    await supabase.from('nodes').update({ status: 'draft', md: draftMd, props: np }).eq('id', opened.id)
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
                      <button onClick={() => { setOpenId(n.id); setDraftMd(n.md ?? '') }} className="text-xs rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 text-black px-3 py-1.5 font-bold">👁 Xem & duyệt</button>
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
            <button onClick={approve} disabled={busy} className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-3 text-sm font-bold disabled:opacity-50">✅ Đã đọc lại — Duyệt & xuất bản</button>
            <button onClick={reject} className="w-full rounded-xl bg-white/5 border border-white/10 py-2.5 text-sm text-zinc-400 hover:text-red-300 hover:border-red-400/40">↩ Trả lại kèm lý do</button>
            <button onClick={() => { onOpen(opened.id) }} className="w-full text-[11px] text-zinc-500 hover:text-white py-1">mở bằng editor đầy đủ →</button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ========================== 👥 MEMBERS HUB ========================== */
type Member = { user_id: string; email: string; full_name: string | null; level: number; can_edit: boolean; can_approve: boolean }
const LEVEL_NAME: Record<number, string> = { 5: '👑 Admin', 4: '✅ Tổng biên tập', 3: '✏️ Biên tập viên', 2: '🤝 Cộng tác viên', 1: '🌱 Thành viên' }
export function MembersHub({ me, orgId, canAdmin, onOpenPage }: { me: string; orgId?: string | null; canAdmin: boolean; onOpenPage: (id: string) => void }) {
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
              <button onClick={async () => {
                const assignee = na.assignee || focus; if (!assignee || !na.title.trim()) return
                // P0 fix: org_id NOT NULL — thiếu là insert fail im lặng; giờ báo lỗi rõ
                const { error } = await supabase.from('assignments').insert({ org_id: orgId, assignee, assigner: me, title: na.title.trim(), note: na.note || null, due: na.due || null, status: 'open' })
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
                      {a.status === 'submitted' && canAdmin && <button onClick={async () => { await supabase.from('assignments').update({ status: 'done' }).eq('id', a.id); await supabase.from('events').insert({ user_id: a.assignee, type: 'content' }); load() }} className="text-[10px] rounded bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 px-1.5 py-0.5 shrink-0">Nghiệm thu</button>}
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
