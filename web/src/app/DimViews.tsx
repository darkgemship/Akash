'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { GNode, GLink } from './Galaxy'
import { DIM_COLOR, DIM_LABEL } from './Galaxy'

// 4 VIEW tôn vinh 5 CHIỀU QUAN HỆ — overlay riêng (không đụng renderer Galaxy chính). Có hover-highlight + tương tác.
const DIM6 = ['knowledge', 'people', 'experience', 'reference', 'values'] as const   // 5 chiều QUAN HỆ (bỏ Neo)
const LAYER_C: Record<string, string> = { personal: '#a78bfa', corporate: '#fcd34d', humanity: '#f0abfc' }
const LAYER_NAME: Record<string, string> = { personal: '🧠 Cá nhân', corporate: '🌐 QNET', humanity: '♾️ Nhân loại' }
const LAYERS = ['personal', 'corporate', 'humanity'] as const
type Tab = 'orbit' | 'chord' | 'sky' | 'sankey'
const TABS: [Tab, string][] = [['orbit', '🪐 Quỹ đạo chiều'], ['chord', '🎀 Vòng hợp âm'], ['sky', '🌈 6 bầu trời'], ['sankey', '🌊 Dòng chảy']]
const SS = () => (typeof window !== 'undefined' && window.devicePixelRatio > 1 ? 2 : 1)   // scale chữ theo dpr

type Hit = { id: string; x: number; y: number; r: number }

export default function DimViews({ nodes, links, onOpen, onClose }: {
  nodes: GNode[]; links: GLink[]; onOpen: (n: GNode) => void; onClose: () => void
}) {
  const [tab, setTab] = useState<Tab>('orbit')
  const [chordN, setChordN] = useState(80)        // số node hiện ở Vòng hợp âm (mở sâu thêm)
  const wrap = useRef<HTMLDivElement>(null)
  const cv = useRef<HTMLCanvasElement>(null)
  const hitsRef = useRef<Hit[]>([])
  const tRef = useRef(0)
  const focusRef = useRef<string | null>(null)
  const hoverRef = useRef<string | null>(null)     // node/băng đang hover → highlight
  const chordNRef = useRef(80); chordNRef.current = chordN
  const [focusTitle, setFocusTitle] = useState('')
  const [hoverTip, setHoverTip] = useState<{ x: number; y: number; text: string } | null>(null)

  const N = useMemo(() => nodes.filter(n => n.kind !== 'block' && n.kind !== 'kho'), [nodes])
  const L = useMemo(() => links.filter(l => DIM6.includes((l.dimension ?? '') as typeof DIM6[number])), [links])
  const byId = useMemo(() => new Map(N.map(n => [n.id, n])), [N])
  const deg = useMemo(() => { const m = new Map<string, number>(); L.forEach(l => { m.set(l.from_node, (m.get(l.from_node) ?? 0) + 1); m.set(l.to_node, (m.get(l.to_node) ?? 0) + 1) }); return m }, [L])
  const adj = useMemo(() => { const m = new Map<string, Set<string>>(); L.forEach(l => { (m.get(l.from_node) ?? m.set(l.from_node, new Set()).get(l.from_node)!).add(l.to_node); (m.get(l.to_node) ?? m.set(l.to_node, new Set()).get(l.to_node)!).add(l.from_node) }); return m }, [L])
  const topId = useMemo(() => [...deg.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? N[0]?.id ?? null, [deg, N])
  useEffect(() => { if (!focusRef.current) { focusRef.current = topId; setFocusTitle(byId.get(topId ?? '')?.title ?? '') } }, [topId, byId])

  useEffect(() => {
    const c = cv.current, box = wrap.current; if (!c || !box) return
    const ctx = c.getContext('2d')!; let raf = 0; const dpr = Math.min(2, window.devicePixelRatio || 1)
    const resize = () => { c.width = box.clientWidth * dpr; c.height = box.clientHeight * dpr }
    resize(); const onR = () => resize(); window.addEventListener('resize', onR)
    const loop = () => {
      tRef.current += 1
      const W = c.width, H = c.height, t = tRef.current
      ctx.clearRect(0, 0, W, H); ctx.save(); hitsRef.current = []
      try {
        if (tab === 'orbit') drawOrbit(ctx, W, H, t)
        else if (tab === 'chord') drawChord(ctx, W, H, t)
        else if (tab === 'sky') drawSky(ctx, W, H, t)
        else drawSankey(ctx, W, H)
      } catch { /* */ }
      ctx.restore(); raf = requestAnimationFrame(loop)
    }
    loop()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onR) }
  }, [tab, N, L]) // eslint-disable-line react-hooks/exhaustive-deps

  const lbl = (id: string) => byId.get(id)?.title ?? 'Trang'
  const dimColor = (d: string) => DIM_COLOR[d] ?? '#9aa0d0'
  // node có đang "sáng" theo hover không (hover rỗng = tất cả sáng)
  const lit = (id: string) => { const h = hoverRef.current; return !h || h === id || (adj.get(h)?.has(id) ?? false) }
  const litLink = (a: string, b: string) => { const h = hoverRef.current; return !h || h === a || h === b }

  function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, id: string, label?: string) {
    const on = lit(id)
    ctx.globalAlpha = on ? 1 : 0.18
    if (on && hoverRef.current === id) { ctx.beginPath(); ctx.arc(x, y, r + 4, 0, 6.28); ctx.fillStyle = color + '44'; ctx.fill() }
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28); ctx.fillStyle = color; ctx.fill()
    ctx.globalAlpha = 1
    hitsRef.current.push({ id, x, y, r: Math.max(r, 9) })
    if (label && on) { ctx.fillStyle = '#cbd5e1'; ctx.font = `${11 * SS()}px var(--font-geist-sans, sans-serif)`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(label.length > 26 ? label.slice(0, 25) + '…' : label, x + r + 5, y) }
  }

  // 🪐 QUỸ ĐẠO THEO CHIỀU
  function drawOrbit(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
    const cx = W / 2, cy = H / 2, fid = focusRef.current; if (!fid) return
    const maxR = Math.min(W, H) * 0.44, r0 = maxR * 0.18, nD = DIM6.length
    const byDim: Record<string, string[]> = {}; DIM6.forEach(d => byDim[d] = [])
    for (const l of L) { const o = l.from_node === fid ? l.to_node : l.to_node === fid ? l.from_node : null; if (!o || !byId.has(o)) continue; const d = l.dimension ?? ''; if (byDim[d]) byDim[d].push(o) }
    DIM6.forEach((d, i) => {
      const R = r0 + ((i + 1) / nD) * (maxR - r0), col = dimColor(d)
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.28); ctx.strokeStyle = col + '2e'; ctx.lineWidth = 1.2; ctx.stroke()
      ctx.fillStyle = col; ctx.font = `${10 * SS()}px var(--font-geist-mono, monospace)`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
      ctx.fillText(`${DIM_LABEL[d] ?? d} · ${byDim[d].length}`, cx + R + 6, cy)
      const list = byDim[d], n2 = list.length
      list.forEach((id, k) => {
        const a = (k / Math.max(1, n2)) * Math.PI * 2 + i * 0.5 + t * 0.0016
        const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R
        ctx.globalAlpha = lit(id) ? 1 : 0.15
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.strokeStyle = col + '66'; ctx.lineWidth = 1; ctx.stroke()
        ctx.globalAlpha = 1
        dot(ctx, x, y, 4 + Math.min(6, deg.get(id) ?? 0), col, id, n2 <= 16 ? lbl(id) : undefined)
      })
    })
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r0 * 1.8)
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, (LAYER_C[byId.get(fid)?.layer ?? 'personal']) + 'cc'); g.addColorStop(1, 'transparent')
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r0 * 1.8, 0, 6.28); ctx.fill()
    dot(ctx, cx, cy, 10, '#fff', fid)
    ctx.fillStyle = '#fff'; ctx.font = `bold ${13 * SS()}px var(--font-geist-sans, sans-serif)`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'
    ctx.fillText(lbl(fid).slice(0, 30), cx, cy + r0 * 1.9)
  }

  // 🎀 VÒNG HỢP ÂM — mở sâu theo chordN; hover node → ruy-băng của nó bừng
  function drawChord(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.40
    const order = [...deg.entries()].sort((a, b) => b[1] - a[1]).slice(0, chordNRef.current).map(e => e[0]).filter(id => byId.has(id))
      .sort((a, b) => (byId.get(a)!.layer ?? '').localeCompare(byId.get(b)!.layer ?? ''))
    const pos = new Map<string, { x: number; y: number; a: number }>()
    const rot = t * 0.0005
    order.forEach((id, i) => { const a = (i / order.length) * Math.PI * 2 + rot; pos.set(id, { x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R, a }) })
    LAYERS.forEach(Lr => {
      const ids = order.filter(id => (byId.get(id)!.layer ?? 'personal') === Lr); if (!ids.length) return
      ctx.beginPath(); ctx.arc(cx, cy, R + 10, pos.get(ids[0])!.a, pos.get(ids[ids.length - 1])!.a); ctx.strokeStyle = LAYER_C[Lr]; ctx.lineWidth = 5; ctx.stroke()
    })
    for (const l of L) {
      const a = pos.get(l.from_node), b = pos.get(l.to_node); if (!a || !b) continue
      const on = litLink(l.from_node, l.to_node)
      ctx.globalAlpha = on ? (hoverRef.current ? 0.85 : 0.4) : 0.05
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(cx, cy, b.x, b.y)
      ctx.strokeStyle = dimColor(l.dimension ?? ''); ctx.lineWidth = on && hoverRef.current ? 1.8 : 1; ctx.stroke()
    }
    ctx.globalAlpha = 1
    order.forEach(id => dot(ctx, pos.get(id)!.x, pos.get(id)!.y, 3 + Math.min(5, (deg.get(id) ?? 0) * 0.4), LAYER_C[byId.get(id)!.layer ?? 'personal'], id, hoverRef.current === id ? lbl(id) : undefined))
  }

  // 🌈 6 BẦU TRỜI — mỗi ô 1 chiều, vẽ kiểu CHÒM SAO: nền sao mờ + node là sao sáng + đường chòm + lấp lánh
  function drawSky(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
    const fr = (x: number) => { const s = Math.sin(x) * 43758.5; return s - Math.floor(s) }
    const cols = 3, rows = 2, pw = W / cols, ph = H / rows
    DIM6.forEach((d, i) => {
      const gx = (i % cols) * pw, gy = Math.floor(i / cols) * ph, ccx = gx + pw / 2, ccy = gy + ph / 2 + 10 * SS(), col = dimColor(d)
      // nền đêm + sao mờ
      ctx.fillStyle = '#070710'; ctx.fillRect(gx + 5, gy + 5, pw - 10, ph - 10)
      ctx.strokeStyle = col + '22'; ctx.strokeRect(gx + 5, gy + 5, pw - 10, ph - 10)
      for (let s = 0; s < 40; s++) { const sx = gx + 10 + fr(i * 9 + s) * (pw - 20), sy = gy + 10 + fr(i * 13 + s * 3) * (ph - 20); ctx.globalAlpha = 0.18 + 0.3 * fr(s + i); ctx.fillStyle = '#9aa0d0'; ctx.fillRect(sx, sy, 1.2 * SS(), 1.2 * SS()) }
      ctx.globalAlpha = 1
      ctx.fillStyle = col; ctx.font = `bold ${12 * SS()}px var(--font-geist-mono, monospace)`; ctx.textAlign = 'left'; ctx.textBaseline = 'top'
      const sub = L.filter(l => (l.dimension ?? '') === d)
      ctx.fillText(`${DIM_LABEL[d] ?? d} · ${sub.length}`, gx + 14, gy + 12)
      const ids = [...new Set(sub.flatMap(l => [l.from_node, l.to_node]))].filter(id => byId.has(id))
      const R = Math.min(pw, ph) * 0.33
      const pos = new Map<string, { x: number; y: number }>()
      ids.forEach((id, k) => { const a = (k / Math.max(1, ids.length)) * Math.PI * 2 + t * 0.0008 + i; const rr = R * (0.55 + 0.45 * fr(id.charCodeAt(0) + k)); pos.set(id, { x: ccx + Math.cos(a) * rr, y: ccy + Math.sin(a) * rr }) })
      // đường chòm
      for (const l of sub) { const a = pos.get(l.from_node), b = pos.get(l.to_node); if (!a || !b) continue; const on = litLink(l.from_node, l.to_node); ctx.globalAlpha = on ? 0.5 : 0.06; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.strokeStyle = col; ctx.lineWidth = 0.8; ctx.stroke() }
      ctx.globalAlpha = 1
      // sao: lấp lánh + quầng
      ids.forEach(id => { const p = pos.get(id)!; const tw = 0.7 + 0.3 * Math.sin(t * 0.06 + id.charCodeAt(0)); const sr = (2.5 + Math.min(5, deg.get(id) ?? 0)) * tw
        if (lit(id)) { ctx.globalAlpha = 0.5; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p.x, p.y, sr + 3, 0, 6.28); ctx.fill(); ctx.globalAlpha = 1 }
        dot(ctx, p.x, p.y, sr, '#eaf0ff', id) })
    })
  }

  // 🌊 SANKEY — hover băng (kho/chiều) → ruy-băng qua nó bừng + đếm
  function drawSankey(ctx: CanvasRenderingContext2D, W: number, H: number) {
    const x0 = W * 0.16, x1 = W / 2, x2 = W - W * 0.16, colH = H * 0.66, top = H * 0.18
    const srcCnt: Record<string, number> = {}, dstCnt: Record<string, number> = {}, dimCnt: Record<string, number> = {}
    const flows: { from: string; dim: string; to: string }[] = []
    for (const l of L) { const f = byId.get(l.from_node)?.layer ?? 'personal', to = byId.get(l.to_node)?.layer ?? 'personal', d = l.dimension ?? ''; srcCnt[f] = (srcCnt[f] ?? 0) + 1; dstCnt[to] = (dstCnt[to] ?? 0) + 1; dimCnt[d] = (dimCnt[d] ?? 0) + 1; flows.push({ from: f, dim: d, to }) }
    const total = Math.max(1, L.length); const hv = hoverRef.current   // 'b:src:x' | 'b:dim:x' | 'b:dst:x'
    const band = (items: string[], counts: Record<string, number>, x: number, kind: string, colorFn: (k: string) => string, nameFn: (k: string) => string) => {
      const yPos: Record<string, { y0: number }> = {}; let y = top
      for (const k of items) { const h = (counts[k] ?? 0) / total * colH; const id = `b:${kind}:${k}`; yPos[k] = { y0: y }
        const onB = !hv || hv === id
        ctx.globalAlpha = onB ? 1 : 0.3; ctx.fillStyle = colorFn(k); ctx.fillRect(x - 8, y, 16, Math.max(2, h - 3))
        hitsRef.current.push({ id, x, y: y + h / 2, r: Math.max(10, h / 2) })
        ctx.fillStyle = onB ? '#e5e7eb' : '#71717a'; ctx.font = `${10 * SS()}px var(--font-geist-mono, monospace)`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(`${nameFn(k)} ${counts[k]}`, x, y + Math.max(2, h - 3) + 2); ctx.globalAlpha = 1; y += h + 8 }
      return yPos
    }
    const sY = band(LAYERS.filter(l => srcCnt[l]), srcCnt, x0, 'src', k => LAYER_C[k], k => LAYER_NAME[k].replace(/^.. /, ''))
    const dY = band(DIM6.filter(d => dimCnt[d]), dimCnt, x1, 'dim', k => dimColor(k), k => DIM_LABEL[k] ?? k)
    const tY = band(LAYERS.filter(l => dstCnt[l]), dstCnt, x2, 'dst', k => LAYER_C[k], k => LAYER_NAME[k].replace(/^.. /, ''))
    const sCurY: Record<string, number> = {}; Object.keys(sY).forEach(k => sCurY[k] = sY[k].y0)
    const dCurL: Record<string, number> = {}, dCurR: Record<string, number> = {}; Object.keys(dY).forEach(d => { dCurL[d] = dY[d].y0; dCurR[d] = dY[d].y0 })
    const tCurY: Record<string, number> = {}; Object.keys(tY).forEach(k => tCurY[k] = tY[k].y0)
    const ribbon = (xa: number, ya: number, xb: number, yb: number, h: number, color: string, on: boolean) => {
      ctx.globalAlpha = on ? (hv ? 0.6 : 0.32) : 0.05
      ctx.beginPath(); ctx.moveTo(xa, ya); ctx.bezierCurveTo((xa + xb) / 2, ya, (xa + xb) / 2, yb, xb, yb); ctx.lineTo(xb, yb + h); ctx.bezierCurveTo((xa + xb) / 2, yb + h, (xa + xb) / 2, ya + h, xa, ya + h); ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.globalAlpha = 1
    }
    const sd: Record<string, number> = {}, dd: Record<string, number> = {}
    flows.forEach(f => { sd[f.from + '|' + f.dim] = (sd[f.from + '|' + f.dim] ?? 0) + 1; dd[f.dim + '|' + f.to] = (dd[f.dim + '|' + f.to] ?? 0) + 1 })
    Object.entries(sd).forEach(([k, n]) => { const [f, d] = k.split('|'); if (!sY[f] || !dY[d]) return; const h = n / total * colH; const on = !hv || hv === `b:src:${f}` || hv === `b:dim:${d}`; ribbon(x0 + 8, sCurY[f], x1 - 8, dCurL[d], h, dimColor(d), on); sCurY[f] += h; dCurL[d] += h })
    Object.entries(dd).forEach(([k, n]) => { const [d, to] = k.split('|'); if (!dY[d] || !tY[to]) return; const h = n / total * colH; const on = !hv || hv === `b:dst:${to}` || hv === `b:dim:${d}`; ribbon(x1 + 8, dCurR[d], x2 - 8, tCurY[to], h, dimColor(d), on); dCurR[d] += h; tCurY[to] += h })
    ctx.fillStyle = '#71717a'; ctx.font = `${11 * SS()}px var(--font-geist-sans, sans-serif)`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'
    ctx.fillText('Kho nguồn  →  Chiều liên kết  →  Kho đích   ·   rê chuột vào cột để lọc dòng chảy', W / 2, H - 8)
  }

  function pick(e: React.MouseEvent): Hit | null {
    const c = cv.current; if (!c) return null
    const r = c.getBoundingClientRect(), dpr = c.width / r.width
    const mx = (e.clientX - r.left) * dpr, my = (e.clientY - r.top) * dpr
    let best: Hit | null = null, bd = 1e9
    for (const h of hitsRef.current) { const d = Math.hypot(h.x - mx, h.y - my); if (d < h.r + 6 && d < bd) { bd = d; best = h } }
    return best
  }
  function onMove(e: React.MouseEvent) {
    const h = pick(e); hoverRef.current = h?.id ?? null
    if (h && !h.id.startsWith('b:')) setHoverTip({ x: e.clientX, y: e.clientY, text: lbl(h.id) }); else setHoverTip(null)
  }
  function onClick(e: React.MouseEvent) {
    const best = pick(e); if (!best || best.id.startsWith('b:')) return
    if (tab === 'orbit') { focusRef.current = best.id; setFocusTitle(byId.get(best.id)?.title ?? '') }
    else { const n = byId.get(best.id); if (n) onOpen(n) }
  }

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-[#06060c]">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--hud-line)] shrink-0">
        <button onClick={onClose} className="hud-label hud-label-accent">← về Galaxy</button>
        <div className="flex gap-1 ml-2">
          {TABS.map(([k, lb]) => <button key={k} onClick={() => setTab(k)} className={`px-2.5 py-1.5 rounded-lg text-xs ${tab === k ? 'ak-cta text-white' : 'text-zinc-400 hover:bg-white/10'}`}>{lb}</button>)}
        </div>
        {tab === 'orbit' && <span className="text-[11px] text-zinc-500 ml-auto truncate">Soi: <b className="text-zinc-300">{focusTitle}</b> · bấm node để đổi tâm · rê chuột để soi liên kết</span>}
        {tab === 'chord' && <div className="ml-auto flex items-center gap-1.5"><span className="text-[11px] text-zinc-600">Số trang:</span>{[40, 80, 150, 9999].map(n => <button key={n} onClick={() => setChordN(n)} className={`text-[10px] rounded-md px-2 py-1 border ${chordN === n ? 'ak-cta text-white border-transparent' : 'border-white/10 text-zinc-400 hover:bg-white/10'}`}>{n === 9999 ? 'Tất cả' : n}</button>)}</div>}
        {(tab === 'sky' || tab === 'sankey') && <span className="text-[11px] text-zinc-600 ml-auto">rê chuột để {tab === 'sankey' ? 'lọc dòng chảy' : 'soi chòm'} · bấm node để mở trang</span>}
      </div>
      <div ref={wrap} className="flex-1 min-h-0 relative">
        <canvas ref={cv} onClick={onClick} onMouseMove={onMove} onMouseLeave={() => { hoverRef.current = null; setHoverTip(null) }} className="w-full h-full block cursor-pointer" />
        {hoverTip && <div className="pointer-events-none fixed z-30 rounded-md bg-[#10101a] border border-white/15 px-2 py-1 text-[11px] text-zinc-200 max-w-[260px] truncate" style={{ left: hoverTip.x + 12, top: hoverTip.y + 12 }}>{hoverTip.text}</div>}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 px-4 py-2 border-t border-[var(--hud-line)] shrink-0">
        {DIM6.map(d => <span key={d} className="flex items-center gap-1.5 text-[10px] text-zinc-400"><span className="w-2.5 h-2.5 rounded-full" style={{ background: DIM_COLOR[d] }} />{DIM_LABEL[d]}</span>)}
        <span className="ml-auto flex items-center gap-3">{LAYERS.map(l => <span key={l} className="flex items-center gap-1.5 text-[10px] text-zinc-400"><span className="w-2.5 h-2.5 rounded-full" style={{ background: LAYER_C[l] }} />{LAYER_NAME[l]}</span>)}</span>
      </div>
    </div>
  )
}
