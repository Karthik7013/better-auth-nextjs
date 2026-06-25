"use client"

import { X } from "lucide-react"

interface ShortcutsModalProps {
  onClose: () => void
}

export function ShortcutsModal({ onClose }: ShortcutsModalProps) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "color-mix(in srgb, var(--np-bg) 70%, transparent)",
        backdropFilter: "blur(10px)",
        animation: "fadein 0.25s ease",
      }}
      onClick={onClose}
    >
      <div
        className="p-[28px] max-sm:p-4 w-[375px] max-sm:w-full max-sm:max-w-[85vw] rounded-[14px]"
        style={{
          background: "var(--np-popover)",
          border: "1px solid var(--np-border)",
          boxShadow: "0 28px 85px rgba(0,0,0,0.85)",
          animation: "scalein 0.25s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-[20px]">
          <div
            className="text-[19px] max-sm:text-base text-foreground"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Keyboard Shortcuts
          </div>
          <button
            className="w-[28px] h-[28px] rounded-full flex items-center justify-center cursor-pointer"
            style={{
              background: "color-mix(in srgb, var(--np-fg) 7%, transparent)",
              border: "none",
              color: "color-mix(in srgb, var(--np-fg) 50%, transparent)",
            }}
            onClick={onClose}
          >
            <X size={13} />
          </button>
        </div>
        {[
          ["Space / K", "Play / Pause"],
          ["← / →", "Seek −/+ 10 seconds"],
          ["↑ / ↓", "Volume up / down"],
          ["M", "Mute / Unmute"],
          ["F", "Toggle fullscreen"],
          ["?", "Toggle shortcuts"],
          ["Esc", "Close"],
        ].map(([k, l]) => (
          <div
            key={k}
            className="flex items-center justify-between py-[9px] max-sm:py-2 gap-2"
            style={{
              borderBottom:
                "1px solid color-mix(in srgb, var(--np-fg) 5%, transparent)",
            }}
          >
            <span className="text-[12.5px] max-sm:text-[11px]" style={{ color: "var(--np-muted)" }}>
              {l}
            </span>
            <span
              className="px-[9px] py-[3px] text-[11.5px] max-sm:text-[10px] font-semibold rounded-[4px] whitespace-nowrap"
              style={{
                background: "color-mix(in srgb, var(--np-fg) 7%, transparent)",
                border: "1px solid color-mix(in srgb, var(--np-fg) 13%, transparent)",
                color: "color-mix(in srgb, var(--np-fg) 78%, transparent)",
                fontFamily: "monospace",
                letterSpacing: "0.04em",
              }}
            >
              {k}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
