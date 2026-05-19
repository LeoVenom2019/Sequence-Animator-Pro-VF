import React from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { 
  Camera, 
  Maximize, 
  RotateCcw, 
  Move, 
  Focus, 
  Layers, 
  Wind,
  Activity,
  Zap,
  Eye
} from 'lucide-react';
import { motion } from 'motion/react';

export const CameraPanel = () => {
  const { currentProject, currentFrameIndex, updateCamera, addCameraKeyframe, updateComposition } = useProjectStore();
  
  if (!currentProject) return null;
  const comp = currentProject.compositions.find(c => c.id === currentProject.activeCompositionId) || currentProject.compositions[0];
  const { camera } = comp;

  const Slider = ({ label, icon: Icon, value, min, max, step, property, unit = '' }: any) => {
    const track = camera.animations.find(a => a.property === property);
    const hasKeyframe = track?.keyframes.some(k => k.frame === currentFrameIndex);

    return (
      <div className="space-y-1.5 group">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 group-hover:text-zinc-300 transition-colors">
            <Icon className="w-3 h-3" />
            {label}
          </label>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10">
              {value?.toFixed(property === 'zoom' ? 2 : 0)}{unit}
            </span>
            <button 
              onClick={() => addCameraKeyframe(property, value)}
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
          value={value}
          onChange={(e) => updateCamera({ [property]: parseFloat(e.target.value) })}
          className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all"
        />
      </div>
    );
  };

  const cameraPresets = [
    { name: 'Cinematic Push', x: 0, y: 0, zoom: 1.2, rotation: 0 },
    { name: 'Dramatic Dolly', x: 0, y: 0, zoom: 0.8, rotation: 5 },
    { name: 'Floating Drift', x: 50, y: 30, zoom: 1.05, rotation: -2 },
    { name: 'Epic Reveal', x: 0, y: 200, zoom: 1, rotation: 0 },
  ];

  const applyPreset = (preset: any) => {
    const lastFrame = comp.duration - 1;
    
    // Clear existing animations if any or just overwrite
    // For now we just add keyframes at 0 and last
    const props = ['x', 'y', 'zoom', 'rotation'];
    
    // Start State
    addCameraKeyframe('x', 0, 0);
    addCameraKeyframe('y', 0, 0);
    addCameraKeyframe('zoom', 1, 0);
    addCameraKeyframe('rotation', 0, 0);

    // End State
    addCameraKeyframe('x', preset.x, lastFrame);
    addCameraKeyframe('y', preset.y, lastFrame);
    addCameraKeyframe('zoom', preset.zoom, lastFrame);
    addCameraKeyframe('rotation', preset.rotation, lastFrame);

    updateCamera({ x: 0, y: 0, zoom: 1, rotation: 0 }); // reset current view to start frame if needed, or just let interpolation handle it
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/20 flex items-center justify-between">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <Camera className="w-3 h-3" />
          Advanced Camera
        </h3>
        <button 
          onClick={() => updateComposition(comp.id, { showDepthMap: !comp.showDepthMap })}
          className={`p-1.5 rounded text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all ${comp.showDepthMap ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
        >
          <Eye className="w-3 h-3" />
          Depth Map
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="space-y-4">
          <Slider label="Position X" icon={Move} value={camera.x} min={-1000} max={1000} step={1} property="x" />
          <Slider label="Position Y" icon={Move} value={camera.y} min={-1000} max={1000} step={1} property="y" />
          <Slider label="Camera Zoom" icon={Maximize} value={camera.zoom} min={0.1} max={5} step={0.01} property="zoom" />
          <Slider label="Rotation" icon={RotateCcw} value={camera.rotation} min={-180} max={180} step={1} property="rotation" unit="°" />
        </div>

        <div className="pt-4 border-t border-zinc-900 space-y-4">
          <h4 className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Perspective & Depth</h4>
          <Slider label="Global Parallax" icon={Layers} value={camera.depthIntensity} min={0} max={2} step={0.01} property="depthIntensity" />
          <Slider label="Focus Distance" icon={Focus} value={camera.focusDistance} min={-1000} max={1000} step={1} property="focusDistance" />
          <Slider label="Focal Range" icon={Activity} value={camera.focalRange} min={10} max={1000} step={1} property="focalRange" />
        </div>

        <div className="pt-4 border-t border-zinc-900 space-y-4">
          <h4 className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Dynamics</h4>
          <Slider label="Cam Smoothing" icon={Wind} value={camera.smoothing} min={0} max={1} step={0.01} property="smoothing" />
          <Slider label="Motion Shake" icon={Activity} value={camera.shake} min={0} max={100} step={1} property="shake" />
        </div>

        <div className="pt-4 border-t border-zinc-900 space-y-3">
          <h4 className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Camera Presets</h4>
          <div className="grid grid-cols-2 gap-2">
            {cameraPresets.map(preset => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className="p-2 text-left bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-all group"
              >
                <div className="text-[10px] font-bold text-zinc-400 group-hover:text-emerald-400 transition-colors">{preset.name}</div>
                <div className="text-[8px] text-zinc-600 uppercase mt-0.5">Auto-Gen Keyframes</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
