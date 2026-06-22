'use client'
import React, { useEffect, useRef } from 'react'

/* =====================================================================
   HUD — bộ "vỏ" Jarvis của Akash (BRANDING §7)
   Triết lý: high-tech ở CHROME (nhãn mono, viền hairline, góc ngoặc,
   status dot, số mono) — êm như Claude ở RUỘT (editor/thân bài).
   Mọi class màu lấy từ token --hud-* (tự đổi theo light/dark).
===================================================================== */

// Góc ngoặc ⌐¬⌙⌟ — chữ ký HUD, vẽ 4 góc bằng border mảnh
export function Corners({ color, size = 9 }: { color?: string; size?: number }) {
  const c = color ?? 'var(--hud-edge)'
  const base: React.CSSProperties = { position: 'absolute', width: size, height: size, pointerEvents: 'none' }
  return (
    <>
      <span style={{ ...base, top: -1, left: -1, borderTop: `1px solid ${c}`, borderLeft: `1px solid ${c}` }} />
      <span style={{ ...base, top: -1, right: -1, borderTop: `1px solid ${c}`, borderRight: `1px solid ${c}` }} />
      <span style={{ ...base, bottom: -1, left: -1, borderBottom: `1px solid ${c}`, borderLeft: `1px solid ${c}` }} />
      <span style={{ ...base, bottom: -1, right: -1, borderBottom: `1px solid ${c}`, borderRight: `1px solid ${c}` }} />
    </>
  )
}

// Status dot: tĩnh hoặc đập sống (live)
export function Dot({ live = false, color = 'var(--hud-accent)', size = 7 }: { live?: boolean; color?: string; size?: number }) {
  return <span className={`hud-dot ${live ? 'hud-dot-live' : ''}`} style={{ width: size, height: size, ['--dot' as string]: color }} />
}

// Dòng trạng thái: ● CORE · MEMORY · LINK · ONLINE
export function StatusLine({ items }: { items: string[] }) {
  return (
    <div className="flex items-center gap-2 hud-label" style={{ letterSpacing: '0.18em' }}>
      <Dot live />
      {items.map((it, i) => (
        <React.Fragment key={it}>
          {i > 0 && <span className="text-[var(--hud-dim)]">·</span>}
          <span>{it}</span>
        </React.Fragment>
      ))}
    </div>
  )
}

// Wordmark A K A S H — mono giãn cách kiểu V.A.U.L.T.
export function Wordmark({ size = 'md', dotted = false }: { size?: 'sm' | 'md' | 'lg'; dotted?: boolean }) {
  const px = size === 'lg' ? 26 : size === 'sm' ? 14 : 18
  const txt = dotted ? 'A·K·A·S·H' : 'AKASH'
  return <span className="hud-wordmark" style={{ fontSize: px }}>{txt}</span>
}

/* Constellation — chòm sao node-link phát sáng (nhẹ: ~110 điểm, drift chậm + twinkle)
   Dùng làm nền hero Command Center. Deterministic seed → ổn định. */
export function Constellation({ height = 320, density = 110, accent = '#8b5cf6' }: { height?: number; density?: number; accent?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current; if (!cv) return
    const ctx = cv.getContext('2d'); if (!ctx) return
    // canvas không hiểu CSS var → resolve token --hud-accent ra hex thật
    const col = (accent.includes('var') || accent.startsWith('--'))
      ? (getComputedStyle(cv).getPropertyValue('--hud-accent').trim() || '#a78bfa')
      : accent
    let raf = 0, w = 0, h = 0
    const DPR = Math.min(2, window.devicePixelRatio || 1)
    // PRNG cố định (mulberry32) → chòm sao không nhảy mỗi lần render
    let s = 7
    const rnd = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
    type P = { x: number; y: number; vx: number; vy: number; r: number; tw: number }
    let pts: P[] = []
    const resize = () => {
      const rect = cv.parentElement!.getBoundingClientRect()
      w = rect.width; h = height
      cv.width = w * DPR; cv.height = h * DPR; cv.style.width = w + 'px'; cv.style.height = h + 'px'
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      s = 7
      const cx = w / 2, cy = h / 2
      pts = Array.from({ length: density }, () => {
        // phân bố cụm về tâm (gaussian-ish) → giống chòm sao VAULT
        const a = rnd() * Math.PI * 2, rad = Math.pow(rnd(), 0.62) * Math.min(w, h) * 0.46
        return { x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad * 0.82, vx: (rnd() - 0.5) * 0.12, vy: (rnd() - 0.5) * 0.12, r: 0.6 + rnd() * 1.7, tw: rnd() * Math.PI * 2 }
      })
    }
    resize()
    const ro = new ResizeObserver(resize); ro.observe(cv.parentElement!)
    let t = 0
    const draw = () => {
      t += 0.01
      ctx.clearRect(0, 0, w, h)
      // cạnh nối điểm gần nhau
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i]
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d2 = dx * dx + dy * dy
          if (d2 < 86 * 86) {
            const al = (1 - Math.sqrt(d2) / 86) * 0.22
            ctx.strokeStyle = col; ctx.globalAlpha = al; ctx.lineWidth = 0.5
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke()
          }
        }
      }
      ctx.globalAlpha = 1
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > w) p.vx *= -1
        if (p.y < 0 || p.y > h) p.vy *= -1
        const tw = 0.55 + 0.45 * Math.sin(t * 2 + p.tw)
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = col; ctx.globalAlpha = tw
        ctx.shadowColor = col; ctx.shadowBlur = 6
        ctx.fill()
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [height, density, accent])
  return <canvas ref={ref} className="block w-full" style={{ height }} aria-hidden />
}
