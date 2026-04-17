'use client'

import { useState, useRef, useEffect } from 'react'
import type { DiagramShape, DiagramArrow, ShapeType, ArrowDir } from '@/components/blocks/BlockTypes'

// ─── Re-export types for convenience ────────────────────────────────────────

export type { DiagramShape, DiagramArrow }

// ─── Constants ──────────────────────────────────────────────────────────────

export const DIAGRAM_CANVAS_W = 700
export const DIAGRAM_CANVAS_H = 440

const PRESET_COLORS: { color: string; label: string }[] = [
  { color: '#2969FF',               label: 'Blue'   },
  { color: '#1FC881',               label: 'Green'  },
  { color: '#C347E2',               label: 'Purple' },
  { color: 'rgba(255,255,255,0.15)', label: 'Ghost'  },
  { color: '#0F1B4A',               label: 'Navy'   },
  { color: '#FFAB00',               label: 'Amber'  },
]

function uid() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}` }
function scx(s: DiagramShape) { return s.x + s.width  / 2 }
function scy(s: DiagramShape) { return s.y + s.height / 2 }

// ─── Connector geometry ──────────────────────────────────────────────────────

type Side = 'top' | 'bottom' | 'left' | 'right'

/**
 * Picks the side of `from` that faces `to` most directly, then
 * returns the midpoint of that side plus its outward unit direction.
 */
function nearestSidePoint(from: DiagramShape, to: DiagramShape): { x: number; y: number; dx: number; dy: number } {
  const tx = scx(to), ty = scy(to)
  const { x, y, width: w, height: h } = from

  const sides: Record<Side, { x: number; y: number; dx: number; dy: number }> = {
    top:    { x: x + w / 2, y,         dx: 0,  dy: -1 },
    bottom: { x: x + w / 2, y: y + h,  dx: 0,  dy:  1 },
    left:   { x,            y: y + h/2, dx: -1, dy:  0 },
    right:  { x: x + w,     y: y + h/2, dx:  1, dy:  0 },
  }

  // For circles use angle-based edge point instead
  if (from.type === 'circle') {
    const cx = scx(from), cy = scy(from)
    const vx = tx - cx, vy = ty - cy
    const angle = Math.atan2(vy, vx)
    const rx = from.width / 2, ry = from.height / 2
    const ex = cx + rx * Math.cos(angle)
    const ey = cy + ry * Math.sin(angle)
    const len = Math.hypot(vx, vy) || 1
    return { x: ex, y: ey, dx: vx / len, dy: vy / len }
  }

  let best: Side = 'right'
  let bestDist = Infinity
  for (const side of Object.keys(sides) as Side[]) {
    const { x: px, y: py } = sides[side]
    const d = Math.hypot(tx - px, ty - py)
    if (d < bestDist) { bestDist = d; best = side }
  }
  return sides[best]
}

/**
 * Computes a smooth cubic-bezier SVG path from `src` to `tgt` connecting
 * the nearest facing sides of each shape.
 * Returns the path string, the curve's midpoint, and endpoint tangent directions
 * so arrowheads can be drawn as plain polygons (no SVG marker API).
 */
function connPath(src: DiagramShape, tgt: DiagramShape) {
  const s = nearestSidePoint(src, tgt)
  const t = nearestSidePoint(tgt, src)

  const dist = Math.hypot(t.x - s.x, t.y - s.y)
  const bend = Math.min(Math.max(dist * 0.45, 40), 150)

  const cp1x = s.x + s.dx * bend
  const cp1y = s.y + s.dy * bend
  const cp2x = t.x + t.dx * bend
  const cp2y = t.y + t.dy * bend

  // Bezier midpoint at t = 0.5 (De Casteljau)
  const mx = 0.125 * s.x + 0.375 * cp1x + 0.375 * cp2x + 0.125 * t.x
  const my = 0.125 * s.y + 0.375 * cp1y + 0.375 * cp2y + 0.125 * t.y

  // Tangent at path end (t=1) = endpoint - last control point
  const endTx = t.x - cp2x, endTy = t.y - cp2y
  const endLen = Math.hypot(endTx, endTy) || 1

  // Tangent at path start (t=0) reversed → points away from curve
  const startTx = s.x - cp1x, startTy = s.y - cp1y
  const startLen = Math.hypot(startTx, startTy) || 1

  return {
    d: `M ${s.x} ${s.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${t.x} ${t.y}`,
    mx, my,
    // For manually-drawn arrowhead at path end (points INTO target)
    endX: t.x,      endY: t.y,
    endDx: endTx / endLen,  endDy: endTy / endLen,
    // For bidirectional arrowhead at path start (points INTO source)
    startX: s.x,    startY: s.y,
    startDx: startTx / startLen, startDy: startTy / startLen,
  }
}

/** Build SVG polygon `points` string for a filled arrowhead triangle. */
function arrowPoints(tipX: number, tipY: number, dx: number, dy: number, size = 12): string {
  // Perpendicular direction
  const px = -dy, py = dx
  const hw = size * 0.42            // half-width of base
  const bx = tipX - dx * size      // base centre
  const by = tipY - dy * size
  return [
    `${tipX},${tipY}`,
    `${bx + px * hw},${by + py * hw}`,
    `${bx - px * hw},${by - py * hw}`,
  ].join(' ')
}

// ─── Props ───────────────────────────────────────────────────────────────────

type Props = {
  shapes:   DiagramShape[]
  arrows:   DiagramArrow[]
  onChange: (shapes: DiagramShape[], arrows: DiagramArrow[]) => void
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DiagramBuilder({ shapes, arrows, onChange }: Props) {
  const [selectedId,  setSelectedId]  = useState<string | null>(null)
  const [editingId,   setEditingId]   = useState<string | null>(null)
  const [editText,    setEditText]    = useState('')
  const [connectMode, setConnectMode] = useState(false)
  const [connectFrom, setConnectFrom] = useState<string | null>(null)
  // Context menu for selected connector: canvas-relative position
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null)

  const canvasRef     = useRef<HTMLDivElement>(null)
  const shapesRef     = useRef(shapes)
  const arrowsRef     = useRef(arrows)
  const onChangeRef   = useRef(onChange)
  const selectedIdRef = useRef(selectedId)
  const editingIdRef  = useRef(editingId)
  const dragRef       = useRef<{
    id: string; startMx: number; startMy: number; origX: number; origY: number
  } | null>(null)

  useEffect(() => { shapesRef.current   = shapes   }, [shapes])
  useEffect(() => { arrowsRef.current   = arrows   }, [arrows])
  useEffect(() => { onChangeRef.current = onChange }, [onChange])
  useEffect(() => { selectedIdRef.current = selectedId }, [selectedId])
  useEffect(() => { editingIdRef.current  = editingId  }, [editingId])

  // ── Drag ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragRef.current) return
      const { id, startMx, startMy, origX, origY } = dragRef.current
      const s = shapesRef.current
      const shape = s.find(sh => sh.id === id)
      if (!shape) return
      const dx   = e.clientX - startMx
      const dy   = e.clientY - startMy
      const newX = Math.max(0, Math.min(DIAGRAM_CANVAS_W - shape.width,  origX + dx))
      const newY = Math.max(0, Math.min(DIAGRAM_CANVAS_H - shape.height, origY + dy))
      onChangeRef.current(
        s.map(sh => sh.id === id ? { ...sh, x: newX, y: newY } : sh),
        arrowsRef.current,
      )
    }
    function onMouseUp() { dragRef.current = null }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',   onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup',   onMouseUp)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keyboard ──────────────────────────────────────────────────────────────

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') return

      if (e.key === 'Escape') {
        setConnectMode(false); setConnectFrom(null)
        setSelectedId(null); setEditingId(null); setCtxMenu(null)
        return
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selId = selectedIdRef.current
        if (!selId) return
        setCtxMenu(null)
        const s = shapesRef.current
        const a = arrowsRef.current
        if (s.some(sh => sh.id === selId)) {
          onChangeRef.current(
            s.filter(sh => sh.id !== selId),
            a.filter(ar => ar.fromId !== selId && ar.toId !== selId),
          )
        } else if (a.some(ar => ar.id === selId)) {
          onChangeRef.current(s, a.filter(ar => ar.id !== selId))
        }
        setSelectedId(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mutations ─────────────────────────────────────────────────────────────

  function addShape(type: ShapeType) {
    const w = type === 'circle' ? 90 : 130
    const h = type === 'circle' ? 90 : 64
    const shape: DiagramShape = {
      id: uid(), type,
      x: (DIAGRAM_CANVAS_W - w) / 2,
      y: (DIAGRAM_CANVAS_H - h) / 2,
      width: w, height: h,
      text: '', fill: '#2969FF',
    }
    onChange([...shapes, shape], arrows)
    setSelectedId(shape.id)
    setConnectMode(false); setConnectFrom(null)
  }

  function updateShape(id: string, patch: Partial<DiagramShape>) {
    onChange(shapes.map(s => s.id === id ? { ...s, ...patch } : s), arrows)
  }

  function deleteSelected() {
    if (!selectedId) return
    setCtxMenu(null)
    if (shapes.some(s => s.id === selectedId)) {
      onChange(
        shapes.filter(s => s.id !== selectedId),
        arrows.filter(a => a.fromId !== selectedId && a.toId !== selectedId),
      )
    } else if (arrows.some(a => a.id === selectedId)) {
      onChange(shapes, arrows.filter(a => a.id !== selectedId))
    }
    setSelectedId(null)
  }

  function toggleArrowDir() {
    const arrow = arrows.find(a => a.id === selectedId)
    if (!arrow) return
    const next: ArrowDir = arrow.direction === 'one_way' ? 'two_way' : 'one_way'
    onChange(shapes, arrows.map(a => a.id === selectedId ? { ...a, direction: next } : a))
  }

  function flipArrowDir() {
    const arrow = arrows.find(a => a.id === selectedId)
    if (!arrow) return
    onChange(shapes, arrows.map(a => a.id === selectedId ? { ...a, fromId: a.toId, toId: a.fromId } : a))
    setCtxMenu(null)
  }

  function commitEdit() {
    if (editingId) { updateShape(editingId, { text: editText }); setEditingId(null) }
  }

  // ── Connect mode ──────────────────────────────────────────────────────────

  function handleShapeClickInConnect(shapeId: string) {
    if (!connectFrom) { setConnectFrom(shapeId); return }
    if (connectFrom === shapeId) { setConnectFrom(null); return }
    const exists = arrows.some(
      a => (a.fromId === connectFrom && a.toId === shapeId) ||
           (a.fromId === shapeId     && a.toId === connectFrom),
    )
    if (!exists) {
      const arrow: DiagramArrow = { id: uid(), fromId: connectFrom, toId: shapeId, direction: 'one_way' }
      onChange(shapes, [...arrows, arrow])
      setSelectedId(arrow.id)
    }
    setConnectFrom(null)
    setConnectMode(false)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const selectedShape = shapes.find(s => s.id === selectedId)
  const selectedArrow = arrows.find(a => a.id === selectedId)

  return (
    <div className="rounded-xl border border-[#DEDEDE] overflow-hidden bg-white">

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[#DEDEDE] bg-[#F7F7F7] px-3 py-2">

        {/* Add shapes */}
        <button type="button" onClick={() => addShape('rect')}
          className="flex h-7 items-center gap-1.5 rounded-lg border border-[#DEDEDE] bg-white px-2.5 text-[11px] font-semibold text-[#262626] hover:bg-[#F0F0F0] transition-colors">
          <span style={{ display: 'inline-block', width: 11, height: 9, border: '1.5px solid currentColor' }} />
          Box
        </button>
        <button type="button" onClick={() => addShape('rounded_rect')}
          className="flex h-7 items-center gap-1.5 rounded-lg border border-[#DEDEDE] bg-white px-2.5 text-[11px] font-semibold text-[#262626] hover:bg-[#F0F0F0] transition-colors">
          <span style={{ display: 'inline-block', width: 12, height: 9, border: '1.5px solid currentColor', borderRadius: 3 }} />
          Card
        </button>
        <button type="button" onClick={() => addShape('circle')}
          className="flex h-7 items-center gap-1.5 rounded-lg border border-[#DEDEDE] bg-white px-2.5 text-[11px] font-semibold text-[#262626] hover:bg-[#F0F0F0] transition-colors">
          <span style={{ display: 'inline-block', width: 11, height: 11, border: '1.5px solid currentColor', borderRadius: '50%' }} />
          Circle
        </button>

        <div className="h-4 w-px bg-[#DEDEDE]" />

        {/* Connect mode */}
        <button
          type="button"
          onClick={() => { setConnectMode(m => !m); setConnectFrom(null) }}
          className={`flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold transition-colors ${
            connectMode
              ? 'border-[#2969FF] bg-[#2969FF]/10 text-[#2969FF]'
              : 'border-[#DEDEDE] bg-white text-[#262626] hover:bg-[#F0F0F0]'
          }`}
        >
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden>
            <circle cx="1.5" cy="5" r="1.5" fill="currentColor"/>
            <circle cx="12.5" cy="5" r="1.5" fill="currentColor"/>
            <path d="M3 5h7.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M9 3l2 2-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {connectMode
            ? (connectFrom ? 'Click target…' : 'Click source…')
            : 'Connect'}
        </button>

        {/* Selected shape — color picker */}
        {selectedShape && (
          <>
            <div className="h-4 w-px bg-[#DEDEDE]" />
            <div className="flex items-center gap-1" title="Shape colour">
              {PRESET_COLORS.map(({ color, label }) => (
                <button
                  key={color}
                  type="button"
                  title={label}
                  onClick={() => updateShape(selectedShape.id, { fill: color })}
                  className="h-5 w-5 rounded-full border-2 transition-transform hover:scale-110 active:scale-95"
                  style={{
                    background:  color,
                    borderColor: selectedShape.fill === color ? '#262626' : 'rgba(0,0,0,0.10)',
                  }}
                />
              ))}
            </div>
          </>
        )}

        {/* Selected connector — direction controls */}
        {selectedArrow && (
          <>
            <div className="h-4 w-px bg-[#DEDEDE]" />
            <button type="button" onClick={flipArrowDir}
              className="flex h-7 items-center gap-1 rounded-lg border border-[#DEDEDE] bg-white px-2.5 text-[11px] font-semibold text-[#262626] hover:bg-[#F0F0F0] transition-colors"
              title="Flip direction">
              ⇄ Flip
            </button>
            <button type="button" onClick={toggleArrowDir}
              className="flex h-7 items-center gap-1 rounded-lg border border-[#DEDEDE] bg-white px-2.5 text-[11px] font-semibold text-[#262626] hover:bg-[#F0F0F0] transition-colors">
              {selectedArrow.direction === 'one_way' ? '→ One-way' : '↔ Two-way'}
            </button>
          </>
        )}

        {/* Delete selected */}
        {selectedId && (
          <>
            <div className="h-4 w-px bg-[#DEDEDE]" />
            <button type="button" onClick={deleteSelected}
              className="flex h-7 items-center gap-1 rounded-lg border border-[#D50000]/30 bg-white px-2.5 text-[11px] font-semibold text-[#D50000] hover:bg-[#D50000]/10 transition-colors">
              <svg width="10" height="11" viewBox="0 0 11 12" fill="none" aria-hidden>
                <path d="M1 3h9M4 3V2h3v1M2 3l.7 7.3a.5.5 0 00.5.7h4.6a.5.5 0 00.5-.7L9 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Delete
            </button>
          </>
        )}

        {/* Hint when empty */}
        {shapes.length === 0 && (
          <p className="ml-auto text-[11px] text-[#C8C8C8]">Add shapes · double-click to edit text</p>
        )}
      </div>

      {/* ── Canvas ──────────────────────────────────────────────────────────── */}
      <div style={{ overflowX: 'auto' }}>
        <div
          ref={canvasRef}
          style={{
            position: 'relative',
            width:    DIAGRAM_CANVAS_W,
            height:   DIAGRAM_CANVAS_H,
            background: '#EEF2FF',
            flexShrink: 0,
          }}
          onClick={() => {
            if (!connectMode) setSelectedId(null)
            setCtxMenu(null)
            if (editingId) commitEdit()
          }}
        >
          {/* Dot grid */}
          <svg
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
            width={DIAGRAM_CANVAS_W}
            height={DIAGRAM_CANVAS_H}
            aria-hidden="true"
          >
            <defs>
              <pattern id="diag-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="12" cy="12" r="1" fill="rgba(41,105,255,0.14)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#diag-grid)" />
          </svg>

          {/* ── Connector SVG overlay ────────────────────────────────────── */}
          {/* No <defs>/<marker> — arrowheads are plain <polygon> elements   */}
          <svg
            style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
            width={DIAGRAM_CANVAS_W}
            height={DIAGRAM_CANVAS_H}
            aria-hidden="true"
          >
            {arrows.map(arrow => {
              const from = shapes.find(s => s.id === arrow.fromId)
              const to   = shapes.find(s => s.id === arrow.toId)
              if (!from || !to) return null

              const info  = connPath(from, to)
              const isSel = selectedId === arrow.id
              const color = isSel ? '#2969FF' : '#555555'

              return (
                <g key={arrow.id}>
                  {/* Wide invisible hit-area (re-enables pointer events just for this element) */}
                  <path
                    d={info.d}
                    stroke="transparent"
                    strokeWidth={16}
                    fill="none"
                    style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                    onClick={(e) => { e.stopPropagation(); setSelectedId(arrow.id); setCtxMenu(null) }}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setSelectedId(arrow.id)
                      const rect = canvasRef.current?.getBoundingClientRect()
                      if (rect) setCtxMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top })
                    }}
                  />

                  {/* Visible bezier path */}
                  <path
                    d={info.d}
                    stroke={color}
                    strokeWidth={isSel ? 2.5 : 2}
                    fill="none"
                  />

                  {/* ── Arrowhead at path END (solid filled triangle) ── */}
                  <polygon
                    points={arrowPoints(info.endX, info.endY, info.endDx, info.endDy)}
                    fill={color}
                  />

                  {/* ── Arrowhead at path START for two-way connectors ── */}
                  {arrow.direction === 'two_way' && (
                    <polygon
                      points={arrowPoints(info.startX, info.startY, info.startDx, info.startDy)}
                      fill={color}
                    />
                  )}

                  {/* ── Midpoint delete button when selected ── */}
                  {isSel && (
                    <g
                      transform={`translate(${info.mx}, ${info.my})`}
                      style={{ pointerEvents: 'all', cursor: 'pointer' }}
                      onClick={(e) => { e.stopPropagation(); deleteSelected() }}
                    >
                      <circle r="9" fill="white" stroke="#2969FF" strokeWidth="1.5" />
                      <line x1="-3.5" y1="-3.5" x2="3.5"  y2="3.5"  stroke="#D50000" strokeWidth="1.6" strokeLinecap="round" />
                      <line x1="3.5"  y1="-3.5" x2="-3.5" y2="3.5"  stroke="#D50000" strokeWidth="1.6" strokeLinecap="round" />
                    </g>
                  )}
                </g>
              )
            })}
          </svg>

          {/* ── Shapes ──────────────────────────────────────────────────── */}
          {shapes.map(shape => {
            const isSel     = selectedId  === shape.id
            const isConnSrc = connectFrom === shape.id
            const isEditing = editingId   === shape.id

            const borderCol = isConnSrc ? '#FFAB00' : isSel ? '#2969FF' : 'rgba(255,255,255,0.35)'
            const shadowVal = (isSel || isConnSrc)
              ? `0 0 0 2.5px ${isConnSrc ? '#FFAB0050' : '#2969FF40'}, 0 4px 14px rgba(0,0,0,0.18)`
              : '0 2px 6px rgba(0,0,0,0.12)'

            const shapeStyle: React.CSSProperties = {
              position:      'absolute',
              left:           shape.x,
              top:            shape.y,
              width:          shape.width,
              height:         shape.height,
              background:     shape.fill,
              border:         `1.5px solid ${borderCol}`,
              boxShadow:      shadowVal,
              cursor:         connectMode ? 'crosshair' : 'grab',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              userSelect:     'none',
              boxSizing:      'border-box',
              transition:     'box-shadow 0.12s',
              zIndex:         1,
              ...(shape.type === 'rounded_rect' ? { borderRadius: '12px' } : {}),
              ...(shape.type === 'circle'       ? { borderRadius: '50%'  } : {}),
            }

            return (
              <div
                key={shape.id}
                style={shapeStyle}
                onMouseDown={(e) => {
                  if (connectMode || isEditing) return
                  e.preventDefault()
                  e.stopPropagation()
                  dragRef.current = {
                    id: shape.id,
                    startMx: e.clientX, startMy: e.clientY,
                    origX: shape.x,     origY: shape.y,
                  }
                  setSelectedId(shape.id)
                  setCtxMenu(null)
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  if (connectMode) { handleShapeClickInConnect(shape.id); return }
                  setSelectedId(shape.id)
                  setCtxMenu(null)
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  if (connectMode) return
                  setEditingId(shape.id)
                  setEditText(shape.text)
                }}
              >
                {isEditing ? (
                  <input
                    autoFocus
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
                      if (e.key === 'Escape') { setEditingId(null) }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      background: 'transparent', border: 'none', outline: 'none',
                      color: '#fff', fontWeight: 700, fontSize: '13px',
                      textAlign: 'center', width: '88%', caretColor: '#fff',
                    }}
                  />
                ) : (
                  <span
                    style={{
                      color: '#fff', fontWeight: 700, fontSize: '13px',
                      textAlign: 'center', padding: '4px 8px',
                      wordBreak: 'break-word', pointerEvents: 'none', lineHeight: 1.35,
                    }}
                  >
                    {shape.text || <span style={{ opacity: 0.4 }}>double-click</span>}
                  </span>
                )}
              </div>
            )
          })}

          {/* ── Connector right-click context menu ──────────────────────── */}
          {ctxMenu && selectedArrow && (
            <div
              style={{
                position:  'absolute',
                left:      ctxMenu.x,
                top:       ctxMenu.y,
                zIndex:    30,
                minWidth:  140,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="rounded-lg border border-[#DEDEDE] bg-white shadow-lg overflow-hidden text-[12px]">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[#262626] hover:bg-[#F7F7F7] transition-colors"
                  onClick={flipArrowDir}
                >
                  <span className="text-[14px]">⇄</span> Flip direction
                </button>
                <div className="border-t border-[#EFEFEF]" />
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[#262626] hover:bg-[#F7F7F7] transition-colors"
                  onClick={() => { toggleArrowDir(); setCtxMenu(null) }}
                >
                  <span className="text-[14px]">{selectedArrow.direction === 'one_way' ? '↔' : '→'}</span>
                  {selectedArrow.direction === 'one_way' ? 'Make bidirectional' : 'Make one-way'}
                </button>
                <div className="border-t border-[#EFEFEF]" />
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[#D50000] hover:bg-[#FFF0F0] transition-colors"
                  onClick={deleteSelected}
                >
                  <svg width="10" height="11" viewBox="0 0 11 12" fill="none" aria-hidden>
                    <path d="M1 3h9M4 3V2h3v1M2 3l.7 7.3a.5.5 0 00.5.7h4.6a.5.5 0 00.5-.7L9 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                  Delete connector
                </button>
              </div>
            </div>
          )}

          {/* ── Connect-mode hint banner ─────────────────────────────────── */}
          {connectMode && (
            <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
              <div className="rounded-full bg-[#262626]/85 px-4 py-1.5 text-[11px] text-white whitespace-nowrap">
                {connectFrom ? 'Now click the target shape' : 'Click the source shape'} ·{' '}
                <kbd className="opacity-50">Esc</kbd> to cancel
              </div>
            </div>
          )}

          {/* ── Empty state ───────────────────────────────────────────────── */}
          {shapes.length === 0 && !connectMode && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p className="text-[13px] text-[#969696]">Use the toolbar to add shapes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
