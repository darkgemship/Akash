'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useCreateBlockNote, createReactInlineContentSpec, createReactBlockSpec, SuggestionMenuController, getDefaultReactSlashMenuItems } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import { BlockNoteSchema, defaultInlineContentSpecs, defaultBlockSpecs, filterSuggestionItems, insertOrUpdateBlockForSlashMenu } from '@blocknote/core'
import type { PartialBlock, BlockNoteEditor } from '@blocknote/core'
import { vi } from '@blocknote/core/locales'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import { supabase } from '@/lib/supabaseClient'
import Database from './Database'

export type PageRef = { id: string; title: string; icon?: string | null; kind?: string }
type Ctx = { noteId: string; orgId: string | null; userId: string; layer: string; onOpenPage?: (id: string) => void }

// inline content: liên kết tới một trang khác (kiểu @mention / [[wiki link]])
const PageLink = createReactInlineContentSpec(
  {
    type: 'pagelink',
    propSchema: { pageId: { default: '' }, label: { default: '' }, icon: { default: '' } },
    content: 'none',
  },
  {
    render: (props) => (
      <span
        data-pagelink={props.inlineContent.props.pageId}
        className="dq-pagelink"
        contentEditable={false}
      >
        {props.inlineContent.props.icon || '📄'} {props.inlineContent.props.label || 'Trang'}
      </span>
    ),
  }
)

// block nhúng bảng dữ liệu (như /database của Notion)
function DbEmbedView({ dbId, setDbId, ctx }: { dbId: string; setDbId: (id: string) => void; ctx: Ctx }) {
  const [creating, setCreating] = useState(false)
  useEffect(() => {
    if (dbId || creating) return
    setCreating(true)
    const id = crypto.randomUUID()
    const owner = ctx.layer === 'personal' ? ctx.userId : null
    supabase.from('nodes').insert({
      id, org_id: ctx.orgId, owner_id: owner, layer: ctx.layer, kind: 'database',
      parent_id: ctx.noteId, title: 'Bảng dữ liệu', status: 'published', min_level: 1, position: 0,
    }).then(({ error }) => { if (!error) setDbId(id) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbId])
  if (!dbId) return <div className="text-xs text-zinc-500 py-3">🗂️ Đang tạo bảng dữ liệu…</div>
  return (
    <div className="my-2 rounded-xl border border-white/10 bg-white/[0.02] p-3" contentEditable={false}>
      <Database node={{ id: dbId, kind: 'database' }} orgId={ctx.orgId} userId={ctx.userId} layer={ctx.layer} onOpenPage={(pid) => ctx.onOpenPage?.(pid)} />
    </div>
  )
}

function makeDbEmbed(ctxRef: { current: Ctx }) {
  return createReactBlockSpec(
    { type: 'dbembed', propSchema: { dbId: { default: '' } }, content: 'none' },
    {
      render: (props) => (
        <DbEmbedView
          dbId={props.block.props.dbId}
          setDbId={(id) => props.editor.updateBlock(props.block, { props: { dbId: id } })}
          ctx={ctxRef.current}
        />
      ),
    }
  )
}

export default function Editor({ noteId, orgId, userId = '', layer = 'personal', initialJson, initialMd, pages, editable = true, onSaved, onOpenPage, onLinked }: {
  noteId: string
  orgId: string | null
  userId?: string
  layer?: string
  initialJson: PartialBlock[] | null
  initialMd: string
  pages: PageRef[]
  editable?: boolean
  onSaved?: () => void
  onOpenPage?: (id: string) => void
  onLinked?: () => void
}) {
  const ctxRef = useRef<Ctx>({ noteId, orgId, userId, layer, onOpenPage })
  ctxRef.current = { noteId, orgId, userId, layer, onOpenPage }
  const schema = useMemo(() => BlockNoteSchema.create({
    inlineContentSpecs: { ...defaultInlineContentSpecs, pagelink: PageLink },
    blockSpecs: { ...defaultBlockSpecs, dbembed: makeDbEmbed(ctxRef)() },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [])
  const editor = useCreateBlockNote({
    schema,
    dictionary: vi,
    initialContent: initialJson && initialJson.length ? (initialJson as never) : undefined,
  })
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didParse = useRef(false)

  // chưa có JSON nhưng có markdown cũ → parse 1 lần
  if (!didParse.current && (!initialJson || !initialJson.length) && initialMd.trim()) {
    didParse.current = true
    ;(async () => {
      const blocks = await editor.tryParseMarkdownToBlocks(initialMd)
      editor.replaceBlocks(editor.document, blocks)
    })()
  }

  async function save() {
    const json = editor.document
    const md = await editor.blocksToMarkdownLossy(editor.document)
    await supabase.from('nodes').update({ content: json, md }).eq('id', noteId)
    onSaved?.()
  }
  function onChange() {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(save, 700)
  }

  return (
    <div
      className="dq-editor"
      onClick={(e) => {
        const el = (e.target as HTMLElement).closest('[data-pagelink]')
        if (el) { const id = el.getAttribute('data-pagelink'); if (id) onOpenPage?.(id) }
      }}
    >
      <BlockNoteView editor={editor} theme="dark" editable={editable} onChange={onChange} slashMenu={false}>
        {/* "/" — menu mặc định + Bảng dữ liệu (như Notion) */}
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={async (q) =>
            filterSuggestionItems(
              [
                ...getDefaultReactSlashMenuItems(editor as unknown as BlockNoteEditor),
                {
                  title: 'Bảng dữ liệu',
                  subtext: 'Nhúng database: bảng / board với cột tuỳ chỉnh',
                  aliases: ['database', 'db', 'bang', 'table'],
                  group: 'Nâng cao',
                  icon: <span>🗂️</span>,
                  onItemClick: () => {
                    insertOrUpdateBlockForSlashMenu(editor as unknown as BlockNoteEditor, { type: 'dbembed' } as never)
                  },
                },
              ],
              q
            )
          }
        />
        {/* @ hoặc [ : chèn liên kết tới trang khác */}
        {/* @ và [ = link ĐI ([[trang]]) · ( = kéo BACKLINK VỀ ((trang)) */}
        {['@', '[', '('].map((trigger) => (
          <SuggestionMenuController
            key={trigger}
            triggerCharacter={trigger}
            getItems={async (q) =>
              filterSuggestionItems(
                pages
                  .filter((p) => p.id !== noteId)
                  .map((p) => ({
                    title: p.title || 'Trang',
                    icon: <span>{p.icon || '📄'}</span>,
                    subtext: trigger === '(' ? '← kéo backlink về đây' : '→ liên kết tới trang',
                    onItemClick: () => {
                      editor.insertInlineContent([
                        { type: 'pagelink', props: { pageId: p.id, label: (trigger === '(' ? '↩ ' : '') + (p.title || 'Trang'), icon: p.icon || '' } },
                        ' ',
                      ] as never)
                      if (orgId) {
                        const row = trigger === '('
                          ? { org_id: orgId, from_node: p.id, to_node: noteId, dimension: 'reference' }
                          : { org_id: orgId, from_node: noteId, to_node: p.id, dimension: 'reference' }
                        supabase.from('links').insert(row).then(() => { onLinked?.() })
                      }
                    },
                  })),
                q
              )
            }
          />
        ))}
      </BlockNoteView>
    </div>
  )
}
