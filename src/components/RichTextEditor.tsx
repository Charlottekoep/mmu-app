'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'

// ─── Toolbar ──────────────────────────────────────────────────────────────

type ToolbarProps = {
  editor: ReturnType<typeof useEditor> | null
}

function Toolbar({ editor }: ToolbarProps) {
  if (!editor) return null

  const btn = (active: boolean, onClick: () => void, label: string, children: React.ReactNode) => (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded text-[13px] font-bold transition-colors ${
        active
          ? 'bg-primary/20 text-primary'
          : 'text-white/40 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </button>
  )

  return (
    <div className="flex items-center gap-0.5 border-b border-white/10 px-3 py-2">
      {btn(editor.isActive('bold'),   () => editor.chain().focus().toggleBold().run(),           'Bold',           'B')}
      {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(),         'Italic',         <em>I</em>)}
      <div className="mx-1.5 h-4 w-px bg-white/10" />
      {btn(editor.isActive('bulletList'),  () => editor.chain().focus().toggleBulletList().run(),  'Bullet list',    '•–')}
      {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), 'Numbered list',  '1.')}
    </div>
  )
}

// ─── Editor ───────────────────────────────────────────────────────────────

type Props = {
  value:    string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}

export default function RichTextEditor({ value, onChange, placeholder, minHeight = 120 }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content:    value || '',
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'outline-none prose-sm max-w-none text-white/80 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:my-1 [&_li]:my-0.5',
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
    <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] focus-within:border-primary/50">
      <Toolbar editor={editor} />
      <div className="px-3 py-2.5" style={{ minHeight }}>
        {!editor?.getText() && placeholder && !editor?.isFocused && (
          <p
            className="pointer-events-none absolute text-[14px] text-white/20"
            aria-hidden="true"
          >
            {placeholder}
          </p>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
