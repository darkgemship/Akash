'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import ForceGraph3D from '3d-force-graph'
import * as THREE from 'three'
import SpriteText from 'three-spritetext'
import type { GNode, GLink } from './Galaxy'
import { DIM_COLOR } from './Galaxy'

// màu theo KHO (đồng bộ mode 3 Vòng): đời tôi cyan · QNET tím · nhân loại hồng
const LAYER_TINT: Record<string, string> = { personal: '#22d3ee', corporate: '#a78bfa', humanity: '#e879f9' }
const LAYER_NAME: Record<string, string> = { personal: '🧠 Cá nhân', corporate: '🌐 QNET', humanity: '♾️ Nhân loại' }
// 🌟 mỗi kho = 1 THIÊN HÀ có SAO ở tâm + dải màu 5 LEVEL (sâu dần) phối hài hoà:
//   L0 = sao tâm · L1 = "trái đất" · L2-L4 = 3 màu phối · L5+ giữ màu cuối. Sao mỗi kho 1 màu riêng.
// 5 TẦNG hệ mặt trời: L0 SAO tâm · L1 hành tinh · L2 tiểu hành tinh · L3 vệ tinh · L4+ thiên thạch (đen xạm)
const GALAXY_PALETTE: Record<string, { star: string; levels: string[] }> = {
  personal:  { star: '#ff5a36', levels: ['#ff5a36', '#ffb37a', '#3b82f6', '#93c5fd', '#4b5563'] }, // đỏ → cam nhạt → xanh dương → xanh nhạt → đen xạm
  corporate: { star: '#f5b942', levels: ['#f5b942', '#a855f7', '#fde68a', '#2dd4bf', '#4b5563'] }, // vàng → tím → vàng nhạt → xanh ngọc → đen xạm
  humanity:  { star: '#e879f9', levels: ['#e879f9', '#fb7185', '#818cf8', '#c4b5fd', '#4b5563'] }, // hồng → hồng đào → chàm → tím nhạt → đen xạm
}
const galaxyColor = (layer: string, level: number) => {
  const p = GALAXY_PALETTE[layer] ?? GALAXY_PALETTE.personal
  return p.levels[Math.min(level, p.levels.length - 1)] ?? p.levels[0]
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
  const byId = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes])
  // LEVEL trong kho = số bước parent_id tới gốc kho (kho=0, con=1, cháu=2…) → tô màu theo tầng
  const levelOf = useMemo(() => {
    const m = new Map<string, number>(); const idmap = new Map(nodes.map(n => [n.id, n]))
    const calc = (id: string, seen: Set<string>): number => {
      if (m.has(id)) return m.get(id)!
      const n = idmap.get(id); if (!n) return 0
      if (n.kind === 'kho' || !n.parent_id || !idmap.has(n.parent_id) || seen.has(n.parent_id)) { m.set(id, 0); return 0 }
      seen.add(id); const v = Math.min(5, calc(n.parent_id, seen) + 1); m.set(id, v); return v
    }
    nodes.forEach(n => calc(n.id, new Set())); return m
  }, [nodes])
  const deg = useMemo(() => { const m = new Map<string, number>(); links.forEach(l => { m.set(l.from_node, (m.get(l.from_node) ?? 0) + 1); m.set(l.to_node, (m.get(l.to_node) ?? 0) + 1) }); return m }, [links])
  const adj = useMemo(() => { const m = new Map<string, Set<string>>(); links.forEach(l => { (m.get(l.from_node) ?? m.set(l.from_node, new Set()).get(l.from_node)!).add(l.to_node); (m.get(l.to_node) ?? m.set(l.to_node, new Set()).get(l.to_node)!).add(l.from_node) }); return m }, [links])

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
  const [labels, setLabels] = useState(true)
  const [autoRot, setAutoRot] = useState(false)
  const [maxLevel, setMaxLevel] = useState(5)   // độ sâu HỆ MẶT TRỜI: 1=hành tinh · 2=+tiểu hành tinh · 3=+vệ tinh · 4+=tất cả
  const maxLevelRef = useRef(5); maxLevelRef.current = maxLevel
  const [glError, setGlError] = useState(false)   // WebGL không tạo được context (GPU yếu/cạn) → hiện fallback thay vì sập app

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

  // tính lại tập sáng từ search/chọn rồi refresh graph
  const recompute = () => {
    const fg = fgRef.current; if (!fg) return
    const qq = vnorm(q)
    searchModeRef.current = !!qq
    if (qq) {
      const hits = nodes.filter(n => vnorm(n.title ?? '').includes(qq)).map(n => n.id)
      activeRef.current = hits.length ? expand(hits, 1) : new Set()   // search: trúng + hàng xóm 1 bước, còn lại TẮT (ẩn)
    } else if (sel) {
      activeRef.current = expand([sel.id], depth)   // chọn node: tập sáng = node + nhánh tới độ sâu `depth`; ngoài tập chỉ MỜ
    } else activeRef.current = null
    fg.nodeVisibility(fg.nodeVisibility()).linkVisibility(fg.linkVisibility()).nodeColor(fg.nodeColor()).linkColor(fg.linkColor())
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
      const N: N3[] = nodes.filter(n => n.kind !== 'block').map(n => ({ id: n.id, name: n.title ?? 'Trang', layer: n.layer ?? 'personal', kind: n.kind, val: 1.6 + Math.min(11, (deg.get(n.id) ?? 0)) * 0.6 }))
      const present = new Set(N.map(n => n.id))
      const L: L3[] = links.filter(l => present.has(l.from_node) && present.has(l.to_node)).map(l => ({ source: l.from_node, target: l.to_node, dimension: l.dimension, weight: 1 }))
      const vis = (id: string) => !hiddenRef.current.has(byId.get(id)?.layer ?? 'personal') && (levelOf.get(id) ?? 0) <= maxLevelRef.current && (!searchModeRef.current || !activeRef.current || activeRef.current.has(id))

      let fg: FG
      try {
        // attrs tối giản cho TƯƠNG THÍCH cao nhất: KHÔNG ép powerPreference (máy chỉ có GPU tích hợp dễ fail nếu ép high-performance);
        // stencil off (tránh OES_packed_depth_stencil) + cho phép GPU yếu (failIfMajorPerformanceCaveat:false).
        fg = new ForceGraph3D(wrap.current, { rendererConfig: { antialias: false, alpha: true, stencil: false, failIfMajorPerformanceCaveat: false } })
      } catch (e) { console.warn('3D init failed', e); setGlError(true); return }
      inst = fg
      fg
        .backgroundColor(isLight() ? SCENE_BG.light : SCENE_BG.dark)
        .graphData({ nodes: N, links: L })
        .nodeVal('val')
        .nodeRelSize(4.2)
        .nodeResolution(12)
        .nodeOpacity(0.95)
        .nodeColor((n: object) => { const x = n as N3; const on = !activeRef.current || activeRef.current.has(x.id); return on ? galaxyColor(x.layer, levelOf.get(x.id) ?? 1) : 'rgba(120,120,140,0.1)' })
        .nodeVisibility((n: object) => vis((n as N3).id))
        .nodeLabel((n: object) => `<div style="font:600 12px sans-serif;color:#fff">${(n as N3).name}</div><div style="font:11px sans-serif;color:#a78bfa">${LAYER_NAME[(n as N3).layer] ?? ''} · ${deg.get((n as N3).id) ?? 0} liên kết</div>`)
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
        // DÂY = sợi mờ trung tính (không tô 8 màu lên dây → hết loạn); MÀU 8 CHIỀU dồn lên HẠT sáng chạy theo wave
        .linkColor((l: object) => { const x = l as L3; const s = typeof x.source === 'object' ? (x.source as N3).id : x.source as string; const tg = typeof x.target === 'object' ? (x.target as N3).id : x.target as string; const on = !activeRef.current || (activeRef.current.has(s) && activeRef.current.has(tg)); const lt = isLight(); return on ? (lt ? 'rgba(60,55,90,0.22)' : 'rgba(190,195,225,0.16)') : (lt ? 'rgba(80,80,100,0.06)' : 'rgba(120,120,140,0.04)') })
        .linkVisibility((l: object) => { const x = l as L3; const s = typeof x.source === 'object' ? (x.source as N3).id : x.source as string; const tg = typeof x.target === 'object' ? (x.target as N3).id : x.target as string; return vis(s) && vis(tg) })
        .linkOpacity(0.5)
        .linkWidth(0.5)
        .linkDirectionalArrowLength(2.6)           // mũi tên hướng theo chiều liên kết (from → to)
        .linkDirectionalArrowRelPos(0.92)
        .linkDirectionalArrowColor((l: object) => DIM_COLOR[(l as L3).dimension ?? ''] ?? '#67e8f9')
        .linkDirectionalParticles((l: object) => { const x = l as L3; const s = typeof x.source === 'object' ? (x.source as N3).id : x.source as string; const tg = typeof x.target === 'object' ? (x.target as N3).id : x.target as string; const on = !activeRef.current || (activeRef.current.has(s) && activeRef.current.has(tg)); return particlesRef.current && on ? 3 : 0 })
        .linkDirectionalParticleColor((l: object) => DIM_COLOR[(l as L3).dimension ?? ''] ?? '#67e8f9')   // hạt mang màu CHIỀU liên kết
        .linkDirectionalParticleSpeed(0.005)
        .linkDirectionalParticleWidth(2.2)
        .onNodeClick((n: object) => { const g = byId.get((n as N3).id); if (g) { setSel(g); fg.cameraPosition({ x: (n as { x: number }).x, y: (n as { y: number }).y, z: (n as { z: number }).z + 120 }, n as { x: number; y: number; z: number }, 700) } })
        .onBackgroundClick(() => { setSel(null); setQ(''); frameCamRef.current?.() })   // bấm nền = bỏ chọn + VỀ TOÀN CẢNH
      fgRef.current = fg
      fg.d3Force('charge')?.strength(repelRef.current)
      fg.d3Force('link')?.distance(linkRef.current)
      // 🌌 3 THIÊN HÀ: kéo mỗi kho về 1 tâm riêng trên trục X → tách thành 3 cụm rõ rệt (đời tôi · QNET · nhân loại)
      // 3 thiên hà xếp TAM GIÁC (gọn khung hơn xếp hàng ngang → node to, vẫn thấy đủ 3 cụm)
      const GAL: Record<string, { x: number; y: number }> = { personal: { x: 0, y: 360 }, corporate: { x: -430, y: -250 }, humanity: { x: 430, y: -250 } }
      // 🌌 TÁCH 3 THIÊN HÀ kiểu DETERMINISTIC: để sim chạy tự nhiên thành 1 cụm, RỒI sau khi nguội dời nguyên cụm
      // con của mỗi kho về tâm thiên hà của nó (giữ cấu trúc nội bộ, chỉ tịnh tiến + nén nhẹ). Chắc ăn, không phụ thuộc lực.
      fg.cooldownTicks(90)   // engine dừng sớm (~2s) để bố trí thiên hà rồi đứng yên
      type Pos = { id?: string; layer?: string; x: number; y: number; z: number; __gal?: boolean }
      // gom node thành VÀNH QUỸ ĐẠO quanh SAO tâm: bán kính theo LEVEL (kho gần sao, page sâu ra xa) — như hệ mặt trời
      const layoutGalaxies = () => {
        const ns = fg.graphData().nodes as Pos[]
        if (!ns.length || ns[0].__gal) return   // chỉ làm 1 lần
        const cen: Record<string, { x: number; y: number; z: number; n: number }> = {}
        for (const n of ns) { const L = n.layer ?? 'corporate'; (cen[L] ??= { x: 0, y: 0, z: 0, n: 0 }); cen[L].x += n.x ?? 0; cen[L].y += n.y ?? 0; cen[L].z += n.z ?? 0; cen[L].n++ }
        for (const L in cen) { cen[L].x /= cen[L].n || 1; cen[L].y /= cen[L].n || 1; cen[L].z /= cen[L].n || 1 }
        for (const n of ns) {
          const L = n.layer ?? 'corporate', g = GAL[L] ?? GAL.corporate, c = cen[L]
          // hướng quỹ đạo = hướng node toả ra từ tâm cụm lúc settle (giữ node liên quan gần nhau)
          let dx = (n.x ?? 0) - c.x, dy = (n.y ?? 0) - c.y, dz = (n.z ?? 0) - c.z
          let len = Math.hypot(dx, dy, dz)
          if (len < 1) { const a = Math.random() * 6.28, b = Math.random() * 3.14; dx = Math.sin(b) * Math.cos(a); dy = Math.sin(b) * Math.sin(a); dz = Math.cos(b); len = 1 }
          const lvl = levelOf.get(n.id ?? '') ?? 1
          const r = 30 + lvl * 52 + (len % 18)   // shell theo level + chút lệch để khỏi chồng khít
          n.x = g.x + dx / len * r
          n.y = g.y + dy / len * r
          n.z = dz / len * r * 0.7
          n.__gal = true
        }
      }
      // FRAME: nhìn thẳng vào tâm cụm, lùi xa theo bán kính
      const frameCam = () => {
        if (cancelled) return
        const ns = (fg.graphData().nodes as { x?: number; y?: number; z?: number }[])
        // bán kính PHÂN VỊ 85% (bỏ vài node văng lẻ) → khung sát, node không bị bé tí
        const ds = ns.map(n => Math.hypot(n.x ?? 0, n.y ?? 0, n.z ?? 0)).sort((a, b) => a - b)
        const r = ds.length ? ds[Math.floor(ds.length * 0.85)] : 300
        fg.cameraPosition({ x: 0, y: 0, z: Math.max(260, r * 1.7 + 120) }, { x: 0, y: 0, z: 0 }, 900)
      }
      const settle = () => { layoutGalaxies(); frameCam() }   // dời 3 thiên hà rồi đóng khung
      fg.onEngineStop(settle)
      frameCamRef.current = frameCam
      timers.push(setTimeout(settle, 2600), setTimeout(settle, 5200)) // dự phòng nếu onEngineStop trễ
      // ✨ trường sao nền
      const stars = new THREE.BufferGeometry()
      const arr = new Float32Array(600 * 3)
      for (let i = 0; i < arr.length; i++) arr[i] = (Math.sin(i * 99.13) * 0.5) * 4200
      stars.setAttribute('position', new THREE.BufferAttribute(arr, 3))
      fg.scene().add(new THREE.Points(stars, new THREE.PointsMaterial({ color: 0x8b86b0, size: 1.6, transparent: true, opacity: 0.6 })))
      // 🌟 SAO TÂM mỗi thiên hà: cầu phát sáng + QUẦNG TRÒN MỀM (texture radial) + tên kho
      const glowTex = (() => {
        const cv = document.createElement('canvas'); cv.width = cv.height = 128
        const g = cv.getContext('2d')!; const rg = g.createRadialGradient(64, 64, 0, 64, 64, 64)
        rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.25, 'rgba(255,255,255,0.7)'); rg.addColorStop(1, 'rgba(255,255,255,0)')
        g.fillStyle = rg; g.fillRect(0, 0, 128, 128)
        const t = new THREE.CanvasTexture(cv); return t
      })()
      ;(['personal', 'corporate', 'humanity'] as const).forEach(L => {
        const c = GALAXY_PALETTE[L].star, ctr = GAL[L]
        const sun = new THREE.Mesh(new THREE.SphereGeometry(15, 24, 24), new THREE.MeshBasicMaterial({ color: c }))
        sun.position.set(ctr.x, ctr.y, 0); fg.scene().add(sun)
        const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: c, transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending, depthWrite: false }))
        halo.scale.set(150, 150, 1); halo.position.set(ctr.x, ctr.y, 0); fg.scene().add(halo)
        const lab = new SpriteText(LAYER_NAME[L]); lab.color = c; lab.textHeight = 14
        ;(lab as unknown as THREE.Object3D).position.set(ctr.x, ctr.y - 42, 0)
        ;(lab as unknown as { material: { depthWrite: boolean } }).material.depthWrite = false
        fg.scene().add(lab as unknown as THREE.Object3D)
      })

      onResize = () => { if (wrap.current) { fg.width(wrap.current.clientWidth); fg.height(wrap.current.clientHeight) } }
      onResize(); window.addEventListener('resize', onResize)
      canvas = wrap.current.querySelector('canvas')
      onLost = (e: Event) => { e.preventDefault(); setGlError(true) }   // context mất → fallback gọn, không để three tự restore lỗi
      canvas?.addEventListener('webglcontextlost', onLost, false)
      // đổi nền 3D LIVE khi user bật/tắt tone trắng
      themeObs = new MutationObserver(() => { try { fg.backgroundColor(isLight() ? SCENE_BG.light : SCENE_BG.dark) } catch { /* */ } })
      themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
      let ang = 0
      const tick = () => { try { if (autoRotRef.current) { ang += 0.0016; const d = 380; fg.cameraPosition({ x: d * Math.sin(ang), z: d * Math.cos(ang) }) } } catch { /* context có thể mất giữa frame */ } raf = requestAnimationFrame(tick) }
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
  const hiddenRef = useRef(hidden); hiddenRef.current = hidden
  const labelsRef = useRef(labels); labelsRef.current = labels
  const particlesRef = useRef(particles); particlesRef.current = particles
  const autoRotRef = useRef(autoRot); autoRotRef.current = autoRot
  const repelRef = useRef(repel); repelRef.current = repel
  const linkRef = useRef(linkDist); linkRef.current = linkDist

  useEffect(() => { const fg = fgRef.current; if (fg) { fg.nodeVisibility(fg.nodeVisibility()).linkVisibility(fg.linkVisibility()).nodeThreeObject(fg.nodeThreeObject()) } }, [hidden, labels, maxLevel])
  useEffect(() => { fgRef.current?.linkDirectionalParticles(() => particles ? 2 : 0) }, [particles])
  useEffect(() => { const fg = fgRef.current; if (fg) { fg.d3Force('charge')?.strength(repel); fg.d3Force('link')?.distance(linkDist); fg.d3ReheatSimulation() } }, [repel, linkDist])

  const topHubs = useMemo(() => [...deg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id, d]) => ({ n: byId.get(id), d })).filter(x => x.n), [deg, byId])
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
          <button onClick={() => { setSel(null); setQ(''); frameCamRef.current?.() }} title="Đưa camera về toàn cảnh 3 thiên hà" className="ml-auto text-[10px] rounded-md border border-white/10 text-zinc-400 px-2 py-1 hover:text-white hover:border-white/25">⌖ Toàn cảnh</button>
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
                <span className="hud-label mr-1">Depth</span>
                {[1, 2, 3].map(d => <button key={d} onClick={() => setDepth(d)} className={`w-6 h-6 rounded text-xs ${depth === d ? 'ak-cta text-white' : 'bg-white/5 border border-white/10 text-zinc-400'}`}>{d}</button>)}
              </div>
              <button onClick={() => onOpen(sel)} className="w-full rounded-lg ak-cta px-3 py-1.5 text-xs font-bold">Mở trang →</button>
            </div>
          ) : <p className="text-[11px] text-zinc-600 leading-relaxed">Bấm 1 node để soi — node + liên kết của nó sáng lên, đọc được ở đây. Gõ ô tìm để lọc theo tên.</p>}
        </div>
        {/* TOP HUBS */}
        <div>
          <div className="hud-label mb-1">Top hubs</div>
          <div className="space-y-0.5">
            {topHubs.map(({ n, d }) => (
              <button key={n!.id} onClick={() => { setSel(n!); fgRef.current?.zoomToFit?.(600) }} className="w-full flex items-center justify-between text-left rounded-md px-2 py-1 hover:bg-white/5 text-xs">
                <span className="flex items-center gap-1.5 min-w-0"><span className="w-2 h-2 rounded-full shrink-0" style={{ background: LAYER_TINT[n!.layer ?? 'personal'] }} /><span className="truncate text-zinc-300">{n!.title}</span></span>
                <span className="text-zinc-600 tabular-nums">{d}</span>
              </button>
            ))}
          </div>
        </div>
        {/* ĐỘ SÂU HỆ MẶT TRỜI — chỉ hiện tới tầng chọn */}
        <div>
          <div className="hud-label mb-1.5">Độ sâu hệ</div>
          <div className="flex items-center gap-1">
            {([[1, 'Hành tinh'], [2, 'Tiểu HT'], [3, 'Vệ tinh'], [5, 'Tất cả']] as [number, string][]).map(([lv, lb]) => (
              <button key={lv} onClick={() => setMaxLevel(lv)} title={`Hiện tới tầng ${lv === 5 ? '4+' : lv}`} className={`flex-1 rounded-md px-1 py-1 text-[10px] ${maxLevel === lv ? 'ak-cta text-white' : 'bg-white/5 border border-white/10 text-zinc-400'}`}>{lv === 5 ? '4+' : lv}<div className="text-[7px] opacity-70 leading-none mt-0.5">{lb}</div></button>
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
          {([['Nhãn hub', labels, setLabels], ['Hạt chạy (particle)', particles, setParticles], ['Tự xoay', autoRot, setAutoRot]] as const).map(([lb, v, set]) => (
            <label key={lb} className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer"><input type="checkbox" checked={v} onChange={e => (set as (b: boolean) => void)(e.target.checked)} className="accent-violet-500" /> {lb}</label>
          ))}
        </div>
      </div>

      {/* CANVAS */}
      <div ref={wrap} className="flex-1 min-w-0 relative" />

      {/* PANEL PHẢI — FILTER theo kho */}
      <div className="absolute right-3 top-3 w-[180px] hud-panel bg-[#0b0b14]/85 backdrop-blur p-2.5 z-10">
        <div className="hud-label mb-1.5">3 thiên hà (kho)</div>
        {Object.entries(layers).map(([L, c]) => (
          <button key={L} onClick={() => toggleLayer(L)} className={`w-full flex items-center justify-between text-left rounded-md px-2 py-1 text-xs ${hidden.has(L) ? 'opacity-35' : 'hover:bg-white/5'}`}>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: LAYER_TINT[L] }} />{LAYER_NAME[L] ?? L}</span>
            <span className="text-zinc-600 tabular-nums">{c}</span>
          </button>
        ))}
        <div className="hud-label mt-2 mb-1" style={{ fontSize: 8.5 }}>8 chiều · sóng sáng chạy</div>
        <div className="grid grid-cols-2 gap-0.5">
          {Object.entries(DIM_COLOR).map(([d, c]) => <span key={d} className="flex items-center gap-1 text-[9px] text-zinc-500"><span className="w-2 h-2 rounded-full" style={{ background: c }} />{d}</span>)}
        </div>
      </div>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 hud-label text-center" style={{ fontSize: 9 }}>kéo = xoay · cuộn = zoom · bấm node = soi · nền = bỏ chọn</div>
    </div>
  )
}
