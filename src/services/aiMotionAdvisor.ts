import { useProjectStore } from '../store/useProjectStore';
import { CameraSettings, Layer, Composition } from '../types';

export interface MotionSuggestion {
  id: string;
  title: string;
  description: string;
  category: 'camera' | 'layer' | 'look' | 'overall';
  apply: () => void;
}

export const getMotionSuggestions = (comp: Composition, selectedLayer?: Layer): MotionSuggestion[] => {
  const suggestions: MotionSuggestion[] = [];
  const store = useProjectStore.getState();

  // 1. Camera Suggestions
  if (comp.camera.animations.length === 0) {
    suggestions.push({
      id: 'cinematic-zoom',
      title: 'Slow Cinematic Zoom',
      description: 'Add a subtle zoom-in to create focus and depth.',
      category: 'camera',
      apply: () => {
        store.addCameraKeyframe('zoom', 1, 0);
        store.addCameraKeyframe('zoom', 1.2, comp.duration - 1);
      }
    });
  }

  // 2. Layer Specific Suggestions
  if (selectedLayer) {
    if (selectedLayer.type === 'text') {
      suggestions.push({
        id: 'text-reveal',
        title: 'Cinematic Blur Reveal',
        description: 'Animate text reveal with a sharp focus effect.',
        category: 'layer',
        apply: () => {
          store.addKeyframe('characterReveal', 0, 0);
          store.addKeyframe('blur', 20, 0);
          store.addKeyframe('characterReveal', 1, 40);
          store.addKeyframe('blur', 0, 40);
        }
      });
    }

    if (selectedLayer.parallaxDepth === 0) {
      suggestions.push({
        id: 'layer-depth',
        title: 'Apply Depth Parallax',
        description: 'Push this layer back to create a parallax effect.',
        category: 'layer',
        apply: () => {
          store.updateTransform({ parallaxDepth: 200 });
        }
      });
    }
  }

  // 3. Global Look Suggestions
  suggestions.push({
    id: 'film-grain-look',
    title: 'Analog Film Texture',
    description: 'Apply subtle grain and bloom for a cinematic look.',
    category: 'look',
    apply: () => {
      // Assuming a generic affect apply or setting
    }
  });

  return suggestions;
};
