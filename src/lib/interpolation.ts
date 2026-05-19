import { EasingType } from '../types';

export const EasingFunctions = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => t * (2 - t),
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  cubic: (t: number) => t * t * t,
  quart: (t: number) => t * t * t * t,
  quint: (t: number) => t * t * t * t * t,
  back: (t: number) => {
    const s = 1.70158;
    return t * t * ((s + 1) * t - s);
  },
  elastic: (t: number) => {
    if (t === 0 || t === 1) return t;
    const p = 0.3;
    const s = p / 4;
    return Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1;
  },
  bounce: (t: number) => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  }
};

export function interpolate(v1: number, v2: number, t: number, easing: EasingType): number {
  const easeFn = EasingFunctions[easing as keyof typeof EasingFunctions] || EasingFunctions.linear;
  const easedT = easeFn(t);
  return v1 + (v2 - v1) * easedT;
}
