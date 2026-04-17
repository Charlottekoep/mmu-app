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

/**
 * Returns the point where the line from the shape centre toward (toX, toY)
 * exits the shape's boundary, plus the outward unit direction at that point.
 */
function shapeEdge(shape: DiagramShape, toX: number, toY: number) {
  const cx = scx(shape), cy = scy(shape)
  const vx = toX - cx,   vy = toY - cy
  if (vx === 0 && vy === 0) return { x: cx, y: cy, dx: 1, dy: 0 }

  if (shape.type === 'circle') {
    // Ellipse parametric: find t where (rx·cos t, ry·sin t) ∥ (vx, vy)
    const rx = shape.width  / 2
    const ry = shape.height / 2
    const t  = Math.atan2(vy * rx, vx * ry)
    const ex = cx + rx * Math.cos(t)
    const ey = cy + ry * Math.sin(t)
    // Outward gradient of x²/rx² + y²/ry² at exit point, normalised
    const nx = Math.cos(t) / rx
    const ny = Math.sin(t) / ry
    const len = Math.hypot(nx, ny) || 1
    return { x: ex, y: ey, dx: nx / len, dy: ny / len }
  }

  // rect / rounded_rect — box intersection
  const hw = shape.width  / 2
  const hh = shape.height / 2
  const sx = vx !== 0 ? hw / Math.abs(vx) : Infinity
  const sy = vy !== 0 ? hh / Math.abs(vy) : Infinity
  const s  = Math.min(sx, sy)
  return {
    x:  cx + vx * s,
    y:  cy + vy * s,
    dx: sx <= sy ? Math.sign(vx) : 0,
    dy: sx  < sy ? 0             : Math.sign(vy),
  }
}

/**
 * Computes a smooth cubic-bezier SVG path between two shapes using their
 * boundary exit points, plus the midpoint of the curve at t = 0.5.
 */
function connPath(src: DiagramShape, tgt: DiagramShape) {
  const s = shapeEdge(src, scx(tgt), scy(tgt))
  const t = shapeEdge(tgt, scx(src), scy(src))

  const dist = Math.hypot(t.x - s.x, t.y - s.y)
  const bend = Math.min(Math.max(dist * 0.45, 30), 130)

  const cp1x = s.x + s.dx * bend
  const cp1y = s.y + s.dy * bend
  const cp2x = t.x + t.dx * bend   // t.dx/dy point FROM target TOWARD source
  const cp2y = t.y + t.dy * bend

  // De Casteljau midpoint at t = 0.5
  const mx = 0.125 * s.x + 0.375 * cp1x + 0.375 * cp2x + 0.125 * t.x
  const my = 0.125 * s.y + 0.375 * cp1y + 0.375 * cp2y + 0.125 * t.y

  return {
    d: `M ${s.x} ${s.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${t.x} ${t.y}`,
    mx, my,
  }
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

  // Stable refs for window listeners (avoid stale closures)
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

  // ── Drag (window listeners, mount-only) ────────────────────────────────────

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

  // ── Keyboard (mount-only) ──────────────────────────────────────────────────

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Don't intercept when typing in inputs
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') return

      if (e.key === 'Escape') {
        setConnectMode(false)
        setConnectFrom(null)
        setSelectedId(null)
        setEditingId(null)
        return
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selId = selectedIdRef.current
        if (!selId) return
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
      text: '',
      fill: '#2969FF',
    }
    onChange([...shapes, shape], arrows)
    setSelectedId(shape.id)
    setConnectMode(false)
    setConnectFrom(null)
  }

  function updateShape(id: string, patch: Partial<DiagramShape>) {
    onChange(shapes.map(s => s.id === id ? { ...s, ...patch } : s), arrows)
  }

  function deleteSelected() {
    if (!selectedId) return
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

  function commitEdit() {
    if (editingId) {
      updateShape(editingId, { text: editText })
      setEditingId(null)
    }
  }

  // ── Connect mode ──────────────────────────────────────────────────────────

  function handleShapeClickInConnect(shapeId: string) {
    if (!connectFrom) {
      setConnectFrom(shapeId)
      return
    }
    if (connectFrom === shapeId) {
      setConnectFrom(null)
      return
    }
    // Avoid duplicates
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

  // ── Arrow hit-test polygon (click on lines) ────────────────────────────────
  // Handled via SVG pointer-events on <line> elements

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
          {/* Arrow icon */}
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
                    background:   color,
                    borderColor:  selectedShape.fill === color ? '#262626' : 'rgba(0,0,0,0.10)',
                  }}
                />
              ))}
            </div>
          </>
        )}

        {/* Selected arrow — direction toggle */}
        {selectedArrow && (
          <>
            <div className="h-4 w-px bg-[#DEDEDE]" />
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
          style={{
            position: 'relative',
            width:    DIAGRAM_CANVAS_W,
            height:   DIAGRAM_CANVAS_H,
            background: '#EEF2FF',
            flexShrink: 0,
          }}
          onClick={() => {
            if (!connectMode) setSelectedId(null)
            if (editingId) commitEdit()
          }}
        >
          {/* Dot grid */}
          <svg
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
            width={DIAGRAM_CANVAS_W}
            height={DIAGRAM_CANVAS_H}
            aria-hidden
          >
            <defs>
              <pattern id="diag-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="12" cy="12" r="1" fill="rgba(41,105,255,0.14)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#diag-grid)" />
          </svg>

          {/* Arrows SVG overlay */}
          <svg
            style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
            width={DIAGRAM_CANVAS_W}
            height={DIAGRAM_CANVAS_H}
            aria-hidden
          >
            <defs>
              {/* Normal arrowheads — dark, visible on light canvas */}
              <marker id="diag-arrow-end" markerWidth="10" markerHeight="8"
                      refX="10" refY="4" orient="auto" markerUnits="userSpaceOnUse">
                <path d="M 0 0 L 10 4 L 0 8 z" fill="#555555" />
              </marker>
              <marker id="diag-arrow-start" markerWidth="10" markerHeight="8"
                      refX="0" refY="4" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
                <path d="M 0 0 L 10 4 L 0 8 z" fill="#555555" />
              </marker>
              {/* Selected arrowheads — blue */}
              <marker id="diag-arrow-end-sel" markerWidth="10" markerHeight="8"
                      refX="10" refY="4" orient="auto" markerUnits="userSpaceOnUse">
                <path d="M 0 0 L 10 4 L 0 8 z" fill="#2969FF" />
              </marker>
              <marker id="diag-arrow-start-sel" markerWidth="10" markerHeight="8"
                      refX="0" refY="4" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
                <path d="M 0 0 L 10 4 L 0 8 z" fill="#2969FF" />
              </marker>
            </defs>
            {arrows.map(arrow => {
              const from = shapes.find(s => s.id === arrow.fromId)
              const to   = shapes.find(s => s.id === arrow.toId)
              if (!from || !to) return null

              const { d, mx, my } = connPath(from, to)
              const isSel = selectedId === arrow.id

              return (
                <g key={arrow.id}>
                  {/* Wide invisible hit area for easy clicking */}
                  <path
                    d={d}
                    stroke="transparent"
                    strokeWidth={14}
                    fill="none"
                    style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                    onClick={(e) => { e.stopPropagation(); setSelectedId(arrow.id) }}
                  />
                  {/* Visible bezier path */}
                  <path
                    d={d}
                    stroke={isSel ? '#2969FF' : '#555555'}
                    strokeWidth={isSel ? 2.5 : 1.8}
                    fill="none"
                    markerEnd={isSel ? 'url(#diag-arrow-end-sel)' : 'url(#diag-arrow-end)'}
                    markerStart={arrow.direction === 'two_way'
                      ? (isSel ? 'url(#diag-arrow-start-sel)' : 'url(#diag-arrow-start)')
                      : undefined}
                    style={{ pointerEvents: 'none' }}
                  />
                  {/* Midpoint delete button when selected */}
                  {isSel && (
                    <g
                      transform={`translate(${mx}, ${my})`}
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => { e.stopPropagation(); deleteSelected() }}
                    >
                      <circle r="9" fill="white" stroke="#2969FF" strokeWidth="1.5" />
                      <line x1="-3.5" y1="-3.5" x2="3.5"  y2="3.5"  stroke="#D50000" strokeWidth="1.6" strokeLinecap="round" style={{ pointerEvents: 'none' }} />
                      <line x1="3.5"  y1="-3.5" x2="-3.5" y2="3.5"  stroke="#D50000" strokeWidth="1.6" strokeLinecap="round" style={{ pointerEvents: 'none' }} />
                    </g>
                  )}
                </g>
              )
            })}
          </svg>

          {/* Shapes */}
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
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  if (connectMode) { handleShapeClickInConnect(shape.id); return }
                  setSelectedId(shape.id)
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
                      background:  'transparent',
                      border:      'none',
                      outline:     'none',
                      color:       '#fff',
                      fontWeight:  700,
                      fontSize:    '13px',
                      textAlign:   'center',
                      width:       '88%',
                      caretColor:  '#fff',
                    }}
                  />
                ) : (
                  <span
                    style={{
                      color:      '#fff',
                      fontWeight: 700,
                      fontSize:   '13px',
                      textAlign:  'center',
                      padding:    '4px 8px',
                      wordBreak:  'break-word',
                      pointerEvents: 'none',
                      lineHeight: 1.35,
                    }}
                  >
                    {shape.text || (
                      <span style={{ opacity: 0.4 }}>double-click</span>
                    )}
                  </span>
                )}
              </div>
            )
          })}

          {/* Connect-mode hint banner */}
          {connectMode && (
            <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
              <div className="rounded-full bg-[#262626]/85 px-4 py-1.5 text-[11px] text-white whitespace-nowrap">
                {connectFrom ? 'Now click the target shape' : 'Click the source shape'} ·{' '}
                <kbd className="opacity-50">Esc</kbd> to cancel
              </div>
            </div>
          )}

          {/* Empty state */}
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
