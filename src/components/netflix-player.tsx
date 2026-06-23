"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { MediaController, MediaPlayButton, MediaMuteButton, MediaVolumeRange, MediaFullscreenButton } from "media-chrome/react"
import { Play, Pause, SkipBack, SkipForward, Subtitles, Settings, LayoutGrid, Info, Keyboard, ChevronLeft, X } from "lucide-react"

function fmt(sec: number) {
  if (!isFinite(sec) || sec < 0) return "0:00"
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`
}

interface NetflixPlayerProps {
  src: string
  poster?: string
  title: string
  metadata?: {
    year?: number | string
    duration?: string
    durationSeconds?: number
    rating?: string
    synopsis?: string
    cast?: string[]
    chapters?: number[]
  }
  onBack?: () => void
  onSkipIntro?: () => void
  nextEpisode?: {
    title: string
    onPlay: () => void
    countdownSeconds?: number
  }
  className?: string
}

export function NetflixPlayer({ src, poster, title, metadata, onBack, onSkipIntro, nextEpisode, className }: NetflixPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const idleRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const cntRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(true)
  const [muted, setMuted] = useState(false)
  const [vol, setVol] = useState(75)
  const [prog, setProg] = useState(0)
  const [buf, setBuf] = useState(0)
  const [dur, setDur] = useState(0)
  const [idle, setIdle] = useState(false)
  const [showVol, setShowVol] = useState(false)
  const [hov, setHov] = useState<number | null>(null)
  const [hovX, setHovX] = useState(0)
  const [shortcuts, setShortcuts] = useState(false)
  const [skipIntro, setSkipIntro] = useState(!!onSkipIntro)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const totalSec = metadata?.durationSeconds || dur

  const resetIdle = useCallback(() => {
    setIdle(false)
    clearTimeout(idleRef.current)
    if (playing) idleRef.current = setTimeout(() => setIdle(true), 3200)
  }, [playing])

  useEffect(() => {
    resetIdle()
    return () => clearTimeout(idleRef.current)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (skipIntro && onSkipIntro) {
      const t = setTimeout(() => setSkipIntro(false), 9000)
      return () => clearTimeout(t)
    }
  }, [skipIntro, onSkipIntro])

  useEffect(() => {
    if (prog >= 93 && countdown === null && nextEpisode) setCountdown(nextEpisode.countdownSeconds ?? 30)
  }, [prog, countdown, nextEpisode])

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      cntRef.current = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000)
    }
    if (countdown === 0 && nextEpisode) {
      nextEpisode.onPlay()
    }
    return () => clearTimeout(cntRef.current)
  }, [countdown, nextEpisode])

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      videoRef.current.play()
      setPlaying(true)
      setPaused(false)
    } else {
      videoRef.current.pause()
      setPlaying(false)
      setPaused(true)
    }
  }, [])

  const seekTo = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!barRef.current || !videoRef.current || !dur) return
    const r = barRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100))
    videoRef.current.currentTime = (pct / 100) * dur
    setProg(pct)
    setLoading(true)
    setTimeout(() => setLoading(false), 500)
  }, [dur])

  const onHover = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!barRef.current) return
    const r = barRef.current.getBoundingClientRect()
    const p = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100))
    setHov(p)
    setHovX(e.clientX - r.left)
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    resetIdle()
    if (e.key === " " || e.key === "k") { e.preventDefault(); togglePlay() }
    if (e.key === "m") setMuted((v) => !v)
    if (e.key === "ArrowRight") {
      e.preventDefault()
      if (videoRef.current) videoRef.current.currentTime = Math.min(dur, videoRef.current.currentTime + 10)
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault()
      if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10)
    }
    if (e.key === "ArrowUp") {
      e.preventDefault(); const nv = Math.min(100, vol + 5)
      setVol(nv); if (videoRef.current) { videoRef.current.volume = nv / 100; setMuted(false) }
    }
    if (e.key === "ArrowDown") {
      e.preventDefault(); const nv = Math.max(0, vol - 5)
      setVol(nv); if (videoRef.current) { videoRef.current.volume = nv / 100; setMuted(nv === 0) }
    }
    if (e.key === "f" || e.key === "F") {
      if (!containerRef.current) return
      if (document.fullscreenElement) document.exitFullscreen()
      else containerRef.current.requestFullscreen()
    }
    if (e.key === "?") setShortcuts((v) => !v)
    if (e.key === "Escape") setShortcuts(false)
  }, [resetIdle, togglePlay, vol, dur])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  // Tap container to show UI when idle (mobile-friendly)
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    if (idle && e.target === e.currentTarget) {
      resetIdle()
    }
  }, [idle, resetIdle])

  const handleTouchEnd = useCallback(() => {
    if (idle) resetIdle()
  }, [idle, resetIdle])

  const curSec = (prog / 100) * totalSec
  const R = 18, C = 2 * Math.PI * R
  const ringOffset = countdown !== null ? C - ((30 - countdown) / 30) * C : C
  const hasChapters = metadata?.chapters && metadata.chapters.length > 0

  const css = `
    .np-root {
      --lb: 9%;
      --np-bg: var(--background);
      --np-card: var(--card);
      --np-popover: var(--popover);
      --np-fg: var(--foreground);
      --np-muted: var(--muted-foreground);
      --np-primary: var(--primary);
      --np-primary-glow: var(--primary-glow);
      --np-accent: var(--accent);
      --np-border: var(--border);
      --np-shadow-glow: 0 0 40px -8px color-mix(in oklab, var(--primary) 55%, transparent);
    }
    .mp-prog-track { transition: height 0.2s ease; }
    .mp-prog-wrap:hover .mp-prog-track { height: 7px; }
    .mp-knob { transition: transform 0.2s; }
    .mp-prog-wrap:hover .mp-knob { transform: translate(-50%, -50%) scale(1); }
    @keyframes aurora {
      0% { filter: hue-rotate(0deg) brightness(1); }
      100% { filter: hue-rotate(15deg) brightness(1.06); }
    }
    @keyframes spot {
      0%, 100% { opacity: 0.65; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.05); }
    }
    @keyframes cardIn {
      from { transform: scale(0.96) translateY(10px); opacity: 0; }
      to { transform: scale(1) translateY(0); opacity: 1; }
    }
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--np-primary) 40%, transparent); }
      50% { box-shadow: 0 0 0 12px color-mix(in srgb, var(--np-primary) 0%, transparent); }
    }
    @keyframes slideR {
      from { opacity: 0; transform: translateX(18px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes shim {
      from { transform: translateX(-150%); }
      to { transform: translateX(200%); }
    }
    @keyframes fadein {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scalein {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .mp-btn { background: none; border: none; color: color-mix(in srgb, var(--np-fg) 80%, transparent); cursor: pointer; padding: 8px; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: all 0.18s; font-family: 'DM Sans', sans-serif; }
    .mp-btn:hover { color: var(--np-fg); background: color-mix(in srgb, var(--np-fg) 8%, transparent); transform: scale(1.12); }
    .mp-btn:active { transform: scale(0.94); }
    .mp-rbtn { background: none; border: none; color: color-mix(in srgb, var(--np-fg) 62%, transparent); cursor: pointer; padding: 7px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-family: 'DM Sans', sans-serif; transition: all 0.18s; }
    .mp-rbtn:hover { color: var(--np-fg); background: color-mix(in srgb, var(--np-fg) 8%, transparent); }
    @media (max-width: 640px) {
      .np-root { --lb: 4%; }
    }
  `

  return (
    <>
      <style>{css}</style>
      <div
        ref={containerRef}
        className={`np-root relative overflow-hidden ${className ?? ""} ${idle ? "cursor-none" : "cursor-default"}`}
        style={{ fontFamily: "'DM Sans', sans-serif", background: "var(--np-bg)" }}
        onMouseMove={resetIdle}
        onMouseLeave={() => { if (playing) setIdle(true) }}
        onTouchStart={resetIdle}
        onTouchEnd={handleTouchEnd}
      >
        {/* Atmosphere layers */}
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
            background: "radial-gradient(ellipse 55% 65% at 50% 50%, color-mix(in srgb, var(--np-fg) 6%, transparent) 0%, transparent 68%)",
            animation: "spot 5.5s ease-in-out infinite",
          }}
        />
        <div
          className="absolute inset-0 z-2 pointer-events-none opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Letterbox */}
        <div className="absolute top-0 left-0 right-0 z-3 bg-background" style={{ height: "var(--lb)" }} />
        <div className="absolute bottom-0 left-0 right-0 z-3 bg-background" style={{ height: "var(--lb)" }} />

        {/* Spinner */}
        {loading && (
          <div className="absolute inset-0 z-9 flex items-center justify-center pointer-events-none" style={{ top: "var(--lb)", bottom: "var(--lb)" }}>
            <div
              className="w-[46px] h-[46px] rounded-full"
              style={{
                border: "3px solid color-mix(in srgb, var(--np-primary) 25%, transparent)",
                borderTopColor: "var(--np-primary)",
                animation: "spin 0.75s linear infinite",
                boxShadow: "0 0 26px color-mix(in srgb, var(--np-primary) 35%, transparent)",
              }}
            />
          </div>
        )}

        {/* Video container */}
        <MediaController
          className="absolute inset-0 z-4"
          style={{ top: "var(--lb)", bottom: "var(--lb)" } as React.CSSProperties}
        >
          <video
            ref={videoRef}
            slot="media"
            src={src}
            poster={poster}
            className="size-full object-contain cursor-pointer"
            onClick={togglePlay}
            onTimeUpdate={() => { if (videoRef.current) { setProg((videoRef.current.currentTime / (dur || 1)) * 100) } }}
            onLoadedMetadata={() => { if (videoRef.current) setDur(videoRef.current.duration) }}
            onProgress={() => { if (videoRef.current && videoRef.current.buffered.length > 0) { setBuf((videoRef.current.buffered.end(videoRef.current.buffered.length - 1) / (dur || 1)) * 100) } }}
            onPlay={() => { setPlaying(true); setPaused(false) }}
            onPause={() => { setPlaying(false); setPaused(true) }}
            playsInline
          />

          {/* Pause overlay */}
          <div
            className={`absolute inset-0 z-8 flex items-center justify-center transition-opacity duration-400 ${!paused ? "opacity-0 pointer-events-none" : ""}`}
            style={{ background: "color-mix(in srgb, var(--np-bg) 65%, transparent)", backdropFilter: "blur(4px)" }}
            onClick={togglePlay}
          >
            <div
              className="np-pause-card flex gap-[22px] items-start max-sm:flex-col max-sm:gap-3 p-[26px] max-sm:p-4 max-w-[500px] max-sm:max-w-[85vw] w-[90%] rounded-[15px]"
              style={{
                background: "color-mix(in srgb, var(--np-card) 93%, transparent)",
                backdropFilter: "blur(28px)",
                border: "1px solid var(--np-border)",
                boxShadow: "0 28px 90px rgba(0,0,0,0.75), 0 0 0 1px color-mix(in srgb, var(--np-primary) 12%, transparent)",
                animation: "cardIn 0.35s ease",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={poster}
                alt={title}
                className="np-pause-poster w-[95px] h-[136px] max-sm:hidden rounded-[9px] shrink-0 object-cover"
                style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.55)" }}
              />
              <div className="min-w-0">
                <div className="np-pause-title text-[24px] max-sm:text-xl text-foreground leading-[1.2] mb-3" style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic" }}>
                  {title}
                </div>
                {(metadata?.year || metadata?.duration || metadata?.rating) && (
                  <div className="flex gap-[7px] items-center mb-[10px] max-sm:flex-wrap">
                    {metadata?.year && <span className="text-[12px]" style={{ color: "var(--np-muted)" }}>{metadata.year}</span>}
                    {metadata?.duration && <span className="text-[12px]" style={{ color: "var(--np-muted)" }}>· {metadata.duration}</span>}
                    {metadata?.rating && (
                      <span className="px-[6px] py-[1px] text-[10.5px] font-medium" style={{ border: "1px solid var(--np-border)", borderRadius: "3px", color: "color-mix(in srgb, var(--np-fg) 55%, transparent)" }}>
                        {metadata.rating}
                      </span>
                    )}
                  </div>
                )}
                {metadata?.synopsis && (
                  <p className="text-[12.5px] mb-[16px] leading-[1.65]" style={{ color: "var(--np-muted)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {metadata.synopsis}
                  </p>
                )}
                <button
                  onClick={togglePlay}
                  className="flex items-center gap-[8px] px-[18px] py-[10px] text-[13.5px] font-semibold text-primary-foreground rounded-[8px] border-none cursor-pointer"
                  style={{
                    background: "var(--np-primary)",
                    fontFamily: "'DM Sans', sans-serif",
                    letterSpacing: "0.04em",
                    animation: "pulse 2.2s ease infinite",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.animation = "none"; e.currentTarget.style.boxShadow = "0 4px 28px var(--np-primary)" }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.animation = "pulse 2.2s ease infinite"; e.currentTarget.style.boxShadow = "" }}
                >
                  <Play size={15} fill="currentColor" />
                  &nbsp;{paused ? "Resume" : "Pause"}
                </button>
              </div>
            </div>
          </div>

          {/* Skip Intro */}
          {skipIntro && onSkipIntro && !idle && (
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
              onClick={() => { setSkipIntro(false); onSkipIntro?.() }}
            >
              <span
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(90deg, transparent, color-mix(in srgb, var(--np-primary) 22%, transparent), transparent)",
                  transform: "translateX(-100%)",
                  animation: "shim 2.6s ease-in-out infinite",
                }}
              />
              Skip Intro →
            </button>
          )}

          {/* Next Episode Card */}
          {countdown !== null && nextEpisode && !idle && (
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
                style={{ background: "linear-gradient(145deg, color-mix(in srgb, var(--np-primary) 8%, var(--np-bg)), color-mix(in srgb, var(--np-primary) 14%, var(--np-bg)), color-mix(in srgb, var(--np-primary) 20%, var(--np-bg)))" }}
              >
                <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, color-mix(in srgb, var(--np-primary) 14%, transparent), transparent 70%)" }} />
                <div className="absolute top-[8px] right-[8px] z-1">
                  <svg width="38" height="38" viewBox="0 0 44 44">
                    <circle cx="22" cy="22" r={R} fill="none" stroke="color-mix(in srgb, var(--np-fg) 12%, transparent)" strokeWidth="3.5" />
                    <circle cx="22" cy="22" r={R} fill="none" stroke="var(--np-primary)" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={ringOffset} transform="rotate(-90 22 22)" style={{ transition: "stroke-dashoffset 1s linear" }} />
                    <text x="22" y="26.5" textAnchor="middle" fill="var(--np-fg)" fontSize="12" fontWeight="700" fontFamily="'DM Sans', sans-serif">{countdown}</text>
                  </svg>
                </div>
                <span style={{ color: "color-mix(in srgb, var(--np-fg) 32%, transparent)", fontSize: "11px", letterSpacing: "0.1em" }}>UP NEXT</span>
              </div>
              <div className="text-[10px] font-semibold mb-[3px]" style={{ color: "color-mix(in srgb, var(--np-fg) 36%, transparent)", textTransform: "uppercase", letterSpacing: "0.14em" }}>Next Film</div>
              <div className="text-[14px] text-foreground mb-[10px] leading-[1.3]" style={{ fontFamily: "'DM Serif Display', serif" }}>{nextEpisode.title}</div>
              <div className="flex items-center justify-between">
                <button className="px-[14px] py-[6px] text-[12px] font-semibold text-primary-foreground rounded-[6px] border-none cursor-pointer" style={{ background: "var(--np-primary)", fontFamily: "'DM Sans', sans-serif" }} onClick={() => nextEpisode.onPlay()}>Play Now</button>
                <button className="bg-none border-none text-[11px] cursor-pointer underline" style={{ color: "color-mix(in srgb, var(--np-fg) 32%, transparent)", fontFamily: "'DM Sans', sans-serif" }} onClick={() => setCountdown(null)}>Cancel</button>
              </div>
            </div>
          )}

          {/* Top bar */}
          <div
            className={`np-top absolute top-0 left-0 right-0 z-10 px-9 max-sm:px-3 py-[18px] max-sm:py-2 flex items-center justify-between transition-all duration-400 ${idle ? "opacity-0 translate-y-[-7px] pointer-events-none" : ""}`}
            style={{ background: "linear-gradient(to bottom, color-mix(in srgb, var(--np-bg) 88%, transparent) 0%, transparent 100%)" }}
          >
            {onBack && (
              <button onClick={onBack} className="flex items-center gap-[7px] bg-none border-none cursor-pointer text-[13px] font-medium" style={{ color: "color-mix(in srgb, var(--np-fg) 78%, transparent)", letterSpacing: "0.06em", fontFamily: "'DM Sans', sans-serif" }}>
                <ChevronLeft size={17} />
                <span className="max-sm:hidden">Back to Browse</span>
              </button>
            )}
            <div className="np-top-title absolute left-1/2 -translate-x-1/2 text-xl max-sm:text-sm text-foreground whitespace-nowrap" style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", letterSpacing: "0.01em", textShadow: "0 2px 28px color-mix(in srgb, var(--np-bg) 95%, transparent)" }}>
              {title}{metadata?.year ? ` · ${metadata.year}` : ""}
            </div>
            <div className="np-cast flex items-center gap-[9px] max-sm:hidden">
              {metadata?.cast?.slice(0, 3).map((n, i) => (
                <div key={i} className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-[10px] font-bold text-foreground cursor-pointer" style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--np-primary) 70%, var(--np-bg)), var(--np-primary))", border: "1.5px solid color-mix(in srgb, var(--np-fg) 16%, transparent)", letterSpacing: "0.02em" }} title={n}>
                  {n.split(" ").map((w) => w[0]).join("")}
                </div>
              ))}
              <button className="w-[32px] h-[32px] rounded-full flex items-center justify-center cursor-pointer" style={{ background: "color-mix(in srgb, var(--np-fg) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--np-fg) 12%, transparent)", color: "color-mix(in srgb, var(--np-fg) 65%, transparent)" }}>
                <Info size={13} />
              </button>
            </div>
          </div>

          {/* Bottom controls */}
          <div
            className={`np-ctrl absolute bottom-0 left-0 right-0 z-10 px-[30px] max-sm:px-2 pb-5 max-sm:pb-2 transition-all duration-400 ${idle ? "opacity-0 translate-y-[10px] pointer-events-none" : ""}`}
            style={{ background: "linear-gradient(to top, color-mix(in srgb, var(--np-bg) 98%, transparent) 0%, color-mix(in srgb, var(--np-bg) 55%, transparent) 65%, transparent 100%)" }}
          >
            {/* Progress bar */}
            <div ref={barRef} className="mp-prog-wrap relative cursor-pointer mb-[9px]" style={{ padding: "14px 0" }} onClick={seekTo} onMouseMove={onHover} onMouseLeave={() => setHov(null)}>
              {hov !== null && (
                <div className="absolute bottom-[32px] -translate-x-1/2 px-[9px] py-[4px] text-[11.5px] font-medium text-foreground whitespace-nowrap rounded-[5px] pointer-events-none z-20 max-sm:hidden" style={{ left: `${hovX}px`, background: "color-mix(in srgb, var(--np-card) 95%, transparent)", border: "1px solid color-mix(in srgb, var(--np-primary) 35%, transparent)", backdropFilter: "blur(12px)", letterSpacing: "0.06em" }}>
                  {fmt((hov / 100) * totalSec)}
                </div>
              )}
              <div className="mp-prog-track relative h-[4px] rounded-[4px]" style={{ background: "color-mix(in srgb, var(--np-fg) 17%, transparent)" }}>
                <div className="absolute top-0 left-0 h-full rounded-[4px]" style={{ width: `${buf}%`, background: "color-mix(in srgb, var(--np-fg) 26%, transparent)" }} />
                <div className="absolute top-0 left-0 h-full rounded-[4px]" style={{ width: `${prog}%`, background: "linear-gradient(90deg, color-mix(in srgb, var(--np-primary) 80%, var(--np-bg)), var(--np-primary), color-mix(in srgb, var(--np-primary-glow) 80%, var(--np-bg)))" }} />
                {hasChapters && metadata!.chapters!.map((p, i) => (
                  <div key={i} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-[3px] h-[3px] rounded-full pointer-events-none" style={{ left: `${p}%`, background: "color-mix(in srgb, var(--np-fg) 50%, transparent)" }} />
                ))}
                <div className="mp-knob absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-[15px] h-[15px] bg-foreground rounded-full pointer-events-none" style={{ left: `${prog}%`, transform: "translate(-50%, -50%) scale(0)", boxShadow: "0 0 14px color-mix(in srgb, var(--np-primary) 90%, transparent), 0 2px 8px color-mix(in srgb, var(--np-bg) 50%, transparent)" }} />
              </div>
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-[5px] max-sm:gap-[3px]">
                <button className="mp-btn max-sm:hidden" onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.max(0, (prog - 0.9) / 100 * dur) }} title="Rewind 10s">
                  <SkipBack size={20} />
                </button>
                <MediaPlayButton
                  className="w-[50px] max-sm:w-[38px] max-sm:h-[38px] h-[50px] rounded-full flex items-center justify-center cursor-pointer"
                  style={{
                    border: "2px solid color-mix(in srgb, var(--np-primary) 44%, transparent)",
                    background: "color-mix(in srgb, var(--np-primary) 13%, transparent)",
                    "--media-primary-color": "var(--np-fg)",
                    "--media-button-icon-width": "21px",
                    "--media-button-icon-height": "21px",
                    transition: "all 0.18s",
                  } as React.CSSProperties}
                />
                <button className="mp-btn max-sm:hidden" onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.min(dur, (prog + 0.9) / 100 * dur) }} title="Forward 10s">
                  <SkipForward size={20} />
                </button>
                <div className="flex items-center gap-[3px] max-sm:hidden" onMouseEnter={() => setShowVol(true)} onMouseLeave={() => setShowVol(false)}>
                  <MediaMuteButton className="mp-btn" style={{ "--media-primary-color": "color-mix(in srgb, var(--np-fg) 80%, transparent)", "--media-button-icon-width": "20px", "--media-button-icon-height": "20px" } as React.CSSProperties} />
                  <div className={`overflow-hidden opacity-0 flex items-center transition-all duration-320 ${showVol ? "max-w-[84px] opacity-100" : "max-w-0"}`}>
                    <MediaVolumeRange className="w-[76px] h-[4px] rounded-[4px] outline-none cursor-pointer ml-[3px]" style={{ "--media-primary-color": "var(--np-primary)", "--media-range-track-background": "color-mix(in srgb, var(--np-fg) 25%, transparent)" } as React.CSSProperties} />
                  </div>
                </div>
                <div className="text-[12.5px] max-sm:text-[10px] font-normal whitespace-nowrap ml-[4px]" style={{ color: "color-mix(in srgb, var(--np-fg) 60%, transparent)", letterSpacing: "0.05em" }}>
                  {fmt(curSec)} <em style={{ color: "color-mix(in srgb, var(--np-fg) 30%, transparent)", fontStyle: "normal", margin: "0 3px" }}>/</em> {metadata?.duration || fmt(dur)}
                </div>
              </div>
              <div className="np-center-title text-[11.5px] font-medium uppercase max-sm:hidden" style={{ color: "color-mix(in srgb, var(--np-fg) 38%, transparent)", letterSpacing: "0.15em" }}>
                {title}
              </div>
              <div className="flex items-center gap-[3px] max-sm:gap-[2px]">
                <button className="mp-rbtn max-sm:hidden" title="Subtitles"><Subtitles size={16} /></button>
                <button className="mp-rbtn max-sm:hidden" title="Audio Track"><span className="text-[11.5px] font-semibold" style={{ letterSpacing: "0.08em" }}>ENG</span></button>
                <button className="mp-rbtn max-sm:hidden" title="Episodes"><LayoutGrid size={16} /></button>
                {nextEpisode && (
                  <button className="flex items-center gap-[5px] max-sm:gap-1 px-[13px] max-sm:px-2 py-[5px] text-[12px] max-sm:text-[10px] font-semibold text-foreground cursor-pointer rounded-[18px] whitespace-nowrap" style={{ background: "color-mix(in srgb, var(--np-primary) 11%, transparent)", border: "1px solid color-mix(in srgb, var(--np-primary) 36%, transparent)", letterSpacing: "0.06em", fontFamily: "'DM Sans', sans-serif" }} onClick={() => setCountdown(nextEpisode.countdownSeconds ?? 30)}>
                    <SkipForward size={12} /> Next
                  </button>
                )}
                <button className="mp-rbtn max-sm:hidden" title="Settings"><Settings size={16} /></button>
                <button className="mp-rbtn max-sm:hidden" title="Keyboard Shortcuts (?)" onClick={() => setShortcuts(true)}><Keyboard size={16} /></button>
                <MediaFullscreenButton className="mp-rbtn" style={{ "--media-primary-color": "color-mix(in srgb, var(--np-fg) 62%, transparent)", "--media-button-icon-width": "16px", "--media-button-icon-height": "16px" } as React.CSSProperties} />
              </div>
            </div>
          </div>
        </MediaController>

        {/* Shortcuts Modal */}
        {shortcuts && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ background: "color-mix(in srgb, var(--np-bg) 70%, transparent)", backdropFilter: "blur(10px)", animation: "fadein 0.25s ease" }} onClick={() => setShortcuts(false)}>
            <div className="p-[28px] max-sm:p-4 w-[375px] max-sm:w-full max-sm:max-w-[85vw] rounded-[14px]" style={{ background: "var(--np-popover)", border: "1px solid var(--np-border)", boxShadow: "0 28px 85px rgba(0,0,0,0.85)", animation: "scalein 0.25s ease" }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-[20px]">
                <div className="text-[19px] max-sm:text-base text-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>Keyboard Shortcuts</div>
                <button className="w-[28px] h-[28px] rounded-full flex items-center justify-center cursor-pointer" style={{ background: "color-mix(in srgb, var(--np-fg) 7%, transparent)", border: "none", color: "color-mix(in srgb, var(--np-fg) 50%, transparent)" }} onClick={() => setShortcuts(false)}><X size={13} /></button>
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
                <div key={k} className="flex items-center justify-between py-[9px] max-sm:py-2 gap-2" style={{ borderBottom: "1px solid color-mix(in srgb, var(--np-fg) 5%, transparent)" }}>
                  <span className="text-[12.5px] max-sm:text-[11px]" style={{ color: "var(--np-muted)" }}>{l}</span>
                  <span className="px-[9px] py-[3px] text-[11.5px] max-sm:text-[10px] font-semibold rounded-[4px] whitespace-nowrap" style={{ background: "color-mix(in srgb, var(--np-fg) 7%, transparent)", border: "1px solid color-mix(in srgb, var(--np-fg) 13%, transparent)", color: "color-mix(in srgb, var(--np-fg) 78%, transparent)", fontFamily: "monospace", letterSpacing: "0.04em" }}>{k}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
