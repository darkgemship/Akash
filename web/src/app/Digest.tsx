'use client'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { GNode } from './Galaxy'

const W = [1, 1.2, 1.5, 1.8, 2.5]
export function depthScore(d: { connections: number; meaning: number; evidence: number; experience: number; action: number }) {
  const v = [d.connections, d.meaning, d.evidence, d.experience, d.action]
  return Math.round(v.reduce((s, x, i) => s + x * W[i], 0) / 80 * 100)
}

/* 8 chiều — màu đồng bộ Galaxy */
const DIM8: { key: string; label: string; color: string }[] = [
  { key: 'knowledge', label: 'Kiến thức', color: '#22d3ee' },
  { key: 'reference', label: 'Tham chiếu', color: '#e879f9' },
  { key: 'experience', label: 'Trải nghiệm', color: '#f472b6' },
  { key: 'emotion', label: 'Cảm xúc', color: '#fbbf24' },
  { key: 'people', label: 'Con người', color: '#34d399' },
  { key: 'time', label: 'Thời gian', color: '#60a5fa' },
  { key: 'values', label: 'Giá trị', color: '#a78bfa' },
  { key: 'anchor', label: 'Neo', color: '#f87171' },
]
const STEPS = ['Đọc & nhặt', 'Kiến thức', 'Tham chiếu', 'Cuộc đời', 'Thời gian', 'Hồn cốt', 'Hành động']
const EMOTIONS = [['😮', 'vỡ òa'], ['💗', 'chạm'], ['🔥', 'thôi thúc'], ['😣', 'nhói'], ['🌫️', 'hoài nghi']] as const
const VALUE_SUGGEST = ['Kỷ luật', 'Trung thực', 'Biết ơn', 'Phụng sự', 'Can đảm', 'Tự do', 'Gia đình', 'Học hỏi', 'Sức khỏe', 'Sáng tạo', 'Khiêm nhường', 'Kiên trì']
const STOP = new Set(['những', 'được', 'không', 'trong', 'với', 'của', 'cho', 'và', 'các', 'một', 'ngày', 'tháng', 'đầu', 'sau', 'trước', 'cách'])
const words = (s: string) => (s ?? '').toLowerCase().split(/[^a-zà-ỹ0-9]+/i).filter(w => w.length >= 4 && !STOP.has(w))

function Neuro({ label, color }: { label: string; color: string }) {
  return (
    <div className="dq-neuro flex items-center gap-2 mt-2 rounded-xl border px-3 py-1.5" style={{ background: color + '12', borderColor: color + '40' }}>
      <svg width="100" height="22" viewBox="0 0 100 22" className="shrink-0">
        <circle cx="7" cy="11" r="3.5" fill="#a78bfa" />
        <path d="M10 11 C 35 2, 65 20, 90 11" fill="none" stroke={color} strokeWidth="1.6" className="dq-neuro-path" />
        <circle cx="50" cy="11" r="2.2" fill="#fff" className="dq-neuro-spark" />
        <circle cx="93" cy="11" r="3.5" fill={color} className="dq-neuro-end" />
      </svg>
      <span className="text-[11px] truncate" style={{ color }}>⚡ {label}</span>
    </div>
  )
}

type Q = { block: string; text: string }
type Ref = { type: string; title: string; url: string }

export default function Digest({ folder, others, orgId, userId, onClose, onSaved }: {
  folder: GNode; others: GNode[]; orgId: string; userId: string; onClose: () => void; onSaved: () => void
}) {
  const [step, setStep] = useState(0)
  // M1
  const [blocks, setBlocks] = useState<Q[]>([])
  const [quotes, setQuotes] = useState<Q[]>([])
  // M2
  const [recall, setRecall] = useState('')
  const [principle, setPrinciple] = useState('')
  const [kOut, setKOut] = useState<string[]>([])
  const [kIn, setKIn] = useState<string[]>([])
  // M3
  const [refs, setRefs] = useState<Ref[]>([])
  const [refDraft, setRefDraft] = useState<Ref>({ type: 'sách', title: '', url: '' })
  const [rOut, setROut] = useState<string[]>([])
  const [rIn, setRIn] = useState<string[]>([])
  // M4
  const [expStory, setExpStory] = useState('')
  const [makeNote, setMakeNote] = useState(true)
  const [emo, setEmo] = useState('')
  const [personName, setPersonName] = useState('')
  const [personStory, setPersonStory] = useState('')
  // M5
  const [eventDate, setEventDate] = useState('')
  const [lifeEvents, setLifeEvents] = useState<{ id: string; title: string; event_date: string | null }[]>([])
  const [lifeSel, setLifeSel] = useState<string[]>([])
  const [newLife, setNewLife] = useState({ title: '', date: '' })
  // M6
  const [coreValues, setCoreValues] = useState<{ id: string; title: string }[]>([])
  const [valSel, setValSel] = useState<string[]>([])
  const [valPick, setValPick] = useState<string[]>([]) // lần đầu: chọn tên giá trị
  const [valCustom, setValCustom] = useState('')
  const [mantra, setMantra] = useState('')
  // M7
  const [action, setAction] = useState('')
  const [due, setDue] = useState('')
  const [lingering, setLingering] = useState('') // điều còn lấn cấn → open_questions
  const [evi, setEvi] = useState(false)
  const [q, setQ] = useState('')
  const [last, setLast] = useState<{ label: string; color: string; n: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [celebrate, setCelebrate] = useState<{ score: number; covered: number } | null>(null)

  // nạp nội dung bài (M1) + giá trị cốt lõi + dòng đời
  useEffect(() => {
    supabase.from('nodes').select('content,md,event_date,emotion').eq('id', folder.id).single().then(({ data }) => {
      if (data?.event_date) setEventDate(data.event_date as string)
      if (data?.emotion) setEmo(data.emotion as string)
      const content = data?.content as { id?: string; content?: { text?: string }[] }[] | null
      let bs: Q[] = []
      if (content?.length) {
        bs = content.map((b, i) => ({
          block: b.id ?? String(i),
          text: (Array.isArray(b.content) ? b.content.map(c => c.text ?? '').join('') : '').trim(),
        })).filter(b => b.text.length > 12)
      } else if (data?.md) {
        bs = (data.md as string).split(/\n\n+/).map((t, i) => ({ block: 'md' + i, text: t.replace(/^#+\s*/, '').trim() })).filter(b => b.text.length > 12)
      }
      setBlocks(bs.slice(0, 14))
    })
    supabase.from('nodes').select('id,title').eq('owner_id', userId).eq('subtype', 'core_value').then(({ data }) => setCoreValues((data as { id: string; title: string }[]) ?? []))
    supabase.from('nodes').select('id,title,event_date').eq('owner_id', userId).eq('subtype', 'life_event').order('event_date').then(({ data }) => setLifeEvents((data as { id: string; title: string; event_date: string | null }[]) ?? []))
  }, [folder.id, userId])

  const ranked = useMemo(() => {
    const fw = words(folder.title ?? '')
    return others.map(o => ({ o, score: words(o.title ?? '').filter(w => fw.includes(w)).length })).sort((a, b) => b.score - a.score)
  }, [others, folder.title])

  function fire(label: string, color: string) { setLast({ label, color, n: (last?.n ?? 0) + 1 }) }
  function toggleIn(list: string[], set: (v: string[]) => void, id: string, title: string, color: string) {
    if (list.includes(id)) set(list.filter(x => x !== id))
    else { set([...list, id]); fire(title, color) }
  }

  // chiều nào đã chạm → cánh hoa sáng
  const dims: Record<string, boolean> = {
    knowledge: !!principle.trim() || kOut.length + kIn.length > 0,
    reference: refs.length > 0 || rOut.length + rIn.length > 0,
    experience: !!expStory.trim(),
    emotion: !!emo,
    people: !!personName.trim() && !!personStory.trim(),
    time: !!eventDate || lifeSel.length > 0 || !!newLife.title.trim(),
    values: valSel.length > 0 || valPick.length > 0,
    anchor: !!mantra.trim(),
  }
  const dimsCovered = Object.values(dims).filter(Boolean).length

  function Chips({ dir, dim, selected, onToggle }: { dir: string; dim: string; selected: string[]; onToggle: (id: string, t: string) => void }) {
    const color = DIM8.find(d => d.key === dim)!.color
    const query = q.trim().toLowerCase()
    const list = query
      ? ranked.filter(r => (r.o.title ?? '').toLowerCase().includes(query)).slice(0, 8)
      : [...ranked.filter(r => selected.includes(r.o.id)), ...ranked.slice(0, 5).filter(r => !selected.includes(r.o.id))]
    return (
      <div>
        <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: color + 'cc' }}>{dir} · {selected.length} đã nối</div>
        <div className="flex flex-wrap gap-1.5">
          {list.map(({ o, score }) => (
            <button key={o.id} onClick={() => onToggle(o.id, o.title ?? 'Trang')}
              className={`px-2.5 py-1.5 rounded-lg text-xs border transition ${selected.includes(o.id) ? 'text-white border-transparent' : 'bg-white/5 border-white/10 text-zinc-300'}`}
              style={selected.includes(o.id) ? { background: color + '55' } : undefined}>
              {o.title}{score > 0 && !selected.includes(o.id) && <span className="ml-1 text-[9px] text-amber-300">✨</span>}
            </button>
          ))}
        </div>
      </div>
    )
  }

  /* ===== GHI TOÀN BỘ ===== */
  async function sysPage(subtype: string, title: string, icon: string): Promise<string> {
    const { data } = await supabase.from('nodes').select('id').eq('owner_id', userId).eq('subtype', subtype).limit(1).maybeSingle()
    if (data) return data.id
    const { data: kho } = await supabase.from('nodes').select('id').eq('owner_id', userId).eq('kind', 'kho').limit(1).maybeSingle()
    const id = crypto.randomUUID()
    await supabase.from('nodes').insert({ id, org_id: orgId, owner_id: userId, layer: 'personal', kind: 'page', parent_id: kho?.id ?? null, title, icon, subtype, status: 'published', min_level: 1 })
    return id
  }
  async function addLink(from: string, to: string, dimension: string, extra?: { excerpt?: string; from_block?: string; meta?: Record<string, unknown>; weight?: number }) {
    const { data: ex } = await supabase.from('links').select('id').eq('from_node', from).eq('to_node', to).eq('dimension', dimension).limit(1)
    if (ex?.length) return
    await supabase.from('links').insert({ org_id: orgId, from_node: from, to_node: to, dimension, source: 'tham', weight: extra?.weight ?? 2, excerpt: extra?.excerpt ?? null, from_block: extra?.from_block ?? null, meta: extra?.meta ?? {} })
  }

  async function finish() {
    setBusy(true)
    const quote = quotes[0]
    // M2: nguyên lý + link kiến thức
    for (const id of kOut) await addLink(folder.id, id, 'knowledge', quote ? { excerpt: quote.text.slice(0, 280), from_block: quote.block } : undefined)
    for (const id of kIn) await addLink(id, folder.id, 'knowledge')
    // M3: nguồn ngoài + tham chiếu nội bộ
    if (refs.length) {
      const srcHome = await sysPage('sources_home', 'Nguồn', '📚')
      for (const r of refs) {
        const rid = crypto.randomUUID()
        await supabase.from('nodes').insert({ id: rid, org_id: orgId, owner_id: userId, layer: 'personal', kind: 'note', parent_id: srcHome, title: `${r.type === 'sách' ? '📕' : r.type === 'video' ? '🎬' : '🔗'} ${r.title}`, subtype: 'reference', props: { url: r.url, ref_type: r.type }, status: 'published', min_level: 1 })
        await addLink(folder.id, rid, 'reference', quote ? { excerpt: quote.text.slice(0, 280) } : undefined)
      }
    }
    for (const id of rOut) await addLink(folder.id, id, 'reference')
    for (const id of rIn) await addLink(id, folder.id, 'reference')
    // M4: trải nghiệm + cảm xúc + người
    if (expStory.trim() && makeNote) {
      const { data: diary } = await supabase.from('nodes').select('id').eq('owner_id', userId).eq('title', 'Nhật ký hành trình').limit(1).maybeSingle()
      const nid = crypto.randomUUID()
      await supabase.from('nodes').insert({ id: nid, org_id: orgId, owner_id: userId, layer: 'personal', kind: 'note', parent_id: diary?.id ?? null, title: expStory.slice(0, 60), md: `# ${expStory.slice(0, 60)}\n\n${expStory}\n\n_(rút từ Chuyển hoá bài "${folder.title}")_`, icon: '🌱', status: 'published', min_level: 1, event_date: eventDate || null })
      await addLink(folder.id, nid, 'experience')
      if (emo) await addLink(folder.id, nid, 'emotion')
    }
    if (emo) await supabase.from('nodes').update({ emotion: emo }).eq('id', folder.id)
    if (personName.trim() && personStory.trim()) {
      const pplHome = await sysPage('people_home', 'Người', '👥')
      let pid: string
      const { data: exP } = await supabase.from('nodes').select('id').eq('owner_id', userId).eq('subtype', 'person').ilike('title', personName.trim()).limit(1).maybeSingle()
      if (exP) pid = exP.id
      else {
        pid = crypto.randomUUID()
        await supabase.from('nodes').insert({ id: pid, org_id: orgId, owner_id: userId, layer: 'personal', kind: 'note', parent_id: pplHome, title: personName.trim(), icon: '👤', subtype: 'person', md: `# ${personName.trim()}\n\n## Chuyện đã thấy/nghe\n- ${personStory}`, status: 'published', min_level: 1 })
      }
      await addLink(folder.id, pid, 'people', { meta: { story: personStory } })
    }
    // M5: thời gian
    if (eventDate) await supabase.from('nodes').update({ event_date: eventDate }).eq('id', folder.id)
    if (newLife.title.trim()) {
      const tlHome = await sysPage('timeline_home', 'Dòng đời', '🌳')
      const lid = crypto.randomUUID()
      await supabase.from('nodes').insert({ id: lid, org_id: orgId, owner_id: userId, layer: 'personal', kind: 'note', parent_id: tlHome, title: newLife.title.trim(), icon: '🌟', subtype: 'life_event', event_date: newLife.date || null, status: 'published', min_level: 1 })
      await addLink(folder.id, lid, 'time')
    }
    for (const id of lifeSel) await addLink(folder.id, id, 'time')
    // M6: giá trị (tạo bộ lần đầu) + neo
    let valIds = [...valSel]
    if (valPick.length) {
      const vHome = await sysPage('values_home', 'Giá trị cốt lõi', '⭐')
      for (const name of valPick) {
        const vid = crypto.randomUUID()
        await supabase.from('nodes').insert({ id: vid, org_id: orgId, owner_id: userId, layer: 'personal', kind: 'page', parent_id: vHome, title: name, icon: '💎', subtype: 'core_value', status: 'published', min_level: 1 })
        valIds.push(vid)
      }
    }
    for (const id of valIds) await addLink(folder.id, id, 'values')
    if (mantra.trim()) {
      const aHome = await sysPage('anchor_home', 'Kim Chỉ Nam', '🧭')
      const mid = crypto.randomUUID()
      await supabase.from('nodes').insert({ id: mid, org_id: orgId, owner_id: userId, layer: 'personal', kind: 'note', parent_id: aHome, title: `“${mantra.trim().slice(0, 80)}”`, icon: '⚓', subtype: 'mantra', md: `> ${mantra.trim()}\n\n— rút từ [[${folder.title}]]`, status: 'published', min_level: 1 })
      await addLink(mid, folder.id, 'anchor', quote ? { excerpt: quote.text.slice(0, 280), from_block: quote.block } : undefined)
    }
    // nguyên lý + hành động
    const { data: cur } = await supabase.from('nodes').select('props').eq('id', folder.id).single()
    const props = { ...((cur?.props as Record<string, unknown>) ?? {}), ...(principle.trim() ? { principle: principle.trim() } : {}), ...(action.trim() ? { action: { text: action.trim(), due: due || null } } : {}) }
    await supabase.from('nodes').update({ props }).eq('id', folder.id)
    // RADAR: map 8 chiều → 5 cạnh, merge GREATEST
    const totalLinks = kOut.length + kIn.length + rOut.length + rIn.length + refs.length + valIds.length + lifeSel.length + (newLife.title ? 1 : 0) + (personName && personStory ? 1 : 0)
    const fresh = {
      connections: Math.min(10, Math.round(1.5 * dimsCovered + 0.5 * totalLinks)),
      meaning: Math.min(10, Math.round((principle.trim() ? 4 : 0) + (recall.trim() ? 2 : 0) + (valIds.length ? 1.5 : 0) + (mantra.trim() ? 3 : 0))),
      evidence: Math.min(10, Math.round(3 * Math.min(refs.length + rOut.length + rIn.length, 2) + 2 * (personName && personStory ? 1 : 0) + (evi ? 2 : 0))),
      experience: Math.min(10, Math.round((expStory.trim() ? 4 : 0) + (emo ? 2 : 0) + (lifeSel.length || newLife.title ? 2 : 0) + (eventDate ? 2 : 0))),
      action: action.trim() ? (due ? 10 : 8) : 0,
    }
    const { data: old } = await supabase.from('wisdom_depth').select('*').eq('node_id', folder.id).eq('user_id', userId).maybeSingle()
    const merged = old ? {
      connections: Math.max(old.connections, fresh.connections), meaning: Math.max(old.meaning, fresh.meaning),
      evidence: Math.max(old.evidence, fresh.evidence), experience: Math.max(old.experience, fresh.experience), action: Math.max(old.action, fresh.action),
    } : fresh
    const oldDims = (old?.dims as Record<string, boolean>) ?? {}
    const mergedDims = Object.fromEntries(DIM8.map(d => [d.key, !!oldDims[d.key] || dims[d.key]]))
    await supabase.from('wisdom_depth').upsert({
      node_id: folder.id, user_id: userId, ...merged,
      learned: depthScore(merged) >= 20 || dimsCovered >= 2,
      runs: (old?.runs ?? 0) + 1, last_run_at: new Date().toISOString(),
      next_review_at: new Date(Date.now() + [1, 3, 7, 21, 60][Math.min(4, old?.review_count ?? 0)] * 86400000).toISOString(),
      dims: mergedDims,
    }, { onConflict: 'node_id,user_id' })
    if (lingering.trim()) await supabase.from('open_questions').insert({ user_id: userId, node_id: folder.id, question: lingering.trim(), status: 'open' })
    await supabase.from('events').insert({ user_id: userId, type: 'tham', node_id: folder.id })
    setBusy(false); onSaved()
    setCelebrate({ score: depthScore(merged), covered: dimsCovered })
  }

  const inputCls = 'w-full rounded-xl bg-white/5 border border-white/10 p-3 text-sm outline-none focus:border-violet-400/50'
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-[60] p-6" onClick={onClose}>
      <div className="w-[620px] max-w-[94vw] max-h-[90vh] overflow-auto bg-[#0d0d18] border border-white/10 rounded-2xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold">🔥 Chuyển hoá: {folder.title}</div>
          <div className="flex items-center gap-2">
            {/* HOA THẤM 8 CÁNH */}
            <div className="flex gap-1" title={`${dimsCovered}/8 chiều đã chạm`}>
              {DIM8.map(d => (
                <span key={d.key} title={d.label} className="w-2.5 h-2.5 rounded-full transition-all" style={{ background: dims[d.key] ? d.color : '#ffffff18', boxShadow: dims[d.key] ? `0 0 6px ${d.color}` : 'none' }} />
              ))}
            </div>
            <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg bg-white/5 border border-white/10">✕</button>
          </div>
        </div>
        <div className="flex gap-1 mb-4">
          {STEPS.map((s, i) => <button key={s} onClick={() => setStep(i)} className={`flex-1 text-center text-[10px] py-1.5 rounded-md transition ${i === step ? 'bg-gradient-to-r from-violet-500/60 to-cyan-500/50 text-white' : i < step ? 'bg-white/10 text-zinc-300' : 'bg-white/5 text-zinc-600'}`}>{i + 1}·{s}</button>)}
        </div>

        <div className="min-h-[210px]">
          {step === 0 && (
            <>
              <p className="text-sm text-zinc-400 mb-2">📖 Đọc lại và <b>nhặt tối đa 3 câu đắt nhất</b> — quote sẽ gắn vào liên kết (mức đoạn, không phải cả trang).</p>
              <div className="space-y-1.5 max-h-[240px] overflow-auto pr-1">
                {blocks.map(b => {
                  const on = quotes.some(x => x.block === b.block)
                  return <button key={b.block} onClick={() => setQuotes(qs => on ? qs.filter(x => x.block !== b.block) : qs.length < 3 ? [...qs, b] : qs)}
                    className={`w-full text-left text-xs rounded-xl border px-3 py-2 leading-relaxed transition ${on ? 'border-amber-400/50 bg-amber-500/10 text-amber-100' : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/25'}`}>
                    {on && '💛 '}{b.text.slice(0, 160)}{b.text.length > 160 && '…'}
                  </button>
                })}
                {blocks.length === 0 && <p className="text-xs text-zinc-600">Bài chưa có nội dung — bấm Tiếp.</p>}
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <p className="text-sm text-zinc-400 mb-2">🧠 <b>Kiến thức</b> — biến chữ của người khác thành nguyên lý của bạn.</p>
              <textarea value={recall} onChange={e => setRecall(e.target.value)} placeholder="3 ý còn đọng lại (đừng nhìn lại)…" className={inputCls + ' h-16 mb-2'} />
              <input value={principle} onChange={e => setPrinciple(e.target.value)} placeholder="⚡ Nếu chỉ giữ MỘT CÂU nguyên lý bằng lời bạn: …" className={inputCls + ' mb-3'} />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="🔍 Tìm bài để nối…" className={inputCls + ' mb-2 py-2'} />
              <div className="space-y-2.5">
                <Chips dir="→ NGUYÊN LÝ NÀY THUỘC / DẪN TỚI" dim="knowledge" selected={kOut} onToggle={(id, t) => toggleIn(kOut, setKOut, id, t, '#22d3ee')} />
                <Chips dir="← BÀI NÀO NÊN TRỎ VỀ ĐÂY" dim="knowledge" selected={kIn} onToggle={(id, t) => toggleIn(kIn, setKIn, id, t, '#22d3ee')} />
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <p className="text-sm text-zinc-400 mb-2">📚 <b>Tham chiếu</b> — nguồn gốc & mạng dẫn chứng (credibility cho content sau này).</p>
              <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3 mb-3">
                <div className="text-[10px] uppercase tracking-wider text-violet-300/80 mb-2">Nguồn ngoài (sách / URL / video)</div>
                <div className="flex gap-1.5 mb-2">
                  <select value={refDraft.type} onChange={e => setRefDraft({ ...refDraft, type: e.target.value })} className="rounded-lg bg-[#15151f] border border-white/10 px-2 text-xs outline-none">
                    {['sách', 'url', 'video', 'podcast'].map(t => <option key={t}>{t}</option>)}
                  </select>
                  <input value={refDraft.title} onChange={e => setRefDraft({ ...refDraft, title: e.target.value })} placeholder="Tên nguồn…" className="flex-1 rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-xs outline-none" />
                  <input value={refDraft.url} onChange={e => setRefDraft({ ...refDraft, url: e.target.value })} placeholder="link (tuỳ chọn)" className="w-32 rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-xs outline-none" />
                  <button onClick={() => { if (refDraft.title.trim()) { setRefs([...refs, refDraft]); setRefDraft({ type: 'sách', title: '', url: '' }); fire('Nguồn: ' + refDraft.title, '#e879f9') } }} className="rounded-lg bg-violet-500/30 border border-violet-400/40 px-3 text-xs">＋</button>
                </div>
                <div className="flex flex-wrap gap-1.5">{refs.map((r, i) => <span key={i} className="text-[11px] rounded-lg bg-violet-500/15 border border-violet-400/30 text-violet-200 px-2 py-1">{r.type === 'sách' ? '📕' : '🔗'} {r.title} <button onClick={() => setRefs(refs.filter((_, j) => j !== i))} className="text-zinc-500 ml-1">✕</button></span>)}</div>
              </div>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="🔍 Tìm trang nội bộ…" className={inputCls + ' mb-2 py-2'} />
              <div className="space-y-2.5">
                <Chips dir="→ BÀI NÀY TRÍCH / DẪN TỪ" dim="reference" selected={rOut} onToggle={(id, t) => toggleIn(rOut, setROut, id, t, '#e879f9')} />
                <Chips dir="← TRANG NÀO NÊN DẪN VỀ ĐÂY (BACKLINK)" dim="reference" selected={rIn} onToggle={(id, t) => toggleIn(rIn, setRIn, id, t, '#e879f9')} />
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <p className="text-sm text-zinc-400 mb-2">🌱 <b>Cuộc đời</b> — điều này chạm vào đời thật thế nào? (điền được phần nào hay phần đó)</p>
              <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3 mb-2.5">
                <div className="text-[10px] uppercase tracking-wider text-amber-300/80 mb-1.5">🌱 Trải nghiệm — kể 1 lần BẠN đã sống điều này</div>
                <textarea value={expStory} onChange={e => { setExpStory(e.target.value) }} className={inputCls + ' h-16'} placeholder="Hồi tháng 3, mình đã…" />
                {expStory.trim() && <label className="flex items-center gap-2 mt-1.5 text-[11px] text-zinc-400"><input type="checkbox" checked={makeNote} onChange={e => setMakeNote(e.target.checked)} className="accent-amber-400" /> Lưu thành note trong 📓 Nhật ký hành trình + nối về bài</label>}
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3 mb-2.5">
                <div className="text-[10px] uppercase tracking-wider text-amber-300/80 mb-1.5">🧡 Cảm xúc — bài này chạm gì trong bạn?</div>
                <div className="flex gap-1.5">{EMOTIONS.map(([ic, name]) => <button key={name} onClick={() => { setEmo(emo === name ? '' : name); if (emo !== name) fire('Cảm xúc: ' + name, '#fbbf24') }} className={`px-2.5 py-1.5 rounded-lg text-xs border ${emo === name ? 'bg-amber-500/25 border-amber-400/50 text-amber-100' : 'bg-white/5 border-white/10 text-zinc-400'}`}>{ic} {name}</button>)}</div>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
                <div className="text-[10px] uppercase tracking-wider text-emerald-300/80 mb-1.5">💚 Con người — chuyện thật bạn đã thấy/nghe của ai?</div>
                <input value={personName} onChange={e => setPersonName(e.target.value)} placeholder="Tên người (vd: Chị Lan)…" className={inputCls + ' py-2 mb-1.5'} />
                <textarea value={personStory} onChange={e => setPersonStory(e.target.value)} placeholder="Chuyện gì đã xảy ra với họ liên quan bài này…" className={inputCls + ' h-14'} />
              </div>
            </>
          )}
          {step === 4 && (
            <>
              <p className="text-sm text-zinc-400 mb-2">💙 <b>Thời gian</b> — neo bài vào dòng đời. Thời gian SỰ KIỆN thực tế, không phải ngày tạo trang.</p>
              <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3 mb-2.5">
                <div className="text-[10px] uppercase tracking-wider text-blue-300/80 mb-1.5">Nội dung này gắn với thời điểm nào? (viết về quá khứ → chọn ngày quá khứ)</div>
                <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="rounded-lg bg-[#15151f] border border-white/10 px-3 py-2 text-sm outline-none" />
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
                <div className="text-[10px] uppercase tracking-wider text-blue-300/80 mb-2">Vang vọng tới giai đoạn nào trong ĐỜI BẠN?</div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {lifeEvents.map(le => <button key={le.id} onClick={() => toggleIn(lifeSel, setLifeSel, le.id, le.title, '#60a5fa')} className={`px-2.5 py-1.5 rounded-lg text-xs border ${lifeSel.includes(le.id) ? 'bg-blue-500/30 border-blue-400/50 text-blue-100' : 'bg-white/5 border-white/10 text-zinc-300'}`}>🌟 {le.title}{le.event_date && <span className="text-zinc-500 ml-1">{le.event_date.slice(0, 7)}</span>}</button>)}
                  {lifeEvents.length === 0 && <span className="text-xs text-zinc-600">Chưa có mốc đời nào — thêm mốc đầu tiên ↓</span>}
                </div>
                <div className="flex gap-1.5">
                  <input value={newLife.title} onChange={e => setNewLife({ ...newLife, title: e.target.value })} placeholder="＋ Mốc đời mới (vd: Bắt đầu QNET)…" className="flex-1 rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-xs outline-none" />
                  <input type="date" value={newLife.date} onChange={e => setNewLife({ ...newLife, date: e.target.value })} className="rounded-lg bg-[#15151f] border border-white/10 px-2 py-1.5 text-xs outline-none" />
                </div>
              </div>
            </>
          )}
          {step === 5 && (
            <>
              <p className="text-sm text-zinc-400 mb-2">💎 <b>Hồn cốt</b> — bài này phụng sự giá trị nào của bạn, và câu neo của riêng bạn.</p>
              <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3 mb-2.5">
                <div className="text-[10px] uppercase tracking-wider text-violet-300/80 mb-2">⭐ Giá trị cốt lõi {coreValues.length === 0 && valPick.length === 0 && '— lần đầu: chọn 3–7 giá trị bạn sống vì nó'}</div>
                {coreValues.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">{coreValues.map(v => <button key={v.id} onClick={() => toggleIn(valSel, setValSel, v.id, v.title, '#a78bfa')} className={`px-2.5 py-1.5 rounded-lg text-xs border ${valSel.includes(v.id) ? 'bg-violet-500/30 border-violet-400/50 text-violet-100' : 'bg-white/5 border-white/10 text-zinc-300'}`}>💎 {v.title}</button>)}</div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-1.5 mb-2">{VALUE_SUGGEST.map(v => <button key={v} onClick={() => setValPick(p => p.includes(v) ? p.filter(x => x !== v) : p.length < 7 ? [...p, v] : p)} className={`px-2.5 py-1.5 rounded-lg text-xs border ${valPick.includes(v) ? 'bg-violet-500/30 border-violet-400/50 text-violet-100' : 'bg-white/5 border-white/10 text-zinc-400'}`}>{v}</button>)}</div>
                    <div className="flex gap-1.5">
                      <input value={valCustom} onChange={e => setValCustom(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && valCustom.trim()) { setValPick(p => [...p, valCustom.trim()]); setValCustom('') } }} placeholder="＋ Giá trị của riêng bạn…" className="flex-1 rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-xs outline-none" />
                    </div>
                    {valPick.length > 0 && <p className="text-[10px] text-violet-300 mt-1.5">Sẽ tạo trang ⭐ Giá trị cốt lõi với {valPick.length} giá trị — bài này nối về: {valPick.join(', ')}</p>}
                  </>
                )}
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
                <div className="text-[10px] uppercase tracking-wider text-red-300/80 mb-1.5">⚓ Neo — viết MỘT CÂU kim chỉ nam CỦA BẠN rút từ bài</div>
                <textarea value={mantra} onChange={e => setMantra(e.target.value)} placeholder={quotes[0] ? `Gợi từ quote bạn nhặt: "${quotes[0].text.slice(0, 60)}…" — nhưng hãy viết bằng lời CỦA BẠN` : 'Vd: "Mình không kiểm soát kết quả, mình kiểm soát nỗ lực."'} className={inputCls + ' h-16'} />
                <p className="text-[10px] text-zinc-600 mt-1">Câu này vào trang 🧭 Kim Chỉ Nam — giọng nói tinh khiết nhất của bạn, AI sẽ học từ đây.</p>
              </div>
            </>
          )}
          {step === 6 && (
            <>
              <p className="text-sm text-zinc-400 mb-2">⚡ <b>Hành động</b> — tri thức chưa hành động là tri thức chưa thấm.</p>
              <textarea value={action} onChange={e => setAction(e.target.value)} placeholder="Một hành động cụ thể bạn sẽ làm…" className={inputCls + ' h-16 mb-2'} />
              <div className="flex items-center gap-3 mb-3">
                <label className="text-xs text-zinc-500">Hạn:</label>
                <input type="date" value={due} onChange={e => setDue(e.target.value)} className="rounded-lg bg-[#15151f] border border-white/10 px-2.5 py-1.5 text-xs outline-none" />
                <label className="flex items-center gap-2 text-xs text-zinc-400"><input type="checkbox" checked={evi} onChange={e => setEvi(e.target.checked)} /> 👁️ Đã thấy người khác làm & thành công</label>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3 flex items-center gap-4">
                <div className="flex gap-1.5">{DIM8.map(d => <span key={d.key} title={d.label} className="w-3.5 h-3.5 rounded-full" style={{ background: dims[d.key] ? d.color : '#ffffff15', boxShadow: dims[d.key] ? `0 0 8px ${d.color}` : 'none' }} />)}</div>
                <div className="text-xs text-zinc-400">{dimsCovered}/8 cánh hoa đã sáng {dimsCovered === 8 ? '— 🌸 THẤM TRỌN!' : dimsCovered >= 4 ? '— rất sâu rồi' : '— quay lại thắp thêm cánh nào'}</div>
              </div>
            </>
          )}
        </div>

        {last && <Neuro key={last.n} label={last.label} color={last.color} />}

        {/* 🎉 CELEBRATION — như hoàn thành khoá học online */}
        {celebrate && (
          <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 backdrop-blur-md" onClick={onClose}>
            <div className="dq-confetti" aria-hidden>{Array.from({ length: 26 }, (_, i) => <i key={i} style={{ left: `${(i * 137) % 100}%`, animationDelay: `${(i % 9) * 0.13}s`, background: DIM8[i % 8].color }} />)}</div>
            <div className="dq-step-in relative w-[420px] max-w-[92vw] rounded-3xl p-[1.5px] bg-gradient-to-br from-violet-500/70 via-white/10 to-cyan-500/70" onClick={e => e.stopPropagation()}>
              <div className="rounded-3xl bg-[#0d0d18]/97 p-8 text-center">
                <div className="text-6xl mb-2 dq-pop">🌸</div>
                <h2 className="text-2xl font-black mb-1">Đã chuyển hoá! Viên kim cương sáng thêm một mặt.</h2>
                <p className="text-sm text-zinc-400 mb-4">"{folder.title}" giờ là một phần của bạn.</p>
                <div className="flex justify-center gap-1.5 mb-4">
                  {DIM8.map(d => <span key={d.key} className="w-3.5 h-3.5 rounded-full" style={{ background: dims[d.key] ? d.color : '#ffffff15', boxShadow: dims[d.key] ? `0 0 10px ${d.color}` : 'none' }} />)}
                </div>
                <div className="text-5xl font-black bg-gradient-to-r from-violet-400 to-cyan-300 bg-clip-text text-transparent mb-1">{celebrate.score}</div>
                <div className="text-[11px] uppercase tracking-widest text-zinc-500 mb-1">Độ Chuyển hoá</div>
                <p className="text-xs text-zinc-500 mb-5">{celebrate.covered}/8 chiều · node sẽ sáng hơn trên Galaxy ✨ · hẹn ôn lại sau {[1,3,7,21,60][0]} ngày</p>
                <button onClick={onClose} className="rounded-xl bg-gradient-to-r from-violet-500 via-blue-600 to-cyan-500 px-6 py-2.5 text-sm font-bold shadow-lg shadow-violet-500/30">Tiếp tục hành trình →</button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mt-4">
          <button onClick={() => setStep(s => Math.max(0, s - 1))} className={`px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 ${step === 0 ? 'invisible' : ''}`}>← Lại</button>
          <span className="text-[10px] text-zinc-600">chiều nào cũng bỏ qua được — nhưng mỗi cánh sáng là một tầng sâu</span>
          {step < 6
            ? <button onClick={() => setStep(s => s + 1)} className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-violet-500 to-cyan-500">Tiếp →</button>
            : <button disabled={busy} onClick={finish} className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 disabled:opacity-50">{busy ? 'Đang ghi…' : '🌸 Hoàn tất Chuyển hoá'}</button>}
        </div>
      </div>
    </div>
  )
}
