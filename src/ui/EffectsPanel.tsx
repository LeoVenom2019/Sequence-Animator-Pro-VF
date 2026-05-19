import React from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { 
  Sun, 
  Contrast, 
  Palette, 
  Thermometer, 
  Wind, 
  Layers, 
  Focus, 
  Aperture,
  Zap,
  Image as ImageIcon
} from 'lucide-react';

export const EffectsPanel = () => {
  const { currentProject, updateSettings, updateColorGrading, updateEffects, applyLookPreset } = useProjectStore();

  if (!currentProject) return null;

  const comp = currentProject.compositions.find(c => c.id === currentProject.activeCompositionId) || currentProject.compositions[0];
  const layer = comp.layers.find(l => l.id === comp.selectedLayerId);

  if (!layer) return (
    <div className="p-8 text-center bg-zinc-900/20 border-b border-zinc-800">
      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Select a layer to apply effects</p>
    </div>
  );

  const { colorGrading, effects } = layer;

  const Slider = ({ label, icon: Icon, value, min, max, step, onChange }: any) => (
    <div className="space-y-1.5 group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-wider group-hover:text-zinc-400 transition-colors">
          <Icon className="w-3 h-3" />
          {label}
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10 min-w-[35px] text-right">
          {value.toFixed(2)}
        </span>
      </div>
      <input 
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
      />
    </div>
  );

  const EffectToggle = ({ label, icon: Icon, enabled, onToggle, children }: any) => (
    <div className={`p-3 rounded-xl border transition-all ${enabled ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-zinc-900/30 border-zinc-800'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${enabled ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-zinc-800 text-zinc-500'}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className={`text-[11px] font-bold uppercase tracking-tight ${enabled ? 'text-emerald-400' : 'text-zinc-400'}`}>{label}</span>
        </div>
        <button 
          onClick={() => onToggle(!enabled)}
          className={`w-8 h-4 rounded-full relative transition-colors ${enabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}
        >
          <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${enabled ? 'right-0.5' : 'left-0.5'}`} />
        </button>
      </div>
      {enabled && <div className="space-y-3 pt-1">{children}</div>}
    </div>
  );

  return (
    <div className="p-4 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between mb-2">
         <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
           <Zap className="w-3 h-3 text-amber-500" />
           FX Master Switch
         </h3>
         <button 
           onClick={() => {
             // We can just toggle an internal local state or add it to project
             // For now, let's just make it a local preview toggle? 
             // Actually, the request mentions "before/after toggle". 
             // I'll add it to the project settings to be persisted.
             updateSettings({ isPreviewFxEnabled: !currentProject.settings.isPreviewFxEnabled });
           }}
           className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all border ${
             currentProject.settings.isPreviewFxEnabled !== false 
               ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' 
               : 'bg-zinc-900 border-zinc-800 text-zinc-500'
           }`}
         >
           {currentProject.settings.isPreviewFxEnabled !== false ? 'FX ON' : 'FX OFF'}
         </button>
      </div>

      {/* Color Grading */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <Palette className="w-3 h-3" />
          Color Grading
        </h3>
        
        <div className="grid grid-cols-1 gap-4 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/50">
          <Slider 
            label="Exposure" 
            icon={Sun} 
            value={colorGrading.exposure} 
            min={-2} max={2} step={0.01}
            onChange={(v: number) => updateColorGrading({ exposure: v })}
          />
          <Slider 
            label="Contrast" 
            icon={Contrast} 
            value={colorGrading.contrast} 
            min={0} max={2} step={0.01}
            onChange={(v: number) => updateColorGrading({ contrast: v })}
          />
          <Slider 
            label="Saturation" 
            icon={Palette} 
            value={colorGrading.saturation} 
            min={0} max={2} step={0.01}
            onChange={(v: number) => updateColorGrading({ saturation: v })}
          />
          <Slider 
            label="Vibrance" 
            icon={Zap} 
            value={colorGrading.vibrance} 
            min={0} max={2} step={0.01}
            onChange={(v: number) => updateColorGrading({ vibrance: v })}
          />
        </div>
      </section>

      {/* Cinematic Effects */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <Layers className="w-3 h-3" />
          Cinematic Effects
        </h3>
        
        <div className="space-y-3">
          <EffectToggle 
            label="Bloom & Glow" 
            icon={Aperture}
            enabled={effects.bloom.enabled}
            onToggle={(v: boolean) => updateEffects({ bloom: { ...effects.bloom, enabled: v } })}
          >
            <Slider 
              label="Intensity" 
              icon={Sun} 
              value={effects.bloom.intensity} 
              min={0} max={1} step={0.01}
              onChange={(val: number) => updateEffects({ bloom: { ...effects.bloom, intensity: val } })}
            />
          </EffectToggle>

          <EffectToggle 
            label="Vignette" 
            icon={Focus}
            enabled={effects.vignette.enabled}
            onToggle={(v: boolean) => updateEffects({ vignette: { ...effects.vignette, enabled: v } })}
          >
            <Slider 
              label="Intensity" 
              icon={Focus} 
              value={effects.vignette.intensity} 
              min={0} max={1} step={0.01}
              onChange={(val: number) => updateEffects({ vignette: { ...effects.vignette, intensity: val } })}
            />
          </EffectToggle>

          <EffectToggle 
            label="Film Grain" 
            icon={Wind}
            enabled={effects.grain.enabled}
            onToggle={(v: boolean) => updateEffects({ grain: { ...effects.grain, enabled: v } })}
          >
            <Slider 
              label="Intensity" 
              icon={Wind} 
              value={effects.grain.intensity} 
              min={0} max={1} step={0.01}
              onChange={(val: number) => updateEffects({ grain: { ...effects.grain, intensity: val } })}
            />
          </EffectToggle>

          <EffectToggle 
            label="Chromatic Aberration" 
            icon={Palette}
            enabled={effects.chromaticAberration.enabled}
            onToggle={(v: boolean) => updateEffects({ chromaticAberration: { ...effects.chromaticAberration, enabled: v } })}
          >
            <Slider 
              label="Offset" 
              icon={Palette} 
              value={effects.chromaticAberration.intensity} 
              min={0} max={5} step={0.1}
              onChange={(val: number) => updateEffects({ chromaticAberration: { ...effects.chromaticAberration, intensity: val } })}
            />
          </EffectToggle>
        </div>
      </section>

      {/* Look Presets */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <ImageIcon className="w-3 h-3" />
          Look Presets
        </h3>
        
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: 'Cinematic warm', color: 'from-orange-500/20' },
            { name: 'Cyberpunk', color: 'from-blue-500/20' },
            { name: 'Noir', color: 'from-white/10' },
            { name: 'Dreamy', color: 'from-purple-500/20' },
          ].map((look) => (
            <button
              key={look.name}
              onClick={() => applyLookPreset(look.name)}
              className={`h-16 rounded-xl border border-zinc-800 bg-gradient-to-br ${look.color} to-transparent flex items-end p-2 hover:border-zinc-700 transition-all group active:scale-95`}
            >
              <span className="text-[10px] font-bold uppercase tracking-tight text-zinc-400 group-hover:text-zinc-200">{look.name}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
