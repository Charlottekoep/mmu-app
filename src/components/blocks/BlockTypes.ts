import type { ImageAlign } from '@/lib/types'

// ─── Block type union ─────────────────────────────────────────────────────

export type BlockType =
  | 'heading'
  | 'text'
  | 'image'
  | 'image_text'
  | 'link_card'
  | 'table'
  | 'divider'
  | 'quote'
  | 'two_column'
  | 'row'
  | 'diagram'

// ─── Base ─────────────────────────────────────────────────────────────────

interface BaseBlock {
  id:   string
  type: BlockType
}

// ─── Block interfaces ─────────────────────────────────────────────────────

export interface HeadingBlock extends BaseBlock {
  type:  'heading'
  text:  string
  level: 1 | 2 | 3
}

export interface TextBlock extends BaseBlock {
  type:    'text'
  content: string   // HTML from TipTap
}

export interface ImageBlock extends BaseBlock {
  type:    'image'
  url:     string
  caption: string
  alt:     string
  size:    'small' | 'medium' | 'large' | 'full'
  align:   ImageAlign
}

export interface ImageTextBlock extends BaseBlock {
  type:          'image_text'
  imageUrl:      string
  imageAlt:      string
  imagePosition: 'left' | 'right'
  content:       string   // HTML from TipTap
  caption:       string
}

export interface LinkCardBlock extends BaseBlock {
  type:        'link_card'
  url:         string
  title:       string
  description: string
}

export interface TableBlock extends BaseBlock {
  type:    'table'
  headers: string[]
  rows:    string[][]
  caption: string
}

export interface DividerBlock extends BaseBlock {
  type:  'divider'
  style: 'line' | 'dots' | 'space'
}

export interface QuoteBlock extends BaseBlock {
  type:        'quote'
  text:        string
  attribution: string
}

export interface TwoColumnBlock extends BaseBlock {
  type:         'two_column'
  leftContent:  string   // HTML from TipTap
  rightContent: string   // HTML from TipTap
}

export interface RowBlock extends BaseBlock {
  type:    'row'
  columns: Block[][]   // 2–3 columns, each containing an ordered list of blocks
}

// ─── Diagram block ────────────────────────────────────────────────────────

export type ShapeType = 'rect' | 'rounded_rect' | 'circle'
export type ArrowDir  = 'one_way' | 'two_way'

export interface DiagramShape {
  id:     string
  type:   ShapeType
  x:      number
  y:      number
  width:  number
  height: number
  text:   string
  fill:   string
}

export interface DiagramArrow {
  id:        string
  fromId:    string
  toId:      string
  direction: ArrowDir
}

export interface DiagramBlock extends BaseBlock {
  type:    'diagram'
  shapes:  DiagramShape[]
  arrows:  DiagramArrow[]
  caption: string
}

// ─── Block union ──────────────────────────────────────────────────────────

export type Block =
  | HeadingBlock
  | TextBlock
  | ImageBlock
  | ImageTextBlock
  | LinkCardBlock
  | TableBlock
  | DividerBlock
  | QuoteBlock
  | TwoColumnBlock
  | RowBlock
  | DiagramBlock

// ─── Deep Dive content shape ──────────────────────────────────────────────

export interface DeepDiveContent {
  title:      string
  presenter?: string
  blocks:     Block[]
  enabled:    boolean
}

// ─── Factory ──────────────────────────────────────────────────────────────

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function createBlock(type: BlockType): Block {
  const id = uid()

  switch (type) {
    case 'heading':
      return { id, type, text: '', level: 2 }

    case 'text':
      return { id, type, content: '' }

    case 'image':
      return { id, type, url: '', caption: '', alt: '', size: 'full', align: 'center' }

    case 'image_text':
      return { id, type, imageUrl: '', imageAlt: '', imagePosition: 'left', content: '', caption: '' }

    case 'link_card':
      return { id, type, url: '', title: '', description: '' }

    case 'table':
      return { id, type, headers: ['Column 1', 'Column 2'], rows: [['', '']], caption: '' }

    case 'divider':
      return { id, type, style: 'line' }

    case 'quote':
      return { id, type, text: '', attribution: '' }

    case 'two_column':
      return { id, type, leftContent: '', rightContent: '' }

    case 'row':
      return { id, type, columns: [[], []] }

    case 'diagram':
      return { id, type, shapes: [], arrows: [], caption: '' }
  }
}

// ─── Block library (palette) ──────────────────────────────────────────────

export type BlockLibraryEntry = {
  type:        BlockType
  label:       string
  icon:        string
  description: string
}

export const BLOCK_LIBRARY: BlockLibraryEntry[] = [
  {
    type:        'heading',
    label:       'Heading',
    icon:        'H',
    description: 'Section title at H1, H2, or H3 size',
  },
  {
    type:        'text',
    label:       'Text',
    icon:        '¶',
    description: 'Rich text paragraph with bold, italic, lists',
  },
  {
    type:        'image',
    label:       'Image',
    icon:        '🖼',
    description: 'Full-width or sized image with optional caption',
  },
  {
    type:        'image_text',
    label:       'Image + Text',
    icon:        '◧',
    description: 'Image alongside text, left or right aligned',
  },
  {
    type:        'two_column',
    label:       'Two Columns',
    icon:        '⬛⬛',
    description: 'Side-by-side rich text columns',
  },
  {
    type:        'table',
    label:       'Table',
    icon:        '⊞',
    description: 'Rows and columns with optional headers and caption',
  },
  {
    type:        'link_card',
    label:       'Link Card',
    icon:        '🔗',
    description: 'Clickable card with URL, title, and description',
  },
  {
    type:        'quote',
    label:       'Quote',
    icon:        '"',
    description: 'Highlighted pull-quote with optional attribution',
  },
  {
    type:        'divider',
    label:       'Divider',
    icon:        '—',
    description: 'Visual separator: line, dots, or blank space',
  },
  {
    type:        'row',
    label:       'Row Layout',
    icon:        '▥',
    description: 'Place blocks side by side in 2 or 3 columns',
  },
  {
    type:        'diagram',
    label:       'Diagram',
    icon:        '◈',
    description: 'Drag-and-drop shapes and arrows diagram',
  },
]
