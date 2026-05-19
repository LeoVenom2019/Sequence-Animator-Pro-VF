export type AIJobStatus = 'queued' | 'processing' | 'preview-ready' | 'applied' | 'failed' | 'cancelled';

export type AIJobType = 'interpolation' | 'depth-map' | 'layer-separation' | 'upscale' | 'motion-suggestion';

export interface AIJob {
  id: string;
  type: AIJobType;
  status: AIJobStatus;
  progress: number;
  createdAt: number;
  updatedAt: number;
  sourceId?: string; // layerId or assetId
  output?: any; // preview data, new layer data, etc.
  error?: string;
  config: any;
}

export interface AIProviderConfig {
  id: string;
  name: string;
  type: 'local' | 'cloud' | 'mock';
  apiKey?: string;
  endpoint?: string;
  enabled: boolean;
}

export interface AISettings {
  activeProviderId: string;
  providers: AIProviderConfig[];
  autoApplyResults: boolean;
  maxConcurrentJobs: number;
}
