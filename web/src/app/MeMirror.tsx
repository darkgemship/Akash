'use client'
import { EMO_SCALE } from './PageFrame'

// 🪞 "AI hiểu bạn" — chân dung SỐNG, tự tổng hợp từ dữ liệu thật (heuristic, KHÔNG đốt token).
// Càng ghi nhiều trải nghiệm/bài học → chân dung càng dày. Đây là linh hồn Jarvis: Akash phản chiếu lại chính bạn.
type N = {
  id: string; title: string | null; emotion?: string | null; event_date?: string | null;
  created_at?: string; layer?: string; subtype?: string | null; props?: Record<string, unknown> | null
}
const EMO_IDX = new Map(EMO_SCALE.map((e, i) => [e.v, i]))   // 0 = đáy (đỏ) → 8 = đỉnh (tỉnh thức)

export default function MeMirror({ nodes, onOpenPortrait }: { nodes: N[]; onOpenPortrait: () => void }) {
  const mine = nodes.filter(n => n.layer === 'personal' && (n.subtype !== 'hub') && n.title)
  const withEmo = mine.filter(n => n.emotion && EMO_IDX.has(n.emotion))
    .sort((a, b) => (a.event_date || a.created_at || '').localeCompare(b.event_date || b.created_at || ''))
  // phân bố theo 9 mức Hawkins
  const dist = new Array(EMO_SCALE.length).fill(0) as number[]
  withEmo.forEach(n => { dist[EMO_IDX.get(n.emotion!)!]++ })
  const maxD = Math.max(1, ...dist)
  // xu hướng: trung bình nửa GẦN ĐÂY so với nửa ĐẦU → đang đi lên thang ý thức?
  const idxs = withEmo.map(n => EMO_IDX.get(n.emotion!)!)
  const half = Math.floor(idxs.length / 2)
  const avg = (a: number[]) => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0
  const early = avg(idxs.slice(0, half)), recent = avg(idxs.slice(half))
  const trend = idxs.length < 4 ? 0 : recent - early
  const lessons = mine.filter(n => (n.props?.page_type as string) === 'bai-hoc')
  const recentLessons = [...lessons].sort((a, b) => (b.event_date || b.created_at || '').localeCompare(a.event_date || a.created_at || '')).slice(0, 3)
  const applied = mine.filter(n => /thành nếp|Đang rèn/.test((n.props?.apply_status as string) || '')).length
  const prof = mine.find(n => n.subtype === 'profile_me')?.props ?? {}
  const voice = (prof.writing_style as string) || ''

  const trendTxt = idxs.length < 4 ? 'Ghi thêm vài trải nghiệm để Akash đọc được nhịp cảm xúc của bạn.'
    : trend > 0.4 ? '✨ Bạn đang đi LÊN thang ý thức — gần đây nhẹ nhõm & yêu thương nhiều hơn trước.'
    : trend < -0.4 ? '🫂 Gần đây nhiều cảm xúc nặng hơn — đây là lúc cần được ôm ấp & viết ra cho nhẹ lòng.'
    : '🌊 Cảm xúc đang giữ thăng bằng quanh mức hiện tại.'

  const Stat = ({ n, l }: { n: number | string; l: string }) => (
    <div className="text-center"><div className="text-xl font-bold text-zinc-100">{n}</div><div className="text-[10px] text-zinc-500">{l}</div></div>
  )

  return (
    <div className="mb-5 rounded-2xl border border-violet-400/15 bg-gradient-to-br from-violet-500/[0.06] to-cyan-500/[0.04] overflow-hidden">
      <div className="px-4 pt-3 pb-2 flex items-center gap-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-violet-300/80">Akash hiểu bạn</span>
        <span className="text-[10px] text-zinc-600">— tự tổng hợp từ chính kho của bạn, càng ghi càng dày</span>
        <button onClick={onOpenPortrait} className="ml-auto text-[10px] rounded-lg bg-violet-500/15 border border-violet-400/30 text-violet-100 px-2.5 py-1 hover:bg-violet-500/25 transition">🌌 Xem graph chân dung</button>
      </div>
      <div className="px-4 pb-3.5 grid md:grid-cols-2 gap-4">
        {/* hành trình cảm xúc theo thang Hawkins */}
        <div>
          <div className="text-[11px] font-semibold text-zinc-300 mb-1.5">🌈 Hành trình cảm xúc <span className="text-zinc-600 font-normal">({withEmo.length} lần ghi)</span></div>
          <div className="flex items-end gap-[3px] h-14">
            {EMO_SCALE.map((e, i) => (
              <div key={e.v} title={`${e.v}: ${dist[i]}`} className="flex-1 rounded-t-sm transition-all" style={{ height: `${Math.max(dist[i] ? 10 : 3, (dist[i] / maxD) * 100)}%`, background: dist[i] ? e.c : 'rgba(255,255,255,0.05)', boxShadow: dist[i] ? `0 0 6px ${e.c}55` : 'none' }} />
            ))}
          </div>
          <div className="flex justify-between text-[8px] text-zinc-600 mt-0.5"><span>đau/sợ</span><span>tỉnh thức →</span></div>
          <p className="text-[11px] text-zinc-400 mt-1.5 leading-snug">{trendTxt}</p>
        </div>
        {/* tăng trưởng + giọng + bài học */}
        <div className="space-y-2.5">
          <div className="flex justify-around rounded-xl bg-black/15 py-2">
            <Stat n={mine.length} l="trang sống" />
            <Stat n={lessons.length} l="bài học 💎" />
            <Stat n={applied} l="đã sống ✅" />
          </div>
          {voice && <p className="text-[11px] text-zinc-400 leading-snug"><span className="text-zinc-500">Giọng của bạn:</span> {voice}</p>}
          {recentLessons.length > 0 && (
            <div>
              <div className="text-[10px] text-zinc-500 mb-0.5">Bài học gần đây</div>
              {recentLessons.map(n => <div key={n.id} className="text-[11px] text-zinc-300 truncate">💎 {n.title}</div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
