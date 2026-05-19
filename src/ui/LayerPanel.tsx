import React from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  MoreVertical, 
  Layers,
  Plus,
  Trash2,
  Copy,
  Type,
  Square,
  Image as ImageIcon,
  Film
} from 'lucide-react';
import { BlendMode, Layer } from '../types';

const SortableLayerItem = ({ layer, isSelected, onSelect, onToggleVisibility, onToggleLock, onDelete }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: layer.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    position: 'relative' as const,
  };

  const Icon = layer.type === 'sequence' ? Film : 
               layer.type === 'image' ? ImageIcon : 
               layer.type === 'text' ? Type : Square;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 p-2 rounded-lg border transition-all cursor-default ${
        isSelected 
        ? 'bg-emerald-500/10 border-emerald-500/30' 
        : 'bg-zinc-900/40 border-zinc-800/50 hover:bg-zinc-800/50'
      } ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      onClick={() => onSelect(layer.id)}
    >
      <div {...attributes} {...listeners} className="p-1 cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400">
        <MoreVertical className="w-3.5 h-3.5" />
      </div>

      <div className={`p-1.5 rounded-md ${isSelected ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className={`text-[11px] font-bold truncate ${isSelected ? 'text-emerald-400' : 'text-zinc-300'}`}>
          {layer.name}
        </div>
        <div className="text-[9px] text-zinc-500 uppercase tracking-tighter">
          {layer.type} • {layer.blendMode}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id, !layer.visible); }}
          className={`p-1.5 rounded hover:bg-zinc-700 ${layer.visible ? 'text-zinc-400' : 'text-red-400'}`}
        >
          {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleLock(layer.id, !layer.locked); }}
          className={`p-1.5 rounded hover:bg-zinc-700 ${layer.locked ? 'text-amber-400' : 'text-zinc-600'}`}
        >
          {layer.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(layer.id); }}
          className="p-1.5 rounded hover:bg-red-500/20 text-zinc-600 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export const LayerPanel = () => {
  const { currentProject, addLayer, removeLayer, selectLayer, updateLayer, reorderLayers } = useProjectStore();
  
  if (!currentProject) return null;
  
  const comp = currentProject.compositions.find(c => c.id === currentProject.activeCompositionId) || currentProject.compositions[0];
  if (!comp) return null;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = comp.layers.findIndex(l => l.id === active.id);
      const newIndex = comp.layers.findIndex(l => l.id === over.id);
      reorderLayers(oldIndex, newIndex);
    }
  };

  const handleAddLayer = (type: Layer['type']) => {
    const names = {
      sequence: 'Sequence Layer',
      image: 'Image Layer',
      text: 'Text Layer',
      solid: 'Solid Layer',
      adjustment: 'Adjustment Layer'
    };
    addLayer({ name: names[type], type });
  };

  const blendModes: BlendMode[] = [
    'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 
    'color-dodge', 'color-burn', 'hard-light', 'soft-light', 
    'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'
  ];

  const selectedLayer = comp.layers.find(l => l.id === comp.selectedLayerId);

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/20">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <Layers className="w-3 h-3" />
          Composition Layers
        </h3>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => handleAddLayer('text')}
            className="p-1.5 rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors"
            title="Add Text Layer"
          >
            <Type className="w-3 h-3" />
          </button>
          <button 
            onClick={() => handleAddLayer('solid')}
            className="p-1.5 rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors"
            title="Add Solid Layer"
          >
            <Square className="w-3 h-3" />
          </button>
          <button 
            onClick={() => handleAddLayer('sequence')}
            className="p-1.5 rounded bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
            title="Add Sequence Layer"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {selectedLayer && (
        <div className="p-4 bg-zinc-900/50 border-b border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Blend Mode</span>
            <select 
              value={selectedLayer.blendMode}
              onChange={(e) => updateLayer(selectedLayer.id, { blendMode: e.target.value as BlendMode })}
              className="bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-300 rounded px-2 py-1 outline-none focus:border-emerald-500/50 transition-colors"
            >
              {blendModes.map(mode => (
                <option key={mode} value={mode}>{mode.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
              <span>Opacity</span>
              <span className="text-emerald-400">{Math.round(selectedLayer.opacity * 100)}%</span>
            </div>
            <input 
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={selectedLayer.opacity}
              onChange={(e) => updateLayer(selectedLayer.id, { opacity: parseFloat(e.target.value) })}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
              <span>Layer Duration (Frames)</span>
              <span className="text-emerald-400">{(selectedLayer.duration || comp.duration)}f</span>
            </div>
            <input 
              type="number"
              min="1"
              max="2000"
              value={selectedLayer.duration || comp.duration}
              onChange={(e) => {
                const val = Math.max(1, parseInt(e.target.value) || 1);
                updateLayer(selectedLayer.id, { duration: val });
                
                // Recalculate and update composition duration if needed
                const store = useProjectStore.getState();
                if (store.currentProject) {
                  const activeComp = store.currentProject.compositions.find(c => c.id === store.currentProject!.activeCompositionId);
                  if (activeComp) {
                    const maxDur = Math.max(100, ...activeComp.layers.map(l => (l.startTime || 0) + (l.id === selectedLayer.id ? val : (l.duration || 0))));
                    store.updateComposition(activeComp.id, { duration: maxDur });
                  }
                }
              }}
              className="w-full bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-300 rounded px-2 py-1.5 outline-none focus:border-emerald-500/50 transition-colors font-mono"
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={comp.layers.map(l => l.id)}
            strategy={verticalListSortingStrategy}
          >
            {comp.layers.map((layer) => (
              <SortableLayerItem 
                key={layer.id}
                layer={layer}
                isSelected={comp.selectedLayerId === layer.id}
                onSelect={selectLayer}
                onToggleVisibility={(id: string, v: boolean) => updateLayer(id, { visible: v })}
                onToggleLock={(id: string, l: boolean) => updateLayer(id, { locked: l })}
                onDelete={removeLayer}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};
