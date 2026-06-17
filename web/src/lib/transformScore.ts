/* ĐỘ CHUYỂN HOÁ 8 CHIỀU — derived data, KHÔNG lưu bảng điểm (docs/RESEARCH-VIZ-ARCH.md mũi 2)
   Nguồn sự thật = bảng links (+ tín hiệu nội tại trang). wisdom_depth chỉ còn vai trò lịch ôn SM-2.
   Pattern theo Anki/FSRS/RemNote: scheduler state lưu, mọi điểm số đều derive — không bao giờ lệch. */

export const DIM_KEYS = ['knowledge', 'experience', 'emotion', 'values', 'people', 'time', 'reference'] as const   // 7 chiều (bỏ Neo)
export type DimKey = typeof DIM_KEYS[number]

// trọng số tổng = 1.00 — experience nặng nhất: bằng chứng chuyển hoá THẬT (đã gộp phần của Neo cũ vào experience/values)
const W: Record<DimKey, number> = {
  knowledge: 0.14, reference: 0.12, emotion: 0.12, time: 0.12,
  people: 0.13, values: 0.16, experience: 0.21,
}
// bão hoà: tín hiệu đầu của MỖI chiều đáng giá nhất (1→50%, 2→75%, 3→87.5%) — farm 50 link 1 chiều không ăn điểm
const sat = (x: number) => 1 - Math.pow(2, -x)

type LinkSig = { dimension: string | null; excerpt?: string | null }

/** Gom tín hiệu 8 chiều của MỘT trang từ links 2 chiều + tín hiệu nội tại.
    Link có excerpt (mức câu/quote — quý nhất theo FRAMEWORK §1) đếm 1.5 thay vì 1. */
export function dimSignals(opts: {
  out: LinkSig[]; back: LinkSig[]
  emotion?: string | null; event_date?: string | null
  props?: Record<string, unknown> | null
}): Record<DimKey, number> {
  const x = Object.fromEntries(DIM_KEYS.map(d => [d, 0])) as Record<DimKey, number>
  for (const l of [...opts.out, ...opts.back]) {
    const d = l.dimension as DimKey
    if (x[d] !== undefined) x[d] += l.excerpt ? 1.5 : 1
  }
  const p = opts.props ?? {}
  if (p['principle']) x.knowledge += 1                              // 1 câu nguyên lý của riêng mình
  if (opts.emotion) x.emotion += 1                                  // cột nodes.emotion
  if (opts.event_date) x.time += 1                                  // đã đan vào dòng đời
  const refs = p['refs']
  if (Array.isArray(refs)) x.reference += Math.min(refs.length, 3)  // nguồn ngoài, bão hoà 3
  const action = p['action'] as { text?: string; done?: boolean } | undefined
  if (action?.text) x.experience += action.done ? 3 : 1             // cam kết hành động — done là bằng chứng nặng nhất
  return x
}

export type Transform8 = { total: number; covered: number; learned: boolean; tier: string }

export function transformScore(x: Record<DimKey, number>): Transform8 {
  const total = Math.round(100 * DIM_KEYS.reduce((s, d) => s + W[d] * sat(x[d]), 0)) // Math.round: rule §B8
  const covered = DIM_KEYS.filter(d => x[d] >= 1).length
  const tier = total >= 80 ? 'Chuyển hoá' : total >= 50 ? 'Thấm sâu' : total >= 20 ? 'Đang thấm' : 'Hạt mầm'
  return { total, covered, learned: covered >= 2, tier }            // giữ rule đã chốt: learned = ≥2 chiều
}
