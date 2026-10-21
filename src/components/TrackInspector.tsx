import { useMotionStore } from '../store/useMotionStore'
import type { EasingType } from '../store/useMotionStore'

const EASINGS: EasingType[] = ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'spring', 'bounce']

export default function TrackInspector() {
  const { tracks, selectedTrackId, selectedKeyframeId, updateTrack, updateKeyframe } = useMotionStore()

  const track = tracks.find((t) => t.id === selectedTrackId)
  const keyframe = track?.keyframes.find((k) => k.id === selectedKeyframeId)

  if (!track) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[11px] text-zinc-700 text-center px-4 leading-relaxed">
          Select a track or keyframe<br />to edit its properties
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-4">
      {/* Track properties */}
      <div className="space-y-3">
        <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Track</p>

        <div>
          <label className="text-[10px] text-zinc-600 block mb-1">Name</label>
          <input
            value={track.name}
            onChange={(e) => updateTrack(track.id, { name: e.target.value })}
            className="w-full bg-[#1c1c26] border border-[#2a2a38] rounded px-2 py-1.5 text-xs text-[#e4e4f0] outline-none focus:border-violet-500/50"
          />
        </div>

        <div>
          <label className="text-[10px] text-zinc-600 block mb-1">Duration (ms)</label>
          <input
            type="number"
            value={track.duration}
            min={100}
            max={5000}
            step={50}
            onChange={(e) => updateTrack(track.id, { duration: Number(e.target.value) })}
            className="w-full bg-[#1c1c26] border border-[#2a2a38] rounded px-2 py-1.5 text-xs font-mono text-[#e4e4f0] outline-none focus:border-violet-500/50"
          />
        </div>

        <div>
          <label className="text-[10px] text-zinc-600 block mb-1">Easing</label>
          <div className="grid grid-cols-2 gap-1">
            {EASINGS.map((e) => (
              <button key={e} onClick={() => updateTrack(track.id, { easing: e })}
                className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                  track.easing === e
                    ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
                    : 'border-[#2a2a38] text-zinc-500 hover:text-zinc-300'
                }`}>
                {e}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Keyframe properties */}
      {keyframe && (
        <div className="space-y-3 pt-3 border-t border-[#1f1f2e]">
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Keyframe</p>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#1c1c26] border border-[#2a2a38] rounded p-2">
              <p className="text-[10px] text-zinc-600">Time</p>
              <p className="text-sm font-mono font-bold text-[#e4e4f0]">
                {Math.round(keyframe.time * track.duration)}ms
              </p>
            </div>
            <div className="bg-[#1c1c26] border border-[#2a2a38] rounded p-2">
              <p className="text-[10px] text-zinc-600">Position</p>
              <p className="text-sm font-mono font-bold text-[#e4e4f0]">
                {Math.round(keyframe.time * 100)}%
              </p>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-zinc-600 block mb-1">Value</label>
            <input
              type="number"
              value={keyframe.value}
              onChange={(e) => {
                const v = Number(e.target.value)
                updateKeyframe(track.id, keyframe.id, { value: v, label: String(v) })
              }}
              className="w-full bg-[#1c1c26] border border-[#2a2a38] rounded px-2 py-1.5 text-xs font-mono text-[#e4e4f0] outline-none focus:border-violet-500/50"
            />
            <p className="text-[10px] text-zinc-700 mt-1">
              {track.property === 'opacity' || track.property.startsWith('scale') ? '0 = 0%, 100 = 100%' :
               track.property === 'rotate' ? 'degrees' : 'pixels'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
