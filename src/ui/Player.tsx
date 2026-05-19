import React, { useRef, useEffect } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { motion } from 'motion/react';
import { getPropertyValue } from '../lib/animation';
import { applyPreProcessing, applyPostProcessing } from '../lib/effects';

export const Player = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { currentProject, currentFrameIndex, isPlaying, setCurrentFrame } = useProjectStore();
  const lastTimeRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const comp = currentProject?.compositions.find(c => c.id === currentProject.activeCompositionId) || currentProject?.compositions[0];

  // High-performance render loop
  const renderRequestRef = useRef<number>(0);

  useEffect(() => {
    if (!isPlaying || !currentProject) return;

    const fps = currentProject.settings.fps || 24;
    const frameInterval = 1000 / fps;

    const animate = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;

      accumulatorRef.current += deltaTime;

      if (accumulatorRef.current >= frameInterval) {
        setCurrentFrame(currentFrameIndex + 1);
        accumulatorRef.current = 0;
      }

      renderRequestRef.current = requestAnimationFrame(animate);
    };

    renderRequestRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(renderRequestRef.current);
      lastTimeRef.current = 0;
      accumulatorRef.current = 0;
    };
  }, [isPlaying, currentProject?.settings.fps, currentFrameIndex, setCurrentFrame]);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentProject) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const comp = currentProject.compositions.find(c => c.id === currentProject.activeCompositionId) || currentProject.compositions[0];
    if (!comp) return;

    const isFxEnabled = currentProject.settings.isPreviewFxEnabled !== false;
    const camera = comp.camera;

    const render = async () => {
      ctx.fillStyle = comp.backgroundColor || '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Camera Interpolation
      const getCamTrack = (prop: string) => camera.animations?.find(a => a.property === prop);
      const camX = getPropertyValue(getCamTrack('x'), currentFrameIndex, camera.x);
      const camY = getPropertyValue(getCamTrack('y'), currentFrameIndex, camera.y);
      const camZoom = getPropertyValue(getCamTrack('zoom'), currentFrameIndex, camera.zoom);
      const camRot = getPropertyValue(getCamTrack('rotation'), currentFrameIndex, camera.rotation);
      const camFocus = getPropertyValue(getCamTrack('focusDistance'), currentFrameIndex, camera.focusDistance);
      const camDepthIntensity = getPropertyValue(getCamTrack('depthIntensity'), currentFrameIndex, camera.depthIntensity);
      const focalRange = camera.focalRange || 200;

      for (const layer of [...comp.layers].reverse()) {
        if (!layer.visible) continue;
        console.log("Rendering layer", layer.name);
        ctx.save();
        
        const getTrack = (prop: string) => layer.animations?.find(a => a.property === prop);
        const lX = getPropertyValue(getTrack('x'), currentFrameIndex, layer.transform.x);
        const lY = getPropertyValue(getTrack('y'), currentFrameIndex, layer.transform.y);
        const lScale = getPropertyValue(getTrack('scale'), currentFrameIndex, layer.transform.scale);
        const lRot = getPropertyValue(getTrack('rotation'), currentFrameIndex, layer.transform.rotation);
        const lOpacity = getPropertyValue(getTrack('opacity'), currentFrameIndex, layer.transform.opacity) * layer.opacity;

        // Advanced Parallax
        const layerDepth = layer.parallaxDepth || 0;
        const parallaxFactor = (layerDepth / 500) * camDepthIntensity;
        const pX = -camX * parallaxFactor;
        const pY = -camY * parallaxFactor;

        // Focus Blur logic
        const distanceToFocus = Math.abs(layerDepth - camFocus);
        const blurAmount = Math.max(0, (distanceToFocus - focalRange / 2) / 20);

        if (comp.showDepthMap) {
          const depthVal = Math.floor(((layerDepth + 1000) / 2000) * 255);
          ctx.fillStyle = `rgb(${depthVal}, ${depthVal}, ${depthVal})`;
          ctx.globalAlpha = 1;
        } else {
          ctx.globalCompositeOperation = (layer.blendMode as GlobalCompositeOperation) || 'source-over';
          ctx.globalAlpha = lOpacity;
        }

        // Apply Camera Stage
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(camZoom, camZoom);
        ctx.rotate((camRot * Math.PI) / 180);
        ctx.translate(-camX, -camY);

        // Apply Layer Stage
        ctx.translate(lX + pX, lY + pY);
        ctx.rotate((lRot * Math.PI) / 180);
        ctx.scale(lScale, lScale);

        if (layer.type === 'sequence' && layer.frames && layer.frames.length > 0) {
          const duration = layer.duration || comp.duration;
          const layerFrameIndex = currentFrameIndex - (layer.startTime || 0);
          
          if (layerFrameIndex >= 0 && layerFrameIndex < duration) {
            const numFrames = layer.frames.length;
            
            // Calculate float virtual index
            const virtualIndex = duration > 1 
              ? (layerFrameIndex / (duration - 1)) * (numFrames - 1)
              : 0;
              
            const indexA = Math.floor(virtualIndex);
            const indexB = Math.min(numFrames - 1, indexA + 1);
            const blendFactor = virtualIndex - indexA;

            const frameA = layer.frames[indexA];
            const frameB = layer.frames[indexB];
            
            // Retrieve or create cached image instances for both frames
            let imgA = imageCacheRef.current.get(frameA.id);
            if (!imgA) {
              imgA = new Image();
              imgA.src = frameA.url;
              imageCacheRef.current.set(frameA.id, imgA);
            }
            
            let imgB = imageCacheRef.current.get(frameB.id);
            if (!imgB) {
              imgB = new Image();
              imgB.src = frameB.url;
              imageCacheRef.current.set(frameB.id, imgB);
            }

            // Wait for both images to be loaded
            if (!imgA.complete) {
              await new Promise((resolve) => {
                imgA!.onload = () => resolve(null);
                imgA!.onerror = () => resolve(null);
              });
            }
            if (!imgB.complete) {
              await new Promise((resolve) => {
                imgB!.onload = () => resolve(null);
                imgB!.onerror = () => resolve(null);
              });
            }

            const imgAspect = imgA.width / imgA.height;
            const canvasAspect = canvas.width / canvas.height;
            let drawWidth, drawHeight;
            if (imgAspect > canvasAspect) {
              drawWidth = canvas.width;
              drawHeight = canvas.width / imgAspect;
            } else {
              drawHeight = canvas.height;
              drawWidth = canvas.height * imgAspect;
            }

            // Create or reuse offscreen canvas for localized effects
            let offscreenCanvas = offscreenCanvasRef.current;
            if (!offscreenCanvas) {
              offscreenCanvas = document.createElement('canvas');
              offscreenCanvasRef.current = offscreenCanvas;
            }
            offscreenCanvas.width = drawWidth;
            offscreenCanvas.height = drawHeight;

            const oCtx = offscreenCanvas.getContext('2d');
            if (oCtx) {
              oCtx.clearRect(0, 0, drawWidth, drawHeight);
              oCtx.save();

              // Apply color grading and focus blur onto the local offscreen canvas
              if (isFxEnabled && !comp.showDepthMap) {
                applyPreProcessing(oCtx, layer.colorGrading);
                if (blurAmount > 0) {
                  oCtx.filter = (oCtx.filter === 'none' ? '' : oCtx.filter + ' ') + `blur(${blurAmount}px)`;
                }
              }

              // Draw blended images onto local offscreen canvas
              if (indexA === indexB) {
                oCtx.drawImage(imgA, 0, 0, drawWidth, drawHeight);
              } else {
                oCtx.globalAlpha = 1 - blendFactor;
                oCtx.drawImage(imgA, 0, 0, drawWidth, drawHeight);
                oCtx.globalAlpha = blendFactor;
                oCtx.drawImage(imgB, 0, 0, drawWidth, drawHeight);
              }

              // Apply post-processing effects (Bloom, Aberration, Vignette, Grain) locally
              if (isFxEnabled && !comp.showDepthMap) {
                oCtx.globalAlpha = 1.0; // Reset alpha for post effects
                applyPostProcessing(oCtx, offscreenCanvas, layer.effects);
              }
              oCtx.restore();
            }

            // Render the composite offscreen canvas perfectly transformed onto the main viewport
            ctx.drawImage(offscreenCanvas, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
          }
        } else if (layer.type === 'solid') {
          if (comp.showDepthMap) {
            ctx.fillRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
          } else {
            ctx.fillStyle = layer.solidColor || '#ff0000';
            ctx.fillRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
          }
        } else if (layer.type === 'text' && !comp.showDepthMap) {
           const fontSize = getPropertyValue(getTrack('fontSize'), currentFrameIndex, layer.fontSize || 100);
           const letterSpacing = getPropertyValue(getTrack('letterSpacing'), currentFrameIndex, layer.letterSpacing || 0);
           const characterReveal = getPropertyValue(getTrack('characterReveal'), currentFrameIndex, layer.characterReveal ?? 1);
           const blur = getPropertyValue(getTrack('blur'), currentFrameIndex, layer.blur || 0);
           const lineHeight = layer.lineHeight || 1.2;
           
           ctx.font = `${layer.fontWeight || 400} ${fontSize}px ${layer.fontFamily || 'Inter'}`;
           ctx.textAlign = (layer.textAlign as any) || 'center';
           ctx.textBaseline = 'middle';
           
           if (blur > 0) ctx.filter = `blur(${blur}px)`;

           const fullText = layer.text || '';
           const revealedCount = Math.floor(fullText.length * characterReveal);
           const displayText = fullText.slice(0, revealedCount);

           // Shadow
           const shadowBlur = getPropertyValue(getTrack('shadowBlur'), currentFrameIndex, layer.shadowBlur || 0);
           if (shadowBlur > 0) {
             ctx.shadowColor = layer.shadowColor || 'rgba(0,0,0,0.5)';
             ctx.shadowBlur = shadowBlur;
             ctx.shadowOffsetX = getPropertyValue(getTrack('shadowOffsetX'), currentFrameIndex, layer.shadowOffsetX || 0);
             ctx.shadowOffsetY = getPropertyValue(getTrack('shadowOffsetY'), currentFrameIndex, layer.shadowOffsetY || 0);
           }

           const lines = displayText.split('\n');
           
           lines.forEach((line, i) => {
             const yOffset = (i - (lines.length - 1) / 2) * fontSize * lineHeight;
             
             // Initial Fill
             ctx.fillStyle = layer.color || 'white';
             
             if (letterSpacing !== 0) {
                // Manual character spacing
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
                ctx.textAlign = layer.textAlign || 'center';
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

      // Global FX (Composition Level)
      // For now we don't have separate comp level FX in types, but we'll add it if needed.
    };

    render();
  }, [currentProject, currentFrameIndex]);

  return (
    <div className="relative flex-1 bg-black rounded-lg border border-zinc-800 overflow-hidden shadow-2xl flex items-center justify-center group">
      <canvas 
        ref={canvasRef}
        width={currentProject?.settings.width || 1920}
        height={currentProject?.settings.height || 1080}
        className="w-full h-full object-contain"
      />
      
      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded border border-white/10 text-[10px] font-mono text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-zinc-500'}`} />
        FRAME: <span className="text-blue-400">{(currentFrameIndex + 1).toString().padStart(4, '0')}</span> / {comp.duration.toString().padStart(4, '0')}
      </div>

      <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded border border-white/10 text-[9px] font-mono text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
        BIT-DEPTH: 8-BIT • COLORSPACE: SRGB • READY
      </div>
    </div>
  );
};
