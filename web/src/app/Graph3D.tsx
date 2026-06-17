'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import ForceGraph3D from '3d-force-graph'
import * as THREE from 'three'
import SpriteText from 'three-spritetext'
import type { GNode, GLink } from './Galaxy'
import { DIM_COLOR, DIM_LABEL } from './Galaxy'
import { supabase } from '@/lib/supabaseClient'

// màu theo KHO (đồng bộ mode 3 Vòng): đời tôi cyan · QNET tím · nhân loại hồng
// khớp ĐÚNG màu sao kho (GALAXY_PALETTE): cá nhân tím · QNET vàng · nhân loại hồng — KHÔNG trùng 6 màu chiều
const LAYER_TINT: Record<string, string> = { personal: '#a78bfa', corporate: '#fcd34d', humanity: '#f0abfc' }
const LAYER_NAME: Record<string, string> = { personal: '🧠 Cá nhân', corporate: '🌐 QNET', humanity: '♾️ Nhân loại' }
// 🌟 mỗi kho = 1 THIÊN HÀ có SAO ở tâm + dải màu 5 LEVEL (sâu dần) phối hài hoà:
//   L0 = sao tâm · L1 = "trái đất" · L2-L4 = 3 màu phối · L5+ giữ màu cuối. Sao mỗi kho 1 màu riêng.
// 🎨 MÀU NODE = THEO KHO (1 hue/kho) — đậm tầng nông, nhạt dần khi sâu. Khớp Galaxy.tsx (GRAPH-VISION §3).
// Đời tôi=tím · QNET=vàng · Nhân loại=hồng. Node kể "thuộc về đâu", đường nối kể "quan hệ gì" (8 chiều).
const GALAXY_PALETTE: Record<string, { star: string; base: string }> = {
  personal:  { star: '#a78bfa', base: '#8b5cf6' }, // tím
  corporate: { star: '#fcd34d', base: '#f5b942' }, // vàng
  humanity:  { star: '#f0abfc', base: '#e879f9' }, // hồng
}
function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16)
  const ar = pa >> 16, ag = (pa >> 8) & 255, ab = pa & 255
  const br = pb >> 16, bg = (pb >> 8) & 255, bb = pb & 255
  const m = (x: number, y: number) => Math.round(x + (y - x) * t)
  return '#' + ((1 << 24) + (m(ar, br) << 16) + (m(ag, bg) << 8) + m(ab, bb)).toString(16).slice(1)
}
const galaxyColor = (layer: string, level: number) => {
  const p = GALAXY_PALETTE[layer] ?? GALAXY_PALETTE.personal
  const t = Math.min(Math.max(level, 0), 7) / 7
  return mixHex(p.base, '#eaf0ff', t * 0.62)
}
// bỏ dấu để search không-dấu vẫn trúng
const vnorm = (s: string) => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim()
// theme: tone trắng → nền kem, tone tối → nền vũ trụ (3D đổi nền theo theme như 2D)
const isLight = () => typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light'
const SCENE_BG = { dark: '#06060c', light: '#f4f1ea' }

type FG = InstanceType<typeof ForceGraph3D> // instance API
type N3 = { id: string; name: string; layer: string; kind: string; val: number }
type L3 = { source: string; target: string; dimension: string | null; weight: number }

export default function Graph3D({ nodes, links, onOpen, onClose }: {
  nodes: GNode[]; links: GLink[]
  onOpen: (n: GNode) => void
  onClose: () => void
}) {
  const wrap = useRef<HTMLDivElement>(null)
  const fgRef = useRef<FG | null>(null)
  const activeRef = useRef<Set<string> | null>(null)   // id node đang "sáng"; null = tất cả
  const searchModeRef = useRef(false)   // true = đang TÌM (node ngoài tập → ẩn hẳn); false = chọn node theo level (ngoài tập → chỉ MỜ)
  const frameCamRef = useRef<(() => void) | null>(null)   // đưa camera về TOÀN CẢNH (nút + click nền) → đỡ bị lost sau khi zoom vào node
  const rebuildRef = useRef<(() => void) | null>(null)    // ↻ refresh 3D: đặt lại vị trí node + về khung (sửa khi layout/GL lỗi vặt)
  const focusKhoRef = useRef<((L: string) => void) | null>(null)   // bay + đặt TÂM XOAY vào 1 thiên hà (kho) → xoay tự do quanh kho đó
  const byId = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes])
  // LEVEL trong kho = số bước parent_id tới gốc kho (kho=0, con=1, cháu=2…) → tô màu theo tầng
  const levelOf = useMemo(() => {
    const m = new Map<string, number>(); const idmap = new Map(nodes.map(n => [n.id, n]))
    const calc = (id: string, seen: Set<string>): number => {
      if (m.has(id)) return m.get(id)!
      const n = idmap.get(id); if (!n) return 0
      if (n.kind === 'kho' || !n.parent_id || !idmap.has(n.parent_id) || seen.has(n.parent_id)) { m.set(id, 0); return 0 }
      seen.add(id); const v = Math.min(8, calc(n.parent_id, seen) + 1); m.set(id, v); return v
    }
    nodes.forEach(n => calc(n.id, new Set())); return m
  }, [nodes])
  const deg = useMemo(() => { const m = new Map<string, number>(); links.forEach(l => { m.set(l.from_node, (m.get(l.from_node) ?? 0) + 1); m.set(l.to_node, (m.get(l.to_node) ?? 0) + 1) }); return m }, [links])
  const adj = useMemo(() => { const m = new Map<string, Set<string>>(); links.forEach(l => { (m.get(l.from_node) ?? m.set(l.from_node, new Set()).get(l.from_node)!).add(l.to_node); (m.get(l.to_node) ?? m.set(l.to_node, new Set()).get(l.to_node)!).add(l.from_node) }); return m }, [links])
  // CHA→CON (cấu trúc cây) cho hover bừng chòm như 2D
  const childrenOf = useMemo(() => { const m = new Map<string, string[]>(); nodes.forEach(n => { if (n.parent_id) (m.get(n.parent_id) ?? m.set(n.parent_id, []).get(n.parent_id)!).push(n.id) }); return m }, [nodes])

  // các LOẠI để filter = theo kho (layer). Đếm số node mỗi loại.
  const layers = useMemo(() => {
    const c: Record<string, number> = {}
    nodes.forEach(n => { const L = n.layer ?? 'personal'; c[L] = (c[L] ?? 0) + 1 })
    return c
  }, [nodes])

  const [sel, setSel] = useState<GNode | null>(null)
  const [q, setQ] = useState('')
  const [depth, setDepth] = useState(1)
  const [hidden, setHidden] = useState<Set<string>>(new Set())  // layer bị tắt
  const [repel, setRepel] = useState(-90)
  const [linkDist, setLinkDist] = useState(42)
  const [particles, setParticles] = useState(true)
  const [dimOff, setDimOff] = useState<Set<string>>(new Set())   // chiều bị TẮT (bấm legend) → ẩn đường chiều đó cho rõ xoắn ốc
  const [showAllDims, setShowAllDims] = useState(false)   // MẶC ĐỊNH ẩn web 8 chiều (đỡ rối — ảnh founder); bấm node mới hiện liên kết của node đó. Bật = hiện hết.
  const [bridges, setBridges] = useState(true)   // cầu nối XUYÊN THIÊN HÀ luôn sáng (dòng chảy) → 3 thiên hà hoà quyện. Tắt nếu muốn sạch.
  const [labels, setLabels] = useState(true)
  const [autoRot, setAutoRot] = useState(false)
  const [maxLevel, setMaxLevel] = useState(8)   // độ sâu HỆ MẶT TRỜI: 1=hành tinh · 3=vệ tinh · 8=tất cả (tới tầng 7)
  const maxLevelRef = useRef(8); maxLevelRef.current = maxLevel
  const [glError, setGlError] = useState(false)   // WebGL không tạo được context (GPU yếu/cạn) → hiện fallback thay vì sập app
  const [peek, setPeek] = useState<{ id: string; title: string; md: string } | null>(null)   // đọc trang NGAY trong 3D (không nhảy về 2D)
  const [peekLoading, setPeekLoading] = useState(false)
  async function openPeek(n: GNode) {
    setPeekLoading(true); setPeek({ id: n.id, title: n.title ?? 'Trang', md: '' })
    const { data } = await supabase.from('nodes').select('md,content').eq('id', n.id).maybeSingle()
    let md = (data?.md as string) ?? ''
    if (!md && data?.content) { try { const cs = data.content as { content?: { text?: string }[] }[]; md = cs.map(b => (b.content ?? []).map(c => c.text ?? '').join('')).join('\n\n') } catch { /* */ } }
    setPeek({ id: n.id, title: n.title ?? 'Trang', md: md || '_(trang chưa có nội dung)_' }); setPeekLoading(false)
  }

  // 🛡️ LƯỚI AN TOÀN: 3d-force-graph chạy vòng rAF nội bộ; khi component bị huỷ (StrictMode dev mount 2 lần,
  // hoặc đổi view) còn 1 frame "mồ côi" đọc state đã null → throw "reading 'tick'" trong requestAnimationFrame.
  // Lỗi async này KHÔNG try/catch / ErrorBoundary nào bắt được → phải nuốt ở tầng window (đúng lỗi vô hại này thôi).
  useEffect(() => {
    const isStaleTick = (msg: string, stack: string) =>
      /reading '?tick'?/.test(msg) || (/tick/.test(msg + stack) && /tickFrame|_animationCycle|layoutTick|ForceGraph/.test(stack))
    const onErr = (e: ErrorEvent) => { if (isStaleTick(e.message || '', String(e.error?.stack || ''))) { e.preventDefault(); e.stopImmediatePropagation() } }
    const onRej = (e: PromiseRejectionEvent) => { const r = e.reason; if (isStaleTick(String(r?.message || r || ''), String(r?.stack || ''))) e.preventDefault() }
    window.addEventListener('error', onErr, true)
    window.addEventListener('unhandledrejection', onRej, true)
    return () => { window.removeEventListener('error', onErr, true); window.removeEventListener('unhandledrejection', onRej, true) }
  }, [])

  // mở rộng tập "sáng" theo độ sâu (BFS) từ 1 node
  const expand = (rootIds: string[], d: number): Set<string> => {
    const set = new Set(rootIds)
    let frontier = rootIds
    for (let i = 0; i < d; i++) {
      const next: string[] = []
      for (const id of frontier) for (const nb of adj.get(id) ?? []) if (!set.has(nb)) { set.add(nb); next.push(nb) }
      frontier = next
    }
    return set
  }

  // CHÒM khi CHỌN node = node + 1 cha (1 tầng trên) + con trực tiếp (1 tầng dưới) + hàng xóm 8-chiều (depth hop). Giống 2D.
  const neighborhood = (id: string, d: number): Set<string> => {
    const set = expand([id], d)                       // liên kết 8 chiều quanh node (mặc định 1 hop)
    const p = byId.get(id)?.parent_id; if (p) set.add(p)  // 1 tầng trên
    childrenOf.get(id)?.forEach(c => set.add(c))          // 1 tầng dưới
    return set
  }
  // tính lại tập sáng từ search/chọn rồi refresh graph
  const recompute = () => {
    const fg = fgRef.current; if (!fg) return
    const qq = vnorm(q)
    searchModeRef.current = !!qq
    if (qq) {
      const hits = nodes.filter(n => vnorm(n.title ?? '').includes(qq)).map(n => n.id)
      activeRef.current = hits.length ? expand(hits, 1) : new Set()   // search: trúng + hàng xóm 1 bước, còn lại TẮT (ẩn)
    } else if (sel) {
      activeRef.current = neighborhood(sel.id, depth)   // chọn node: node + cha + con + liên kết 8 chiều (1 hop); ngoài tập chỉ MỜ
    } else activeRef.current = null
    fg.nodeVisibility(fg.nodeVisibility()).linkVisibility(fg.linkVisibility()).nodeColor(fg.nodeColor()).linkColor(fg.linkColor()).linkWidth(fg.linkWidth()).linkDirectionalParticles(fg.linkDirectionalParticles())
  }
  useEffect(recompute, [q, sel, depth]) // eslint-disable-line react-hooks/exhaustive-deps

  // dựng đồ thị — HOÃN 1 tick + cờ huỷ để né StrictMode (dev mount 2 lần): mount NHÁP bị cleanup huỷ
  // trước khi timer chạy → KHÔNG tạo instance mồ côi → hết lỗi "reading 'tick'" của frame mồ côi + hết đen màn.
  useEffect(() => {
    if (!wrap.current) return
    // (bỏ probe WebGL riêng — nó chiếm thêm 1 context, dễ làm cạn slot. Dựa thẳng vào try/catch quanh ForceGraph3D bên dưới.)
    let inst: FG | null = null
    let raf = 0, cancelled = false
    let onResize: (() => void) | null = null
    let canvas: HTMLCanvasElement | null = null
    let onLost: ((e: Event) => void) | null = null
    let themeObs: MutationObserver | null = null
    const timers: ReturnType<typeof setTimeout>[] = []

    const initTimer = setTimeout(() => {
      if (cancelled || !wrap.current) return
      const N: N3[] = nodes.filter(n => n.kind !== 'block').map(n => { const lv = levelOf.get(n.id) ?? 1; const sizeLv = lv === 0 ? 2.6 : lv <= 1 ? 1.35 : lv === 2 ? 1.05 : 0.8; return { id: n.id, name: n.title ?? 'Trang', layer: n.layer ?? 'personal', kind: n.kind, val: (1.4 + Math.min(11, (deg.get(n.id) ?? 0)) * 0.5) * sizeLv } })
      const present = new Set(N.map(n => n.id))
      // LINK = 2 LOẠI: (1) CHA–CON 'tree' (thẳng, mũi tên, mờ theo kho) + (2) 8 CHIỀU 'dim' (cong, màu chiều). Founder: cha-con bắn vào nhau, thẩm thấu là đường cong.
      const Ltree: L3[] = nodes.filter(n => n.parent_id && present.has(n.id) && present.has(n.parent_id)).map(n => ({ source: n.parent_id!, target: n.id, dimension: null, weight: 1, kind: 'tree' } as L3 & { kind: string }))
      // CHỈ vẽ 6 CHIỀU QUAN HỆ (trang↔trang). Bỏ 'time' (→ view Dòng đời riêng) + 'emotion' (là THUỘC TÍNH, đang trùng khít 'experience' nên chỉ là đường thừa). Khung Chuyển hoá vẫn đủ 8.
      const SKIP_DIM = new Set(['time', 'emotion'])
      const Ldim: L3[] = links.filter(l => !SKIP_DIM.has(l.dimension ?? '') && present.has(l.from_node) && present.has(l.to_node)).map(l => ({ source: l.from_node, target: l.to_node, dimension: l.dimension, weight: 1, kind: 'dim' } as L3 & { kind: string }))
      const L: L3[] = [...Ltree, ...Ldim]
      const vis = (id: string) => !hiddenRef.current.has(byId.get(id)?.layer ?? 'personal') && (levelOf.get(id) ?? 0) <= maxLevelRef.current && (!searchModeRef.current || !activeRef.current || activeRef.current.has(id))
      const idOf = (e: unknown) => (typeof e === 'object' && e ? (e as N3).id : e as string)
      // 1 liên kết 8 chiều "đang soi" = cả 2 đầu nằm trong tập node đang chọn/hover
      const dimActive = (s: string, tg: string) => !!activeRef.current && activeRef.current.has(s) && activeRef.current.has(tg)

      let fg: FG
      try {
        // attrs tối giản cho TƯƠNG THÍCH cao nhất: KHÔNG ép powerPreference (máy chỉ có GPU tích hợp dễ fail nếu ép high-performance);
        // stencil off (tránh OES_packed_depth_stencil) + cho phép GPU yếu (failIfMajorPerformanceCaveat:false).
        // controlType 'orbit' = xoay/zoom MƯỢT & đoán được (trackball mặc định bị lật-lộn, giật). Tâm xoay = điểm nhìn → bấm node sẽ xoay quanh node đó.
        fg = new ForceGraph3D(wrap.current, { controlType: 'orbit', rendererConfig: { antialias: false, alpha: true, stencil: false, failIfMajorPerformanceCaveat: false } })
      } catch (e) { console.warn('3D init failed', e); setGlError(true); return }
      inst = fg
      // mượt: bật damping + tốc độ vừa phải (orbit tự update mỗi frame trong vòng nội bộ → damping hoạt động)
      try { const c = fg.controls() as unknown as { enableDamping: boolean; dampingFactor: number; rotateSpeed: number; zoomSpeed: number; panSpeed: number; screenSpacePanning: boolean }
        c.enableDamping = true; c.dampingFactor = 0.14; c.rotateSpeed = 0.85; c.zoomSpeed = 1.15; c.panSpeed = 0.7; c.screenSpacePanning = true } catch { /* */ }
      fg
        .backgroundColor(isLight() ? SCENE_BG.light : SCENE_BG.dark)
        .graphData({ nodes: N, links: L })
        .nodeVal('val')
        .nodeRelSize(4.2)
        .nodeResolution(12)
        .nodeOpacity(0.95)
        .nodeColor((n: object) => { const x = n as N3; const on = !activeRef.current || activeRef.current.has(x.id); return on ? galaxyColor(x.layer, levelOf.get(x.id) ?? 1) : '#5b6080' })   // ngoài chòm = xám-lam MỜ nhưng VẪN THẤY (như 2D, đừng để mất hành tinh)
        .nodeVisibility((n: object) => vis((n as N3).id))
        .nodeLabel((n: object) => { const id = (n as N3).id; const kids = childrenOf.get(id)?.length ?? 0; const dl = deg.get(id) ?? 0; return `<div style="font:600 12px sans-serif;color:#fff">${(n as N3).name}</div><div style="font:11px sans-serif;color:#a78bfa">${LAYER_NAME[(n as N3).layer] ?? ''} · ${dl} liên kết 8 chiều${kids ? ` · ${kids} trang con` : ''}</div>` })
        .nodeThreeObjectExtend(true)
        .nodeThreeObject((n: object) => {
          const x = n as N3
          if (!labelsRef.current || (deg.get(x.id) ?? 0) < 6) return undefined as unknown as THREE.Object3D
          const s = new SpriteText(x.name.length > 22 ? x.name.slice(0, 21) + '…' : x.name)
          s.color = '#e8e6f0'; s.textHeight = 4
          ;(s as unknown as THREE.Object3D).position.set(0, x.val + 4, 0)
          ;(s as unknown as { material: { depthWrite: boolean } }).material.depthWrite = false
          return s as unknown as THREE.Object3D
        })
        // DÂY 2 LOẠI: CHA–CON (tree) = thẳng + mũi tên; 8 CHIỀU (dim) = CONG mềm + màu chiều. Kích thước = ĐƠN VỊ THẾ GIỚI (scene lớn → phải to mới thấy).
        .linkColor((l: object) => { const x = l as L3 & { kind?: string }; const s = idOf(x.source); const tg = idOf(x.target); const lt = isLight()
          if (x.kind === 'tree') { const on = !activeRef.current || (activeRef.current.has(s) && activeRef.current.has(tg)); return on ? (lt ? 'rgba(70,70,95,0.55)' : 'rgba(228,232,255,0.5)') : (lt ? 'rgba(120,120,150,0.12)' : 'rgba(150,155,190,0.1)') }   // CHA–CON = TRẮNG SÁNG RÕ (quan hệ trang)
          return DIM_COLOR[x.dimension ?? ''] ?? (lt ? '#6b6390' : '#9aa0d0') })
        .linkCurvature((l: object) => (l as L3 & { kind?: string }).kind === 'dim' ? 0.34 : 0)   // 8 chiều CONG MỀM bắn qua nhau, cha-con THẲNG
        .linkVisibility((l: object) => { const x = l as L3 & { kind?: string }; const s = idOf(x.source); const tg = idOf(x.target); if (!vis(s) || !vis(tg)) return false
          if (x.kind === 'tree') return true   // CHA–CON luôn hiện = bộ xương thiên hà
          if (dimOffRef.current.has(x.dimension ?? '')) return false
          const cross = byId.get(s)?.layer !== byId.get(tg)?.layer
          return showAllDimsRef.current || dimActive(s, tg) || (bridgesRef.current && cross) })   // 8 CHIỀU: mặc định ẩn; nhưng link XUYÊN THIÊN HÀ luôn hiện (cầu nối hoà quyện) khi bật bridges
        .linkOpacity(0.82)
        .linkWidth((l: object) => { const x = l as L3 & { kind?: string }; if (x.kind === 'tree') return 0; const s = idOf(x.source); const tg = idOf(x.target); const cross = byId.get(s)?.layer !== byId.get(tg)?.layer; return dimActive(s, tg) ? 5 : cross ? 2.4 : 1.6 })   // node đang soi → liên kết DÀY nổi bật; cha-con dùng đường mảnh (width 0)
        .linkDirectionalArrowLength((l: object) => (l as L3 & { kind?: string }).kind === 'tree' ? 12 : 7)   // mũi tên cha→con RÕ, to
        .linkDirectionalArrowRelPos(0.96)
        .linkDirectionalArrowColor((l: object) => { const x = l as L3 & { kind?: string }; if (x.kind === 'tree') { const on = !activeRef.current || (activeRef.current.has(idOf(x.source)) && activeRef.current.has(idOf(x.target))); return on ? 'rgba(248,250,255,0.98)' : 'rgba(170,175,205,0.3)' } return DIM_COLOR[x.dimension ?? ''] ?? '#67e8f9' })   // mũi tên CHA–CON TRẮNG ĐẬM
        .linkDirectionalParticles((l: object) => { const x = l as L3 & { kind?: string }; if (x.kind === 'tree' || !particlesRef.current) return 0; const s = idOf(x.source); const tg = idOf(x.target); if (dimOffRef.current.has(x.dimension ?? '')) return 0; const cross = byId.get(s)?.layer !== byId.get(tg)?.layer; const shown = showAllDimsRef.current || dimActive(s, tg) || (bridgesRef.current && cross); if (!shown) return 0; return cross ? 6 : 3 })   // 🌊 DÒNG CHẢY: nhiều hạt (xuyên thiên hà 6) → thành VỆT SÁNG TRÔI dễ thấy
        .linkDirectionalParticleColor((l: object) => DIM_COLOR[(l as L3).dimension ?? ''] ?? '#67e8f9')
        .linkDirectionalParticleSpeed((l: object) => { const x = l as L3 & { kind?: string }; const cross = byId.get(idOf(x.source))?.layer !== byId.get(idOf(x.target))?.layer; return cross ? 0.0035 : 0.005 })   // xuyên thiên hà CHẬM hơn để mắt theo kịp
        .linkDirectionalParticleWidth((l: object) => { const x = l as L3 & { kind?: string }; const cross = byId.get(idOf(x.source))?.layer !== byId.get(idOf(x.target))?.layer; return cross ? 13 : 6 })   // hạt TO (xuyên thiên hà 13) — trước 5 quá nhỏ ở scale lớn nên không thấy
        .linkDirectionalParticleResolution(8)
        // HOVER = bừng CHÒM như 2D: node + cha + con + 1-hop liên kết sáng lên (đường cong bắn qua bừng), còn lại mờ
        .onNodeHover((node: object | null) => {
          if (selRef.current || searchModeRef.current) return
          if (node) {
            const id = (node as N3).id; const set = new Set<string>([id])
            const p = byId.get(id)?.parent_id; if (p) set.add(p)
            childrenOf.get(id)?.forEach(c => set.add(c)); adj.get(id)?.forEach(c => set.add(c))
            activeRef.current = set
          } else activeRef.current = null
          try { fg.nodeColor(fg.nodeColor()).linkColor(fg.linkColor()).linkVisibility(fg.linkVisibility()).linkWidth(fg.linkWidth()).linkDirectionalParticles(fg.linkDirectionalParticles()) } catch { /* */ }
        })
        // BẤM HÀNH TINH = ZOOM SÁT vào thiên hà của node đó (KHÔNG thấy 2 thiên hà kia) + TÂM XOAY = NGÔI SAO (kéo xoay quanh sao)
        .onNodeClick((n: object) => {
          const x = n as N3 & { x: number; y: number; z: number }; const g = byId.get(x.id); if (!g) return
          try {
            setSel(g)
            // tập "đang soi" = node + cha + con + liên kết 8 chiều (recompute cũng đặt activeRef như vậy)
            const set = neighborhood(x.id, depthRef.current)
            const ns = fg.graphData().nodes as { id: string; x?: number; y?: number; z?: number }[]
            const pts = ns.filter(p => set.has(p.id) && p.x != null)
            // tâm xoay = chính NODE được chọn (xoay quanh nó để nhìn nhiều góc) · khoảng lùi = bán kính chòm liên quan
            const cx = x.x, cy = x.y, cz = x.z
            let R = 70; for (const p of pts) { const d = Math.hypot((p.x ?? 0) - cx, (p.y ?? 0) - cy, (p.z ?? 0) - cz); if (d > R) R = d }
            const dist = R * 1.7 + 60
            // giữ HƯỚNG camera hiện tại, chỉ lại gần node (đỡ chóng mặt) — orbit sẽ xoay quanh node này. Dùng camera().position (cameraPosition() getter có thể undefined).
            const cam = fg.camera().position
            let dx = cam.x - cx, dy = cam.y - cy, dz = cam.z - cz; const len = Math.hypot(dx, dy, dz) || 1
            fg.cameraPosition({ x: cx + dx / len * dist, y: cy + dy / len * dist, z: cz + dz / len * dist }, { x: cx, y: cy, z: cz }, 800)
          } catch { /* GL lỗi → bỏ qua */ }
        })
        .onBackgroundClick(() => { setSel(null); setQ('') })   // bấm nền = CHỈ bỏ chọn (KHÔNG tự về toàn cảnh — founder ghét giật)
      fgRef.current = fg
      // 🌌 ĐẶT NODE DETERMINISTIC theo VÒNG-LEVEL (xoắn ốc 3D). QUAN TRỌNG: GIỮ lực 'link' (strength 0) — chính nó phân giải
      // source/target id→node để LINK RENDER được; bỏ hẳn lực link sẽ làm endpoint là chuỗi id → link vô hình. Node ghim bằng fx nên strength 0 không kéo.
      fg.d3Force('charge')?.strength(0); fg.d3Force('center', null)
      const lf = fg.d3Force('link'); if (lf) { lf.strength(0); lf.distance(0) }
      // 3 TÂM THIÊN HÀ (tam giác 3D), cách xa đủ để vòng ngoài không chạm nhau
      const GAL: Record<string, { x: number; y: number; z: number }> = {
        personal:  { x: 0,    y: 560,  z: 0 },
        corporate: { x: -800, y: -380, z: 0 },
        humanity:  { x: 800,  y: -380, z: 0 },
      }
      // nghiêng đĩa mỗi kho (Euler) → cảm giác "thiên hà xoắn ốc" 3D, mỗi kho 1 hướng cho đa dạng
      const TILT: Record<string, [number, number, number]> = { personal: [0.5, 0.25, 0], corporate: [-0.42, 0.5, 0.1], humanity: [0.38, -0.48, -0.08] }
      // gom node theo kho/level + bán kính vòng TỰ GIÃN theo số node (như 2D), per kho
      const byLL: Record<string, Record<number, string[]>> = {}
      for (const n of N) { const lv = levelOf.get(n.id) ?? 0; ((byLL[n.layer] ??= {})[lv] ??= []).push(n.id) }
      const BASE = 64, MINARC = 28
      const ringR: Record<string, Record<number, number>> = {}
      for (const L in byLL) { ringR[L] = {}; let prev = 0; for (let lv = 1; lv <= 8; lv++) { const arr = byLL[L][lv]; if (!arr?.length) continue; const need = (arr.length * MINARC) / (2 * Math.PI); const R = Math.max(BASE * (lv + 0.6), need, prev + BASE * 0.9); prev = R; ringR[L][lv] = R } }
      // đặt vị trí CỐ ĐỊNH (fx/fy/fz) — vòng tròn theo level, xoay thêm mỗi vòng (tay xoắn), nghiêng cả đĩa
      const _eu = new THREE.Euler(), _q = new THREE.Quaternion(), _v = new THREE.Vector3()
      const place = () => {
        const ns = fg.graphData().nodes as ({ id: string; layer: string; fx?: number; fy?: number; fz?: number; x?: number; y?: number; z?: number })[]
        for (const n of ns) {
          const L = n.layer ?? 'personal', g = GAL[L] ?? GAL.personal, lv = levelOf.get(n.id) ?? 0
          if (lv === 0) { n.fx = g.x; n.fy = g.y; n.fz = g.z; n.x = g.x; n.y = g.y; n.z = g.z; continue }
          const arr = byLL[L]?.[lv] ?? [], cnt = arr.length || 1, idx = Math.max(0, arr.indexOf(n.id))
          const R = ringR[L]?.[lv] ?? BASE * (lv + 0.6)
          const a = (idx / cnt) * Math.PI * 2 + lv * 0.6   // chia đều + xoay thêm mỗi vòng → tay xoắn ốc
          _v.set(Math.cos(a) * R, Math.sin(a) * R, Math.sin(idx * 1.7) * 10)   // đĩa XY + chút dày z
          const [tx, ty, tz] = TILT[L] ?? [0, 0, 0]; _eu.set(tx, ty, tz); _q.setFromEuler(_eu); _v.applyQuaternion(_q)
          n.fx = g.x + _v.x; n.fy = g.y + _v.y; n.fz = g.z + _v.z; n.x = n.fx; n.y = n.fy; n.z = n.fz
        }
      }
      place()
      fg.cooldownTicks(3)   // vài tick để lực link PHÂN GIẢI source/target (link mới render) + áp vị trí ghim, rồi đứng yên
      // FRAME toàn cảnh: tâm = trung bình 3 thiên hà (KHÔNG phải gốc toạ độ → hết lệch/văng), lùi đủ xa
      const cxAll = (GAL.personal.x + GAL.corporate.x + GAL.humanity.x) / 3
      const cyAll = (GAL.personal.y + GAL.corporate.y + GAL.humanity.y) / 3
      // 🚫 HẾT GIẬT: chỉ tự đưa về toàn cảnh LẦN ĐẦU (khi layout xong). Mọi reheat sau (đổi lực/tắt chiều/kéo node)
      // KHÔNG được tự dời camera nữa — đó chính là cảm giác "xoay xong bị kéo về". Nút ⌖ Toàn cảnh mới ép frame (force).
      let framedOnce = false
      const frameAll = (force = false) => {
        if (cancelled || (framedOnce && !force)) return
        framedOnce = true
        const ns = fg.graphData().nodes as { x?: number; y?: number; z?: number }[]
        let maxd = 300; for (const n of ns) { const d = Math.hypot((n.x ?? 0) - cxAll, (n.y ?? 0) - cyAll, n.z ?? 0); if (d > maxd) maxd = d }
        fg.cameraPosition({ x: cxAll, y: cyAll, z: maxd * 1.45 + 220 }, { x: cxAll, y: cyAll, z: 0 }, 900)
      }
      fg.onEngineStop(() => frameAll(false))
      frameCamRef.current = () => frameAll(true)
      // ↻ Refresh = ĐẶT LẠI vị trí node về xoắn ốc gốc (gỡ mọi node đã bị kéo lệch) + về toàn cảnh
      rebuildRef.current = () => { try { place(); fg.cooldownTicks(3); fg.d3ReheatSimulation(); frameAll(true) } catch { /* */ } }
      // bay + đặt TÂM XOAY vào 1 kho (xoay quanh kho đó)
      focusKhoRef.current = (L: string) => { const g = GAL[L]; if (!g) return; const rr = Object.values(ringR[L] ?? {}); const R = rr.length ? Math.max(...rr) : 150; fg.cameraPosition({ x: g.x, y: g.y, z: R * 1.9 + 160 }, { x: g.x, y: g.y, z: g.z }, 800) }
      timers.push(setTimeout(frameAll, 250), setTimeout(frameAll, 1100)) // dự phòng nếu onEngineStop trễ
      // ✨ TRƯỜNG SAO nhiều lớp — fract(sin) cho phân bố đều, có MÀU (ngả tím/vàng/hồng theo 3 kho) → chiều sâu + bao la
      const fr = (x: number) => { const s = Math.sin(x) * 43758.5453; return s - Math.floor(s) }   // pseudo-random [0,1) ổn định
      const TINTS = [[0.66, 0.55, 0.95], [0.99, 0.83, 0.42], [0.94, 0.67, 0.98], [0.75, 0.78, 0.95]]
      const makeStars = (n: number, spread: number, size: number, opacity: number, sat: number) => {
        const g = new THREE.BufferGeometry(); const pos = new Float32Array(n * 3); const col = new Float32Array(n * 3)
        for (let i = 0; i < n; i++) {
          // phân bố trong khối cầu (xa) — nghiêng về đĩa để giống dải ngân hà
          const r = Math.cbrt(fr(i * 1.7)) * spread, th = fr(i * 2.3) * Math.PI * 2, ph = (fr(i * 3.1) - 0.5) * Math.PI
          pos[i * 3] = Math.cos(th) * Math.cos(ph) * r; pos[i * 3 + 1] = Math.sin(ph) * r * 0.6; pos[i * 3 + 2] = Math.sin(th) * Math.cos(ph) * r
          const t = TINTS[Math.floor(fr(i * 5.7) * TINTS.length)]; const w = 1 - sat
          col[i * 3] = w + t[0] * sat; col[i * 3 + 1] = w + t[1] * sat; col[i * 3 + 2] = w + t[2] * sat
        }
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3))
        fg.scene().add(new THREE.Points(g, new THREE.PointsMaterial({ size, transparent: true, opacity, vertexColors: true, sizeAttenuation: true, depthWrite: false })))
      }
      makeStars(2200, 5200, 2.2, 0.5, 0.25)    // xa, nhỏ, trắng-ngả nhẹ
      makeStars(700, 3000, 4.5, 0.7, 0.6)      // gần, to, đậm màu
      // 🌟 SAO TÂM mỗi thiên hà: cầu phát sáng + QUẦNG TRÒN MỀM (texture radial) + tên kho
      const glowTex = (() => {
        const cv = document.createElement('canvas'); cv.width = cv.height = 128
        const g = cv.getContext('2d')!; const rg = g.createRadialGradient(64, 64, 0, 64, 64, 64)
        rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.25, 'rgba(255,255,255,0.7)'); rg.addColorStop(1, 'rgba(255,255,255,0)')
        g.fillStyle = rg; g.fillRect(0, 0, 128, 128)
        const t = new THREE.CanvasTexture(cv); return t
      })()
      const suns: { halo: THREE.Sprite; phase: number }[] = []
      ;(['personal', 'corporate', 'humanity'] as const).forEach((L, i) => {
        const c = GALAXY_PALETTE[L].star, ctr = GAL[L]
        const sun = new THREE.Mesh(new THREE.SphereGeometry(15, 24, 24), new THREE.MeshBasicMaterial({ color: c }))
        sun.position.set(ctr.x, ctr.y, 0); fg.scene().add(sun)
        const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: c, transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending, depthWrite: false }))
        halo.scale.set(150, 150, 1); halo.position.set(ctr.x, ctr.y, 0); fg.scene().add(halo)
        suns.push({ halo, phase: i * 2.1 })
        const lab = new SpriteText(LAYER_NAME[L]); lab.color = c; lab.textHeight = 14
        ;(lab as unknown as THREE.Object3D).position.set(ctr.x, ctr.y - 42, 0)
        ;(lab as unknown as { material: { depthWrite: boolean } }).material.depthWrite = false
        fg.scene().add(lab as unknown as THREE.Object3D)
      })
      // 🌫️ TINH VÂN (nebula) — đám mây sáng mềm additive, tô màu theo kho, RẢI quanh từng thiên hà +
      // VƯƠN về tâm chung → 3 thiên hà NHOÀ vào nhau thành "một dải". Đây là thứ tạo cảm giác bao la & hoà quyện.
      const nebMat = (hex: string, op: number) => new THREE.SpriteMaterial({ map: glowTex, color: hex, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false })
      const addNeb = (x: number, y: number, z: number, s: number, hex: string, op: number) => {
        const sp = new THREE.Sprite(nebMat(hex, op)); sp.scale.set(s, s, 1); sp.position.set(x, y, z); fg.scene().add(sp)
      }
      ;(['personal', 'corporate', 'humanity'] as const).forEach((L, gi) => {
        const ctr = GAL[L], base = GALAXY_PALETTE[L].base
        // 16 cụm mây quanh thiên hà — kéo dài về phía tâm chung (cxAll,cyAll) để vươn vào nhau
        for (let i = 0; i < 16; i++) {
          const k = gi * 50 + i, ang = fr(k * 1.3) * Math.PI * 2, rad = 80 + fr(k * 2.7) * 360
          const towardC = 0.18 + fr(k * 4.1) * 0.5   // kéo về tâm chung
          const x = ctr.x + Math.cos(ang) * rad + (cxAll - ctr.x) * towardC
          const y = ctr.y + Math.sin(ang) * rad + (cyAll - ctr.y) * towardC
          const z = (fr(k * 5.9) - 0.5) * 180
          addNeb(x, y, z, 240 + fr(k * 6.7) * 360, base, 0.05 + fr(k * 7.3) * 0.06)
        }
      })
      // 6 đám mây pha trộn Ở TÂM CHUNG (nơi 3 thiên hà gặp nhau) — dùng cả 3 màu kho → ranh giới tan vào nhau
      for (let i = 0; i < 6; i++) {
        const k = 900 + i, hx = [GALAXY_PALETTE.personal.base, GALAXY_PALETTE.corporate.base, GALAXY_PALETTE.humanity.base][i % 3]
        addNeb(cxAll + (fr(k) - 0.5) * 420, cyAll + (fr(k * 2) - 0.5) * 420, (fr(k * 3) - 0.5) * 160, 460 + fr(k * 4) * 420, hx, 0.05)
      }

      onResize = () => { if (wrap.current) { fg.width(wrap.current.clientWidth); fg.height(wrap.current.clientHeight) } }
      onResize(); window.addEventListener('resize', onResize)
      canvas = wrap.current.querySelector('canvas')
      onLost = (e: Event) => { e.preventDefault(); setGlError(true) }   // context mất → fallback gọn, không để three tự restore lỗi
      canvas?.addEventListener('webglcontextlost', onLost, false)
      // đổi nền 3D LIVE khi user bật/tắt tone trắng
      themeObs = new MutationObserver(() => { try { fg.backgroundColor(isLight() ? SCENE_BG.light : SCENE_BG.dark) } catch { /* */ } })
      themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
      // ⚠️ KHÔNG gọi fg.linkOpacity()/refresh mỗi frame — nó dựng lại TOÀN BỘ link → đơ (đã gỡ hiệu ứng "thở" gây treo).
      // "Sóng" giờ chỉ từ hạt particles chạy (rẻ). Tick chỉ lo auto-xoay (mặc định tắt).
      let ang = 0, breath = 0
      const tick = () => {
        try {
          if (autoRotRef.current) { ang += 0.0016; const d = 1500; fg.cameraPosition({ x: cxAll + d * Math.sin(ang), y: cyAll, z: d * Math.cos(ang) }) }
          // 🫧 NHỊP THỞ: quầng sao kho phồng/xẹp nhẹ + sáng/mờ (rẻ — chỉ 3 sprite, không đụng link)
          breath += 0.02
          for (const s of suns) { const b = 1 + Math.sin(breath + s.phase) * 0.08; s.halo.scale.set(150 * b, 150 * b, 1); (s.halo.material as THREE.SpriteMaterial).opacity = 0.55 + Math.sin(breath + s.phase) * 0.12 }
        } catch { /* context có thể mất giữa frame */ }
        raf = requestAnimationFrame(tick)
      }
      tick()
    }, 0)

    return () => {
      cancelled = true
      clearTimeout(initTimer); timers.forEach(clearTimeout)
      cancelAnimationFrame(raf)
      if (onResize) window.removeEventListener('resize', onResize)
      if (canvas && onLost) canvas.removeEventListener('webglcontextlost', onLost)
      themeObs?.disconnect()
      if (inst) {
        try { (inst as unknown as { pauseAnimation?: () => void }).pauseAnimation?.() } catch { /* bỏ qua */ }  // dừng vòng rAF nội bộ TRƯỚC
        try { inst._destructor?.() } catch { /* bỏ qua */ }                                                     // rồi dispose renderer + giải phóng context
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // refs để accessor đọc state mới nhất mà không dựng lại graph
  const selRef = useRef(sel); selRef.current = sel   // cho onNodeHover biết có đang chọn node không (đừng override)
  const hiddenRef = useRef(hidden); hiddenRef.current = hidden
  const labelsRef = useRef(labels); labelsRef.current = labels
  const particlesRef = useRef(particles); particlesRef.current = particles
  const dimOffRef = useRef(dimOff); dimOffRef.current = dimOff
  const showAllDimsRef = useRef(showAllDims); showAllDimsRef.current = showAllDims
  const bridgesRef = useRef(bridges); bridgesRef.current = bridges
  const depthRef = useRef(depth); depthRef.current = depth
  // tắt/bật chiều hay "hiện mọi liên kết" → CHỈ refresh link (không reheat, không đụng camera) → không bị giật
  useEffect(() => { const fg = fgRef.current; if (fg) fg.linkVisibility(fg.linkVisibility()).linkColor(fg.linkColor()).linkWidth(fg.linkWidth()).linkDirectionalParticles(fg.linkDirectionalParticles()) }, [dimOff, showAllDims, bridges])
  const autoRotRef = useRef(autoRot); autoRotRef.current = autoRot

  useEffect(() => { const fg = fgRef.current; if (fg) { fg.nodeVisibility(fg.nodeVisibility()).linkVisibility(fg.linkVisibility()).nodeThreeObject(fg.nodeThreeObject()) } }, [hidden, labels, maxLevel])
  useEffect(() => { const fg = fgRef.current; if (fg) fg.linkDirectionalParticles(fg.linkDirectionalParticles()) }, [particles])   // refresh accessor (giữ logic dòng chảy), KHÔNG ghi đè bằng hàm phẳng
  useEffect(() => { const fg = fgRef.current; if (fg) { fg.d3Force('charge')?.strength(repel); fg.d3Force('link')?.distance(linkDist); fg.d3ReheatSimulation() } }, [repel, linkDist])

  const topHubs = useMemo(() => [...deg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id, d]) => ({ n: byId.get(id), d })).filter(x => x.n), [deg, byId])
  // 🔗 CẦN NỐI: trang ÍT liên kết nhất (lẻ loi) — gợi ý user tạo liên kết. Bấm → soi node + (gợi ý trang phù hợp theo từ khoá tiêu đề).
  const STOP = useMemo(() => new Set(['của', 'và', 'các', 'một', 'cho', 'với', 'trong', 'là', 'những', 'được', 'khái', 'niệm', 'cốt', 'lõi', 'ví', 'dụ', 'thực', 'tế']), [])
  const titleWords = (s: string) => (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter(w => w.length >= 3 && !STOP.has(w))
  const lonely = useMemo(() => nodes.filter(n => n.kind !== 'kho' && n.kind !== 'block').map(n => ({ n, d: deg.get(n.id) ?? 0 })).sort((a, b) => a.d - b.d).slice(0, 6), [nodes, deg])
  // gợi ý 3 trang "hợp" để nối với node đang chọn (cùng từ khoá tiêu đề, khác trang, chưa nối)
  const suggestLinks = useMemo(() => {
    if (!sel) return [] as { n: GNode; shared: string[] }[]
    const linked = new Set<string>(); links.forEach(l => { if (l.from_node === sel.id) linked.add(l.to_node); if (l.to_node === sel.id) linked.add(l.from_node) })
    const fw = new Set(titleWords(sel.title ?? ''))
    if (!fw.size) return []
    return nodes.filter(n => n.id !== sel.id && n.kind !== 'kho' && n.kind !== 'block' && !linked.has(n.id))
      .map(n => ({ n, shared: titleWords(n.title ?? '').filter(w => fw.has(w)) }))
      .filter(x => x.shared.length > 0).sort((a, b) => b.shared.length - a.shared.length).slice(0, 4)
  }, [sel, nodes, links]) // eslint-disable-line react-hooks/exhaustive-deps
  const toggleLayer = (L: string) => setHidden(s => { const n = new Set(s); n.has(L) ? n.delete(L) : n.add(L); return n })

  if (glError) return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-[#06060c] text-center px-8">
      <div className="max-w-sm">
        <div className="text-4xl mb-3">🪐</div>
        <div className="text-zinc-200 text-base font-semibold mb-1.5">Máy này chưa bật được 3D</div>
        <p className="text-zinc-500 text-[13px] leading-relaxed mb-4">Trình duyệt không tạo được đồ hoạ 3D (WebGL) — thường do tăng tốc phần cứng bị tắt hoặc card yếu. Bạn vẫn xem được toàn bộ bằng các chế độ 2D: <b className="text-zinc-300">Galaxy · Cây sự sống · Dòng đời</b>.</p>
        <button onClick={onClose} className="rounded-lg ak-cta px-5 py-2 text-sm font-bold">← Về 2D</button>
        <p className="text-zinc-600 text-[11px] mt-3">Mẹo: bật “Use hardware acceleration” trong cài đặt trình duyệt rồi mở lại.</p>
      </div>
    </div>
  )
  return (
    <div className="absolute inset-0 z-20 flex bg-[#06060c]">
      {/* PANEL TRÁI */}
      <div className="w-[270px] shrink-0 border-r border-[var(--hud-line)] bg-[#0b0b14]/80 backdrop-blur p-3 overflow-auto flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="hud-label hud-label-accent text-left">← về 2D</button>
          <button onClick={() => { rebuildRef.current?.() }} title="Refresh 3D — dựng lại vị trí node + về khung (khi nhìn lỗi)" className="ml-auto text-[10px] rounded-md border border-white/10 text-zinc-400 px-2 py-1 hover:text-white hover:border-white/25">↻ Refresh</button>
          <button onClick={() => { setSel(null); setQ(''); frameCamRef.current?.() }} title="Đưa camera về toàn cảnh 3 thiên hà" className="text-[10px] rounded-md border border-white/10 text-zinc-400 px-2 py-1 hover:text-white hover:border-white/25">⌖ Toàn cảnh</button>
        </div>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="🔍 Tìm trong não — node liên quan sáng, còn lại tắt" className="w-full rounded-lg bg-white/5 border border-[var(--hud-line)] px-3 py-2 text-xs outline-none focus:border-violet-400/50" />
        {/* INSPECTOR */}
        <div>
          <div className="hud-label mb-1">Inspector</div>
          {sel ? (
            <div className="hud-panel p-3">
              <div className="flex items-center gap-2 mb-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: LAYER_TINT[sel.layer ?? 'personal'] }} /><span className="text-sm font-semibold truncate">{sel.title}</span></div>
              <div className="text-[11px] text-zinc-500 mb-2">{LAYER_NAME[sel.layer ?? 'personal']} · {deg.get(sel.id) ?? 0} liên kết</div>
              <div className="flex items-center gap-1 mb-2">
                <span className="hud-label mr-1" title="Hiện liên kết tới mấy tầng quanh node">Tầng liên quan</span>
                {[1, 2, 3].map(d => <button key={d} onClick={() => setDepth(d)} className={`w-6 h-6 rounded text-xs ${depth === d ? 'ak-cta text-white' : 'bg-white/5 border border-white/10 text-zinc-400'}`}>{d}</button>)}
              </div>
              <button onClick={() => openPeek(sel)} className="w-full rounded-lg ak-cta px-3 py-1.5 text-xs font-bold">Mở trang (đọc tại đây) →</button>
              {suggestLinks.length > 0 && (
                <div className="mt-2.5 pt-2.5 border-t border-white/10">
                  <div className="hud-label mb-1" style={{ fontSize: 9 }}>💡 Gợi ý nối (cùng từ khoá)</div>
                  <div className="space-y-0.5">
                    {suggestLinks.map(({ n, shared }) => (
                      <button key={n.id} onClick={() => setSel(n)} title={`Trùng từ khoá: ${shared.join(', ')} — bấm để soi rồi mở trang tạo liên kết`} className="w-full flex items-center gap-1.5 text-left rounded-md px-2 py-1 hover:bg-white/5 text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: LAYER_TINT[n.layer ?? 'personal'] }} /><span className="truncate text-zinc-400">{n.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : <p className="text-[11px] text-zinc-600 leading-relaxed">Bấm 1 node để soi — node + liên kết của nó sáng lên, đọc được ở đây. Gõ ô tìm để lọc theo tên.</p>}
        </div>
        {/* TOP HUBS */}
        <div>
          <div className="hud-label mb-0.5">🔗 Nối nhiều nhất</div>
          <p className="text-[10px] text-zinc-600 leading-snug mb-1">Trang có nhiều liên kết nhất — “trạm” tri thức của bạn. Số = số liên kết. Bấm để soi.</p>
          <div className="space-y-0.5">
            {topHubs.map(({ n, d }) => (
              <button key={n!.id} onClick={() => setSel(n!)} title={`${d} liên kết — bấm để soi node này`} className="w-full flex items-center justify-between text-left rounded-md px-2 py-1 hover:bg-white/5 text-xs">
                <span className="flex items-center gap-1.5 min-w-0"><span className="w-2 h-2 rounded-full shrink-0" style={{ background: LAYER_TINT[n!.layer ?? 'personal'] }} /><span className="truncate text-zinc-300">{n!.title}</span></span>
                <span className="text-zinc-500 tabular-nums shrink-0">{d} <span className="text-zinc-600">🔗</span></span>
              </button>
            ))}
          </div>
        </div>
        {/* 🪢 CẦN NỐI — trang lẻ loi, ít liên kết → bấm để soi + gợi ý trang nối */}
        <div>
          <div className="hud-label mb-0.5">🪢 Cần nối (ít liên kết)</div>
          <p className="text-[10px] text-zinc-600 leading-snug mb-1">Trang lẻ loi — bấm để soi, mở trang rồi nối ở phần 8 chiều.</p>
          <div className="space-y-0.5">
            {lonely.map(({ n, d }) => (
              <button key={n.id} onClick={() => setSel(n)} title={`${d} liên kết — bấm để soi & gợi ý nối`} className="w-full flex items-center justify-between text-left rounded-md px-2 py-1 hover:bg-white/5 text-xs">
                <span className="flex items-center gap-1.5 min-w-0"><span className="w-2 h-2 rounded-full shrink-0" style={{ background: LAYER_TINT[n.layer ?? 'personal'] }} /><span className="truncate text-zinc-400">{n.title}</span></span>
                <span className={`tabular-nums shrink-0 ${d === 0 ? 'text-amber-400' : 'text-zinc-600'}`}>{d}</span>
              </button>
            ))}
          </div>
        </div>
        {/* ĐỘ SÂU HỆ MẶT TRỜI — chỉ hiện tới tầng chọn */}
        <div>
          <div className="hud-label mb-1.5">Độ sâu hệ</div>
          <div className="flex items-center gap-1">
            {([[1, 'Hành tinh'], [3, 'Vệ tinh'], [5, 'Tầng 5'], [8, 'Tất cả']] as [number, string][]).map(([lv, lb]) => (
              <button key={lv} onClick={() => setMaxLevel(lv)} title={`Hiện tới tầng ${lv === 8 ? '7 (tất cả)' : lv}`} className={`flex-1 rounded-md px-1 py-1 text-[10px] ${maxLevel === lv ? 'ak-cta text-white' : 'bg-white/5 border border-white/10 text-zinc-400'}`}>{lv === 8 ? 'Tất cả' : lv}<div className="text-[7px] opacity-70 leading-none mt-0.5">{lb}</div></button>
            ))}
          </div>
        </div>
        {/* LỰC */}
        <div>
          <div className="hud-label mb-1.5">Lực</div>
          <label className="block text-[10px] text-zinc-500 mb-0.5">Đẩy {repel}</label>
          <input type="range" min={-400} max={-30} value={repel} onChange={e => setRepel(+e.target.value)} className="w-full accent-violet-400 mb-2" />
          <label className="block text-[10px] text-zinc-500 mb-0.5">Độ dài link {linkDist}</label>
          <input type="range" min={10} max={120} value={linkDist} onChange={e => setLinkDist(+e.target.value)} className="w-full accent-violet-400" />
        </div>
        {/* HIỂN THỊ */}
        <div className="space-y-1.5">
          <div className="hud-label mb-0.5">Hiển thị</div>
          {([['Nhãn hub', labels, setLabels], ['🌊 Dòng chảy (chiều liên kết)', particles, setParticles], ['🌉 Cầu nối thiên hà (hoà quyện)', bridges, setBridges], ['Hiện MỌI liên kết 8 chiều', showAllDims, setShowAllDims], ['Tự xoay', autoRot, setAutoRot]] as const).map(([lb, v, set]) => (
            <label key={lb} className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer"><input type="checkbox" checked={v} onChange={e => (set as (b: boolean) => void)(e.target.checked)} className="accent-violet-500" /> {lb}</label>
          ))}
          <p className="text-[10px] text-zinc-600 leading-snug mt-0.5">Mặc định ẩn web 8 chiều cho gọn — <b className="text-zinc-400">bấm 1 node</b> để hiện link & back-link của riêng nó.</p>
        </div>
      </div>

      {/* CANVAS */}
      <div ref={wrap} className="flex-1 min-w-0 relative" />

      {/* PANEL PHẢI — FILTER theo kho */}
      <div className="absolute right-3 top-3 w-[180px] hud-panel bg-[#0b0b14]/85 backdrop-blur p-2.5 z-10">
        <div className="hud-label mb-1.5">3 thiên hà (kho)</div>
        {Object.entries(layers).map(([L, c]) => (
          <div key={L} className={`w-full flex items-center gap-1 rounded-md px-1 py-1 text-xs ${hidden.has(L) ? 'opacity-35' : 'hover:bg-white/5'}`}>
            <button onClick={() => toggleLayer(L)} title="Ẩn/hiện kho" className="flex items-center gap-1.5 flex-1 text-left min-w-0"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: LAYER_TINT[L] }} /><span className="truncate">{LAYER_NAME[L] ?? L}</span></button>
            <button onClick={() => focusKhoRef.current?.(L)} title="Xoay quanh kho này (đặt tâm)" className="text-zinc-500 hover:text-white px-1">◎</button>
            <span className="text-zinc-600 tabular-nums">{c}</span>
          </div>
        ))}
        <div className="hud-label mt-2 mb-1 flex items-center gap-1" style={{ fontSize: 8.5 }}>
          <span>6 chiều quan hệ · bấm để tắt</span>
          <button onClick={() => setDimOff(p => p.size ? new Set() : new Set(Object.keys(DIM_COLOR)))} title="Ẩn/hiện tất cả đường 8 chiều → thấy rõ xoắn ốc thiên hà" className="ml-auto text-[8px] rounded border border-white/10 px-1 text-zinc-400 hover:text-white">{dimOff.size ? 'hiện hết' : 'ẩn hết'}</button>
        </div>
        <div className="grid grid-cols-2 gap-0.5">
          {Object.entries(DIM_COLOR).filter(([d]) => d !== 'time' && d !== 'emotion').map(([d, c]) => { const off = dimOff.has(d); return (
            <button key={d} onClick={() => setDimOff(p => { const n = new Set(p); n.has(d) ? n.delete(d) : n.add(d); return n })} title={`${off ? 'Bật' : 'Tắt'} đường chiều ${DIM_LABEL[d] ?? d}`} className={`flex items-center gap-1 text-[9px] ${off ? 'text-zinc-700 line-through' : 'text-zinc-400 hover:text-white'}`}>
              <span className="w-2 h-2 rounded-full" style={{ background: c, opacity: off ? 0.3 : 1 }} />{DIM_LABEL[d] ?? d}
            </button>
          )})}
        </div>
      </div>
      {/* 📖 PEEK: đọc trang NGAY trong 3D — không nhảy về 2D. Muốn sửa đầy đủ thì bấm "Sửa toàn trang". */}
      {peek && (
        <div className="absolute right-3 top-3 bottom-3 w-[360px] max-w-[42vw] z-20 rounded-xl border border-[var(--hud-line)] bg-[#0b0b14]/95 backdrop-blur flex flex-col shadow-2xl shadow-black/50">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/10">
            <span className="text-sm font-bold truncate flex-1">{peek.title}</span>
            <button onClick={() => { const n = byId.get(peek.id); if (n) { onOpen(n); onClose() } }} title="Mở để chỉnh sửa (sang 2D)" className="text-[10px] rounded-md ak-cta px-2.5 py-1.5 font-semibold shrink-0">✏️ Sửa toàn trang</button>
            <button onClick={() => setPeek(null)} className="w-7 h-7 grid place-items-center rounded-md bg-white/5 border border-white/10 shrink-0">✕</button>
          </div>
          <div className="flex-1 overflow-auto px-4 py-3 text-[13px] leading-relaxed text-zinc-300 whitespace-pre-wrap">
            {peekLoading ? <span className="text-zinc-600">Đang tải…</span> : peek.md}
          </div>
        </div>
      )}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 hud-label text-center" style={{ fontSize: 9 }}>kéo = xoay quanh điểm nhìn · cuộn = zoom · bấm node = zoom soi + hiện liên kết (xoay để xem nhiều góc) · nền = bỏ chọn · ↻ = đặt lại vị trí</div>
    </div>
  )
}
