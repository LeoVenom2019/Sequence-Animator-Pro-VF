import { create } from 'zustand';
import { 
  Frame, Project, ProjectSettings, FrameTransform, 
  ColorGrading, CinematicEffects, Layer, Composition, BlendMode,
  CameraSettings
} from '../types';

interface ProjectState {
  currentProject: Project | null;
  isPlaying: boolean;
  currentFrameIndex: number;
  history: Project[];
  historyIndex: number;
  
  // Selection
  activeCompositionId: string | null;
  selectedLayerId: string | null;

  // Actions
  setProject: (project: Project) => void;
  updateSettings: (settings: Partial<ProjectSettings>) => void;
  updateComposition: (compositionId: string, settings: Partial<Composition>) => void;
  
  // Layer Actions
  addLayer: (layer: Partial<Layer>) => void;
  removeLayer: (layerId: string) => void;
  selectLayer: (layerId: string | null) => void;
  updateLayer: (layerId: string, updates: Partial<Layer>) => void;
  reorderLayers: (startIndex: number, endIndex: number) => void;

  // Camera
  updateCamera: (updates: Partial<CameraSettings>) => void;
  addCameraKeyframe: (property: string, value: number, frame?: number) => void;

  // Transform / Animation
  updateTransform: (transform: Partial<FrameTransform & { parallaxDepth: number }>) => void;
  updateColorGrading: (color: Partial<ColorGrading>) => void;
  updateEffects: (effects: any) => void;
  addKeyframe: (property: string, value: number, frame?: number) => void;
  removeKeyframe: (property: string, keyframeId: string) => void;
  toggleAutoKey: () => void;
  applyMotionPreset: (type: 'slow-zoom' | 'dramatic-pan' | 'subtle-parallax' | 'floating-drift') => void;
  applyLookPreset: (type: string) => void;
  
  // Global Actions
  setPlaying: (isPlaying: boolean) => void;
  setCurrentFrame: (index: number) => void;
  resetProject: () => void;
  
  // Legacy/Helpers (will adapt for active layer)
  addFrames: (newFrames: Frame[]) => void;
  removeFrame: (frameId: string) => void;
  
  // History
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
}

const DEFAULT_TRANSFORM: FrameTransform = {
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
  opacity: 1,
};

const DEFAULT_COLOR: ColorGrading = {
  exposure: 0,
  brightness: 1,
  contrast: 1,
  saturation: 1,
  temperature: 0,
  tint: 0,
  vibrance: 1,
  highlights: 1,
  shadows: 1,
};

const DEFAULT_EFFECTS: CinematicEffects = {
  vignette: { enabled: false, intensity: 0.5 },
  grain: { enabled: false, intensity: 0.1 },
  bloom: { enabled: false, intensity: 0.5, threshold: 0.8, blur: 10 },
  chromaticAberration: { enabled: false, intensity: 1 },
  sharpen: { enabled: false, intensity: 0.2 },
  pixelArt: { enabled: false },
};

const DEFAULT_CAMERA: CameraSettings = {
  x: 0,
  y: 0,
  zoom: 1,
  rotation: 0,
  focusDistance: 500,
  focalRange: 200,
  depthIntensity: 1,
  drift: 0,
  shake: 0,
  smoothing: 0.1,
  animations: []
};

const createLayer = (name: string, type: Layer['type'] = 'sequence'): Layer => ({
  id: crypto.randomUUID(),
  name,
  type,
  visible: true,
  locked: false,
  opacity: 1,
  blendMode: 'normal',
  transform: { ...DEFAULT_TRANSFORM },
  animations: [],
  colorGrading: { ...DEFAULT_COLOR },
  effects: { ...DEFAULT_EFFECTS },
  parallaxDepth: 0,
  startTime: 0,
  duration: 100,
  frames: [],
  // Text defaults
  text: type === 'text' ? 'New Title' : '',
  fontFamily: 'Inter',
  fontSize: 120,
  fontWeight: 700,
  lineHeight: 1.2,
  letterSpacing: 0,
  textAlign: 'center',
  color: '#ffffff',
  outlineColor: '#000000',
  outlineWidth: 0,
  shadowColor: 'rgba(0,0,0,0.5)',
  shadowBlur: 0,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  characterReveal: 1,
  blur: 0,
});

const DEFAULT_PROJECT = (): Project => {
  const mainCompId = crypto.randomUUID();
  const defaultLayer = createLayer('Base Sequence', 'sequence');
  
  const mainComp: Composition = {
    id: mainCompId,
    name: 'Main Composition',
    layers: [defaultLayer],
    camera: { ...DEFAULT_CAMERA },
    width: 1920,
    height: 1080,
    fps: 24,
    duration: 100,
    backgroundColor: '#000000',
    selectedLayerId: defaultLayer.id
  };

  return {
    id: crypto.randomUUID(),
    name: 'Untitled Motion Project',
    compositions: [mainComp],
    activeCompositionId: mainCompId,
    settings: {
      fps: 24,
      width: 1920,
      height: 1080,
      loop: true,
      isAutoKeyEnabled: false,
      isPreviewFxEnabled: true,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  currentProject: DEFAULT_PROJECT(),
  isPlaying: false,
  currentFrameIndex: 0,
  history: [],
  historyIndex: -1,
  activeCompositionId: null, // Will be set on load
  selectedLayerId: null,

  // Helper to get active objects
  getActive: () => {
    const { currentProject } = get();
    if (!currentProject) return { composition: null, layer: null };
    
    const comp = currentProject.compositions.find(c => c.id === currentProject.activeCompositionId) || currentProject.compositions[0];
    const layer = comp?.layers.find(l => l.id === comp.selectedLayerId) || null;
    
    return { composition: comp, layer };
  },

  saveToHistory: () => {
    const { currentProject, history, historyIndex } = get();
    if (!currentProject) return;
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(currentProject)));
    
    if (newHistory.length > 50) newHistory.shift();
    
    set({ 
      history: newHistory, 
      historyIndex: newHistory.length - 1 
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prevProject = history[historyIndex - 1];
      set({ 
        currentProject: JSON.parse(JSON.stringify(prevProject)), 
        historyIndex: historyIndex - 1 
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const nextProject = history[historyIndex + 1];
      set({ 
        currentProject: JSON.parse(JSON.stringify(nextProject)), 
        historyIndex: historyIndex + 1 
      });
    }
  },

  setProject: (project) => {
    set({ currentProject: project });
    get().saveToHistory();
  },
  
  updateSettings: (settings) => {
    set((state) => ({
      currentProject: state.currentProject 
        ? { 
            ...state.currentProject, 
            settings: { ...state.currentProject.settings, ...settings },
            updatedAt: Date.now()
          }
        : null
    }));
    get().saveToHistory();
  },

  updateComposition: (compId, updates) => {
    set((state) => {
      if (!state.currentProject) return state;
      return {
        currentProject: {
          ...state.currentProject,
          compositions: state.currentProject.compositions.map(c => 
            c.id === compId ? { ...c, ...updates } : c
          ),
          updatedAt: Date.now()
        }
      };
    });
  },

  addLayer: (layerProps) => {
    set((state) => {
      if (!state.currentProject) return state;
      const compId = state.currentProject.activeCompositionId;
      const newLayer = { ...createLayer(layerProps.name || 'New Layer'), ...layerProps };
      
      return {
        currentProject: {
          ...state.currentProject,
          compositions: state.currentProject.compositions.map(c => 
            c.id === compId ? { 
              ...c, 
              layers: [newLayer, ...c.layers],
              selectedLayerId: newLayer.id 
            } : c
          ),
          updatedAt: Date.now()
        }
      };
    });
    get().saveToHistory();
  },

  removeLayer: (layerId) => {
    set((state) => {
      if (!state.currentProject) return state;
      const compId = state.currentProject.activeCompositionId;
      return {
        currentProject: {
          ...state.currentProject,
          compositions: state.currentProject.compositions.map(c => 
            c.id === compId ? { 
              ...c, 
              layers: c.layers.filter(l => l.id !== layerId),
              selectedLayerId: c.selectedLayerId === layerId ? (c.layers[1]?.id || null) : c.selectedLayerId
            } : c
          ),
          updatedAt: Date.now()
        }
      };
    });
    get().saveToHistory();
  },

  selectLayer: (layerId) => {
    set((state) => {
      if (!state.currentProject) return state;
      const compId = state.currentProject.activeCompositionId;
      return {
        currentProject: {
          ...state.currentProject,
          compositions: state.currentProject.compositions.map(c => 
            c.id === compId ? { ...c, selectedLayerId: layerId } : c
          ),
        }
      };
    });
  },

  updateLayer: (layerId, updates) => {
    set((state) => {
      if (!state.currentProject) return state;
      const compId = state.currentProject.activeCompositionId;
      return {
        currentProject: {
          ...state.currentProject,
          compositions: state.currentProject.compositions.map(c => 
            c.id === compId ? {
              ...c,
              layers: c.layers.map(l => l.id === layerId ? { ...l, ...updates } : l)
            } : c
          ),
          updatedAt: Date.now()
        }
      };
    });
  },

  reorderLayers: (startIndex, endIndex) => {
    set((state) => {
      if (!state.currentProject) return state;
      const compId = state.currentProject.activeCompositionId;
      const comp = state.currentProject.compositions.find(c => c.id === compId);
      if (!comp) return state;

      const layers = Array.from(comp.layers);
      const [removed] = layers.splice(startIndex, 1);
      layers.splice(endIndex, 0, removed);

      return {
        currentProject: {
          ...state.currentProject,
          compositions: state.currentProject.compositions.map(c => 
            c.id === compId ? { ...c, layers } : c
          ),
          updatedAt: Date.now()
        }
      };
    });
    get().saveToHistory();
  },

  updateCamera: (updates) => {
    set((state) => {
      if (!state.currentProject) return state;
      const compId = state.currentProject.activeCompositionId;
      return {
        currentProject: {
          ...state.currentProject,
          compositions: state.currentProject.compositions.map(c => 
            c.id === compId ? { ...c, camera: { ...c.camera, ...updates } } : c
          ),
          updatedAt: Date.now()
        }
      };
    });
  },

  addCameraKeyframe: (property, value, frame) => {
    set((state) => {
      if (!state.currentProject) return state;
      const project = state.currentProject;
      const comp = project.compositions.find(c => c.id === project.activeCompositionId)!;
      const { camera } = comp;
      const targetFrame = frame !== undefined ? frame : state.currentFrameIndex;

      let track = camera.animations.find(t => t.property === property);
      if (!track) {
        track = { property: property as any, keyframes: [] };
        camera.animations.push(track);
      }

      const existingKf = track.keyframes.find(k => k.frame === targetFrame);
      if (existingKf) {
        existingKf.value = value;
      } else {
        track.keyframes.push({
          id: crypto.randomUUID(),
          frame: targetFrame,
          value: value,
          easing: 'easeInOut'
        });
        track.keyframes.sort((a, b) => a.frame - b.frame);
      }

      return {
        currentProject: {
          ...project,
          updatedAt: Date.now()
        }
      };
    });
  },

  updateTransform: (updates) => {
    const { currentProject, addKeyframe } = get();
    if (!currentProject) return;
    
    const compIdx = currentProject.compositions.findIndex(c => c.id === currentProject.activeCompositionId);
    const comp = currentProject.compositions[compIdx];
    if (!comp || !comp.selectedLayerId) return;

    set((state) => {
      const project = state.currentProject!;
      const comp = project.compositions.find(c => c.id === project.activeCompositionId)!;
      const layerId = comp.selectedLayerId;

      return {
        currentProject: {
          ...project,
          compositions: project.compositions.map(c => 
            c.id === project.activeCompositionId ? {
              ...c,
              layers: c.layers.map(l => l.id === layerId ? {
                ...l,
                parallaxDepth: updates.parallaxDepth !== undefined ? updates.parallaxDepth : l.parallaxDepth,
                transform: { ...l.transform, ...updates }
              } : l)
            } : c
          )
        }
      };
    });

    if (currentProject.settings.isAutoKeyEnabled) {
      Object.entries(updates).forEach(([prop, val]) => {
        if (val !== undefined) addKeyframe(prop, val);
      });
    }
  },

  updateColorGrading: (color) => {
    set((state) => {
      if (!state.currentProject) return state;
      const project = state.currentProject;
      const comp = project.compositions.find(c => c.id === project.activeCompositionId)!;
      const layerId = comp.selectedLayerId;

      return {
        currentProject: {
          ...project,
          compositions: project.compositions.map(c => 
            c.id === project.activeCompositionId ? {
              ...c,
              layers: c.layers.map(l => l.id === layerId ? {
                ...l,
                colorGrading: { ...l.colorGrading, ...color }
              } : l)
            } : c
          ),
          updatedAt: Date.now()
        }
      };
    });
  },

  updateEffects: (effects) => {
    set((state) => {
      if (!state.currentProject) return state;
      const project = state.currentProject;
      const comp = project.compositions.find(c => c.id === project.activeCompositionId)!;
      const layerId = comp.selectedLayerId;

      return {
        currentProject: {
          ...project,
          compositions: project.compositions.map(c => 
            c.id === project.activeCompositionId ? {
              ...c,
              layers: c.layers.map(l => l.id === layerId ? {
                ...l,
                effects: { ...l.effects, ...effects }
              } : l)
            } : c
          ),
          updatedAt: Date.now()
        }
      };
    });
  },

  addKeyframe: (property, value, frame) => {
    set((state) => {
      if (!state.currentProject) return state;
      const project = state.currentProject;
      const comp = project.compositions.find(c => c.id === project.activeCompositionId)!;
      const layerId = comp.selectedLayerId;
      if (!layerId) return state;

      const layer = comp.layers.find(l => l.id === layerId)!;
      const { animations } = layer;
      const targetFrame = frame !== undefined ? frame : state.currentFrameIndex;

      let track = animations.find(t => t.property === property);
      if (!track) {
        track = { property: property as any, keyframes: [] };
        animations.push(track);
      }

      const existingKf = track.keyframes.find(k => k.frame === targetFrame);
      if (existingKf) {
        existingKf.value = value;
      } else {
        track.keyframes.push({
          id: crypto.randomUUID(),
          frame: targetFrame,
          value: value,
          easing: 'easeInOut'
        });
        track.keyframes.sort((a, b) => a.frame - b.frame);
      }

      return {
        currentProject: {
          ...project,
          updatedAt: Date.now()
        }
      };
    });
  },

  removeKeyframe: (property, keyframeId) => {
    set((state) => {
      if (!state.currentProject) return state;
      const project = state.currentProject;
      const comp = project.compositions.find(c => c.id === project.activeCompositionId)!;
      const layerId = comp.selectedLayerId;
      if (!layerId) return state;

      const layer = comp.layers.find(l => l.id === layerId)!;
      const trackIdx = layer.animations.findIndex(t => t.property === property);
      if (trackIdx === -1) return state;

      layer.animations[trackIdx].keyframes = layer.animations[trackIdx].keyframes.filter(k => k.id !== keyframeId);
      
      return {
        currentProject: {
          ...project,
          updatedAt: Date.now()
        }
      };
    });
    get().saveToHistory();
  },

  toggleAutoKey: () => {
    set((state) => ({
      currentProject: state.currentProject ? {
        ...state.currentProject,
        settings: {
          ...state.currentProject.settings,
          isAutoKeyEnabled: !state.currentProject.settings.isAutoKeyEnabled
        }
      } : null
    }));
  },

  applyMotionPreset: (type) => {
    set((state) => {
      if (!state.currentProject) return state;
      const project = state.currentProject;
      const comp = project.compositions.find(c => c.id === project.activeCompositionId)!;
      const layerId = comp.selectedLayerId;
      if (!layerId) return state;

      const layer = comp.layers.find(l => l.id === layerId)!;
      const lastFrame = layer.duration - 1;
      const animations = [...layer.animations];
      
      const addKf = (prop: any, frame: number, value: number, easing: any = 'easeInOut') => {
        let track = animations.find(t => t.property === prop);
        if (!track) {
          track = { property: prop, keyframes: [] };
          animations.push(track);
        }
        track.keyframes = track.keyframes.filter(k => k.frame !== frame);
        track.keyframes.push({ id: crypto.randomUUID(), frame, value, easing });
        track.keyframes.sort((a, b) => a.frame - b.frame);
      };

      if (type === 'slow-zoom') {
        addKf('zoom', 0, 1);
        addKf('zoom', lastFrame, 1.25, 'easeOut');
      } else if (type === 'dramatic-pan') {
        addKf('x', 0, -100);
        addKf('x', lastFrame, 100, 'easeInOut');
      } else if (type === 'subtle-parallax') {
        addKf('parallax', 0, 0);
        addKf('parallax', lastFrame, 50, 'linear');
      } else if (type === 'floating-drift') {
        addKf('y', 0, 0, 'easeInOut');
        addKf('y', Math.floor(lastFrame / 2), -20, 'easeInOut');
        addKf('y', lastFrame, 0, 'easeInOut');
        addKf('rotation', 0, -0.5, 'easeInOut');
        addKf('rotation', Math.floor(lastFrame / 2), 0.5, 'easeInOut');
        addKf('rotation', lastFrame, -0.5, 'easeInOut');
      }

      return {
        currentProject: {
          ...project,
          compositions: project.compositions.map(c => 
            c.id === project.activeCompositionId ? {
              ...c,
              layers: c.layers.map(l => l.id === layerId ? { ...l, animations } : l)
            } : c
          ),
          updatedAt: Date.now()
        }
      };
    });
    get().saveToHistory();
  },

  applyLookPreset: (type) => {
    set((state) => {
      if (!state.currentProject) return state;
      const project = state.currentProject;
      const comp = project.compositions.find(c => c.id === project.activeCompositionId)!;
      const layerId = comp.selectedLayerId;
      if (!layerId) return state;
      
      let color = { ...DEFAULT_COLOR };
      let effects = { ...DEFAULT_EFFECTS };

      switch (type) {
        case 'Cinematic warm':
          color.temperature = 0.2;
          color.saturation = 1.1;
          color.exposure = 0.1;
          effects.vignette = { enabled: true, intensity: 0.4 };
          effects.bloom = { enabled: true, intensity: 0.3, threshold: 0.8, blur: 5 };
          break;
        case 'Cyberpunk':
          color.saturation = 1.5;
          color.contrast = 1.2;
          color.tint = 0.4;
          effects.bloom = { enabled: true, intensity: 0.8, threshold: 0.5, blur: 15 };
          effects.chromaticAberration = { enabled: true, intensity: 2 };
          break;
        case 'Noir':
          color.saturation = 0;
          color.contrast = 1.4;
          color.exposure = -0.2;
          effects.grain = { enabled: true, intensity: 0.3 };
          effects.vignette = { enabled: true, intensity: 0.6 };
          break;
        case 'Dreamy':
          color.vibrance = 1.3;
          color.exposure = 0.3;
          effects.bloom = { enabled: true, intensity: 0.5, threshold: 0.4, blur: 20 };
          effects.chromaticAberration = { enabled: true, intensity: 1 };
          break;
      }

      return {
        currentProject: {
          ...project,
          compositions: project.compositions.map(c => 
            c.id === project.activeCompositionId ? {
              ...c,
              layers: c.layers.map(l => l.id === layerId ? { ...l, colorGrading: color, effects: effects } : l)
            } : c
          ),
          updatedAt: Date.now()
        }
      };
    });
    get().saveToHistory();
  },

  addFrames: (newFrames) => {
    set((state) => {
      if (!state.currentProject) return state;
      const project = state.currentProject;
      const comp = project.compositions.find(c => c.id === project.activeCompositionId)!;
      
      // Find suitable sequence layer (selected or first available)
      let targetLayer = comp.layers.find(l => l.id === comp.selectedLayerId && l.type === 'sequence');
      if (!targetLayer) {
        targetLayer = comp.layers.find(l => l.type === 'sequence');
      }

      let updatedLayers = [...comp.layers];
      let newSelectedLayerId = comp.selectedLayerId;

      if (!targetLayer) {
        // No sequence layer exists, create a brand new one
        const newSeqLayer = createLayer('Imported Sequence', 'sequence');
        newSeqLayer.frames = [...newFrames];
        newSeqLayer.duration = newFrames.length;
        updatedLayers = [newSeqLayer, ...updatedLayers];
        newSelectedLayerId = newSeqLayer.id;
      } else {
        // Append to existing sequence layer
        updatedLayers = comp.layers.map(l => l.id === targetLayer!.id ? {
          ...l,
          frames: [...(l.frames || []), ...newFrames].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })),
          duration: Math.max(l.duration, (l.frames?.length || 0) + newFrames.length)
        } : l);
      }

      // Calculate total composition duration dynamically
      const maxLayerDuration = Math.max(
        100, 
        ...updatedLayers.map(l => (l.startTime || 0) + (l.duration || 0))
      );

      return {
        currentProject: {
          ...project,
          compositions: project.compositions.map(c => 
            c.id === project.activeCompositionId ? {
              ...c,
              layers: updatedLayers,
              selectedLayerId: newSelectedLayerId,
              duration: maxLayerDuration
            } : c
          ),
          updatedAt: Date.now()
        }
      };
    });
    get().saveToHistory();
  },

  removeFrame: (frameId) => {
    set((state) => {
      if (!state.currentProject) return state;
      const project = state.currentProject;
      const comp = project.compositions.find(c => c.id === project.activeCompositionId)!;
      const layerId = comp.selectedLayerId;
      if (!layerId) return state;

      return {
        currentProject: {
          ...project,
          compositions: project.compositions.map(c => 
            c.id === project.activeCompositionId ? {
              ...c,
              layers: c.layers.map(l => l.id === layerId && l.type === 'sequence' ? {
                ...l,
                frames: (l.frames || []).filter(f => f.id !== frameId)
              } : l)
            } : c
          ),
          updatedAt: Date.now()
        }
      };
    });
    get().saveToHistory();
  },

  setPlaying: (isPlaying) => set({ isPlaying }),
  
  setCurrentFrame: (index) => set((state) => {
    if (!state.currentProject) return { currentFrameIndex: 0 };
    const comp = state.currentProject.compositions.find(c => c.id === state.currentProject?.activeCompositionId) || state.currentProject.compositions[0];
    const len = comp.duration || 100;
    
    let safeIndex = index;
    if (index >= len) safeIndex = state.currentProject.settings.loop ? 0 : len - 1;
    if (index < 0) safeIndex = state.currentProject.settings.loop ? len - 1 : 0;
    
    return { currentFrameIndex: safeIndex };
  }),

  resetProject: () => {
    set({
      currentProject: DEFAULT_PROJECT(),
      currentFrameIndex: 0,
      isPlaying: false,
      history: [],
      historyIndex: -1
    });
    get().saveToHistory();
  }
}));
