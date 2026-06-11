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

// 8 CHIỀU LIÊN KẾT — gốc rễ framework (docs/FRAMEWORK.md §1): màu cố định + câu hỏi khi Thấm
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
const Sect = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
  <div className="mt-6 pt-5 border-t border-white/10">
    <div className="text-[11px] uppercase tracking-wide text-zinc-500 mb-2">{title} {hint && <span className="normal-case text-zinc-600">— {hint}</span>}</div>
    {children}
  </div>
)

/* ---------- chip 1 trường: nhãn cố định + ô giá trị ---------- */
function FieldChip({ id, field, disabled, locked, onChange, onRemove }: {
  id: string; field: Field; disabled: boolean; locked?: boolean
  onChange: (v: string) => void; onRemove?: () => void
}) {
  return (
    <label className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 ${locked ? 'bg-violet-500/[0.07] border-violet-400/20' : 'bg-white/5 border-white/10'}`}>
      <span className="text-zinc-500 shrink-0 max-w-[110px] truncate" title={field.label}>{locked ? '🔖' : '🏷️'} {field.label}</span>
      <input key={id} defaultValue={field.value} disabled={disabled} placeholder="…"
        onBlur={e => { if (e.target.value !== field.value) onChange(e.target.value) }}
        className="bg-transparent outline-none w-24 text-zinc-200 disabled:opacity-60" />
      {onRemove && <button onClick={onRemove} title="Xoá trường" className="text-zinc-600 hover:text-red-300">✕</button>}
    </label>
  )
}

/* =====================================================================
   ① PROPS PANEL — ngay dưới title
   - 📌 Trường chuẩn: hệ thống + ban biên tập fix cứng lúc tạo (props.fixed_fields)
     → mọi người điền GIÁ TRỊ (nếu có quyền sửa trang), chỉ ban biên tập thêm/xoá ĐỊNH NGHĨA
   - ✏️ Trường của tôi: user thường tự thêm trường riêng (props.custom_fields)
   - children = dải nút hành động (duyệt / đề xuất / template / đính kèm…) từ page.tsx
===================================================================== */
export function PropsPanel({ node, canE, isEditor, onSetProp, onSaveDate, children }: {
  node: FrameNode
  canE: boolean        // được sửa trang này (kho cá nhân: luôn; kho chung: biên tập viên+)
  isEditor: boolean    // thuộc ban biên tập (sửa kho chung) — được sửa ĐỊNH NGHĨA trường chuẩn
  onSetProp: (key: string, val: unknown) => void
  onSaveDate: (d: string) => void
  children?: React.ReactNode
}) {
  const p = (node.props ?? {}) as Record<string, unknown>
  const fixed = ((p.fixed_fields as Field[]) ?? [])
  const mine = ((p.custom_fields as Field[]) ?? [])
  // kho cá nhân: chính chủ là "ban biên tập" của trang mình; kho chung: cần quyền biên tập
  const canFix = node.layer === 'personal' ? canE : isEditor
  const inputCls = 'rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 outline-none text-zinc-300 disabled:opacity-50'

  const setField = (key: 'fixed_fields' | 'custom_fields', arr: Field[], i: number, v: string) =>
    onSetProp(key, arr.map((f, j) => j === i ? { ...f, value: v } : f))
  const addField = (key: 'fixed_fields' | 'custom_fields', arr: Field[]) => {
    const lbl = window.prompt(key === 'fixed_fields' ? 'Tên trường chuẩn mới (cả org thấy, fix cứng):' : 'Tên trường riêng của bạn (vd: Độ ưu tiên, Khu vực…):')
    if (lbl?.trim()) onSetProp(key, [...arr, { label: lbl.trim(), value: '' }])
  }

  return (
    <div className="mb-4 text-xs border-b border-white/5 pb-3 space-y-2.5">
      {/* ── 📌 TRƯỜNG CHUẨN — ban biên tập đặt khi tạo, fix cứng ── */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">📌 Trường chuẩn</span>
          <span className="text-[10px] text-zinc-600">— ban biên tập đặt khi tạo trang{canFix ? '' : ' · 🔒 fix cứng, bạn chỉ điền'}</span>
          {canFix && <button onClick={() => addField('fixed_fields', fixed)} title="Thêm trường chuẩn — cả trang dùng chung, thành viên thường không xoá được" className="text-[10px] rounded bg-violet-500/15 border border-violet-400/30 text-violet-200 px-1.5 py-0.5 hover:bg-violet-500/25">＋ trường chuẩn</button>}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <select disabled={!canE} value={(p.page_type as string) ?? ''} onChange={e => onSetProp('page_type', e.target.value)} className={inputCls}>
            <option value="">Loại trang…</option>
            {PAGE_TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <label className="flex items-center gap-1 rounded-lg bg-white/5 border border-white/10 px-2 py-1" title="Thời gian sự kiện THỰC TẾ (viết về quá khứ → ngày quá khứ)">
            📅 <input disabled={!canE} type="date" value={node.event_date ?? ''} onChange={e => onSaveDate(e.target.value)} className="bg-transparent outline-none text-zinc-300 disabled:opacity-50" />
          </label>
          <input disabled={!canE} key={node.id + '-sum'} defaultValue={(p.summary as string) ?? ''} onBlur={e => { if (e.target.value !== ((p.summary as string) ?? '')) onSetProp('summary', e.target.value) }} placeholder="🧭 Tóm tắt 1 câu (AI trích dẫn)…" className={`${inputCls} w-64`} />
          <input disabled={!canE} key={node.id + '-kw'} defaultValue={(p.keywords as string) ?? ''} onBlur={e => { if (e.target.value !== ((p.keywords as string) ?? '')) onSetProp('keywords', e.target.value) }} placeholder="🔑 Từ khoá, cách nhau dấu phẩy…" className={`${inputCls} w-52`} />
          <input disabled={!canE} key={node.id + '-src'} defaultValue={(p.source as string) ?? ''} onBlur={e => { if (e.target.value !== ((p.source as string) ?? '')) onSetProp('source', e.target.value) }} placeholder="📖 Nguồn…" className={`${inputCls} w-36`} />
          {(p.board as string) && <select disabled={!canE} value={(p.output_format as string) ?? ''} onChange={e => onSetProp('output_format', e.target.value)} className={inputCls}><option value="">Đầu ra…</option>{OUTPUT_FORMATS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>}
          {(p.board as string) && <input disabled={!canE} key={node.id + '-camp'} defaultValue={(p.campaign as string) ?? ''} onBlur={e => { if (e.target.value !== ((p.campaign as string) ?? '')) onSetProp('campaign', e.target.value) }} placeholder="🚩 Campaign…" className={`${inputCls} w-32`} />}
          {(((p.page_type as string) === 'ho-so') || node.subtype === 'person') && (
            <>
              <select disabled={!canE} value={(p.giai_doan as string) ?? ''} onChange={e => onSetProp('giai_doan', e.target.value)} className="rounded-lg bg-emerald-500/10 border border-emerald-400/30 text-emerald-200 px-2 py-1.5 outline-none">
                <option value="">🚦 Giai đoạn…</option>
                {['🧊 Lạnh', '🌤 Ấm', '🔥 Nóng', '✍️ Đã ký', '💚 Chăm sóc'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <input disabled={!canE} key={node.id + '-need'} defaultValue={(p.nhu_cau as string) ?? ''} onBlur={e => { if (e.target.value !== ((p.nhu_cau as string) ?? '')) onSetProp('nhu_cau', e.target.value) }} placeholder="🎯 Nhu cầu…" className="rounded-lg bg-emerald-500/10 border border-emerald-400/30 text-emerald-200 px-2 py-1.5 outline-none w-36" />
              <input disabled={!canE} key={node.id + '-kenh'} defaultValue={(p.kenh as string) ?? ''} onBlur={e => { if (e.target.value !== ((p.kenh as string) ?? '')) onSetProp('kenh', e.target.value) }} placeholder="📱 Kênh…" className="rounded-lg bg-emerald-500/10 border border-emerald-400/30 text-emerald-200 px-2 py-1.5 outline-none w-28" />
            </>
          )}
          {/* trường chuẩn thêm bởi ban biên tập — fix cứng: ai cũng thấy & điền (nếu sửa được trang), chỉ ban biên tập xoá */}
          {fixed.map((f, i) => (
            <FieldChip key={node.id + '-fx' + i} id={node.id + '-fxi' + i} field={f} disabled={!canE} locked
              onChange={v => setField('fixed_fields', fixed, i, v)}
              onRemove={canFix ? () => onSetProp('fixed_fields', fixed.filter((_, j) => j !== i)) : undefined} />
          ))}
        </div>
      </div>
      {/* ── ✏️ TRƯỜNG CỦA TÔI — user thường tự thêm, giống trường chuẩn nhưng của riêng trang/người này ── */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">✏️ Trường của tôi</span>
          <span className="text-[10px] text-zinc-600">— bạn tự thêm trường riêng cho trang này</span>
          {canE && <button onClick={() => addField('custom_fields', mine)} className="text-[10px] rounded bg-white/10 border border-white/10 text-zinc-300 px-1.5 py-0.5 hover:bg-white/15">＋ Thêm trường</button>}
        </div>
        {mine.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {mine.map((f, i) => (
              <FieldChip key={node.id + '-cf' + i} id={node.id + '-cfi' + i} field={f} disabled={!canE}
                onChange={v => setField('custom_fields', mine, i, v)}
                onRemove={canE ? () => onSetProp('custom_fields', mine.filter((_, j) => j !== i)) : undefined} />
            ))}
          </div>
        ) : <p className="text-[11px] text-zinc-700">Chưa có trường riêng nào{canE ? ' — bấm ＋ Thêm trường.' : '.'}</p>}
      </div>
      {/* ── dải hành động: trạng thái duyệt / đề xuất / template / đính kèm… ── */}
      {children && <div className="flex flex-wrap items-center gap-1.5">{children}</div>}
    </div>
  )
}

/* =====================================================================
   ② PAGE FOOTER — tổng hợp cuối trang
   🗂 trang con → ❤️ liên kết 8 chiều (nối ngay tại chỗ) → 🕸️ đi/về →
   💎 tinh hoa → 📚 references → 📎 đính kèm
===================================================================== */
export function PageFooter({ node, pages, outLinks, backLinks, mdText, canE, onOpen, onAddChild, onLink, onSetProp }: {
  node: FrameNode
  pages: FrameNode[]            // toàn bộ tree — để tra tên trang & picker nối
  outLinks: LinkOut[]
  backLinks: LinkBack[]
  mdText: string
  canE: boolean
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

  const quotes = [
    ...mdText.split('\n').filter(l => l.trim().startsWith('> ')).map(l => ({ t: l.trim().slice(2), src: 'trong bài' })),
    ...backLinks.filter(b => b.excerpt).map(b => ({ t: b.excerpt as string, src: byId.get(b.from_node)?.title ?? 'liên kết' })),
    ...outLinks.filter(o => o.excerpt).map(o => ({ t: o.excerpt as string, src: byId.get(o.to_node)?.title ?? 'liên kết' })),
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

      {/* ❤️ LIÊN KẾT 8 CHIỀU — gốc rễ framework: trang chưa nối = chưa thuộc về cuộc đời bạn */}
      <Sect title={`❤️ Liên kết 8 chiều (${litDims}/8 chiều sáng)`} hint="trang càng nối nhiều chiều càng Thấm sâu — bấm ＋ để nối ngay">
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
        <Sect title="🕸️ Liên kết & backlink" hint="→ trang này nhắc tới · ← ai nhắc tới trang này (tự động)">
          <div className="flex flex-wrap gap-1.5">
            {outLinks.map((l, i) => { const dst = byId.get(l.to_node); return dst ? pageChip(dst, '→', DIMS[l.dimension ?? '']?.color ?? '#888') : null })}
            {backLinks.map((l, i) => { const src = byId.get(l.from_node); return src ? pageChip(src, '←', DIMS[l.dimension ?? '']?.color ?? '#888') : null })}
          </div>
        </Sect>
      )}

      {/* 💎 TINH HOA — máy tự gom quote & trích đoạn (AI làm giàu khi cắm API) */}
      {quotes.length > 0 && (
        <Sect title="💎 Tổng hợp tinh hoa" hint="máy tự gom quote & trích đoạn (AI làm giàu khi cắm API)">
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
        <Sect title={`📚 References (${refs.length})`} hint="gom từ liên kết chiều Tham chiếu">
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
    </>
  )
}
