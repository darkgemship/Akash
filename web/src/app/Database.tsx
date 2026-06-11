'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'

type ColType = 'text' | 'number' | 'select' | 'checkbox' | 'date'
type Col = { id: string; name: string; type: ColType; options?: string[] }
type Cell = string | boolean
type Row = { id: string; title: string | null; icon: string | null; props: Record<string, Cell>; position: number | null }

const DEFAULT_COLS: Col[] = [
  { id: 'status', name: 'Trạng thái', type: 'select', options: ['Mới', 'Đang làm', 'Xong'] },
  { id: 'note', name: 'Ghi chú', type: 'text' },
]
const TYPES: { t: ColType; label: string }[] = [
  { t: 'text', label: '📝 Văn bản' }, { t: 'number', label: '🔢 Số' },
  { t: 'select', label: '🏷️ Lựa chọn' }, { t: 'checkbox', label: '☑️ Checkbox' }, { t: 'date', label: '📅 Ngày' },
]
const TYPE_ICON: Record<ColType, string> = { text: '📝', number: '🔢', select: '🏷️', checkbox: '☑️', date: '📅' }
const CHIP = ['bg-violet-500/20 text-violet-200', 'bg-cyan-500/20 text-cyan-200', 'bg-emerald-500/20 text-emerald-200', 'bg-amber-500/20 text-amber-200', 'bg-pink-500/20 text-pink-200', 'bg-blue-500/20 text-blue-200']
function chipClass(opts: string[] | undefined, v: string) {
  const i = Math.max(0, (opts ?? []).indexOf(v))
  return CHIP[i % CHIP.length]
}

export default function Database({ node, orgId, userId, layer, onOpenPage }: {
  node: { id: string; kind: string }
  orgId: string | null
  userId: string
  layer: string
  onOpenPage: (id: string) => void
}) {
  const [cols, setCols] = useState<Col[]>(DEFAULT_COLS)
  const [rows, setRows] = useState<Row[]>([])
  const [view, setView] = useState<'table' | 'board'>('table')
  const [openCell, setOpenCell] = useState<string | null>(null)
  const [colMenu, setColMenu] = useState<string | null>(null)
  const [addColOpen, setAddColOpen] = useState(false)

  const load = useCallback(async () => {
    const { data: nd } = await supabase.from('nodes').select('db_columns').eq('id', node.id).single()
    const dc = nd?.db_columns as Col[] | null
    setCols(dc && dc.length ? dc : DEFAULT_COLS)
    const { data } = await supabase.from('nodes').select('id,title,icon,props,position').eq('parent_id', node.id).neq('kind', 'block').order('position', { nullsFirst: true }).order('created_at')
    setRows(((data as Row[]) ?? []).map(r => ({ ...r, props: r.props ?? {} })))
  }, [node.id])
  useEffect(() => { load() }, [load])

  async function saveCols(next: Col[]) { setCols(next); await supabase.from('nodes').update({ db_columns: next }).eq('id', node.id) }
  async function addRow(preset?: Record<string, Cell>) {
    const id = crypto.randomUUID()
    const pos = rows.reduce((m, r) => Math.max(m, r.position ?? 0), 0) + 10
    await supabase.from('nodes').insert({ id, org_id: orgId, owner_id: layer === 'personal' ? userId : null, layer, kind: 'page', parent_id: node.id, title: '', status: 'published', min_level: 1, position: pos, props: preset ?? {} })
    load()
  }
  async function setCell(row: Row, colId: string, value: Cell) {
    const props = { ...(row.props || {}), [colId]: value }
    setRows(rs => rs.map(r => (r.id === row.id ? { ...r, props } : r)))
    setOpenCell(null)
    await supabase.from('nodes').update({ props }).eq('id', row.id)
  }
  async function setTitle(row: Row, title: string) {
    setRows(rs => rs.map(r => (r.id === row.id ? { ...r, title } : r)))
    await supabase.from('nodes').update({ title }).eq('id', row.id)
  }
  async function delRow(id: string) { setRows(rs => rs.filter(r => r.id !== id)); await supabase.from('nodes').delete().eq('id', id) }
  function addColumn(type: ColType) {
    const id = 'c_' + Math.random().toString(36).slice(2, 7)
    saveCols([...cols, { id, name: 'Cột mới', type, ...(type === 'select' ? { options: ['Tuỳ chọn 1'] } : {}) }])
    setAddColOpen(false)
  }
  function patchCol(id: string, patch: Partial<Col>) { saveCols(cols.map(c => (c.id === id ? { ...c, ...patch } : c))) }
  function delCol(id: string) { saveCols(cols.filter(c => c.id !== id)); setColMenu(null) }
  function addOption(col: Col, opt: string) { patchCol(col.id, { options: [...(col.options ?? []), opt] }) }

  /* ---------- CELL EDITOR ---------- */
  function CellView({ row, col }: { row: Row; col: Col }) {
    const key = `${row.id}:${col.id}`
    const val = row.props?.[col.id]
    if (col.type === 'checkbox') {
      return <input type="checkbox" checked={!!val} onChange={e => setCell(row, col.id, e.target.checked)} className="w-4 h-4 accent-violet-500" />
    }
    if (col.type === 'select') {
      const open = openCell === key
      return (
        <div className="relative">
          <button onClick={() => setOpenCell(open ? null : key)} className="min-h-[24px] w-full text-left">
            {val ? <span className={`text-xs rounded px-1.5 py-0.5 ${chipClass(col.options, String(val))}`}>{String(val)}</span> : <span className="text-zinc-600 text-xs">–</span>}
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setOpenCell(null)} />
              <div className="absolute z-30 mt-1 w-44 bg-[#1c1c26] border border-white/10 rounded-lg shadow-2xl p-1">
                {(col.options ?? []).map(o => (
                  <button key={o} onClick={() => setCell(row, col.id, o)} className="block w-full text-left px-2 py-1 rounded hover:bg-white/10"><span className={`text-xs rounded px-1.5 py-0.5 ${chipClass(col.options, o)}`}>{o}</span></button>
                ))}
                <button onClick={() => setCell(row, col.id, '')} className="block w-full text-left px-2 py-1 rounded hover:bg-white/10 text-xs text-zinc-400">Bỏ chọn</button>
                <input placeholder="+ Thêm lựa chọn…" onKeyDown={e => { if (e.key === 'Enter') { const v = (e.target as HTMLInputElement).value.trim(); if (v) { addOption(col, v); setCell(row, col.id, v) } } }} className="w-full mt-1 rounded bg-white/5 border border-white/10 px-2 py-1 text-xs outline-none" />
              </div>
            </>
          )}
        </div>
      )
    }
    // text / number / date → inline input
    return (
      <input
        type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
        defaultValue={val === undefined || val === false ? '' : String(val)}
        onBlur={e => { if (e.target.value !== String(val ?? '')) setCell(row, col.id, e.target.value) }}
        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
        className="w-full bg-transparent outline-none text-sm placeholder:text-zinc-600"
        placeholder="–"
      />
    )
  }

  /* ---------- HEADER (tên cột + menu) ---------- */
  function ColHead({ col }: { col: Col }) {
    const open = colMenu === col.id
    return (
      <div className="relative flex items-center gap-1 group/col">
        <span className="text-zinc-500">{TYPE_ICON[col.type]}</span>
        <input value={col.name} onChange={e => patchCol(col.id, { name: e.target.value })} className="bg-transparent outline-none text-xs font-semibold text-zinc-300 w-full" />
        <button onClick={() => setColMenu(open ? null : col.id)} className="opacity-0 group-hover/col:opacity-100 text-zinc-500 hover:text-white px-1">⌄</button>
        {open && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setColMenu(null)} />
            <div className="absolute right-0 top-6 z-30 w-44 bg-[#1c1c26] border border-white/10 rounded-lg shadow-2xl py-1 text-sm">
              <div className="px-2 py-1 text-[10px] uppercase text-zinc-500">Kiểu cột</div>
              {TYPES.map(t => <button key={t.t} onClick={() => { patchCol(col.id, { type: t.t, ...(t.t === 'select' && !col.options ? { options: ['Tuỳ chọn 1'] } : {}) }); setColMenu(null) }} className={`block w-full text-left px-3 py-1 hover:bg-white/10 ${col.type === t.t ? 'text-violet-300' : ''}`}>{t.label}</button>)}
              <div className="border-t border-white/10 my-1" />
              <button onClick={() => delCol(col.id)} className="block w-full text-left px-3 py-1 hover:bg-red-500/20 text-red-300">🗑 Xoá cột</button>
            </div>
          </>
        )}
      </div>
    )
  }

  /* ---------- BOARD ---------- */
  const boardCol = cols.find(c => c.type === 'select')
  function Board() {
    if (!boardCol) return <p className="text-zinc-500 text-sm">Cần ít nhất 1 cột kiểu “Lựa chọn” để xem dạng bảng (board).</p>
    const groups = [...(boardCol.options ?? []), '—']
    return (
      <div className="flex gap-3 overflow-x-auto pb-2">
        {groups.map(g => {
          const items = rows.filter(r => (String(r.props?.[boardCol.id] ?? '') || '—') === g)
          return (
            <div key={g} className="min-w-[230px] w-[230px] shrink-0">
              <div className="flex items-center gap-2 mb-2 px-1">
                {g === '—' ? <span className="text-xs text-zinc-500">Trống</span> : <span className={`text-xs rounded px-1.5 py-0.5 ${chipClass(boardCol.options, g)}`}>{g}</span>}
                <span className="text-xs text-zinc-600">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map(r => (
                  <div key={r.id} className="rounded-lg bg-white/[0.04] border border-white/10 p-2.5 hover:border-violet-400/40">
                    <button onClick={() => onOpenPage(r.id)} className="text-sm text-left font-medium text-zinc-200 hover:text-white">{r.icon || '📄'} {r.title || 'Chưa đặt tên'}</button>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {cols.filter(c => c.id !== boardCol.id).map(c => {
                        const v = r.props?.[c.id]
                        if (v === undefined || v === '' || v === false) return null
                        return <span key={c.id} className="text-[10px] text-zinc-400 rounded bg-white/5 px-1.5 py-0.5">{c.type === 'checkbox' ? '✓' : String(v)}</span>
                      })}
                    </div>
                  </div>
                ))}
                <button onClick={() => addRow({ [boardCol.id]: g === '—' ? '' : g })} className="w-full text-left text-xs text-zinc-500 hover:text-zinc-300 px-1 py-1">＋ Thêm thẻ</button>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const gridCols = `minmax(180px,1.5fr) ${cols.map(() => 'minmax(120px,1fr)').join(' ')} 36px`

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-lg p-0.5 text-xs">
          <button onClick={() => setView('table')} className={`px-2.5 py-1 rounded ${view === 'table' ? 'bg-white/15 text-white' : 'text-zinc-400'}`}>☰ Bảng</button>
          <button onClick={() => setView('board')} className={`px-2.5 py-1 rounded ${view === 'board' ? 'bg-white/15 text-white' : 'text-zinc-400'}`}>▦ Board</button>
        </div>
        <span className="text-xs text-zinc-600">{rows.length} mục</span>
      </div>

      {view === 'board' ? <Board /> : (
        <div className="border border-white/10 rounded-xl overflow-x-auto">
          {/* header */}
          <div className="grid items-center bg-white/[0.03] border-b border-white/10 text-zinc-400" style={{ gridTemplateColumns: gridCols }}>
            <div className="px-3 py-2 text-xs font-semibold text-zinc-300 border-r border-white/5">Tên</div>
            {cols.map(c => <div key={c.id} className="px-3 py-2 border-r border-white/5"><ColHead col={c} /></div>)}
            <div className="relative grid place-items-center">
              <button onClick={() => setAddColOpen(o => !o)} title="Thêm cột" className="text-zinc-400 hover:text-white w-8 h-8">＋</button>
              {addColOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setAddColOpen(false)} />
                  <div className="absolute right-0 top-8 z-30 w-44 bg-[#1c1c26] border border-white/10 rounded-lg shadow-2xl py-1 text-sm">
                    {TYPES.map(t => <button key={t.t} onClick={() => addColumn(t.t)} className="block w-full text-left px-3 py-1.5 hover:bg-white/10">{t.label}</button>)}
                  </div>
                </>
              )}
            </div>
          </div>
          {/* rows */}
          {rows.map(r => (
            <div key={r.id} className="grid items-center border-b border-white/5 hover:bg-white/[0.02] group/row" style={{ gridTemplateColumns: gridCols }}>
              <div className="px-3 py-1.5 border-r border-white/5 flex items-center gap-1.5">
                <span className="text-sm">{r.icon || '📄'}</span>
                <input defaultValue={r.title ?? ''} onBlur={e => { if (e.target.value !== (r.title ?? '')) setTitle(r, e.target.value) }} placeholder="Chưa đặt tên" className="flex-1 bg-transparent outline-none text-sm font-medium text-zinc-200 placeholder:text-zinc-600 min-w-0" />
                <button onClick={() => onOpenPage(r.id)} title="Mở trang" className="opacity-0 group-hover/row:opacity-100 text-[11px] text-zinc-500 hover:text-white shrink-0">↗ mở</button>
              </div>
              {cols.map(c => <div key={c.id} className="px-3 py-1.5 border-r border-white/5"><CellView row={r} col={c} /></div>)}
              <button onClick={() => delRow(r.id)} className="opacity-0 group-hover/row:opacity-100 text-zinc-600 hover:text-red-300 grid place-items-center h-full">✕</button>
            </div>
          ))}
          <button onClick={() => addRow()} className="w-full text-left px-3 py-2 text-sm text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300">＋ Thêm mục</button>
        </div>
      )}
    </div>
  )
}
