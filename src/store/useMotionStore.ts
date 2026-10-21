import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type EasingType = 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring' | 'bounce'

export interface Keyframe {
  id: string
  time: number  // 0–1 normalized within track duration
  value: number // 0–100 for visual properties, used for display
  label: string
}

export interface Track {
  id: string
  name: string
  property: string  // e.g., 'opacity', 'x', 'y', 'scale', 'rotate'
  color: string
  keyframes: Keyframe[]
  easing: EasingType
  duration: number  // ms
}

export interface MotionStore {
  tracks: Track[]
  selectedTrackId: string | null
  selectedKeyframeId: string | null
  playhead: number  // 0–totalDuration
  isPlaying: boolean
  totalDuration: number  // ms
  exportFormat: 'framer' | 'css'

  addTrack: (property: string) => void
  removeTrack: (id: string) => void
  updateTrack: (id: string, patch: Partial<Track>) => void
  selectTrack: (id: string | null) => void

  addKeyframe: (trackId: string, time: number) => void
  updateKeyframe: (trackId: string, keyframeId: string, patch: Partial<Keyframe>) => void
  removeKeyframe: (trackId: string, keyframeId: string) => void
  selectKeyframe: (id: string | null) => void

  setPlayhead: (t: number) => void
  setPlaying: (v: boolean) => void
  setTotalDuration: (ms: number) => void
  setExportFormat: (f: 'framer' | 'css') => void
}

const PROPERTY_COLORS: Record<string, string> = {
  opacity: '#7c3aed',
  x:       '#2563eb',
  y:       '#0891b2',
  scale:   '#16a34a',
  rotate:  '#d97706',
  scaleX:  '#dc2626',
  scaleY:  '#be185d',
}

const PROPERTY_DEFAULTS: Record<string, { label: string; defaultStart: number; defaultEnd: number }> = {
  opacity:  { label: 'Opacity', defaultStart: 0, defaultEnd: 100 },
  x:        { label: 'X (px)', defaultStart: -40, defaultEnd: 0 },
  y:        { label: 'Y (px)', defaultStart: -20, defaultEnd: 0 },
  scale:    { label: 'Scale', defaultStart: 80, defaultEnd: 100 },
  rotate:   { label: 'Rotate (deg)', defaultStart: -10, defaultEnd: 0 },
  scaleX:   { label: 'Scale X', defaultStart: 80, defaultEnd: 100 },
  scaleY:   { label: 'Scale Y', defaultStart: 80, defaultEnd: 100 },
}

let idCounter = 10

function uid() { return String(++idCounter) }

const INITIAL_TRACKS: Track[] = [
  {
    id: '1',
    name: 'Opacity',
    property: 'opacity',
    color: PROPERTY_COLORS.opacity,
    easing: 'ease-out',
    duration: 600,
    keyframes: [
      { id: 'kf1', time: 0, value: 0, label: '0%' },
      { id: 'kf2', time: 1, value: 100, label: '100%' },
    ],
  },
  {
    id: '2',
    name: 'Move Y',
    property: 'y',
    color: PROPERTY_COLORS.y,
    easing: 'ease-out',
    duration: 600,
    keyframes: [
      { id: 'kf3', time: 0, value: -20, label: '-20px' },
      { id: 'kf4', time: 1, value: 0, label: '0px' },
    ],
  },
  {
    id: '3',
    name: 'Scale',
    property: 'scale',
    color: PROPERTY_COLORS.scale,
    easing: 'spring',
    duration: 800,
    keyframes: [
      { id: 'kf5', time: 0, value: 80, label: '0.8' },
      { id: 'kf6', time: 1, value: 100, label: '1' },
    ],
  },
]

export const useMotionStore = create<MotionStore>()(
  persist(
    (set) => ({
      tracks: INITIAL_TRACKS,
      selectedTrackId: null,
      selectedKeyframeId: null,
      playhead: 0,
      isPlaying: false,
      totalDuration: 1000,
      exportFormat: 'framer',

      addTrack: (property) => {
        const def = PROPERTY_DEFAULTS[property] ?? { label: property, defaultStart: 0, defaultEnd: 100 }
        const id = uid()
        const track: Track = {
          id,
          name: def.label,
          property,
          color: PROPERTY_COLORS[property] ?? '#6366f1',
          easing: 'ease-out',
          duration: 600,
          keyframes: [
            { id: uid(), time: 0, value: def.defaultStart, label: String(def.defaultStart) },
            { id: uid(), time: 1, value: def.defaultEnd, label: String(def.defaultEnd) },
          ],
        }
        set((s) => ({ tracks: [...s.tracks, track], selectedTrackId: id }))
      },

      removeTrack: (id) =>
        set((s) => ({ tracks: s.tracks.filter((t) => t.id !== id), selectedTrackId: null })),

      updateTrack: (id, patch) =>
        set((s) => ({ tracks: s.tracks.map((t) => t.id === id ? { ...t, ...patch } : t) })),

      selectTrack: (id) => set({ selectedTrackId: id, selectedKeyframeId: null }),

      addKeyframe: (trackId, time) => {
        const id = uid()
        set((s) => ({
          tracks: s.tracks.map((t) => {
            if (t.id !== trackId) return t
            // Interpolate value from neighbors
            const sorted = [...t.keyframes].sort((a, b) => a.time - b.time)
            const prev = sorted.filter((k) => k.time <= time).pop()
            const next = sorted.find((k) => k.time > time)
            let value = 50
            if (prev && next) {
              const frac = (time - prev.time) / (next.time - prev.time)
              value = Math.round(prev.value + frac * (next.value - prev.value))
            } else if (prev) {
              value = prev.value
            } else if (next) {
              value = next.value
            }
            return { ...t, keyframes: [...t.keyframes, { id, time, value, label: String(value) }] }
          }),
          selectedKeyframeId: id,
        }))
      },

      updateKeyframe: (trackId, keyframeId, patch) =>
        set((s) => ({
          tracks: s.tracks.map((t) =>
            t.id !== trackId ? t : {
              ...t,
              keyframes: t.keyframes.map((k) => k.id === keyframeId ? { ...k, ...patch } : k),
            }
          ),
        })),

      removeKeyframe: (trackId, keyframeId) =>
        set((s) => ({
          tracks: s.tracks.map((t) =>
            t.id !== trackId ? t : {
              ...t,
              keyframes: t.keyframes.filter((k) => k.id !== keyframeId),
            }
          ),
          selectedKeyframeId: null,
        })),

      selectKeyframe: (id) => set({ selectedKeyframeId: id }),
      setPlayhead: (t) => set({ playhead: t }),
      setPlaying: (v) => set({ isPlaying: v }),
      setTotalDuration: (ms) => set({ totalDuration: ms }),
      setExportFormat: (f) => set({ exportFormat: f }),
    }),
    { name: 'motionspec-store' }
  )
)
