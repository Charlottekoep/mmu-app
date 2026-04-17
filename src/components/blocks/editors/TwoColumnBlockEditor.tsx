'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'
import type { TwoColumnBlock } from '@/components/blocks/BlockTypes'

const label = 'block text-[11px] font-bold uppercase tracking-widest text-[#2969FF] mb-1.5'

// ─── Shared mini toolbar ──────────────────────────────────────────────────

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> | null }) {
  if (!editor) return null
  const btn = (active: boolean, onClick: () => void, title: string, children: React.ReactNode) => (
    <button
      key={title}
      type="button"
      title={title}
      onClick={onClick}
      className={`flex h-6 min-w-[24px] items-center justify-center rounded px-1 text-[11px] font-bold transition-colors ${
        active ? 'bg-[#2969FF]/15 text-[#2969FF]' : 'text-[#969696] hover:bg-[#F7F7F7] hover:text-[#262626]'
      }`}
    >
      {children}
    </button>
  )
  return (
    <div className="flex items-center gap-0.5 border-b border-[#DEDEDE] px-2 py-1.5">
      {btn(editor.isActive('bold'),        () => editor.chain().focus().toggleBold().run(),        'Bold',          'B')}
      {btn(editor.isActive('italic'),      () => editor.chain().focus().toggleItalic().run(),      'Italic',        <em>I</em>)}
      <div className="mx-1 h-3 w-px bg-[#DEDEDE]" />
      {btn(editor.isActive('bulletList'),  () => editor.chain().focus().toggleBulletList().run(),  'Bullet list',   '•–')}
      {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), 'Numbered list', '1.')}
    </div>
  )
}

// ─── Single column panel ──────────────────────────────────────────────────

function ColumnEditor({
  columnLabel,
  content,
  onUpdate,
}: {
  columnLabel: string
  content:     string
  onUpdate:    (html: string) => void
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: content || '',
    onUpdate({ editor }) {
      onUpdate(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'outline-none text-[14px] text-[#262626] [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:my-1 [&_li]:my-0.5',
        'data-placeholder': `${columnLabel} content…`,
      },
    },
  })

  useEffect(() => {
    if (!editor || editor.getHTML() === content) return
    editor.commands.setContent(content || '')
  }, [content]) // eslint-disable-line react-hooks/exhaustive-deps

  const editorKey = `two-col-${columnLabel.toLowerCase().replace(' ', '-')}`

  return (
    <>
      <style>{`
        .${editorKey} .ProseMirror { min-height: 120px; outline: none; }
        .${editorKey} .ProseMirror.is-editor-empty:not(:focus)::before {
          content: attr(data-placeholder); color: #969696; float: left; height: 0; pointer-events: none;
        }
      `}</style>
      <div className="flex flex-col">
        <p className={label}>{columnLabel}</p>
        <div className={`${editorKey} overflow-hidden rounded-lg border border-[#DEDEDE] bg-white focus-within:border-[#2969FF] transition-colors`}>
          <Toolbar editor={editor} />
          <div
            className="cursor-text px-3 py-2.5"
            style={{ minHeight: 140 }}
            onClick={() => editor?.commands.focus()}
          >
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Two column block editor ──────────────────────────────────────────────

type Props = {
  block:    TwoColumnBlock
  onChange: (block: TwoColumnBlock) => void
}

export default function TwoColumnBlockEditor({ block, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <ColumnEditor
        columnLabel="Left column"
        content={block.leftContent}
        onUpdate={(html) => onChange({ ...block, leftContent: html })}
      />
      <ColumnEditor
        columnLabel="Right column"
        content={block.rightContent}
        onUpdate={(html) => onChange({ ...block, rightContent: html })}
      />
    </div>
  )
}
