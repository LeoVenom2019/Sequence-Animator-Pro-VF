import { ColorGrading, CinematicEffects } from '../types';

export function applyColorGrading(ctx: CanvasRenderingContext2D, color: ColorGrading) {
  const { brightness, contrast, saturation, temperature, tint, exposure } = color;
  
  // Basic mapping of exposure to brightness/contrast for now
  const finalBrightness = (brightness + exposure) * 100;
  const finalContrast = contrast * 100;
  const finalSaturate = saturation * 100;
  
  // Temperature and Tint can be simulated with color overlays or hue-rotate
  // For now let's use the standard filters
  ctx.filter = `brightness(${finalBrightness}%) contrast(${finalContrast}%) saturate(${finalSaturate}%)`;
}

export function applyVignette(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) {
  const gradient = ctx.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, Math.sqrt(Math.pow(width/2, 2) + Math.pow(height/2, 2))
  );
  
  const alpha = Math.min(1, intensity);
  gradient.addColorStop(0, `rgba(0,0,0,0)`);
  gradient.addColorStop(1, `rgba(0,0,0,${alpha})`);
  
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

export function applyFilmGrain(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) {
  ctx.save();
  ctx.globalAlpha = intensity * 0.15;
  ctx.globalCompositeOperation = 'overlay';
  
  for (let i = 0; i < 1000 * intensity; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 2;
    ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000';
    ctx.fillRect(x, y, size, size);
  }
  
  ctx.restore();
}

export function applyBloom(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, intensity: number) {
  // Simple Bloom: draw a blurred version of the highlights on top
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = intensity;
  ctx.filter = 'blur(20px) brightness(1.5)';
  ctx.drawImage(canvas, 0, 0);
  ctx.restore();
}

export function applyChromaticAberration(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, intensity: number) {
  // Simple Chromatic Aberration: offset color channels
  const shift = intensity * 2;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  
  // Red channel
  ctx.globalAlpha = 0.5;
  ctx.drawImage(canvas, -shift, 0);
  
  // Blue channel
  ctx.drawImage(canvas, shift, 0);
  
  ctx.restore();
}

export function applyPreProcessing(ctx: CanvasRenderingContext2D, color: ColorGrading) {
  const { brightness, contrast, saturation, exposure } = color;
  
  const finalBrightness = (brightness + exposure) * 100;
  const finalContrast = contrast * 100;
  const finalSaturate = saturation * 100;
  
  ctx.filter = `brightness(${finalBrightness}%) contrast(${finalContrast}%) saturate(${finalSaturate}%)`;
}

export function applyPostProcessing(
  ctx: CanvasRenderingContext2D, 
  canvas: HTMLCanvasElement,
  effects: CinematicEffects
) {
  const { width, height } = canvas;
  
  // Disable filter for overlays
  ctx.filter = 'none';

  if (effects.bloom.enabled) {
    applyBloom(ctx, canvas, effects.bloom.intensity);
  }
  
  if (effects.chromaticAberration.enabled) {
    applyChromaticAberration(ctx, canvas, effects.chromaticAberration.intensity);
  }
  
  if (effects.vignette.enabled) {
    applyVignette(ctx, width, height, effects.vignette.intensity);
  }
  
  if (effects.grain.enabled) {
    applyFilmGrain(ctx, width, height, effects.grain.intensity);
  }
}
