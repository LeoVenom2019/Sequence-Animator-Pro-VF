import React, { useState } from 'react';
import { Settings2, List, Filter, Trash2, GripVertical, Clock, Sparkles, Layers, Camera, Type } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { formatFileSize } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

import { TransformControls } from './TransformControls';
import { MotionControls } from './MotionControls';
import { EffectsPanel } from './EffectsPanel';
import { LayerPanel } from './LayerPanel';
import { CameraPanel } from './CameraPanel';
import { TypographyPanel } from './TypographyPanel';
import { AIPanel } from './AIPanel';

export const Sidebar = () => {
  const { currentProject, updateSettings, removeFrame } = useProjectStore();
  const [activeTab, setActiveTab] = useState<'inspector' | 'layers' | 'camera' | 'motion' | 'effects' | 'typography' | 'ai'>('layers');

  if (!currentProject) return null;

  const comp = currentProject.compositions.find(c => c.id === currentProject.activeCompositionId) || currentProject.compositions[0];
  const selectedLayer = comp.layers.find(l => l.id === comp.selectedLayerId);

  return (
    <aside className="w-80 border-l border-zinc-800 bg-[#0f0f0f] flex flex-col z-40">
      {/* Tabs */}
      <div className="flex border-b border-zinc-800 bg-black/40">
        <button 
          onClick={() => setActiveTab('layers')}
          className={`flex-1 py-3 px-1 text-[10px] font-bold uppercase tracking-tight transition-all flex flex-col items-center gap-1 relative ${activeTab === 'layers' ? 'text-purple-400 bg-purple-400/5' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Layers</span>
          {activeTab === 'layers' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />}
        </button>
        <button 
          onClick={() => setActiveTab('inspector')}
          className={`flex-1 py-3 px-1 text-[10px] font-bold uppercase tracking-tight transition-all flex flex-col items-center gap-1 relative ${activeTab === 'inspector' ? 'text-blue-400 bg-blue-400/5' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Inspector</span>
          {activeTab === 'inspector' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
        </button>
        <button 
          onClick={() => setActiveTab('camera')}
          className={`flex-1 py-3 px-1 text-[10px] font-bold uppercase tracking-tight transition-all flex flex-col items-center gap-1 relative ${activeTab === 'camera' ? 'text-amber-400 bg-amber-400/5' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Camera</span>
          {activeTab === 'camera' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />}
        </button>
        <button 
          onClick={() => setActiveTab('motion')}
          className={`flex-1 py-3 px-1 text-[10px] font-bold uppercase tracking-tight transition-all flex flex-col items-center gap-1 relative ${activeTab === 'motion' ? 'text-emerald-400 bg-emerald-400/5' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Motion</span>
          {activeTab === 'motion' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
        </button>
        <button 
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-3 px-1 text-[10px] font-bold uppercase tracking-tight transition-all flex flex-col items-center gap-1 relative ${activeTab === 'ai' ? 'text-blue-400 bg-blue-400/5' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Suite</span>
          {activeTab === 'ai' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
        </button>
        {selectedLayer?.type === 'text' && (
          <button 
            onClick={() => setActiveTab('typography')}
            className={`flex-1 py-3 px-1 text-[10px] font-bold uppercase tracking-tight transition-all flex flex-col items-center gap-1 relative ${activeTab === 'typography' ? 'text-blue-400 bg-blue-400/5' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Style</span>
            {activeTab === 'typography' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
          </button>
        )}
        <button 
          onClick={() => setActiveTab('effects')}
          className={`flex-1 py-3 px-1 text-[10px] font-bold uppercase tracking-tight transition-all flex flex-col items-center gap-1 relative ${activeTab === 'effects' ? 'text-rose-400 bg-rose-400/5' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Post FX</span>
          {activeTab === 'effects' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0a0a0a]">
        <AnimatePresence mode="wait">
          {activeTab === 'layers' && (
            <motion.div
              key="layers"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              <LayerPanel />
            </motion.div>
          )}

          {activeTab === 'inspector' && (
            <motion.div
              key="inspector"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
            >
              <TransformControls />
              {/* Settings Group */}
              <section className="p-4 space-y-4 border-b border-zinc-800 bg-[#0c0c0c]/50">
                <div className="space-y-1">
                  <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sequence Settings</h3>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 font-mono">FPS</label>
                      <input 
                        type="number" 
                        value={currentProject.settings.fps}
                        onChange={(e) => updateSettings({ fps: parseInt(e.target.value) })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs focus:border-blue-500 outline-none transition-colors font-mono"
                      />
                    </div>
                    <div className="space-y-1.5 flex items-center justify-center pt-5">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={currentProject.settings.loop}
                          onChange={(e) => updateSettings({ loop: e.target.checked })}
                          className="w-3 h-3 rounded bg-zinc-900 border-zinc-800 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-[10px] text-zinc-400 group-hover:text-zinc-200 transition-colors uppercase font-bold tracking-wider">Loop</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-400 font-mono">Resolution</label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      value={currentProject.settings.width}
                      onChange={(e) => updateSettings({ width: parseInt(e.target.value) })}
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs focus:border-blue-500 outline-none font-mono"
                    />
                    <span className="text-zinc-600 text-xs self-center">×</span>
                    <input 
                      type="number" 
                      value={currentProject.settings.height}
                      onChange={(e) => updateSettings({ height: parseInt(e.target.value) })}
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs focus:border-blue-500 outline-none font-mono"
                    />
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'camera' && (
            <motion.div
              key="camera"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              <CameraPanel />
            </motion.div>
          )}

          {activeTab === 'ai' && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              <AIPanel />
            </motion.div>
          )}

          {activeTab === 'typography' && (
            <motion.div
              key="typography"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              <TypographyPanel />
            </motion.div>
          )}

          {activeTab === 'motion' && (
            <motion.div
              key="motion"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
            >
              <MotionControls />
            </motion.div>
          )}

          {activeTab === 'effects' && (
            <motion.div
              key="effects"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
            >
              <EffectsPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
};

