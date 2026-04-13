'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import { useEffect } from 'react'

// ─── Toolbar ──────────────────────────────────────────────────────────────

type ToolbarProps = {
  editor:    ReturnType<typeof useEditor> | null
  showTable: boolean
}

function Toolbar({ editor, showTable }: ToolbarProps) {
  if (!editor) return null

  const btn = (
    active:   boolean,
    disabled: boolean,
    onClick:  () => void,
    label:    string,
    children: React.ReactNode,
  ) => (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-7 min-w-[28px] items-center justify-center rounded px-1 text-[12px] font-bold transition-colors ${
        active
          ? 'bg-[#2969FF]/15 text-[#2969FF]'
          : disabled
            ? 'cursor-not-allowed text-[#DEDEDE]'
            : 'text-[#969696] hover:bg-[#F7F7F7] hover:text-[#262626]'
      }`}
    >
      {children}
    </button>
  )

  const inTable = editor.isActive('table')

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-[#DEDEDE] px-3 py-2">
      {btn(editor.isActive('bold'),         false, () => editor.chain().focus().toggleBold().run(),           'Bold',         'B')}
      {btn(editor.isActive('italic'),       false, () => editor.chain().focus().toggleItalic().run(),         'Italic',       <em>I</em>)}
      <div className="mx-1.5 h-4 w-px bg-[#DEDEDE]" />
      {btn(editor.isActive('bulletList'),   false, () => editor.chain().focus().toggleBulletList().run(),     'Bullet list',  '•–')}
      {btn(editor.isActive('orderedList'),  false, () => editor.chain().focus().toggleOrderedList().run(),    'Numbered list','1.')}
      {showTable && (
        <>
          <div className="mx-1.5 h-4 w-px bg-[#DEDEDE]" />
          {btn(false, false,    () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(), 'Insert table', '⊞')}
          {btn(false, !inTable, () => editor.chain().focus().addRowAfter().run(),    'Add row',     '+R')}
          {btn(false, !inTable, () => editor.chain().focus().deleteRow().run(),      'Remove row',  '−R')}
          {btn(false, !inTable, () => editor.chain().focus().addColumnAfter().run(), 'Add column',  '+C')}
          {btn(false, !inTable, () => editor.chain().focus().deleteColumn().run(),   'Remove col',  '−C')}
        </>
      )}
    </div>
  )
}

// ─── Editor ───────────────────────────────────────────────────────────────

type Props = {
  value:       string
  onChange:    (html: string) => void
  placeholder?: string
  minHeight?:   number
  showTable?:   boolean
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = 120,
  showTable = false,
}: Props) {
  const extensions = [
    StarterKit,
    ...(showTable
      ? [
          Table.configure({ resizable: false }),
          TableRow,
          TableHeader,
          TableCell,
        ]
      : []),
  ]

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content:    value || '',
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: [
          'outline-none prose-sm max-w-none text-[#262626]',
          '[&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:my-1 [&_li]:my-0.5',
          showTable ? 'tiptap-with-table' : '',
        ].join(' ').trim(),
      },
    },
  })

  // Sync external value changes (e.g. on section switch)
  useEffect(() => {
    if (!editor) return
    if (editor.getHTML() === value) return
    editor.commands.setContent(value || '')
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {showTable && (
        <style>{`
          .tiptap-with-table table { border-collapse: collapse; width: 100%; margin: 8px 0; }
          .tiptap-with-table th, .tiptap-with-table td { border: 1px solid #DEDEDE; padding: 6px 10px; text-align: left; }
          .tiptap-with-table th { background: #F7F7F7; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #2969FF; }
          .tiptap-with-table td { font-size: 13px; color: #262626; }
          .tiptap-with-table .selectedCell { background: #EEF3FF; }
        `}</style>
      )}
      <div className="overflow-hidden rounded-lg border border-[#DEDEDE] bg-white focus-within:border-[#2969FF]">
        <Toolbar editor={editor} showTable={showTable} />
        <div className="px-3 py-2.5" style={{ minHeight }}>
          {!editor?.getText() && placeholder && !editor?.isFocused && (
            <p
              className="pointer-events-none absolute text-[14px] text-[#969696]"
              aria-hidden="true"
            >
              {placeholder}
            </p>
          )}
          <EditorContent editor={editor} />
        </div>
      </div>
    </>
  )
}
