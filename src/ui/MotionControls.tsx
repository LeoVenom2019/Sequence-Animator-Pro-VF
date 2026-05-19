import React from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { Camera, Sparkles, Wind, Navigation, MousePointer2 } from 'lucide-react';

export const MotionControls = () => {
  const { currentProject, applyMotionPreset } = useProjectStore();

  if (!currentProject) return null;

  const presets = [
    { id: 'slow-zoom', name: 'Cinematic Slow Zoom', icon: Camera, color: 'text-blue-400' },
    { id: 'dramatic-pan', name: 'Dramatic Pan', icon: Navigation, color: 'text-purple-400' },
    { id: 'subtle-parallax', name: 'Subtle Parallax', icon: Wind, color: 'text-emerald-400' },
    { id: 'floating-drift', name: 'Floating Motion', icon: Sparkles, color: 'text-amber-400' },
  ];

  return (
    <section className="p-4 space-y-4">
      <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
        <Sparkles className="w-3 h-3" />
        Motion Presets
      </h3>

      <div className="grid grid-cols-1 gap-2">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => applyMotionPreset(preset.id as any)}
            className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all group active:scale-[0.98]"
          >
            <div className={`p-2 rounded-lg bg-zinc-900 border border-zinc-800 group-hover:border-zinc-700 transition-colors ${preset.color}`}>
              <preset.icon className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-semibold text-zinc-200">{preset.name}</div>
              <div className="text-[9px] text-zinc-500 uppercase tracking-tighter">Instant Generation</div>
            </div>
          </button>
        ))}
      </div>
      
      <div className="pt-4 border-t border-zinc-800/50">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider">Camera Engine</h4>
          <span className="text-[9px] text-emerald-500 font-mono bg-emerald-500/10 px-1 rounded">ACTIVE</span>
        </div>
        
        <div className="space-y-3">
          {/* We'll add Camera Drift and other continuous motion settings here */}
          <div className="text-[10px] text-zinc-500 italic">
            Automated camera smoothing and drift engine is processing frames in real-time.
          </div>
        </div>
      </div>
    </section>
  );
};
