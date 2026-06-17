'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Msg = { id: string; user_id: string; body: string; node_id: string | null; created_at: string }
type Prof = { full_name: string | null; avatar_url: string | null }

/** 💬 Phòng biên tập — chat riêng cho ban biên tập (admin · tổng biên tập · biên tập).
 *  RLS: chỉ thành viên can_edit cùng org đọc/gửi được. Realtime qua supabase channel. */
export default function BoardChat({ orgId, me, pages, onOpenPage }: {
  orgId: string; me: string
  pages: { id: string; title: string | null; icon?: string | null }[]
  onOpenPage: (id: string) => void
}) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [profs, setProfs] = useState<Record<string, Prof>>({})
  const [body, setBody] = useState('')
  const [attach, setAttach] = useState<{ id: string; title: string } | null>(null)
  const [pick, setPick] = useState(false)
  const [pickQ, setPickQ] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const scrollOnNext = useRef(true)

  async function loadProfs(ids: string[]) {
    const need = ids.filter(id => !(id in profs))
    if (!need.length) return
    const { data } = await supabase.from('profiles').select('id,full_name,avatar_url').in('id', need)
    if (data?.length) setProfs(p => ({ ...p, ...Object.fromEntries(data.map(d => [d.id, { full_name: d.full_name, avatar_url: d.avatar_url }])) }))
  }

  useEffect(() => {
    if (!orgId) return
    let alive = true
    supabase.from('board_messages').select('id,user_id,body,node_id,created_at').eq('org_id', orgId).order('created_at', { ascending: true }).limit(200)
      .then(({ data }) => { if (!alive || !data) return; setMsgs(data as Msg[]); loadProfs([...new Set(data.map(m => m.user_id))]) })
    const ch = supabase.channel('board-chat-' + orgId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'board_messages', filter: `org_id=eq.${orgId}` }, payload => {
        const m = payload.new as Msg
        scrollOnNext.current = true
        setMsgs(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m])
        loadProfs([m.user_id])
      })
      .subscribe()
    return () => { alive = false; supabase.removeChannel(ch) }
  }, [orgId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (scrollOnNext.current) { endRef.current?.scrollIntoView({ behavior: 'smooth' }); scrollOnNext.current = false } }, [msgs])

  async function send() {
    const text = body.trim()
    if (!text || sending) return
    setSending(true)
    scrollOnNext.current = true
    const { data, error } = await supabase.from('board_messages').insert({ org_id: orgId, body: text, node_id: attach?.id ?? null }).select('id,user_id,body,node_id,created_at').single()
    setSending(false)
    if (error) return
    setBody(''); setAttach(null)
    if (data) { setMsgs(prev => prev.some(x => x.id === data.id) ? prev : [...prev, data as Msg]); loadProfs([(data as Msg).user_id]) }
  }

  const name = (id: string) => profs[id]?.full_name || (id === me ? 'Bạn' : 'Thành viên')
  const initial = (id: string) => (profs[id]?.full_name || 'A').trim().charAt(0).toUpperCase()
  const fmt = (s: string) => { const d = new Date(s); return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) }
  const fmtDay = (s: string) => new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
  const pickList = pages.filter(p => p.title && (!pickQ.trim() || p.title.toLowerCase().includes(pickQ.toLowerCase()))).slice(0, 8)

  let lastDay = ''
  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-b from-cyan-500/[0.05] to-transparent overflow-hidden flex flex-col" style={{ height: 440 }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10 bg-white/[0.02]">
        <span className="text-base">💬</span>
        <div className="text-sm font-bold">Phòng biên tập</div>
        <span className="text-[10px] text-cyan-300/70 bg-cyan-500/10 border border-cyan-400/25 rounded-full px-2 py-0.5">riêng ban biên tập</span>
      </div>

      <div className="flex-1 overflow-auto px-4 py-3 space-y-2.5">
        {msgs.length === 0 && <p className="text-xs text-zinc-600 text-center mt-10">Chưa có tin nhắn nào — mở lời chào ban biên tập 👋</p>}
        {msgs.map(m => {
          const mine = m.user_id === me
          const day = fmtDay(m.created_at)
          const showDay = day !== lastDay; lastDay = day
          const linked = m.node_id ? pages.find(p => p.id === m.node_id) : null
          return (
            <div key={m.id}>
              {showDay && <div className="text-center text-[10px] text-zinc-600 my-2">— {day} —</div>}
              <div className={`flex gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
                <div className="w-7 h-7 rounded-full shrink-0 grid place-items-center text-[11px] font-bold" style={{ background: mine ? '#22d3ee30' : '#a78bfa30', color: mine ? '#67e8f9' : '#c4b5fd' }}>{initial(m.user_id)}</div>
                <div className={`max-w-[78%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className="text-[10px] text-zinc-500 mb-0.5 px-1">{name(m.user_id)} · {fmt(m.created_at)}</div>
                  <div className={`rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${mine ? 'bg-cyan-500/20 border border-cyan-400/25 text-cyan-50' : 'bg-white/[0.06] border border-white/10 text-zinc-200'}`}>
                    {m.body}
                    {linked && (
                      <button onClick={() => onOpenPage(linked.id)} className="mt-1.5 flex items-center gap-1.5 text-[11px] rounded-lg bg-black/30 border border-white/10 px-2 py-1 hover:border-cyan-400/50 transition w-full text-left">
                        <span>{linked.icon || '📄'}</span><span className="truncate">{linked.title}</span><span className="ml-auto text-zinc-500">mở →</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {attach && (
        <div className="mx-4 mb-1 flex items-center gap-2 text-[11px] rounded-lg bg-cyan-500/10 border border-cyan-400/25 px-2.5 py-1.5">
          <span>📎 Đính trang:</span><span className="font-medium truncate flex-1">{attach.title}</span>
          <button onClick={() => setAttach(null)} className="text-zinc-500 hover:text-zinc-300">✕</button>
        </div>
      )}
      {pick && (
        <div className="mx-4 mb-1 rounded-xl bg-[#10101a] border border-white/10 p-2">
          <input autoFocus value={pickQ} onChange={e => setPickQ(e.target.value)} placeholder="Tìm trang để đính kèm…" className="w-full rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-xs outline-none mb-1.5" />
          <div className="max-h-32 overflow-auto space-y-0.5">
            {pickList.map(p => <button key={p.id} onClick={() => { setAttach({ id: p.id, title: p.title! }); setPick(false); setPickQ('') }} className="w-full text-left text-xs rounded-lg px-2 py-1.5 hover:bg-white/5 truncate">{p.icon || '📄'} {p.title}</button>)}
            {pickList.length === 0 && <div className="text-[11px] text-zinc-600 px-2 py-1">Không tìm thấy trang</div>}
          </div>
        </div>
      )}

      <div className="flex items-end gap-2 px-3 py-2.5 border-t border-white/10 bg-white/[0.02]">
        <button onClick={() => setPick(v => !v)} title="Đính kèm trang" className={`w-9 h-9 shrink-0 grid place-items-center rounded-xl border transition ${pick || attach ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-200' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-zinc-200'}`}>📎</button>
        <textarea value={body} onChange={e => setBody(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} rows={1} placeholder="Nhắn ban biên tập… (Enter gửi · Shift+Enter xuống dòng)" className="flex-1 resize-none rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-cyan-400/50 max-h-28" />
        <button onClick={send} disabled={!body.trim() || sending} className="h-9 shrink-0 rounded-xl ak-cta px-4 text-sm font-semibold disabled:opacity-40">{sending ? '…' : 'Gửi'}</button>
      </div>
    </div>
  )
}
