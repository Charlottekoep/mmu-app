'use client'

import { useRef, useState } from 'react'
import type { DeepDiveContent, Block, BlockType } from '@/components/blocks/BlockTypes'
import { BLOCK_LIBRARY, createBlock } from '@/components/blocks/BlockTypes'
import BlockEditorItem from '@/components/blocks/BlockEditorItem'

// ─── Types ────────────────────────────────────────────────────────────────

type DragState =
  | { kind: 'library';  blockType: BlockType }
  | { kind: 'reorder';  blockId:   string    }

type Props = {
  content:  DeepDiveContent
  onChange: (content: DeepDiveContent) => void
  folder:   string
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

// ─── Component ────────────────────────────────────────────────────────────

export default function BlockEditor({ content, onChange, folder }: Props) {
  const [sidebarOpen,  setSidebarOpen]  = useState(true)
  const [dragOverId,   setDragOverId]   = useState<string | null>(null)
  const [dragOverPos,  setDragOverPos]  = useState<'before' | 'after'>('after')
  const [draggingId,   setDraggingId]   = useState<string | null>(null)

  // Module-level drag payload — avoids parsing dataTransfer strings
  const dragState = useRef<DragState | null>(null)

  // ── Block mutations ───────────────────────────────────────────────────

  function updateBlock(id: string, block: Block) {
    onChange({ ...content, blocks: content.blocks.map((b) => b.id === id ? block : b) })
  }

  function addBlock(type: BlockType, atIndex?: number) {
    const newBlock = createBlock(type)
    const next = [...content.blocks]
    if (atIndex !== undefined) {
      next.splice(atIndex, 0, newBlock)
    } else {
      next.push(newBlock)
    }
    onChange({ ...content, blocks: next })
  }

  function moveBlock(id: string, direction: 'up' | 'down') {
    const idx = content.blocks.findIndex((b) => b.id === id)
    if (direction === 'up'   && idx === 0)                        return
    if (direction === 'down' && idx === content.blocks.length - 1) return
    const next  = [...content.blocks]
    const swap  = direction === 'up' ? idx - 1 : idx + 1
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    onChange({ ...content, blocks: next })
  }

  function duplicateBlock(id: string) {
    const block = content.blocks.find((b) => b.id === id)
    if (!block) return
    const copy = { ...block, id: newId() }
    const idx  = content.blocks.findIndex((b) => b.id === id)
    const next = [...content.blocks]
    next.splice(idx + 1, 0, copy)
    onChange({ ...content, blocks: next })
  }

  function deleteBlock(id: string) {
    onChange({ ...content, blocks: content.blocks.filter((b) => b.id !== id) })
  }

  function reorderBlock(dragId: string, targetId: string, pos: 'before' | 'after') {
    if (dragId === targetId) return
    const blocks  = [...content.blocks]
    const fromIdx = blocks.findIndex((b) => b.id === dragId)
    const [moved] = blocks.splice(fromIdx, 1)
    const toIdx   = blocks.findIndex((b) => b.id === targetId)
    if (toIdx === -1) {
      blocks.push(moved)
    } else {
      blocks.splice(pos === 'before' ? toIdx : toIdx + 1, 0, moved)
    }
    onChange({ ...content, blocks })
  }

  // ── Canvas drop (misses all items → append to end) ────────────────────

  function handleCanvasDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = dragState.current?.kind === 'reorder' ? 'move' : 'copy'
  }

  function handleCanvasDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOverId(null)
    const state = dragState.current
    dragState.current = null
    if (!state || state.kind !== 'library') return
    addBlock(state.blockType)
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full min-h-0 overflow-hidden">

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside
        className="flex flex-shrink-0 flex-col border-r border-[#E2E2E2] bg-[#FAFAFA] transition-[width] duration-200"
        style={{ width: sidebarOpen ? 208 : 48 }}
      >
        {/* Header */}
        <div className={`flex h-10 flex-shrink-0 items-center border-b border-[#E2E2E2] ${sidebarOpen ? 'justify-between px-3' : 'justify-center'}`}>
          {sidebarOpen && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#969696]">
              Blocks
            </span>
          )}
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#969696] transition-colors hover:bg-[#EBEBEB] hover:text-[#262626]"
            title={sidebarOpen ? 'Collapse' : 'Expand block library'}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path
                d={sidebarOpen ? 'M8 2L4 6l4 4' : 'M4 2l4 4-4 4'}
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Library items */}
        <div className="flex-1 overflow-y-auto py-1.5">
          {BLOCK_LIBRARY.map((entry) => (
            <div
              key={entry.type}
              draggable
              onDragStart={(e) => {
                dragState.current = { kind: 'library', blockType: entry.type }
                e.dataTransfer.effectAllowed = 'copy'
              }}
              onDragEnd={() => { dragState.current = null }}
              onClick={() => addBlock(entry.type)}
              title={sidebarOpen ? undefined : `${entry.label}: ${entry.description}`}
              className={`mx-1.5 flex cursor-pointer select-none items-center rounded-lg px-2 py-2 transition-colors hover:bg-[#EBEBEB] active:bg-[#E0E0E0] ${
                sidebarOpen ? 'gap-2.5' : 'justify-center'
              }`}
            >
              {/* Icon */}
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border border-[#E2E2E2] bg-white text-[13px] font-bold text-[#2969FF] shadow-sm">
                {entry.icon}
              </span>

              {/* Label + description */}
              {sidebarOpen && (
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold leading-tight text-[#262626]">
                    {entry.label}
                  </p>
                  <p className="truncate text-[10px] leading-tight text-[#969696]">
                    {entry.description}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* ── Canvas ───────────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto"
        onDragOver={handleCanvasDragOver}
        onDrop={handleCanvasDrop}
      >
        {content.blocks.length === 0 ? (
          <EmptyCanvas />
        ) : (
          <div className="space-y-2 p-5">
            {content.blocks.map((block, i) => (
              <BlockEditorItem
                key={block.id}
                block={block}
                folder={folder}
                isFirst={i === 0}
                isLast={i === content.blocks.length - 1}
                isDragOver={dragOverId === block.id}
                dragOverPos={dragOverId === block.id ? dragOverPos : 'after'}
                isDragging={draggingId === block.id}
                onChange={(b)   => updateBlock(block.id, b)}
                onMoveUp={()    => moveBlock(block.id, 'up')}
                onMoveDown={()  => moveBlock(block.id, 'down')}
                onDuplicate={()  => duplicateBlock(block.id)}
                onDelete={()    => deleteBlock(block.id)}
                onDragStart={() => {
                  dragState.current = { kind: 'reorder', blockId: block.id }
                  setDraggingId(block.id)
                }}
                onDragEnd={() => {
                  dragState.current = null
                  setDraggingId(null)
                  setDragOverId(null)
                }}
                onDragOver={(pos) => {
                  setDragOverId(block.id)
                  setDragOverPos(pos)
                }}
                onDrop={(pos) => {
                  const state = dragState.current
                  setDragOverId(null)
                  dragState.current = null
                  if (!state) return

                  if (state.kind === 'reorder') {
                    reorderBlock(state.blockId, block.id, pos)
                  } else {
                    // Library block dropped onto existing item
                    const idx      = content.blocks.findIndex((b) => b.id === block.id)
                    const insertAt = pos === 'before' ? idx : idx + 1
                    addBlock(state.blockType, insertAt)
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────

function EmptyCanvas() {
  return (
    <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-4 p-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-[#DEDEDE]">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
          <path d="M11 4v14M4 11h14" stroke="#CBCBCB" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <div>
        <p className="text-[15px] font-semibold text-[#969696]">No blocks yet</p>
        <p className="mt-1 max-w-[220px] text-[12px] leading-relaxed text-[#CBCBCB]">
          Drag a block from the sidebar, or click one to add it here
        </p>
      </div>
    </div>
  )
}
