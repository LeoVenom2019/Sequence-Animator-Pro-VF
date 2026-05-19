import React from 'react';
import { Play, Pause, Save, Share2, Layers, Settings2, Download, Undo2, Redo2 } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { motion } from 'motion/react';

export const TopBar = ({ onExportClick }: { onExportClick: () => void }) => {
  const { currentProject, isPlaying, setPlaying, undo, redo, historyIndex, history } = useProjectStore();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <header className="h-12 border-b border-zinc-800 bg-[#0f0f0f] flex items-center justify-between px-4 z-50">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold tracking-tight text-sm">Sequence Animator <span className="text-blue-500 font-bold">PRO</span></span>
        </div>
        <div className="h-4 w-px bg-zinc-800 mx-2" />
        <span className="text-xs text-zinc-400 font-medium truncate max-w-[200px]">{currentProject?.name}</span>
        
        <div className="flex items-center gap-1 ml-4">
          <button 
            onClick={undo}
            disabled={!canUndo}
            className={`p-1.5 rounded hover:bg-zinc-800 transition-colors ${canUndo ? 'text-zinc-400' : 'text-zinc-700'}`}
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button 
            onClick={redo}
            disabled={!canRedo}
            className={`p-1.5 rounded hover:bg-zinc-800 transition-colors ${canRedo ? 'text-zinc-400' : 'text-zinc-700'}`}
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={() => setPlaying(!isPlaying)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 transition-colors text-xs font-medium"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          {isPlaying ? 'Pause' : 'Preview'}
        </button>
        
        <div className="h-4 w-px bg-zinc-800 mx-1" />

        <button className="p-1.5 rounded-md hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white">
          <Share2 className="w-4 h-4" />
        </button>
        
        <button 
          onClick={onExportClick}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 transition-all text-xs font-medium text-white shadow-lg shadow-blue-900/20 active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
      </div>
    </header>
  );
};
