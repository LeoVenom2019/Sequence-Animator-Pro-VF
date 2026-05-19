import React from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { Move, Maximize, RotateCw, Ghost, Target, Zap, ZapOff, Diamond, Wind } from 'lucide-react';
import { getPropertyValue } from '../lib/animation';

export const TransformControls = () => {
  const { currentProject, currentFrameIndex, updateTransform, addKeyframe, removeKeyframe, toggleAutoKey } = useProjectStore();

  if (!currentProject) return null;

  const comp = currentProject.compositions.find(c => c.id === currentProject.activeCompositionId) || currentProject.compositions[0];
  const layer = comp.layers.find(l => l.id === comp.selectedLayerId);
  const isAutoKeyEnabled = currentProject.settings.isAutoKeyEnabled;

  if (!layer) return (
    <div className="p-8 text-center bg-zinc-900/20 border-b border-zinc-800">
      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Select a layer to edit transforms</p>
    </div>
  );

  const { transform, animations } = layer;

  const getTrack = (prop: string) => animations?.find(a => a.property === prop);
  const hasKeyframeAtCurrent = (prop: string) => 
    getTrack(prop)?.keyframes.some(k => k.frame === currentFrameIndex);

  const ControlGroup = ({ label, prop, icon: Icon, value, min, max, step, unit = "" }: any) => {
    const interpolatedValue = getPropertyValue(getTrack(prop), currentFrameIndex, value);
    const hasKf = hasKeyframeAtCurrent(prop);

    return (
      <div className="space-y-2 group/control">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
            <Icon className="w-3 h-3 text-zinc-600" />
            {label}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                if (hasKf) {
                  const kf = getTrack(prop)?.keyframes.find(k => k.frame === currentFrameIndex);
                  if (kf) removeKeyframe(prop, kf.id);
                } else {
                  addKeyframe(prop, interpolatedValue);
                }
              }}
              className={`p-1 rounded transition-colors ${hasKf ? 'text-blue-400 bg-blue-500/10' : 'text-zinc-600 hover:text-zinc-400'}`}
            >
              <Diamond className={`w-3 h-3 ${hasKf ? 'fill-current' : ''}`} />
            </button>
            <span className="text-[10px] font-mono text-blue-400 bg-blue-500/5 px-1.5 py-0.5 rounded border border-blue-500/10 min-w-[40px] text-right">
              {interpolatedValue.toFixed(prop === 'scale' || prop === 'opacity' ? 2 : 0)}{unit}
            </span>
          </div>
        </div>
        <input 
          type="range"
          min={min}
          max={max}
          step={step}
          value={interpolatedValue}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            updateTransform({ [prop]: val });
          }}
          className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>
    );
  };

  return (
    <section className="p-4 space-y-6 border-b border-zinc-800 bg-[#0c0c0c]">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <Target className="w-3 h-3" />
          Transform & Motion
        </h3>
        
        <button 
          onClick={toggleAutoKey}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-bold transition-all border ${
            isAutoKeyEnabled 
              ? 'bg-red-500/10 border-red-500/50 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' 
              : 'bg-zinc-900 border-zinc-800 text-zinc-500'
          }`}
        >
          {isAutoKeyEnabled ? <Zap className="w-3 h-3 fill-current" /> : <ZapOff className="w-3 h-3" />}
          AUTO-KEY
        </button>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <ControlGroup 
            label="PosX" 
            prop="x"
            icon={Move} 
            value={transform.x} 
            min={-500} 
            max={500} 
            step={1} 
          />
          <ControlGroup 
            label="PosY" 
            prop="y"
            icon={Move} 
            value={transform.y} 
            min={-500} 
            max={500} 
            step={1} 
          />
        </div>

        <ControlGroup 
          label="Scale" 
          prop="scale"
          icon={Maximize} 
          value={transform.scale} 
          min={0.1} 
          max={5} 
          step={0.01} 
        />

        <ControlGroup 
          label="Rotation" 
          prop="rotation"
          icon={RotateCw} 
          value={transform.rotation} 
          min={-180} 
          max={180} 
          step={1} 
          unit="°"
        />

        <ControlGroup 
          label="Opacity" 
          prop="opacity"
          icon={Ghost} 
          value={transform.opacity} 
          min={0} 
          max={1} 
          step={0.01} 
        />

        <ControlGroup 
          label="Parallax Depth" 
          prop="parallaxDepth"
          icon={Wind} 
          value={layer.parallaxDepth || 0} 
          min={-1000} 
          max={1000} 
          step={1} 
        />
      </div>

      <button 
        onClick={() => {
          updateTransform({ x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 });
          // Optionally clear keyframes? User request didn't specify.
        }}
        className="w-full py-1.5 rounded border border-zinc-800 bg-zinc-900/50 text-[9px] font-bold text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-all uppercase tracking-widest"
      >
        Reset Base state
      </button>
    </section>
  );
};
