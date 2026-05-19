import { create } from 'zustand';
import { ExportJob, ProjectSettings, ExportFormat } from '../types';

interface JobState {
  jobs: ExportJob[];
  addJob: (format: ExportFormat, settings: ProjectSettings) => string;
  updateJob: (jobId: string, updates: Partial<ExportJob>) => void;
  removeJob: (jobId: string) => void;
}

export const useJobStore = create<JobState>((set) => ({
  jobs: [],
  
  addJob: (format, settings) => {
    const id = crypto.randomUUID();
    const newJob: ExportJob = {
      id,
      format,
      settings,
      status: 'queued',
      progress: 0,
      createdAt: Date.now(),
    };
    
    set((state) => ({ jobs: [newJob, ...state.jobs] }));
    return id;
  },

  updateJob: (jobId, updates) => set((state) => ({
    jobs: state.jobs.map(job => job.id === jobId ? { ...job, ...updates } : job)
  })),

  removeJob: (jobId) => set((state) => ({
    jobs: state.jobs.filter(job => job.id !== jobId)
  })),
}));
