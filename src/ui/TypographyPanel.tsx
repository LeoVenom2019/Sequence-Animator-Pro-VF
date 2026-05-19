import React from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { 
  Type, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Sparkles, 
  Zap, 
  Palette,
  Maximize2,
  ListFilter,
  Layers
} from 'lucide-react';

export const TypographyPanel = () => {
  const { currentProject, currentFrameIndex, updateLayer, addKeyframe } = useProjectStore();
  
  const comp = currentProject?.compositions.find(c => c.id === currentProject.activeCompositionId) || currentProject?.compositions[0];
  const layer = comp?.layers.find(l => l.id === comp.selectedLayerId);

  if (!layer || layer.type !== 'text') return null;

  const ControlGroup = ({ label, prop, icon: Icon, min, max, step, unit = '' }: any) => {
    const value = (layer as any)[prop];
    const track = layer.animations?.find(a => a.property === prop);
    const hasKeyframe = track?.keyframes.some(k => k.frame === currentFrameIndex);

    return (
      <div className="space-y-1.5 group">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 group-hover:text-zinc-300 transition-colors">
            <Icon className="w-3 h-3" />
            {label}
          </label>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-blue-400 bg-blue-500/5 px-1.5 py-0.5 rounded border border-blue-500/10">
              {typeof value === 'number' ? value.toFixed(step < 1 ? 1 : 0) : value}{unit}
            </span>
            <button 
              onClick={() => addKeyframe(prop, value)}
              className={`p-1 rounded transition-colors ${hasKeyframe ? 'text-blue-400 bg-blue-500/20' : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800'}`}
            >
              <Zap className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
        <input 
          type="range"
          min={min}
          max={max}
          step={step}
          value={value || 0}
          onChange={(e) => updateLayer(layer.id, { [prop]: parseFloat(e.target.value) })}
          className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
        />
      </div>
    );
  };

  const textPresets = [
    { 
      name: 'Cinematic Title', 
      style: { 
        fontSize: 180, fontWeight: 700, letterSpacing: 20, color: '#ffffff', 
        shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.8)', blur: 0, 
        characterReveal: 1
      } 
    },
    { 
      name: 'Cyber HUD', 
      style: { 
        fontSize: 80, fontWeight: 400, letterSpacing: 4, color: '#22d3ee', 
        outlineWidth: 2, outlineColor: '#0891b2', shadowBlur: 10, shadowColor: '#22d3ee55'
      } 
    },
    { 
      name: 'Eldritch', 
      style: { 
        fontSize: 220, fontWeight: 800, letterSpacing: -10, color: '#ef4444', 
        shadowOffsetX: 10, shadowOffsetY: 10, shadowBlur: 30, shadowColor: 'rgba(0,0,0,0.9)'
      } 
    },
    { 
      name: 'Vibrant Neo', 
      style: { 
        fontSize: 120, fontWeight: 900, color: '#fde047', outlineWidth: 8, outlineColor: '#b91c1c'
      } 
    },
  ];

  const applyMotionPreset = (type: string) => {
    const lastFrame = (layer.duration || 100) - 1;
    if (type === 'typewriter') {
      addKeyframe('characterReveal', 0, 0);
      addKeyframe('characterReveal', 1, lastFrame);
    } else if (type === 'blur-reveal') {
      addKeyframe('blur', 40, 0);
      addKeyframe('opacity', 0, 0);
      addKeyframe('blur', 0, 30);
      addKeyframe('opacity', 1, 30);
    } else if (type === 'dramatic-entry') {
      addKeyframe('scale', 3, 0);
      addKeyframe('opacity', 0, 0);
      addKeyframe('blur', 20, 0);
      addKeyframe('scale', 1, 40);
      addKeyframe('opacity', 1, 40);
      addKeyframe('blur', 0, 40);
    }
  };

  const fonts = [
    'Inter',
    'Playfair Display',
    'Space Grotesk',
    'JetBrains Mono',
    'Bebas Neue',
    'Montserrat'
  ];

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* ... header ... */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/20 flex items-center justify-between">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <Type className="w-3 h-3" />
          Pro Text Engine
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Content Section */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest block">Text Content</label>
          <textarea 
            value={layer.text}
            onChange={(e) => updateLayer(layer.id, { text: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 min-h-[80px] resize-none font-mono"
            placeholder="Type your cinematic text..."
          />
        </div>

        {/* Font Family */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest block">Font Family</label>
          <select 
            value={layer.fontFamily}
            onChange={(e) => updateLayer(layer.id, { fontFamily: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {fonts.map(f => (
              <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
            ))}
          </select>
        </div>

        {/* Motion Section */}
        <div className="space-y-3 pt-2 border-t border-zinc-900">
           <h4 className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-2">
            <Zap className="w-3 h-3 text-emerald-500" />
            Motion Typography
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {[
              { name: 'Writer', id: 'typewriter' },
              { name: 'Blur', id: 'blur-reveal' },
              { name: 'Impact', id: 'dramatic-entry' }
            ].map(preset => (
              <button
                key={preset.id}
                onClick={() => applyMotionPreset(preset.id)}
                className="p-2 text-center bg-zinc-900 hover:bg-emerald-500/10 border border-zinc-800 hover:border-emerald-500/30 rounded text-[9px] text-zinc-500 hover:text-emerald-400 font-bold uppercase transition-all"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Basic Style */}
        <div className="space-y-4 pt-2 border-t border-zinc-900">
          <h4 className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-2">
            <Palette className="w-3 h-3" />
            Basic Style
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: AlignLeft, value: 'left' },
              { icon: AlignCenter, value: 'center' },
              { icon: AlignRight, value: 'right' }
            ].map(btn => (
              <button
                key={btn.value}
                onClick={() => updateLayer(layer.id, { textAlign: btn.value as any })}
                className={`p-2 rounded flex justify-center border transition-all ${layer.textAlign === btn.value ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
              >
                <btn.icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest block">Fill Color</label>
                <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                  <input 
                    type="color"
                    value={layer.color || '#ffffff'}
                    onChange={(e) => updateLayer(layer.id, { color: e.target.value })}
                    className="w-8 h-8 bg-transparent border-none rounded cursor-pointer"
                  />
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">{layer.color}</span>
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest block">Stroke</label>
                <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                  <input 
                    type="color"
                    value={layer.outlineColor || '#000000'}
                    onChange={(e) => updateLayer(layer.id, { outlineColor: e.target.value })}
                    className="w-8 h-8 bg-transparent border-none rounded cursor-pointer"
                  />
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">{layer.outlineColor}</span>
                </div>
             </div>
          </div>

          <ControlGroup label="Font Size" prop="fontSize" icon={Maximize2} min={10} max={1000} step={1} />
          <ControlGroup label="Font Weight" prop="fontWeight" icon={Type} min={100} max={900} step={100} />
          <ControlGroup label="Line Height" prop="lineHeight" icon={ListFilter} min={0.5} max={3} step={0.1} />
          <ControlGroup label="Letter Spacing" prop="letterSpacing" icon={ListFilter} min={-50} max={200} step={1} />
          <ControlGroup label="Reveal" prop="characterReveal" icon={Zap} min={0} max={1} step={0.01} />
        </div>

        {/* Effects */}
        <div className="pt-4 border-t border-zinc-900 space-y-4">
          <h4 className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-2">
            <Layers className="w-3 h-3" />
            Shadow & Blur
          </h4>
          <ControlGroup label="Shadow Blur" prop="shadowBlur" icon={Sparkles} min={0} max={100} step={1} />
          <ControlGroup label="Manual Blur" prop="blur" icon={Sparkles} min={0} max={100} step={1} />
        </div>

        {/* Style Presets */}
        <div className="pt-4 border-t border-zinc-900 space-y-3 pb-8">
          <h4 className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-2">
            <Palette className="w-3 h-3" />
            Style Presets
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {textPresets.map(preset => (
              <button
                key={preset.name}
                onClick={() => updateLayer(layer.id, preset.style)}
                className="p-3 text-left bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-all group"
              >
                <div className="text-[9px] font-bold text-zinc-400 group-hover:text-blue-400 transition-colors uppercase tracking-tight">{preset.name}</div>
                <div className="text-[8px] text-zinc-600 uppercase mt-0.5">Apply Style</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
