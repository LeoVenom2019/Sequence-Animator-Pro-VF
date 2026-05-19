import { ExportFormat, ProjectSettings, ExportJob } from '../types';

export const exportService = {
  async startExport(frames: string[], settings: ProjectSettings, format: ExportFormat): Promise<string> {
    const response = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frames, settings, format }),
    });

    if (!response.ok) {
      throw new Error('Export failed to start');
    }

    const { jobId } = await response.json();
    return jobId;
  },

  async getJobStatus(jobId: string): Promise<ExportJob> {
    const response = await fetch(`/api/export/${jobId}`);
    if (!response.ok) throw new Error('Failed to fetch job status');
    return response.json();
  },

  getDownloadUrl(jobId: string): string {
    return `/api/download/${jobId}`;
  }
};
