import React, { useRef } from 'react';
import { Upload, FilePlus, Image as ImageIcon } from 'lucide-react';
import { importService } from '../services/importService';
import { useProjectStore } from '../store/useProjectStore';
import { motion } from 'motion/react';

export const DropZone = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addFrames } = useProjectStore();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newFrames = await importService.processFiles(files);
    addFrames(newFrames);
  };

  return (
    <div 
      onClick={() => fileInputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleFiles(e.dataTransfer.files);
      }}
      className="group relative w-full max-w-2xl h-80 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-6 cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/[0.02] transition-all duration-300"
    >
      <input 
        type="file" 
        multiple 
        ref={fileInputRef} 
        className="hidden" 
        onChange={(e) => handleFiles(e.target.files)} 
        accept="image/*"
      />
      
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-500/10 transition-all duration-500">
          <Upload className="w-8 h-8 text-zinc-500 group-hover:text-blue-500 transition-colors" />
        </div>
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -inset-2 rounded-full border border-blue-500/20 pointer-events-none" 
        />
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">Import Image Sequence</h2>
        <p className="text-sm text-zinc-500 max-w-xs mx-auto">
          Drag and drop your frame sequence here or click to browse files.
        </p>
      </div>

      <div className="flex gap-4 pt-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-white/5 text-[10px] text-zinc-400 font-medium italic">
          <ImageIcon className="w-3 h-3" />
          PNG, JPG, WEBP
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-white/5 text-[10px] text-zinc-400 font-medium italic">
          <FilePlus className="w-3 h-3" />
          Multi-selection supported
        </div>
      </div>
    </div>
  );
};
