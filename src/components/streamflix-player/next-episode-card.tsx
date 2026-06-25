"use client"

interface NextEpisodeCardProps {
  nextEpisode: {
    title: string
    onPlay: () => void
  }
  countdown: number
  ringOffset: number
  R: number
  C: number
  onCancel: () => void
}

export function NextEpisodeCard({
  nextEpisode,
  countdown,
  ringOffset,
  R,
  C,
  onCancel,
}: NextEpisodeCardProps) {
  return (
    <div
      className="absolute right-[34px] max-sm:right-3 z-11 w-[225px] max-sm:w-[180px] p-[14px] max-sm:p-3 rounded-[12px]"
      style={{
        bottom: "calc(var(--lb) + 112px)",
        background: "color-mix(in srgb, var(--np-popover) 96%, transparent)",
        border: "1px solid var(--np-border)",
        backdropFilter: "blur(24px)",
        boxShadow: "0 18px 55px rgba(0,0,0,0.68)",
        animation: "slideR 0.4s ease",
      }}
    >
      <div
        className="w-full h-[108px] max-sm:h-20 rounded-[8px] mb-[11px] flex items-center justify-center overflow-hidden relative"
        style={{
          background:
            "linear-gradient(145deg, color-mix(in srgb, var(--np-primary) 8%, var(--np-bg)), color-mix(in srgb, var(--np-primary) 14%, var(--np-bg)), color-mix(in srgb, var(--np-primary) 20%, var(--np-bg)))",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, color-mix(in srgb, var(--np-primary) 14%, transparent), transparent 70%)",
          }}
        />
        <div className="absolute top-[8px] right-[8px] z-1">
          <svg width="38" height="38" viewBox="0 0 44 44">
            <circle
              cx="22"
              cy="22"
              r={R}
              fill="none"
              stroke="color-mix(in srgb, var(--np-fg) 12%, transparent)"
              strokeWidth="3.5"
            />
            <circle
              cx="22"
              cy="22"
              r={R}
              fill="none"
              stroke="var(--np-primary)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={ringOffset}
              transform="rotate(-90 22 22)"
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
            <text
              x="22"
              y="26.5"
              textAnchor="middle"
              fill="var(--np-fg)"
              fontSize="12"
              fontWeight="700"
              fontFamily="'DM Sans', sans-serif"
            >
              {countdown}
            </text>
          </svg>
        </div>
        <span
          style={{
            color: "color-mix(in srgb, var(--np-fg) 32%, transparent)",
            fontSize: "11px",
            letterSpacing: "0.1em",
          }}
        >
          UP NEXT
        </span>
      </div>
      <div
        className="text-[10px] font-semibold mb-[3px]"
        style={{
          color: "color-mix(in srgb, var(--np-fg) 36%, transparent)",
          textTransform: "uppercase",
          letterSpacing: "0.14em",
        }}
      >
        Next Film
      </div>
      <div
        className="text-[14px] text-foreground mb-[10px] leading-[1.3]"
        style={{ fontFamily: "'DM Serif Display', serif" }}
      >
        {nextEpisode.title}
      </div>
      <div className="flex items-center justify-between">
        <button
          className="px-[14px] py-[6px] text-[12px] font-semibold text-primary-foreground rounded-[6px] border-none cursor-pointer"
          style={{
            background: "var(--np-primary)",
            fontFamily: "'DM Sans', sans-serif",
          }}
          onClick={() => nextEpisode.onPlay()}
        >
          Play Now
        </button>
        <button
          className="bg-none border-none text-[11px] cursor-pointer underline"
          style={{
            color: "color-mix(in srgb, var(--np-fg) 32%, transparent)",
            fontFamily: "'DM Sans', sans-serif",
          }}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
