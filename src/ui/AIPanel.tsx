import React, { useState } from 'react';
import { 
  Wand2, 
  Layers, 
  Maximize, 
  Focus, 
  RotateCcw, 
  Check, 
  X, 
  Settings, 
  Clock,
  Sparkles,
  Zap,
  Activity,
  History,
  AlertCircle
} from 'lucide-react';
import { useAIStore } from '../store/useAIStore';
import { useProjectStore } from '../store/useProjectStore';
import { getMotionSuggestions, MotionSuggestion } from '../services/aiMotionAdvisor';
import { motion, AnimatePresence } from 'motion/react';

export const AIPanel = () => {
  const { jobs, addJob, removeJob, settings, updateJob, updateProviderKey, setActiveProvider } = useAIStore();
  const { currentProject } = useProjectStore();
  const [activeTab, setActiveTab] = useState<'tools' | 'queue' | 'settings'>('tools');
  
  const comp = currentProject?.compositions.find(c => c.id === currentProject.activeCompositionId) || currentProject?.compositions[0];
  const selectedLayer = comp?.layers.find(l => l.id === comp.selectedLayerId);

  const { currentFrameIndex } = useProjectStore();
  const [dynamicSuggestions, setDynamicSuggestions] = useState<any[]>([]);
  const [activeAIErr, setActiveAIErr] = useState<string | null>(null);

  const suggestions = comp ? getMotionSuggestions(comp as any, selectedLayer as any) : [];
  
  const applyDynamicSuggestion = (suggestion: any) => {
    const store = useProjectStore.getState();
    if (!suggestion.keyframes) return;
    
    suggestion.keyframes.forEach((track: any) => {
      const target = track.target;
      const property = track.property;
      
      track.keyframes.forEach((kf: any) => {
        if (target === 'camera') {
          store.addCameraKeyframe(property, kf.value, kf.frame);
        } else if (target === 'layer') {
          store.addKeyframe(property, kf.value, kf.frame);
        }
      });
    });
  };

  const isGeminiActive = settings.activeProviderId === 'gemini';
  const displaySuggestions = isGeminiActive && dynamicSuggestions.length > 0
    ? dynamicSuggestions.map((s, idx) => ({
        id: s.id || `dyn-${idx}`,
        title: s.title,
        description: s.description,
        apply: () => applyDynamicSuggestion(s)
      }))
    : suggestions;

  const tools = [
    { 
      id: 'depth-map', 
      name: 'AI Depth Map', 
      description: 'Generate 3D depth from 2D images',
      icon: Focus,
      color: 'blue',
      requiresLayer: true
    },
    { 
      id: 'layer-separation', 
      name: 'Smart Object Solo', 
      description: 'Separate subjects from background',
      icon: Layers,
      color: 'emerald',
      requiresLayer: true 
    },
    { 
      id: 'upscale', 
      name: 'AI Resolution Upscale', 
      description: 'Enhance asset fidelity (2x / 4x)',
      icon: Maximize,
      color: 'amber',
      requiresLayer: true
    },
    { 
      id: 'interpolation', 
      name: 'Motion Smoothing', 
      description: 'Interpolate frames for 60FPS feel',
      icon: Activity,
      color: 'rose',
      requiresLayer: true
    },
    {
      id: 'motion-suggestion',
      name: 'Cinematic Advisor',
      description: 'AI-driven creative suggestions',
      icon: Wand2,
      color: 'purple',
      requiresLayer: false
    }
  ];

  const runTool = async (toolId: string) => {
    const geminiKey = settings.providers.find(p => p.id === 'gemini')?.apiKey || '';
    
    if (settings.activeProviderId === 'gemini' && !geminiKey) {
      alert("Please configure your Gemini API Key in the Settings tab first.");
      setActiveTab('settings');
      return;
    }

    const jobId = addJob(toolId as any, selectedLayer?.id, {});
    setActiveTab('queue');
    updateJob(jobId, { status: 'processing', progress: 15 });
    setActiveAIErr(null);

    try {
      if (settings.activeProviderId === 'gemini') {
        if (toolId === 'motion-suggestion') {
          const res = await fetch("/api/ai/suggestions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              apiKey: geminiKey,
              composition: comp,
              selectedLayer: selectedLayer
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Suggestions failed");
          
          setDynamicSuggestions(data.suggestions);
          updateJob(jobId, { status: 'preview-ready', progress: 100, output: data.suggestions });
        } else if (toolId === 'depth-map') {
          if (!selectedLayer) throw new Error("No active layer selected for Depth analysis");
          
          let frameUrl = "";
          if (selectedLayer.type === 'sequence' && selectedLayer.frames && selectedLayer.frames.length > 0) {
            const layerFrameIndex = currentFrameIndex - (selectedLayer.startTime || 0);
            const activeFrame = selectedLayer.frames[Math.max(0, Math.min(layerFrameIndex, selectedLayer.frames.length - 1))];
            frameUrl = activeFrame?.url || "";
          }

          if (!frameUrl) {
            throw new Error("Could not extract active frame image data URL from sequence layer");
          }

          updateJob(jobId, { progress: 50 });

          const res = await fetch("/api/ai/depth-map", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              apiKey: geminiKey,
              frameUrl: frameUrl,
              layerName: selectedLayer.name
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Depth analysis failed");

          updateJob(jobId, { status: 'preview-ready', progress: 100, output: data.analysis });
        } else {
          // Other features: Smart Solo, Upscale, Motion Smoothing (mocked for now with instant feedback)
          setTimeout(() => updateJob(jobId, { status: 'preview-ready', progress: 100 }), 1500);
        }
      } else {
        // Standard Mock Simulator
        setTimeout(() => updateJob(jobId, { status: 'processing', progress: 40 }), 500);
        setTimeout(() => updateJob(jobId, { progress: 80 }), 1500);
        setTimeout(() => updateJob(jobId, { status: 'preview-ready', progress: 100 }), 2500);
      }
    } catch (err: any) {
      updateJob(jobId, { status: 'failed', error: err.message });
      setActiveAIErr(err.message);
    }
  };

  const applyJobResult = (job: any) => {
    if (job.type === 'depth-map' && job.output) {
      const store = useProjectStore.getState();
      const analysis = job.output;
      store.updateTransform({
        parallaxDepth: analysis.parallaxDepth
      });
      if (comp) {
        store.updateCamera({
          focusDistance: analysis.focalDistance || 200,
          focalRange: analysis.focalRange || 300,
          depthIntensity: 5
        });
      }
    }
    
    updateJob(job.id, { status: 'applied' });
    setTimeout(() => removeJob(job.id), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">AI Motion Suite</h3>
        </div>
        <div className="flex bg-zinc-900 rounded p-0.5 border border-zinc-800">
           <button 
             onClick={() => setActiveTab('tools')}
             className={`p-1.5 rounded transition-all ${activeTab === 'tools' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-600 hover:text-zinc-400'}`}
           >
             <Wand2 className="w-3 h-3" />
           </button>
           <button 
             onClick={() => setActiveTab('queue')}
             className={`p-1.5 rounded transition-all relative ${activeTab === 'queue' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-600 hover:text-zinc-400'}`}
           >
             <Clock className="w-3 h-3" />
             {jobs.some(j => j.status === 'processing') && (
               <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
             )}
           </button>
           <button 
             onClick={() => setActiveTab('settings')}
             className={`p-1.5 rounded transition-all ${activeTab === 'settings' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-600 hover:text-zinc-400'}`}
           >
             <Settings className="w-3 h-3" />
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'tools' && (
          <div className="space-y-6">
             {displaySuggestions.length > 0 && (
                <div className="space-y-3">
                   <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest block">AI Suggestions</label>
                      <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 font-bold uppercase">New</span>
                   </div>
                   <div className="space-y-2">
                      {displaySuggestions.map(s => (
                         <div key={s.id} className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg group hover:border-blue-500/30 transition-all">
                            <div className="flex items-center justify-between mb-1">
                               <h5 className="text-[10px] font-bold text-zinc-200 uppercase tracking-tight">{s.title}</h5>
                               <button 
                                 onClick={() => s.apply()}
                                 className="opacity-0 group-hover:opacity-100 p-1 bg-blue-500 rounded text-white transition-all hover:scale-110"
                                >
                                 <Check className="w-2.5 h-2.5" />
                               </button>
                            </div>
                            <p className="text-[9px] text-zinc-500 leading-relaxed">{s.description}</p>
                         </div>
                      ))}
                   </div>
                </div>
             )}

             {!selectedLayer && (
                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg flex gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <p className="text-[10px] text-amber-200/70 leading-relaxed uppercase tracking-tight">
                    Select a layer in your composition to unlock context-aware AI tools.
                  </p>
                </div>
             )}

             <div className="grid gap-2">
                {tools.map(tool => {
                  const isDisabled = tool.requiresLayer && !selectedLayer;
                  return (
                    <button
                      key={tool.id}
                      disabled={isDisabled}
                      onClick={() => runTool(tool.id)}
                      className={`group p-4 rounded-xl border text-left transition-all relative overflow-hidden ${isDisabled ? 'bg-zinc-900/50 border-zinc-800/50 opacity-40 cursor-not-allowed' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 active:scale-[0.98]'}`}
                    >
                      <div className="flex items-center gap-3 relative z-10">
                        <div className={`p-2 rounded-lg bg-${tool.color}-500/10 text-${tool.color}-400 group-hover:scale-110 transition-transform`}>
                          <tool.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-tight">{tool.name}</h4>
                          <p className="text-[9px] text-zinc-500 mt-0.5">{tool.description}</p>
                        </div>
                      </div>
                      <div className={`absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity`}>
                        <Zap className="w-3 h-3 text-zinc-600" />
                      </div>
                    </button>
                  );
                })}
             </div>
          </div>
        )}

        {activeTab === 'queue' && (
          <div className="space-y-3">
            {jobs.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-12 opacity-30">
                  <History className="w-8 h-8 mb-3" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">No active jobs</p>
               </div>
            ) : (
              jobs.map(job => (
                <div key={job.id} className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-zinc-200 uppercase tracking-tight">{job.type.replace('-', ' ')}</span>
                    </div>
                    <button 
                      onClick={() => removeJob(job.id)}
                      className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-rose-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[8px] font-mono text-zinc-500 uppercase">
                      <span>{job.status}</span>
                      <span>{Math.round(job.progress)}%</span>
                    </div>
                    <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${job.progress}%` }}
                        className="h-full bg-blue-500"
                      />
                    </div>
                  </div>

                  {job.status === 'preview-ready' && (
                    <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
                      <button className="flex-1 py-1.5 px-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase rounded border border-blue-500/20 transition-all flex items-center justify-center gap-1.5">
                        <Activity className="w-3 h-3" />
                        Preview
                      </button>
                      <button 
                        onClick={() => applyJobResult(job)}
                        className="flex-1 py-1.5 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase rounded border border-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-3 h-3" />
                        Apply
                      </button>
                    </div>
                  )}

                  {job.status === 'applied' && (
                    <div className="flex items-center gap-2 pt-2 border-t border-zinc-800 text-emerald-400 text-[10px] uppercase font-bold justify-center py-1 bg-emerald-500/5 rounded">
                      <Check className="w-3 h-3" />
                      Applied to Project
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest block">AI Provider</label>
              <div className="space-y-2">
                {settings.providers.map(provider => (
                  <button
                    key={provider.id}
                    onClick={() => setActiveProvider(provider.id)}
                    className={`w-full p-3 text-left bg-zinc-900 border rounded-lg transition-all flex items-center justify-between group ${settings.activeProviderId === provider.id ? 'border-blue-500/50' : 'border-zinc-800 hover:border-zinc-700'}`}
                  >
                    <div>
                      <div className="text-[10px] font-bold text-zinc-200 uppercase tracking-tight">{provider.name}</div>
                      <div className="text-[8px] text-zinc-600 uppercase mt-0.5">{provider.type} provider</div>
                    </div>
                    {settings.activeProviderId === provider.id && <Check className="w-4 h-4 text-blue-500" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-zinc-900">
              <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest block">API Keys</label>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-zinc-500 uppercase">Gemini Cloud API</span>
                    <span className="text-[9px] text-emerald-500 uppercase font-bold">Safe</span>
                  </div>
                  <input 
                    type="password"
                    value={settings.providers.find(p => p.id === 'gemini')?.apiKey || ''}
                    onChange={(e) => updateProviderKey('gemini', e.target.value)}
                    placeholder="Enter API Key..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-[10px] text-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-zinc-900 bg-black/40">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
            <Activity className="w-3 h-3" />
            Infrastructure
          </div>
          <span className="text-[9px] text-zinc-600 uppercase font-mono">v1.0.0-PRO</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-zinc-900/50 rounded border border-zinc-800/50">
            <div className="text-[8px] text-zinc-600 uppercase">GPU Load</div>
            <div className="text-[10px] font-mono text-zinc-400 mt-1">0.0%</div>
          </div>
          <div className="p-2 bg-zinc-900/50 rounded border border-zinc-800/50">
            <div className="text-[8px] text-zinc-600 uppercase">Latency</div>
            <div className="text-[10px] font-mono text-zinc-400 mt-1">12ms</div>
          </div>
        </div>
      </div>
    </div>
  );
};
