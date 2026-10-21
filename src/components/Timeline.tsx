import { useRef } from 'react'
import { useMotionStore } from '../store/useMotionStore'
import type { Track } from '../store/useMotionStore'
import { Plus } from 'lucide-react'

const TRACK_H = 44
const LABEL_W = 140
const RULER_W = 600

function TrackRow({ track }: { track: Track }) {
  const { selectedTrackId, selectedKeyframeId, selectTrack, selectKeyframe, addKeyframe, removeKeyframe, removeTrack, totalDuration } = useMotionStore()
  const rowRef = useRef<HTMLDivElement>(null)

  const scale = RULER_W / totalDuration
  const trackW = track.duration * scale

  function timeToX(t: number) { return t * trackW }
  function xToTime(x: number) { return Math.max(0, Math.min(1, x / trackW)) }

  const isSelected = selectedTrackId === track.id
  const sorted = [...track.keyframes].sort((a, b) => a.time - b.time)

  function handleAreaClick(e: React.MouseEvent) {
    e.stopPropagation()
    selectTrack(track.id)
    const rect = rowRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    if (x < 0 || x > trackW) return
    const t = Math.round(xToTime(x) * 20) / 20
    addKeyframe(track.id, t)
  }

  return (
    <div
      className={`flex border-b border-[#1f1f2e] transition-colors ${isSelected ? 'bg-[#1c1c26]/60' : 'hover:bg-[#111118]/40'}`}
      style={{ height: TRACK_H }}
    >
      {/* Label */}
      <div
        className="shrink-0 flex items-center px-3 gap-2 cursor-pointer border-r border-[#1f1f2e]"
        style={{ width: LABEL_W }}
        onClick={() => selectTrack(isSelected ? null : track.id)}
      >
        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: track.color }} />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#e4e4f0] leading-none truncate">{track.name}</p>
          <p className="text-[10px] text-zinc-600 font-mono">{track.easing} · {track.duration}ms</p>
        </div>
        {isSelected && (
          <button
            onClick={(e) => { e.stopPropagation(); removeTrack(track.id) }}
            className="text-zinc-700 hover:text-red-400 transition-colors shrink-0 text-[10px]"
          >
            ✕
          </button>
        )}
      </div>

      {/* Keyframe area */}
      <div
        ref={rowRef}
        className="flex-1 relative overflow-hidden"
        onClick={handleAreaClick}
        style={{ cursor: 'crosshair' }}
      >
        {/* Track lane */}
        <div
          className="absolute top-1/2 -translate-y-px h-0.5 rounded opacity-25"
          style={{ left: 0, width: trackW, backgroundColor: track.color }}
        />

        {/* Connecting lines */}
        {sorted.length > 1 && sorted.slice(0, -1).map((kf, i) => {
          const x1 = timeToX(kf.time)
          const x2 = timeToX(sorted[i + 1].time)
          return (
            <div key={kf.id + '-ln'}
              className="absolute top-1/2 -translate-y-px h-px"
              style={{ left: x1, width: x2 - x1, backgroundColor: track.color, opacity: 0.5 }}
            />
          )
        })}

        {/* Keyframes */}
        {track.keyframes.map((kf) => {
          const x = timeToX(kf.time)
          const isSel = selectedKeyframeId === kf.id
          return (
            <div
              key={kf.id}
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border cursor-pointer transition-all z-10 ${isSel ? 'scale-125' : 'hover:scale-110'}`}
              style={{
                left: x,
                backgroundColor: track.color,
                borderColor: isSel ? '#ffffff80' : track.color,
                opacity: isSel ? 1 : 0.85,
              }}
              onClick={(e) => { e.stopPropagation(); selectKeyframe(isSel ? null : kf.id) }}
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); removeKeyframe(track.id, kf.id) }}
              title={`${kf.label} at ${Math.round(kf.time * 100)}% — right-click to remove`}
            >
              {isSel && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] text-white/60 whitespace-nowrap rotate-[-45deg] pointer-events-none">
                  {Math.round(kf.time * track.duration)}ms
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const RULER_TICKS = 10

export default function Timeline() {
  const { tracks, totalDuration, playhead, setPlayhead, addTrack } = useMotionStore()

  const PROPERTIES = ['opacity', 'x', 'y', 'scale', 'rotate', 'scaleX', 'scaleY']
  const scale = RULER_W / totalDuration
  const playheadX = playhead * scale

  function handleRulerClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    setPlayhead(Math.round(Math.max(0, Math.min(totalDuration, x / scale))))
  }

  return (
    <div className="flex flex-col">
      {/* Add track bar */}
      <div className="flex items-center px-3 py-1.5 bg-[#0c0c10]/40 border-b border-[#1f1f2e] gap-2 flex-wrap">
        <span className="text-[10px] text-zinc-600 uppercase tracking-wider shrink-0">Add</span>
        {PROPERTIES.map((p) => (
          <button key={p} onClick={() => addTrack(p)}
            className="text-[10px] px-2 py-0.5 rounded border border-[#2a2a38] text-zinc-500 hover:text-violet-300 hover:border-violet-500/40 transition-colors flex items-center gap-0.5">
            <Plus size={9} /> {p}
          </button>
        ))}
      </div>

      {/* Ruler header */}
      <div className="flex">
        <div className="shrink-0 h-7 border-b border-r border-[#1f1f2e] bg-[#111118] flex items-center px-3"
          style={{ width: LABEL_W }}>
          <span className="text-[10px] text-zinc-600">Property</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <div
            className="h-7 border-b border-[#1f1f2e] bg-[#0c0c10]/60 relative cursor-col-resize"
            style={{ width: RULER_W }}
            onClick={handleRulerClick}
          >
            {Array.from({ length: RULER_TICKS + 1 }, (_, i) => i).map((i) => (
              <div key={i} className="absolute top-0 flex flex-col items-center"
                style={{ left: `${(i / RULER_TICKS) * 100}%` }}>
                <div className="w-px h-2 bg-[#3a3a50] mt-1" />
                <span className="text-[9px] text-zinc-700 mt-0.5">
                  {Math.round((i / RULER_TICKS) * totalDuration)}ms
                </span>
              </div>
            ))}
            <div className="absolute top-0 h-full w-px bg-violet-500 z-10 pointer-events-none"
              style={{ left: playheadX }} />
          </div>
        </div>
      </div>

      {/* Track rows */}
      <div className="relative">
        {tracks.length === 0 && (
          <div className="h-16 flex items-center justify-center text-xs text-zinc-700">
            Add a track above to start animating
          </div>
        )}
        {tracks.map((track) => (
          <TrackRow key={track.id} track={track} />
        ))}
        {/* Playhead */}
        <div className="absolute top-0 bottom-0 w-px bg-violet-500/40 pointer-events-none z-20"
          style={{ left: LABEL_W + playheadX }} />
      </div>
    </div>
  )
}
