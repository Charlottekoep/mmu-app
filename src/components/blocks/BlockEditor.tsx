'use client'

import { useRef, useState } from 'react'
import type { DeepDiveContent, Block, BlockType, RowBlock } from '@/components/blocks/BlockTypes'
import { BLOCK_LIBRARY, createBlock } from '@/components/blocks/BlockTypes'
import BlockEditorItem from '@/components/blocks/BlockEditorItem'
import { BlockEditorSwitch } from '@/components/blocks/BlockEditorItem'

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

// ─── Column block item (lightweight item for inside row columns) ───────────

function ColumnBlockItem({
  block,
  folder,
  isFirst,
  isLast,
  onChange,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  block:      Block
  folder:     string
  isFirst:    boolean
  isLast:     boolean
  onChange:   (b: Block) => void
  onMoveUp:   () => void
  onMoveDown: () => void
  onDelete:   () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const entry = BLOCK_LIBRARY.find((e) => e.type === block.type)

  return (
    <div className="group rounded-lg border border-[#E2E2E2] bg-white overflow-hidden">
      {/* Header */}
      <div className="flex h-8 items-center justify-between border-b border-[#F0F0F0] px-2">
        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#969696]">
          <span className="text-[11px]">{entry?.icon ?? '□'}</span>
          {entry?.label ?? block.type}
        </span>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {confirmDelete ? (
            <>
              <button type="button" onClick={onDelete}
                className="flex h-5 items-center rounded px-1.5 text-[10px] font-bold text-[#D50000] hover:bg-[#D50000]/10 transition-colors">
                Delete
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)}
                className="flex h-5 items-center rounded px-1.5 text-[10px] text-[#969696] hover:bg-[#F0F0F0] transition-colors">
                Cancel
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={onMoveUp} disabled={isFirst} title="Move up"
                className="flex h-5 w-5 items-center justify-center rounded text-[#969696] transition-colors disabled:opacity-30 hover:bg-[#F0F0F0] hover:text-[#262626]">
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <path d="M5 8V2M2 5l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button type="button" onClick={onMoveDown} disabled={isLast} title="Move down"
                className="flex h-5 w-5 items-center justify-center rounded text-[#969696] transition-colors disabled:opacity-30 hover:bg-[#F0F0F0] hover:text-[#262626]">
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <path d="M5 2v6M2 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div className="mx-0.5 h-3 w-px bg-[#E2E2E2]" />
              <button type="button" onClick={() => setConfirmDelete(true)} title="Delete"
                className="flex h-5 w-5 items-center justify-center rounded text-[#D50000]/50 transition-colors hover:bg-[#D50000]/10 hover:text-[#D50000]">
                <svg width="9" height="10" viewBox="0 0 11 12" fill="none" aria-hidden="true">
                  <path d="M1 3h9M4 3V2h3v1M2 3l.7 7.3a.5.5 0 00.5.7h4.6a.5.5 0 00.5-.7L9 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
      {/* Editor */}
      <div className="p-3">
        <BlockEditorSwitch block={block} onChange={onChange} folder={folder} />
      </div>
    </div>
  )
}

// ─── Row block editor ─────────────────────────────────────────────────────

function RowBlockEditor({
  block,
  folder,
  isFirst,
  isLast,
  dragState,
  onChange,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  onMoveFromCanvas,
}: {
  block:            RowBlock
  folder:           string
  isFirst:          boolean
  isLast:           boolean
  dragState:        React.MutableRefObject<DragState | null>
  onChange:         (b: RowBlock) => void
  onMoveUp:         () => void
  onMoveDown:       () => void
  onDuplicate:      () => void
  onDelete:         () => void
  onMoveFromCanvas: (blockId: string, colIdx: number) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [dragOverCol,   setDragOverCol]   = useState<number | null>(null)

  // ── Column mutations ────────────────────────────────────────────────────

  function setColumn(colIdx: number, blocks: Block[]) {
    onChange({ ...block, columns: block.columns.map((c, i) => i === colIdx ? blocks : c) })
  }

  function moveInColumn(colIdx: number, idx: number, dir: 'up' | 'down') {
    const col  = [...block.columns[colIdx]]
    const swap = dir === 'up' ? idx - 1 : idx + 1
    if (swap < 0 || swap >= col.length) return
    ;[col[idx], col[swap]] = [col[swap], col[idx]]
    setColumn(colIdx, col)
  }

  function updateInColumn(colIdx: number, idx: number, updated: Block) {
    setColumn(colIdx, block.columns[colIdx].map((b, i) => i === idx ? updated : b))
  }

  function deleteFromColumn(colIdx: number, idx: number) {
    setColumn(colIdx, block.columns[colIdx].filter((_, i) => i !== idx))
  }

  // ── Column count ────────────────────────────────────────────────────────

  function addColumn() {
    if (block.columns.length >= 3) return
    onChange({ ...block, columns: [...block.columns, []] })
  }

  function removeColumn() {
    if (block.columns.length <= 2) return
    // Append orphaned blocks from the last column to the second-to-last
    const last   = block.columns[block.columns.length - 1]
    const prev   = block.columns[block.columns.length - 2]
    const merged = [...block.columns.slice(0, -2), [...prev, ...last]]
    onChange({ ...block, columns: merged })
  }

  // ── Column drag-and-drop ────────────────────────────────────────────────

  function handleColDragOver(e: React.DragEvent, colIdx: number) {
    e.preventDefault()
    e.stopPropagation()
    setDragOverCol(colIdx)
  }

  function handleColDragLeave(e: React.DragEvent) {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node | null)) {
      setDragOverCol(null)
    }
  }

  function handleColDrop(e: React.DragEvent, colIdx: number) {
    e.preventDefault()
    e.stopPropagation()
    setDragOverCol(null)
    const state = dragState.current
    dragState.current = null
    if (!state) return

    if (state.kind === 'library') {
      const newBlock = createBlock(state.blockType)
      setColumn(colIdx, [...block.columns[colIdx], newBlock])
    } else if (state.kind === 'reorder') {
      onMoveFromCanvas(state.blockId, colIdx)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="group rounded-xl border border-[#E2E2E2] bg-[#F8F9FB] hover:border-[#CBCBCB] transition-colors">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex h-9 items-center justify-between border-b border-[#EFEFEF] px-2">
        <span className="flex items-center gap-1.5 rounded-md bg-[#EFEFEF] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#5A5A5A]">
          ▥ Row Layout · {block.columns.length} cols
        </span>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Column count controls */}
          {block.columns.length < 3 && (
            <button type="button" onClick={addColumn} title="Add column"
              className="flex h-6 items-center rounded px-1.5 text-[11px] font-semibold text-[#2969FF] hover:bg-[#2969FF]/10 transition-colors">
              + col
            </button>
          )}
          {block.columns.length > 2 && (
            <button type="button" onClick={removeColumn} title="Remove last column"
              className="flex h-6 items-center rounded px-1.5 text-[11px] font-semibold text-[#969696] hover:bg-[#F0F0F0] transition-colors">
              − col
            </button>
          )}

          <div className="mx-0.5 h-3.5 w-px bg-[#E2E2E2]" />

          {/* Move up / down */}
          <button type="button" onClick={onMoveUp} disabled={isFirst} title="Move up"
            className="flex h-6 w-6 items-center justify-center rounded text-[#969696] transition-colors disabled:opacity-30 hover:bg-[#F0F0F0] hover:text-[#262626]">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M5 8V2M2 5l3-3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button type="button" onClick={onMoveDown} disabled={isLast} title="Move down"
            className="flex h-6 w-6 items-center justify-center rounded text-[#969696] transition-colors disabled:opacity-30 hover:bg-[#F0F0F0] hover:text-[#262626]">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M5 2v6M2 5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div className="mx-0.5 h-3.5 w-px bg-[#E2E2E2]" />

          {/* Duplicate */}
          <button type="button" onClick={onDuplicate} title="Duplicate"
            className="flex h-6 w-6 items-center justify-center rounded text-[#969696] transition-colors hover:bg-[#F0F0F0] hover:text-[#262626]">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
              <rect x="3.5" y="0.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M1.5 3.5H1a.5.5 0 00-.5.5v6A.5.5 0 001 10.5h6a.5.5 0 00.5-.5v-.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Delete */}
          {confirmDelete ? (
            <>
              <button type="button" onClick={onDelete}
                className="flex h-6 items-center rounded px-1.5 text-[11px] font-bold text-[#D50000] hover:bg-[#D50000]/10 transition-colors">
                Delete
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)}
                className="flex h-6 items-center rounded px-1.5 text-[11px] text-[#969696] hover:bg-[#F0F0F0] transition-colors">
                Cancel
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} title="Delete row"
              className="flex h-6 w-6 items-center justify-center rounded text-[#D50000]/50 transition-colors hover:bg-[#D50000]/10 hover:text-[#D50000]">
              <svg width="11" height="12" viewBox="0 0 11 12" fill="none" aria-hidden="true">
                <path d="M1 3h9M4 3V2h3v1M2 3l.7 7.3a.5.5 0 00.5.7h4.6a.5.5 0 00.5-.7L9 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Columns ─────────────────────────────────────────────── */}
      <div className="flex gap-2 p-3">
        {block.columns.map((col, colIdx) => (
          <div
            key={colIdx}
            className={`relative flex-1 min-h-[80px] min-w-0 rounded-lg border-2 border-dashed p-2 transition-colors ${
              dragOverCol === colIdx
                ? 'border-[#2969FF] bg-[#2969FF]/[0.04]'
                : 'border-[#DEDEDE] bg-white/60'
            }`}
            onDragOver={(e) => handleColDragOver(e, colIdx)}
            onDragLeave={handleColDragLeave}
            onDrop={(e) => handleColDrop(e, colIdx)}
          >
            {col.length === 0 ? (
              <div className="flex min-h-[64px] items-center justify-center">
                <p className="select-none text-[11px] text-[#C8C8C8]">
                  Drop a block here
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {col.map((colBlock, blockIdx) => (
                  <ColumnBlockItem
                    key={colBlock.id}
                    block={colBlock}
                    folder={folder}
                    isFirst={blockIdx === 0}
                    isLast={blockIdx === col.length - 1}
                    onChange={(b) => updateInColumn(colIdx, blockIdx, b)}
                    onMoveUp={() => moveInColumn(colIdx, blockIdx, 'up')}
                    onMoveDown={() => moveInColumn(colIdx, blockIdx, 'down')}
                    onDelete={() => deleteFromColumn(colIdx, blockIdx)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────

export default function BlockEditor({ content, onChange, folder }: Props) {
  const [sidebarOpen,  setSidebarOpen]  = useState(true)
  const [dragOverId,   setDragOverId]   = useState<string | null>(null)
  const [dragOverPos,  setDragOverPos]  = useState<'before' | 'after'>('after')
  const [draggingId,   setDraggingId]   = useState<string | null>(null)

  // Shared drag payload ref — avoids parsing dataTransfer strings
  const dragState = useRef<DragState | null>(null)

  // ── Block mutations ───────────────────────────────────────────────────

  function updateBlock(id: string, block: Block) {
    onChange({ ...content, blocks: content.blocks.map((b) => b.id === id ? block : b) })
  }

  function addBlock(type: BlockType, atIndex?: number) {
    const newBlock = createBlock(type)
    const next = [...content.blocks]
    if (atIndex !== undefined) next.splice(atIndex, 0, newBlock)
    else next.push(newBlock)
    onChange({ ...content, blocks: next })
  }

  function moveBlock(id: string, direction: 'up' | 'down') {
    const idx = content.blocks.findIndex((b) => b.id === id)
    if (direction === 'up'   && idx === 0)                         return
    if (direction === 'down' && idx === content.blocks.length - 1) return
    const next = [...content.blocks]
    const swap = direction === 'up' ? idx - 1 : idx + 1
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
    if (toIdx === -1) blocks.push(moved)
    else blocks.splice(pos === 'before' ? toIdx : toIdx + 1, 0, moved)
    onChange({ ...content, blocks })
  }

  // Move a canvas-level block into a row column (removes from canvas, adds to column)
  function moveBlockToRowColumn(blockId: string, rowId: string, colIdx: number) {
    const movedBlock = content.blocks.find((b) => b.id === blockId)
    if (!movedBlock) return
    onChange({
      ...content,
      blocks: content.blocks
        .filter((b) => b.id !== blockId)
        .map((b) => {
          if (b.type !== 'row' || b.id !== rowId) return b
          return {
            ...b,
            columns: b.columns.map((col, i) =>
              i === colIdx ? [...col, movedBlock] : col
            ),
          }
        }),
    })
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
    <div className="flex items-start">

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside
        className="sticky top-4 self-start flex-shrink-0 flex flex-col border-r border-[#E2E2E2] bg-[#FAFAFA] transition-[width] duration-200"
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
                stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Library items */}
        <div className="py-1.5">
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
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border border-[#E2E2E2] bg-white text-[13px] font-bold text-[#2969FF] shadow-sm">
                {entry.icon}
              </span>
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
        className="flex-1"
        onDragOver={handleCanvasDragOver}
        onDrop={handleCanvasDrop}
      >
        {content.blocks.length === 0 ? (
          <EmptyCanvas />
        ) : (
          <div className="space-y-2 p-5">
            {content.blocks.map((block, i) => (
              block.type === 'row' ? (
                <RowBlockEditor
                  key={block.id}
                  block={block}
                  folder={folder}
                  isFirst={i === 0}
                  isLast={i === content.blocks.length - 1}
                  dragState={dragState}
                  onChange={(b) => updateBlock(block.id, b)}
                  onMoveUp={() => moveBlock(block.id, 'up')}
                  onMoveDown={() => moveBlock(block.id, 'down')}
                  onDuplicate={() => duplicateBlock(block.id)}
                  onDelete={() => deleteBlock(block.id)}
                  onMoveFromCanvas={(blockId, colIdx) => moveBlockToRowColumn(blockId, block.id, colIdx)}
                />
              ) : (
                <BlockEditorItem
                  key={block.id}
                  block={block}
                  folder={folder}
                  isFirst={i === 0}
                  isLast={i === content.blocks.length - 1}
                  isDragOver={dragOverId === block.id}
                  dragOverPos={dragOverId === block.id ? dragOverPos : 'after'}
                  isDragging={draggingId === block.id}
                  onChange={(b)    => updateBlock(block.id, b)}
                  onMoveUp={()    => moveBlock(block.id, 'up')}
                  onMoveDown={()  => moveBlock(block.id, 'down')}
                  onDuplicate={() => duplicateBlock(block.id)}
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
                  onDragLeave={() => {
                    if (dragOverId === block.id) setDragOverId(null)
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
                      const idx      = content.blocks.findIndex((b) => b.id === block.id)
                      const insertAt = pos === 'before' ? idx : idx + 1
                      addBlock(state.blockType, insertAt)
                    }
                  }}
                />
              )
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
    <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 p-10 text-center">
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
