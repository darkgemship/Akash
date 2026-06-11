'use client'
import { useEffect, useRef } from 'react'

// Trường sao warp: bay xuyên vũ trụ. speed 1 = trôi nhẹ, tăng lên = nhảy hyperspace.
export default function Warp({ speed = 1 }: { speed?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const speedRef = useRef(speed)
  speedRef.current = speed

  useEffect(() => {
    const cv = ref.current!
    const ctx = cv.getContext('2d')!
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    let raf = 0
    let W = 0, H = 0
    const N = 420
    type Star = { x: number; y: number; z: number; pz: number; hue: number }
    let stars: Star[] = []

    const spawn = (): Star => ({
      x: (Math.random() * 2 - 1), y: (Math.random() * 2 - 1),
      z: Math.random() * 0.9 + 0.1, pz: 0,
      hue: [265, 195, 320, 0][Math.floor(Math.random() * 4)], // tím / cyan / hồng / trắng
    })
    function resize() {
      W = cv.clientWidth; H = cv.clientHeight
      cv.width = W * dpr; cv.height = H * dpr
      stars = Array.from({ length: N }, spawn)
      stars.forEach(s => { s.pz = s.z })
    }
    resize()

    let cur = 1
    function draw() {
      // tăng/giảm tốc mượt
      cur += (speedRef.current - cur) * 0.04
      ctx.fillStyle = 'rgba(6,6,12,0.45)'
      ctx.fillRect(0, 0, cv.width, cv.height)
      const cx = (W / 2) * dpr, cy = (H / 2) * dpr
      const f = Math.min(W, H) * dpr * 0.5

      for (const s of stars) {
        s.pz = s.z
        s.z -= 0.0035 * cur
        if (s.z <= 0.02) { Object.assign(s, spawn()); s.z = 1; s.pz = 1 }
        const sx = cx + (s.x / s.z) * f
        const sy = cy + (s.y / s.z) * f
        const px = cx + (s.x / s.pz) * f
        const py = cy + (s.y / s.pz) * f
        if (sx < 0 || sx > cv.width || sy < 0 || sy > cv.height) { Object.assign(s, spawn()); s.z = 1; s.pz = 1; continue }
        const depth = 1 - s.z
        const w = Math.max(0.6, depth * 2.4) * dpr
        const a = Math.min(0.95, depth * 1.1)
        ctx.strokeStyle = s.hue === 0 ? `rgba(255,255,255,${a})` : `hsla(${s.hue},85%,${60 + depth * 25}%,${a})`
        ctx.lineWidth = w
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(sx, sy); ctx.stroke()
      }
      // tâm sáng nhẹ — cảm giác đang lao về phía trước
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, f * 0.5)
      g.addColorStop(0, `rgba(139,92,246,${0.05 + Math.min(0.2, (cur - 1) * 0.05)})`)
      g.addColorStop(1, 'rgba(139,92,246,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, cv.width, cv.height)
      raf = requestAnimationFrame(draw)
    }
    ctx.fillStyle = '#06060c'; ctx.fillRect(0, 0, cv.width, cv.height)
    draw()
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={ref} className="absolute inset-0 w-full h-full" aria-hidden />
}
