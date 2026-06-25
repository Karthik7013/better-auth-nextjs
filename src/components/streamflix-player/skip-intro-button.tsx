"use client"

interface SkipIntroButtonProps {
  onClick: () => void
}

export function SkipIntroButton({ onClick }: SkipIntroButtonProps) {
  return (
    <button
      className="absolute right-[34px] max-sm:right-3 z-11 px-[20px] max-sm:px-3 py-[9px] max-sm:py-2 text-[13.5px] max-sm:text-xs font-semibold text-foreground rounded-[6px] border-none cursor-pointer"
      style={{
        bottom: "calc(var(--lb) + 112px)",
        background: "color-mix(in srgb, var(--np-card) 93%, transparent)",
        border: "1.5px solid color-mix(in srgb, var(--np-primary) 52%, transparent)",
        backdropFilter: "blur(12px)",
        overflow: "hidden",
        fontFamily: "'DM Sans', sans-serif",
        letterSpacing: "0.07em",
        animation: "slideR 0.4s ease",
      }}
      onClick={onClick}
    >
      <span
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, transparent, color-mix(in srgb, var(--np-primary) 22%, transparent), transparent)",
          transform: "translateX(-100%)",
          animation: "shim 2.6s ease-in-out infinite",
        }}
      />
      Skip Intro →
    </button>
  )
}
