"use client"

export function AmbientLayer() {
  return (
    <>
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: [
            "radial-gradient(ellipse 90% 70% at 50% 55%, color-mix(in srgb, var(--np-primary) 18%, transparent) 0%, transparent 60%)",
            "radial-gradient(ellipse 45% 45% at 12% 80%, color-mix(in srgb, var(--np-primary-glow) 14%, transparent) 0%, transparent 55%)",
            "radial-gradient(ellipse 55% 55% at 88% 18%, color-mix(in srgb, var(--np-primary) 10%, transparent) 0%, transparent 55%)",
            "var(--np-bg)",
          ].join(","),
          animation: "aurora 16s ease-in-out infinite alternate",
        }}
      />
      <div
        className="absolute inset-0 z-1 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 55% 65% at 50% 50%, color-mix(in srgb, var(--np-fg) 6%, transparent) 0%, transparent 68%)",
          animation: "spot 5.5s ease-in-out infinite",
        }}
      />
      <div
        className="absolute inset-0 z-2 pointer-events-none opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
    </>
  )
}
