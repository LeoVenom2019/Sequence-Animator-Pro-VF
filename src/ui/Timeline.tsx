import React, { useRef, useState, useEffect } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { Play, Pause, SkipBack, SkipForward, Repeat, ZoomIn, ZoomOut, Diamond } from 'lucide-react';
import { motion } from 'motion/react';

export const Timeline = () => {
  const { currentProject, currentFrameIndex, setCurrentFrame, isPlaying, setPlaying, selectLayer } = useProjectStore();
  const timelineRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  if (!currentProject) return null;

  const comp = currentProject.compositions.find(c => c.id === currentProject.activeCompositionId) || currentProject.compositions[0];
  if (!comp) return null;

  const duration = comp.duration;
  const frameWidth = 10 * zoom; 
  const totalWidth = duration * frameWidth;
  const playheadPos = currentFrameIndex * frameWidth;

  const handleScrub = (e: React.MouseEvent | React.TouchEvent | MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
    const position = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
    const frameIndex = Math.floor(position * (duration - 1));
    setCurrentFrame(frameIndex);
  };

  // Keep playhead in view
  useEffect(() => {
    if (scrollRef.current && isPlaying) {
      const scroll = scrollRef.current;
      const left = playheadPos - scroll.clientWidth / 2;
      scroll.scrollTo({ left, behavior: 'instant' });
    }
  }, [playheadPos, isPlaying]);

  return (
    <footer className="h-44 border-t border-zinc-800 bg-[#0f0f0f] flex flex-col z-50">
      {/* Controls */}
      <div className="h-10 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900/20">
        <div className="flex items-center gap-6">
          <div className="text-xl font-mono text-blue-400 tracking-tighter w-24">
            {currentFrameIndex.toString().padStart(4, '0')}
            <span className="text-zinc-600 text-sm ml-1 select-none">/ {comp.duration.toString().padStart(4, '0')}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setCurrentFrame(0)}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-all active:scale-90"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>
            <button 
              onClick={() => setPlaying(!isPlaying)}
              className="p-2 text-white bg-blue-600 hover:bg-blue-500 rounded-full transition-all active:scale-90 shadow-lg shadow-blue-900/30"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
            <button 
              onClick={() => setCurrentFrame(comp.duration - 1)}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-all active:scale-90"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center gap-1 bg-zinc-900/50 rounded-md border border-zinc-800 p-0.5">
             <button onClick={() => setZoom(Math.max(0.5, zoom - 0.2))} className="p-1 text-zinc-500 hover:text-zinc-200"><ZoomOut className="w-3 h-3" /></button>
             <div className="w-8 text-[10px] text-center text-zinc-500 font-mono">{(zoom * 100).toFixed(0)}%</div>
             <button onClick={() => setZoom(Math.min(3, zoom + 0.2))} className="p-1 text-zinc-500 hover:text-zinc-200"><ZoomIn className="w-3 h-3" /></button>
           </div>
           
           <button className="flex items-center gap-2 px-3 py-1 rounded bg-zinc-900 text-blue-400 text-[10px] font-bold border border-blue-500/20 active:opacity-70 transition-opacity">
             <Repeat className="w-3 h-3" />
             LOOP ON
           </button>
        </div>
      </div>

      {/* Scrub Bar / Tracks */}
      <div ref={scrollRef} className="flex-1 relative bg-black/40 group overflow-x-auto overflow-y-auto custom-scrollbar">
        <div 
          ref={timelineRef}
          className="relative min-h-full" 
          style={{ width: `${totalWidth}px` }}
          onMouseDown={(e) => {
            if ((e.target as HTMLElement).closest('.layer-track')) return; // Don't scrub if clicking track elements if needed
            handleScrub(e);
            const onMouseMove = (ev: MouseEvent) => handleScrub(ev);
            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
          }}
        >
          {/* Timeline Grid Background */}
          <div className="absolute inset-0 pointer-events-none opacity-5">
            {Array.from({ length: Math.ceil(duration / 10) }).map((_, i) => (
              <div key={i} className="absolute inset-y-0 w-px bg-white" style={{ left: `${i * 10 * frameWidth}px` }} />
            ))}
          </div>

          <div className="pt-6 pb-2 space-y-1">
            {/* Camera Track */}
            <div className="relative h-6 w-full bg-amber-500/5 border-y border-amber-500/10 mb-2">
              <div className="absolute inset-0 flex items-center px-4 pointer-events-none">
                <span className="text-[9px] font-bold text-amber-500/50 uppercase tracking-widest">Main Camera</span>
              </div>
              <div className="absolute inset-x-0 top-1 h-4 pointer-events-none">
                {comp.camera.animations?.map((track) => (
                  track.keyframes.map((kf) => (
                    <div 
                      key={kf.id}
                      className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rotate-45 bg-amber-400 border border-amber-200 z-30 shadow-[0_0_5px_rgba(251,191,36,0.8)]"
                      style={{ left: `${kf.frame * frameWidth}px`, marginLeft: '-0.75px' }}
                    />
                  ))
                ))}
              </div>
            </div>

            {comp.layers.map((layer) => (
              <div 
                key={layer.id} 
                className={`layer-track relative h-6 w-full transition-colors border-y border-transparent cursor-pointer ${comp.selectedLayerId === layer.id ? 'bg-blue-500/10 border-blue-500/20' : 'hover:bg-zinc-800/30'}`}
                onClick={(e) => { e.stopPropagation(); selectLayer(layer.id); }}
              >
                {/* Layer Bar (Duration) */}
                <div 
                  className={`absolute h-4 top-1 rounded-sm border opacity-80 ${
                    layer.type === 'sequence' ? 'bg-purple-500/20 border-purple-500/50' : 
                    layer.type === 'text' ? 'bg-amber-500/20 border-amber-500/50' :
                    'bg-emerald-500/20 border-emerald-500/50'
                  }`}
                  style={{ 
                    left: `${(layer.startTime || 0) * frameWidth}px`, 
                    width: `${(layer.duration || duration) * frameWidth}px` 
                  }}
                >
                  <div className="px-2 text-[8px] font-bold text-zinc-400 truncate uppercase tracking-tighter pt-0.5">
                    {layer.name}
                  </div>
                </div>

                {/* Keyframes Track */}
                <div className="absolute inset-x-0 top-1 h-4 pointer-events-none">
                  {layer.animations?.map((track) => (
                    track.keyframes.map((kf) => (
                      <div 
                        key={kf.id}
                        className={`absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rotate-45 border z-30 transition-all ${comp.selectedLayerId === layer.id ? 'bg-blue-400 border-blue-200 shadow-[0_0_5px_rgba(96,165,250,0.8)]' : 'bg-zinc-600 border-zinc-500 opacity-30'}`}
                        style={{ left: `${kf.frame * frameWidth}px`, marginLeft: '-0.75px' }}
                      />
                    ))
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Playhead */}
          <motion.div 
            className="absolute top-0 bottom-0 w-[2px] bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.8)] z-40 pointer-events-none"
            style={{ left: `${playheadPos}px` }}
            transition={{ type: 'spring', bounce: 0, duration: 0.1 }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-4 bg-blue-400 rounded-b shadow-lg flex items-center justify-center">
              <div className="w-[1px] h-2 bg-blue-200/50" />
            </div>
          </motion.div>

          {/* Markers / Grid */}
          <div className="absolute top-0 left-0 right-0 h-4 flex items-end px-1 pointer-events-none border-b border-white/5 bg-zinc-900/40 z-50">
             {Array.from({ length: Math.ceil(duration / 5) }).map((_, i) => (
               <div key={i} className="absolute h-2 w-px bg-zinc-700" style={{ left: `${i * 5 * frameWidth}px` }}>
                 <span className="text-[8px] text-zinc-600 absolute -top-4 left-1/2 -translate-x-1/2 font-mono tabular-nums">{i * 5}</span>
               </div>
             ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
