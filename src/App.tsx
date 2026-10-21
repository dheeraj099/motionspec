import { useState } from 'react'
import { useMotionStore } from './store/useMotionStore'
import Timeline from './components/Timeline'
import Preview from './components/Preview'
import TrackInspector from './components/TrackInspector'
import ExportPanel from './components/ExportPanel'
import { Film } from 'lucide-react'

type RightTab = 'inspector' | 'export'

export default function App() {
  const [rightTab, setRightTab] = useState<RightTab>('inspector')
  const { totalDuration, setTotalDuration } = useMotionStore()

  return (
    <div className="h-screen bg-[#0c0c10] text-[#e4e4f0] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 h-12 bg-[#111118] border-b border-[#1f1f2e] shrink-0">
        <div className="flex items-center gap-2">
          <Film size={16} className="text-violet-400" />
          <span className="font-semibold text-sm">motionspec</span>
        </div>
        <span className="text-xs text-zinc-600">CSS / Framer Motion animation timeline editor</span>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-zinc-600">Total:</label>
          <input
            type="number"
            value={totalDuration}
            min={100}
            max={10000}
            step={100}
            onChange={(e) => setTotalDuration(Number(e.target.value))}
            className="w-20 bg-[#1c1c26] border border-[#2a2a38] rounded px-2 py-1 text-xs font-mono text-zinc-300 outline-none focus:border-violet-500/50"
          />
          <span className="text-[11px] text-zinc-600">ms</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Top: Preview + Export tabs */}
          <div className="h-52 shrink-0 border-b border-[#1f1f2e] overflow-hidden">
            <Preview />
          </div>

          {/* Timeline */}
          <div className="flex-1 overflow-auto">
            <Timeline />
          </div>
        </main>

        {/* Right panel */}
        <aside className="w-64 shrink-0 bg-[#111118] border-l border-[#1f1f2e] flex flex-col overflow-hidden">
          <div className="flex border-b border-[#1f1f2e] shrink-0">
            {(['inspector', 'export'] as RightTab[]).map((t) => (
              <button key={t} onClick={() => setRightTab(t)}
                className={`flex-1 py-2 text-[11px] capitalize transition-colors ${
                  rightTab === t ? 'text-violet-300 border-b border-violet-500' : 'text-zinc-600 hover:text-zinc-400'
                }`}>
                {t === 'inspector' ? 'Inspector' : 'Export Code'}
              </button>
            ))}
          </div>

          {rightTab === 'inspector' ? <TrackInspector /> : <ExportPanel />}
        </aside>
      </div>
    </div>
  )
}
