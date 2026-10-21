import { useState } from 'react'
import { useMotionStore } from '../store/useMotionStore'
import type { EasingType } from '../store/useMotionStore'
import { Copy, Check } from 'lucide-react'

const CSS_EASING: Record<EasingType, string> = {
  'linear':      'linear',
  'ease':        'ease',
  'ease-in':     'ease-in',
  'ease-out':    'ease-out',
  'ease-in-out': 'ease-in-out',
  'spring':      'cubic-bezier(0.34,1.56,0.64,1)',
  'bounce':      'cubic-bezier(0.68,-0.55,0.27,1.55)',
}

const FRAMER_EASING: Record<EasingType, string> = {
  'linear':      '"linear"',
  'ease':        '"ease"',
  'ease-in':     '"easeIn"',
  'ease-out':    '"easeOut"',
  'ease-in-out': '"easeInOut"',
  'spring':      '{ type: "spring", stiffness: 300, damping: 24 }',
  'bounce':      '{ type: "spring", stiffness: 500, damping: 15 }',
}

function mapValue(property: string, raw: number): string {
  if (property === 'opacity') return String(raw / 100)
  if (property === 'scale' || property === 'scaleX' || property === 'scaleY') return String(raw / 100)
  return String(raw)
}

function generateCss(tracks: ReturnType<typeof useMotionStore.getState>['tracks'], totalDuration: number): string {
  if (tracks.length === 0) return '/* No tracks defined */'

  const keyframesBlocks: string[] = []
  const animations: string[] = []

  for (const track of tracks) {
    const name = `anim-${track.property}-${track.id}`
    const sorted = [...track.keyframes].sort((a, b) => a.time - b.time)
    const block = [
      `@keyframes ${name} {`,
      ...sorted.map((kf) => {
        const pct = Math.round(kf.time * 100)
        const val = mapValue(track.property, kf.value)
        const prop = track.property === 'x' ? 'translateX' :
          track.property === 'y' ? 'translateY' :
          track.property === 'rotate' ? 'rotate' :
          track.property === 'scale' ? 'scale' :
          track.property === 'scaleX' ? 'scaleX' :
          track.property === 'scaleY' ? 'scaleY' : null
        const isTransform = prop !== null
        const cssVal = isTransform
          ? `  transform: ${prop}(${val}${track.property === 'x' || track.property === 'y' ? 'px' : track.property === 'rotate' ? 'deg' : ''});`
          : `  ${track.property}: ${val};`
        return `  ${pct}% {\n${cssVal}\n  }`
      }),
      '}',
    ].join('\n')
    keyframesBlocks.push(block)

    const durationS = (track.duration / 1000).toFixed(2) + 's'
    const totalS = (totalDuration / 1000).toFixed(2) + 's'
    animations.push(`animation: ${name} ${durationS} ${CSS_EASING[track.easing]} forwards`)
    void totalS
  }

  return [
    ...keyframesBlocks,
    '',
    '.element {',
    animations.map((a) => `  ${a};`).join('\n'),
    '}',
  ].join('\n')
}

function generateFramer(tracks: ReturnType<typeof useMotionStore.getState>['tracks']): string {
  if (tracks.length === 0) return '// No tracks defined'

  const initial: string[] = []
  const animate: string[] = []
  const transitions: string[] = []

  for (const track of tracks) {
    const sorted = [...track.keyframes].sort((a, b) => a.time - b.time)
    if (sorted.length < 2) continue

    const first = mapValue(track.property, sorted[0].value)
    const last = mapValue(track.property, sorted[sorted.length - 1].value)

    initial.push(`  ${track.property}: ${first}`)
    animate.push(`  ${track.property}: ${last}`)
    transitions.push(`  ${track.property}: {`)
    transitions.push(`    duration: ${track.duration / 1000},`)
    transitions.push(`    ease: ${FRAMER_EASING[track.easing]},`)
    transitions.push(`  }`)
  }

  return [
    'import { motion } from "framer-motion"',
    '',
    '<motion.div',
    '  initial={{',
    ...initial.map((l) => `    ${l.trim()},`),
    '  }}',
    '  animate={{',
    ...animate.map((l) => `    ${l.trim()},`),
    '  }}',
    '  transition={{',
    ...transitions.map((l) => `  ${l}`),
    '  }}',
    '/>',
  ].join('\n')
}

export default function ExportPanel() {
  const { tracks, totalDuration, exportFormat, setExportFormat } = useMotionStore()
  const [copied, setCopied] = useState(false)

  const code = exportFormat === 'css'
    ? generateCss(tracks, totalDuration)
    : generateFramer(tracks)

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1f1f2e] shrink-0">
        <div className="flex rounded border border-[#2a2a38] overflow-hidden text-[11px]">
          {(['framer', 'css'] as const).map((f) => (
            <button key={f} onClick={() => setExportFormat(f)}
              className={`px-3 py-1 transition-colors ${exportFormat === f ? 'bg-violet-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
              {f === 'framer' ? 'Framer Motion' : 'CSS @keyframes'}
            </button>
          ))}
        </div>
        <button onClick={() => { void handleCopy() }}
          className="ml-auto flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border border-[#2a2a38] text-zinc-400 hover:text-zinc-200 transition-colors">
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <pre className="flex-1 overflow-auto p-3 text-[11px] font-mono text-zinc-300 leading-relaxed bg-[#0c0c10]/40">
        <code>{code}</code>
      </pre>
    </div>
  )
}
