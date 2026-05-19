import { create } from 'zustand';
import { AIJob, AISettings, AIJobType, AIJobStatus } from '../types/ai';

interface AIState {
  jobs: AIJob[];
  settings: AISettings;
  
  // Job Management
  addJob: (type: AIJobType, sourceId: string | undefined, config: any) => string;
  updateJob: (jobId: string, updates: Partial<AIJob>) => void;
  removeJob: (jobId: string) => void;
  clearQueue: () => void;
  
  // Settings
  updateAISettings: (updates: Partial<AISettings>) => void;
  updateProviderKey: (providerId: string, apiKey: string) => void;
  setActiveProvider: (providerId: string) => void;
  
  // Processing helpers
  getActiveJobsCount: () => number;
}

export const useAIStore = create<AIState>((set, get) => ({
  jobs: [],
  settings: {
    activeProviderId: 'mock',
    providers: [
      { id: 'mock', name: 'Standard AI Assistant', type: 'mock', enabled: true },
      { id: 'gemini', name: 'Google Gemini Pro', type: 'cloud', enabled: false },
      { id: 'local', name: 'Local Workers (RIFE/MiDaS)', type: 'local', enabled: false },
    ],
    autoApplyResults: false,
    maxConcurrentJobs: 2,
  },

  addJob: (type, sourceId, config) => {
    const jobId = crypto.randomUUID();
    const newJob: AIJob = {
      id: jobId,
      type,
      status: 'queued',
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sourceId,
      config,
    };
    
    set((state) => ({
      jobs: [newJob, ...state.jobs]
    }));
    
    return jobId;
  },

  updateJob: (jobId, updates) => {
    set((state) => ({
      jobs: state.jobs.map(job => 
        job.id === jobId 
          ? { ...job, ...updates, updatedAt: Date.now() } 
          : job
      )
    }));
  },

  removeJob: (jobId) => {
    set((state) => ({
      jobs: state.jobs.filter(job => job.id !== jobId)
    }));
  },

  clearQueue: () => {
    set({ jobs: [] });
  },

  updateAISettings: (updates) => {
    set((state) => ({
      settings: { ...state.settings, ...updates }
    }));
  },

  updateProviderKey: (providerId, apiKey) => {
    set((state) => ({
      settings: {
        ...state.settings,
        providers: state.settings.providers.map(p => 
          p.id === providerId ? { ...p, apiKey, enabled: apiKey.length > 0 } : p
        )
      }
    }));
  },

  setActiveProvider: (providerId) => {
    set((state) => ({
      settings: {
        ...state.settings,
        activeProviderId: providerId
      }
    }));
  },

  getActiveJobsCount: () => {
    return get().jobs.filter(j => j.status === 'processing' || j.status === 'queued').length;
  },
}));
