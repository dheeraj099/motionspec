import { useEffect, useRef, useState } from 'react'
import { useMotionStore } from '../store/useMotionStore'

function interpolate(from: number, to: number, t: number, easing: string): number {
  let e = t
  switch (easing) {
    case 'ease-in':     e = t * t; break
    case 'ease-out':    e = 1 - (1 - t) * (1 - t); break
    case 'ease-in-out': e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; break
    case 'spring':      e = 1 - Math.exp(-6 * t) * Math.cos(10 * t); break
    case 'bounce': {
      if (t < 1 / 2.75) e = 7.5625 * t * t
      else if (t < 2 / 2.75) { const t2 = t - 1.5 / 2.75; e = 7.5625 * t2 * t2 + 0.75 }
      else if (t < 2.5 / 2.75) { const t2 = t - 2.25 / 2.75; e = 7.5625 * t2 * t2 + 0.9375 }
      else { const t2 = t - 2.625 / 2.75; e = 7.5625 * t2 * t2 + 0.984375 }
      break
    }
  }
  return from + (to - from) * e
}

function getAnimatedValues(tracks: ReturnType<typeof useMotionStore.getState>['tracks'], t: number) {
  const result: Record<string, number> = {}
  for (const track of tracks) {
    const sorted = [...track.keyframes].sort((a, b) => a.time - b.time)
    if (sorted.length === 0) continue
    const localT = Math.max(0, Math.min(1, t / track.duration))
    const prev = sorted.filter((k) => k.time <= localT).pop() ?? sorted[0]
    const next = sorted.find((k) => k.time > localT)
    if (!next) { result[track.property] = prev.value; continue }
    const segT = (localT - prev.time) / (next.time - prev.time)
    result[track.property] = interpolate(prev.value, next.value, segT, track.easing)
  }
  return result
}

export default function Preview() {
  const { tracks, totalDuration, playhead, isPlaying, setPlayhead, setPlaying } = useMotionStore()
  const animRef = useRef(0)
  const startRef = useRef(0)
  const startPlayhead = useRef(0)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (isPlaying) {
      startRef.current = performance.now()
      startPlayhead.current = playhead
      const animate = () => {
        const elapsed = performance.now() - startRef.current
        const newT = startPlayhead.current + elapsed
        if (newT >= totalDuration) {
          setPlayhead(0)
          setPlaying(false)
          return
        }
        setPlayhead(Math.round(newT))
        setTick((t) => t + 1)
        animRef.current = requestAnimationFrame(animate)
      }
      animRef.current = requestAnimationFrame(animate)
    } else {
      cancelAnimationFrame(animRef.current)
    }
    return () => cancelAnimationFrame(animRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying])

  useEffect(() => { setTick((t) => t + 1) }, [playhead])

  const vals = getAnimatedValues(tracks, playhead)
  void tick

  const opacity = vals.opacity !== undefined ? vals.opacity / 100 : 1
  const x       = vals.x  !== undefined ? vals.x  : 0
  const y       = vals.y  !== undefined ? vals.y  : 0
  const scale   = vals.scale   !== undefined ? vals.scale   / 100 : 1
  const scaleX  = vals.scaleX  !== undefined ? vals.scaleX  / 100 : scale
  const scaleY  = vals.scaleY  !== undefined ? vals.scaleY  / 100 : scale
  const rotate  = vals.rotate  !== undefined ? vals.rotate  : 0

  const transform = `translate(${x}px, ${y}px) scale(${scaleX}, ${scaleY}) rotate(${rotate}deg)`

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-3 py-2 border-b border-[#1f1f2e] shrink-0">
        <button
          onClick={() => { setPlayhead(0); setPlaying(!isPlaying) }}
          className={`text-xs px-3 py-1 rounded font-semibold transition-all ${
            isPlaying ? 'bg-red-600/80 hover:bg-red-600 text-white' : 'bg-violet-600 hover:bg-violet-500 text-white'
          }`}
        >
          {isPlaying ? 'Stop' : 'Play'}
        </button>
        <button onClick={() => { setPlaying(false); setPlayhead(0) }}
          className="text-xs px-2 py-1 rounded border border-[#2a2a38] text-zinc-500 hover:text-zinc-300 transition-colors">
          Reset
        </button>
        <span className="text-[11px] font-mono text-zinc-600 ml-auto">{playhead}ms / {totalDuration}ms</span>
      </div>

      <div className="flex-1 flex items-center justify-center bg-[#0a0a0f]">
        <div
          className="bg-violet-600 rounded-xl flex items-center justify-center text-sm font-semibold text-white"
          style={{
            width: 120, height: 80,
            opacity,
            transform,
            willChange: 'transform, opacity',
          }}
        >
          Preview
        </div>
      </div>
    </div>
  )
}
