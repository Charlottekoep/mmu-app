'use client'

import { useRef, useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { getBrowserClient } from '@/lib/supabase'
import type { ImageTextBlock } from '@/components/blocks/BlockTypes'

const label    = 'block text-[11px] font-bold uppercase tracking-widest text-[#2969FF] mb-1.5'
const inputCls = 'w-full rounded-lg border border-[#DEDEDE] bg-white px-3 py-2.5 text-[14px] text-[#262626] placeholder-[#969696] outline-none transition-colors focus:border-[#2969FF]'

// ─── Inline rich-text toolbar ─────────────────────────────────────────────

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> | null }) {
  if (!editor) return null
  const btn = (active: boolean, onClick: () => void, title: string, children: React.ReactNode) => (
    <button
      key={title}
      type="button"
      title={title}
      onClick={onClick}
      className={`flex h-7 min-w-[28px] items-center justify-center rounded px-1.5 text-[12px] font-bold transition-colors ${
        active ? 'bg-[#2969FF]/15 text-[#2969FF]' : 'text-[#969696] hover:bg-[#F7F7F7] hover:text-[#262626]'
      }`}
    >
      {children}
    </button>
  )
  return (
    <div className="flex items-center gap-0.5 border-b border-[#DEDEDE] px-3 py-2">
      {btn(editor.isActive('bold'),        () => editor.chain().focus().toggleBold().run(),        'Bold',          'B')}
      {btn(editor.isActive('italic'),      () => editor.chain().focus().toggleItalic().run(),      'Italic',        <em>I</em>)}
      <div className="mx-1.5 h-4 w-px bg-[#DEDEDE]" />
      {btn(editor.isActive('bulletList'),  () => editor.chain().focus().toggleBulletList().run(),  'Bullet list',   '•–')}
      {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), 'Numbered list', '1.')}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────

type Props = {
  block:    ImageTextBlock
  onChange: (block: ImageTextBlock) => void
  folder:   string
}

export default function ImageTextBlockEditor({ block, onChange, folder }: Props) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const path = `${folder}/${Date.now()}-${file.name}`
    const supabase = getBrowserClient()
    const { data } = await supabase.storage.from('session-images').upload(path, file, { upsert: true })
    if (data) {
      const { data: pub } = supabase.storage.from('session-images').getPublicUrl(data.path)
      onChange({ ...block, imageUrl: pub.publicUrl })
    }
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

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
        'data-placeholder': 'Write the text content…',
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
        .image-text-editor .ProseMirror { min-height: 80px; outline: none; }
        .image-text-editor .ProseMirror.is-editor-empty:not(:focus)::before {
          content: attr(data-placeholder); color: #969696; float: left; height: 0; pointer-events: none;
        }
      `}</style>

      <div className="space-y-4">
        {/* Image position toggle */}
        <div>
          <p className={label}>Image position</p>
          <div className="flex gap-2">
            {(['left', 'right'] as const).map((pos) => (
              <button
                key={pos}
                type="button"
                onClick={() => onChange({ ...block, imagePosition: pos })}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-[13px] font-medium transition-colors ${
                  block.imagePosition === pos
                    ? 'border-[#2969FF] bg-[#2969FF]/10 text-[#2969FF]'
                    : 'border-[#DEDEDE] bg-white text-[#969696] hover:border-[#2969FF]/50 hover:text-[#2969FF]'
                }`}
              >
                {pos === 'left' ? (
                  <><span className="inline-block h-5 w-8 rounded bg-current opacity-30" /><span className="inline-block h-5 w-12 rounded bg-current opacity-15" /></>
                ) : (
                  <><span className="inline-block h-5 w-12 rounded bg-current opacity-15" /><span className="inline-block h-5 w-8 rounded bg-current opacity-30" /></>
                )}
                <span className="capitalize">{pos}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Image upload */}
        <div>
          <label className={label}>Image</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={block.imageUrl}
              onChange={(e) => onChange({ ...block, imageUrl: e.target.value })}
              placeholder="https://… or upload"
              className={inputCls}
            />
            <label className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#DEDEDE] bg-white px-3 py-2.5 text-[13px] text-[#969696] transition-colors hover:border-[#2969FF]/50 hover:text-[#2969FF]">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                <path d="M6.5 2v9M2 6.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {uploading ? 'Uploading…' : 'Upload'}
              <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>
          {block.imageUrl && (
            <div className="relative mt-2 overflow-hidden rounded-lg border border-[#DEDEDE] bg-[#F7F7F7]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={block.imageUrl} alt={block.imageAlt} className="w-full h-auto max-h-36 object-contain" />
              <button
                type="button"
                onClick={() => onChange({ ...block, imageUrl: '' })}
                aria-label="Remove image"
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                  <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Alt text */}
        <div>
          <label className={label}>Image alt text</label>
          <input
            type="text"
            value={block.imageAlt}
            onChange={(e) => onChange({ ...block, imageAlt: e.target.value })}
            placeholder="Describe the image…"
            className={inputCls}
          />
        </div>

        {/* Caption */}
        <div>
          <label className={label}>Caption (optional)</label>
          <input
            type="text"
            value={block.caption}
            onChange={(e) => onChange({ ...block, caption: e.target.value })}
            placeholder="Image caption…"
            className={inputCls}
          />
        </div>

        {/* Text content */}
        <div>
          <label className={label}>Text content</label>
          <div className="image-text-editor overflow-hidden rounded-lg border border-[#DEDEDE] bg-white focus-within:border-[#2969FF] transition-colors">
            <Toolbar editor={editor} />
            <div
              className="cursor-text px-3 py-2.5"
              style={{ minHeight: 100 }}
              onClick={() => editor?.commands.focus()}
            >
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
