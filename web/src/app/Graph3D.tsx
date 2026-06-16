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
// bỏ dấu để search không-dấu vẫn trúng
const vnorm = (s: string) => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim()

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
  const byId = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes])
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
  const [repel, setRepel] = useState(-130)
  const [linkDist, setLinkDist] = useState(42)
  const [particles, setParticles] = useState(true)
  const [labels, setLabels] = useState(true)
  const [autoRot, setAutoRot] = useState(false)
  const [glError, setGlError] = useState(false)   // WebGL không tạo được context (GPU yếu/cạn) → hiện fallback thay vì sập app

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
    if (qq) {
      const hits = nodes.filter(n => vnorm(n.title ?? '').includes(qq)).map(n => n.id)
      activeRef.current = hits.length ? expand(hits, 1) : new Set()   // search: trúng + hàng xóm 1 bước, còn lại TẮT
    } else if (sel) {
      activeRef.current = expand([sel.id], depth)
    } else activeRef.current = null
    fg.nodeVisibility(fg.nodeVisibility()).linkVisibility(fg.linkVisibility()).nodeColor(fg.nodeColor()).linkColor(fg.linkColor())
  }
  useEffect(recompute, [q, sel, depth]) // eslint-disable-line react-hooks/exhaustive-deps

  // dựng đồ thị 1 lần
  useEffect(() => {
    if (!wrap.current) return
    // 0) kiểm tra WebGL trước — máy không hỗ trợ thì hiện fallback, KHÔNG để three throw làm sập app
    try {
      const probe = document.createElement('canvas')
      const gl = probe.getContext('webgl2') || probe.getContext('webgl') || probe.getContext('experimental-webgl')
      if (!gl) { setGlError(true); return }
    } catch { setGlError(true); return }

    const N: N3[] = nodes.filter(n => n.kind !== 'block').map(n => ({ id: n.id, name: n.title ?? 'Trang', layer: n.layer ?? 'personal', kind: n.kind, val: 1 + Math.min(10, (deg.get(n.id) ?? 0)) * 0.7 }))
    const present = new Set(N.map(n => n.id))
    const L: L3[] = links.filter(l => present.has(l.from_node) && present.has(l.to_node)).map(l => ({ source: l.from_node, target: l.to_node, dimension: l.dimension, weight: 1 }))
    const vis = (id: string) => !hiddenRef.current.has(byId.get(id)?.layer ?? 'personal') && (!activeRef.current || activeRef.current.has(id))

    let fg: FG
    try {
      // attrs nhẹ cho GPU yếu: tắt antialias/stencil, ưu tiên tiết kiệm điện, không bỏ cuộc nếu GPU chậm
      fg = new ForceGraph3D(wrap.current, { rendererConfig: { antialias: false, alpha: true, stencil: false, powerPreference: 'low-power', failIfMajorPerformanceCaveat: false } })
    } catch (e) { console.warn('3D init failed', e); setGlError(true); return }
    fg
      .backgroundColor('#06060c')
      .graphData({ nodes: N, links: L })
      .nodeVal('val')
      .nodeRelSize(4)
      .nodeColor((n: object) => { const x = n as N3; const on = !activeRef.current || activeRef.current.has(x.id); return on ? (LAYER_TINT[x.layer] ?? '#94a3b8') : 'rgba(120,120,140,0.12)' })
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
      .linkColor((l: object) => { const x = l as L3; const s = typeof x.source === 'object' ? (x.source as N3).id : x.source as string; const tg = typeof x.target === 'object' ? (x.target as N3).id : x.target as string; const on = !activeRef.current || (activeRef.current.has(s) && activeRef.current.has(tg)); return on ? (DIM_COLOR[x.dimension ?? ''] ?? '#3a8') : 'rgba(120,120,140,0.05)' })
      .linkVisibility((l: object) => { const x = l as L3; const s = typeof x.source === 'object' ? (x.source as N3).id : x.source as string; const tg = typeof x.target === 'object' ? (x.target as N3).id : x.target as string; return vis(s) && vis(tg) })
      .linkOpacity(0.55)
      .linkWidth(0.6)
      .linkDirectionalParticles((): number => particlesRef.current ? 2 : 0)
      .linkDirectionalParticleSpeed(0.006)
      .linkDirectionalParticleWidth(1.4)
      .onNodeClick((n: object) => { const g = byId.get((n as N3).id); if (g) { setSel(g); fg.cameraPosition({ x: (n as { x: number }).x, y: (n as { y: number }).y, z: (n as { z: number }).z + 120 }, n as { x: number; y: number; z: number }, 700) } })
      .onBackgroundClick(() => { setSel(null); setQ('') })
    fgRef.current = fg
    fg.d3Force('charge')?.strength(repelRef.current)
    fg.d3Force('link')?.distance(linkRef.current)
    // FRAME: nhìn thẳng vào tâm cụm, lùi xa theo bán kính (zoomToFit hay đặt camera lệch ra ngoài)
    const frameCam = () => {
      const ns = (fg.graphData().nodes as { x?: number; y?: number; z?: number }[])
      let r = 0; for (const n of ns) r = Math.max(r, Math.hypot(n.x ?? 0, n.y ?? 0, n.z ?? 0))
      fg.cameraPosition({ x: 0, y: 0, z: Math.max(220, r * 1.9 + 120) }, { x: 0, y: 0, z: 0 }, 900)
    }
    fg.onEngineStop(frameCam)
    setTimeout(frameCam, 2500); setTimeout(frameCam, 5200) // sim cần thời gian ổn định
    // ✨ trường sao nền
    const stars = new THREE.BufferGeometry()
    const arr = new Float32Array(600 * 3)
    for (let i = 0; i < arr.length; i++) arr[i] = (Math.sin(i * 99.13) * 0.5) * 4200
    stars.setAttribute('position', new THREE.BufferAttribute(arr, 3))
    fg.scene().add(new THREE.Points(stars, new THREE.PointsMaterial({ color: 0x8b86b0, size: 1.6, transparent: true, opacity: 0.6 })))

    const onResize = () => { if (wrap.current) { fg.width(wrap.current.clientWidth); fg.height(wrap.current.clientHeight) } }
    onResize(); window.addEventListener('resize', onResize)
    // CHẶN vòng restore lỗi của three (bug "Cannot access 'info' before initialization") khi context bị mất:
    // preventDefault để trình duyệt KHÔNG tự restore; báo fallback gọn thay vì sập.
    const canvas = wrap.current.querySelector('canvas')
    const onLost = (e: Event) => { e.preventDefault(); setGlError(true) }
    canvas?.addEventListener('webglcontextlost', onLost, false)
    // auto-rotate đơn giản: quay camera quanh tâm
    let raf = 0, ang = 0
    const tick = () => { try { if (autoRotRef.current) { ang += 0.0016; const d = 380; fg.cameraPosition({ x: d * Math.sin(ang), z: d * Math.cos(ang) }) } } catch { /* context có thể mất giữa frame */ } raf = requestAnimationFrame(tick) }
    tick()
    return () => {
      cancelAnimationFrame(raf); window.removeEventListener('resize', onResize)
      canvas?.removeEventListener('webglcontextlost', onLost)
      // GIẢI PHÓNG context triệt để (tránh cạn ~16 context của trình duyệt khi mở/đóng 3D nhiều lần)
      try {
        const r = (fg as unknown as { renderer?: () => { dispose?: () => void; forceContextLoss?: () => void } }).renderer?.()
        r?.forceContextLoss?.(); r?.dispose?.()
      } catch { /* bỏ qua */ }
      try { fg._destructor?.() } catch { /* bỏ qua */ }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // refs để accessor đọc state mới nhất mà không dựng lại graph
  const hiddenRef = useRef(hidden); hiddenRef.current = hidden
  const labelsRef = useRef(labels); labelsRef.current = labels
  const particlesRef = useRef(particles); particlesRef.current = particles
  const autoRotRef = useRef(autoRot); autoRotRef.current = autoRot
  const repelRef = useRef(repel); repelRef.current = repel
  const linkRef = useRef(linkDist); linkRef.current = linkDist

  useEffect(() => { const fg = fgRef.current; if (fg) { fg.nodeVisibility(fg.nodeVisibility()).linkVisibility(fg.linkVisibility()).nodeThreeObject(fg.nodeThreeObject()) } }, [hidden, labels])
  useEffect(() => { fgRef.current?.linkDirectionalParticles(() => particles ? 2 : 0) }, [particles])
  useEffect(() => { const fg = fgRef.current; if (fg) { fg.d3Force('charge')?.strength(repel); fg.d3Force('link')?.distance(linkDist); fg.d3ReheatSimulation() } }, [repel, linkDist])

  const topHubs = useMemo(() => [...deg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id, d]) => ({ n: byId.get(id), d })).filter(x => x.n), [deg, byId])
  const toggleLayer = (L: string) => setHidden(s => { const n = new Set(s); n.has(L) ? n.delete(L) : n.add(L); return n })

  if (glError) return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-[#06060c] text-center px-8">
      <div className="max-w-sm">
        <div className="text-4xl mb-3">🪐</div>
        <div className="text-zinc-200 text-base font-semibold mb-1.5">Máy này chưa bật được 3D</div>
        <p className="text-zinc-500 text-[13px] leading-relaxed mb-4">Trình duyệt không tạo được đồ hoạ 3D (WebGL) — thường do tăng tốc phần cứng bị tắt hoặc card yếu. Bạn vẫn xem được toàn bộ bằng các chế độ 2D: <b className="text-zinc-300">Galaxy · Dòng đời · 3 Vòng</b>.</p>
        <button onClick={onClose} className="rounded-lg ak-cta px-5 py-2 text-sm font-bold">← Về 2D</button>
        <p className="text-zinc-600 text-[11px] mt-3">Mẹo: bật “Use hardware acceleration” trong cài đặt trình duyệt rồi mở lại.</p>
      </div>
    </div>
  )
  return (
    <div className="absolute inset-0 z-20 flex bg-[#06060c]">
      {/* PANEL TRÁI */}
      <div className="w-[270px] shrink-0 border-r border-[var(--hud-line)] bg-[#0b0b14]/80 backdrop-blur p-3 overflow-auto flex flex-col gap-3">
        <button onClick={onClose} className="hud-label hud-label-accent text-left">← về 2D</button>
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
        <div className="hud-label mb-1.5">Lọc kho</div>
        {Object.entries(layers).map(([L, c]) => (
          <button key={L} onClick={() => toggleLayer(L)} className={`w-full flex items-center justify-between text-left rounded-md px-2 py-1 text-xs ${hidden.has(L) ? 'opacity-35' : 'hover:bg-white/5'}`}>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: LAYER_TINT[L] }} />{LAYER_NAME[L] ?? L}</span>
            <span className="text-zinc-600 tabular-nums">{c}</span>
          </button>
        ))}
        <div className="hud-label mt-2 mb-1" style={{ fontSize: 8.5 }}>8 chiều (màu link)</div>
        <div className="grid grid-cols-2 gap-0.5">
          {Object.entries(DIM_COLOR).map(([d, c]) => <span key={d} className="flex items-center gap-1 text-[9px] text-zinc-500"><span className="w-2 h-2 rounded-full" style={{ background: c }} />{d}</span>)}
        </div>
      </div>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 hud-label text-center" style={{ fontSize: 9 }}>kéo = xoay · cuộn = zoom · bấm node = soi · nền = bỏ chọn</div>
    </div>
  )
}
