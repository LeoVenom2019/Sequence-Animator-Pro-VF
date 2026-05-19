import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Settings, Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { exportService } from '../services/exportService';
import { useJobStore } from '../store/useJobStore';
import { ExportFormat } from '../types';
import { getPropertyValue } from '../lib/animation';
import { applyPreProcessing, applyPostProcessing } from '../lib/effects';

interface ExportPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

import { EXPORT_PRESETS } from '../constants';

export const ExportPanel = ({ isOpen, onClose }: ExportPanelProps) => {
  const { currentProject, updateSettings } = useProjectStore();
  const { addJob, updateJob } = useJobStore();
  const [format, setFormat] = useState<ExportFormat>('mp4');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !currentProject) return null;
  const comp = currentProject.compositions.find(c => c.id === currentProject.activeCompositionId) || currentProject.compositions[0];

  const applyPreset = (preset: typeof EXPORT_PRESETS[0]) => {
    setFormat(preset.format);
    updateSettings({
      fps: preset.fps,
      width: preset.width,
      height: preset.height
    });
  };

  const renderCompositeFrame = async (comp: any, frameIndex: number, width: number, height: number): Promise<string> => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = comp.backgroundColor || '#000000';
    ctx.fillRect(0, 0, width, height);

    const camera = comp.camera;
    const getCamTrack = (prop: string) => camera.animations?.find((a: any) => a.property === prop);
    const camX = getPropertyValue(getCamTrack('x'), frameIndex, camera.x);
    const camY = getPropertyValue(getCamTrack('y'), frameIndex, camera.y);
    const camZoom = getPropertyValue(getCamTrack('zoom'), frameIndex, camera.zoom);
    const camRot = getPropertyValue(getCamTrack('rotation'), frameIndex, camera.rotation);
    const camFocus = getPropertyValue(getCamTrack('focusDistance'), frameIndex, camera.focusDistance);
    const camDepthIntensity = getPropertyValue(getCamTrack('depthIntensity'), frameIndex, camera.depthIntensity);
    const focalRange = camera.focalRange || 200;

    for (const layer of [...comp.layers].reverse()) {
      if (!layer.visible) continue;

      ctx.save();
      const getTrack = (prop: string) => layer.animations?.find((a: any) => a.property === prop);
      const lX = getPropertyValue(getTrack('x'), frameIndex, layer.transform.x);
      const lY = getPropertyValue(getTrack('y'), frameIndex, layer.transform.y);
      const lScale = getPropertyValue(getTrack('scale'), frameIndex, layer.transform.scale);
      const lRot = getPropertyValue(getTrack('rotation'), frameIndex, layer.transform.rotation);
      const lOpacity = getPropertyValue(getTrack('opacity'), frameIndex, layer.transform.opacity) * layer.opacity;
      
      // Advanced Parallax
      const layerDepth = layer.parallaxDepth || 0;
      const parallaxFactor = (layerDepth / 500) * camDepthIntensity;
      const pX = -camX * parallaxFactor;
      const pY = -camY * parallaxFactor;

      // Blur
      const distanceToFocus = Math.abs(layerDepth - camFocus);
      const blurAmount = Math.max(0, (distanceToFocus - focalRange / 2) / 20);

      ctx.globalCompositeOperation = (layer.blendMode as GlobalCompositeOperation) || 'source-over';
      ctx.globalAlpha = lOpacity;

      // Camera Transform
      ctx.translate(width / 2, height / 2);
      ctx.scale(camZoom, camZoom);
      ctx.rotate((camRot * Math.PI) / 180);
      ctx.translate(-camX, -camY);

      // Layer Transform + Parallax
      ctx.translate(lX + pX, lY + pY);
      ctx.rotate((lRot * Math.PI) / 180);
      ctx.scale(lScale, lScale);

      if (layer.type === 'sequence' && layer.frames?.length > 0) {
        const layerFrameIndex = frameIndex - (layer.startTime || 0);
        if (layerFrameIndex >= 0 && layerFrameIndex < layer.frames.length) {
          const frame = layer.frames[layerFrameIndex];
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = frame.url;
          await new Promise((resolve) => {
            img.onload = () => {
              const imgAspect = img.width / img.height;
              const canvasAspect = width / height;
              let drawWidth, drawHeight;
              if (imgAspect > canvasAspect) {
                drawWidth = width;
                drawHeight = width / imgAspect;
              } else {
                drawHeight = height;
                drawWidth = height * imgAspect;
              }

              ctx.save();
              applyPreProcessing(ctx, layer.colorGrading);
              if (blurAmount > 0) ctx.filter = (ctx.filter === 'none' ? '' : ctx.filter + ' ') + `blur(${blurAmount}px)`;
              ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
              applyPostProcessing(ctx, canvas, layer.effects);
              ctx.restore();
              resolve(null);
            };
            img.onerror = () => resolve(null);
          });
        }
      } else if (layer.type === 'solid') {
        ctx.fillStyle = layer.solidColor || '#ff0000';
        ctx.fillRect(-width / 2, -height / 2, width, height);
      } else if (layer.type === 'text') {
        const fontSize = getPropertyValue(getTrack('fontSize'), frameIndex, layer.fontSize || 100);
        const letterSpacing = getPropertyValue(getTrack('letterSpacing'), frameIndex, layer.letterSpacing || 0);
        const characterReveal = getPropertyValue(getTrack('characterReveal'), frameIndex, layer.characterReveal ?? 1);
        const blur = getPropertyValue(getTrack('blur'), frameIndex, layer.blur || 0);
        const lineHeight = layer.lineHeight || 1.2;
        
        ctx.font = `${layer.fontWeight || 400} ${fontSize}px ${layer.fontFamily || 'Inter'}`;
        ctx.textAlign = (layer.textAlign as any) || 'center';
        ctx.textBaseline = 'middle';
        
        if (blur > 0) ctx.filter = `blur(${blur}px)`;

        const fullText = layer.text || '';
        const revealedCount = Math.floor(fullText.length * characterReveal);
        const displayText = fullText.slice(0, revealedCount);

        // Shadow
        const shadowBlur = getPropertyValue(getTrack('shadowBlur'), frameIndex, layer.shadowBlur || 0);
        if (shadowBlur > 0) {
          ctx.shadowColor = layer.shadowColor || 'rgba(0,0,0,0.5)';
          ctx.shadowBlur = shadowBlur;
          ctx.shadowOffsetX = getPropertyValue(getTrack('shadowOffsetX'), frameIndex, layer.shadowOffsetX || 0);
          ctx.shadowOffsetY = getPropertyValue(getTrack('shadowOffsetY'), frameIndex, layer.shadowOffsetY || 0);
        }

        const lines = displayText.split('\n');
        
        lines.forEach((line: string, i: number) => {
          const yOffset = (i - (lines.length - 1) / 2) * fontSize * lineHeight;
          
          ctx.fillStyle = layer.color || 'white';
          
          if (letterSpacing !== 0) {
             let xOffset = 0;
             if (ctx.textAlign === 'center') {
               const totalLineWidth = ctx.measureText(line).width + (line.length - 1) * letterSpacing;
               xOffset = -totalLineWidth / 2;
             } else if (ctx.textAlign === 'right') {
               const totalLineWidth = ctx.measureText(line).width + (line.length - 1) * letterSpacing;
               xOffset = -totalLineWidth;
             }
             
             ctx.textAlign = 'left';
             [...line].forEach((char) => {
               ctx.fillText(char, xOffset, yOffset);
               if (layer.outlineWidth && layer.outlineWidth > 0) {
                 ctx.strokeStyle = layer.outlineColor || 'black';
                 ctx.lineWidth = layer.outlineWidth;
                 ctx.strokeText(char, xOffset, yOffset);
               }
               xOffset += ctx.measureText(char).width + letterSpacing;
             });
             ctx.textAlign = (layer.textAlign as any) || 'center';
          } else {
             ctx.fillText(line, 0, yOffset);
             if (layer.outlineWidth && layer.outlineWidth > 0) {
               ctx.strokeStyle = layer.outlineColor || 'black';
               ctx.lineWidth = layer.outlineWidth * lScale;
               ctx.strokeText(line, 0, yOffset);
             }
          }
        });

        ctx.filter = 'none';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
      ctx.restore();
    }

    return canvas.toDataURL('image/png');
  };

  const handleExport = async () => {
    setIsExporting(true);
    const internalJobId = addJob(format, currentProject.settings);
    
    const comp = currentProject.compositions.find(c => c.id === currentProject.activeCompositionId) || currentProject.compositions[0];
    const duration = comp.duration || 24;
    const { width, height } = currentProject.settings;

    try {
      const compositeFrames: string[] = [];
      for (let i = 0; i < duration; i++) {
        const frameData = await renderCompositeFrame(comp, i, width, height);
        compositeFrames.push(frameData);
        updateJob(internalJobId, { progress: Math.round((i / duration) * 20) }); // First 20% is rendering
      }

      const serverJobId = await exportService.startExport(compositeFrames, currentProject.settings, format);
      
      // Start polling
      const poll = setInterval(async () => {
        const status = await exportService.getJobStatus(serverJobId);
        updateJob(internalJobId, { 
          status: status.status, 
          progress: status.progress,
          error: status.error,
          downloadUrl: status.status === 'completed' ? exportService.getDownloadUrl(serverJobId) : undefined
        });

        if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
          clearInterval(poll);
          if (status.status === 'completed') setIsExporting(false);
        }
      }, 1000);

    } catch (err: any) {
      updateJob(internalJobId, { status: 'failed', error: err.message });
      setIsExporting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-[#111111] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Export Media</h2>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Creator Presets</label>
              <div className="grid grid-cols-2 gap-2">
                {EXPORT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:border-blue-500/50 hover:bg-zinc-800 transition-all text-left group"
                  >
                    <div className="text-[10px] font-bold text-zinc-300 group-hover:text-blue-400 transition-colors uppercase tracking-tight">{preset.name}</div>
                    <div className="text-[9px] text-zinc-500 mt-1 line-clamp-1">{preset.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Output Format</label>
              <div className="grid grid-cols-3 gap-2">
                {(['mp4', 'gif', 'webp', 'png-sequence', 'sprite-sheet'] as ExportFormat[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
                      format === f 
                        ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Resolution</span>
                <span className="text-xs font-mono text-zinc-200">{currentProject.settings.width} × {currentProject.settings.height}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Frames</span>
                <span className="text-xs font-mono text-zinc-200">{comp.duration}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Output FPS</span>
                <span className="text-xs font-mono text-zinc-200">{currentProject.settings.fps}</span>
              </div>
            </div>

            <button
              onClick={handleExport}
              disabled={isExporting}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                isExporting 
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-900/20 active:scale-[0.98]'
              }`}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : 'Start Render'}
            </button>
          </div>

          <div className="p-4 bg-zinc-900/30 border-t border-zinc-800 text-[10px] text-zinc-500 text-center italic">
            Media will be processed in a background worker.
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
