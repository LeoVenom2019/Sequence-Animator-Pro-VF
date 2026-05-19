import { v4 as uuidv4 } from 'uuid';
import { Frame } from '../types';

export const importService = {
  async processFiles(files: FileList): Promise<Frame[]> {
    const framePromises = Array.from(files).map(async (file, index) => {
      const dataUrl = await this.fileToDataUrl(file);
      const thumbnail = await this.generateThumbnail(dataUrl);
      
      return {
        id: uuidv4(),
        url: dataUrl,
        thumbnail: thumbnail,
        name: file.name,
        index: index,
        size: file.size,
        type: file.type
      } as Frame & { thumbnail: string };
    });

    const frames = await Promise.all(framePromises);
    
    // Smart sorting by filename
    return frames.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  },

  fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  },

  generateThumbnail(dataUrl: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = 120;
        canvas.width = size;
        canvas.height = size;
        
        if (ctx) {
          const ratio = Math.max(size / img.width, size / img.height);
          const w = img.width * ratio;
          const h = img.height * ratio;
          const x = (size - w) / 2;
          const y = (size - h) / 2;
          ctx.drawImage(img, x, y, w, h);
        }
        resolve(canvas.toDataURL('image/webp', 0.7));
      };
      img.src = dataUrl;
    });
  }
};
