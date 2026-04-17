'use client'

import { useState } from 'react'
import type { Block } from '@/components/blocks/BlockTypes'
import { BLOCK_LIBRARY } from '@/components/blocks/BlockTypes'
import type {
  HeadingBlock, TextBlock, ImageBlock, ImageTextBlock,
  LinkCardBlock, TableBlock, DividerBlock, QuoteBlock, TwoColumnBlock, DiagramBlock,
} from '@/components/blocks/BlockTypes'

import HeadingBlockEditor   from '@/components/blocks/editors/HeadingBlockEditor'
import TextBlockEditor      from '@/components/blocks/editors/TextBlockEditor'
import ImageBlockEditor     from '@/components/blocks/editors/ImageBlockEditor'
import ImageTextBlockEditor from '@/components/blocks/editors/ImageTextBlockEditor'
import LinkCardBlockEditor  from '@/components/blocks/editors/LinkCardBlockEditor'
import TableBlockEditor     from '@/components/blocks/editors/TableBlockEditor'
import DividerBlockEditor   from '@/components/blocks/editors/DividerBlockEditor'
import QuoteBlockEditor     from '@/components/blocks/editors/QuoteBlockEditor'
import TwoColumnBlockEditor from '@/components/blocks/editors/TwoColumnBlockEditor'
import DiagramBlockEditor   from '@/components/blocks/editors/DiagramBlockEditor'

// ─── Editor dispatch ──────────────────────────────────────────────────────

export function BlockEditorSwitch({
  block,
  onChange,
  folder,
}: {
  block:    Block
  onChange: (b: Block) => void
  folder:   string
}) {
  switch (block.type) {
    case 'heading':
      return <HeadingBlockEditor   block={block as HeadingBlock}   onChange={onChange as (b: HeadingBlock)   => void} />
    case 'text':
      return <TextBlockEditor      block={block as TextBlock}      onChange={onChange as (b: TextBlock)      => void} />
    case 'image':
      return <ImageBlockEditor     block={block as ImageBlock}     onChange={onChange as (b: ImageBlock)     => void} folder={folder} />
    case 'image_text':
      return <ImageTextBlockEditor block={block as ImageTextBlock} onChange={onChange as (b: ImageTextBlock) => void} folder={folder} />
    case 'link_card':
      return <LinkCardBlockEditor  block={block as LinkCardBlock}  onChange={onChange as (b: LinkCardBlock)  => void} />
    case 'table':
      return <TableBlockEditor     block={block as TableBlock}     onChange={onChange as (b: TableBlock)     => void} />
    case 'divider':
      return <DividerBlockEditor   block={block as DividerBlock}   onChange={onChange as (b: DividerBlock)   => void} />
    case 'quote':
      return <QuoteBlockEditor     block={block as QuoteBlock}     onChange={onChange as (b: QuoteBlock)     => void} />
    case 'two_column':
      return <TwoColumnBlockEditor block={block as TwoColumnBlock} onChange={onChange as (b: TwoColumnBlock) => void} />
    case 'diagram':
      return <DiagramBlockEditor   block={block as DiagramBlock}   onChange={onChange as (b: DiagramBlock)   => void} />
  }
}

// ─── Icon primitives ──────────────────────────────────────────────────────

function IconBtn({
  onClick,
  title,
  disabled,
  danger,
  children,
}: {
  onClick:  () => void
  title:    string
  disabled?: boolean
  danger?:  boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex h-6 w-6 items-center justify-center rounded transition-colors disabled:opacity-30 disabled:cursor-default ${
        danger
          ? 'text-[#D50000]/60 hover:bg-[#D50000]/10 hover:text-[#D50000]'
          : 'text-[#969696] hover:bg-[#F0F0F0] hover:text-[#262626]'
      }`}
    >
      {children}
    </button>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────

export type BlockEditorItemProps = {
  block:       Block
  folder:      string
  isFirst:     boolean
  isLast:      boolean
  isDragOver:  boolean
  dragOverPos: 'before' | 'after'
  isDragging:  boolean
  onChange:    (block: Block) => void
  onMoveUp:    () => void
  onMoveDown:  () => void
  onDuplicate: () => void
  onDelete:    () => void
  onDragStart: () => void
  onDragEnd:   () => void
  onDragLeave: () => void
  onDragOver:  (pos: 'before' | 'after') => void
  onDrop:      (pos: 'before' | 'after') => void
}

// ─── Component ────────────────────────────────────────────────────────────

export default function BlockEditorItem({
  block,
  folder,
  isFirst,
  isLast,
  isDragOver,
  dragOverPos,
  isDragging,
  onChange,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  onDragStart,
  onDragEnd,
  onDragLeave,
  onDragOver,
  onDrop,
}: BlockEditorItemProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const entry     = BLOCK_LIBRARY.find((e) => e.type === block.type)
  const typeLabel = entry?.label ?? block.type
  const typeIcon  = entry?.icon  ?? '□'

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const pos: 'before' | 'after' = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
    onDragOver(pos)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const pos: 'before' | 'after' = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
    onDrop(pos)
  }

  return (
    <div
      className="relative pt-3"
      style={{ opacity: isDragging ? 0.4 : 1 }}
      draggable
      onDragStart={(e) => {
        // Don't start a drag when the user clicked a button or input inside the card
        if ((e.target as HTMLElement).closest('button, input, textarea, select, a, [contenteditable]')) {
          e.preventDefault()
          return
        }
        e.dataTransfer.effectAllowed = 'move'
        onDragStart()
      }}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={(e) => {
        // Only fire when the pointer truly leaves this item, not when it moves to a child
        if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node | null)) {
          onDragLeave()
        }
      }}
      onDrop={handleDrop}
    >
      {/* Drop indicator — before */}
      {isDragOver && dragOverPos === 'before' && (
        <div className="pointer-events-none absolute -top-px inset-x-0 h-0.5 rounded-full bg-[#2969FF] z-10" />
      )}

      {/* Item card */}
      <div
        className={`relative group rounded-xl border bg-white transition-shadow ${
          isDragOver
            ? 'border-[#2969FF]/40 shadow-[0_0_0_2px_rgba(41,105,255,0.12)]'
            : 'border-[#E2E2E2] hover:border-[#CBCBCB] hover:shadow-sm'
        }`}
      >
        {/* Type pill — tab overlapping top border */}
        <span className="pointer-events-none absolute left-3 -top-[10px] z-10 flex items-center gap-1 rounded-md border border-[#E2E2E2] bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#5A5A5A]">
          <span className="text-[11px]">{typeIcon}</span>
          {typeLabel}
        </span>

        {/* ── Header bar ───────────────────────────────────────── */}
        <div className="flex h-9 items-center justify-between border-b border-[#F0F0F0] px-2">

          {/* Left: drag handle */}
          <div
              className="flex h-6 w-5 cursor-grab items-center justify-center rounded text-[#C8C8C8] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[#969696] active:cursor-grabbing"
              title="Drag to reorder"
            >
              <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden="true">
                <circle cx="2.5" cy="2.5" r="1.2"/><circle cx="7.5" cy="2.5" r="1.2"/>
                <circle cx="2.5" cy="7"   r="1.2"/><circle cx="7.5" cy="7"   r="1.2"/>
                <circle cx="2.5" cy="11.5" r="1.2"/><circle cx="7.5" cy="11.5" r="1.2"/>
              </svg>
            </div>

          {/* Right: action buttons */}
          <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            {confirmDelete ? (
              <>
                <button
                  type="button"
                  onClick={onDelete}
                  className="flex h-6 items-center rounded px-2 text-[11px] font-bold text-[#D50000] hover:bg-[#D50000]/10 transition-colors"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="flex h-6 items-center rounded px-2 text-[11px] font-medium text-[#969696] hover:bg-[#F0F0F0] hover:text-[#262626] transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                {/* Move up */}
                <IconBtn onClick={onMoveUp} title="Move up" disabled={isFirst}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path d="M5 8V2M2 5l3-3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </IconBtn>

                {/* Move down */}
                <IconBtn onClick={onMoveDown} title="Move down" disabled={isLast}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path d="M5 2v6M2 5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </IconBtn>

                <div className="mx-0.5 h-3.5 w-px bg-[#E2E2E2]" />

                {/* Duplicate */}
                <IconBtn onClick={onDuplicate} title="Duplicate">
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
                    <rect x="3.5" y="0.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M1.5 3.5H1a.5.5 0 00-.5.5v6A.5.5 0 001 10.5h6a.5.5 0 00.5-.5v-.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </IconBtn>

                {/* Delete */}
                <IconBtn onClick={() => setConfirmDelete(true)} title="Delete" danger>
                  <svg width="11" height="12" viewBox="0 0 11 12" fill="none" aria-hidden="true">
                    <path d="M1 3h9M4 3V2h3v1M2 3l.7 7.3a.5.5 0 00.5.7h4.6a.5.5 0 00.5-.7L9 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </IconBtn>
              </>
            )}
          </div>
        </div>

        {/* ── Editor content ────────────────────────────────────── */}
        <div className="p-4">
          <BlockEditorSwitch block={block} onChange={onChange} folder={folder} />
        </div>
      </div>

      {/* Drop indicator — after */}
      {isDragOver && dragOverPos === 'after' && (
        <div className="pointer-events-none absolute -bottom-px inset-x-0 h-0.5 rounded-full bg-[#2969FF] z-10" />
      )}
    </div>
  )
}
