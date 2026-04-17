'use client'

import type {
  Block,
  HeadingBlock,
  TextBlock,
  ImageBlock,
  ImageTextBlock,
  LinkCardBlock,
  TableBlock,
  DividerBlock,
  QuoteBlock,
  TwoColumnBlock,
  RowBlock,
  DiagramBlock,
} from '@/components/blocks/BlockTypes'
import { DIAGRAM_CANVAS_W, DIAGRAM_CANVAS_H } from '@/components/DiagramBuilder'

// ─── Shared prose styles (injected once per page via <style>) ─────────────

const PROSE_CSS = `
  .block-prose p   { margin: 0.5em 0; line-height: 1.65; color: rgba(255,255,255,0.65); font-size: 17px; }
  .block-prose strong { color: #fff; font-weight: 700; }
  .block-prose em     { font-style: italic; }
  .block-prose a      { color: #2969FF; text-decoration: underline; }
  .block-prose ul  { list-style: disc;    padding-left: 1.35em; margin: 0.6em 0; }
  .block-prose ol  { list-style: decimal; padding-left: 1.35em; margin: 0.6em 0; }
  .block-prose li  { margin: 0.25em 0; color: rgba(255,255,255,0.65); font-size: 17px; line-height: 1.6; }
  .block-prose h1  { font-size: 2em;    font-weight: 900; color: #ffffff;              margin: 0.6em 0 0.3em; letter-spacing: -0.02em; }
  .block-prose h2  { font-size: 1.4em;  font-weight: 700; color: rgba(255,255,255,0.85); margin: 0.6em 0 0.3em; }
  .block-prose h3  { font-size: 1.15em; font-weight: 700; color: rgba(255,255,255,0.65); margin: 0.5em 0 0.25em; }
`

// ─── Image size map ───────────────────────────────────────────────────────

const IMG_MAX: Record<ImageBlock['size'], string> = {
  small:  '320px',
  medium: '520px',
  large:  '800px',
  full:   '100%',
}

// ─── Block renderers ──────────────────────────────────────────────────────

function RenderHeading({ block }: { block: HeadingBlock }) {
  const Tag = `h${block.level}` as 'h1' | 'h2' | 'h3'

  const styles: Record<1 | 2 | 3, React.CSSProperties> = {
    1: { fontSize: '42px', fontWeight: 900, lineHeight: 1.1,  letterSpacing: '-0.02em', color: '#ffffff' },
    2: { fontSize: '30px', fontWeight: 700, lineHeight: 1.2,  color: 'rgba(255,255,255,0.85)' },
    3: { fontSize: '22px', fontWeight: 700, lineHeight: 1.3,  color: 'rgba(255,255,255,0.65)' },
  }

  return (
    <Tag style={styles[block.level]}>
      {block.text}
    </Tag>
  )
}

function RenderText({ block }: { block: TextBlock }) {
  if (!block.content) return null
  return (
    <div
      className="block-prose"
      dangerouslySetInnerHTML={{ __html: block.content }}
    />
  )
}

function RenderImage({ block }: { block: ImageBlock }) {
  if (!block.url) return null
  const wrapStyle: React.CSSProperties = (() => {
    switch (block.align) {
      case 'left':   return { maxWidth: IMG_MAX[block.size], marginRight: 'auto' }
      case 'right':  return { maxWidth: IMG_MAX[block.size], marginLeft:  'auto' }
      case 'full':   return { width: '100%' }
      default:       return { maxWidth: IMG_MAX[block.size], margin: '0 auto' }
    }
  })()
  return (
    <figure style={wrapStyle}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={block.url}
        alt={block.alt}
        className="w-full h-auto rounded-xl border border-white/10 object-contain"
      />
      {block.caption && (
        <figcaption className="mt-2.5 text-center text-[13px] text-white/45 leading-snug">
          {block.caption}
        </figcaption>
      )}
    </figure>
  )
}

function RenderImageText({ block }: { block: ImageTextBlock }) {
  if (!block.imageUrl && !block.content) return null

  const imageEl = block.imageUrl ? (
    <figure className="flex-shrink-0 w-full sm:w-[45%]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={block.imageUrl}
        alt={block.imageAlt}
        className="w-full h-auto rounded-xl border border-white/10 object-cover"
      />
      {block.caption && (
        <figcaption className="mt-2 text-[12px] text-white/40 text-center">{block.caption}</figcaption>
      )}
    </figure>
  ) : null

  const textEl = block.content ? (
    <div
      className="block-prose flex-1 min-w-0"
      dangerouslySetInnerHTML={{ __html: block.content }}
    />
  ) : null

  return (
    <div className={`flex flex-col gap-8 sm:flex-row sm:items-start ${
      block.imagePosition === 'right' ? 'sm:flex-row-reverse' : ''
    }`}>
      {imageEl}
      {textEl}
    </div>
  )
}

function RenderLinkCard({ block }: { block: LinkCardBlock }) {
  if (!block.url && !block.title) return null
  return (
    <a
      href={block.url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-5 no-underline transition-all hover:bg-white/[0.10] hover:border-white/20"
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#2969FF]/20 text-[#2969FF] transition-colors group-hover:bg-[#2969FF]/30">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M2 14L14 2M14 2H7M14 2v7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[16px] font-semibold text-white truncate">
          {block.title || block.url}
        </p>
        {block.description && (
          <p className="mt-1 text-[14px] text-white/60 leading-snug line-clamp-2">{block.description}</p>
        )}
        {block.url && (
          <p className="mt-2 text-[12px] text-[#2969FF]/70 truncate">{block.url}</p>
        )}
      </div>
    </a>
  )
}

function RenderTable({ block }: { block: TableBlock }) {
  if (!block.headers.length) return null
  return (
    <figure>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr style={{ background: '#2969FF' }}>
              {block.headers.map((h, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-white border-r border-white/20 last:border-r-0"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, ri) => (
              <tr
                key={ri}
                className="border-t border-white/8"
                style={{ background: ri % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'transparent' }}
              >
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className="px-4 py-3 text-[14px] text-white/80 border-r border-white/8 last:border-r-0"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {block.caption && (
        <figcaption className="mt-2.5 text-[13px] text-white/40 text-center">{block.caption}</figcaption>
      )}
    </figure>
  )
}

function RenderDivider({ block }: { block: DividerBlock }) {
  if (block.style === 'line') {
    return <hr className="border-0 border-t border-white/12" />
  }
  if (block.style === 'dots') {
    return (
      <div className="flex items-center justify-center gap-2.5 py-2" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-1.5 w-1.5 rounded-full bg-white/25" />
        ))}
      </div>
    )
  }
  // 'space' — just whitespace
  return <div aria-hidden="true" style={{ height: '2.5rem' }} />
}

function RenderQuote({ block }: { block: QuoteBlock }) {
  if (!block.text) return null
  return (
    <blockquote
      className="border-l-4 border-[#2969FF] pl-6 py-1"
    >
      <p
        className="text-[22px] font-medium italic leading-relaxed text-white/90"
        style={{ fontFamily: 'Georgia, serif' }}
      >
        &ldquo;{block.text}&rdquo;
      </p>
      {block.attribution && (
        <footer className="mt-3 text-[13px] font-medium text-white/45 not-italic">
          {block.attribution}
        </footer>
      )}
    </blockquote>
  )
}

function RenderTwoColumn({ block }: { block: TwoColumnBlock }) {
  if (!block.leftContent && !block.rightContent) return null
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
      {block.leftContent && (
        <div
          className="block-prose"
          dangerouslySetInnerHTML={{ __html: block.leftContent }}
        />
      )}
      {block.rightContent && (
        <div
          className="block-prose"
          dangerouslySetInnerHTML={{ __html: block.rightContent }}
        />
      )}
    </div>
  )
}

function RenderRow({ block }: { block: RowBlock }) {
  const cols = block.columns.length
  return (
    <div className={`grid gap-8 ${cols === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
      {block.columns.map((col, ci) => (
        <div key={ci} className="flex flex-col gap-8 min-w-0">
          {col.map((b) => (
            <BlockRenderer key={b.id} block={b} />
          ))}
        </div>
      ))}
    </div>
  )
}

function RenderDiagram({ block }: { block: DiagramBlock }) {
  if (block.shapes.length === 0) return null

  const W = DIAGRAM_CANVAS_W
  const H = DIAGRAM_CANVAS_H

  function scx(s: DiagramBlock['shapes'][number]) { return s.x + s.width  / 2 }
  function scy(s: DiagramBlock['shapes'][number]) { return s.y + s.height / 2 }

  // Unique marker IDs per block to avoid collisions when multiple diagrams render
  const markerId = `dm-${block.id}`

  return (
    <figure>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full rounded-xl border border-white/10 overflow-hidden"
        style={{ maxHeight: H, background: 'rgba(255,255,255,0.04)' }}
        aria-label="Diagram"
      >
        <defs>
          <marker id={`${markerId}-end`} markerWidth="8" markerHeight="8" refX="7" refY="3.5" orient="auto">
            <path d="M0,0 L0,7 L8,3.5 z" fill="rgba(255,255,255,0.7)" />
          </marker>
          <marker id={`${markerId}-start`} markerWidth="8" markerHeight="8" refX="1" refY="3.5" orient="auto-start-reverse">
            <path d="M0,0 L0,7 L8,3.5 z" fill="rgba(255,255,255,0.7)" />
          </marker>
        </defs>

        {/* Arrows */}
        {block.arrows.map(arrow => {
          const from = block.shapes.find(s => s.id === arrow.fromId)
          const to   = block.shapes.find(s => s.id === arrow.toId)
          if (!from || !to) return null
          return (
            <line
              key={arrow.id}
              x1={scx(from)} y1={scy(from)}
              x2={scx(to)}   y2={scy(to)}
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="1.8"
              markerEnd={`url(#${markerId}-end)`}
              markerStart={arrow.direction === 'two_way' ? `url(#${markerId}-start)` : undefined}
            />
          )
        })}

        {/* Shapes */}
        {block.shapes.map(shape => {
          const cx = scx(shape)
          const cy = scy(shape)
          const isCircle = shape.type === 'circle'
          const rx = shape.type === 'rounded_rect' ? 12 : 0

          return (
            <g key={shape.id}>
              {isCircle ? (
                <ellipse
                  cx={cx} cy={cy}
                  rx={shape.width / 2} ry={shape.height / 2}
                  fill={shape.fill}
                  stroke="rgba(255,255,255,0.30)"
                  strokeWidth="1.5"
                />
              ) : (
                <rect
                  x={shape.x} y={shape.y}
                  width={shape.width} height={shape.height}
                  rx={rx} ry={rx}
                  fill={shape.fill}
                  stroke="rgba(255,255,255,0.30)"
                  strokeWidth="1.5"
                />
              )}
              {shape.text && (
                <text
                  x={cx} y={cy}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontWeight="700"
                  fontSize="13"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {shape.text.length > 22 ? shape.text.slice(0, 20) + '…' : shape.text}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      {block.caption && (
        <figcaption className="mt-2.5 text-center text-[13px] text-white/45 leading-snug">
          {block.caption}
        </figcaption>
      )}
    </figure>
  )
}

// ─── Main renderer ────────────────────────────────────────────────────────

type Props = { block: Block }

export default function BlockRenderer({ block }: Props) {
  return (
    <>
      <style>{PROSE_CSS}</style>
      {(() => {
        switch (block.type) {
          case 'heading':    return <RenderHeading    block={block} />
          case 'text':       return <RenderText       block={block} />
          case 'image':      return <RenderImage      block={block} />
          case 'image_text': return <RenderImageText  block={block} />
          case 'link_card':  return <RenderLinkCard   block={block} />
          case 'table':      return <RenderTable      block={block} />
          case 'divider':    return <RenderDivider    block={block} />
          case 'quote':      return <RenderQuote      block={block} />
          case 'two_column': return <RenderTwoColumn  block={block} />
          case 'row':        return <RenderRow        block={block} />
          case 'diagram':    return <RenderDiagram    block={block as DiagramBlock} />
        }
      })()}
    </>
  )
}
