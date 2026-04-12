export default function DarkPageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-secondary">
      {/* Blue glow — top right */}
      <div
        className="pointer-events-none absolute -right-48 -top-48 h-[640px] w-[640px]"
        style={{
          background:
            'radial-gradient(circle, rgba(41,105,255,0.15) 0%, transparent 70%)',
        }}
      />
      {/* Green glow — bottom left */}
      <div
        className="pointer-events-none absolute -bottom-48 -left-48 h-[560px] w-[560px]"
        style={{
          background:
            'radial-gradient(circle, rgba(31,200,129,0.15) 0%, transparent 70%)',
        }}
      />

      {/* Content layer sits above the glows */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
