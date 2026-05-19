import { AnimationTrack, Keyframe, EasingType } from '../types';
import { interpolate } from './interpolation';

export function getPropertyValue(
  track: AnimationTrack | undefined, 
  currentFrame: number, 
  defaultValue: number
): number {
  if (!track || track.keyframes.length === 0) return defaultValue;

  const keyframes = track.keyframes;
  
  // Find keyframes surrounding currentFrame
  let prev: Keyframe | null = null;
  let next: Keyframe | null = null;

  for (let i = 0; i < keyframes.length; i++) {
    const kf = keyframes[i];
    if (kf.frame <= currentFrame) {
      if (!prev || kf.frame > prev.frame) prev = kf;
    }
    if (kf.frame > currentFrame) {
      if (!next || kf.frame < next.frame) next = kf;
    }
  }

  if (!prev && !next) return defaultValue;
  if (!prev) return next!.value;
  if (!next) return prev.value;

  const t = (currentFrame - prev.frame) / (next.frame - prev.frame);
  return interpolate(prev.value, next.value, t, prev.easing);
}
