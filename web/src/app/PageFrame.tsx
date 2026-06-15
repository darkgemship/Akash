'use client'
import { useMemo, useState } from 'react'

/* =====================================================================
   PageFrame — bộ khung chuẩn của MỌI trang (xem docs/STANDARD-TEMPLATE.md)
   ┌──────────────────────────────────────────────┐
   │ Title                                        │
   │ ① PropsPanel  — 📌 trường chuẩn (ban biên tập│
   │                 fix cứng) + ✏️ trường của tôi │
   │ … thân bài (Editor) …                        │
   │ ② PageFooter — 🗂 trang con · ❤️ 8 chiều ·   │
   │    🕸️ liên kết/backlink · 💎 tinh hoa ·       │
   │    📚 references · 📎 đính kèm                │
   └──────────────────────────────────────────────┘
===================================================================== */

export type FrameNode = {
  id: string; title: string | null; kind: string; parent_id: string | null
  icon?: string | null; layer?: string; subtype?: string | null
  event_date?: string | null; status?: string
  props?: Record<string, unknown> | null
}
type Field = { label: string; value: string }
type LinkOut = { to_node: string; dimension: string | null; excerpt?: string | null }
type LinkBack = { from_node: string; dimension: string | null; excerpt?: string | null }

// 8 CHIỀU LIÊN KẾT — gốc rễ framework (docs/FRAMEWORK.md §1): màu cố định + câu hỏi khi Chuyển hoá
export const DIMS: Record<string, { label: string; color: string; icon: string; q: string }> = {
  knowledge: { label: 'Kiến thức', color: '#22d3ee', icon: '💧', q: 'Nguyên lý cốt lõi bằng MỘT CÂU của bạn? Nối tới trang lý thuyết nào?' },
  experience: { label: 'Trải nghiệm', color: '#f472b6', icon: '🌱', q: 'Bạn đã SỐNG qua điều này khi nào? Nối tới trang nhật ký.' },
  emotion: { label: 'Cảm xúc', color: '#fbbf24', icon: '🧡', q: 'Bài này chạm cảm xúc nào của bạn? Cảm xúc là HOOK của content.' },
  values: { label: 'Giá trị', color: '#a78bfa', icon: '💜', q: 'Bài này phụng sự GIÁ TRỊ CỐT LÕI nào của bạn?' },
  people: { label: 'Con người', color: '#34d399', icon: '💚', q: 'Bạn thấy/nghe chuyện thật của AI liên quan điều này?' },
  time: { label: 'Thời gian', color: '#60a5fa', icon: '💙', q: 'Xảy ra KHI NÀO trong dòng đời? Nối vào timeline.' },
  reference: { label: 'Tham chiếu', color: '#e879f9', icon: '💗', q: 'Nguồn ở đâu? Trang nào hướng tới, trang nào trỏ về?' },
  anchor: { label: 'Neo', color: '#f87171', icon: '❤️', q: 'Rút thành câu CHÂM NGÔN của chính bạn → Kim Chỉ Nam.' },
}

// Trục 1 — bản chất tri thức (mọi trang). Trục 2 — định dạng đầu ra (chỉ thẻ Xưởng content)
export const PAGE_TYPES: [string, string][] = [
  ['trai-nghiem', '🌱 Trải nghiệm'], ['bai-hoc', '🎓 Bài học / Khái niệm'], ['quy-trinh', '📋 Quy trình / Checklist'],
  ['ho-so', '👤 Hồ sơ (người/khách)'], ['nguon', '📚 Nguồn (sách/tài liệu)'], ['su-kien', '🌟 Sự kiện / Mốc'], ['ghi-chu', '📝 Ghi chú'],
]
export const OUTPUT_FORMATS: [string, string][] = [
  ['blog', '📰 Blog'], ['video', '🎬 Video dài'], ['reel', '🎞️ Reel/Short'], ['email', '📧 Email/tin nhắn'], ['caption', '💬 Caption'], ['talk', '🎤 Bài chia sẻ'],
]

const kindIcon = (k: string) => k === 'kho' ? '📦' : k === 'folder' ? '📁' : k === 'database' ? '🗂️' : '📄'

/* ── ĐỘ CHUYỂN HOÁ 8 CHIỀU — thanh mini đồng bộ màu framework (thay radar 5 cạnh cũ) ── */
export function Dim8Bars({ x, height = 26 }: { x: Record<string, number>; height?: number }) {
  const sat = (v: number) => 1 - Math.pow(2, -v)
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {Object.entries(DIMS).map(([k, d]) => {
        const v = x[k] ?? 0
        return (
          <div key={k} title={`${d.icon} ${d.label}: ${v > 0 ? `${v} tín hiệu` : 'chưa nối — ' + d.q}`} className="flex-1 min-w-[7px] rounded-sm relative group cursor-help" style={{ height }}>
            <div className="absolute inset-0 rounded-sm" style={{ background: d.color + '1a' }} />
            <div className="absolute bottom-0 left-0 right-0 rounded-sm transition-all" style={{ height: `${Math.max(v > 0 ? 14 : 0, sat(v) * 100)}%`, background: d.color, boxShadow: v > 0 ? `0 0 6px ${d.color}66` : 'none' }} />
          </div>
        )
      })}
    </div>
  )
}
const Sect = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
  <div className="mt-6 pt-5 border-t border-[var(--hud-line)]">
    <div className="hud-label mb-2">{title} {hint && <span className="normal-case tracking-normal text-[var(--hud-dim)] font-sans">— {hint}</span>}</div>
    {children}
  </div>
)

/* =====================================================================
   ① PROPS PANEL — ngay dưới title
   - 📌 Trường chuẩn: hệ thống + ban biên tập fix cứng lúc tạo (props.fixed_fields)
     → mọi người điền GIÁ TRỊ (nếu có quyền sửa trang), chỉ ban biên tập thêm/xoá ĐỊNH NGHĨA
   - ✏️ Trường của tôi: user thường tự thêm trường riêng (props.custom_fields)
   - children = dải nút hành động (duyệt / đề xuất / template / đính kèm…) từ page.tsx
===================================================================== */
export function PropsPanel({ node, canE, isEditor, hubLabel, onSetProp, onSaveDate, children }: {
  node: FrameNode
  canE: boolean        // được sửa trang này (kho cá nhân: luôn; kho chung: biên tập viên+)
  isEditor: boolean    // thuộc ban biên tập (sửa kho chung) — được sửa ĐỊNH NGHĨA trường chuẩn
  hubLabel?: string | null  // cây gốc đang chứa trang — hiển thị read-only (trang chỉ có MỘT nhà)
  onSetProp: (key: string, val: unknown) => void
  onSaveDate: (d: string) => void
  children?: React.ReactNode
}) {
  const p = (node.props ?? {}) as Record<string, unknown>
  const fixed = ((p.fixed_fields as Field[]) ?? [])
  const mine = ((p.custom_fields as Field[]) ?? [])
  // kho cá nhân: chính chủ là "ban biên tập" của trang mình; kho chung: cần quyền biên tập
  const canFix = node.layer === 'personal' ? canE : isEditor

  const setField = (key: 'fixed_fields' | 'custom_fields', arr: Field[], i: number, v: string) =>
    onSetProp(key, arr.map((f, j) => j === i ? { ...f, value: v } : f))
  const addField = (key: 'fixed_fields' | 'custom_fields', arr: Field[]) => {
    const lbl = window.prompt(key === 'fixed_fields' ? 'Tên trường chuẩn mới (cả org thấy, fix cứng):' : 'Tên trường riêng của bạn (vd: Độ ưu tiên, Khu vực…):')
    if (lbl?.trim()) onSetProp(key, [...arr, { label: lbl.trim(), value: '' }])
  }

  // hàng label–value: label cột trái cố định mờ, control bên phải — đọc như hồ sơ, không phải rừng chip
  const Row = ({ label, hint, children: c }: { label: string; hint?: string; children: React.ReactNode }) => (
    <div className="flex items-center gap-3 min-h-[34px]">
      <span className="w-[104px] shrink-0 text-[12px] font-medium text-zinc-400" title={hint}>{label}</span>
      <div className="flex-1 min-w-0">{c}</div>
    </div>
  )
  const flat = 'w-full rounded-lg bg-transparent border border-transparent hover:border-white/10 focus:border-violet-400/40 focus:bg-white/[0.03] px-2 py-1.5 outline-none text-[13.5px] text-zinc-100 disabled:opacity-50 transition-colors'
  return (
    <div className="mb-5 rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden text-[13px]">
      <div className="px-4 pt-2.5 -mb-1 flex items-center gap-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-600">Properties</span>
        <span className="text-[10px] text-zinc-700">— hồ sơ của trang, AI đọc từ đây</span>
      </div>
      {/* ── TRƯỜNG CHUẨN — khung cố định của org ── */}
      <div className="px-4 pt-3 pb-2.5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[12px] font-bold text-violet-200">📌 Trường chuẩn</span>
          <span className="text-[11px] text-zinc-500">{canFix ? 'khung chung của org' : 'khung cố định — bạn chỉ điền'}</span>
          {canFix && <button onClick={() => addField('fixed_fields', fixed)} title="Thêm trường chuẩn — cả org dùng chung" className="ml-auto text-[10px] rounded-md border border-white/10 text-zinc-400 px-2 py-0.5 hover:text-white hover:border-white/25">＋ trường chuẩn</button>}
        </div>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-0.5">
          <Row label="Loại trang" hint="1 trong 7 loại tri thức — quyết định template & cây gốc">
            <select disabled={!canE} value={(p.page_type as string) ?? ''} onChange={e => onSetProp('page_type', e.target.value)} className={flat}>
              <option value="">— chọn loại —</option>
              {PAGE_TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </Row>
          <Row label="Cây gốc" hint="nhà duy nhất của trang — cố định theo loại, mọi nơi khác chỉ liên kết về">
            <div className="px-2 py-1.5 text-[13.5px] text-zinc-300 truncate">{hubLabel ?? '—'} <span className="text-[10px] text-zinc-600">· cố định</span></div>
          </Row>
          <Row label="Ngày sự kiện" hint="Thời gian THỰC TẾ xảy ra (viết về quá khứ → ngày quá khứ)">
            <input disabled={!canE} type="date" value={node.event_date ?? ''} onChange={e => onSaveDate(e.target.value)} className={`${flat} [color-scheme:dark]`} />
          </Row>
          <Row label="Tóm tắt 1 câu" hint="AI dùng làm snippet khi trích dẫn">
            <input disabled={!canE} key={node.id + '-sum'} defaultValue={(p.summary as string) ?? ''} onBlur={e => { if (e.target.value !== ((p.summary as string) ?? '')) onSetProp('summary', e.target.value) }} placeholder="cốt lõi của trang trong một câu…" className={flat} />
          </Row>
          <Row label="Nguồn" hint="sách / URL / người kể / tự trải nghiệm">
            <input disabled={!canE} key={node.id + '-src'} defaultValue={(p.source as string) ?? ''} onBlur={e => { if (e.target.value !== ((p.source as string) ?? '')) onSetProp('source', e.target.value) }} placeholder="—" className={flat} />
          </Row>
          <Row label="Từ khoá" hint="cách nhau dấu phẩy — phục vụ tìm kiếm & AI">
            <input disabled={!canE} key={node.id + '-kw'} defaultValue={(p.keywords as string) ?? ''} onBlur={e => { if (e.target.value !== ((p.keywords as string) ?? '')) onSetProp('keywords', e.target.value) }} placeholder="—" className={flat} />
          </Row>
          {(p.board as string) && (
            <Row label="Đầu ra media" hint="định dạng content (chỉ thẻ Xưởng)">
              <div className="flex gap-2">
                <select disabled={!canE} value={(p.output_format as string) ?? ''} onChange={e => onSetProp('output_format', e.target.value)} className={flat}><option value="">—</option>{OUTPUT_FORMATS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                <input disabled={!canE} key={node.id + '-camp'} defaultValue={(p.campaign as string) ?? ''} onBlur={e => { if (e.target.value !== ((p.campaign as string) ?? '')) onSetProp('campaign', e.target.value) }} placeholder="campaign…" className={flat} />
              </div>
            </Row>
          )}
          {(((p.page_type as string) === 'ho-so') || node.subtype === 'person') && (
            <>
              <Row label="Giai đoạn" hint="trạng thái quan hệ">
                <select disabled={!canE} value={(p.giai_doan as string) ?? ''} onChange={e => onSetProp('giai_doan', e.target.value)} className={flat}>
                  <option value="">—</option>
                  {['🧊 Lạnh', '🌤 Ấm', '🔥 Nóng', '✍️ Đã ký', '💚 Chăm sóc'].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </Row>
              <Row label="Nhu cầu · kênh">
                <div className="flex gap-2">
                  <input disabled={!canE} key={node.id + '-need'} defaultValue={(p.nhu_cau as string) ?? ''} onBlur={e => { if (e.target.value !== ((p.nhu_cau as string) ?? '')) onSetProp('nhu_cau', e.target.value) }} placeholder="nhu cầu…" className={flat} />
                  <input disabled={!canE} key={node.id + '-kenh'} defaultValue={(p.kenh as string) ?? ''} onBlur={e => { if (e.target.value !== ((p.kenh as string) ?? '')) onSetProp('kenh', e.target.value) }} placeholder="kênh…" className={flat} />
                </div>
              </Row>
            </>
          )}
          {fixed.map((f, i) => (
            <Row key={node.id + '-fx' + i} label={f.label} hint="trường chuẩn do ban biên tập thêm">
              <div className="flex items-center gap-1">
                <input key={node.id + '-fxi' + i} defaultValue={f.value} disabled={!canE} placeholder="—"
                  onBlur={e => { if (e.target.value !== f.value) setField('fixed_fields', fixed, i, e.target.value) }} className={flat} />
                {canFix && <button onClick={() => onSetProp('fixed_fields', fixed.filter((_, j) => j !== i))} title="Xoá trường" className="text-zinc-700 hover:text-red-300 px-1">✕</button>}
              </div>
            </Row>
          ))}
        </div>
      </div>
      {/* ── TRƯỜNG CỦA TÔI — riêng trang này ── */}
      <div className="px-4 py-2.5 border-t border-white/[0.06] bg-white/[0.015]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[12px] font-bold text-cyan-200">✏️ Trường của tôi</span>
          <span className="text-[11px] text-zinc-500">riêng cho trang này</span>
          {canE && <button onClick={() => addField('custom_fields', mine)} className="ml-auto text-[10px] rounded-md border border-white/10 text-zinc-400 px-2 py-0.5 hover:text-white hover:border-white/25">＋ thêm trường</button>}
        </div>
        {mine.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-0.5">
            {mine.map((f, i) => (
              <Row key={node.id + '-cf' + i} label={f.label}>
                <div className="flex items-center gap-1">
                  <input key={node.id + '-cfi' + i} defaultValue={f.value} disabled={!canE} placeholder="—"
                    onBlur={e => { if (e.target.value !== f.value) setField('custom_fields', mine, i, e.target.value) }} className={flat} />
                  {canE && <button onClick={() => onSetProp('custom_fields', mine.filter((_, j) => j !== i))} title="Xoá trường" className="text-zinc-700 hover:text-red-300 px-1">✕</button>}
                </div>
              </Row>
            ))}
          </div>
        ) : <p className="text-[10.5px] text-zinc-700">Chưa có — dùng cho thông tin chỉ trang này cần (vd: Độ ưu tiên, Khu vực…).</p>}
      </div>
      {/* ── ĐÍNH KÈM — tách riêng cho rõ (feedback 12/6) ── */}
      <div className="px-4 py-2.5 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[12px] font-bold text-amber-200">📎 Đính kèm</span>
          <span className="text-[11px] text-zinc-500">tài liệu / link gốc của trang</span>
          {canE && <button onClick={() => {
            const url = window.prompt('Link tài liệu (PDF / Drive / web…):'); if (!url?.trim()) return
            const name = window.prompt('Tên hiển thị:') || url.slice(0, 40)
            onSetProp('attachments', [...(((p.attachments as { name: string; url: string }[]) ?? [])), { name, url: url.trim() }])
          }} className="ml-auto text-[10px] rounded-md border border-white/10 text-zinc-400 px-2 py-0.5 hover:text-white hover:border-white/25">＋ thêm</button>}
        </div>
        {((p.attachments as { name: string; url: string }[]) ?? []).length === 0
          ? <p className="text-[11px] text-zinc-700">Chưa có tệp nào.</p>
          : <div className="flex flex-wrap gap-1.5">
              {((p.attachments as { name: string; url: string }[]) ?? []).map((a, i) => (
                <span key={i} className="flex items-center gap-1 rounded-lg bg-amber-500/[0.07] border border-amber-400/20 px-2 py-1 text-[12px]">
                  <a href={a.url} target="_blank" rel="noreferrer" className="text-amber-200 hover:underline">{a.name}</a>
                  {canE && <button onClick={() => onSetProp('attachments', ((p.attachments as { name: string; url: string }[]) ?? []).filter((_, j) => j !== i))} className="text-zinc-600 hover:text-red-300">✕</button>}
                </span>
              ))}
            </div>}
      </div>
      {/* ── dải hành động: trạng thái duyệt / đề xuất… ── */}
      {children && <div className="px-4 py-2 border-t border-white/[0.06] flex flex-wrap items-center gap-1.5">{children}</div>}
    </div>
  )
}

/* =====================================================================
   ② PAGE FOOTER — tổng hợp cuối trang
   🗂 trang con → ❤️ liên kết 8 chiều (nối ngay tại chỗ) → 🕸️ đi/về →
   💎 tinh hoa → 📚 references → 📎 đính kèm
===================================================================== */
export function PageFooter({ node, pages, outLinks, backLinks, mdText, canE, lite, onOpen, onAddChild, onLink, onSetProp }: {
  node: FrameNode
  pages: FrameNode[]            // toàn bộ tree — để tra tên trang & picker nối
  outLinks: LinkOut[]
  backLinks: LinkBack[]
  mdText: string
  canE: boolean
  lite?: boolean   // trang tổng (kho/hub): chỉ hiện danh sách trang con, không 8 chiều/trích dẫn
  onOpen: (id: string) => void
  onAddChild: () => void
  onLink: (toId: string, dimension: string) => void
  onSetProp: (key: string, val: unknown) => void
}) {
  const [picker, setPicker] = useState<{ dim: string; q: string } | null>(null)
  const byId = useMemo(() => new Map(pages.map(pg => [pg.id, pg])), [pages])
  const childPages = pages.filter(pg => pg.parent_id === node.id)
  const p = (node.props ?? {}) as Record<string, unknown>

  // gom liên kết theo 8 chiều (đi + về)
  const byDim = Object.entries(DIMS).map(([k, d]) => ({
    k, d,
    out: outLinks.filter(l => l.dimension === k).map(l => byId.get(l.to_node)).filter((x): x is FrameNode => !!x),
    back: backLinks.filter(l => l.dimension === k).map(l => byId.get(l.from_node)).filter((x): x is FrameNode => !!x),
  }))
  const litDims = byDim.filter(x => x.out.length + x.back.length > 0).length

  // bỏ emoji 💬 + lớp ngoặc kép có sẵn (tránh nhân đôi “ ” khi render); tách "— nguồn" cuối câu thành src
  const stripQ = (s: string) => s.replace(/^\s*💬\s*/, '').replace(/^[“”"'\s]+/, '').replace(/[“”"'\s]+$/, '').trim()
  const splitAttr = (s: string): { t: string; attr?: string } => {
    const m = s.match(/^(.*?)\s+[—–-]\s+([^—–]{2,60})$/)
    return m && m[1].length > 10 ? { t: stripQ(m[1]), attr: m[2].trim() } : { t: stripQ(s) }
  }
  const quotes = [
    ...mdText.split('\n').filter(l => l.trim().startsWith('> ') && !/^>\s*[—–-]/.test(l.trim())).map(l => { const x = splitAttr(l.trim().slice(2)); return { t: x.t, src: x.attr ?? 'trong bài' } }),
    ...backLinks.filter(b => b.excerpt).map(b => ({ t: stripQ(b.excerpt as string), src: byId.get(b.from_node)?.title ?? 'liên kết' })),
    ...outLinks.filter(o => o.excerpt).map(o => ({ t: stripQ(o.excerpt as string), src: byId.get(o.to_node)?.title ?? 'liên kết' })),
  ].filter(q => q.t.trim().length > 5).slice(0, 6)
  const refs = outLinks.filter(o => o.dimension === 'reference').map(o => byId.get(o.to_node)).filter((x): x is FrameNode => !!x)
  const atts = ((p.attachments as { name: string; url: string }[]) ?? [])

  const pageChip = (pg: FrameNode, dir: '→' | '←', color: string) => (
    <button key={dir + pg.id} onClick={() => onOpen(pg.id)} className="text-[11px] rounded-lg bg-white/5 border border-white/10 px-2 py-1 hover:border-white/30 flex items-center gap-1 max-w-full">
      <span style={{ color }} className="shrink-0">{dir}</span>
      <span className="shrink-0">{pg.icon || kindIcon(pg.kind)}</span><span className="truncate">{pg.title || 'Trang'}</span>
    </button>
  )

  return (
    <>
      <div className="mt-2 mb-1 flex items-center gap-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-600">Footer</span>
        <span className="text-[10px] text-zinc-700">— chân trang: trang con · 8 chiều · liên kết · trích dẫn · nguồn</span>
        <span className="flex-1 h-px bg-white/[0.06]" />
      </div>
      {/* 🗂 TRANG CON */}
      <Sect title="🗂 Trang con">
        <div className="space-y-0.5">
          {childPages.map(c => (
            <button key={c.id} onClick={() => onOpen(c.id)} className="w-full text-left rounded-md px-2 py-1.5 text-sm flex items-center gap-2 hover:bg-white/[0.06]">
              <span className="text-[15px]">{c.icon || kindIcon(c.kind)}</span><span className="text-zinc-300">{c.title || 'Trang mới'}</span>
            </button>
          ))}
          {canE && <button onClick={onAddChild} className="w-full text-left rounded-md px-2 py-1.5 text-sm flex items-center gap-2 text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300">＋ Thêm trang con</button>}
        </div>
      </Sect>

      {lite ? null : <>
      {/* ❤️ LIÊN KẾT 8 CHIỀU — gốc rễ framework: trang chưa nối = chưa thuộc về cuộc đời bạn */}
      <Sect title={`❤️ Liên kết 8 chiều (${litDims}/8 chiều sáng)`} hint="trang càng nối nhiều chiều càng chuyển hoá sâu — bấm ＋ để nối ngay">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {byDim.map(({ k, d, out, back }) => {
            const lit = out.length + back.length > 0
            return (
              <div key={k} className={`rounded-xl border p-2.5 ${lit ? 'bg-white/[0.04] border-white/15' : 'bg-white/[0.015] border-white/5'}`}
                style={lit ? { boxShadow: `inset 2px 0 0 ${d.color}` } : undefined}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color, opacity: lit ? 1 : 0.35 }} />
                  <span className={`text-xs font-semibold ${lit ? 'text-zinc-200' : 'text-zinc-600'}`}>{d.icon} {d.label}</span>
                  {lit && <span className="text-[10px] text-zinc-600">{out.length + back.length}</span>}
                  {canE && <button onClick={() => setPicker(picker?.dim === k ? null : { dim: k, q: '' })} title={`Nối trang theo chiều ${d.label}`} className="ml-auto text-[10px] rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-zinc-500 hover:text-white hover:border-white/30">＋ Nối</button>}
                </div>
                {lit ? (
                  <div className="flex flex-wrap gap-1">
                    {out.map(pg => pageChip(pg, '→', d.color))}
                    {back.map(pg => pageChip(pg, '←', d.color))}
                  </div>
                ) : <p className="text-[10px] text-zinc-700 leading-relaxed italic">{d.q}</p>}
                {/* picker nối ngay tại chiều này */}
                {picker?.dim === k && (
                  <div className="mt-2 rounded-lg bg-black/30 border border-white/10 p-1.5">
                    <input autoFocus value={picker.q} onChange={e => setPicker({ dim: k, q: e.target.value })} placeholder={`Tìm trang để nối chiều ${d.label}…`} className="w-full bg-transparent outline-none text-xs px-1 py-0.5 mb-1 text-zinc-200" />
                    <div className="max-h-36 overflow-auto space-y-0.5">
                      {pages.filter(pg => pg.id !== node.id && pg.kind !== 'kho' && (pg.title ?? '').toLowerCase().includes(picker.q.toLowerCase())).slice(0, 8).map(pg => (
                        <button key={pg.id} onClick={() => { onLink(pg.id, k); setPicker(null) }} className="w-full text-left text-[11px] rounded px-1.5 py-1 text-zinc-300 hover:bg-white/10 flex items-center gap-1.5">
                          <span className="shrink-0">{pg.icon || kindIcon(pg.kind)}</span><span className="truncate">{pg.title || 'Chưa đặt tên'}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Sect>

      {/* 🕸️ MẠNG LIÊN KẾT — đi & về, gọn (chi tiết theo chiều ở khối trên) */}
      {(outLinks.length > 0 || backLinks.length > 0) && (
        <Sect title="🕸️ Liên kết & backlink" hint="→ trang này nhắc tới · ← ai nhắc tới trang này · liên kết kèm “câu trích” hiện ở mục Trích dẫn dưới">
          <div className="flex flex-wrap gap-1.5">
            {outLinks.map((l) => { const dst = byId.get(l.to_node); return dst ? pageChip(dst, '→', DIMS[l.dimension ?? '']?.color ?? '#888') : null })}
            {backLinks.map((l) => { const src = byId.get(l.from_node); return src ? pageChip(src, '←', DIMS[l.dimension ?? '']?.color ?? '#888') : null })}
          </div>
        </Sect>
      )}

      {/* 💎 TINH HOA — máy tự gom quote & trích đoạn (AI làm giàu khi cắm API) */}
      {quotes.length > 0 && (
        <Sect title="❝ Trích dẫn ❞" hint="câu trích MỨC CÂU từ liên kết có excerpt + quote trong bài — khác với Liên kết (chỉ trỏ trang)">
          <div className="space-y-1.5">
            {quotes.map((q, i) => (
              <div key={i} className="rounded-xl bg-amber-500/[0.06] border-l-2 border-amber-400/50 px-3 py-2">
                <p className="text-sm text-amber-100/90 italic">&ldquo;{q.t}&rdquo;</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">— {q.src}</p>
              </div>
            ))}
          </div>
        </Sect>
      )}

      {/* 📚 REFERENCES — mọi nguồn trang này dùng */}
      {refs.length > 0 && (
        <Sect title={`📚 Nguồn tham chiếu (${refs.length})`} hint="trang nguồn được trỏ tới bằng chiều Tham chiếu">
          <ol className="space-y-1 list-decimal list-inside">
            {refs.map((r, i) => (
              <li key={i} className="text-xs text-zinc-400">
                {(r.props as Record<string, unknown> | null)?.url
                  ? <a href={(r.props as Record<string, string>).url} target="_blank" rel="noreferrer" className="text-violet-300 hover:underline">{r.title}</a>
                  : <button onClick={() => onOpen(r.id)} className="text-violet-300 hover:underline">{r.title}</button>}
              </li>
            ))}
          </ol>
        </Sect>
      )}

      {/* 📎 ĐÍNH KÈM */}
      {atts.length > 0 && (
        <Sect title="📎 Tài liệu đính kèm">
          <div className="flex flex-wrap gap-2">
            {atts.map((a, i) => (
              <span key={i} className="flex items-center gap-1.5 rounded-xl bg-blue-500/10 border border-blue-400/25 text-blue-200 px-3 py-1.5 text-xs">
                <a href={a.url} target="_blank" rel="noreferrer" className="hover:underline">📎 {a.name}</a>
                {canE && <button onClick={() => onSetProp('attachments', atts.filter((_, j) => j !== i))} className="text-zinc-600 hover:text-red-300">✕</button>}
              </span>
            ))}
          </div>
        </Sect>
      )}
      </>}
    </>
  )
}
