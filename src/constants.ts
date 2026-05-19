import { ExportPreset } from './types';

export const EXPORT_PRESETS: ExportPreset[] = [
  {
    id: 'steam-capsule',
    name: 'Steam Animated Capsule',
    description: 'Optimized for Steam library headers (616x353)',
    format: 'webp',
    fps: 15,
    width: 616,
    height: 353,
    quality: 80
  },
  {
    id: 'discord-gif',
    name: 'Discord Nitro GIF',
    description: 'High quality GIF for Discord avatars and banners',
    format: 'gif',
    fps: 24,
    width: 600,
    height: 600
  },
  {
    id: 'cinematic-4k',
    name: 'Cinematic 4K (MP4)',
    description: 'Highest quality H.264 MP4 export',
    format: 'mp4',
    fps: 24,
    width: 3840,
    height: 2160
  },
  {
    id: 'web-optimized',
    name: 'Web Optimized WebP',
    description: 'Smallest file size for web animations',
    format: 'webp',
    fps: 12,
    width: 1280,
    height: 720,
    quality: 60
  }
];
