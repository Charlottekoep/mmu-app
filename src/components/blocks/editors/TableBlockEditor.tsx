'use client'

import type { TableBlock } from '@/components/blocks/BlockTypes'

const label    = 'block text-[11px] font-bold uppercase tracking-widest text-[#2969FF] mb-1.5'
const inputCls = 'w-full rounded-lg border border-[#DEDEDE] bg-white px-3 py-2.5 text-[14px] text-[#262626] placeholder-[#969696] outline-none transition-colors focus:border-[#2969FF]'

// Shared cell / header input style — borderless, fills the cell
const cellCls = 'w-full bg-transparent px-2 py-1.5 text-[13px] outline-none placeholder-[#CBCBCB]'

type Props = {
  block:    TableBlock
  onChange: (block: TableBlock) => void
}

export default function TableBlockEditor({ block, onChange }: Props) {
  const colCount = block.headers.length

  // ── Helpers ───────────────────────────────────────────────────────────────

  function setHeader(col: number, value: string) {
    const headers = block.headers.map((h, i) => i === col ? value : h)
    onChange({ ...block, headers })
  }

  function setCell(row: number, col: number, value: string) {
    const rows = block.rows.map((r, ri) =>
      ri === row ? r.map((c, ci) => ci === col ? value : c) : r,
    )
    onChange({ ...block, rows })
  }

  function addRow() {
    onChange({ ...block, rows: [...block.rows, Array(colCount).fill('')] })
  }

  function removeRow(row: number) {
    if (block.rows.length <= 1) return
    onChange({ ...block, rows: block.rows.filter((_, i) => i !== row) })
  }

  function addColumn() {
    onChange({
      ...block,
      headers: [...block.headers, `Column ${colCount + 1}`],
      rows:    block.rows.map((r) => [...r, '']),
    })
  }

  function removeColumn(col: number) {
    if (block.headers.length <= 1) return
    onChange({
      ...block,
      headers: block.headers.filter((_, i) => i !== col),
      rows:    block.rows.map((r) => r.filter((_, i) => i !== col)),
    })
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="flex flex-col">
        <p className={label}>Table content</p>
        <div className="overflow-x-auto rounded-xl border border-[#DEDEDE] bg-white">
          <table className="w-full border-collapse">
            {/* Header row */}
            <thead>
              <tr className="bg-[#F7F7F7]">
                {block.headers.map((header, col) => (
                  <th
                    key={col}
                    className="border-b border-r border-[#DEDEDE] last:border-r-0 text-left"
                  >
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={header}
                        onChange={(e) => setHeader(col, e.target.value)}
                        placeholder={`Col ${col + 1}`}
                        className={`${cellCls} text-[11px] font-bold uppercase tracking-widest text-[#2969FF]`}
                      />
                      {block.headers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeColumn(col)}
                          aria-label="Remove column"
                          title="Remove column"
                          className="flex-shrink-0 pr-2 text-[#CBCBCB] hover:text-red transition-colors"
                        >
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                            <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                {/* Add column */}
                <th className="w-10 border-b border-l border-[#DEDEDE]">
                  <button
                    type="button"
                    onClick={addColumn}
                    aria-label="Add column"
                    title="Add column"
                    className="w-full py-2 text-[#969696] hover:text-[#2969FF] transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="mx-auto" aria-hidden="true">
                      <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </th>
              </tr>
            </thead>

            {/* Body rows */}
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri} className="group border-t border-[#DEDEDE]">
                  {row.map((cell, ci) => (
                    <td key={ci} className="border-r border-[#DEDEDE] last:border-r-0">
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => setCell(ri, ci, e.target.value)}
                        placeholder="—"
                        className={`${cellCls} text-[#262626]`}
                      />
                    </td>
                  ))}
                  {/* Remove row */}
                  <td className="w-10 border-l border-[#DEDEDE]">
                    {block.rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(ri)}
                        aria-label="Remove row"
                        title="Remove row"
                        className="flex w-full items-center justify-center py-2 text-[#CBCBCB] opacity-0 group-hover:opacity-100 hover:text-red transition-all"
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                          <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add row */}
      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-1.5 text-[12px] text-[#2969FF]/60 transition-colors hover:text-[#2969FF]"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Add row
      </button>

      {/* Caption */}
      <div className="flex flex-col">
        <label className={label}>Caption (optional)</label>
        <input
          type="text"
          value={block.caption}
          onChange={(e) => onChange({ ...block, caption: e.target.value })}
          placeholder="Table caption…"
          className={inputCls}
        />
      </div>
    </div>
  )
}
