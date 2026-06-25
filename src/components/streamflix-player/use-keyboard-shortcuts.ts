"use client"

import { useEffect, useCallback } from "react"

interface UseKeyboardShortcutsProps {
  containerRef: React.RefObject<HTMLDivElement | null>
  videoRef: React.RefObject<HTMLVideoElement | null>
  resetIdle: () => void
  togglePlay: () => void
  setMuted: React.Dispatch<React.SetStateAction<boolean>>
  setVol: React.Dispatch<React.SetStateAction<number>>
  setShortcuts: React.Dispatch<React.SetStateAction<boolean>>
  vol: number
  dur: number
}

export function useKeyboardShortcuts({
  containerRef,
  videoRef,
  resetIdle,
  togglePlay,
  setMuted,
  setVol,
  setShortcuts,
  vol,
  dur,
}: UseKeyboardShortcutsProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      resetIdle()
      if (e.key === " " || e.key === "k") {
        e.preventDefault()
        togglePlay()
      }
      if (e.key === "m") setMuted((v) => !v)
      if (e.key === "ArrowRight") {
        e.preventDefault()
        if (videoRef.current)
          videoRef.current.currentTime = Math.min(
            dur,
            videoRef.current.currentTime + 10,
          )
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        if (videoRef.current)
          videoRef.current.currentTime = Math.max(
            0,
            videoRef.current.currentTime - 10,
          )
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        const nv = Math.min(100, vol + 5)
        setVol(nv)
        if (videoRef.current) {
          videoRef.current.volume = nv / 100
          setMuted(false)
        }
      }
      if (e.key === "ArrowDown") {
        e.preventDefault()
        const nv = Math.max(0, vol - 5)
        setVol(nv)
        if (videoRef.current) {
          videoRef.current.volume = nv / 100
          setMuted(nv === 0)
        }
      }
      if (e.key === "f" || e.key === "F") {
        if (!containerRef.current) return
        if (document.fullscreenElement) document.exitFullscreen()
        else containerRef.current.requestFullscreen()
      }
      if (e.key === "?") setShortcuts((v) => !v)
      if (e.key === "Escape") setShortcuts(false)
    },
    [resetIdle, togglePlay, setMuted, setVol, setShortcuts, containerRef, videoRef, vol, dur],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])
}
