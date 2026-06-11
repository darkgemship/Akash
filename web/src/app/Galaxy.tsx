'use client'
import { useEffect, useMemo, useRef, useState } from 'react'

export type GNode = { id: string; title: string | null; kind: string; parent_id: string | null; layer?: string; event_date?: string | null }
export type GLink = { from_node: string; to_node: string; dimension: string | null }

type P = { x: number; y: number; r: number; color: string; node: GNode; phase: number }

const COLOR: Record<string, string> = { kho: '#ffffff', folder: '#22d3ee', page: '#f472b6', database: '#fbbf24', note: '#a78bfa', block: '#34d399' }
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
type Mode = 'galaxy' | 'mandala' | 'radar' | 'timeline' | 'neuro'
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

export default function Galaxy({ nodes, links, onOpen, onConnect }: {
  nodes: GNode[]; links: GLink[]
  onOpen: (n: GNode) => void
  onConnect?: (a: string, b: string) => void
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const pts = useRef<Map<string, P>>(new Map())
  const cam = useRef({ x: 0, y: 0, k: 1 })
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
  const tlMetaRef = useRef<{ min: number; max: number } | null>(null)
  // 🧠 NEURO 3D: vị trí 3D + góc xoay (kéo nền để xoay, tự quay chậm)
  const p3dRef = useRef<Map<string, { x: number; y: number; z: number; r: number; hue: number; c: number }>>(new Map())
  const neuroClustersRef = useRef(0)
  const rotRef = useRef({ a: 0.4, b: 0.25 })
  const [unplacedOpen, setUnplacedOpen] = useState(false)
  const [unplacedCount, setUnplacedCount] = useState(0)
  const panning = useRef<{ sx: number; sy: number; cx: number; cy: number } | null>(null)
  const [tip, setTip] = useState<{ x: number; y: number; title: string; kind: string; deg: number } | null>(null)
  const [motion, setMotion] = useState<Motion>('drift')
  const [mode, setMode] = useState<Mode>('galaxy')
  const [flow, setFlow] = useState(false)
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
  useEffect(() => { cam.current = { x: 0, y: 0, k: 1 }; setZoomPct(100); setUnplacedOpen(false) }, [mode])

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
      let seed = 7
      const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }

      if (mode === 'mandala') {
        // 🌳 CÂY SỰ SỐNG: thiền giả ngồi dưới — kho cá nhân ngay đỉnh đầu,
        // QNET rồi nhân loại mở rộng lên trên như cây quạt / tán cây
        const fx = cx, fy = H * 0.76                       // vị trí thiền giả
        const Rmax = Math.min(W * 0.46, fy - 36)           // tán ngoài cùng vừa khung
        const RING: Record<string, number> = { personal: Rmax * 0.36, corporate: Rmax * 0.66, humanity: Rmax * 0.96 }
        const span = Math.PI * 0.82                        // quạt ~148° mở lên trời
        const aMid = -Math.PI / 2
        for (const layer of ['personal', 'corporate', 'humanity']) {
          const layerNodes = nodes.filter(n => (n.layer ?? 'personal') === layer)
          if (!layerNodes.length) continue
          const kho = layerNodes.find(n => n.kind === 'kho')
          // kho = mắt cây trên trục thân, ngay "đỉnh đầu" của vòng trong nó
          if (kho) m.set(kho.id, { x: fx, y: fy - RING[layer] + Rmax * 0.05, r: SIZE.kho, color: COLOR.kho, node: kho, phase: rand() * Math.PI * 2 })
          // DFS để con đứng cạnh cha → cành toả đều
          const rest: GNode[] = []
          const roots = layerNodes.filter(n => n.id !== kho?.id && (!n.parent_id || !ids.has(n.parent_id) || n.parent_id === kho?.id || nodes.find(p => p.id === n.parent_id)?.layer !== layer))
          const walk = (n: GNode) => { rest.push(n); kidsOf(n.id).filter(k => (k.layer ?? '') === layer).forEach(walk) }
          roots.forEach(walk)
          layerNodes.forEach(n => { if (n.id !== kho?.id && !rest.includes(n)) rest.push(n) })
          const R = RING[layer]
          rest.forEach((n, i) => {
            // trải đều trên cung quạt, chừa khoảng giữa cho trục thân cây
            const f = rest.length === 1 ? 0.5 : i / (rest.length - 1)
            let a = aMid - span / 2 + f * span
            if (Math.abs(a - aMid) < 0.06) a += a < aMid ? -0.06 : 0.06
            m.set(n.id, { x: fx + Math.cos(a) * R, y: fy + Math.sin(a) * R, r: SIZE[n.kind] ?? 4, color: COLOR[n.kind] ?? COLOR.note, node: n, phase: rand() * Math.PI * 2 })
          })
        }
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
        // 📜 DÒNG ĐỜI: trục ngang event_date — đời mình là xương sống
        const dated = nodes.filter(n => n.event_date && n.kind !== 'kho')
        unplacedRef.current = nodes.filter(n => !n.event_date && n.kind !== 'kho' && n.kind !== 'folder')
        if (dated.length) {
          const ts = dated.map(n => new Date(n.event_date!).getTime())
          let mn = Math.min(...ts), mx = Math.max(...ts, 1765400000000)
          // trang quá cổ (sách lịch sử) ghim mép trái — thang đo tối đa 60 năm cho đọc được
          mn = Math.max(mn, mx - 60 * 365.25 * 86400000)
          const pad = Math.max((mx - mn) * 0.04, 86400000 * 30)
          mn -= pad; mx += pad
          tlMetaRef.current = { min: mn, max: mx }
          const ySpine = H * 0.55
          const X = (tm: number) => 60 + ((Math.max(tm, mn) - mn) / (mx - mn)) * (W - 120)
          const lanes: Record<string, number[]> = { personal: [], corporate: [], humanity: [] }
          const sorted = [...dated].sort((a, b) => new Date(a.event_date!).getTime() - new Date(b.event_date!).getTime())
          for (const n of sorted) {
            const layer = (n.layer ?? 'personal') as 'personal' | 'corporate' | 'humanity'
            const x = X(new Date(n.event_date!).getTime())
            const ls = lanes[layer]
            let lane = 0
            while (lane < 4 && ls[lane] !== undefined && x - ls[lane] < 56) lane++
            if (lane >= 4) lane = 0
            ls[lane] = x
            const y = layer === 'personal' ? ySpine - 30 - lane * 34
              : layer === 'corporate' ? ySpine + 44 + lane * 34
              : ySpine - 152 - lane * 34
            m.set(n.id, { x, y, r: SIZE[n.kind] ?? 4, color: COLOR[n.kind] ?? COLOR.note, node: n, phase: rand() * Math.PI * 2 })
          }
        } else tlMetaRef.current = null
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
        const p3 = new Map<string, { x: number; y: number; z: number; r: number; hue: number; c: number }>()
        for (const n of nodes) {
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
      pts.current = m
      setUnplacedCount(unplacedRef.current.length)
    }
    layout()

    function wpos(p: P): { x: number; y: number; r: number } {
      const mo = motionRef.current
      if (mo === 'still' || p.node.kind === 'kho') return { x: p.x, y: p.y, r: p.r }
      if (mo === 'pulse') { const s = 1 + Math.sin(t * 0.03 + p.phase) * 0.18; return { x: p.x, y: p.y, r: p.r * s } }
      // drift: trôi nhẹ + NHỊP THỞ (mọi node phập phồng như đang sống)
      const breathe = 1 + Math.sin(t * 0.02 + p.phase) * 0.07
      return { x: p.x + Math.sin(t * 0.012 + p.phase) * 5, y: p.y + Math.cos(t * 0.009 + p.phase * 1.7) * 5, r: p.r * breathe }
    }
    const S = (v: number) => v * cam.current.k * dpr
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
      // 🧠 NEURO: tự xoay + chiếu phối cảnh → ghi đè toạ độ pts (mọi vẽ/hit-test dùng chung)
      if (mode === 'neuro') {
        rotRef.current.a += 0.0028 * dtMs / 16.7
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

      // 🌳 CÂY SỰ SỐNG: thiền giả dưới gốc, 3 cung quạt mở lên trời + thân cây sáng
      if (mode === 'mandala') {
        const fx = W / 2, fy = H * 0.76
        const Rmax = Math.min(W * 0.46, fy - 36)
        const span = Math.PI * 0.82, aMid = -Math.PI / 2
        // cung quạt 3 tầng kho (chỉ vẽ phần quạt, không vẽ vòng kín)
        for (const [f, col] of [[0.36, 'rgba(167,139,250,.20)'], [0.66, 'rgba(34,211,238,.16)'], [0.96, 'rgba(232,121,249,.13)']] as [number, string][]) {
          ctx.strokeStyle = col; ctx.lineWidth = 1 * dpr
          ctx.beginPath()
          ctx.arc(SX(fx), SY(fy), S(Rmax * f), aMid - span / 2, aMid + span / 2)
          ctx.stroke()
        }
        // THÂN CÂY: cột sáng từ đỉnh đầu thiền giả xuyên 3 kho
        const topY = fy - Rmax * 0.96
        const lg = ctx.createLinearGradient(SX(fx), SY(fy - 18), SX(fx), SY(topY))
        lg.addColorStop(0, 'rgba(52,211,153,.55)'); lg.addColorStop(0.5, 'rgba(34,211,238,.4)'); lg.addColorStop(1, 'rgba(232,121,249,.3)')
        // quầng sáng thân cây = nét rộng mờ lót dưới (thay shadowBlur)
        ctx.strokeStyle = 'rgba(52,211,153,.16)'; ctx.lineWidth = 9 * Math.max(0.6, cam.current.k) * dpr
        ctx.beginPath(); ctx.moveTo(SX(fx), SY(fy - 18)); ctx.lineTo(SX(fx), SY(topY)); ctx.stroke()
        ctx.strokeStyle = lg; ctx.lineWidth = 2.2 * Math.max(0.6, cam.current.k) * dpr
        ctx.beginPath(); ctx.moveTo(SX(fx), SY(fy - 18)); ctx.lineTo(SX(fx), SY(topY)); ctx.stroke()
        // nhựa cây chảy dọc thân (hạt sáng đi lên)
        const sapGlow = glowSprite('#67e8f9')
        for (let i = 0; i < 3; i++) {
          const tt = ((t * 0.005) + i / 3) % 1
          const y = (fy - 18) + (topY - (fy - 18)) * tt
          ctx.drawImage(sapGlow, SX(fx) - 8 * dpr, SY(y) - 8 * dpr, 16 * dpr, 16 * dpr)
          ctx.fillStyle = 'rgba(255,255,255,.85)'
          ctx.beginPath(); ctx.arc(SX(fx), SY(y), 2 * dpr, 0, 6.28); ctx.fill()
        }
        // cánh sen quanh thiền giả (gốc cây)
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2 + t * 0.0015
          const r1 = Rmax * 0.07, r2 = Rmax * 0.12
          ctx.strokeStyle = `hsla(${(265 + i * 9) % 360},70%,70%,.25)`
          ctx.lineWidth = 1 * dpr
          ctx.beginPath()
          ctx.moveTo(SX(fx + Math.cos(a) * r1), SY(fy + Math.sin(a) * r1))
          ctx.quadraticCurveTo(SX(fx + Math.cos(a + 0.31) * r2 * 1.2), SY(fy + Math.sin(a + 0.31) * r2 * 1.2), SX(fx + Math.cos(a + 0.62) * r1), SY(fy + Math.sin(a + 0.62) * r1))
          ctx.stroke()
        }
        // hào quang + thiền giả thở
        const breathe = 1 + Math.sin(t * 0.02) * 0.06
        const halo = ctx.createRadialGradient(SX(fx), SY(fy), 0, SX(fx), SY(fy), S(Rmax * 0.16))
        halo.addColorStop(0, 'rgba(251,191,36,.18)'); halo.addColorStop(1, 'rgba(251,191,36,0)')
        ctx.fillStyle = halo
        ctx.beginPath(); ctx.arc(SX(fx), SY(fy), S(Rmax * 0.16), 0, 6.28); ctx.fill()
        ctx.font = `${40 * cam.current.k * breathe * dpr}px serif`
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
          ctx.font = `bold ${11.5 * dpr}px Inter, sans-serif`; ctx.textAlign = 'center'
          ctx.fillText(DIM_LABEL[d], lx, ly)
          const cnt = [...primaryDimRef.current.values()].filter(v => v === d).length
          ctx.fillStyle = '#71717a'; ctx.font = `${9.5 * dpr}px Inter, sans-serif`
          ctx.fillText(`(${cnt})`, lx, ly + 13 * dpr)
          ctx.globalAlpha = 1
        })
        const g2 = ctx.createRadialGradient(SX(cx), SY(cy), 0, SX(cx), SY(cy), S(Rmin))
        g2.addColorStop(0, 'rgba(255,255,255,.12)'); g2.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(SX(cx), SY(cy), S(Rmin), 0, 6.28); ctx.fill()
        ctx.fillStyle = '#cbd5e1'; ctx.font = `bold ${14 * dpr}px Inter, sans-serif`; ctx.textAlign = 'center'
        ctx.fillText(String(links.length), SX(cx), SY(cy) + 5 * dpr)
        ctx.fillStyle = '#71717a'; ctx.font = `${8.5 * dpr}px Inter, sans-serif`
        ctx.fillText('liên kết', SX(cx), SY(cy) + 17 * dpr)
      }
      // 📜 DÒNG ĐỜI: xương sống + tick năm + vạch hôm nay + chân mốc
      if (mode === 'timeline' && tlMetaRef.current) {
        const { min: mn, max: mx } = tlMetaRef.current
        const ySpine = H * 0.55
        const X = (tm: number) => 60 + ((tm - mn) / (mx - mn)) * (W - 120)
        const lg2 = ctx.createLinearGradient(SX(60), 0, SX(W - 60), 0)
        lg2.addColorStop(0, '#60a5fa66'); lg2.addColorStop(1, '#22d3eeaa')
        ctx.strokeStyle = 'rgba(96,165,250,.14)'; ctx.lineWidth = 8 * dpr
        ctx.beginPath(); ctx.moveTo(SX(60), SY(ySpine)); ctx.lineTo(SX(W - 60), SY(ySpine)); ctx.stroke()
        ctx.strokeStyle = lg2; ctx.lineWidth = 2 * dpr
        ctx.beginPath(); ctx.moveTo(SX(60), SY(ySpine)); ctx.lineTo(SX(W - 60), SY(ySpine)); ctx.stroke()
        const tlGlow = glowSprite('#22d3ee')
        for (let i = 0; i < 4; i++) {
          const f = ((t * 0.003) + i / 4) % 1
          const px2 = SX(60 + f * (W - 120)), py2 = SY(ySpine)
          ctx.drawImage(tlGlow, px2 - 7 * dpr, py2 - 7 * dpr, 14 * dpr, 14 * dpr)
          ctx.fillStyle = 'rgba(255,255,255,.8)'
          ctx.beginPath(); ctx.arc(px2, py2, 2 * dpr, 0, 6.28); ctx.fill()
        }
        const y0 = new Date(mn).getFullYear(), y1 = new Date(mx).getFullYear()
        let lastX = -999
        for (let y = y0; y <= y1; y++) {
          const x = X(new Date(y, 0, 1).getTime())
          if ((x - lastX) * cam.current.k < 80) continue
          lastX = x
          ctx.strokeStyle = 'rgba(100,116,139,.4)'; ctx.lineWidth = 1 * dpr
          ctx.beginPath(); ctx.moveTo(SX(x), SY(ySpine - 5)); ctx.lineTo(SX(x), SY(ySpine + 5)); ctx.stroke()
          ctx.fillStyle = '#64748b'; ctx.font = `${10 * dpr}px Inter, sans-serif`; ctx.textAlign = 'center'
          ctx.fillText(String(y), SX(x), SY(ySpine + 22))
        }
        pts.current.forEach(pp => {
          ctx.strokeStyle = 'rgba(96,165,250,.22)'; ctx.lineWidth = 1
          ctx.beginPath(); ctx.moveTo(SX(pp.x), SY(pp.y)); ctx.lineTo(SX(pp.x), SY(ySpine)); ctx.stroke()
          ctx.fillStyle = '#60a5fa'; ctx.beginPath(); ctx.arc(SX(pp.x), SY(ySpine), 2 * dpr, 0, 6.28); ctx.fill()
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
        const hot = hv && (l.from_node === hv || l.to_node === hv)
        const dim = hv && !hot
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

      // NODES — sức mạnh theo số liên kết: hub càng nối nhiều càng to & sáng
      pts.current.forEach(p => {
        const w = wpos(p)
        const hot = hoverId.current === p.node.id
        const isPicked = pickRef.current === p.node.id
        const deg = degRef.current.get(p.node.id) ?? 0
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
        const glowR = S(w.r + power) + ((p.node.kind === 'kho' ? 26 : p.node.kind === 'folder' ? 12 : 7) + Math.min(16, deg * 2) + (hot ? 10 : 0) + nb * 36) * dpr
        ctx.drawImage(glowSprite(p.color), gx0 - glowR, gy0 - glowR, glowR * 2, glowR * 2)
        ctx.fillStyle = p.color
        if (mode === 'neuro') {
          // 🧠 NEURON THẬT: soma méo hữu cơ + tua dendrite + nhân sáng
          const cxp = gx0, cyp = gy0
          const R = S(w.r + power) * (1 + nb * 0.32) + (hot ? 2 * dpr : 0)
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
          ctx.beginPath(); ctx.arc(gx0, gy0, S(w.r + power) * (1 + nb * 0.32) + (hot ? 2 * dpr : 0), 0, 6.28); ctx.fill()
        }
        // neuro: lõi vùng to có quầng plasma (sprite cache — không tạo gradient mỗi frame)
        if (mode === 'neuro' && (p.node.kind === 'kho' || p.r > 9)) {
          const hr = S(w.r + power) * (2.6 + nb)
          ctx.globalAlpha = nb > 0.3 ? 0.62 : 0.38
          ctx.drawImage(glowSprite(p.color), gx0 - hr, gy0 - hr, hr * 2, hr * 2)
          ctx.globalAlpha = 1
        }
        if (mode === 'neuro' && nb > 0.4) {
          ctx.fillStyle = `rgba(255,255,255,${Math.min(0.95, nb)})`
          ctx.beginPath(); ctx.arc(SX(w.x), SY(w.y), S(w.r) * 0.45, 0, 6.28); ctx.fill()
        }
        // hub mạnh (≥4 liên kết): vầng hào quang thở
        if (deg >= 4) {
          const breathe = 1 + Math.sin(t * 0.025 + p.phase) * 0.25
          ctx.strokeStyle = p.color + '44'
          ctx.lineWidth = 1 * dpr
          ctx.beginPath(); ctx.arc(SX(w.x), SY(w.y), (S(w.r + power) + 7 * dpr) * breathe, 0, 6.28); ctx.stroke()
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
                ctx.beginPath(); ctx.arc(SX(w.x), SY(w.y), S(w.r + power) + 5 * dpr, a0 + 0.06, a0 + sweep - 0.06); ctx.stroke()
                a0 += sweep
              }
            }
          }
        }
        if (hot || isPicked) {
          ctx.strokeStyle = isPicked ? 'rgba(251,191,36,.9)' : 'rgba(255,255,255,.5)'
          ctx.lineWidth = 1.5 * dpr
          ctx.beginPath(); ctx.arc(SX(w.x), SY(w.y), S(w.r) + 6 * dpr + (isPicked ? Math.sin(t * 0.15) * 2 * dpr : 0), 0, 6.28); ctx.stroke()
        }
        // label: kho luôn hiện; trong mandala folder/page chỉ hiện khi zoom (đỡ rối); note khi zoom sâu
        const showLabel = p.node.kind === 'kho' ? true
          : p.node.kind === 'note' ? cam.current.k > 1.7
          : (mode === 'mandala' || mode === 'timeline') ? (cam.current.k > 1.15 || hot) : true
        if (showLabel) {
          ctx.fillStyle = hot ? '#fff' : '#cbd5e1'
          ctx.font = `${(p.node.kind === 'kho' ? 13 : 10.5) * dpr}px Inter, sans-serif`
          const lab = (p.node.title || '').slice(0, 20)
          if (mode === 'neuro' && p.node.kind !== 'note') {
            // nhãn ĐÓNG KHUNG kiểu neurolink HUD — bề rộng chữ lấy từ cache
            ctx.font = `bold ${8.5 * dpr}px monospace`
            const labU = lab.toUpperCase()
            const twKey = ctx.font + '|' + labU
            let tw = _tw.get(twKey)
            if (tw === undefined) { tw = ctx.measureText(labU).width; _tw.set(twKey, tw) }
            const bx = SX(w.x) - tw / 2 - 5 * dpr, by = SY(w.y) + S(w.r) + 6 * dpr
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
            ctx.fillText(lab, SX(w.x) + S(w.r) + 8 * dpr, SY(w.y) + 4 * dpr)
          } else {
            ctx.textAlign = 'center'
            ctx.fillText(lab, SX(w.x), SY(w.y) + S(w.r) + 13 * dpr)
          }
        }
      })

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
  function resetCam() { cam.current = { x: 0, y: 0, k: 1 }; setZoomPct(100) }

  function findAt(e: React.MouseEvent): P | null {
    const r = ref.current!.getBoundingClientRect()
    const c = cam.current
    const mx = (e.clientX - r.left - c.x) / c.k, my = (e.clientY - r.top - c.y) / c.k
    let best: P | null = null, bd = 999
    pts.current.forEach(p => { const d = Math.hypot(p.x - mx, p.y - my); if (d < Math.max(p.r + 9, 15) / Math.max(0.5, c.k) && d < bd) { bd = d; best = p } })
    return best
  }
  function onClick(e: React.MouseEvent) {
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
    if (!best) return
    if (connectRef.current && onConnect) {
      // chế độ NỐI: chọn 2 node để tạo liên kết
      if (!pickRef.current) { pickRef.current = best.node.id; setPicked(best.node.id); return }
      if (pickRef.current !== best.node.id) {
        onConnect(pickRef.current, best.node.id)
        pickRef.current = null; setPicked(null)
      }
      return
    }
    onOpen(best.node)
  }
  function onDown(e: React.MouseEvent) {
    if (findAt(e)) return
    panning.current = mode === 'neuro'
      ? { sx: e.clientX, sy: e.clientY, cx: rotRef.current.a * 1000, cy: rotRef.current.b * 1000 }
      : { sx: e.clientX, sy: e.clientY, cx: cam.current.x, cy: cam.current.y }
  }
  function onMove(e: React.MouseEvent) {
    if (panning.current) {
      const p = panning.current
      if (mode === 'neuro') {
        // kéo nền = xoay khối não 3D
        rotRef.current.a = p.cx / 1000 + (e.clientX - p.sx) * 0.006
        rotRef.current.b = Math.max(-1.2, Math.min(1.2, p.cy / 1000 + (e.clientY - p.sy) * 0.006))
      } else {
        cam.current.x = p.cx + (e.clientX - p.sx)
        cam.current.y = p.cy + (e.clientY - p.sy)
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
  function onUp() { setTimeout(() => { panning.current = null }, 0) }
  function onWheel(e: React.WheelEvent) {
    const r = ref.current!.getBoundingClientRect()
    zoomAt(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 1.15 : 0.87)
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
      <canvas ref={ref} onClick={onClick} onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp}
        onMouseLeave={() => { hoverId.current = null; setTip(null); panning.current = null }} onWheel={onWheel}
        className={`w-full h-full block ${connect ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`} />

      {tip && (
        <div className="absolute pointer-events-none -translate-x-1/2 -translate-y-full rounded-lg bg-[#1c1c26]/95 border border-white/15 px-2.5 py-1.5 shadow-xl z-10" style={{ left: tip.x, top: tip.y }}>
          <div className="text-xs font-semibold text-white whitespace-nowrap max-w-[240px] truncate">{tip.title}</div>
          <div className="text-[10px] text-zinc-400">{tip.kind === 'kho' ? 'Kho' : tip.kind === 'folder' ? 'Thư mục' : tip.kind === 'database' ? 'Bảng dữ liệu' : 'Trang'} · {tip.deg} liên kết · {connect ? (picked ? 'bấm node thứ 2 để NỐI ⚡' : 'bấm để chọn node đầu') : 'bấm để mở'}</div>
        </div>
      )}

      {/* HUD phải: mode + zoom + motion + flow + connect */}
      <div className="absolute top-3 right-3 flex flex-col items-end gap-2 z-10">
        <div className="flex items-center gap-1 rounded-xl bg-[#10101a]/85 backdrop-blur border border-white/10 p-1 text-[11px]">
          <button onClick={() => setMode('galaxy')} title="Cấu trúc kho — cái gì nằm trong cái gì" className={`px-2 py-1.5 rounded-lg ${mode === 'galaxy' ? 'bg-violet-500/40 text-white shadow-lg shadow-violet-500/30' : 'text-zinc-400 hover:bg-white/10'}`}>🌌 Galaxy</button>
          <button onClick={() => { setMode('mandala'); setFlow(true) }} title="Cây Sự Sống — tri thức nở trên đỉnh đầu" className={`px-2 py-1.5 rounded-lg ${mode === 'mandala' ? 'bg-amber-500/35 text-amber-100 shadow-lg shadow-amber-500/30' : 'text-zinc-400 hover:bg-white/10'}`}>🧘 Mandala</button>
          <button onClick={() => { setMode('radar'); setMotion('still'); setFlow(false); setDimOff(new Set()) }} title="8 chiều liên kết cân hay lệch — bấm trục để soi riêng" className={`px-2 py-1.5 rounded-lg ${mode === 'radar' ? 'bg-violet-500/35 text-violet-100 shadow-lg shadow-violet-500/30' : 'text-zinc-400 hover:bg-white/10'}`}>🎯 Radar</button>
          <button onClick={() => { setMode('timeline'); setMotion('still') }} title="Dòng đời — tri thức đan vào mốc thời gian thực" className={`px-2 py-1.5 rounded-lg ${mode === 'timeline' ? 'bg-blue-500/35 text-blue-100 shadow-lg shadow-blue-500/30' : 'text-zinc-400 hover:bg-white/10'}`}>📜 Dòng đời</button>
          <button onClick={() => { setMode('neuro'); setMotion('still'); setFlow(true) }} title="Bộ não 3D tự xoay — kéo nền để xoay, mỗi nhánh một vùng não" className={`px-2 py-1.5 rounded-lg ${mode === 'neuro' ? 'bg-emerald-500/35 text-emerald-100 shadow-lg shadow-emerald-500/30' : 'text-zinc-400 hover:bg-white/10'}`}>🧠 Neuro</button>
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-[#10101a]/85 backdrop-blur border border-white/10 p-1">
          <button onClick={() => { const c = center(); zoomAt(c.x, c.y, 1.25) }} title="Phóng to" className="w-8 h-8 grid place-items-center rounded-lg text-zinc-300 hover:bg-white/10 text-lg">＋</button>
          <button onClick={() => { const c = center(); zoomAt(c.x, c.y, 0.8) }} title="Thu nhỏ" className="w-8 h-8 grid place-items-center rounded-lg text-zinc-300 hover:bg-white/10 text-lg">−</button>
          <button onClick={resetCam} title="Về mặc định" className="w-8 h-8 grid place-items-center rounded-lg text-zinc-300 hover:bg-white/10 text-sm">⟳</button>
          <span className="text-[10px] text-zinc-500 w-10 text-center">{zoomPct}%</span>
        </div>
        {(mode === 'galaxy' || mode === 'mandala') && <div className="flex items-center gap-1 rounded-xl bg-[#10101a]/85 backdrop-blur border border-white/10 p-1 text-[11px]">
          <span className="text-[8px] uppercase tracking-widest text-zinc-600 pl-1.5 pr-0.5">node</span>
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
        <div className="flex items-center gap-1 rounded-xl bg-[#10101a]/85 backdrop-blur border border-white/10 p-1 text-[11px]">
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
        <div className="absolute top-16 left-3 z-10 w-[300px] rounded-2xl bg-[#10101a]/92 backdrop-blur border border-white/10 p-3">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">✨ Gợi ý nối tri thức <span className="normal-case">(AI thật khi nối API — tạm theo từ khoá)</span></div>
          {suggestions.length === 0 ? <p className="text-xs text-zinc-600">Chưa tìm thấy cặp nào còn thiếu — kho của bạn nối khá đủ rồi 🎉</p> : (
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <div key={i} className="rounded-xl bg-white/[0.04] border border-white/10 p-2.5">
                  <div className="text-[11px] text-zinc-300 leading-snug">“{(s.a.title ?? '').slice(0, 26)}” <span className="text-zinc-600">↔</span> “{(s.b.title ?? '').slice(0, 26)}”</div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-zinc-600">chung: “{s.w}”</span>
                    {onConnect && <button onClick={() => onConnect(s.a.id, s.b.id)} className="text-[10px] rounded-lg bg-gradient-to-r from-violet-500 to-cyan-500 px-2.5 py-1 font-bold">⚡ Nối ngay</button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* chú giải = ĐỦ 8 CHIỀU framework, đếm link, bấm để lọc */}
      <div className="absolute bottom-3 left-3 rounded-2xl bg-[#10101a]/88 backdrop-blur border border-white/10 px-3.5 py-2.5 z-10">
        <div className="flex items-center justify-between gap-4 mb-2">
          <span className="text-[9px] uppercase tracking-[0.18em] text-zinc-500 font-bold">8 chiều liên kết</span>
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
      {(mode === 'radar' || mode === 'timeline') && unplacedCount > 0 && (
        <button onClick={() => setUnplacedOpen(o => !o)} className="absolute bottom-9 right-3 z-10 text-[10px] rounded-lg bg-[#10101a]/85 border border-white/10 px-2.5 py-1.5 text-zinc-400 hover:text-white backdrop-blur">
          ⬡ {unplacedRef.current.length} trang chưa vào {mode === 'radar' ? 'radar — Thấm để nối chiều' : 'dòng đời — mở & gắn 📅'}
        </button>
      )}
      {unplacedOpen && (mode === 'radar' || mode === 'timeline') && (
        <div className="absolute bottom-20 right-3 z-10 w-[280px] max-h-[320px] overflow-auto rounded-2xl bg-[#10101a]/92 backdrop-blur border border-white/10 p-3">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">⬡ Chưa vào bản đồ — bấm để mở</div>
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
