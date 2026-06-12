'use client'
import { useEffect, useState, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import dynamic from 'next/dynamic'
import type { PartialBlock } from '@blocknote/core'
import Galaxy, { type GNode, type GLink } from './Galaxy'
import Digest from './Digest'
import { Profile, Today, Board, Studio, LifeChaptersWizard } from './Pages'
import { KolFeed, ContentEngine, ReviewHub, MembersHub } from './Hubs'
import Warp from './Warp'
import { IVault, IHome, IPen, IBoard, ICheck, IUsers, IUser, ISearch, IPlus, IDots, IChevron, ILogout, IDoc, IOrbit, IUpload, ICode, ITarget, IRefresh, IMegaphone, IGrad, IX, IExpand, IEye, IEyeOff } from './Icons'
import { DIMS, PropsPanel, PageFooter, Dim8Bars } from './PageFrame'
import { dimSignals, transformScore } from '@/lib/transformScore'

const Editor = dynamic(() => import('./Editor'), { ssr: false })
const Database = dynamic(() => import('./Database'), { ssr: false })

type Depth = { connections: number; meaning: number; evidence: number; experience: number; action: number; learned: boolean }

type Node = { id: string; title: string | null; kind: string; parent_id: string | null }
type TNode = Node & { layer: string; icon: string | null; owner_id: string | null; position?: number | null; status?: string; subtype?: string | null; created_at?: string; event_date?: string | null; emotion?: string | null; props?: Record<string, unknown> | null }

const LAYERS: { key: string; label: string; color: string }[] = [
  { key: 'personal', label: '🧠 Kho của bạn', color: 'text-white' },
  { key: 'corporate', label: '🌐 Kho tập đoàn', color: 'text-cyan-300' },
  { key: 'humanity', label: '♾️ Kho nhân loại', color: 'text-violet-300' },
]
const COVERS = ['linear-gradient(135deg,#8b5cf6,#22d3ee)', 'linear-gradient(135deg,#f5b942,#fbbf24)', 'linear-gradient(135deg,#34d399,#22d3ee)', 'linear-gradient(135deg,#1e1b4b,#0e7490)', 'linear-gradient(135deg,#7c2d12,#b45309)', '']
const ICONS = ['📄', '📝', '📁', '🗂️', '💡', '🎯', '🔥', '🌱', '⚡', '🧠', '❤️', '📚', '🚀', '✨', '🏆', '📊']
// search thông minh: bỏ dấu + xếp hạng — prefix mạnh nhất, rồi đầu từ, chứa chuỗi, cuối cùng khớp tóm tắt/từ khoá
const vnorm = (x: string) => (x ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
function searchRank(q: string, n: { title: string | null; props?: Record<string, unknown> | null }): number {
  const t = vnorm(n.title ?? ''), qq = vnorm(q)
  if (!qq) return 0
  if (t.startsWith(qq)) return 100
  if (t.split(/\s+/).some(w => w.startsWith(qq))) return 80
  if (t.includes(qq)) return 60
  const extra = vnorm(`${(n.props?.summary as string) ?? ''} ${(n.props?.keywords as string) ?? ''}`)
  if (extra.includes(qq)) return 35
  // mọi từ của query đều xuất hiện đâu đó (semantic-lite)
  const words = qq.split(/\s+/).filter(w => w.length >= 2)
  if (words.length > 1 && words.every(w => t.includes(w) || extra.includes(w))) return 25
  return 0
}
function kindIcon(k: string) { return k === 'kho' ? '📦' : k === 'folder' ? '📁' : k === 'database' ? '🗂️' : '📄' }
// PAGE_TYPES / OUTPUT_FORMATS / DIMS / khung properties + footer chuẩn → PageFrame.tsx

// template chuẩn hoá: biến raw thành trang đúng cấu trúc kho
const PAGE_TEMPLATES: { icon: string; name: string; desc: string; md: string }[] = [
  { icon: '🎓', name: 'Bài học', desc: 'Khái niệm → ví dụ → áp dụng', md: '# Bài học mới\n\n## 💡 Ý chính\n- \n\n## 📖 Diễn giải\n\n\n## 🌍 Ví dụ thực tế\n- \n\n## 🎯 Tôi sẽ áp dụng\n- [ ] \n\n## 🔗 Liên quan tới\nGõ @ để nối tới bài khác…' },
  { icon: '🌱', name: 'Trải nghiệm', desc: 'Chuyện thật → cảm xúc → bài học', md: '# Trải nghiệm: \n\n## 📍 Bối cảnh\nKhi nào, ở đâu, với ai…\n\n## ⚡ Chuyện gì xảy ra\n\n\n## ❤️ Mình cảm thấy\n\n\n## 🎓 Bài học rút ra\n- \n\n## ▶️ Lần sau sẽ làm khác\n- ' },
  { icon: '🤝', name: 'Hồ sơ khách hàng', desc: 'Nhu cầu → trạng thái → bước tiếp', md: '# Khách: \n\n## 👤 Thông tin\n- Quan tâm: \n- Tính cách: \n\n## 💬 Lịch sử tương tác\n- \n\n## 🚦 Trạng thái\nMới / Đang tư vấn / Đã mua / Giới thiệu\n\n## ▶️ Bước tiếp theo\n- [ ] ' },
  { icon: '📕', name: 'Tóm tắt sách', desc: 'Ý chính từng chương + quote', md: '# Sách: \n\n## 🧭 Một câu tóm tắt\n\n\n## 💡 3 ý đắt nhất\n1. \n2. \n3. \n\n## 📌 Quote đáng nhớ\n> \n\n## 🎯 Áp dụng vào việc của mình\n- [ ] ' },
]

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setReady(true) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null))
    return () => sub.subscription.unsubscribe()
  }, [])

  // Bỏ qua lỗi do extension trình duyệt (vd ví Talisman) ném ra — không phải lỗi app
  useEffect(() => {
    const isExt = (s: string) => s.includes('chrome-extension://') || s.includes('Talisman') || s.includes('moz-extension://')
    const h = (e: PromiseRejectionEvent) => {
      const s = String((e.reason && (e.reason.stack || e.reason.message)) || e.reason || '')
      if (isExt(s)) { e.preventDefault(); e.stopImmediatePropagation() }
    }
    const he = (e: ErrorEvent) => {
      const s = `${e.filename ?? ''} ${e.message ?? ''} ${String((e.error && e.error.stack) || '')}`
      if (isExt(s)) { e.preventDefault(); e.stopImmediatePropagation() }
    }
    window.addEventListener('unhandledrejection', h, true)
    window.addEventListener('error', he, true)
    return () => { window.removeEventListener('unhandledrejection', h, true); window.removeEventListener('error', he, true) }
  }, [])

  if (!ready) return <Shell><p className="text-zinc-400">Đang tải…</p></Shell>
  return user ? <Workspace user={user} /> : <Login />
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#07070d] text-zinc-100 flex items-center justify-center p-6 overflow-hidden">
      <div className="dq-stars" aria-hidden />
      <div className="dq-orb dq-orb-a" aria-hidden />
      <div className="dq-orb dq-orb-b" aria-hidden />
      <div className="relative w-full max-w-5xl">{children}</div>
    </div>
  )
}

function viError(m: string): string {
  const s = m.toLowerCase()
  if (s.includes('after') && s.includes('second')) return '⏳ Supabase đang giới hạn gửi mail xác nhận. Hãy tắt "Confirm email" trong dashboard (xem hướng dẫn) rồi đăng ký lại — sẽ vào ngay.'
  if (s.includes('already registered') || s.includes('already been registered')) return '📧 Email này đã đăng ký rồi — bấm "Đăng nhập".'
  if (s.includes('invalid login')) return '🔑 Sai email/mật khẩu, hoặc chưa có tài khoản — bấm "Đăng ký".'
  if (s.includes('not confirmed')) return '✉️ Email chưa xác nhận. Tắt "Confirm email" trong dashboard, hoặc mở mail bấm xác nhận.'
  if (s.includes('password')) return '🔒 Mật khẩu cần tối thiểu 6 ký tự.'
  return '⚠️ ' + m
}

function AkashMark({ size = 48 }: { size?: number }) {
  return (
    <div className="dq-mark relative grid place-items-center rounded-2xl bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-400 shadow-lg shadow-violet-500/40" style={{ width: size, height: size }}>
      <span className="font-black text-white" style={{ fontSize: size * 0.52, lineHeight: 1 }}>A</span>
      <span className="absolute inset-0 rounded-2xl ring-1 ring-white/30" />
    </div>
  )
}

function Login() {
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [msg, setMsg] = useState('')
  const [ok, setOk] = useState(false)
  const [busy, setBusy] = useState(false)

  async function go() {
    if (!email.trim() || pw.length < 6) { setOk(false); setMsg('Nhập email và mật khẩu (≥ 6 ký tự).'); return }
    setBusy(true); setMsg('')
    const e = email.trim()
    if (mode === 'up') {
      const up = await supabase.auth.signUp({ email: e, password: pw })
      if (up.error) { setOk(false); setMsg(viError(up.error.message)); setBusy(false); return }
      if (!up.data.session) {
        // auto-confirm bật → đăng nhập ngay
        const inn = await supabase.auth.signInWithPassword({ email: e, password: pw })
        if (inn.error) setMsg(viError(inn.error.message))
      }
    } else {
      const inn = await supabase.auth.signInWithPassword({ email: e, password: pw })
      if (inn.error) { setOk(false); setMsg(viError(inn.error.message)) }
    }
    // có session → onAuthStateChange tự chuyển vào app
    setBusy(false)
  }

  return (
    <div className="dq-dark relative min-h-screen bg-[#06060c] text-zinc-100 overflow-hidden">
      {/* WARP FIELD — bay xuyên vũ trụ; xác thực = nhảy hyperspace */}
      <Warp speed={busy ? 16 : 1.8} />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-5xl grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
          {/* BRAND HERO */}
          <div className="hidden lg:block">
            <div className="flex items-center gap-4 mb-6">
              <AkashMark size={64} />
              <div>
                <div className="text-5xl font-black tracking-tight ak-logo-grad">Akash</div>
                <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-500 mt-1">Akashic knowledge engine</div>
              </div>
            </div>
            <h1 className="text-2xl font-bold leading-snug mb-6 text-zinc-100">Biến trải nghiệm thành <span className="text-zinc-50">trí tuệ</span>,<br />biến trí tuệ thành <span className="bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">content</span>.</h1>
            <div className="space-y-3">
              {([
                [<IOrbit key="o" size={20} />, 'Galaxy tri thức đa chiều', '3 kho · liên kết 8 chiều · zoom như bản đồ sao'],
                [<ITarget key="t" size={20} />, 'Độ Chuyển hoá 8 chiều', 'mỗi liên kết thật thắp sáng một chiều — không học vẹt được'],
                [<IMegaphone key="m" size={20} />, 'Học thật → dạy được', 'Bài chín tự động thành nguyên liệu content của bạn'],
              ] as [React.ReactNode, string, string][]).map(([ic, t, d]) => (
                <div key={t} className="flex items-center gap-3.5 rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 backdrop-blur-md">
                  <span className="w-9 h-9 grid place-items-center rounded-xl bg-white/10 border border-white/15 text-cyan-200 shrink-0">{ic}</span>
                  <div>
                    <div className="text-sm font-semibold text-zinc-100">{t}</div>
                    <div className="text-xs text-zinc-500">{d}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-zinc-600 mt-6 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Supabase · RLS bảo mật từng dòng · dữ liệu của bạn là của bạn</p>
          </div>

          {/* FORM CARD */}
          <div className="mx-auto w-full max-w-md">
            <div className="rounded-3xl p-[1.5px] bg-gradient-to-br from-violet-500/60 via-white/10 to-cyan-500/60 shadow-2xl shadow-violet-500/15">
              <div className="rounded-3xl bg-[#0b0b14]/90 backdrop-blur-xl p-8">
                <div className="lg:hidden flex items-center gap-3 mb-5">
                  <AkashMark size={44} />
                  <div className="text-2xl font-black ak-logo-grad">Akash</div>
                </div>
                {/* tab chuyển chế độ */}
                <div className="grid grid-cols-2 gap-1 rounded-2xl bg-white/5 border border-white/10 p-1 mb-6 text-sm">
                  <button onClick={() => { setMode('in'); setMsg('') }} className={`rounded-xl py-2 font-semibold transition ${mode === 'in' ? 'ak-cta text-white' : 'text-zinc-400 hover:text-zinc-200'}`}>Đăng nhập</button>
                  <button onClick={() => { setMode('up'); setMsg('') }} className={`rounded-xl py-2 font-semibold transition ${mode === 'up' ? 'ak-cta text-white' : 'text-zinc-400 hover:text-zinc-200'}`}>Tạo tài khoản</button>
                </div>
                <h2 className="text-lg font-bold mb-1">{mode === 'in' ? 'Sẵn sàng cất cánh' : 'Bắt đầu hành trình'}</h2>
                <p className="text-xs text-zinc-500 mb-5">{mode === 'in' ? 'Đăng nhập để bay vào vũ trụ tri thức của bạn.' : 'Tạo tài khoản — vào org chung với vai Thành viên, có ngay kho cá nhân riêng tư.'}</p>

                <label className="block text-[11px] uppercase tracking-wider text-zinc-500 mb-1.5">Email</label>
                <input className="w-full mb-4 rounded-xl bg-white/5 border border-white/10 px-3.5 py-3 text-sm outline-none focus:border-violet-400/70 focus:bg-white/[0.07] transition" placeholder="ban@email.com" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
                <label className="block text-[11px] uppercase tracking-wider text-zinc-500 mb-1.5">Mật khẩu</label>
                <div className="relative mb-5">
                  <input className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-3 pr-11 text-sm outline-none focus:border-violet-400/70 focus:bg-white/[0.07] transition" placeholder="Tối thiểu 6 ký tự" type={showPw ? 'text' : 'password'} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && go()} />
                  <button onClick={() => setShowPw(s => !s)} title={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/10">{showPw ? <IEyeOff size={16} /> : <IEye size={16} />}</button>
                </div>
                <button disabled={busy} onClick={go} className="w-full rounded-xl py-3 text-sm font-bold ak-cta disabled:opacity-70 hover:opacity-95 transition flex items-center justify-center gap-2">
                  {busy ? <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Đang nhảy hyperspace…</> : mode === 'in' ? '⌁ Khởi động warp drive' : '⌁ Tạo tài khoản & cất cánh'}
                </button>
                {msg && <p className={`text-xs mt-3 leading-relaxed ${ok ? 'text-emerald-400' : 'text-amber-300'}`}>{msg}</p>}
                <p className="text-[11px] text-zinc-600 mt-5 text-center">Nhấn <kbd className="px-1.5 py-0.5 rounded border border-white/15 bg-white/5 text-zinc-400">↵ Enter</kbd> để gửi · Bảo mật bởi Supabase Auth</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


function Workspace({ user }: { user: User }) {
  const [orgId, setOrgId] = useState<string | null>(null)
  const [err, setErr] = useState('')
  const [editing, setEditing] = useState<Node | null>(null)
  const [mdText, setMd] = useState('')
  const [editJson, setEditJson] = useState<PartialBlock[] | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [savedMsg, setSavedMsg] = useState('')
  const [page, setPage] = useState<'know' | 'today' | 'studio' | 'engine' | 'board' | 'review' | 'users' | 'profile' | 'kol'>('today')
  const [view, setView] = useState<'folder' | 'galaxy'>('folder')
  const [allNodes, setAllNodes] = useState<GNode[]>([])
  const [links, setLinks] = useState<GLink[]>([])
  const [depth, setDepth] = useState<Depth | null>(null)
  const [showDigest, setShowDigest] = useState(false)
  const [tree, setTree] = useState<TNode[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [editIcon, setEditIcon] = useState<string>('')
  const [editCover, setEditCover] = useState<string>('')
  const [showIcons, setShowIcons] = useState(false)
  const [menuFor, setMenuFor] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameText, setRenameText] = useState('')
  const [dragId, setDragId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const [role, setRole] = useState<{ level: number; can_edit: boolean; can_approve: boolean } | null>(null)
  const [palette, setPalette] = useState(false)
  const [palQ, setPalQ] = useState('')
  const [palIdx, setPalIdx] = useState(0)
  const [mdView, setMdView] = useState(false)
  const [loadedId, setLoadedId] = useState<string | null>(null) // editor chỉ mount khi content đã fetch xong
  const [mdFresh, setMdFresh] = useState('')
  const [showRadar, setShowRadar] = useState(false)
  const [toast, setToast] = useState('')
  const [tplFor, setTplFor] = useState<{ parentId: string | null; layer: string } | null>(null)
  const [lifeWiz, setLifeWiz] = useState(false)
  const [capDeep, setCapDeep] = useState<{ text: string; emo: string; who: string; lesson: string } | null>(null)
  const [galaxyModeReq, setGalaxyModeReq] = useState<{ mode: string; t: number } | null>(null)
  const [mobileNav, setMobileNav] = useState(false)
  const [themeLight, setThemeLight] = useState(false)
  useEffect(() => { setThemeLight(typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light') }, [])
  const [ob, setOb] = useState(false)
  const [obStep, setObStep] = useState(0)
  const [backRaw, setBackRaw] = useState<{ from_node: string; dimension: string | null; excerpt?: string | null }[]>([])
  const [outRaw, setOutRaw] = useState<{ to_node: string; dimension: string | null; excerpt?: string | null }[]>([])
  const [comments, setComments] = useState<{ id: string; user_id: string; body: string; resolved: boolean; created_at: string }[]>([])
  const [cmt, setCmt] = useState('')
  const [pendingLink, setPendingLink] = useState<{ a: string; b: string } | null>(null) // chọn chiều khi nối từ galaxy
  const [proposeFor, setProposeFor] = useState<string | null>(null)
  const [prop3, setProp3] = useState({ reason: '', goal: '', note: '' })
  const [recent, setRecent] = useState<string[]>([])

  // Qi ledger: mỗi hành động giá trị = 1 event (điểm tính từ events, sẵn sàng token hoá)
  function logEvent(type: string, nodeId?: string, meta?: Record<string, unknown>) {
    // PILOT TRACKING: mọi hành vi then chốt đổ về events(meta) — admin đọc qua admin_event_stats
    const sid = (() => { try { let v = sessionStorage.getItem('ak-sid'); if (!v) { v = crypto.randomUUID().slice(0, 8); sessionStorage.setItem('ak-sid', v) } return v } catch { return 'na' } })()
    supabase.from('events').insert({ user_id: user.id, type, node_id: nodeId ?? null, meta: { ...(meta ?? {}), sid } }).then(() => {})
  }
  // hành vi điều hướng: màn nào được dùng, màn nào bị bỏ
  useEffect(() => { logEvent('nav', undefined, { page }) }, [page]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { logEvent('session_start', undefined, { w: typeof window !== 'undefined' ? window.innerWidth : 0 }) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (showDigest && editing) logEvent('digest_start', editing.id) }, [showDigest]) // eslint-disable-line react-hooks/exhaustive-deps
  function loadPageLinks(id: string) {
    supabase.from('links').select('from_node,dimension,excerpt').eq('to_node', id).then(({ data }) => setBackRaw(data ?? []))
    supabase.from('links').select('to_node,dimension,excerpt').eq('from_node', id).then(({ data }) => setOutRaw(data ?? []))
    supabase.from('page_comments').select('*').eq('node_id', id).order('created_at').then(({ data }) => setComments((data as typeof comments) ?? []))
  }

  useEffect(() => {
    try { setRecent(JSON.parse(localStorage.getItem('dq-recent') ?? '[]')) } catch { /* bỏ qua */ }
    try { if (!localStorage.getItem('dq-onboarded')) setOb(true) } catch { /* bỏ qua */ }
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette(p => !p); setPalQ(''); setPalIdx(0) }
      if (e.key === 'Escape') setPalette(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const loadTree = useCallback(async (org: string) => {
    const { data } = await supabase.from('nodes').select('id,title,kind,parent_id,layer,icon,owner_id,position,status,subtype,event_date,emotion,props,created_at').eq('org_id', org).neq('kind', 'block').order('position', { nullsFirst: true }).order('created_at')
    const t = (data as TNode[]) ?? []
    setTree(t)
    setExpanded(prev => { const n = new Set(prev); t.filter(x => x.kind === 'kho').forEach(k => n.add(k.id)); return n })
  }, [])
  function khoOf(layer: string) { return tree.find(n => n.layer === layer && n.kind === 'kho') }
  const [sortMode, setSortMode] = useState<'smart' | 'newest' | 'az'>('smart')
  function sortKids(list: TNode[]): TNode[] {
    const arr = [...list]
    if (sortMode === 'az') return arr.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? '', 'vi'))
    if (sortMode === 'newest') return arr.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
    // smart: trang có position (hub/cây sắp tay) giữ thứ tự — phần còn lại MỚI NHẤT trên đầu
    return arr.sort((a, b) => {
      const ap = a.position ?? null, bp = b.position ?? null
      if (ap !== null && bp !== null) return ap - bp
      if (ap !== null) return -1
      if (bp !== null) return 1
      return (b.created_at ?? '').localeCompare(a.created_at ?? '')
    })
  }
  function childrenOf(id: string) { return sortKids(tree.filter(n => n.parent_id === id)) }
  function layerOf(id: string) { return tree.find(n => n.id === id)?.layer ?? 'personal' }
  function nodeOf(id: string | null) { return id ? tree.find(n => n.id === id) ?? null : null }
  // quyền sửa: kho cá nhân luôn được; kho chung cần can_edit (Biên tập viên trở lên)
  function canEditLayer(layer: string) { return layer === 'personal' || !!role?.can_edit }
  function ancestors(id: string): TNode[] {
    const chain: TNode[] = []
    let cur = nodeOf(id)
    let guard = 0
    while (cur && guard++ < 30) { chain.unshift(cur); cur = nodeOf(cur.parent_id) }
    return chain
  }
  function toggleExp(id: string) { setExpanded(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n }) }
  function descendants(id: string): string[] {
    const ids: string[] = [id]
    for (const c of childrenOf(id)) ids.push(...descendants(c.id))
    return ids
  }
  async function deletePage(n: TNode) {
    if (!orgId) return
    setMenuFor(null)
    const ids = descendants(n.id)
    if (!confirm(`Xoá “${n.title || 'trang'}”${ids.length > 1 ? ` và ${ids.length - 1} trang con` : ''}? Không thể hoàn tác.`)) return
    const { error } = await supabase.from('nodes').delete().in('id', ids)
    if (error) return setErr(error.message)
    if (editing && ids.includes(editing.id)) setEditing(null)
    loadTree(orgId); loadGraph(orgId)
  }
  function nextPos(parentId: string | null) {
    const sibs = tree.filter(n => n.parent_id === parentId)
    return sibs.reduce((m, s) => Math.max(m, s.position ?? 0), 0) + 10
  }
  // P0 fix (audit 12/6): user mới chưa có cây gốc → tự tạo hub trước khi nạp, KHÔNG rơi về gốc kho
  // hoàn tất nạp trải nghiệm sau bước đào sâu — emotion vào CỘT, người/bài học vào đúng mục md
  async function finishCapture(text: string, emo: string, who: string, lesson: string) {
    setCapDeep(null)
    const parent = await ensureHub('journey', 'Hành trình của tôi', '📓')
    const nowD = new Date()
    const today = new Date(Date.now() - nowD.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
    const id = crypto.randomUUID()
    const { error } = await supabase.from('nodes').insert({
      id, org_id: orgId, owner_id: user.id, layer: 'personal', kind: 'note', parent_id: parent,
      title: `Nhật ký ${nowD.toLocaleDateString('vi')} · ${nowD.getHours()}h${String(nowD.getMinutes()).padStart(2, '0')}`,
      event_date: today, emotion: emo || null, status: 'published', min_level: 1,
      props: { page_type: 'trai-nghiem', via: 'capture', ...(lesson.trim() ? { principle: lesson.trim() } : {}) },
      md: `**Loại:** 🌱 Trải nghiệm · **Ngày sự kiện:** ${nowD.toLocaleDateString('vi')}\n\n**Tóm tắt 1 câu:** ${lesson.trim() || text.slice(0, 120)}\n\n**Nguồn:** tự trải nghiệm\n\n## ⚡ Chuyện gì xảy ra\n${text}\n\n## ❤️ Cảm xúc\n${emo || '—'}\n\n## 💚 Ai liên quan\n${who.trim() || '—'}\n\n## 🎓 Bài học rút ra\n- ${lesson.trim() || ''}\n\n**Cảnh này nói gì về tôi:** `,
    })
    if (error) { setErr(error.message); return }
    logEvent('capture_deep', id, { emo: !!emo, who: !!who.trim(), lesson: !!lesson.trim() })
    if (orgId) { await loadTree(orgId); loadGraph(orgId) }
    openNoteEditor({ id, title: 'Nhật ký', kind: 'note', parent_id: parent }); setPage('know')
  }
  async function ensureHub(hub: string, title: string, icon: string): Promise<string | null> {
    const ex = tree.find(n => n.owner_id === user.id && (n.props?.hub as string) === hub)
    if (ex) return ex.id
    const kho = khoOf('personal')
    if (!orgId || !kho) return kho?.id ?? null
    const id = crypto.randomUUID()
    const { error } = await supabase.from('nodes').insert({ id, org_id: orgId, owner_id: user.id, layer: 'personal', kind: 'page', parent_id: kho.id, title, icon, subtype: 'hub', status: 'published', min_level: 1, props: { hub } })
    if (error) return kho.id
    await loadTree(orgId)
    return id
  }
  async function createPage(parentId: string | null, layer: string, kind: string = 'page', extra?: { title?: string; md?: string; event_date?: string | null; props?: Record<string, unknown> }) {
    if (!orgId) return
    const id = crypto.randomUUID()
    const owner = layer === 'personal' ? user.id : null
    const title = extra?.title ?? (kind === 'database' ? 'Bảng dữ liệu' : 'Trang mới')
    // kho chung: chưa đủ quyền duyệt (cấp <4) → bài vào hàng chờ duyệt
    const status = layer !== 'personal' && (role?.level ?? 1) < 4 ? 'pending' : 'published'
    const { error } = await supabase.from('nodes').insert({ id, org_id: orgId, owner_id: owner, layer, kind, parent_id: parentId, title, md: extra?.md ?? null, event_date: extra?.event_date ?? null, props: extra?.props ?? null, status, min_level: 1, position: nextPos(parentId) })
    if (error) return setErr(error.message)
    if (parentId) setExpanded(s => new Set(s).add(parentId))
    if (status === 'pending') { setToast('📨 Đã gửi chờ duyệt — ban biên tập sẽ xem'); setTimeout(() => setToast(''), 3500) }
    logEvent('create', id)
    await loadTree(orgId); if (orgId) loadGraph(orgId)
    openNoteEditor({ id, title, kind, parent_id: parentId })
  }
  // chuyển bài đã chín thành thẻ trên Board content
  async function toContent() {
    if (!editing) return
    const { data } = await supabase.from('nodes').select('props').eq('id', editing.id).single()
    const props = { ...((data?.props as Record<string, unknown>) ?? {}), board: 'idea' }
    const { error } = await supabase.from('nodes').update({ props }).eq('id', editing.id)
    if (error) { setErr('Không đưa được vào Board: ' + error.message); return }
    logEvent('content', editing.id)
    setToast('📣 Đã đưa vào Board content (cột Ý tưởng)')
    setTimeout(() => setToast(''), 3000)
  }
  // properties chuẩn đầu trang
  async function setNodeProp(key: string, val: unknown) {
    if (!editing) return
    const { data } = await supabase.from('nodes').select('props').eq('id', editing.id).single()
    const props = { ...((data?.props as Record<string, unknown>) ?? {}), [key]: val }
    const { error } = await supabase.from('nodes').update({ props }).eq('id', editing.id)
    if (error) { setErr(error.message); return }
    if (orgId) loadTree(orgId)
  }
  async function saveEventDate(d: string) {
    if (!editing) return
    const { error } = await supabase.from('nodes').update({ event_date: d || null }).eq('id', editing.id)
    if (error) { setErr(error.message); return }
    if (orgId) loadTree(orgId)
  }
  // lưu trang hiện tại thành template tái dùng (sửa được trong trang 🧩 Template)
  // bật/tắt xem markdown (lấy bản md mới nhất từ DB)
  async function toggleMd() {
    if (!mdView && editing) {
      const { data } = await supabase.from('nodes').select('md').eq('id', editing.id).single()
      setMdFresh((data?.md as string) ?? '')
    }
    setMdView(v => !v)
  }
  // nhập file .md → trang mới trong kho cá nhân
  async function importMd(file: File) {
    const text = await file.text()
    const kho = khoOf('personal')
    const title = (text.match(/^#\s+(.+)$/m)?.[1] ?? file.name.replace(/\.(md|markdown|txt)$/i, '')).trim()
    await createPage(kho ? kho.id : null, 'personal', 'page', { title, md: text })
    setToast('⬆ Đã nhập "' + title + '" — markdown đã thành trang đẹp')
    setTimeout(() => setToast(''), 3500)
  }
  async function renameNode(id: string, title: string) {
    setRenameId(null)
    const cur = nodeOf(id)
    if (!cur || (cur.title ?? '') === title) return
    await supabase.from('nodes').update({ title }).eq('id', id)
    if (editing?.id === id) { setEditing({ ...editing, title }); setEditTitle(title) }
    if (orgId) { loadTree(orgId); loadGraph(orgId) }
  }
  async function duplicatePage(n: TNode) {
    if (!orgId) return
    setMenuFor(null)
    // sao chép node + toàn bộ trang con, giữ cấu trúc
    const idMap = new Map<string, string>()
    const subtree = descendants(n.id)
    const { data: rows } = await supabase.from('nodes').select('*').in('id', subtree)
    if (!rows) return
    subtree.forEach(id => idMap.set(id, crypto.randomUUID()))
    const inserts = rows.map(r => ({
      ...r,
      id: idMap.get(r.id),
      parent_id: r.id === n.id ? n.parent_id : (idMap.get(r.parent_id) ?? r.parent_id),
      title: r.id === n.id ? `${r.title ?? 'Trang'} (bản sao)` : r.title,
      position: r.id === n.id ? nextPos(n.parent_id) : r.position,
      created_at: undefined, updated_at: undefined,
    }))
    const { error } = await supabase.from('nodes').insert(inserts)
    if (error) return setErr(error.message)
    if (orgId) { loadTree(orgId); loadGraph(orgId) }
  }
  async function moveNode(dragNodeId: string, targetId: string, mode: 'into' | 'before' | 'after') {
    if (dragNodeId === targetId || !orgId) return
    const drag = nodeOf(dragNodeId); const target = nodeOf(targetId)
    if (!drag || !target) return
    if (descendants(dragNodeId).includes(targetId)) return // không thả vào chính con mình
    setDragId(null); setDropTarget(null)
    let newParent: string | null; let newPos: number
    if (mode === 'into') {
      newParent = targetId; newPos = nextPos(targetId)
      setExpanded(s => new Set(s).add(targetId))
    } else {
      newParent = target.parent_id
      const sibs = tree.filter(n => n.parent_id === newParent && n.id !== dragNodeId).sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      const idx = sibs.findIndex(s => s.id === targetId)
      const at = mode === 'after' ? idx + 1 : idx
      const prev = sibs[at - 1]?.position ?? 0
      const next = sibs[at]?.position ?? prev + 20
      newPos = (prev + next) / 2
    }
    const patch: { parent_id: string | null; position: number; layer?: string } = { parent_id: newParent, position: newPos }
    const newLayer = newParent ? layerOf(newParent) : drag.layer
    if (newLayer !== drag.layer) patch.layer = newLayer
    await supabase.from('nodes').update(patch).eq('id', dragNodeId)
    // kéo sang KHO KHÁC: toàn bộ trang con đổi layer theo (audit P1 — trước đây con giữ layer cũ, sai quyền/sai view)
    if (patch.layer) {
      const kids2 = descendants(dragNodeId)
      if (kids2.length) await supabase.from('nodes').update({ layer: patch.layer }).in('id', kids2)
    }
    if (orgId) { loadTree(orgId); loadGraph(orgId) }
  }

  const loadDepth = useCallback(async (folderId: string) => {
    const { data } = await supabase.from('wisdom_depth').select('connections,meaning,evidence,experience,action,learned').eq('node_id', folderId).eq('user_id', user.id).maybeSingle()
    setDepth((data as Depth) ?? null)
  }, [user.id])
  const loadGraph = useCallback(async (org: string) => {
    const [{ data: ns }, { data: ls }] = await Promise.all([
      supabase.from('nodes').select('id,title,kind,parent_id,layer,event_date,subtype').eq('org_id', org).neq('kind', 'block').order('created_at'),
      supabase.from('links').select('from_node,to_node,dimension').eq('org_id', org),
    ])
    setAllNodes((ns as GNode[]) ?? []); setLinks((ls as GLink[]) ?? [])
  }, [])

  async function openNoteEditor(n: Node, stay = false) {
    if (!stay) setView('folder')
    setMenuFor(null); setPalette(false); setMdView(false); setShowRadar(false); setLoadedId(null)
    setEditing(n); setSavedMsg(''); setMd(''); setEditJson(null); setEditTitle(n.title ?? ''); setShowIcons(false)
    setEditIcon(''); setEditCover(''); setBackRaw([]); setOutRaw([])
    // lưu lịch sử mở trang (cho ⌘K + Today)
    setRecent(prev => {
      const next = [n.id, ...prev.filter(i => i !== n.id)].slice(0, 10)
      try { localStorage.setItem('dq-recent', JSON.stringify(next)) } catch { /* bỏ qua */ }
      return next
    })
    if (n.id) loadDepth(n.id)
    loadPageLinks(n.id)
    const { data } = await supabase.from('nodes').select('content,md,icon,cover').eq('id', n.id).single()
    setEditJson((data?.content as PartialBlock[] | null) ?? null)
    setMd((data?.md as string) ?? '')
    setEditIcon((data?.icon as string) ?? ''); setEditCover((data?.cover as string) ?? '')
    setLoadedId(n.id)
  }
  async function saveTitle() {
    if (!editing || editTitle === editing.title) return
    await supabase.from('nodes').update({ title: editTitle }).eq('id', editing.id)
    setEditing({ ...editing, title: editTitle })
    if (orgId) { loadTree(orgId); loadGraph(orgId) }
  }
  async function saveIcon(icon: string) {
    if (!editing) return
    setEditIcon(icon); setShowIcons(false)
    await supabase.from('nodes').update({ icon }).eq('id', editing.id)
    if (orgId) loadTree(orgId)
  }
  async function saveCover(cover: string) {
    if (!editing) return
    setEditCover(cover)
    await supabase.from('nodes').update({ cover }).eq('id', editing.id)
    if (orgId) loadTree(orgId)
  }
  function addChild() { if (editing) createPage(editing.id, layerOf(editing.id)) }

  useEffect(() => {
    let cancel = false
    ;(async () => {
      const { data, error } = await supabase.rpc('bootstrap_me')
      if (cancel) return
      if (error) { setErr(error.message); return }
      const row = Array.isArray(data) ? data[0] : data
      if (!row) return
      const org = row.org_id as string
      setOrgId(org); loadGraph(org); loadTree(org)
      supabase.rpc('my_membership').then(({ data }) => {
        const r = Array.isArray(data) ? data[0] : data
        if (r) setRole({ level: r.level, can_edit: r.can_edit, can_approve: r.can_approve })
      })
    })()
    return () => { cancel = true }
  }, [loadGraph, loadTree])

  async function seedQnet() {
    if (!orgId) return
    const { error } = await supabase.rpc('seed_qnet', { p_org: orgId })
    if (error) return setErr(error.message)
    loadTree(orgId); loadGraph(orgId)
  }

  const personalPages = tree.filter(n => n.owner_id === user.id && n.kind !== 'kho')
  function renderRow(n: TNode, depth: number) {
    const kids = childrenOf(n.id)
    const open = expanded.has(n.id)
    const active = editing?.id === n.id
    const renaming = renameId === n.id
    const editable = canEditLayer(n.layer)
    const isKho = n.kind === 'kho'
    const khoColor = LAYERS.find(l => l.key === n.layer)?.color ?? 'text-zinc-300'
    const dt = dropTarget?.startsWith(n.id + ':') ? dropTarget.split(':')[1] : null
    return (
      <div key={n.id}>
        <div
          draggable={!renaming && !isKho && editable}
          onDragStart={(e) => { setDragId(n.id); e.dataTransfer.effectAllowed = 'move' }}
          onDragEnd={() => { setDragId(null); setDropTarget(null) }}
          onDragOver={(e) => { if (!dragId || dragId === n.id || !editable) return; e.preventDefault(); const r = e.currentTarget.getBoundingClientRect(); const y = e.clientY - r.top; const mode = isKho || y >= r.height * 0.3 && y <= r.height * 0.7 ? 'into' : y < r.height * 0.3 ? 'before' : 'after'; setDropTarget(`${n.id}:${mode}`) }}
          onDragLeave={() => { if (dropTarget?.startsWith(n.id + ':')) setDropTarget(null) }}
          onDrop={(e) => { e.preventDefault(); if (dragId && dt) moveNode(dragId, n.id, dt as 'into' | 'before' | 'after') }}
          className={`group relative flex items-center rounded-md transition-colors ${active ? 'bg-white/10' : 'hover:bg-white/[0.06]'} ${dt === 'into' ? 'ring-1 ring-violet-400/70 bg-violet-500/10' : ''} ${dragId === n.id ? 'opacity-40' : ''}`}
          style={{ paddingLeft: 4 + depth * 14 }}
        >
          {dt === 'before' && <div className="absolute left-2 right-2 top-0 h-0.5 bg-violet-400 rounded" />}
          {dt === 'after' && <div className="absolute left-2 right-2 bottom-0 h-0.5 bg-violet-400 rounded" />}
          <button onClick={() => kids.length && toggleExp(n.id)} className={`w-4 h-7 grid place-items-center shrink-0 text-zinc-500 hover:text-white transition-transform ${open ? 'rotate-90' : ''} ${kids.length ? '' : 'opacity-0 pointer-events-none'}`}><IChevron size={11} /></button>
          {renaming ? (
            <input autoFocus value={renameText} onChange={e => setRenameText(e.target.value)} onBlur={() => renameNode(n.id, renameText.trim() || 'Trang mới')} onKeyDown={e => { if (e.key === 'Enter') renameNode(n.id, renameText.trim() || 'Trang mới'); if (e.key === 'Escape') setRenameId(null) }} className="flex-1 mr-1 my-0.5 rounded bg-white/10 border border-violet-400/50 px-1.5 py-1 text-sm outline-none" />
          ) : (
            <button onClick={() => openNoteEditor(n)} onDoubleClick={() => { if (editable) { setRenameId(n.id); setRenameText(n.title ?? '') } }} className="flex-1 text-left pr-1 py-1.5 text-sm truncate flex items-center gap-1.5 min-w-0">
              <span className="shrink-0 text-[15px] leading-none">{n.icon || kindIcon(n.kind)}</span>
              {isKho
                ? <span className={`truncate text-[11px] font-bold uppercase tracking-wider ${khoColor}`}>{n.title || 'Kho'}</span>
                : <span className={`truncate ${active ? 'text-white font-medium' : 'text-zinc-300'}`}>{n.title || 'Trang mới'}</span>}
              {!isKho && n.status === 'pending' && <span title="Chờ duyệt" className="shrink-0 text-[9px] rounded bg-amber-500/15 border border-amber-400/30 text-amber-300 px-1">⏳</span>}
              {!isKho && n.status === 'draft' && <span title="Bản nháp (bị trả lại)" className="shrink-0 text-[9px] rounded bg-zinc-500/15 border border-zinc-400/30 text-zinc-400 px-1">nháp</span>}
            </button>
          )}
          {!renaming && editable && <div className="flex items-center opacity-0 group-hover:opacity-100 shrink-0 pr-1">
            <button onClick={(e) => { e.stopPropagation(); setMenuFor(menuFor === n.id ? null : n.id) }} title="Tuỳ chọn" className="w-6 h-6 grid place-items-center rounded text-zinc-400 hover:bg-white/10 hover:text-white"><IDots size={14} /></button>
            <button onClick={(e) => { e.stopPropagation(); createPage(n.id, n.layer) }} title="Thêm trang con" className="w-6 h-6 grid place-items-center rounded text-zinc-400 hover:bg-white/10 hover:text-white"><IPlus size={13} /></button>
          </div>}
          {menuFor === n.id && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setMenuFor(null)} />
              <div className="absolute right-1 top-8 z-30 w-48 bg-[#1c1c26] border border-white/10 rounded-lg shadow-2xl py-1 text-sm">
                <button onClick={() => { setMenuFor(null); openNoteEditor(n) }} className="w-full text-left px-3 py-1.5 hover:bg-white/10">📂 Mở trang</button>
                <button onClick={() => { setMenuFor(null); setRenameId(n.id); setRenameText(n.title ?? '') }} className="w-full text-left px-3 py-1.5 hover:bg-white/10">✏️ Đổi tên</button>
                <button onClick={() => { setMenuFor(null); createPage(n.id, n.layer) }} className="w-full text-left px-3 py-1.5 hover:bg-white/10">＋ Thêm trang con</button>
                <button onClick={() => { setMenuFor(null); createPage(n.id, n.layer, 'database') }} className="w-full text-left px-3 py-1.5 hover:bg-white/10">🗂️ Thêm bảng dữ liệu</button>
                <button onClick={() => { setMenuFor(null); setTplFor({ parentId: n.id, layer: n.layer }) }} className="w-full text-left px-3 py-1.5 hover:bg-white/10">📑 Trang từ template</button>
                {n.kind !== 'kho' && <button onClick={() => duplicatePage(n)} className="w-full text-left px-3 py-1.5 hover:bg-white/10">📑 Sao chép trang</button>}
                {n.kind !== 'kho' && <button onClick={() => deletePage(n)} className="w-full text-left px-3 py-1.5 hover:bg-red-500/20 text-red-300">🗑 Xoá trang</button>}
              </div>
            </>
          )}
        </div>
        {open && kids.map(k => renderRow(k, depth + 1))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#07070d] text-zinc-100 flex">
      <nav className="w-16 border-r border-white/10 flex flex-col items-center py-4 gap-2 shrink-0">
        <div className="mb-3"><AkashMark size={36} /></div>
        {([
          ['today', <IHome key="i" size={19} />, 'Hôm nay'], ['know', <IVault key="i" size={19} />, 'Kho tri thức'], ['kol', <IMegaphone key="i" size={19} />, 'Người khổng lồ'], ['engine', <IPen key="i" size={19} />, 'Content Engine'], ['board', <IBoard key="i" size={19} />, 'Board'],
          ...(role?.can_approve ? [['review', <ICheck key="i" size={19} />, 'Trung tâm biên tập']] : []),
          ...(role?.can_approve ? [['users', <IUsers key="i" size={19} />, 'Nhân sự']] : []),
          ['profile', <IUser key="i" size={19} />, 'Hồ sơ'],
        ] as [typeof page, React.ReactNode, string][]).map(([p, ic, label]) => {
          const active = page === p
          return (
            <button key={p} onClick={() => setPage(p)} title={label}
              className={`group relative w-11 h-11 rounded-xl grid place-items-center transition ${active ? 'text-white bg-white/10 border border-white/15' : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5 border border-transparent'}`}>
              {ic}
              <span className={`absolute left-[-13px] w-[3px] rounded-full bg-[#8b5cf6] transition-all ${active ? 'h-6 opacity-100' : 'h-0 opacity-0'}`} />
              {p === 'review' && (() => { const c = tree.filter(n => n.status === 'pending').length; return c > 0 ? <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 grid place-items-center rounded-full bg-amber-500 text-[9px] font-bold text-black">{c}</span> : null })()}
            </button>
          )
        })}
      </nav>
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
      {page === 'know' ? (
        <>
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <span className="text-xl font-black tracking-tight ak-logo-grad">Akash</span>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 text-sm">
            <button onClick={() => setView('folder')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${view === 'folder' ? 'ak-cta text-white' : 'text-zinc-400 hover:text-zinc-200'}`}><IDoc size={15} /> Trang</button>
            <button onClick={() => setView('galaxy')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${view === 'galaxy' ? 'ak-cta text-white' : 'text-zinc-400 hover:text-zinc-200'}`}><IOrbit size={15} /> Galaxy</button>
          </div>
          <label title="Nhập file .md → trang đẹp trong kho cá nhân" className="cursor-pointer flex items-center gap-1.5 text-xs rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-zinc-300 hover:bg-white/10 hover:border-white/20 transition">
            <IUpload size={14} /> .md
            <input type="file" accept=".md,.markdown,.txt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) importMd(f); e.target.value = '' }} />
          </label>
          <button onClick={() => setPage('today')} title="Mở Nhập liệu (trong Hôm nay)" className="flex items-center gap-1.5 text-xs rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-zinc-300 hover:bg-white/10 hover:border-white/20 transition">📥 Raw</button>
        </div>
        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <button onClick={() => setMobileNav(v => !v)} title="Cây trang" className="md:hidden w-8 h-8 grid place-items-center rounded-lg bg-white/5 border border-white/10">☰</button>
          <button onClick={() => {
            const cur = document.documentElement.getAttribute('data-theme') === 'light' ? '' : 'light'
            if (cur) document.documentElement.setAttribute('data-theme', cur); else document.documentElement.removeAttribute('data-theme')
            try { localStorage.setItem('akash-theme', cur) } catch { /* */ }
            setThemeLight(cur === 'light')
          }} title="Đổi giao diện sáng/tối" className="w-8 h-8 grid place-items-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10">{themeLight ? '🌙' : '☀️'}</button>
          <span className="hidden sm:inline text-xs">{user.email}</span>
          <button onClick={() => supabase.auth.signOut()} title="Đăng xuất" className="flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs hover:bg-white/10 hover:text-white transition"><ILogout size={14} /> Thoát</button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 md:grid-cols-[260px_1fr] min-h-0">
        <aside className={`border-r border-white/10 flex-col overflow-hidden bg-[#0a0a12] ${mobileNav ? 'flex fixed inset-y-0 left-16 right-0 z-40 sm:right-auto sm:w-[280px] shadow-2xl' : 'hidden'} md:static md:flex`}>
          <div className="p-3 pb-2">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500"><ISearch size={14} /></span>
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm trang…" className="w-full rounded-lg bg-white/5 border border-white/10 pl-8 pr-12 py-1.5 text-sm outline-none focus:border-violet-400/50" />
              <button onClick={() => { setPalette(true); setPalQ(''); setPalIdx(0) }} title="Mở tìm nhanh (⌘K)" className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 border border-white/10 rounded px-1.5 py-0.5 hover:text-white hover:border-white/30">⌘K</button>
            </div>
            <div className="flex gap-1 mt-1.5">
              {([['smart', 'Thông minh', 'cây giữ thứ tự, note mới nhất trên đầu'], ['newest', 'Mới nhất', 'mọi thứ theo thời gian tạo'], ['az', 'A→Z', 'theo bảng chữ cái']] as const).map(([k, l, hint]) => (
                <button key={k} onClick={() => setSortMode(k)} title={hint} className={`text-[10px] rounded-md px-2 py-0.5 border transition ${sortMode === k ? 'bg-white/10 border-white/25 text-white' : 'border-transparent text-zinc-600 hover:text-zinc-300'}`}>{l}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-auto px-2 pb-4">
          {query.trim() ? (
            (() => {
              const hits = tree.map(n => ({ n, r: searchRank(query, n) })).filter(x => x.r > 0)
                .sort((a, b) => b.r - a.r || (a.n.title ?? '').localeCompare(b.n.title ?? '', 'vi')).slice(0, 30).map(x => x.n)
              return <div className="pt-1">
                {hits.map(n => (
                  <button key={n.id} onClick={() => openNoteEditor(n)} className={`w-full text-left rounded-md px-2 py-1.5 text-sm flex items-center gap-1.5 ${editing?.id === n.id ? 'bg-white/10' : 'hover:bg-white/[0.06]'}`}>
                    <span className="shrink-0 text-[15px]">{n.icon || kindIcon(n.kind)}</span><span className="truncate text-zinc-300">{n.title || 'Trang mới'}</span>
                  </button>
                ))}
                {hits.length === 0 && <p className="text-zinc-600 text-xs px-2 pt-2">Không tìm thấy “{query}”.</p>}
              </div>
            })()
          ) : LAYERS.map(L => {
            const kho = khoOf(L.key)
            const roots = tree.filter(n => n.layer === L.key && !n.parent_id && n.kind !== 'kho')
            const empty = tree.filter(n => n.layer === L.key).length === 0
            return (
              <div key={L.key} className="mb-3">
                {/* kho = một page thật: click mở, double-click đổi tên, hover hiện ⋯ ＋ */}
                {kho ? renderRow(kho, 0) : (
                  <div className="group flex items-center justify-between px-1 mb-0.5 mt-2">
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${L.color}`}>{L.label}</span>
                    <div className="flex items-center gap-1">
                      {L.key !== 'personal' && empty && role?.can_edit && <button onClick={seedQnet} className="text-[10px] rounded bg-cyan-500/20 border border-cyan-400/30 text-cyan-200 px-2 py-0.5 normal-case hover:bg-cyan-500/30">⬇ Seed</button>}
                      {canEditLayer(L.key) && <button onClick={() => createPage(null, L.key)} title="Tạo trang" className="w-5 h-5 grid place-items-center rounded text-zinc-400 hover:bg-white/10 hover:text-white opacity-0 group-hover:opacity-100">＋</button>}
                    </div>
                  </div>
                )}
                {!kho && roots.map(n => renderRow(n, 0))}
                {!kho && roots.length === 0 && <p className="text-zinc-600 text-xs px-2">Chưa có trang. Bấm ＋.</p>}
              </div>
            )
          })}
          </div>
        </aside>

        <section className={`relative overflow-hidden bg-[#0b0b14] ${view === 'galaxy' ? 'dq-dark dq-galaxy-shell' : ''}`}>
          {view === 'galaxy' ? (
            <>
              <Galaxy nodes={allNodes} links={links} modeReq={galaxyModeReq}
                onOpen={(n) => openNoteEditor({ id: n.id, title: n.title, kind: n.kind, parent_id: n.parent_id }, true)}
                onConnect={(a, b) => setPendingLink({ a, b })}
              />
              {/* PEEK PANEL — mở trang ngay trên galaxy, không bay về */}
              {editing && (
                <div className="absolute top-0 right-0 bottom-0 w-[440px] max-w-[92vw] bg-[#0d0d18]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-20 flex flex-col">
                  <div className="flex items-center justify-between gap-2 px-4 h-11 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg shrink-0">{editIcon || kindIcon(editing.kind)}</span>
                      <span className="text-sm font-semibold truncate">{editTitle || 'Trang'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => setView('folder')} title="Mở toàn trang" className="flex items-center gap-1 text-[11px] rounded-lg bg-white/10 border border-white/10 px-2.5 py-1 hover:bg-white/15"><IExpand size={12} /> Toàn trang</button>
                      <button onClick={() => setEditing(null)} title="Đóng" className="w-7 h-7 grid place-items-center rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white"><IX size={14} /></button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 shrink-0">
                    {depth?.learned
                      ? <>
                          <span className="flex items-center gap-1.5 text-xs rounded-lg bg-violet-500/15 border border-violet-400/30 text-violet-300 px-2 py-1 tabular-nums"><ITarget size={13} /> {(() => { const nd2 = nodeOf(editing.id); const t = transformScore(dimSignals({ out: outRaw, back: backRaw, event_date: nd2?.event_date, emotion: nd2?.emotion, props: nd2?.props })); return `${t.total} · ${t.covered}/8` })()}</span>
                          <button onClick={() => setShowDigest(true)} className="flex items-center gap-1.5 text-xs rounded-lg bg-white/10 border border-white/10 px-2.5 py-1 hover:bg-white/15"><IRefresh size={13} /> Ôn lại</button>
                        </>
                      : <button onClick={() => setShowDigest(true)} className="flex items-center gap-1.5 text-xs rounded-lg ak-cta px-3 py-1 font-semibold"><IGrad size={13} /> Chuyển hoá bài này</button>}
                    <span className="text-[10px] text-zinc-600 ml-auto">{backRaw.length} liên kết tới đây</span>
                  </div>
                  <div className="flex-1 overflow-auto px-4 py-3">
                    {editing.kind === 'database' ? (
                      <Database key={editing.id} node={{ id: editing.id, kind: editing.kind }} orgId={orgId} userId={user.id} layer={layerOf(editing.id)} onOpenPage={(id) => { const t = nodeOf(id); if (t) openNoteEditor(t, true) }} />
                    ) : loadedId === editing.id ? (
                      <Editor
                        key={editing.id}
                        noteId={editing.id}
                        orgId={orgId}
                        userId={user.id}
                        layer={layerOf(editing.id)}
                        editable={canEditLayer(layerOf(editing.id))}
                        initialJson={editJson}
                        initialMd={mdText}
                        pages={tree.map(n => ({ id: n.id, title: n.title ?? '', icon: n.icon, kind: n.kind, pt: (n.props?.page_type as string) ?? null }))}
                        onOpenPage={(id) => { const t = nodeOf(id); if (t) openNoteEditor(t, true) }}
                        onSaved={() => setSavedMsg('✓ Đã lưu ' + new Date().toLocaleTimeString())}
                        onLinked={() => { if (editing) loadPageLinks(editing.id); if (orgId) loadGraph(orgId); setToast('🕸️ Đã nối trang — cuộn xuống xem Mạng liên kết'); setTimeout(() => setToast(''), 2800) }}
                      />
                    ) : <p className="text-zinc-600 text-sm py-3">Đang tải nội dung…</p>}
                    {backRaw.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-white/10">
                        <div className="text-[10px] uppercase tracking-wide text-zinc-500 mb-2">🔗 Liên kết đến trang này</div>
                        <div className="flex flex-wrap gap-1.5">
                          {backRaw.map((b, i) => {
                            const src = nodeOf(b.from_node); if (!src) return null
                            const d = DIMS[b.dimension ?? ''] ?? { label: b.dimension ?? '', color: '#888' }
                            return (
                              <button key={i} onClick={() => openNoteEditor(src, true)} className="text-[11px] rounded-lg bg-white/5 border border-white/10 px-2 py-1 hover:border-violet-400/50 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: d.color }} />{src.icon || kindIcon(src.kind)} {src.title}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : !editing ? (
            <div className="p-10 overflow-auto h-full grid place-items-center text-center">
              <div className="max-w-md">
                <div className="text-6xl mb-4">📄</div>
                <h1 className="text-2xl font-bold mb-2">Mọi thứ là một <span className="text-zinc-50">trang</span></h1>
                <p className="text-zinc-400 text-sm leading-relaxed">Chọn một trang bên trái để mở &amp; viết, hoặc bấm <b>＋</b> để tạo trang mới. Trong trang, gõ <b>“/”</b> để chèn heading, list, bảng, code… và mở <b>trang con</b> bên trong.</p>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-auto">
              {/* breadcrumb */}
              <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 h-11 bg-[#0b0b14]/90 backdrop-blur border-b border-white/5">
                <div className="flex items-center gap-1 text-xs text-zinc-500 min-w-0 overflow-hidden">
                  {ancestors(editing.id).map((a, i, arr) => (
                    <span key={a.id} className="flex items-center gap-1 min-w-0">
                      {i > 0 && <span className="text-zinc-700">/</span>}
                      <button onClick={() => openNoteEditor(a)} className={`truncate hover:text-zinc-200 max-w-[160px] ${i === arr.length - 1 ? 'text-zinc-300' : ''}`}>{a.icon || kindIcon(a.kind)} {a.title || 'Trang'}</button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 shrink-0 relative">
                  <span className="text-[11px] text-zinc-600 hidden md:inline">{savedMsg}</span>
                  <button onClick={toggleMd} title="Xem dạng Markdown" className={`flex items-center gap-1 text-[11px] rounded-lg border px-2 py-1 ${mdView ? 'bg-violet-500/20 border-violet-400/40 text-violet-200' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'}`}><ICode size={13} /> MD</button>
                  {(() => {
                    // ĐỘ CHUYỂN HOÁ 8 CHIỀU — derive từ links thật của trang (RESEARCH-VIZ-ARCH mũi 2), khớp framework
                    const nd = nodeOf(editing.id)
                    const x8 = dimSignals({ out: outRaw, back: backRaw, event_date: nd?.event_date, emotion: nd?.emotion, props: nd?.props })
                    const t8 = transformScore(x8)
                    const weakest = Object.entries(DIMS).filter(([k]) => (x8[k as keyof typeof x8] ?? 0) === 0)[0]
                    return (depth?.learned || t8.learned) ? (
                      <>
                        <button onClick={() => setShowRadar(s => !s)} title={`Độ Chuyển hoá ${t8.total} · ${t8.covered}/8 chiều sáng`} className="flex items-center gap-1.5 text-xs rounded-lg bg-violet-500/15 border border-violet-400/30 text-violet-300 px-2.5 py-1 hover:bg-violet-500/25 tabular-nums"><ITarget size={13} /> {t8.total} · {t8.covered}/8</button>
                        <button onClick={() => setShowDigest(true)} className="flex items-center gap-1.5 text-xs rounded-lg bg-white/10 border border-white/10 px-2.5 py-1 hover:bg-white/15"><IRefresh size={13} /> Ôn lại</button>
                        {nd?.owner_id === user.id && layerOf(editing.id) === 'personal' && <button onClick={toContent} title="Bài đã chín → tạo content" className="flex items-center gap-1.5 text-xs rounded-lg bg-amber-400 text-black hover:bg-amber-300 px-2.5 py-1 font-semibold"><IMegaphone size={13} /> Content</button>}
                        {showRadar && (
                          <>
                            <div className="fixed inset-0 z-20" onClick={() => setShowRadar(false)} />
                            <div className="absolute right-0 top-9 z-30 rounded-2xl bg-[#1c1c26] border border-white/10 shadow-2xl p-4 w-[240px]">
                              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2 text-center">Độ Chuyển hoá — 8 chiều</div>
                              <Dim8Bars x={x8} height={42} />
                              <div className="text-center mt-2">
                                <span className="text-2xl font-black ak-grad-text tabular-nums">{t8.total}</span>
                                <span className="text-[10px] text-zinc-500 ml-1.5">{t8.tier} · {t8.covered}/8 chiều</span>
                              </div>
                              {weakest && <p className="text-[10px] text-zinc-500 mt-1.5 leading-snug"><span style={{ color: weakest[1].color }}>{weakest[1].icon} {weakest[1].label}</span> chưa sáng — {weakest[1].q}</p>}
                              <button onClick={() => { setShowRadar(false); setShowDigest(true) }} className="w-full mt-2 text-xs rounded-lg ak-cta px-3 py-1.5 font-semibold">Chuyển hoá lại — thắp chiều còn tối</button>
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <button onClick={() => setShowDigest(true)} className="flex items-center gap-1.5 text-xs rounded-lg ak-cta px-3 py-1 font-semibold"><IGrad size={13} /> Chuyển hoá{t8.covered > 0 ? ` · ${t8.covered}/8` : ''}</button>
                    )
                  })()}
                  <button onClick={() => setEditing(null)} title="Đóng trang" className="w-7 h-7 grid place-items-center rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white"><IX size={14} /></button>
                </div>
              </div>
              {/* cover */}
              <div className="group relative h-44 w-full" style={{ background: editCover || 'linear-gradient(135deg,#1e1b4b,#0e7490)' }}>
                {canEditLayer(layerOf(editing.id)) && <div className="absolute right-3 bottom-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
                  <span className="text-[11px] text-white/70 mr-1">Đổi nền:</span>
                  {COVERS.map((c, i) => <button key={i} onClick={() => saveCover(c)} className={`w-5 h-5 rounded-full border ${editCover === c ? 'border-white ring-2 ring-white/40' : 'border-white/40'}`} style={{ background: c || '#222' }} />)}
                </div>}
              </div>
              {/* page body */}
              <div className="max-w-3xl mx-auto px-12 pb-24">
                <div className="relative -mt-10 mb-1">
                  <div className="relative inline-block">
                    <button onClick={() => canEditLayer(layerOf(editing.id)) && setShowIcons(s => !s)} title="Đổi icon" className="text-[64px] leading-none w-20 h-20 grid place-items-center rounded-2xl hover:bg-white/5 transition">{editIcon || kindIcon(editing.kind)}</button>
                    {showIcons && (
                      <div className="absolute z-20 mt-1 grid grid-cols-8 gap-1 p-2 bg-[#1c1c26] border border-white/10 rounded-xl shadow-2xl w-[296px]">
                        {ICONS.map(ic => <button key={ic} onClick={() => saveIcon(ic)} className="text-xl w-8 h-8 grid place-items-center rounded hover:bg-white/10">{ic}</button>)}
                        <button onClick={() => saveIcon('')} className="col-span-8 text-xs text-zinc-400 py-1 hover:text-white">Xoá icon</button>
                      </div>
                    )}
                  </div>
                </div>
                <input value={editTitle} readOnly={!canEditLayer(layerOf(editing.id))} onChange={e => setEditTitle(e.target.value)} onBlur={saveTitle} onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} className="w-full text-4xl font-extrabold bg-transparent outline-none placeholder:text-zinc-700 mb-2" placeholder="Trang chưa có tiêu đề" />
                {/* ① PROPS PANEL — 📌 trường chuẩn ban biên tập (fix cứng) + ✏️ trường riêng user (PageFrame.tsx) */}
                {editing.kind !== 'kho' && (() => {
                  const node = nodeOf(editing.id)
                  if (!node) return null
                  const p = (node.props ?? {}) as Record<string, unknown>
                  const canE = canEditLayer(layerOf(editing.id))
                  return (
                    <PropsPanel node={node} canE={canE} isEditor={!!role?.can_edit} onSetProp={setNodeProp} onSaveDate={saveEventDate}>
                      {node?.status === 'pending' && <span className="rounded-lg bg-amber-500/15 border border-amber-400/30 text-amber-300 px-2 py-1">⏳ Chờ duyệt</span>}
                      {/* duyệt ngay trong trang (người có quyền) */}
                      {node?.status === 'pending' && role?.can_approve && (
                        <>
                          <button onClick={async () => {
                            const { data: cur } = await supabase.from('nodes').select('md,props').eq('id', editing.id).single()
                            const np = { ...((cur?.props as Record<string, unknown>) ?? {}), last_published_md: cur?.md ?? '', approved_at: new Date().toISOString() }
                            await supabase.from('nodes').update({ status: 'published', props: np }).eq('id', editing.id)
                            if (orgId) loadTree(orgId); setToast('✅ Đã duyệt & xuất bản'); setTimeout(() => setToast(''), 2500)
                          }} className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 font-semibold">✅ Duyệt</button>
                          <button onClick={async () => {
                            const note = window.prompt('Lý do trả lại (tác giả sẽ thấy):')
                            if (note === null) return
                            const { data: cur } = await supabase.from('nodes').select('props').eq('id', editing.id).single()
                            const np = { ...((cur?.props as Record<string, unknown>) ?? {}), review_note: note || 'Cần chỉnh sửa thêm' }
                            await supabase.from('nodes').update({ status: 'draft', props: np }).eq('id', editing.id)
                            if (orgId) loadTree(orgId); setToast('↩ Đã trả lại kèm góp ý'); setTimeout(() => setToast(''), 2500)
                          }} className="rounded-lg bg-white/5 border border-white/10 text-zinc-400 px-2.5 py-1 hover:text-red-300">↩ Trả lại</button>
                        </>
                      )}
                      {node?.status === 'draft' && <span className="rounded-lg bg-zinc-500/15 border border-zinc-400/30 text-zinc-400 px-2 py-1" title={(p.review_note as string) ?? ''}>📝 Nháp</span>}
                      {/* tác giả gửi duyệt lại sau khi sửa */}
                      {node?.status === 'draft' && node?.owner_id === user.id && (
                        <button onClick={async () => {
                          await supabase.from('nodes').update({ status: 'pending' }).eq('id', editing.id)
                          if (orgId) loadTree(orgId); setToast('📨 Đã gửi duyệt lại'); setTimeout(() => setToast(''), 2500)
                        }} className="rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-200 px-2.5 py-1 font-semibold">📨 Gửi duyệt lại</button>
                      )}
                      {/* đề xuất trang cá nhân lên Kho nhân loại */}
                      {node?.layer === 'personal' && node?.owner_id === user.id && !node?.subtype && node?.kind === 'page' && (
                        <button onClick={() => setProposeFor(editing.id)} title="Trả lời 3 câu → bản sao vào hàng chờ duyệt Kho nhân loại" className="rounded-lg bg-violet-500/15 border border-violet-400/30 text-violet-200 px-2.5 py-1 hover:bg-violet-500/25">♾️ Đề xuất lên nhân loại</button>
                      )}
                      {/* thành viên góp ý bài kho chung */}
                      {!canE && node?.layer !== 'personal' && (
                        <button onClick={async () => {
                          const fb = window.prompt('Góp ý cho bài này (chữ cần sửa, đề xuất…):')
                          if (!fb?.trim()) return
                          await supabase.from('open_questions').insert({ user_id: user.id, node_id: editing.id, question: fb.trim(), status: 'feedback' })
                          setToast('💬 Đã gửi góp ý cho ban biên tập'); setTimeout(() => setToast(''), 2500)
                        }} className="rounded-lg bg-white/5 border border-white/10 text-zinc-400 px-2.5 py-1 hover:text-cyan-200">💬 Góp ý sửa</button>
                      )}
                      {p.principle ? <span className="rounded-lg bg-cyan-500/10 border border-cyan-400/25 text-cyan-200 px-2 py-1 max-w-[260px] truncate" title={p.principle as string}>⚡ {p.principle as string}</span> : null}
                      {/* tính năng trang (đợt 9): tương tác hồ sơ · bản trước · dòng đời · copy */}
                      {(p.page_type as string) === 'ho-so' && canE && <button onClick={async () => {
                        const note = window.prompt('Tương tác mới với người này (1 dòng):'); if (!note?.trim()) return
                        const { data: cur } = await supabase.from('nodes').select('md').eq('id', editing.id).single()
                        const cm = (cur?.md as string) ?? ''
                        const line = `- ${new Date().toLocaleDateString('vi')}: ${note.trim()}`
                        const next = cm.includes('## 💬 Lịch sử tương tác') ? cm.replace('## 💬 Lịch sử tương tác', `## 💬 Lịch sử tương tác\n${line}`) : `${cm}\n\n## 💬 Lịch sử tương tác\n${line}`
                        await supabase.from('nodes').update({ md: next, content: null }).eq('id', editing.id)
                        const t2 = nodeOf(editing.id); if (t2) openNoteEditor(t2); setToast('💬 Đã ghi tương tác'); setTimeout(() => setToast(''), 2200)
                      }} className="rounded-lg bg-emerald-500/10 border border-emerald-400/25 text-emerald-200 px-2.5 py-1 hover:bg-emerald-500/20">➕ Ghi tương tác</button>}
                      {(p.last_published_md as string) && <button onClick={() => { const w = window.open('', '_blank', 'width=680,height=760'); if (w) { w.document.write(`<pre style="white-space:pre-wrap;font:13px/1.6 monospace;padding:24px;background:#0c0d10;color:#d0d6e0">${String(p.last_published_md).replace(/</g, '&lt;')}</pre>`); w.document.title = 'Bản đã duyệt trước — ' + editTitle } }} title="Xem bản md đã duyệt lần trước" className="rounded-lg bg-white/5 border border-white/10 text-zinc-400 px-2.5 py-1 hover:text-white">🕓 Bản trước</button>}
                      {node?.event_date && <button onClick={() => { setView('galaxy'); setGalaxyModeReq({ mode: 'timeline', t: Date.now() }); setToast('📜 Đang mở Dòng đời — trang của bạn nằm tại mốc ' + new Date(node.event_date!).toLocaleDateString('vi')); setTimeout(() => setToast(''), 3500) }} className="rounded-lg bg-blue-500/10 border border-blue-400/25 text-blue-200 px-2.5 py-1 hover:bg-blue-500/20">📅 Xem trên Dòng đời</button>}
                      <button onClick={async () => { const { data: cur } = await supabase.from('nodes').select('md').eq('id', editing.id).single(); navigator.clipboard?.writeText(`# ${editTitle}\n\n${(cur?.md as string) ?? ''}`); setToast('📋 Đã copy nội dung — dán đi đâu cũng được'); setTimeout(() => setToast(''), 2200) }} title="Copy toàn bộ nội dung trang (markdown)" className="rounded-lg bg-white/5 border border-white/10 text-zinc-400 px-2.5 py-1 hover:text-white">📋 Copy</button>

                      {(p.review_note as string) && node?.status === 'draft' && node?.owner_id === user.id && (
                        <span className="w-full text-[11px] text-amber-200/90 bg-amber-500/10 border border-amber-400/25 rounded-lg px-2.5 py-1.5 mt-1">💬 Góp ý của biên tập: {p.review_note as string}</span>
                      )}
                    </PropsPanel>
                  )
                })()}
                {editing.kind === 'database' ? (
                  <Database
                    key={editing.id}
                    node={{ id: editing.id, kind: editing.kind }}
                    orgId={orgId}
                    userId={user.id}
                    layer={layerOf(editing.id)}
                    onOpenPage={(id) => { const t = nodeOf(id); if (t) openNoteEditor(t) }}
                  />
                ) : mdView ? (
                  <div className="rounded-xl bg-black/30 border border-white/10 p-4 my-2">
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Markdown gốc (chỉ đọc) — tắt {'{ }'} MD để sửa dạng trang</div>
                    <pre className="text-[13px] leading-relaxed text-zinc-300 whitespace-pre-wrap font-mono">{mdFresh || '— trống —'}</pre>
                  </div>
                ) : (
                  <>
                    <div className="-mx-1">
                      {loadedId === editing.id ? <Editor
                        key={editing.id}
                        noteId={editing.id}
                        orgId={orgId}
                        userId={user.id}
                        layer={layerOf(editing.id)}
                        editable={canEditLayer(layerOf(editing.id))}
                        initialJson={editJson}
                        initialMd={mdText}
                        pages={tree.map(n => ({ id: n.id, title: n.title ?? '', icon: n.icon, kind: n.kind, pt: (n.props?.page_type as string) ?? null }))}
                        onOpenPage={(id) => { const t = nodeOf(id); if (t) openNoteEditor(t) }}
                        onSaved={() => setSavedMsg('✓ Đã lưu ' + new Date().toLocaleTimeString())}
                        onLinked={() => { if (editing) loadPageLinks(editing.id); if (orgId) loadGraph(orgId); setToast('🕸️ Đã nối trang — cuộn xuống xem Mạng liên kết'); setTimeout(() => setToast(''), 2800) }}
                      /> : <p className="text-zinc-600 text-sm py-3 px-1">Đang tải nội dung…</p>}
                    </div>
                    {/* ② PAGE FOOTER — 🗂 trang con · ❤️ liên kết 8 chiều · 🕸️ đi/về · 💎 tinh hoa · 📚 references · 📎 đính kèm (PageFrame.tsx) */}
                    {(() => {
                      const node = nodeOf(editing.id)
                      if (!node) return null
                      return (
                        <PageFooter
                          node={node}
                          pages={tree}
                          outLinks={outRaw}
                          backLinks={backRaw}
                          mdText={mdText}
                          canE={canEditLayer(layerOf(editing.id))}
                          onOpen={(id) => { const t = nodeOf(id); if (t) openNoteEditor(t) }}
                          onAddChild={addChild}
                          onSetProp={setNodeProp}
                          onLink={async (toId, dim) => {
                            if (!orgId) return
                            const { error } = await supabase.from('links').insert({ org_id: orgId, from_node: editing.id, to_node: toId, dimension: dim })
                            if (error) { setErr(error.message); return }
                            loadPageLinks(editing.id); loadGraph(orgId); logEvent('link', editing.id)
                            setToast(`💥 Đã nối chiều ${DIMS[dim]?.label ?? dim} — liên kết mới hình thành!`); setTimeout(() => setToast(''), 2800)
                          }}
                        />
                      )
                    })()}
                    {/* 💬 THẢO LUẬN (kiểu Wikipedia Talk page — kho chung, nhiều người cùng làm) */}
                    {layerOf(editing.id) !== 'personal' && (
                      <div className="mt-6 pt-5 border-t border-white/10 pb-4">
                        <div className="text-[11px] uppercase tracking-wide text-zinc-500 mb-2">💬 Thảo luận ({comments.filter(c => !c.resolved).length}) <span className="normal-case text-zinc-600">— bàn ở đây trước, sửa bài sau (quy tắc Wikipedia)</span></div>
                        <div className="space-y-1.5 mb-2">
                          {comments.map(c => (
                            <div key={c.id} className={`flex items-start gap-2 rounded-xl border px-3 py-2 ${c.resolved ? 'bg-white/[0.02] border-white/5 opacity-50' : 'bg-white/[0.03] border-white/10'}`}>
                              <span className="text-sm shrink-0">{c.resolved ? '✅' : '💬'}</span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs leading-relaxed ${c.resolved ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>{c.body}</p>
                                <p className="text-[10px] text-zinc-600">{c.user_id === user.id ? 'bạn' : 'thành viên'} · {new Date(c.created_at).toLocaleDateString('vi')}</p>
                              </div>
                              {!c.resolved && (c.user_id === user.id || role?.can_approve) && (
                                <button onClick={async () => { await supabase.from('page_comments').update({ resolved: true }).eq('id', c.id); loadPageLinks(editing.id) }} className="text-[10px] rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-zinc-500 hover:text-emerald-300 shrink-0">✓ Xong</button>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-1.5">
                          <input value={cmt} onChange={e => setCmt(e.target.value)} onKeyDown={async e => {
                            if (e.key === 'Enter' && cmt.trim()) {
                              await supabase.from('page_comments').insert({ node_id: editing.id, user_id: user.id, body: cmt.trim() })
                              setCmt(''); loadPageLinks(editing.id)
                            }
                          }} placeholder="Góp ý / đề xuất sửa / hỏi nhóm… (Enter gửi)" className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs outline-none focus:border-violet-400/50" />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
        </>
      ) : page === 'today' ? <div className="flex-1 overflow-auto">
          {!tree.some(n => n.owner_id === user.id && n.props?.chapter) && (
            <div className="px-8 pt-6 max-w-4xl mx-auto">
              <button onClick={() => setLifeWiz(true)} className="w-full text-left rounded-2xl border border-amber-400/25 bg-gradient-to-r from-amber-500/10 to-transparent px-5 py-4 hover:border-amber-400/50 transition">
                <div className="text-sm font-bold text-amber-200">✨ Viết Mục lục đời của bạn (5 phút)</div>
                <p className="text-[11px] text-zinc-500 mt-0.5">Đời bạn là cuốn sách — đặt tên 2–7 chương. Đây là nền móng để AI hiểu bạn và mọi trải nghiệm có chỗ cắm rễ.</p>
              </button>
            </div>
          )}
          <Today
            user={user}
            role={role}
            stats={{ pages: tree.filter(n => n.kind !== 'kho').length, notes: tree.filter(n => n.kind === 'note').length, links: links.length }}
            recent={recent.map(id => nodeOf(id)).filter((n): n is TNode => !!n)}
            pages={personalPages.filter(n => n.kind === 'note' || n.kind === 'page')}
            editorial={tree.filter(n => n.owner_id === user.id && (n.status === 'pending' || n.status === 'draft')).map(n => ({ id: n.id, title: n.title, kind: n.kind, parent_id: n.parent_id, icon: n.icon, status: n.status, note: (n.props?.review_note as string) ?? '' }))}
            onOpen={(n) => { openNoteEditor(n as Node); setPage('know') }}
            onOpenId={(id) => { const t = nodeOf(id); if (t) { openNoteEditor(t); setPage('know') } }}
            onCapture={async (title, type, source) => {
              logEvent('capture', undefined, { ctype: type ?? 'exp', len: title.length })
              // ghi nhanh CÓ LOẠI → đổ đúng cây gốc; user mới chưa có cây thì ensureHub TỰ TẠO (P0 fix audit 12/6)
              if (type === 'quote') {
                // quote đắt → Kim Chỉ Nam (chưa có thì tạo trong 🧭 La bàn) — không mất nguồn
                let anchor = tree.find(n => n.owner_id === user.id && n.subtype === 'anchor_home')
                if (!anchor && orgId) {
                  const compass = await ensureHub('compass', 'La bàn giá trị', '🧭')
                  const aid = crypto.randomUUID()
                  const { error } = await supabase.from('nodes').insert({ id: aid, org_id: orgId, owner_id: user.id, layer: 'personal', kind: 'page', parent_id: compass, title: 'Kim Chỉ Nam', icon: '🧭', subtype: 'anchor_home', status: 'published', min_level: 1, md: '**Loại:** ⚓ Kim Chỉ Nam\n\nNhững câu châm ngôn của chính bạn — giọng nói tinh khiết nhất.' })
                  if (!error) { await loadTree(orgId); anchor = { id: aid, title: 'Kim Chỉ Nam', kind: 'page', parent_id: compass, layer: 'personal', icon: '🧭', owner_id: user.id } as TNode }
                }
                if (anchor) {
                  const { data } = await supabase.from('nodes').select('md').eq('id', anchor.id).single()
                  // content:null — Kim Chỉ Nam thường có bản JSON cũ, Editor sẽ ưu tiên nó và GIẤU quote mới (bug 12/6)
                  const when = new Date().toLocaleDateString('vi')
                  await supabase.from('nodes').update({ content: null, md: `${data?.md ?? ''}\n\n> 💬 “${title}”\n> — ${source?.trim() ? `*${source.trim()}*` : 'sưu tầm'} · ${when}` }).eq('id', anchor.id)
                  logEvent('create', anchor.id); openNoteEditor(anchor); setPage('know')
                  return
                }
                // KHÔNG rơi xuyên xuống nhánh trải nghiệm (audit 12/6: quote thành note sai loại, mất nguồn)
                setToast('⚠ Chưa lưu được quote — thử lại nhé'); setTimeout(() => setToast(''), 3000)
                return
              }
              const isInsight = type === 'insight'
              if (!isInsight) { setCapDeep({ text: title, emo: '', who: '', lesson: '' }); return } // trải nghiệm → hỏi đào sâu trước khi nạp
              const parent = await ensureHub('lessons', 'Kim cương bài học', '💎')
              const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10) // ngày LOCAL, không lệch UTC
              const nowD = new Date()
              // title gọn — KHÔNG lấy nguyên văn dài (feedback 12/6): nhật ký theo ngày-giờ, insight cắt 60 ký tự
              const niceTitle = isInsight
                ? (title.length > 60 ? title.slice(0, 57).trimEnd() + '…' : title)
                : `Nhật ký ${nowD.toLocaleDateString('vi')} · ${nowD.getHours()}h${String(nowD.getMinutes()).padStart(2, '0')}`
              createPage(parent, 'personal', 'note', {
                title: niceTitle,
                event_date: today, // mắt xích GHI phải đan vào trục thời gian (KHO-CHUAN §2bis)
                props: { page_type: isInsight ? 'bai-hoc' : 'trai-nghiem', via: 'capture' },
                md: isInsight
                  ? `**Loại:** 🎓 Bài học · **Ngày sự kiện:** ${new Date().toLocaleDateString('vi')}\n\n**Tóm tắt 1 câu:** ${title}\n\n**Nguồn:** ${source || 'tự đúc rút'}\n\n## ⚡ Nguyên lý cốt lõi\n${title}\n\n## 🌍 Trải nghiệm gốc nào sinh ra insight này?\n- (nối chiều 🌱 trải nghiệm về trang chuyện gốc)\n\n## 🎯 Áp dụng\n- [ ] `
                  : `**Loại:** 🌱 Trải nghiệm · **Ngày sự kiện:** ${new Date().toLocaleDateString('vi')}\n\n**Tóm tắt 1 câu:** ${title}\n\n**Nguồn:** tự trải nghiệm\n\n## 📍 Bối cảnh\n\n## ⚡ Chuyện gì xảy ra\n${title}\n\n## ❤️ Cảm xúc\n\n## 🎓 Bài học rút ra\n- \n\n**Cảnh này nói gì về tôi:** `,
              })
              setPage('know')
            }}
            onGalaxy={() => { setPage('know'); setView('galaxy') }}
            onDigest={(n) => { openNoteEditor(n as Node); setPage('know'); setShowDigest(true) }}
            onRaw={() => { if (role?.can_approve) { setPage('review') } else { document.querySelector('h2')?.scrollIntoView({ behavior: 'smooth' }) } }}
            onKolAll={() => setPage('kol')}
            counts={{
              values: tree.filter(n => n.subtype === 'core_value' || (n.props?.role as string) === 'value').length,
              mantras: tree.filter(n => n.subtype === 'mantra').length,
              people: tree.filter(n => n.subtype === 'person' || (n.props?.page_type as string) === 'ho-so').length,
              dated: tree.filter(n => n.event_date && n.owner_id === user.id).length,
              pendingAll: tree.filter(n => n.status === 'pending').length,
            }}
          />
          <Studio orgId={orgId} user={user} canEdit={!!role?.can_edit} canApprove={!!role?.can_approve} pages={tree.map(n => ({ id: n.id, title: n.title, layer: n.layer, kind: n.kind, parent_id: n.parent_id, icon: n.icon, subtype: n.subtype }))} onOpen={(id) => { const t = nodeOf(id); if (t) { openNoteEditor(t); setPage('know') } }} onReload={() => { if (orgId) { loadTree(orgId); loadGraph(orgId) } }} />
          </div>
        : page === 'engine' ? <div className="flex-1 overflow-auto"><ContentEngine user={user} orgId={orgId} pages={tree} onOpenPage={(id) => { const t = nodeOf(id); if (t) { openNoteEditor(t); setPage('know') } }} onCreatePlan={async (title, md) => {
            const studio = await ensureHub('studio', 'Xưởng content', '🎬')
            createPage(studio, 'personal', 'page', { title, md, props: { page_type: 'quy-trinh', via: 'engine' } })
            setPage('know')
          }} /></div>
        : page === 'kol' ? <div className="flex-1 overflow-auto"><KolFeed canEdit={!!role?.can_edit} onOpenPage={(id) => { const t = nodeOf(id); if (t) { openNoteEditor(t); setPage('know') } }} onInsight={async (text, srcTitle, srcId) => {
            // insight từ KOL → 💎 Kim cương bài học (tự tạo cây nếu thiếu) + nối chiều reference về bài gốc
            const lessons = await ensureHub('lessons', 'Kim cương bài học', '💎')
            const id = crypto.randomUUID()
            await supabase.from('nodes').insert({ id, org_id: orgId, owner_id: user.id, layer: 'personal', kind: 'note', parent_id: lessons, title: text.slice(0, 80), event_date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10), md: `**Loại:** 🎓 Bài học · **Ngày sự kiện:** ${new Date().toLocaleDateString('vi')}\n\n**Tóm tắt 1 câu:** ${text}\n\n**Nguồn:** ${srcTitle} (KOL feed)\n\n## ⚡ Insight\n${text}\n\n## 🎯 Áp dụng vào đời tôi\n- [ ] `, props: { page_type: 'bai-hoc', via: 'kol' }, status: 'published', min_level: 1 })
            await supabase.from('links').insert({ org_id: orgId, from_node: id, to_node: srcId, dimension: 'reference', source: 'kol' })
            logEvent('create', id)
            if (orgId) { loadTree(orgId); loadGraph(orgId) }
            const t = { id, title: text.slice(0, 80), kind: 'note', parent_id: lessons }
            openNoteEditor(t as Node); setPage('know')
          }} /></div>
        : page === 'board' ? <div className="flex-1 overflow-auto"><Board orgId={orgId} userId={user.id} onOpen={(id) => { const t = nodeOf(id); if (t) { openNoteEditor(t); setPage('know') } }} /></div>
        : page === 'review' ? <div className="flex-1 overflow-auto"><ReviewHub me={user.id} onOpen={(id) => { const t = nodeOf(id); if (t) { openNoteEditor(t); setPage('know') } }} onChanged={() => { if (orgId) { loadTree(orgId); loadGraph(orgId) } }} /></div>
        : page === 'users' ? <div className="flex-1 overflow-auto"><MembersHub me={user.id} orgId={orgId} pages={tree} canAdmin={role?.level === 5 || !!role?.can_approve} onOpenPage={(id) => { const t = nodeOf(id); if (t) { openNoteEditor(t); setPage('know') } }} /></div>
        : <div className="flex-1 overflow-auto"><Profile user={user} /></div>}
      </div>

      {/* ✍️ ĐÀO SÂU TRẢI NGHIỆM — 3 câu bắt não làm việc trước khi nạp (skip được) */}
      {capDeep && (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-md grid place-items-center p-6" onClick={() => setCapDeep(null)}>
          <div className="w-[560px] max-w-[94vw] rounded-3xl bg-[#10121d] border border-white/10 shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold mb-1">Đào sâu 30 giây — cho trải nghiệm này có nghĩa</h3>
            <p className="text-xs text-zinc-500 mb-4 italic line-clamp-2">“{capDeep.text}”</p>
            <div className="mb-3">
              <div className="text-[12px] font-medium text-zinc-400 mb-1.5">🧡 Lúc đó bạn cảm thấy gì?</div>
              <div className="flex flex-wrap gap-1.5">
                {[['😮', 'vỡ òa'], ['💗', 'chạm'], ['🔥', 'thôi thúc'], ['😣', 'nhói'], ['😤', 'ức'], ['😌', 'nhẹ nhõm'], ['🌫️', 'hoài nghi']].map(([ic, l]) => (
                  <button key={l} onClick={() => setCapDeep(c => c && ({ ...c, emo: c.emo === l ? '' : l }))} className={`px-2.5 py-1.5 rounded-lg text-xs border ${capDeep.emo === l ? 'bg-amber-500/20 border-amber-400/50 text-amber-100' : 'bg-white/5 border-white/10 text-zinc-400'}`}>{ic} {l}</button>
                ))}
              </div>
            </div>
            <div className="mb-3">
              <div className="text-[12px] font-medium text-zinc-400 mb-1.5">💚 Ai liên quan đến chuyện này?</div>
              <input value={capDeep.who} onChange={e => setCapDeep(c => c && ({ ...c, who: e.target.value }))} placeholder="tên người — khách, đồng đội, gia đình… (bỏ trống được)" className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet-400/40" />
            </div>
            <div className="mb-4">
              <div className="text-[12px] font-medium text-zinc-400 mb-1.5">💎 Nếu rút thành MỘT câu bài học?</div>
              <input value={capDeep.lesson} onChange={e => setCapDeep(c => c && ({ ...c, lesson: e.target.value }))} placeholder="một câu của riêng bạn — không chép sách" className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet-400/40" />
            </div>
            <div className="flex items-center justify-between">
              <button onClick={() => finishCapture(capDeep.text, '', '', '')} className="text-xs text-zinc-600 hover:text-zinc-300">Bỏ qua — nạp luôn</button>
              <button onClick={() => finishCapture(capDeep.text, capDeep.emo, capDeep.who, capDeep.lesson)} className="rounded-xl ak-cta px-6 py-2.5 text-sm font-bold">✓ Nạp vào Hành trình</button>
            </div>
          </div>
        </div>
      )}
      {lifeWiz && (
        <LifeChaptersWizard onClose={() => setLifeWiz(false)} onCreate={async (chapters) => {
          const journey = await ensureHub('journey', 'Hành trình của tôi', '📓')
          for (let i = 0; i < chapters.length; i++) {
            const c = chapters[i]
            const yr = parseInt(c.year)
            await supabase.from('nodes').insert({
              id: crypto.randomUUID(), org_id: orgId, owner_id: user.id, layer: 'personal', kind: 'page', parent_id: journey,
              title: `Chương ${i + 1} · ${c.title.trim()}`, icon: ['🌱', '✈️', '🌪️', '🔥', '💎', '🌊', '⭐'][i] ?? '📖',
              status: 'published', min_level: 1, position: i + 1,
              event_date: yr > 1900 && yr < 2100 ? `${yr}-01-01` : null,
              props: { page_type: 'su-kien', chapter: i + 1, via: 'life-wizard' },
              md: `**Loại:** 🌟 Sự kiện / Mốc · **Ngày sự kiện:** ${c.year || '…'} · **Campaign:** —\n\n**Tóm tắt 1 câu:** ${c.summary.trim() || c.title.trim()}\n\n**Nguồn:** tự trải nghiệm\n\n## Chuyện của chương này\n\n(viết tự do — hoặc trả lời dần các cảnh bên dưới)\n\n## 🎬 Cảnh then chốt — trả lời dần, mỗi cảnh một trang con\n- Đỉnh cao nhất của chương này?\n- Vực sâu nhất?\n- Bước ngoặt?\n- Ai xuất hiện quan trọng nhất?\n\n**Chương này nói gì về tôi:** `,
            })
          }
          if (orgId) { await loadTree(orgId); loadGraph(orgId) }
          logEvent('wizard_life', undefined, { chapters: chapters.length })
          setLifeWiz(false)
          setToast(`📖 Đã tạo ${chapters.length} chương đời trong Hành trình — bắt đầu kể từ chương nào cũng được`); setTimeout(() => setToast(''), 4000)
        }} />
      )}
      {showDigest && editing && orgId && (
        <Digest
          folder={{ id: editing.id, title: editTitle, kind: editing.kind, parent_id: editing.parent_id }}
          others={tree.filter(f => f.id !== editing.id).map(f => ({ id: f.id, title: f.title, kind: f.kind, parent_id: f.parent_id }))}
          orgId={orgId}
          userId={user.id}
          onClose={() => setShowDigest(false)}
          onSaved={() => { if (editing) loadDepth(editing.id); if (orgId) loadGraph(orgId) }}
        />
      )}

      {/* ĐỀ XUẤT LÊN NHÂN LOẠI — 3 câu nắm lý do/mục tiêu (tách khỏi trường thông tin) */}
      {proposeFor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[58] grid place-items-center p-6" onClick={() => setProposeFor(null)}>
          <div className="w-[480px] max-w-[92vw] rounded-2xl bg-[#15151f] border border-white/10 shadow-2xl p-5" onClick={e => e.stopPropagation()}>
            <div className="text-sm font-bold mb-1">♾️ Đề xuất lên Kho nhân loại</div>
            <p className="text-xs text-zinc-500 mb-3">3 câu giúp ban biên tập hiểu & duyệt nhanh hơn:</p>
            <div className="text-xs text-zinc-300 mb-1">1. Vì sao bài này xứng đáng vào kho chung?</div>
            <textarea value={prop3.reason} onChange={e => setProp3({ ...prop3, reason: e.target.value })} className="w-full h-14 rounded-xl bg-white/5 border border-white/10 p-2.5 text-xs outline-none mb-2" />
            <div className="text-xs text-zinc-300 mb-1">2. Ai sẽ hưởng lợi — mục tiêu của bạn?</div>
            <textarea value={prop3.goal} onChange={e => setProp3({ ...prop3, goal: e.target.value })} className="w-full h-14 rounded-xl bg-white/5 border border-white/10 p-2.5 text-xs outline-none mb-2" />
            <div className="text-xs text-zinc-300 mb-1">3. Đề xuất thêm (đặt ở nhánh nào, cần ai bổ sung…)?</div>
            <textarea value={prop3.note} onChange={e => setProp3({ ...prop3, note: e.target.value })} className="w-full h-14 rounded-xl bg-white/5 border border-white/10 p-2.5 text-xs outline-none mb-3" />
            <button onClick={async () => {
              if (!orgId || !proposeFor || !prop3.reason.trim()) return
              const { data: cur } = await supabase.from('nodes').select('md,icon,props,title').eq('id', proposeFor).single()
              const humKho = tree.find(n => n.layer === 'humanity' && n.kind === 'kho')
              const nid = crypto.randomUUID()
              const { error } = await supabase.from('nodes').insert({ id: nid, org_id: orgId, owner_id: user.id, layer: 'humanity', kind: 'page', parent_id: humKho?.id ?? null, title: (cur?.title as string) ?? editTitle, icon: cur?.icon ?? null, md: (cur?.md as string) ?? '', props: { ...((cur?.props as Record<string, unknown>) ?? {}), proposed_from: proposeFor, proposal: prop3 }, status: 'pending', min_level: 1 })
              if (error) { setErr(error.message); return }
              setProposeFor(null); setProp3({ reason: '', goal: '', note: '' })
              if (orgId) loadTree(orgId)
              setToast('♾️ Đã đề xuất kèm lý do — chờ ban biên tập'); setTimeout(() => setToast(''), 3000)
            }} disabled={!prop3.reason.trim()} className="w-full rounded-xl ak-cta py-2.5 text-sm font-bold disabled:opacity-40">📨 Gửi đề xuất</button>
          </div>
        </div>
      )}

      {/* CHỌN CHIỀU LIÊN KẾT (chế độ Nối trên galaxy) */}
      {pendingLink && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[58] grid place-items-center p-6" onClick={() => setPendingLink(null)}>
          <div className="w-[440px] max-w-[92vw] rounded-2xl bg-[#15151f] border border-white/10 shadow-2xl p-5" onClick={e => e.stopPropagation()}>
            <div className="text-sm font-bold mb-1">⚡ Nối tri thức</div>
            <p className="text-xs text-zinc-500 mb-1.5 truncate">“{nodeOf(pendingLink.a)?.title}” → “{nodeOf(pendingLink.b)?.title}”</p>
            <p className="text-xs text-zinc-600 mb-3">Hai trang này liên hệ với nhau theo chiều nào?</p>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(DIMS).map(([k, d]) => (
                <button key={k} onClick={async () => {
                  const pl = pendingLink; setPendingLink(null)
                  if (!orgId || !pl) return
                  const { error } = await supabase.from('links').insert({ org_id: orgId, from_node: pl.a, to_node: pl.b, dimension: k })
                  if (error) { setErr(error.message); return }
                  loadGraph(orgId)
                  logEvent('link', pl.a)
                  setToast('💥 Liên kết mới đã hình thành — nhìn vụ nổ trên galaxy!')
                  setTimeout(() => setToast(''), 3000)
                }} className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-xs hover:border-violet-400/50 hover:bg-white/[0.08] transition">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />{d.label}
                </button>
              ))}
            </div>
            <button onClick={() => setPendingLink(null)} className="mt-3 w-full text-xs text-zinc-500 hover:text-zinc-300 py-1">Huỷ</button>
          </div>
        </div>
      )}

      {/* TEMPLATE PICKER */}
      {tplFor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] grid place-items-center p-6" onClick={() => setTplFor(null)}>
          <div className="w-[520px] max-w-[92vw] rounded-2xl bg-[#15151f] border border-white/10 shadow-2xl p-5" onClick={e => e.stopPropagation()}>
            <div className="text-sm font-bold mb-1">📑 Tạo trang từ template</div>
            <p className="text-xs text-zinc-500 mb-4">Cấu trúc chuẩn giúp kho sạch — và AI sau này đọc hiểu tốt hơn.</p>
            <div className="grid grid-cols-2 gap-2">
              {PAGE_TEMPLATES.map(t => (
                <button key={t.name} onClick={() => { const f = tplFor; setTplFor(null); createPage(f.parentId, f.layer, 'page', { title: t.md.match(/^#\s*(.+)$/m)?.[1] ?? t.name, md: t.md }) }}
                  className="text-left rounded-xl bg-white/[0.04] border border-white/10 p-3 hover:border-violet-400/50 hover:bg-white/[0.07] transition">
                  <div className="text-2xl mb-1">{t.icon}</div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-[11px] text-zinc-500">{t.desc}</div>
                </button>
              ))}
            </div>
            {/* template do user tự lưu (🧩 Lưu template) */}
            {tree.filter(n => n.subtype === 'template').length > 0 && (
              <>
                <div className="text-[10px] uppercase tracking-wider text-zinc-600 mt-4 mb-2">🧩 Template của bạn</div>
                <div className="grid grid-cols-2 gap-2">
                  {tree.filter(n => n.subtype === 'template').map(t => (
                    <button key={t.id} onClick={async () => {
                      const f = tplFor; setTplFor(null)
                      const { data } = await supabase.from('nodes').select('md,props').eq('id', t.id).single()
                      createPage(f!.parentId, f!.layer, 'page', { title: t.title ?? 'Trang mới', md: (data?.md as string) ?? '' })
                    }} className="text-left rounded-xl bg-white/[0.04] border border-white/10 p-3 hover:border-cyan-400/50 transition">
                      <div className="text-xl mb-1">🧩</div>
                      <div className="text-sm font-semibold truncate">{t.title}</div>
                      <div className="text-[11px] text-zinc-500">template tự lưu</div>
                    </button>
                  ))}
                </div>
              </>
            )}
            <button onClick={() => setTplFor(null)} className="mt-4 w-full text-xs text-zinc-500 hover:text-zinc-300 py-1">Đóng</button>
          </div>
        </div>
      )}

      {/* ONBOARDING 3 BƯỚC — high-tech */}
      {ob && (() => {
        const finish = () => { setOb(false); setPage('today'); try { localStorage.setItem('dq-onboarded', '1') } catch { /* */ } } // đáp xuống Today — ô ghi nhanh là hành động đầu tiên
        return (
          <div className="fixed inset-0 z-[70] overflow-hidden bg-[#06060c]/92 backdrop-blur-md grid place-items-center p-6">
            <div className="dq-stars" aria-hidden />
            <div className="dq-orb dq-orb-a" aria-hidden />
            <div className="dq-orb dq-orb-b" aria-hidden />
            <div className="relative w-[600px] max-w-[95vw] rounded-3xl p-[1.5px] bg-gradient-to-br from-violet-500/70 via-white/10 to-cyan-500/70 shadow-2xl shadow-violet-500/20">
              <div className="rounded-3xl bg-[#0d0d18]/97 overflow-hidden">
                {/* progress + dots */}
                <div className="h-1 bg-white/5"><div className="h-full bg-gradient-to-r from-violet-500 via-blue-600 to-cyan-400 transition-all duration-500" style={{ width: `${((obStep + 1) / 3) * 100}%` }} /></div>
                <div className="p-8 pb-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2.5">
                      <AkashMark size={34} />
                      <span className="text-sm font-black tracking-[0.25em] uppercase ak-logo-grad">Akash</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2].map(i => <button key={i} onClick={() => setObStep(i)} className={`h-1.5 rounded-full transition-all ${i === obStep ? 'w-6 bg-gradient-to-r from-violet-400 to-cyan-400' : 'w-1.5 bg-white/20 hover:bg-white/40'}`} />)}
                      <span className="text-[10px] text-zinc-600 ml-2">{obStep + 1}/3</span>
                    </div>
                  </div>

                  <div key={obStep} className="dq-step-in min-h-[280px]">
                    {obStep === 0 && (
                      <>
                        <h2 className="text-2xl font-black mb-1">Chào mừng đến <span className="ak-logo-grad">Akash</span></h2>
                        <p className="text-sm text-zinc-500 mb-5">Akasha — "hư không lưu giữ mọi tri thức". Bạn có 3 tầng kho:</p>
                        <div className="grid gap-2.5">
                          {[
                            ['🧠', 'Kho của bạn', 'Riêng tư tuyệt đối — trải nghiệm & bài học mỗi ngày', 'from-violet-500/20 to-violet-500/5 border-violet-400/30'],
                            ['🌐', 'Kho tập đoàn', 'Tri thức QNET chung — sản phẩm, kỹ năng, văn hoá RYTHM', 'from-cyan-500/20 to-cyan-500/5 border-cyan-400/30'],
                            ['♾️', 'Kho nhân loại', 'Tinh hoa sách & triết lý — Atomic Habits, Khắc kỷ, Ikigai…', 'from-violet-500/20 to-blue-500/5 border-violet-400/30'],
                          ].map(([ic, t, d, cls]) => (
                            <div key={t} className={`flex items-center gap-3.5 rounded-2xl bg-gradient-to-r border px-4 py-3.5 ${cls}`}>
                              <span className="text-3xl">{ic}</span>
                              <div><div className="text-sm font-bold">{t}</div><div className="text-xs text-zinc-400">{d}</div></div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    {obStep === 1 && (
                      <>
                        <h2 className="text-2xl font-black mb-1">Mọi thứ là một <span className="ak-logo-grad">trang</span></h2>
                        <p className="text-sm text-zinc-500 mb-5">4 thao tác quyền năng nhất — nhớ là dùng được 90% app:</p>
                        <div className="grid grid-cols-2 gap-2.5">
                          {[
                            ['/', 'Chèn block', 'Heading, bảng, code, 🗂️ database nhúng…'],
                            ['@', 'Nối tri thức', 'Link trang ↔ trang → hiện trên 🌌 Galaxy'],
                            ['⌘K', 'Nhảy nhanh', 'Tìm & mở mọi trang trong 1 giây'],
                            ['⠿', 'Kéo-thả', 'Sắp xếp cây trang · kéo thẻ trên Board'],
                          ].map(([k, t, d]) => (
                            <div key={t} className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 hover:border-violet-400/40 transition">
                              <kbd className="inline-grid place-items-center min-w-9 h-9 px-2 rounded-xl bg-gradient-to-br from-violet-500/30 to-cyan-500/30 border border-white/20 text-base font-bold text-white mb-2">{k}</kbd>
                              <div className="text-sm font-bold">{t}</div>
                              <div className="text-[11px] text-zinc-500 leading-relaxed">{d}</div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    {obStep === 2 && (
                      <>
                        <h2 className="text-2xl font-black mb-1">Học thật → <span className="text-amber-300">Content thật</span></h2>
                        <p className="text-sm text-zinc-500 mb-5">Vòng lặp giá trị của Akash — mỗi bài học là một tài sản:</p>
                        <div className="flex items-center justify-between gap-2 mb-5">
                          {[['🔥', 'Chuyển hoá', 'đi qua 8 chiều'], ['🎯', 'Độ Chuyển hoá', '8 thanh chiều sáng'], ['📣', '→ Content', 'lên Board'], ['💰', 'Giá trị', 'dạy & thu nhập']].map(([ic, t, d], i) => (
                            <div key={t} className="flex items-center gap-2 flex-1">
                              <div className="flex-1 rounded-2xl bg-white/[0.04] border border-white/10 px-2 py-3 text-center">
                                <div className="text-2xl mb-1">{ic}</div>
                                <div className="text-xs font-bold">{t}</div>
                                <div className="text-[9px] text-zinc-500">{d}</div>
                              </div>
                              {i < 3 && <span className="text-zinc-600 shrink-0">→</span>}
                            </div>
                          ))}
                        </div>
                        <div className="rounded-2xl bg-gradient-to-r from-violet-500/15 to-cyan-500/15 border border-violet-400/30 px-4 py-3 flex items-center gap-3">
                          <span className="text-2xl">{role?.level === 5 ? '👑' : role?.can_approve ? '✅' : role?.can_edit ? '✏️' : '👤'}</span>
                          <div>
                            <div className="text-xs text-zinc-400">Vai của bạn trong tổ chức</div>
                            <div className="text-sm font-bold">{role?.level === 5 ? 'Admin — toàn quyền + quản lý thành viên' : role?.can_approve ? 'Tổng biên tập — duyệt bài kho chung' : role?.can_edit ? 'Biên tập viên — soạn kho chung (qua duyệt)' : 'Thành viên — kho cá nhân riêng + đọc kho chung'}</div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-6">
                    <button onClick={finish} className="text-xs text-zinc-600 hover:text-zinc-300 transition">Bỏ qua</button>
                    <div className="flex gap-2">
                      {obStep > 0 && <button onClick={() => setObStep(s => s - 1)} className="rounded-xl bg-white/10 border border-white/10 px-4 py-2.5 text-sm hover:bg-white/15">← Trước</button>}
                      {obStep < 2
                        ? <button onClick={() => setObStep(s => s + 1)} className="rounded-xl ak-cta px-6 py-2.5 text-sm font-bold">Tiếp →</button>
                        : <button onClick={finish} className="rounded-xl ak-cta px-6 py-2.5 text-sm font-bold">✍️ Viết dòng đầu tiên</button>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* TOAST */}
      {toast && <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[65] rounded-xl bg-[#1c1c26] border border-violet-400/30 px-4 py-2.5 text-sm shadow-2xl shadow-violet-500/20">{toast}</div>}

      {palette && (() => {
        const q = palQ.trim()
        const results = q
          ? tree.map(n => ({ n, r: searchRank(q, n) })).filter(x => x.r > 0)
              .sort((a, b) => b.r - a.r || (a.n.title ?? '').localeCompare(b.n.title ?? '', 'vi')).slice(0, 12).map(x => x.n)
          : recent.map(id => nodeOf(id)).filter((n): n is TNode => !!n).slice(0, 8)
        const go = (n: TNode) => { openNoteEditor(n); setPage('know') }
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-start justify-center pt-[14vh]" onClick={() => setPalette(false)}>
            <div className="w-[560px] max-w-[92vw] rounded-2xl bg-[#15151f] border border-white/10 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-2 px-4 border-b border-white/10">
                <span className="text-zinc-500"><ISearch size={16} /></span>
                <input
                  autoFocus value={palQ}
                  onChange={e => { setPalQ(e.target.value); setPalIdx(0) }}
                  onKeyDown={e => {
                    if (e.key === 'ArrowDown') { e.preventDefault(); setPalIdx(i => Math.min(i + 1, results.length - 1)) }
                    if (e.key === 'ArrowUp') { e.preventDefault(); setPalIdx(i => Math.max(i - 1, 0)) }
                    if (e.key === 'Enter' && results[palIdx]) go(results[palIdx])
                  }}
                  placeholder="Tìm trang, nhảy nhanh…"
                  className="flex-1 bg-transparent outline-none py-3.5 text-sm"
                />
                <kbd className="text-[10px] text-zinc-500 border border-white/10 rounded px-1.5 py-0.5">ESC</kbd>
              </div>
              <div className="max-h-[46vh] overflow-auto py-1.5">
                {!q && results.length > 0 && <div className="px-4 pt-1 pb-1 text-[10px] uppercase tracking-wider text-zinc-600">Mở gần đây</div>}
                {results.map((n, i) => {
                  const path = ancestors(n.id).slice(0, -1).map(a => a.title || 'Trang').join(' / ')
                  return (
                    <button key={n.id} onMouseEnter={() => setPalIdx(i)} onClick={() => go(n)}
                      className={`w-full text-left px-4 py-2 flex items-center gap-2.5 ${i === palIdx ? 'bg-violet-500/15' : ''}`}>
                      <span className="text-lg shrink-0">{n.icon || kindIcon(n.kind)}</span>
                      <span className="min-w-0">
                        <span className={`block text-sm truncate ${i === palIdx ? 'text-white' : 'text-zinc-300'}`}>{n.title || 'Trang mới'}</span>
                        {path && <span className="block text-[11px] text-zinc-600 truncate">{path}</span>}
                      </span>
                      {i === palIdx && <span className="ml-auto text-[10px] text-zinc-500 shrink-0">↵ mở</span>}
                    </button>
                  )
                })}
                {results.length === 0 && <p className="px-4 py-6 text-sm text-zinc-600 text-center">Không tìm thấy “{palQ}”</p>}
              </div>
            </div>
          </div>
        )
      })()}

      {err && <button onClick={() => setErr('')} className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-xl bg-red-500/90 px-4 py-2 text-sm">{err} ✕</button>}
    </div>
  )
}
