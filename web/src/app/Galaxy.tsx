'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
// 3D dùng Three.js → chỉ tải khi mở (ssr:false), không phình app chính
const Graph3D = dynamic(() => import('./Graph3D'), { ssr: false, loading: () => <div className="absolute inset-0 z-20 grid place-items-center bg-[#06060c] text-zinc-500 text-sm">Đang dựng bộ não 3D…</div> })
import ErrorBoundary from './ErrorBoundary'

export type GNode = { id: string; title: string | null; kind: string; parent_id: string | null; layer?: string; event_date?: string | null; subtype?: string | null; icon?: string | null; emotion?: string | null }
// icon hiển thị trong node (ưu tiên icon riêng → suy theo loại)
const KIND_ICON: Record<string, string> = { kho: '📦', folder: '📁', page: '📄', note: '📝', database: '🗂️' }
function nodeIcon(n: GNode): string { return n.icon || KIND_ICON[n.kind] || '•' }
// màu theo ĐỘ SÂU từ node đang chọn (gần = sáng nóng → xa = nguội mờ)
const DEPTH_COLOR = ['#ffffff', '#f5b942', '#22d3ee', '#a78bfa', '#6366f1', '#475569']
const depthColorOf = (d: number) => DEPTH_COLOR[Math.min(d, DEPTH_COLOR.length - 1)]
// 🌈 màu theo CẢM XÚC (thang Hawkins): node sáng dần khi user đi lên — thấy hành trình chuyển hoá. Khớp EMO_SCALE ở PageFrame.
const EMO_COLOR: Record<string, string> = {
  '😣 đau/sợ': '#e23b3b', '😤 tức': '#f0673a', '🌫️ hoài nghi': '#c08a3a', '🔥 thôi thúc': '#f5b942',
  '😌 nhẹ nhõm': '#5fbf6b', '💗 yêu thương': '#34d399', '😮 vỡ oà': '#60a5fa', '🙏 thanh thản': '#a78bfa', '✨ tỉnh thức': '#f6f8ff',
}
const emoColorOf = (e?: string | null) => (e ? EMO_COLOR[e] : undefined)
export type GLink = { from_node: string; to_node: string; dimension: string | null }

type P = { x: number; y: number; r: number; color: string; node: GNode; phase: number }

const COLOR: Record<string, string> = { kho: '#ffffff', folder: '#22d3ee', page: '#c4b5fd', database: '#fbbf24', note: '#94a3b8', block: '#34d399' }
const SIZE: Record<string, number> = { kho: 12, folder: 7, page: 7, database: 7, note: 4, block: 3 }
export const DIM_COLOR: Record<string, string> = {
  knowledge: '#22d3ee', experience: '#f472b6', emotion: '#fbbf24', values: '#a78bfa',
  people: '#34d399', time: '#60a5fa', reference: '#e879f9', anchor: '#f87171',
}
const DIM_LABEL: Record<string, string> = {
  knowledge: 'Kiến thức', experience: 'Trải nghiệm', emotion: 'Cảm xúc', values: 'Giá trị',
  people: 'Con người', time: 'Thời gian', reference: 'Tham chiếu', anchor: 'Neo',
}
type Motion = 'drift' | 'pulse' | 'still'
type Mode = 'galaxy' | 'mandala' | 'radar' | 'timeline' | 'neuro' | 'rings'
// 🪐 3 VÒNG ĐỒNG TÂM — màu nền mỗi ring (cá nhân cyan sống ở lõi → QNET tím → nhân loại hồng)
const RING_HUE: Record<string, number> = { personal: 188, corporate: 266, humanity: 312 }
const RING_TINT: Record<string, string> = { personal: '#22d3ee', corporate: '#a78bfa', humanity: '#e879f9' }
const RING_NAME: Record<string, string> = { personal: 'ĐỜI TÔI', corporate: 'QNET', humanity: 'NHÂN LOẠI' }
// 🌈 5 MÀU theo LEVEL trong mỗi kho (đồng bộ thiên hà 3D): L0 sao tâm → L1 "trái đất" → 3 màu phối → giữ màu cuối
const GAL_PAL: Record<string, { star: string; levels: string[] }> = {
  personal:  { star: '#ff5a36', levels: ['#ff7a4d', '#3b82f6', '#22d3ee', '#a78bfa', '#fde68a'] },
  corporate: { star: '#f5b942', levels: ['#ffd166', '#34d399', '#22d3ee', '#818cf8', '#f0abfc'] },
  humanity:  { star: '#e879f9', levels: ['#f0abfc', '#a78bfa', '#60a5fa', '#67e8f9', '#fca5a5'] },
}
const galLevelColor = (layer: string, level: number) => { const p = GAL_PAL[layer] ?? GAL_PAL.personal; return p.levels[Math.min(level, p.levels.length - 1)] ?? p.levels[0] }
// theme: tone trắng → nền kem cho map (2D & 3D), tone tối → nền vũ trụ
const isLightTheme = () => typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light'
const CANVAS_BG = { dark: '#0a0b14', light: '#f4f1ea' }
// thứ tự 8 trục radar theo framework
const DIM_ORDER = ['knowledge', 'experience', 'emotion', 'values', 'people', 'time', 'reference', 'anchor']

const STOP = new Set(['những', 'được', 'không', 'trong', 'với', 'của', 'cho', 'và', 'các', 'một', 'tiên', 'đang', 'ngày', 'tháng', 'đầu', 'sau', 'trước', 'cách', 'this', 'that'])

// ⚡ HẠ TẦNG VẼ TỐC ĐỘ CAO — shadowBlur trên canvas lớn khiến CPU render lại vùng mờ cho TỪNG nét
// → thay bằng sprite glow vẽ sẵn 1 lần rồi drawImage (GPU lo), nhanh hơn hàng chục lần
const _glow = new Map<string, HTMLCanvasElement>()
function withAlpha(c: string, a: number): string {
  if (c.startsWith('hsl(')) return c.replace('hsl(', 'hsla(').replace(')', `,${a})`)
  return c + Math.round(a * 255).toString(16).padStart(2, '0')
}
function glowSprite(color: string): HTMLCanvasElement {
  let s = _glow.get(color)
  if (!s) {
    s = document.createElement('canvas'); s.width = s.height = 64
    const g = s.getContext('2d')!
    const rg = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    rg.addColorStop(0, withAlpha(color, 0.6)); rg.addColorStop(0.3, withAlpha(color, 0.24)); rg.addColorStop(1, withAlpha(color, 0))
    g.fillStyle = rg; g.fillRect(0, 0, 64, 64)
    _glow.set(color, s)
  }
  return s
}
const _tw = new Map<string, number>() // cache đo bề rộng chữ (measureText đắt khi gọi mỗi frame)

export default function Galaxy({ nodes, links, onOpen, onConnect, modeReq }: {
  nodes: GNode[]; links: GLink[]
  onOpen: (n: GNode) => void
  onConnect?: (a: string, b: string) => void
  modeReq?: { mode: string; t: number; emo?: boolean } | null
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const pts = useRef<Map<string, P>>(new Map())
  const cam = useRef({ x: 0, y: 0, k: 1 })
  // tương tác kiểu Obsidian (research mũi 1): chọn node → highlight 1-hop + mũi tên hướng; kéo node giữ vị trí
  const selRef = useRef<string | null>(null)
  const burstSelRef = useRef<{ t0: number } | null>(null)
  const manualPos = useRef<Map<string, { x: number; y: number }>>(new Map())
  const nodeDrag = useRef<{ id: string; moved: boolean } | null>(null)
  const suppressClick = useRef(false)
  const hoverId = useRef<string | null>(null)
  const motionRef = useRef<Motion>('drift')
  const dimOffRef = useRef<Set<string>>(new Set())
  const flowRef = useRef(false)
  const pickRef = useRef<string | null>(null)
  const connectRef = useRef(false)
  const bursts = useRef<{ x: number; y: number; color: string; start: number }[]>([])
  const linkKeys = useRef<Set<string>>(new Set())
  const degRef = useRef<Map<string, number>>(new Map())
  const dimCountRef = useRef<Map<string, Record<string, number>>>(new Map())  // node → đếm link theo chiều
  const primaryDimRef = useRef<Map<string, string>>(new Map())                // node → trục chính (radar)
  const unplacedRef = useRef<GNode[]>([])                                     // radar: chưa có link chiều / timeline: chưa có date
  const tlMetaRef = useRef<Record<string, { pxPerMs: number; y: number; min: number }> | null>(null)
  const ringMetaRef = useRef<{ cx: number; cy: number; RING: Record<string, number>; Rmax: number } | null>(null)
  useEffect(() => { if (modeReq?.mode) { setMode(modeReq.mode as Mode); setMotion('still'); if (modeReq.emo) setEmoCol(true) } }, [modeReq]) // eslint-disable-line react-hooks/exhaustive-deps
  const tlZoomRef = useRef(1)                       // zoom THỜI GIAN quanh cột HÔM NAY (1 = thấy trọn quá khứ)
  const relayoutRef = useRef<() => void>(() => {})  // wheel gọi lại layout khi đổi time-zoom
  // 🧠 NEURO 3D: vị trí 3D + góc xoay (kéo nền để xoay, tự quay chậm)
  const p3dRef = useRef<Map<string, { x: number; y: number; z: number; r: number; hue: number; c: number }>>(new Map())
  const neuroClustersRef = useRef(0)
  const neuroOrphanRef = useRef<Set<string>>(new Set())   // trang 0 liên kết — "ký ức chưa được não kết nối", treo ở vành ngoài
  const rotRef = useRef({ a: 0.4, b: 0.25 })
  const [unplacedOpen, setUnplacedOpen] = useState(false)
  const [unplacedCount, setUnplacedCount] = useState(0)
  const panning = useRef<{ sx: number; sy: number; cx: number; cy: number } | null>(null)
  const [tip, setTip] = useState<{ x: number; y: number; title: string; kind: string; deg: number } | null>(null)
  const [motion, setMotion] = useState<Motion>('drift')
  const [mode, setMode] = useState<Mode>('galaxy')
  const [show3d, setShow3d] = useState(false)
  const [flow, setFlow] = useState(false)
  const [showIcons, setShowIcons] = useState(true)   // 🖼 icon trong node cho dễ nhìn
  const showIconsRef = useRef(true); showIconsRef.current = showIcons
  const [depthCol, setDepthCol] = useState(true)     // 🎨 màu theo độ sâu khi chọn node
  const depthColRef = useRef(true); depthColRef.current = depthCol
  const [emoCol, setEmoCol] = useState(false)        // 🌈 nhuộm node theo cảm xúc (thang Hawkins) — thấy hành trình sáng dần
  const emoColRef = useRef(false); emoColRef.current = emoCol
  const [moreModes, setMoreModes] = useState(false)  // ⋯ ẩn mode nâng cao (Mandala/Radar/Neuro) cho đỡ rối
  const [connect, setConnect] = useState(false)
  const [picked, setPicked] = useState<string | null>(null)
  const [dimOff, setDimOff] = useState<Set<string>>(new Set())
  const [zoomPct, setZoomPct] = useState(100)
  const [sugOpen, setSugOpen] = useState(false)
  motionRef.current = motion
  dimOffRef.current = dimOff
  flowRef.current = flow
  connectRef.current = connect

  // đổi view → về camera gốc cho đỡ lạc
  useEffect(() => { cam.current = { x: 0, y: 0, k: 1 }; setZoomPct(100); setUnplacedOpen(false); const ts = [400, 1200, 2400, 3800, 5200].map(ms => setTimeout(() => fitView(), ms)); return () => ts.forEach(clearTimeout) }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps

  // SỨC MẠNH NODE: càng nhiều liên kết càng to & sáng (hub tri thức)
  useEffect(() => {
    const m = new Map<string, number>()
    for (const l of links) {
      m.set(l.from_node, (m.get(l.from_node) ?? 0) + 1)
      m.set(l.to_node, (m.get(l.to_node) ?? 0) + 1)
    }
    degRef.current = m
  }, [links])

  // BÙNG NỔ khi có liên kết mới (tạo từ @, từ chế độ Nối, hay gợi ý)
  useEffect(() => {
    const keys = new Set(links.map(l => `${l.from_node}|${l.to_node}`))
    for (const k of keys) {
      if (!linkKeys.current.has(k) && linkKeys.current.size > 0) {
        const [a, b] = k.split('|')
        const pa = pts.current.get(a), pb = pts.current.get(b)
        const link = links.find(l => `${l.from_node}|${l.to_node}` === k)
        const c = DIM_COLOR[link?.dimension ?? ''] ?? '#a78bfa'
        const now = performance.now()
        if (pa) bursts.current.push({ x: pa.x, y: pa.y, color: c, start: now })
        if (pb) bursts.current.push({ x: pb.x, y: pb.y, color: c, start: now })
        if (pa && pb) bursts.current.push({ x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2, color: c, start: now + 150 })
      }
    }
    linkKeys.current = keys
  }, [links])

  useEffect(() => {
    const cv = ref.current!
    const ctx = cv.getContext('2d')!
    const baseDpr = Math.min(window.devicePixelRatio || 1, 2)
    let qual = 1            // chất lượng render: máy đuối tự hạ 1 → 0.75 → 0.5 (mượt trước, nét sau)
    let dpr = baseDpr
    let raf = 0, t = 0
    let lastNow = 0, emaDt = 16.7, frame = 0

    function layout() {
      dpr = baseDpr * qual
      cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr
      const W = cv.clientWidth, H = cv.clientHeight, cx = W / 2, cy = H / 2
      const m = new Map<string, P>()
      const ids = new Set(nodes.map(n => n.id))
      const kidsOf = (id: string) => nodes.filter(n => n.parent_id === id)
      // LEVEL trong kho = số bước parent_id tới gốc kho (kho=0) → tô màu 5-tầng
      const byIdLoc = new Map(nodes.map(n => [n.id, n]))
      const levelMemo = new Map<string, number>()
      const levelOf = (id: string, seen = new Set<string>()): number => {
        if (levelMemo.has(id)) return levelMemo.get(id)!
        const n = byIdLoc.get(id); if (!n) return 0
        if (n.kind === 'kho' || !n.parent_id || !byIdLoc.has(n.parent_id) || seen.has(n.parent_id)) { levelMemo.set(id, 0); return 0 }
        seen.add(id); const v = Math.min(5, levelOf(n.parent_id, seen) + 1); levelMemo.set(id, v); return v
      }
      let seed = 7
      const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }

      if (mode === 'mandala') {
        // 🌳 CÂY SỰ SỐNG: gốc ở ĐÁY, cành toả QUẠT RỘNG lên & sang hai bên; càng sâu càng vươn xa.
        // 3 kho = 3 cành lớn từ gốc, chia góc theo độ rậm (số lá) → tán cây cân, không dồn một cung.
        const fx = cx, fy = H * 0.95                        // gốc cây sát đáy khung
        const up = -Math.PI / 2                             // hướng vươn lên trời
        const FULL = Math.PI * 1.28                          // tổng quạt ~230° (xoè rộng thay vì 1 cung hẹp)
        const maxR = Math.min(W * 0.47, fy - 28)
        const placed = new Set<string>()
        // mỗi node CHIA ĐỀU góc cho các con tại TRUNG ĐIỂM sub-wedge của nó (cân đối, không dồn theo độ rậm)
        const place = (n: GNode, layer: string, a0: number, a1: number, depth: number) => {
          if (placed.has(n.id)) return; placed.add(n.id)
          const a = (a0 + a1) / 2
          const R = n.kind === 'kho' ? maxR * 0.12 : maxR * Math.min(1, 0.22 + depth * 0.17)   // sâu hơn = xa gốc hơn
          const col = n.kind === 'kho' ? (GAL_PAL[layer]?.star ?? COLOR.kho) : galLevelColor(layer, levelOf(n.id))
          m.set(n.id, { x: fx + Math.cos(a) * R, y: fy + Math.sin(a) * R, r: n.kind === 'kho' ? SIZE.kho : (SIZE[n.kind] ?? 4), color: col, node: n, phase: rand() * Math.PI * 2 })
          const ks = kidsOf(n.id).filter(k => (k.layer ?? 'personal') === layer && !placed.has(k.id))
          if (!ks.length) return
          const pad = (a1 - a0) * 0.08; const usable = (a1 - a0) - pad * 2; const a00 = a0 + pad
          const step = usable / ks.length   // CHIA ĐỀU mỗi con 1 lát bằng nhau → toả cân
          ks.forEach((k, i) => place(k, layer, a00 + i * step, a00 + (i + 1) * step, depth + 1))
        }
        const layerRoots = (['personal', 'corporate', 'humanity'] as const)
          .map(L => ({ L: L as string, kho: nodes.find(n => n.kind === 'kho' && (n.layer ?? 'personal') === L) }))
          .filter((x): x is { L: string; kho: GNode } => !!x.kho)
        // 3 kho = 3 MẢNG QUẠT ĐỀU NHAU (mỗi kho 1/3 tổng quạt) cho cân đối
        const wedge = FULL / layerRoots.length
        layerRoots.forEach((x, i) => { const a0 = up - FULL / 2 + i * wedge; place(x.kho, x.L, a0 + wedge * 0.05, a0 + wedge * 0.95, 1) })
        // node lạc (không nằm trong cây kho) → rải mờ ở rìa tán
        nodes.forEach(n => { if (!m.has(n.id)) { const a = up - FULL / 2 + rand() * FULL; m.set(n.id, { x: fx + Math.cos(a) * maxR * 1.04, y: fy + Math.sin(a) * maxR * 1.04, r: SIZE[n.kind] ?? 4, color: COLOR[n.kind] ?? COLOR.note, node: n, phase: rand() * Math.PI * 2 }) } })
      } else if (mode === 'radar') {
        // 🎯 RADAR 8 CHIỀU: node đậu trên trục của chiều mạnh nhất nó tham gia
        const Rmax = Math.min(W, H) * 0.40
        const Rmin = Rmax * 0.18
        const dc = new Map<string, Record<string, number>>()
        for (const l of links) {
          const d = l.dimension ?? ''; if (!DIM_COLOR[d]) continue
          for (const id of [l.from_node, l.to_node]) {
            const rec = dc.get(id) ?? {}; rec[d] = (rec[d] ?? 0) + 1; dc.set(id, rec)
          }
        }
        dimCountRef.current = dc
        const prim = new Map<string, string>()
        const axisNodes: Record<string, GNode[]> = Object.fromEntries(DIM_ORDER.map(d => [d, []]))
        const unplaced: GNode[] = []
        for (const n of nodes) {
          if (n.kind === 'kho') continue
          const rec = dc.get(n.id)
          if (!rec) { unplaced.push(n); continue }
          let best = '', bv = -1
          for (const d of DIM_ORDER) { const v = rec[d] ?? 0; if (v > bv) { bv = v; best = d } }
          if (bv <= 0) { unplaced.push(n); continue }
          prim.set(n.id, best)
          axisNodes[best].push(n)
        }
        primaryDimRef.current = prim
        unplacedRef.current = unplaced
        DIM_ORDER.forEach((d, i) => {
          const th = -Math.PI / 2 + i * Math.PI / 4
          const list = axisNodes[d].sort((a, b) => (degRef.current.get(b.id) ?? 0) - (degRef.current.get(a.id) ?? 0))
          const n2 = list.length
          list.forEach((n, k) => {
            const rk = Rmin + ((k + 0.5) / Math.max(1, n2)) * (Rmax - Rmin)
            const jit = (rand() - 0.5) * (n2 > 24 ? (k % 2 ? 60 : 28) : 44)
            m.set(n.id, {
              x: cx + Math.cos(th) * rk - Math.sin(th) * jit,
              y: cy + Math.sin(th) * rk + Math.cos(th) * jit,
              r: Math.min(14, 4 + (degRef.current.get(n.id) ?? 0) * 0.8),
              color: DIM_COLOR[d], node: n, phase: rand() * Math.PI * 2,
            })
          })
        })
      } else if (mode === 'timeline') {
        // 📜 DÒNG ĐỜI — 3 THANG THỜI GIAN RIÊNG (founder 12/6): mỗi kho một trục với min/max CỦA RIÊNG NÓ
        // → nhân loại trải hàng thế kỷ, QNET vài chục năm, đời mình vài chục năm — và đời mình chỉ là MỘT CHẤM trên dòng vô tận
        const dated = nodes.filter(n => n.event_date && n.kind !== 'kho')
        unplacedRef.current = nodes.filter(n => !n.event_date && n.kind !== 'kho' && n.kind !== 'folder')
        if (dated.length) {
          // CỘT HÔM NAY = trục tham chiếu chung: cả 3 dòng thời gian neo NOW vào CÙNG MỘT CỘT X (founder 12/6).
          // Pinch = zoom THỜI GIAN quanh cột: ra xa thấy nghìn năm, vào gần thấy từng tháng.
          const bandY: Record<string, number> = { humanity: H * 0.2, personal: H * 0.52, corporate: H * 0.82 }
          const nowTm = Date.now()
          const X_NOW = 60 + (W - 120) * 0.78
          const meta: Record<string, { pxPerMs: number; y: number; min: number }> = {}
          for (const layer of ['humanity', 'personal', 'corporate'] as const) {
            const ts = dated.filter(n => (n.layer ?? 'personal') === layer).map(n => new Date(n.event_date!).getTime())
            if (!ts.length) continue
            const mn = Math.min(...ts)
            const base = (X_NOW - 60) / Math.max(86400000, nowTm - mn) // zoom=1: mốc cổ nhất của band chạm mép trái
            meta[layer] = { pxPerMs: base * tlZoomRef.current, y: bandY[layer], min: mn }
          }
          tlMetaRef.current = Object.keys(meta).length ? meta : null
          const lanes: Record<string, number[]> = { personal: [], corporate: [], humanity: [] }
          const sorted = [...dated].sort((a, b) => new Date(a.event_date!).getTime() - new Date(b.event_date!).getTime())
          for (const n of sorted) {
            const layer = (n.layer ?? 'personal') as 'personal' | 'corporate' | 'humanity'
            const mm = meta[layer]; if (!mm) continue
            const x = X_NOW + (new Date(n.event_date!).getTime() - nowTm) * mm.pxPerMs
            const ls = lanes[layer]
            let lane = 0
            while (lane < 3 && ls[lane] !== undefined && x - ls[lane] < 56) lane++
            if (lane >= 3) lane = 0
            ls[lane] = x
            m.set(n.id, { x, y: mm.y - 26 - lane * 32, r: SIZE[n.kind] ?? 4, color: COLOR[n.kind] ?? COLOR.note, node: n, phase: rand() * Math.PI * 2 })
          }
        } else tlMetaRef.current = null
      } else if (mode === 'rings') {
        // 👁 VÕNG MẠC 3 LỚP: mỗi kho là 1 DẢI bán kính, trong dải xếp node theo LEVEL (tầng) + tán rộng → giống võng mạc con mắt
        const Rmax = Math.min(W, H) * 0.46
        const ZONE: Record<string, [number, number]> = { personal: [0.10, 0.40], corporate: [0.46, 0.70], humanity: [0.76, 1.0] }
        const RING: Record<string, number> = { personal: Rmax * 0.40, corporate: Rmax * 0.70, humanity: Rmax * 0.99 }  // biên ngoài mỗi dải (cho draw + camera)
        ringMetaRef.current = { cx, cy, RING, Rmax }
        const offset: Record<string, number> = { personal: 0, corporate: 0.8, humanity: 1.7 }
        for (const layer of ['personal', 'corporate', 'humanity']) {
          const ns = nodes.filter(n => (n.layer ?? 'personal') === layer && n.kind !== 'kho')
          const [zi, zo] = ZONE[layer]
          ns.forEach((n, i) => {
            const a = offset[layer] + (i / Math.max(1, ns.length)) * Math.PI * 2
            const lvl = levelOf(n.id)                                  // 0..5 → bán kính trong dải (tầng sâu ra ngoài)
            const fr = zi + (zo - zi) * Math.min(1, lvl / 5)
            const jit = (rand() - 0.5) * Rmax * 0.04
            const R = Rmax * fr + jit
            m.set(n.id, {
              x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R,
              r: Math.min(11, (SIZE[n.kind] ?? 5) + (degRef.current.get(n.id) ?? 0) * 0.5),
              color: galLevelColor(layer, lvl), node: n, phase: rand() * Math.PI * 2,
            })
          })
        }
      } else if (mode === 'neuro') {
        // 🧠 NEURO 3D: mỗi nhánh lớn = một "vùng não" trên mặt cầu, node rải quanh tâm vùng
        const ids2 = new Set(nodes.map(n => n.id))
        const topOf = (n: GNode): string => {
          let cur = n, guard = 0
          while (guard++ < 20) {
            const par = cur.parent_id ? nodes.find(x => x.id === cur.parent_id) : undefined
            if (!par || !ids2.has(par.id) || par.kind === 'kho') return cur.id
            cur = par
          }
          return cur.id
        }
        const clusterKeys: string[] = []
        const clusterOf = new Map<string, number>()
        for (const n of nodes) {
          const k = n.kind === 'kho' ? n.id : topOf(n)
          if (!clusterKeys.includes(k)) clusterKeys.push(k)
          clusterOf.set(n.id, clusterKeys.indexOf(k))
        }
        const R3 = Math.min(W, H) * 0.38
        const centers = clusterKeys.map((_, i) => {
          const y = 1 - 2 * (i + 0.5) / clusterKeys.length
          const rr = Math.sqrt(Math.max(0, 1 - y * y))
          const th = i * 2.39996
          return { x: Math.cos(th) * rr * R3, y: y * R3 * 0.8, z: Math.sin(th) * rr * R3 }
        })
        // ORPHAN RING (research mũi 1): trang lá 0 liên kết KHÔNG vào khối não —
        // treo ở vành ngoài như ký ức chưa được kết nối, biến view thành hành động "cần nối"
        const orphans = nodes.filter(n => (degRef.current.get(n.id) ?? 0) === 0 && n.kind !== 'kho' && n.kind !== 'folder' && n.subtype !== 'hub')
        neuroOrphanRef.current = new Set(orphans.map(o => o.id))
        unplacedRef.current = orphans
        const p3 = new Map<string, { x: number; y: number; z: number; r: number; hue: number; c: number }>()
        for (const n of nodes) {
          if (neuroOrphanRef.current.has(n.id)) { m.set(n.id, { x: cx, y: cy, r: 5, color: '#9aa3b2', node: n, phase: rand() * Math.PI * 2 }); continue }
          const ci = clusterOf.get(n.id) ?? 0
          const c = centers[ci]
          const jr = (n.kind === 'kho' ? 4 : n.kind === 'note' ? R3 * 0.34 : R3 * 0.18)
          const deg = degRef.current.get(n.id) ?? 0
          const kids2 = nodes.filter(x => x.parent_id === n.id).length
          p3.set(n.id, {
            x: c.x + (rand() - 0.5) * jr * 2, y: c.y + (rand() - 0.5) * jr * 2, z: c.z + (rand() - 0.5) * jr * 2,
            // lõi vùng TO như clip: kho = cục lớn, trang chính phình theo số con + liên kết
            r: n.kind === 'kho' ? 18 : Math.min(16, (SIZE[n.kind] ?? 4) * 0.9 + kids2 * 1.2 + Math.min(4, deg * 0.5)),
            hue: n.kind === 'kho' ? -1 : (ci * 47 + 200) % 360,
            c: ci,
          })
          // pts khởi tạo (sẽ được chiếu lại mỗi frame)
          m.set(n.id, { x: cx, y: cy, r: SIZE[n.kind] ?? 4, color: n.kind === 'kho' ? '#ffffff' : `hsl(${(ci * 47 + 200) % 360},85%,66%)`, node: n, phase: rand() * Math.PI * 2 })
        }
        p3dRef.current = p3
        neuroClustersRef.current = clusterKeys.length
      } else {
        // GALAXY: radial tree đa gốc (như cũ)
        const roots = nodes.filter(n => !n.parent_id || !ids.has(n.parent_id))
        const cnt = new Map<string, number>()
        const count = (n: GNode): number => { let s = 1; for (const k of kidsOf(n.id)) s += count(k); cnt.set(n.id, s); return s }
        roots.forEach(count)
        const depth = (n: GNode): number => { const ks = kidsOf(n.id); return ks.length ? 1 + Math.max(...ks.map(depth)) : 0 }
        const maxD = Math.max(1, ...roots.map(depth))
        const R0 = roots.length > 1 ? Math.min(W, H) * 0.16 : 0
        const step = (Math.min(W, H) * 0.46 - R0) / maxD
        const place = (n: GNode, a0: number, a1: number, d: number) => {
          const a = (a0 + a1) / 2
          const r = d === 0 ? R0 : R0 + d * step
          m.set(n.id, { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, r: SIZE[n.kind] ?? 4, color: COLOR[n.kind] ?? COLOR.note, node: n, phase: rand() * Math.PI * 2 })
          const ks = kidsOf(n.id)
          const total = ks.reduce((s, k) => s + (cnt.get(k.id) ?? 1), 0)
          let cur = a0
          for (const k of ks) { const w = ((cnt.get(k.id) ?? 1) / Math.max(1, total)) * (a1 - a0); place(k, cur, cur + w, d + 1); cur += w }
        }
        const totalAll = roots.reduce((s, r) => s + (cnt.get(r.id) ?? 1), 0)
        let cur = -Math.PI / 2
        for (const r of roots) { const w = ((cnt.get(r.id) ?? 1) / Math.max(1, totalAll)) * Math.PI * 2; place(r, cur, cur + w, 0); cur += w }
      }
      // CHỐNG NODE ĐÈ NHAU (Obsidian-style collision): vài vòng đẩy tách bằng spatial hash — gọn gàng, chỉnh chu
      if (mode === 'galaxy' || mode === 'mandala') {
        const arr = [...m.values()].filter(p => p.node.kind !== 'kho')
        for (let it = 0; it < 22; it++) {
          let moved = false
          const cell = 64
          const grid = new Map<string, P[]>()
          for (const p of arr) { const k2 = `${Math.floor(p.x / cell)},${Math.floor(p.y / cell)}`; const b = grid.get(k2); if (b) b.push(p); else grid.set(k2, [p]) }
          for (const p of arr) {
            const cgx = Math.floor(p.x / cell), cgy = Math.floor(p.y / cell)
            for (let gx = cgx - 1; gx <= cgx + 1; gx++) for (let gy = cgy - 1; gy <= cgy + 1; gy++) {
              const bucket = grid.get(`${gx},${gy}`); if (!bucket) continue
              for (const q of bucket) {
                if (q === p) continue
                const dx = p.x - q.x, dy = p.y - q.y
                const d2 = Math.hypot(dx, dy) || 0.01
                const minD = p.r + q.r + 8
                if (d2 < minD) {
                  const push = (minD - d2) / 2
                  p.x += dx / d2 * push; p.y += dy / d2 * push
                  q.x -= dx / d2 * push; q.y -= dy / d2 * push
                  moved = true
                }
              }
            }
          }
          if (!moved) break
        }
      }
      // vị trí user đã kéo tay (Obsidian-style) sống sót qua re-layout
      manualPos.current.forEach((pos, id) => { const p = m.get(id); if (p) { p.x = pos.x; p.y = pos.y } })
      pts.current = m
      setUnplacedCount(unplacedRef.current.length)
    }
    layout()
    relayoutRef.current = layout

    function wpos(p: P): { x: number; y: number; r: number } {
      const mo = motionRef.current
      if (mo === 'still' || p.node.kind === 'kho') return { x: p.x, y: p.y, r: p.r }
      if (mo === 'pulse') { const s = 1 + Math.sin(t * 0.03 + p.phase) * 0.18; return { x: p.x, y: p.y, r: p.r * s } }
      // drift: trôi nhẹ + NHỊP THỞ (mọi node phập phồng như đang sống)
      const breathe = 1 + Math.sin(t * 0.02 + p.phase) * 0.07
      return { x: p.x + Math.sin(t * 0.012 + p.phase) * 5, y: p.y + Math.cos(t * 0.009 + p.phase * 1.7) * 5, r: p.r * breathe }
    }
    const S = (v: number) => v * cam.current.k * dpr
    // semantic zoom (research): node PHÌNH CHẬM hơn không gian (k^0.55) — zoom sâu không bị cục bự choán màn
    const SR = (v: number) => v * Math.pow(cam.current.k, 0.55) * dpr
    const SX = (x: number) => (x * cam.current.k + cam.current.x) * dpr
    const SY = (y: number) => (y * cam.current.k + cam.current.y) * dpr
    const qpt = (tt: number, ax: number, ay: number, px: number, py: number, bx: number, by: number) => ({
      x: (1 - tt) * (1 - tt) * ax + 2 * (1 - tt) * tt * px + tt * tt * bx,
      y: (1 - tt) * (1 - tt) * ay + 2 * (1 - tt) * tt * py + tt * tt * by,
    })

    function draw() {
      // thời gian THẬT (không đếm frame) — máy chậm/nhanh nhịp vẫn đều; đồng thời đo FPS để tự hạ chất lượng
      const nowMs = performance.now()
      const dtMs = lastNow ? Math.min(50, nowMs - lastNow) : 16.7
      if (lastNow) emaDt = emaDt * 0.92 + (nowMs - lastNow) * 0.08
      lastNow = nowMs
      t = nowMs * 0.06
      frame++
      if (frame % 30 === 0 && emaDt > 26 && qual > 0.5) { qual -= 0.25; layout() }
      let nBeat = 0, nFireCl = -1, nFire = 0  // nhịp tim + vùng đang "firing"
      ctx.clearRect(0, 0, cv.width, cv.height)
      // nền ĐẶC theo theme: tone tối = vũ trụ, tone trắng = nền kem (đổ đầy mỗi frame → không bao giờ blank)
      const light = isLightTheme()
      ctx.fillStyle = light ? CANVAS_BG.light : CANVAS_BG.dark; ctx.fillRect(0, 0, cv.width, cv.height)
      // ════════ 🪐 3 VÒNG ĐỒNG TÂM — entanglement rings, đập theo nhịp tim ════════
      if (mode === 'rings' && ringMetaRef.current) {
        const { cx: wcx, cy: wcy, RING, Rmax } = ringMetaRef.current
        const csx = SX(wcx), csy = SY(wcy), k = cam.current.k * dpr
        // ❤️ NHỊP TIM lub-dub (~1.4s): bừng sáng rồi hạ — 0.55→1.0
        const period = 140, ph = (t % period) / period
        const beat = 0.55 + 0.45 * (Math.exp(-Math.pow((ph - 0.10) / 0.05, 2)) + 0.6 * Math.exp(-Math.pow((ph - 0.27) / 0.06, 2)))
        const hash = (i: number, s: number) => { const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x) }
        // nền hư không + bụi sao mờ
        const bg = ctx.createRadialGradient(csx, csy, 0, csx, csy, Math.max(cv.width, cv.height) * 0.7)
        if (light) { bg.addColorStop(0, 'rgba(167,139,250,0.10)'); bg.addColorStop(1, 'rgba(244,241,234,0)') }
        else { bg.addColorStop(0, 'rgba(20,16,34,0.55)'); bg.addColorStop(1, 'rgba(6,6,12,0)') }
        ctx.fillStyle = bg; ctx.fillRect(0, 0, cv.width, cv.height)
        for (let i = 0; i < 90; i++) {
          const sx2 = hash(i, 1) * cv.width, sy2 = hash(i, 2) * cv.height
          ctx.fillStyle = `rgba(255,255,255,${(0.04 + hash(i, 3) * 0.10) * beat})`
          ctx.fillRect(sx2, sy2, dpr, dpr)
        }
        const LAYERS3 = ['personal', 'corporate', 'humanity'] as const
        // ── vành hạt mỗi ring ──
        LAYERS3.forEach((layer, ri) => {
          const R = RING[layer]; if (!R) return
          const Rs = R * k
          const N = Math.round((170 + ri * 150) * qual)   // mật độ vừa — mịn nhưng nhẹ (chống lag/crash)
          const baseHue = RING_HUE[layer]
          const rot = t * 0.00035 * (ri % 2 ? -1 : 1)
          const bandPx = R * 0.13 * k
          for (let i = 0; i < N; i++) {
            const a = (i / N) * Math.PI * 2 + rot + hash(i, ri) * 0.04
            const g = hash(i, ri * 7 + 3) * 2 - 1
            const band = Math.sign(g) * Math.pow(Math.abs(g), 1.5) * bandPx + (hash(i, ri + 9) > 0.94 ? (hash(i, ri) - 0.5) * bandPx * 2.2 : 0)
            const px = csx + Math.cos(a) * (Rs + band), py = csy + Math.sin(a) * (Rs + band)
            if (px < -20 || px > cv.width + 20 || py < -20 || py > cv.height + 20) continue
            const tw = 0.3 + 0.65 * hash(i, ri * 3 + 1)
            const fade = 1 - Math.min(1, Math.abs(band) / (bandPx * 1.25)) * 0.65
            const hue = baseHue + Math.sin(a * 3 + ri * 1.3) * 30
            ctx.fillStyle = `hsla(${hue},88%,${58 + tw * 22}%,${(tw * fade * beat).toFixed(3)})`
            const bright = hash(i, ri * 5 + 2) > 0.9
            if (bright) { const s = glowSprite(`hsl(${hue},88%,68%)`); const sg = 3.2 * dpr; ctx.globalAlpha = tw * beat; ctx.drawImage(s, px - sg, py - sg, sg * 2, sg * 2); ctx.globalAlpha = 1 }
            ctx.fillRect(px, py, (bright ? 1.8 : 1) * dpr, (bright ? 1.8 : 1) * dpr)
          }
          // tên ring (mờ, ở mép phải)
          ctx.fillStyle = `hsla(${baseHue},70%,72%,${0.5 * beat + 0.2})`
          ctx.font = `${9 * dpr}px var(--font-geist-mono), monospace`; ctx.textAlign = 'left'
          ctx.fillText(RING_NAME[layer], csx + Rs + 8 * dpr, csy - 2 * dpr)
        })
        // ── điểm nối ENTANGLEMENT: link nối 2 kho khác nhau → tia sáng giữa 2 ring ──
        links.forEach(l => {
          const a = pts.current.get(l.from_node), b = pts.current.get(l.to_node)
          if (!a || !b || (a.node.layer ?? 'personal') === (b.node.layer ?? 'personal')) return
          const ax = SX(a.x), ay = SY(a.y), bx = SX(b.x), by = SY(b.y)
          // GRADIENT theo màu 2 kho → sợi mống mắt giao thoa, sáng ở giữa (con mắt thứ 3)
          const ca = a.color, cb = b.color   // theo MÀU LEVEL của 2 node (đồng bộ võng mạc)
          const grad = ctx.createLinearGradient(ax, ay, bx, by)
          grad.addColorStop(0, withAlpha(ca, 0.12 + 0.42 * beat)); grad.addColorStop(0.5, withAlpha('#f6f8ff', 0.06 + 0.16 * beat)); grad.addColorStop(1, withAlpha(cb, 0.12 + 0.42 * beat))
          // uốn lượn MỀM như tia PLASMA: cong về đồng tử + 2 sóng sin lệch pha, nhiều đoạn cho mượt
          const dd = Math.hypot(bx - ax, by - ay) || 1, nx = -(by - ay) / dd, ny = (bx - ax) / dd
          const seed = l.from_node.charCodeAt(0) + l.to_node.charCodeAt(1 % l.to_node.length)
          const SEG = 22
          const plasma = (lw: number, col: string | CanvasGradient, amp: number) => {
            ctx.strokeStyle = col; ctx.lineWidth = lw * dpr; ctx.lineCap = 'round'
            ctx.beginPath(); ctx.moveTo(ax, ay)
            for (let si = 1; si <= SEG; si++) {
              const f = si / SEG, pull = Math.sin(f * Math.PI)
              const lx = ax + (bx - ax) * f, ly = ay + (by - ay) * f
              const tx = lx + (csx - lx) * 0.3 * pull, ty = ly + (csy - ly) * 0.3 * pull
              const wave = (Math.sin(f * Math.PI * 2 + t * 0.008 + seed) + 0.5 * Math.sin(f * Math.PI * 4 - t * 0.012 + seed)) * amp * dpr * pull
              ctx.lineTo(tx + nx * wave, ty + ny * wave)
            }
            ctx.stroke()
          }
          plasma(2.6 + 1.4 * beat, withAlpha(ca, 0.05 + 0.08 * beat), 11)   // quầng plasma mờ rộng lót dưới
          plasma(0.5 + 0.5 * beat, grad, 11)                                  // lõi sáng mảnh
          // hạt sáng chạy theo nhịp (tại điểm cong giữa)
          const tt = (t * 0.004 + (seed % 9) * 0.11) % 1, pf = Math.sin(tt * Math.PI)
          const lxm = ax + (bx - ax) * tt, lym = ay + (by - ay) * tt
          const qx = lxm + (csx - lxm) * 0.26 * pf, qy = lym + (csy - lym) * 0.26 * pf
          const sg = 5 * dpr * beat; ctx.drawImage(glowSprite(tt < 0.5 ? ca : cb), qx - sg, qy - sg, sg * 2, sg * 2)
        })
        // ── ĐỒNG TỬ: tâm hội tụ phát sáng, thở theo nhịp tim (con mắt thứ 3) ──
        const pr = (16 + 10 * beat) * k * 0.7
        ctx.drawImage(glowSprite('#a78bfa'), csx - pr * 2.6, csy - pr * 2.6, pr * 5.2, pr * 5.2)
        ctx.globalAlpha = 0.9
        ctx.fillStyle = '#06060c'; ctx.beginPath(); ctx.arc(csx, csy, pr, 0, 6.28); ctx.fill()
        ctx.strokeStyle = withAlpha('#c4b5fd', 0.5 + 0.4 * beat); ctx.lineWidth = 1.4 * dpr
        ctx.beginPath(); ctx.arc(csx, csy, pr, 0, 6.28); ctx.stroke()
        ctx.fillStyle = withAlpha('#f6f8ff', 0.7 + 0.3 * beat)
        ctx.beginPath(); ctx.arc(csx - pr * 0.3, csy - pr * 0.3, pr * 0.28, 0, 6.28); ctx.fill() // ánh phản chiếu
        ctx.globalAlpha = 1
        // ── node thật = glint sáng trên vành ──
        const focusId0 = selRef.current
        const fset = focusId0 ? new Set<string>([focusId0]) : null
        if (fset) links.forEach(l => { if (l.from_node === focusId0) fset.add(l.to_node); if (l.to_node === focusId0) fset.add(l.from_node) })
        pts.current.forEach(p => {
          const px = SX(p.x), py = SY(p.y)
          if (px < -30 || px > cv.width + 30 || py < -30 || py > cv.height + 30) return
          const hot = hoverId.current === p.node.id
          const dim = fset && !fset.has(p.node.id)
          const rr = Math.max(1.4, p.r * 0.5 * k)
          const sg = (rr + 3 * dpr) * (hot ? 1.7 : 1) * (0.7 + 0.5 * beat)
          ctx.globalAlpha = dim ? 0.18 : 1
          ctx.drawImage(glowSprite(p.color), px - sg, py - sg, sg * 2, sg * 2)
          ctx.fillStyle = hot ? '#fff' : p.color
          ctx.beginPath(); ctx.arc(px, py, rr * (hot ? 1.3 : 1), 0, 6.28); ctx.fill()
          ctx.globalAlpha = 1
          // nhãn: node hover/chọn → đường dẫn + tên (kiểu ảnh tham chiếu)
          if (hot || p.node.id === focusId0) {
            const side = px > cv.width / 2 ? -1 : 1
            ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = dpr
            ctx.beginPath(); ctx.moveTo(px + side * (rr + 3 * dpr), py); ctx.lineTo(px + side * 46 * dpr, py); ctx.stroke()
            ctx.fillStyle = '#fff'; ctx.font = `${11 * dpr}px var(--font-geist-mono), monospace`
            ctx.textAlign = side > 0 ? 'left' : 'right'
            ctx.fillText((p.node.title ?? 'Trang').slice(0, 26).toUpperCase(), px + side * 50 * dpr, py + 3.5 * dpr)
          }
        })
        // ── HUD góc + tiêu đề ──
        const m2 = 14 * dpr, L = 24 * dpr
        ctx.strokeStyle = 'rgba(167,139,250,.5)'; ctx.lineWidth = 1.5 * dpr
        for (const [gx, gy, dx2, dy2] of [[m2, m2, 1, 1], [cv.width - m2, m2, -1, 1], [m2, cv.height - m2, 1, -1], [cv.width - m2, cv.height - m2, -1, -1]] as const)
          { ctx.beginPath(); ctx.moveTo(gx + dx2 * L, gy); ctx.lineTo(gx, gy); ctx.lineTo(gx, gy + dy2 * L); ctx.stroke() }
        ctx.fillStyle = 'rgba(220,210,245,.8)'; ctx.font = `bold ${10 * dpr}px var(--font-geist-mono), monospace`; ctx.textAlign = 'left'
        ctx.fillText('A.K.A.S.H — 3 VÒNG ĐỒNG TÂM · ENTANGLED', m2 + 8 * dpr, m2 + 38 * dpr)
        ctx.fillStyle = 'rgba(220,210,245,.45)'; ctx.font = `${8.5 * dpr}px var(--font-geist-mono), monospace`
        ctx.fillText(`${nodes.length} NODE · ${links.length} LIÊN KẾT · ♥ ${(beat).toFixed(2)}`, m2 + 8 * dpr, m2 + 52 * dpr)
        raf = requestAnimationFrame(draw)
        return
      }
      // 🧠 NEURO: xoay RẤT chậm để đọc được (user feedback: "quay vòng vòng không nhìn được") — kéo nền để tự xoay
      if (mode === 'neuro') {
        if (!panning.current) rotRef.current.a += 0.0006 * dtMs / 16.7
        const { a, b } = rotRef.current
        const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b)
        const W2 = cv.clientWidth, H2 = cv.clientHeight
        const f3 = Math.min(W2, H2) * 1.1
        const R3 = Math.min(W2, H2) * 0.38
        p3dRef.current.forEach((q, id) => {
          const pp = pts.current.get(id); if (!pp) return
          const x1 = q.x * ca + q.z * sa, z1 = -q.x * sa + q.z * ca
          const y2 = q.y * cb - z1 * sb, z2 = q.y * sb + z1 * cb
          const sc = f3 / (f3 + z2 + R3 * 1.7)
          pp.x = W2 / 2 + x1 * sc
          pp.y = H2 / 2 + y2 * sc
          pp.r = Math.max(1.2, q.r * sc * 1.25)
        })
        // vành mồ côi: đứng yên ngoài khối não (không xoay) — mới nhất ở vị trí 12h
        {
          const orph = [...neuroOrphanRef.current]
          const Rr = Math.min(W2, H2) * 0.465
          orph.forEach((id, i) => {
            const pp = pts.current.get(id); if (!pp) return
            const a = (i / Math.max(1, orph.length)) * Math.PI * 2 - Math.PI / 2
            pp.x = W2 / 2 + Math.cos(a) * Rr * 1.06
            pp.y = H2 / 2 + Math.sin(a) * Rr * 0.92
            pp.r = 5
          })
        }
        // ❤️ NHỊP TIM lub-dub (~1.1s): cả não phập phồng nhẹ + MỖI NHỊP một vùng bừng sáng
        const period = 130
        const ph = (t % period) / period
        nBeat = Math.exp(-Math.pow((ph - 0.08) / 0.045, 2)) + 0.55 * Math.exp(-Math.pow((ph - 0.24) / 0.05, 2))
        if (neuroClustersRef.current > 0) {
          nFireCl = Math.floor(t / period) % neuroClustersRef.current
          nFire = Math.max(0, 1 - ph * 2.0)
        }
        // nền: bụi sao tĩnh
        for (let i = 0; i < 70; i++) {
          const sx2 = ((i * 919) % 997) / 997 * cv.width, sy2 = ((i * 613) % 991) / 991 * cv.height
          ctx.fillStyle = `rgba(255,255,255,${0.05 + (i % 5) * 0.02})`
          ctx.fillRect(sx2, sy2, dpr, dpr)
        }
        // HUD khung góc kiểu neurolink
        const m2 = 14 * dpr, L = 26 * dpr
        ctx.strokeStyle = 'rgba(167,243,208,.5)'; ctx.lineWidth = 1.5 * dpr
        for (const [gx, gy, dx2, dy2] of [[m2, m2, 1, 1], [cv.width - m2, m2, -1, 1], [m2, cv.height - m2, 1, -1], [cv.width - m2, cv.height - m2, -1, -1]] as const) {
          ctx.beginPath(); ctx.moveTo(gx + dx2 * L, gy); ctx.lineTo(gx, gy); ctx.lineTo(gx, gy + dy2 * L); ctx.stroke()
        }
        ctx.fillStyle = 'rgba(167,243,208,.75)'; ctx.font = `bold ${10 * dpr}px monospace`; ctx.textAlign = 'left'
        ctx.fillText('A.K.A.S.H — NEURO LINK · CONNECTED', m2 + 8 * dpr, m2 + 38 * dpr)
        ctx.fillStyle = 'rgba(167,243,208,.4)'; ctx.font = `${8.5 * dpr}px monospace`
        ctx.fillText(`${nodes.length} NEURONS · ${links.length} SYNAPSES`, m2 + 8 * dpr, m2 + 52 * dpr)
      }
      const W = cv.clientWidth, H = cv.clientHeight
      if (mode === 'timeline') {
        const gh = ctx.createLinearGradient(0, 0, cv.width, 0)
        gh.addColorStop(0, 'rgba(96,165,250,.05)'); gh.addColorStop(1, 'rgba(34,211,238,.07)')
        ctx.fillStyle = gh; ctx.fillRect(0, 0, cv.width, cv.height)
      } else if (mode === 'mandala') {
        const gv = ctx.createLinearGradient(0, cv.height, 0, 0)
        gv.addColorStop(0, 'rgba(251,191,36,.06)'); gv.addColorStop(1, 'rgba(232,121,249,.04)')
        ctx.fillStyle = gv; ctx.fillRect(0, 0, cv.width, cv.height)
      } else if (mode === 'galaxy') {
        const g = ctx.createRadialGradient(cv.width / 2, cv.height / 2, 20, cv.width / 2, cv.height / 2, Math.min(cv.width, cv.height) * 0.55)
        g.addColorStop(0, 'rgba(139,92,246,.08)'); g.addColorStop(1, 'rgba(139,92,246,0)')
        ctx.fillStyle = g; ctx.fillRect(0, 0, cv.width, cv.height)
      }

      // 🌳 CÂY SỰ SỐNG: thiền giả dưới gốc, 3 MẢNG QUẠT đều mở lên trời, nan nối thiền giả↔tâm 3 kho
      if (mode === 'mandala') {
        const fx = W / 2, fy = H * 0.95            // gốc sát đáy (KHỚP layout)
        const Rmax = Math.min(W * 0.47, fy - 28)
        const FULL = Math.PI * 1.28, up = -Math.PI / 2
        const wedge = FULL / 3
        const layerOrder = ['personal', 'corporate', 'humanity'] as const
        // 3 mảng quạt: nền tô mờ theo màu sao kho + 2 nan biên
        layerOrder.forEach((L, i) => {
          const a0 = up - FULL / 2 + i * wedge, a1 = a0 + wedge
          const star = GAL_PAL[L].star
          const grad = ctx.createRadialGradient(SX(fx), SY(fy), 0, SX(fx), SY(fy), S(Rmax))
          grad.addColorStop(0, withAlpha(star, 0.12)); grad.addColorStop(1, withAlpha(star, 0))
          ctx.fillStyle = grad
          ctx.beginPath(); ctx.moveTo(SX(fx), SY(fy)); ctx.arc(SX(fx), SY(fy), S(Rmax), a0, a1); ctx.closePath(); ctx.fill()
          ctx.strokeStyle = withAlpha(star, 0.18); ctx.lineWidth = 1 * dpr
          ctx.beginPath(); ctx.arc(SX(fx), SY(fy), S(Rmax * 0.99), a0, a1); ctx.stroke()
        })
        // NAN nối thiền giả → tâm mỗi kho (đường sáng có hạt chạy lên), khắc phục "con người chưa nối tâm kho"
        layerOrder.forEach(L => {
          const kho = nodes.find(n => n.kind === 'kho' && (n.layer ?? 'personal') === L); if (!kho) return
          const p = pts.current.get(kho.id); if (!p) return
          const star = GAL_PAL[L].star
          ctx.strokeStyle = withAlpha(star, 0.5); ctx.lineWidth = 1.6 * dpr
          ctx.beginPath(); ctx.moveTo(SX(fx), SY(fy)); ctx.lineTo(SX(p.x), SY(p.y)); ctx.stroke()
          const tt = (t * 0.006) % 1
          const gx2 = fx + (p.x - fx) * tt, gy2 = fy + (p.y - fy) * tt
          ctx.drawImage(glowSprite(star), SX(gx2) - 7 * dpr, SY(gy2) - 7 * dpr, 14 * dpr, 14 * dpr)
        })
        // hào quang + thiền giả thở
        const breathe = 1 + Math.sin(t * 0.02) * 0.06
        const halo = ctx.createRadialGradient(SX(fx), SY(fy), 0, SX(fx), SY(fy), S(Rmax * 0.14))
        halo.addColorStop(0, 'rgba(251,191,36,.2)'); halo.addColorStop(1, 'rgba(251,191,36,0)')
        ctx.fillStyle = halo
        ctx.beginPath(); ctx.arc(SX(fx), SY(fy), S(Rmax * 0.14), 0, 6.28); ctx.fill()
        ctx.font = `${38 * cam.current.k * breathe * dpr}px serif`
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText('🧘', SX(fx), SY(fy))
        ctx.textBaseline = 'alphabetic'
      }

      // 🎯 RADAR: bát giác neon + trục màu + xung điện + nhãn trục
      if (mode === 'radar') {
        const Rmax = Math.min(W, H) * 0.40, Rmin = Rmax * 0.18
        const cx = W / 2, cy = H / 2
        for (const f of [0.25, 0.5, 0.75, 1]) {
          ctx.beginPath()
          DIM_ORDER.forEach((_, i) => {
            const th = -Math.PI / 2 + i * Math.PI / 4
            const x = SX(cx + Math.cos(th) * Rmax * f), y = SY(cy + Math.sin(th) * Rmax * f)
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
          })
          ctx.closePath()
          if (f === 1) { ctx.strokeStyle = 'rgba(167,139,250,.34)'; ctx.lineWidth = 1.5 * dpr }
          else { ctx.strokeStyle = 'rgba(167,139,250,.10)'; ctx.lineWidth = 1 * dpr }
          ctx.stroke()
        }
        DIM_ORDER.forEach((d, i) => {
          const th = -Math.PI / 2 + i * Math.PI / 4
          const off = dimOffRef.current.has(d)
          ctx.globalAlpha = off ? 0.15 : 1
          ctx.strokeStyle = DIM_COLOR[d] + '55'; ctx.lineWidth = 1 * dpr
          ctx.beginPath()
          ctx.moveTo(SX(cx + Math.cos(th) * Rmin), SY(cy + Math.sin(th) * Rmin))
          ctx.lineTo(SX(cx + Math.cos(th) * Rmax), SY(cy + Math.sin(th) * Rmax))
          ctx.stroke()
          if (!off) for (let j = 0; j < 2; j++) {
            const f = ((t * 0.004) + j / 2 + i * 0.11) % 1
            const rr = Rmin + f * (Rmax - Rmin)
            const px2 = SX(cx + Math.cos(th) * rr), py2 = SY(cy + Math.sin(th) * rr)
            ctx.drawImage(glowSprite(DIM_COLOR[d]), px2 - 6 * dpr, py2 - 6 * dpr, 12 * dpr, 12 * dpr)
            ctx.fillStyle = DIM_COLOR[d]
            ctx.beginPath(); ctx.arc(px2, py2, 1.8 * dpr, 0, 6.28); ctx.fill()
          }
          const lx = SX(cx + Math.cos(th) * (Rmax + 34)), ly = SY(cy + Math.sin(th) * (Rmax + 34))
          ctx.fillStyle = off ? '#52525b' : DIM_COLOR[d]
          ctx.font = `bold ${11.5 * dpr}px var(--font-geist-mono), monospace`; ctx.textAlign = 'center'
          ctx.fillText(DIM_LABEL[d], lx, ly)
          const cnt = [...primaryDimRef.current.values()].filter(v => v === d).length
          ctx.fillStyle = '#71717a'; ctx.font = `${9.5 * dpr}px var(--font-geist-mono), monospace`
          ctx.fillText(`(${cnt})`, lx, ly + 13 * dpr)
          ctx.globalAlpha = 1
        })
        const g2 = ctx.createRadialGradient(SX(cx), SY(cy), 0, SX(cx), SY(cy), S(Rmin))
        g2.addColorStop(0, 'rgba(255,255,255,.12)'); g2.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(SX(cx), SY(cy), S(Rmin), 0, 6.28); ctx.fill()
        ctx.fillStyle = '#cbd5e1'; ctx.font = `bold ${14 * dpr}px var(--font-geist-mono), monospace`; ctx.textAlign = 'center'
        ctx.fillText(String(links.length), SX(cx), SY(cy) + 5 * dpr)
        ctx.fillStyle = '#71717a'; ctx.font = `${8.5 * dpr}px var(--font-geist-mono), monospace`
        ctx.fillText('liên kết', SX(cx), SY(cy) + 17 * dpr)
      }
      // 📜 DÒNG ĐỜI — CỘT HÔM NAY là trục tham chiếu chung, 3 dòng thời gian neo vào cùng một cột
      if (mode === 'timeline' && tlMetaRef.current) {
        const metas = tlMetaRef.current
        const BAND_STYLE: Record<string, { label: string; color: string; sub: string }> = {
          humanity: { label: '♾ NHÂN LOẠI', color: '#a78bfa', sub: 'dòng thời gian vô tận' },
          personal: { label: '🧠 ĐỜI TÔI', color: '#f6f8ff', sub: 'xương sống của bạn' },
          corporate: { label: '🌐 QNET', color: '#67e8f9', sub: 'dòng tổ chức' },
        }
        const nowTm = Date.now()
        const X_NOW = 60 + (W - 120) * 0.78
        // ===== CỘT HÔM NAY xuyên suốt cả 3 dòng — trục tham chiếu của mọi thời gian =====
        const fg = ctx.createLinearGradient(SX(X_NOW), 0, SX(W - 40), 0)
        fg.addColorStop(0, 'rgba(245,185,66,.06)'); fg.addColorStop(1, 'rgba(245,185,66,.01)')
        ctx.fillStyle = fg; ctx.fillRect(SX(X_NOW), SY(H * 0.06), SX(W - 40) - SX(X_NOW), SY(H * 0.92) - SY(H * 0.06))
        ctx.strokeStyle = 'rgba(245,185,66,.16)'; ctx.lineWidth = 5 * dpr
        ctx.beginPath(); ctx.moveTo(SX(X_NOW), SY(H * 0.07)); ctx.lineTo(SX(X_NOW), SY(H * 0.92)); ctx.stroke()
        ctx.strokeStyle = 'rgba(245,185,66,.6)'; ctx.lineWidth = 1.5 * dpr
        ctx.setLineDash([7 * dpr, 5 * dpr])
        ctx.beginPath(); ctx.moveTo(SX(X_NOW), SY(H * 0.07)); ctx.lineTo(SX(X_NOW), SY(H * 0.92)); ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = '#f5b942'; ctx.font = `bold ${10 * dpr}px monospace`; ctx.textAlign = 'center'
        ctx.fillText('◆ HÔM NAY', SX(X_NOW), SY(H * 0.05))
        ctx.font = `${8.5 * dpr}px monospace`
        ctx.fillStyle = 'rgba(148,163,184,.55)'; ctx.textAlign = 'right'
        ctx.fillText('◂ QUÁ KHỨ — chuyển hoá bài học', SX(X_NOW) - 10 * dpr, SY(H * 0.05))
        ctx.fillStyle = 'rgba(245,185,66,.7)'; ctx.textAlign = 'left'
        ctx.fillText('TƯƠNG LAI ▸', SX(X_NOW) + 10 * dpr, SY(H * 0.05))
        ctx.fillStyle = 'rgba(100,116,139,.5)'; ctx.textAlign = 'center'
        ctx.fillText(`⌥ pinch để phóng thời gian · ×${tlZoomRef.current < 10 ? tlZoomRef.current.toFixed(1) : Math.round(tlZoomRef.current)}`, SX(X_NOW), SY(H * 0.945))
        for (const [layer, mm] of Object.entries(metas)) {
          const st = BAND_STYLE[layer]
          const X = (tm: number) => X_NOW + (tm - nowTm) * mm.pxPerMs
          // spine
          ctx.strokeStyle = withAlpha(st.color, 0.12); ctx.lineWidth = 7 * dpr
          ctx.beginPath(); ctx.moveTo(SX(40), SY(mm.y)); ctx.lineTo(SX(W - 40), SY(mm.y)); ctx.stroke()
          ctx.strokeStyle = withAlpha(st.color, 0.55); ctx.lineWidth = 1.6 * dpr
          ctx.beginPath(); ctx.moveTo(SX(40), SY(mm.y)); ctx.lineTo(SX(W - 40), SY(mm.y)); ctx.stroke()
          // nhãn band
          ctx.textAlign = 'left'; ctx.font = `bold ${9 * dpr}px monospace`
          ctx.fillStyle = withAlpha(st.color, 0.9); ctx.fillText(st.label, SX(44), SY(mm.y - 44))
          ctx.font = `${7.5 * dpr}px monospace`; ctx.fillStyle = withAlpha(st.color, 0.45)
          ctx.fillText(st.sub, SX(44), SY(mm.y - 34))
          // tick năm theo mật độ px thật của band (zoom đổi → bước đổi)
          const pxPerYear = mm.pxPerMs * 31557600000 * cam.current.k
          const NICE = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000]
          const step = NICE.find(s => s * pxPerYear >= 72) ?? 2000
          const tMin = nowTm - (X_NOW - 40) / mm.pxPerMs, tMax = nowTm + (W - 40 - X_NOW) / mm.pxPerMs
          const yA = Math.ceil(new Date(tMin).getFullYear() / step) * step
          const yB = new Date(tMax).getFullYear()
          ctx.font = `${9 * dpr}px monospace`; ctx.textAlign = 'center'
          for (let y = yA; y <= yB; y += step) {
            const x = X(new Date(y, 0, 1).getTime())
            ctx.strokeStyle = 'rgba(100,116,139,.35)'; ctx.lineWidth = 1 * dpr
            ctx.beginPath(); ctx.moveTo(SX(x), SY(mm.y - 4)); ctx.lineTo(SX(x), SY(mm.y + 4)); ctx.stroke()
            ctx.fillStyle = '#64748b'; ctx.fillText(String(y), SX(x), SY(mm.y + 16))
          }
          // chấm vàng nơi cột HÔM NAY cắt spine
          ctx.drawImage(glowSprite('#f5b942'), SX(X_NOW) - 9 * dpr, SY(mm.y) - 9 * dpr, 18 * dpr, 18 * dpr)
          ctx.fillStyle = '#f5b942'; ctx.beginPath(); ctx.arc(SX(X_NOW), SY(mm.y), 2.4 * dpr, 0, 6.28); ctx.fill()
          // "đời bạn = MỘT CHẤM của vô tận" trên band nhân loại
          if (layer === 'humanity' && metas.personal) {
            const xa = Math.max(SX(40), SX(X(metas.personal.min)))
            const xb = Math.max(SX(X_NOW), xa + 3 * dpr)
            ctx.strokeStyle = 'rgba(245,185,66,.9)'; ctx.lineWidth = 3.5 * dpr; ctx.lineCap = 'round'
            ctx.beginPath(); ctx.moveTo(xa, SY(mm.y)); ctx.lineTo(xb, SY(mm.y)); ctx.stroke()
            ctx.fillStyle = 'rgba(245,185,66,.85)'; ctx.font = `${8 * dpr}px monospace`; ctx.textAlign = 'right'
            ctx.fillText('◆ đời bạn — một chấm của vô tận', SX(X_NOW) - 8 * dpr, SY(mm.y - 8))
          }
        }
        // chân mốc rơi xuống ĐÚNG spine của kho mình
        pts.current.forEach(pp => {
          const mm = metas[(pp.node.layer ?? 'personal')]; if (!mm) return
          const st = BAND_STYLE[(pp.node.layer ?? 'personal')]
          ctx.strokeStyle = withAlpha(st.color, 0.2); ctx.lineWidth = 1
          ctx.beginPath(); ctx.moveTo(SX(pp.x), SY(pp.y)); ctx.lineTo(SX(pp.x), SY(mm.y)); ctx.stroke()
          ctx.fillStyle = withAlpha(st.color, 0.8)
          ctx.beginPath(); ctx.arc(SX(pp.x), SY(mm.y), 2 * dpr, 0, 6.28); ctx.fill()
        })
      }

      // CONTAINS = thẳng, mờ (trong mandala = cành cây)
      pts.current.forEach(p => {
        if (!p.node.parent_id) return
        const par = pts.current.get(p.node.parent_id); if (!par) return
        const a = wpos(par), b = wpos(p)
        ctx.strokeStyle = mode === 'mandala' ? 'rgba(52,211,153,.22)' : 'rgba(150,150,185,.18)'
        ctx.lineWidth = Math.max(0.5, 0.7 * cam.current.k) * dpr
        ctx.beginPath(); ctx.moveTo(SX(a.x), SY(a.y)); ctx.lineTo(SX(b.x), SY(b.y)); ctx.stroke()
      })

      // LINKS cong màu theo chiều + DÒNG NĂNG LƯỢNG
      const hv = hoverId.current
      links.forEach((l, li) => {
        const d = l.dimension ?? ''
        if (dimOffRef.current.has(d)) return
        if (mode === 'timeline') {
          const hotTL = hv && (l.from_node === hv || l.to_node === hv)
          if (d !== 'time' && !hotTL) return // dòng đời sạch: mặc định chỉ chiều thời gian
        }
        const a0 = pts.current.get(l.from_node), b0 = pts.current.get(l.to_node); if (!a0 || !b0) return
        const a = wpos(a0), b = wpos(b0)
        const ax = SX(a.x), ay = SY(a.y), bx = SX(b.x), by = SY(b.y)
        const mx = (ax + bx) / 2, my = (ay + by) / 2, dx = bx - ax, dy = by - ay
        const px = mx - dy * 0.2, py = my + dx * 0.2
        const c = DIM_COLOR[d] ?? '#a78bfa'
        const sel2 = selRef.current
        const hot = (hv && (l.from_node === hv || l.to_node === hv)) || (!!sel2 && (l.from_node === sel2 || l.to_node === sel2))
        const dim = (hv || sel2) && !hot
        // vùng đang firing → dây thuộc vùng đó bừng sáng theo nhịp tim
        let fireL = 0
        if (mode === 'neuro' && nFireCl >= 0) {
          const qa = p3dRef.current.get(l.from_node), qb = p3dRef.current.get(l.to_node)
          if ((qa && qa.c === nFireCl) || (qb && qb.c === nFireCl)) fireL = nFire
        }
        ctx.strokeStyle = c + (hot ? 'ee' : dim ? '22' : fireL > 0.15 ? 'e8' : mode === 'neuro' ? '52' : flowRef.current ? '55' : '88')
        ctx.lineWidth = ((hot ? 2.4 : 1.3) + fireL * 1.3) * Math.max(0.6, cam.current.k) * dpr
        // dòng chảy: dây thành mạch điện — gạch sáng trôi dọc dây (trừ neuro: dây uốn lượn riêng)
        if (flowRef.current && !dim && mode !== 'neuro') {
          ctx.setLineDash([6 * dpr, 10 * dpr])
          ctx.lineDashOffset = -(t * 0.9 + li * 7) * dpr
        }
        if (mode === 'neuro') {
          // 🧠 dây THẦN KINH: đa khúc, 2 tầng sóng sin, đung đưa chậm như sợi axon sống
          const dist = Math.hypot(bx - ax, by - ay) || 1
          const amp = Math.min(46 * dpr, dist * 0.11)
          const nx2 = -(by - ay) / dist, ny2 = (bx - ax) / dist
          ctx.beginPath(); ctx.moveTo(ax, ay)
          const segs = 10
          for (let si = 1; si <= segs; si++) {
            const f2 = si / segs
            const env = Math.sin(f2 * Math.PI) // phình giữa, bám chặt 2 đầu
            const off = Math.sin(f2 * Math.PI * 2 + li * 1.7 + t * 0.012) * amp * 0.62 * env
                      + Math.sin(f2 * Math.PI * 5 + li * 2.3 + t * 0.007) * amp * 0.26 * env
            ctx.lineTo(ax + (bx - ax) * f2 + nx2 * off, ay + (by - ay) * f2 + ny2 * off)
          }
          // firing: lót nét rộng mờ bên dưới (path còn nguyên nên stroke 2 lần được)
          if (fireL > 0.15) {
            const lw = ctx.lineWidth, ss = ctx.strokeStyle as string
            ctx.lineWidth = lw + 7 * dpr * fireL; ctx.strokeStyle = withAlpha(c, 0.28 * fireL)
            ctx.stroke()
            ctx.lineWidth = lw; ctx.strokeStyle = ss
          }
          ctx.stroke()
          // ⚡ action potential: xung trắng phóng từ đầu→cuối sợi trong lúc vùng firing
          if (fireL > 0.12) {
            const f2 = Math.min(1, (1 - fireL) * 1.7)
            const env2 = Math.sin(f2 * Math.PI)
            const off2 = Math.sin(f2 * Math.PI * 2 + li * 1.7 + t * 0.012) * amp * 0.62 * env2
                       + Math.sin(f2 * Math.PI * 5 + li * 2.3 + t * 0.007) * amp * 0.26 * env2
            const pxp = ax + (bx - ax) * f2 + nx2 * off2, pyp = ay + (by - ay) * f2 + ny2 * off2
            const sg = (3 + fireL * 4) * 2.4 * dpr
            ctx.drawImage(glowSprite(c), pxp - sg, pyp - sg, sg * 2, sg * 2)
            ctx.fillStyle = '#fff'
            ctx.beginPath(); ctx.arc(pxp, pyp, (2 + fireL * 1.6) * dpr, 0, 6.28); ctx.fill()
          }
        } else {
          ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(px, py, bx, by); ctx.stroke()
          // MŨI TÊN HƯỚNG (vector): chỉ khi link đang sáng — thấy ngay "nó về đâu" (from → to)
          if (hot) {
            const tq = qpt(0.9, ax, ay, px, py, bx, by)
            const ang = Math.atan2(by - tq.y, bx - tq.x)
            const pull = SR(b.r) + 3 * dpr
            const tipX = bx - Math.cos(ang) * pull, tipY = by - Math.sin(ang) * pull
            const as2 = 6.5 * dpr * Math.max(0.7, Math.min(1.3, cam.current.k))
            ctx.fillStyle = c
            ctx.beginPath()
            ctx.moveTo(tipX, tipY)
            ctx.lineTo(tipX - Math.cos(ang - 0.44) * as2, tipY - Math.sin(ang - 0.44) * as2)
            ctx.lineTo(tipX - Math.cos(ang + 0.44) * as2, tipY - Math.sin(ang + 0.44) * as2)
            ctx.closePath(); ctx.fill()
          }
        }
        ctx.setLineDash([])
        // hạt năng lượng chạy dọc link
        if (flowRef.current || hot) {
          const nP = hot ? 3 : 2
          const fg = glowSprite(c)
          for (let i = 0; i < nP; i++) {
            const tt = ((t * 0.006) + i / nP + (li % 7) * 0.13) % 1
            const q = qpt(tt, ax, ay, px, py, bx, by)
            ctx.drawImage(fg, q.x - 7 * dpr, q.y - 7 * dpr, 14 * dpr, 14 * dpr)
            ctx.fillStyle = c
            ctx.beginPath(); ctx.arc(q.x, q.y, (hot ? 2.6 : 2) * dpr, 0, 6.28); ctx.fill()
          }
        }
      })

      // FOCUS 1-HOP: hover (neuro) hoặc CLICK CHỌN (mọi mode trừ timeline) → chỉ node + hàng xóm sáng
      const focusId = (mode === 'neuro' ? hv : null) ?? selRef.current
      let focusSet: Set<string> | null = null
      const depthMap = new Map<string, number>()   // độ sâu BFS từ node chọn (galaxy/mandala/radar)
      if (focusId && mode !== 'timeline') {
        if (mode === 'neuro') {
          focusSet = new Set([focusId])
          links.forEach(l => { if (l.from_node === focusId) focusSet!.add(l.to_node); if (l.to_node === focusId) focusSet!.add(l.from_node) })
        } else {
          depthMap.set(focusId, 0)
          let fr = [focusId]
          for (let d = 1; d <= 5 && fr.length; d++) {
            const nx: string[] = []
            for (const id of fr) for (const l of links) { const o = l.from_node === id ? l.to_node : l.to_node === id ? l.from_node : null; if (o && !depthMap.has(o)) { depthMap.set(o, d); nx.push(o) } }
            fr = nx
          }
          focusSet = new Set(depthMap.keys())
        }
      }
      const useDepth = depthColRef.current && depthMap.size > 0 && mode !== 'neuro'
      // NODES — sức mạnh theo số liên kết: hub càng nối nhiều càng to & sáng
      pts.current.forEach(p => {
        const w = wpos(p)
        const hot = hoverId.current === p.node.id
        const isPicked = pickRef.current === p.node.id
        const deg = degRef.current.get(p.node.id) ?? 0
        // neuro: node ngoài vùng focus chỉ còn là chấm mờ
        if (focusSet && !focusSet.has(p.node.id)) {
          const gx1 = SX(w.x), gy1 = SY(w.y)
          ctx.globalAlpha = 0.1
          ctx.fillStyle = p.color
          ctx.beginPath(); ctx.arc(gx1, gy1, Math.max(1.5 * dpr, SR(w.r) * 0.5), 0, 6.28); ctx.fill()
          ctx.globalAlpha = 1
          return
        }
        // neuro: orphan = vòng rỗng nét đứt lơ lửng ở rìa — bấm để mở & nối chiều đầu tiên
        if (mode === 'neuro' && neuroOrphanRef.current.has(p.node.id)) {
          const gx1 = SX(w.x), gy1 = SY(w.y)
          if (gx1 < -40 || gx1 > cv.width + 40 || gy1 < -40 || gy1 > cv.height + 40) return
          const Ro = S(5) + (hot ? 2 * dpr : 0)
          const pulse = 1 + 0.10 * Math.sin(t * 0.045 + p.phase * 9)
          ctx.globalAlpha = hot ? 1 : 0.7
          ctx.setLineDash([4 * dpr, 3 * dpr])
          ctx.strokeStyle = hot ? '#f5b942' : '#8a8f98'
          ctx.lineWidth = 1.2 * dpr
          ctx.beginPath(); ctx.arc(gx1, gy1, Ro * pulse, 0, 6.28); ctx.stroke()
          ctx.setLineDash([])
          ctx.fillStyle = 'rgba(255,255,255,.3)'
          ctx.beginPath(); ctx.arc(gx1, gy1, 1.5 * dpr, 0, 6.28); ctx.fill()
          ctx.globalAlpha = 1
          return
        }
        const power = Math.min(5, deg * 0.6)
        // neuro: nhịp tim đập vào node — vùng firing bừng sáng mạnh
        let nb = 0
        if (mode === 'neuro') {
          const q3 = p3dRef.current.get(p.node.id)
          if (q3) nb = (q3.c === nFireCl ? nFire : 0) + nBeat * 0.22
        }
        const gx0 = SX(w.x), gy0 = SY(w.y)
        // cull: node ngoài màn hình thì bỏ qua hẳn (đỡ vẽ vô ích khi zoom/xoay)
        if (gx0 < -140 * dpr || gx0 > cv.width + 140 * dpr || gy0 < -140 * dpr || gy0 > cv.height + 140 * dpr) return
        // quầng glow = sprite vẽ sẵn (thay shadowBlur)
        const emoC = emoColRef.current ? emoColorOf(p.node.emotion) : undefined
        const nodeCol = emoC ?? (useDepth ? depthColorOf(depthMap.get(p.node.id) ?? 5) : p.color)
        const glowR = SR(w.r + power) + ((p.node.kind === 'kho' ? 26 : p.node.kind === 'folder' ? 12 : 7) + Math.min(16, deg * 2) + (hot ? 10 : 0) + nb * 36) * dpr
        ctx.drawImage(glowSprite(nodeCol), gx0 - glowR, gy0 - glowR, glowR * 2, glowR * 2)
        ctx.fillStyle = nodeCol
        if (mode === 'neuro') {
          // 🧠 NEURON THẬT: soma méo hữu cơ + tua dendrite + nhân sáng
          const cxp = gx0, cyp = gy0
          const R = SR(w.r + power) * (1 + nb * 0.32) + (hot ? 2 * dpr : 0)
          // tua dendrite vẽ TRƯỚC (nằm sau thân) — hub nhiều tua, đung đưa nhẹ
          // node xa/nhỏ thì bớt tua, quá nhỏ thì bỏ (mắt không thấy, CPU vẫn tốn)
          const nDen = R < 2.5 * dpr ? 0 : p.node.kind === 'kho' ? 8 : p.r > 9 ? 6 : R < 5 * dpr ? 2 : 4
          ctx.lineCap = 'round'
          for (let di = 0; di < nDen; di++) {
            const a0 = p.phase * 2 + di * (Math.PI * 2 / nDen) + Math.sin(t * 0.012 + di * 1.3 + p.phase) * 0.09
            const lenR = R * (1.7 + (((di * 37 + (p.phase * 97 | 0)) % 10) / 10) * 1.5) * (1 + nb * 0.35)
            const bend = Math.sin(di * 2.1 + p.phase * 5) * 0.55
            const tipA = a0 + bend * 0.45
            const tipX = cxp + Math.cos(tipA) * lenR, tipY = cyp + Math.sin(tipA) * lenR
            ctx.globalAlpha = (0.4 + nb * 0.5) * (hot ? 1 : 0.85)
            ctx.strokeStyle = p.color
            // sợi thuôn: gốc dày → ngọn mảnh (2 nét chồng)
            ctx.lineWidth = Math.max(1, R * 0.22)
            ctx.beginPath(); ctx.moveTo(cxp + Math.cos(a0) * R * 0.85, cyp + Math.sin(a0) * R * 0.85)
            ctx.quadraticCurveTo(cxp + Math.cos(a0 + bend * 0.2) * lenR * 0.55, cyp + Math.sin(a0 + bend * 0.2) * lenR * 0.55, tipX, tipY)
            ctx.stroke()
            ctx.lineWidth = Math.max(0.6, R * 0.08)
            // nhánh con ở sợi chẵn (như dendrite phân nhánh)
            if (di % 2 === 0 && R > 5 * dpr) {
              const bA = a0 + bend * 0.2 + 0.55, bL = lenR * 0.45
              ctx.beginPath(); ctx.moveTo(cxp + Math.cos(a0 + bend * 0.2) * lenR * 0.55, cyp + Math.sin(a0 + bend * 0.2) * lenR * 0.55)
              ctx.lineTo(cxp + Math.cos(bA) * (lenR * 0.55 + bL), cyp + Math.sin(bA) * (lenR * 0.55 + bL))
              ctx.stroke()
            }
            // firing: đầu tua loé spark
            if (nb > 0.4) {
              ctx.fillStyle = '#fff'; ctx.globalAlpha = nb
              ctx.beginPath(); ctx.arc(tipX, tipY, 1.6 * dpr, 0, 6.28); ctx.fill()
            }
          }
          ctx.globalAlpha = 1
          // soma: blob méo hữu cơ, màng rung nhẹ theo thời gian
          ctx.beginPath()
          const NP = 12
          for (let bi = 0; bi <= NP; bi++) {
            const aa = (bi % NP) / NP * Math.PI * 2
            const wob = 1 + 0.20 * Math.sin(aa * 3 + p.phase * 7) + 0.10 * Math.sin(aa * 5 + p.phase * 13 + t * 0.025)
            const rx = cxp + Math.cos(aa) * R * wob, ry = cyp + Math.sin(aa) * R * wob
            if (bi === 0) ctx.moveTo(rx, ry); else ctx.lineTo(rx, ry)
          }
          ctx.closePath(); ctx.fill()
          // nhân neuron sáng bên trong
          ctx.fillStyle = `rgba(255,255,255,${0.35 + nb * 0.55})`
          ctx.beginPath(); ctx.arc(cxp + R * 0.12, cyp - R * 0.1, R * 0.34, 0, 6.28); ctx.fill()
        } else {
          ctx.beginPath(); ctx.arc(gx0, gy0, SR(w.r + power) * (1 + nb * 0.32) + (hot ? 2 * dpr : 0), 0, 6.28); ctx.fill()
        }
        // neuro: lõi vùng to có quầng plasma (sprite cache — không tạo gradient mỗi frame)
        if (mode === 'neuro' && (p.node.kind === 'kho' || p.r > 9)) {
          const hr = SR(w.r + power) * (2.6 + nb)
          ctx.globalAlpha = nb > 0.3 ? 0.62 : 0.38
          ctx.drawImage(glowSprite(p.color), gx0 - hr, gy0 - hr, hr * 2, hr * 2)
          ctx.globalAlpha = 1
        }
        if (mode === 'neuro' && nb > 0.4) {
          ctx.fillStyle = `rgba(255,255,255,${Math.min(0.95, nb)})`
          ctx.beginPath(); ctx.arc(SX(w.x), SY(w.y), SR(w.r) * 0.45, 0, 6.28); ctx.fill()
        }
        // hub mạnh (≥4 liên kết): vầng hào quang thở
        if (deg >= 4) {
          const breathe = 1 + Math.sin(t * 0.025 + p.phase) * 0.25
          ctx.strokeStyle = p.color + '44'
          ctx.lineWidth = 1 * dpr
          ctx.beginPath(); ctx.arc(SX(w.x), SY(w.y), (SR(w.r + power) + 7 * dpr) * breathe, 0, 6.28); ctx.stroke()
        }
        // radar: node đa chiều → vòng cung chia theo tỷ lệ từng chiều
        if (mode === 'radar') {
          const rec = dimCountRef.current.get(p.node.id)
          if (rec) {
            const entries = DIM_ORDER.filter(d2 => (rec[d2] ?? 0) > 0)
            if (entries.length >= 2) {
              const total = entries.reduce((sum, d2) => sum + rec[d2], 0)
              let a0 = -Math.PI / 2
              for (const d2 of entries) {
                const sweep = (rec[d2] / total) * Math.PI * 2
                ctx.strokeStyle = DIM_COLOR[d2]; ctx.lineWidth = 2 * dpr
                ctx.beginPath(); ctx.arc(SX(w.x), SY(w.y), SR(w.r + power) + 5 * dpr, a0 + 0.06, a0 + sweep - 0.06); ctx.stroke()
                a0 += sweep
              }
            }
          }
        }
        if (hot || isPicked) {
          ctx.strokeStyle = isPicked ? 'rgba(251,191,36,.9)' : 'rgba(255,255,255,.5)'
          ctx.lineWidth = 1.5 * dpr
          ctx.beginPath(); ctx.arc(SX(w.x), SY(w.y), SR(w.r) + 6 * dpr + (isPicked ? Math.sin(t * 0.15) * 2 * dpr : 0), 0, 6.28); ctx.stroke()
        }
        // ⊙ vòng trắng cho node ĐANG CHỌN (kiểu ảnh tham chiếu)
        if (p.node.id === focusId && mode !== 'neuro' && !isPicked) {
          ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.5 * dpr
          ctx.beginPath(); ctx.arc(gx0, gy0, SR(w.r + power) + 9 * dpr, 0, 6.28); ctx.stroke()
        }
        // 🖼 ICON trong node — dễ nhìn & phân cấp (chỉ node đủ to; note nhỏ giữ dạng chấm)
        if (showIconsRef.current && mode !== 'neuro') {
          const Ri = SR(w.r + power)
          if (Ri > 7 * dpr) {
            ctx.font = `${Math.round(Ri * 1.25)}px serif`
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
            ctx.fillText(nodeIcon(p.node), gx0, gy0)
            ctx.textBaseline = 'alphabetic'
          }
        }
        // label: kho luôn hiện; trong mandala folder/page chỉ hiện khi zoom (đỡ rối); note khi zoom sâu
        const showLabel = p.node.kind === 'kho' ? true
          : p.node.kind === 'note' ? cam.current.k > 1.7
          : (mode === 'mandala' || mode === 'timeline') ? (cam.current.k > 1.15 || hot) : true
        if (showLabel) {
          ctx.fillStyle = hot ? '#fff' : '#cbd5e1'
          ctx.font = `${(p.node.kind === 'kho' ? 13 : 10.5) * dpr}px var(--font-geist-mono), monospace`
          const lab = (p.node.title || '').slice(0, 20)
          if (mode === 'neuro' && p.node.kind !== 'note') {
            // nhãn ĐÓNG KHUNG kiểu neurolink HUD — bề rộng chữ lấy từ cache
            ctx.font = `bold ${8.5 * dpr}px monospace`
            const labU = lab.toUpperCase()
            const twKey = ctx.font + '|' + labU
            let tw = _tw.get(twKey)
            if (tw === undefined) { tw = ctx.measureText(labU).width; _tw.set(twKey, tw) }
            const bx = SX(w.x) - tw / 2 - 5 * dpr, by = SY(w.y) + SR(w.r) + 6 * dpr
            ctx.fillStyle = 'rgba(8,8,16,.78)'
            ctx.fillRect(bx, by, tw + 10 * dpr, 14 * dpr)
            ctx.strokeStyle = p.color + '99'; ctx.lineWidth = 1
            ctx.strokeRect(bx, by, tw + 10 * dpr, 14 * dpr)
            ctx.fillStyle = hot ? '#fff' : '#d8d8e8'; ctx.textAlign = 'center'
            ctx.fillText(labU, SX(w.x), by + 10 * dpr)
          } else
          if (mode === 'mandala' && p.node.kind === 'kho') {
            // kho nằm trên trục thân cây → ghi nhãn sang phải cho thoáng
            ctx.textAlign = 'left'
            ctx.fillText(lab, SX(w.x) + SR(w.r) + 8 * dpr, SY(w.y) + 4 * dpr)
          } else {
            ctx.textAlign = 'center'
            ctx.fillText(lab, SX(w.x), SY(w.y) + SR(w.r) + 13 * dpr)
          }
        }
      })

      // "BẮN RA" khi click chọn node: vòng sóng lan trên các node hàng xóm (Obsidian-style select)
      if (burstSelRef.current && focusSet) {
        const el = (performance.now() - burstSelRef.current.t0) / 450
        if (el >= 1) burstSelRef.current = null
        else focusSet.forEach(id => {
          if (id === selRef.current) return
          const p = pts.current.get(id); if (!p) return
          const w = wpos(p)
          ctx.strokeStyle = `rgba(255,255,255,${0.55 * (1 - el)})`
          ctx.lineWidth = 1.3 * dpr
          ctx.beginPath(); ctx.arc(SX(w.x), SY(w.y), SR(w.r) + (5 + el * 24) * dpr, 0, 6.28); ctx.stroke()
        })
      }
      // BÙNG NỔ liên kết mới — vòng lan + tia sáng như game
      const now = performance.now()
      bursts.current = bursts.current.filter(bu => now - bu.start < 1100)
      for (const bu of bursts.current) {
        const age = Math.max(0, (now - bu.start) / 1000)
        if (age <= 0) continue
        const alpha = Math.max(0, 1 - age)
        const R = age * 90 * cam.current.k
        ctx.strokeStyle = bu.color + Math.round(alpha * 255).toString(16).padStart(2, '0')
        ctx.lineWidth = 2.5 * (1 - age) * dpr + 0.5
        ctx.beginPath(); ctx.arc(SX(bu.x), SY(bu.y), R * dpr, 0, 6.28); ctx.stroke()
        ctx.beginPath(); ctx.arc(SX(bu.x), SY(bu.y), R * 0.55 * dpr, 0, 6.28); ctx.stroke()
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + age * 2
          const r1 = R * 0.7, r2 = R * 1.15
          ctx.beginPath()
          ctx.moveTo(SX(bu.x + Math.cos(a) * r1 / cam.current.k), SY(bu.y + Math.sin(a) * r1 / cam.current.k))
          ctx.lineTo(SX(bu.x + Math.cos(a) * r2 / cam.current.k), SY(bu.y + Math.sin(a) * r2 / cam.current.k))
          ctx.stroke()
        }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    const onResize = () => layout()
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize) }
  }, [nodes, links, mode])

  function zoomAt(mx: number, my: number, factor: number) {
    const c = cam.current
    const k = Math.min(4, Math.max(0.35, c.k * factor))
    const wx = (mx - c.x) / c.k, wy = (my - c.y) / c.k
    c.k = k; c.x = mx - wx * k; c.y = my - wy * k
    setZoomPct(Math.round(k * 100))
  }
  // CANH KHUNG: tự đóng khung toàn bộ node vào màn — không bao giờ để "lạc ra ngoài" (blank)
  function fitView() {
    const r = ref.current?.getBoundingClientRect()
    if (!r || pts.current.size === 0) { cam.current = { x: 0, y: 0, k: 1 }; setZoomPct(100); return }
    // bbox theo PHÂN VỊ 4%–96% (bỏ node văng lẻ) → khung sát CỤM CHÍNH, không bị dồn góc vì 1-2 outlier
    const xs: number[] = [], ys: number[] = []
    pts.current.forEach(p => { xs.push(p.x); ys.push(p.y) })
    xs.sort((a, b) => a - b); ys.sort((a, b) => a - b)
    const q = (arr: number[], f: number) => arr[Math.min(arr.length - 1, Math.max(0, Math.floor(arr.length * f)))]
    const minX = q(xs, 0.04), maxX = q(xs, 0.96), minY = q(ys, 0.04), maxY = q(ys, 0.96)
    const gw = Math.max(1, maxX - minX), gh = Math.max(1, maxY - minY), pad = 90
    const k = Math.min(1.8, Math.max(0.35, Math.min((r.width - pad * 2) / gw, (r.height - pad * 2) / gh)))
    const cxw = (minX + maxX) / 2, cyw = (minY + maxY) / 2
    cam.current = { k, x: r.width / 2 - cxw * k, y: r.height / 2 - cyw * k }
    setZoomPct(Math.round(k * 100))
  }
  function resetCam() { fitView() }
  // chống lạc: giữ tâm cụm node luôn nằm trong khung (không pan/zoom mất hút)
  function clampCam() {
    const r = ref.current?.getBoundingClientRect(); if (!r || pts.current.size === 0) return
    let sx = 0, sy = 0; pts.current.forEach(p => { sx += p.x; sy += p.y })
    const cx = sx / pts.current.size, cy = sy / pts.current.size, c = cam.current
    const px = cx * c.k + c.x, py = cy * c.k + c.y, M = 80
    if (px < M) c.x += M - px; else if (px > r.width - M) c.x -= px - (r.width - M)
    if (py < M) c.y += M - py; else if (py > r.height - M) c.y -= py - (r.height - M)
  }

  function findAt(e: React.MouseEvent): P | null {
    const r = ref.current!.getBoundingClientRect()
    const c = cam.current
    const mx = (e.clientX - r.left - c.x) / c.k, my = (e.clientY - r.top - c.y) / c.k
    let best: P | null = null, bd = 999
    pts.current.forEach(p => { const d = Math.hypot(p.x - mx, p.y - my); if (d < Math.max(p.r + 9, 15) / Math.max(0.5, c.k) && d < bd) { bd = d; best = p } })
    return best
  }
  // trackpad macbook: pinch = zoom canvas TẠI CHỖ (chặn zoom trang), 2 ngón = pan — chuẩn Figma/Obsidian
  useEffect(() => {
    const cv = ref.current; if (!cv) return
    const onW = (e: WheelEvent) => {
      e.preventDefault()
      if (e.ctrlKey || e.metaKey) {
        const f = Math.min(1.25, Math.max(0.8, Math.exp(-e.deltaY * 0.012)))
        if (mode === 'timeline') {
          // dòng đời: pinch = ZOOM THỜI GIAN quanh cột HÔM NAY (không phải zoom camera)
          tlZoomRef.current = Math.min(120, Math.max(1, tlZoomRef.current * f))
          relayoutRef.current()
          return
        }
        const r = cv.getBoundingClientRect()
        zoomAt(e.clientX - r.left, e.clientY - r.top, f)
      } else if (mode === 'neuro') {
        rotRef.current.a += e.deltaX * 0.002
        rotRef.current.b = Math.max(-1.2, Math.min(1.2, rotRef.current.b + e.deltaY * 0.002))
      } else {
        cam.current.x -= e.deltaX
        cam.current.y -= e.deltaY
      }
    }
    cv.addEventListener('wheel', onW, { passive: false })
    return () => cv.removeEventListener('wheel', onW)
  }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps
  function onClick(e: React.MouseEvent) {
    if (suppressClick.current) { suppressClick.current = false; return }
    if (panning.current) return
    // radar: bấm nhãn trục = soi riêng chiều đó (solo)
    if (mode === 'radar') {
      const r = ref.current!.getBoundingClientRect()
      const c = cam.current
      const mx = (e.clientX - r.left - c.x) / c.k, my = (e.clientY - r.top - c.y) / c.k
      const W2 = r.width, H2 = r.height
      const Rmax = Math.min(W2, H2) * 0.40
      for (let i = 0; i < 8; i++) {
        const th = -Math.PI / 2 + i * Math.PI / 4
        const lx = W2 / 2 + Math.cos(th) * (Rmax + 34), ly = H2 / 2 + Math.sin(th) * (Rmax + 34)
        if (Math.abs(mx - lx) < 48 && Math.abs(my - ly) < 18) {
          const d = DIM_ORDER[i]
          setDimOff(prev => {
            const others = DIM_ORDER.filter(x => x !== d)
            const isSolo = others.every(x => prev.has(x)) && !prev.has(d)
            return isSolo ? new Set() : new Set(others)
          })
          return
        }
      }
    }
    const best = findAt(e)
    if (!best) { selRef.current = null; burstSelRef.current = null; return } // click nền = bỏ chọn
    if (connectRef.current && onConnect) {
      // chế độ NỐI: chọn 2 node để tạo liên kết
      if (!pickRef.current) { pickRef.current = best.node.id; setPicked(best.node.id); return }
      if (pickRef.current !== best.node.id) {
        onConnect(pickRef.current, best.node.id)
        pickRef.current = null; setPicked(null)
      }
      return
    }
    // CHỌN node (Obsidian-style): highlight 1-hop + mũi tên hướng + sóng "bắn ra" — rồi mở peek
    selRef.current = best.node.id
    burstSelRef.current = { t0: performance.now() }
    onOpen(best.node)
  }
  function onDown(e: React.MouseEvent) {
    const hit = findAt(e)
    if (hit) {
      // KÉO NODE như Obsidian (mode 2D, không phải kho) — vị trí lưu lại, layout sau tôn trọng
      if (mode !== 'timeline' && mode !== 'neuro' && hit.node.kind !== 'kho') nodeDrag.current = { id: hit.node.id, moved: false }
      return
    }
    panning.current = mode === 'neuro'
      ? { sx: e.clientX, sy: e.clientY, cx: rotRef.current.a * 1000, cy: rotRef.current.b * 1000 }
      : { sx: e.clientX, sy: e.clientY, cx: cam.current.x, cy: cam.current.y }
  }
  function onMove(e: React.MouseEvent) {
    if (nodeDrag.current) {
      const r = ref.current!.getBoundingClientRect()
      const c = cam.current
      const wx = (e.clientX - r.left - c.x) / c.k, wy = (e.clientY - r.top - c.y) / c.k
      const p = pts.current.get(nodeDrag.current.id)
      if (p) { p.x = wx; p.y = wy; manualPos.current.set(p.node.id, { x: wx, y: wy }); nodeDrag.current.moved = true; setTip(null) }
      return
    }
    if (panning.current) {
      const p = panning.current
      if (mode === 'neuro') {
        // kéo nền = xoay khối não 3D
        rotRef.current.a = p.cx / 1000 + (e.clientX - p.sx) * 0.006
        rotRef.current.b = Math.max(-1.2, Math.min(1.2, p.cy / 1000 + (e.clientY - p.sy) * 0.006))
      } else {
        cam.current.x = p.cx + (e.clientX - p.sx)
        cam.current.y = p.cy + (e.clientY - p.sy)
        clampCam()
      }
      if (Math.hypot(e.clientX - p.sx, e.clientY - p.sy) > 4) setTip(null)
      return
    }
    const best = findAt(e)
    hoverId.current = best?.node.id ?? null
    if (best) {
      const c = cam.current
      const deg = links.filter(l => l.from_node === best.node.id || l.to_node === best.node.id).length
      setTip({ x: best.x * c.k + c.x, y: best.y * c.k + c.y - best.r * c.k - 12, title: best.node.title || 'Trang', kind: best.node.kind, deg })
    } else setTip(null)
  }
  function onUp() {
    if (nodeDrag.current) { if (nodeDrag.current.moved) suppressClick.current = true; nodeDrag.current = null }
    setTimeout(() => { panning.current = null }, 0)
  }
  function toggleDim(d: string) { setDimOff(s => { const n = new Set(s); n.has(d) ? n.delete(d) : n.add(d); return n }) }

  // GỢI Ý NỐI: 2 trang khác kho chung từ khoá tiêu đề mà chưa có liên kết
  const suggestions = useMemo(() => {
    if (!sugOpen) return []
    const existing = new Set(links.flatMap(l => [`${l.from_node}|${l.to_node}`, `${l.to_node}|${l.from_node}`]))
    const items = nodes.filter(n => n.kind === 'note' || n.kind === 'page')
    const words = (s: string) => s.toLowerCase().normalize('NFC').split(/[^a-zà-ỹ0-9]+/i).filter(w => w.length >= 4 && !STOP.has(w))
    const out: { a: GNode; b: GNode; w: string }[] = []
    const seen = new Set<string>()
    for (let i = 0; i < items.length && out.length < 4; i++) {
      for (let j = i + 1; j < items.length && out.length < 4; j++) {
        const a = items[i], b = items[j]
        if ((a.layer ?? '') === (b.layer ?? '')) continue
        if (existing.has(`${a.id}|${b.id}`)) continue
        const shared = words(a.title ?? '').find(w => words(b.title ?? '').includes(w))
        if (!shared) continue
        const key = [a.id, b.id].sort().join('|')
        if (seen.has(key)) continue
        seen.add(key)
        out.push({ a, b, w: shared })
      }
    }
    return out
  }, [sugOpen, nodes, links])

  const center = () => { const r = ref.current?.getBoundingClientRect(); return { x: (r?.width ?? 0) / 2, y: (r?.height ?? 0) / 2 } }
  return (
    <div className="relative w-full h-full select-none">
      {show3d && (
        <ErrorBoundary onError={() => setShow3d(false)} fallback={
          <div className="absolute inset-0 z-20 grid place-items-center bg-[#06060c] text-center px-8">
            <div className="max-w-sm"><div className="text-4xl mb-3">🪐</div><div className="text-zinc-200 text-base font-semibold mb-1.5">Máy này chưa bật được 3D</div><p className="text-zinc-500 text-[13px] mb-4">Dùng các chế độ 2D: Galaxy · Dòng đời · 3 Vòng.</p><button onClick={() => setShow3d(false)} className="rounded-lg ak-cta px-5 py-2 text-sm font-bold">← Về 2D</button></div>
          </div>
        }>
          <Graph3D nodes={nodes} links={links} onOpen={onOpen} onClose={() => setShow3d(false)} />
        </ErrorBoundary>
      )}
      <canvas ref={ref} onClick={onClick} onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp}
        onMouseLeave={() => { hoverId.current = null; setTip(null); panning.current = null; nodeDrag.current = null }}
        style={{ background: isLightTheme() ? CANVAS_BG.light : CANVAS_BG.dark }}
        className={`w-full h-full block ${connect ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`} />

      {tip && (
        <div className="absolute pointer-events-none -translate-x-1/2 -translate-y-full rounded-lg bg-[#1c1c26]/95 border border-white/15 px-2.5 py-1.5 shadow-xl z-10" style={{ left: tip.x, top: tip.y }}>
          <div className="text-xs font-semibold text-white whitespace-nowrap max-w-[240px] truncate">{tip.title}</div>
          <div className="text-[10px] text-zinc-400">{tip.kind === 'kho' ? 'Kho' : tip.kind === 'folder' ? 'Thư mục' : tip.kind === 'database' ? 'Bảng dữ liệu' : 'Trang'} · {tip.deg} liên kết · {connect ? (picked ? 'bấm node thứ 2 để NỐI ⚡' : 'bấm để chọn node đầu') : 'bấm để mở'}</div>
        </div>
      )}

      {/* HUD phải: mode + zoom + motion + flow + connect */}
      <div className="absolute top-3 right-3 flex flex-col items-end gap-2 z-10">
        <div className="flex items-center gap-1 rounded-md bg-[#10101a]/85 backdrop-blur border border-[var(--hud-line)] p-1 text-[11px]">
          {/* mode CHÍNH — luôn hiện */}
          <button onClick={() => setMode('galaxy')} title="Cấu trúc kho — cái gì nằm trong cái gì" className={`px-2 py-1.5 rounded-lg ${mode === 'galaxy' ? 'bg-violet-500/40 text-white' : 'text-zinc-400 hover:bg-white/10'}`}>🌌 Galaxy</button>
          <button onClick={() => { setMode('mandala'); setFlow(true) }} title="Cây Sự Sống — gốc ở đáy, cành tri thức toả rộng lên trời; sâu hơn vươn xa hơn" className={`px-2 py-1.5 rounded-lg ${mode === 'mandala' ? 'bg-amber-500/35 text-amber-100 shadow-lg shadow-amber-500/30' : 'text-zinc-400 hover:bg-white/10'}`}>🌳 Cây sự sống</button>
          <button onClick={() => { setMode('timeline'); setMotion('still') }} title="Dòng đời — tri thức đan vào mốc thời gian thực; bật 🌈 Cảm xúc để thấy hành trình sáng dần" className={`px-2 py-1.5 rounded-lg ${mode === 'timeline' ? 'bg-blue-500/35 text-blue-100 shadow-lg shadow-blue-500/30' : 'text-zinc-400 hover:bg-white/10'}`}>📜 Dòng đời</button>
          <button onClick={() => { setMode('rings'); setMotion('still') }} title="3 vòng đồng tâm — đời tôi ở lõi, QNET, nhân loại; đập theo nhịp tim" className={`px-2 py-1.5 rounded-lg ${mode === 'rings' ? 'bg-pink-500/30 text-pink-100 shadow-lg shadow-pink-500/30' : 'text-zinc-400 hover:bg-white/10'}`}>🪐 3 Vòng</button>
          <button onClick={() => setShow3d(true)} title="Bộ não 3D — xoay/zoom mọi chiều, tìm node sáng, lọc kho, chỉnh lực" className="px-2 py-1.5 rounded-lg text-zinc-400 hover:bg-white/10">🌐 3D</button>
          {/* mode NÂNG CAO — ẩn sau ⋯ cho đỡ rối */}
          {moreModes && <>
            <span className="w-px self-stretch bg-[var(--hud-line)] mx-0.5" />
            <button onClick={() => { setMode('radar'); setMotion('still'); setFlow(false); setDimOff(new Set()) }} title="8 chiều liên kết cân hay lệch — bấm trục để soi riêng" className={`px-2 py-1.5 rounded-lg ${mode === 'radar' ? 'bg-violet-500/35 text-violet-100' : 'text-zinc-400 hover:bg-white/10'}`}>🎯 Radar</button>
            <button onClick={() => { setMode('neuro'); setMotion('still'); setFlow(true) }} title="Bộ não tự xoay — kéo nền để xoay, mỗi nhánh một vùng não" className={`px-2 py-1.5 rounded-lg ${mode === 'neuro' ? 'bg-emerald-500/35 text-emerald-100 shadow-lg shadow-emerald-500/30' : 'text-zinc-400 hover:bg-white/10'}`}>🧠 Neuro</button>
          </>}
          <button onClick={() => setMoreModes(v => !v)} title={moreModes ? 'Ẩn bớt' : 'Thêm chế độ xem (Mandala / Radar / Neuro)'} className={`px-2 py-1.5 rounded-lg ${moreModes ? 'bg-white/15 text-white' : 'text-zinc-500 hover:bg-white/10'}`}>{moreModes ? '✕' : '⋯'}</button>
        </div>
        <div className="flex items-center gap-1 rounded-md bg-[#10101a]/85 backdrop-blur border border-[var(--hud-line)] p-1">
          <button onClick={() => { const c = center(); zoomAt(c.x, c.y, 1.25) }} title="Phóng to" className="w-8 h-8 grid place-items-center rounded-lg text-zinc-300 hover:bg-white/10 text-lg">＋</button>
          <button onClick={() => { const c = center(); zoomAt(c.x, c.y, 0.8) }} title="Thu nhỏ" className="w-8 h-8 grid place-items-center rounded-lg text-zinc-300 hover:bg-white/10 text-lg">−</button>
          <button onClick={resetCam} title="Về mặc định" className="w-8 h-8 grid place-items-center rounded-lg text-zinc-300 hover:bg-white/10 text-sm">⟳</button>
          <span className="text-[10px] text-zinc-500 w-10 text-center">{zoomPct}%</span>
        </div>
        {(mode === 'galaxy' || mode === 'mandala') && <div className="flex items-center gap-1 rounded-md bg-[#10101a]/85 backdrop-blur border border-[var(--hud-line)] p-1 text-[11px]">
          <span className="hud-label pl-1.5 pr-0.5">node</span>
          {([
            ['drift', 'Trôi', 'dq-prev-drift', 'Node trôi lững lờ như sao — ngắm tổng thể', 'bg-blue-500/30 text-blue-100'],
            ['pulse', 'Nhịp', 'dq-prev-pulse', 'Node phập phồng theo nhịp thở — cảm kho đang sống', 'bg-amber-500/30 text-amber-100'],
            ['still', 'Tĩnh', 'dq-prev-still', 'Đứng yên tuyệt đối — đọc vị trí chính xác', 'bg-cyan-500/30 text-cyan-100'],
          ] as const).map(([k, label, prev, tip2, act]) => (
            <button key={k} onClick={() => setMotion(k)} title={tip2} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${motion === k ? act : 'text-zinc-400 hover:bg-white/10'}`}>
              <span className={`dq-prev ${prev}`} />{label}
            </button>
          ))}
        </div>}
        <div className="flex items-center gap-1 rounded-md bg-[#10101a]/85 backdrop-blur border border-[var(--hud-line)] p-1 text-[11px]">
          <button onClick={() => setShowIcons(v => !v)} title="Bật/tắt icon trong node cho dễ nhìn" className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${showIcons ? 'bg-white/15 text-white' : 'text-zinc-400 hover:bg-white/10'}`}>🖼 Icon</button>
          <button onClick={() => setDepthCol(v => !v)} title="Chọn 1 node → tô màu các node theo độ sâu (gần sáng, xa mờ)" className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${depthCol ? 'bg-violet-500/30 text-violet-100' : 'text-zinc-400 hover:bg-white/10'}`}>🎨 Depth</button>
          <button onClick={() => setEmoCol(v => !v)} title="Nhuộm node theo cảm xúc (thang năng lượng Hawkins) — thấy hành trình sáng dần: đỏ (đau) → … → trắng (tỉnh thức)" className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${emoCol ? 'bg-amber-500/25 text-amber-100' : 'text-zinc-400 hover:bg-white/10'}`}>🌈 Cảm xúc</button>
          {(mode === 'galaxy' || mode === 'mandala') && <button onClick={() => setFlow(f => !f)} title="Hạt năng lượng chạy dọc mọi liên kết — thấy tri thức đang truyền" className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${flow ? 'bg-cyan-500/30 text-cyan-100' : 'text-zinc-400 hover:bg-white/10'}`}><span className="dq-prev-flow" />Dòng chảy</button>}
          {onConnect && <button onClick={() => { setConnect(c => !c); pickRef.current = null; setPicked(null) }} title="Bấm 2 node để tạo liên kết mới — có vụ nổ ăn mừng" className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${connect ? 'bg-amber-500/30 text-amber-100' : 'text-zinc-400 hover:bg-white/10'}`}><span className="dq-prev-link" />Nối</button>}
          <button onClick={() => setSugOpen(s => !s)} title="Máy soi cặp trang nên nối mà chưa nối" className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${sugOpen ? 'bg-violet-500/30 text-violet-100' : 'text-zinc-400 hover:bg-white/10'}`}><span className="dq-prev-sug">✨</span>Gợi ý</button>
        </div>
      </div>

      {/* trạng thái chế độ NỐI */}
      {connect && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-200 px-4 py-2 text-xs font-semibold backdrop-blur">
          ⚡ Chế độ NỐI TRI THỨC — {picked ? 'chọn node thứ 2 để tạo liên kết' : 'bấm node đầu tiên'}
        </div>
      )}

      {/* gợi ý liên kết */}
      {sugOpen && (
        <div className="absolute top-16 left-3 z-10 w-[300px] rounded-md bg-[#10101a]/92 backdrop-blur border border-[var(--hud-line)] p-3">
          <div className="hud-label mb-2">✨ Gợi ý nối tri thức <span className="normal-case">(AI thật khi nối API — tạm theo từ khoá)</span></div>
          {suggestions.length === 0 ? <p className="text-xs text-zinc-600">Chưa tìm thấy cặp nào còn thiếu — kho của bạn nối khá đủ rồi 🎉</p> : (
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <div key={i} className="rounded-xl bg-white/[0.04] border border-white/10 p-2.5">
                  <div className="text-[11px] text-zinc-300 leading-snug">“{(s.a.title ?? '').slice(0, 26)}” <span className="text-zinc-600">↔</span> “{(s.b.title ?? '').slice(0, 26)}”</div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-zinc-600">chung: “{s.w}”</span>
                    {onConnect && <button onClick={() => onConnect(s.a.id, s.b.id)} className="text-[10px] rounded-lg ak-cta px-2.5 py-1 font-bold">⚡ Nối ngay</button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* chú giải = ĐỦ 8 CHIỀU framework, đếm link, bấm để lọc */}
      <div className="absolute bottom-3 left-3 rounded-md bg-[#10101a]/88 backdrop-blur border border-[var(--hud-line)] px-3.5 py-2.5 z-10">
        <div className="flex items-center justify-between gap-4 mb-2">
          <span className="hud-label">8 chiều liên kết</span>
          {dimOff.size > 0
            ? <button onClick={() => setDimOff(new Set())} className="text-[9px] text-violet-300 hover:underline">hiện tất cả</button>
            : <span className="text-[9px] text-zinc-700">bấm để lọc</span>}
        </div>
        <div className="grid grid-cols-4 gap-1">
          {DIM_ORDER.map(d => {
            const off = dimOff.has(d)
            const cnt = links.filter(l => (l.dimension ?? '') === d).length
            return (
              <button key={d} onClick={() => toggleDim(d)} title={`${DIM_LABEL[d]} · ${cnt} liên kết`}
                className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 border-l-2 transition text-left ${off ? 'opacity-30' : cnt === 0 ? 'opacity-55' : 'hover:bg-white/5'}`}
                style={{ borderLeftColor: off ? '#444' : DIM_COLOR[d] }}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: off ? '#555' : DIM_COLOR[d], boxShadow: off || cnt === 0 ? 'none' : `0 0 6px ${DIM_COLOR[d]}` }} />
                <span className="min-w-0">
                  <span className={`block text-[9.5px] leading-tight truncate ${off ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>{DIM_LABEL[d]}</span>
                  <span className="block text-[8.5px] text-zinc-600 leading-tight">{cnt}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* node chưa vào bản đồ (radar: chưa có chiều · dòng đời: chưa có ngày) */}
      {(mode === 'radar' || mode === 'timeline' || mode === 'neuro') && unplacedCount > 0 && (
        <button onClick={() => setUnplacedOpen(o => !o)} className="absolute bottom-9 right-3 z-10 text-[10px] rounded-lg bg-[#10101a]/85 border border-white/10 px-2.5 py-1.5 text-zinc-400 hover:text-white backdrop-blur">
          ⚠ {unplacedRef.current.length} trang chưa nối — {mode === 'radar' ? 'Chuyển hoá để nối chiều' : mode === 'neuro' ? 'đang lơ lửng ở vành ngoài, bấm mở & nối' : 'mở & gắn 📅'}
        </button>
      )}
      {unplacedOpen && (mode === 'radar' || mode === 'timeline' || mode === 'neuro') && (
        <div className="absolute bottom-20 right-3 z-10 w-[280px] max-h-[320px] overflow-auto rounded-md bg-[#10101a]/92 backdrop-blur border border-[var(--hud-line)] p-3">
          <div className="hud-label mb-2">⬡ Chưa vào bản đồ — bấm để mở</div>
          <div className="space-y-1">
            {unplacedRef.current.slice(0, 20).map(n => (
              <button key={n.id} onClick={() => { setUnplacedOpen(false); onOpen(n) }} className="w-full text-left text-xs rounded-lg bg-white/[0.04] border border-white/10 px-2.5 py-1.5 text-zinc-300 hover:border-violet-400/40 truncate">{n.title || 'Trang'}</button>
            ))}
            {unplacedRef.current.length > 20 && <p className="text-[10px] text-zinc-600">+{unplacedRef.current.length - 20} trang nữa…</p>}
          </div>
        </div>
      )}
      <div className="absolute bottom-3 right-3 text-[10px] text-zinc-600 z-10">lăn: zoom · kéo nền: {mode === 'neuro' ? 'XOAY 3D' : 'pan'} · {connect ? 'bấm 2 node: nối ⚡' : mode === 'radar' ? 'bấm nhãn trục: soi riêng' : 'bấm node: mở'}</div>
    </div>
  )
}
