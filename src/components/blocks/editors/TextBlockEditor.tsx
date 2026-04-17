'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'
import type { TextBlock } from '@/components/blocks/BlockTypes'

// ─── Mini toolbar ─────────────────────────────────────────────────────────

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> | null }) {
  if (!editor) return null

  const btn = (active: boolean, onClick: () => void, title: string, children: React.ReactNode) => (
    <button
      key={title}
      type="button"
      title={title}
      onClick={onClick}
      className={`flex h-7 min-w-[28px] items-center justify-center rounded px-1.5 text-[12px] font-bold transition-colors ${
        active
          ? 'bg-[#2969FF]/15 text-[#2969FF]'
          : 'text-[#969696] hover:bg-[#F7F7F7] hover:text-[#262626]'
      }`}
    >
      {children}
    </button>
  )

  return (
    <div className="flex items-center gap-0.5 border-b border-[#DEDEDE] px-3 py-2">
      {btn(editor.isActive('bold'),        () => editor.chain().focus().toggleBold().run(),         'Bold',           'B')}
      {btn(editor.isActive('italic'),      () => editor.chain().focus().toggleItalic().run(),       'Italic',         <em>I</em>)}
      <div className="mx-1.5 h-4 w-px bg-[#DEDEDE]" />
      {btn(editor.isActive('bulletList'),  () => editor.chain().focus().toggleBulletList().run(),   'Bullet list',    '•–')}
      {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(),  'Numbered list',  '1.')}
    </div>
  )
}

// ─── Editor ───────────────────────────────────────────────────────────────

type Props = {
  block:    TextBlock
  onChange: (block: TextBlock) => void
}

export default function TextBlockEditor({ block, onChange }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: block.content || '',
    onUpdate({ editor }) {
      onChange({ ...block, content: editor.getHTML() })
    },
    editorProps: {
      attributes: {
        class: 'outline-none text-[14px] text-[#262626] [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:my-1 [&_li]:my-0.5',
        'data-placeholder': 'Write something…',
      },
    },
  })

  useEffect(() => {
    if (!editor || editor.getHTML() === block.content) return
    editor.commands.setContent(block.content || '')
  }, [block.content]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <style>{`
        .text-block-editor .ProseMirror { min-height: 100px; outline: none; }
        .text-block-editor .ProseMirror.is-editor-empty:not(:focus)::before {
          content: attr(data-placeholder);
          color: #969696;
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
      <div className="text-block-editor overflow-hidden rounded-lg border border-[#DEDEDE] bg-white focus-within:border-[#2969FF] transition-colors">
        <Toolbar editor={editor} />
        <div
          className="cursor-text px-3 py-2.5"
          style={{ minHeight: 120 }}
          onClick={() => editor?.commands.focus()}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    </>
  )
}
