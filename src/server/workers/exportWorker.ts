import { parentPort, workerData } from 'worker_threads';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import { ZipArchive } from 'archiver';

if (ffmpegInstaller) {
  ffmpeg.setFfmpegPath(ffmpegInstaller);
}

const { jobId, frames, settings, format, tempDir, exportDir } = workerData;

async function processExport() {
  try {
    const jobDir = path.join(tempDir, jobId);
    if (!fs.existsSync(jobDir)) fs.mkdirSync(jobDir, { recursive: true });

    // 1. Save frames to disk
    const framePaths: string[] = [];
    for (let i = 0; i < frames.length; i++) {
      const base64Data = frames[i].replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');
      const framePath = path.join(jobDir, `frame_${i.toString().padStart(6, '0')}.png`);
      fs.writeFileSync(framePath, buffer);
      framePaths.push(framePath);
    }

    const outputFileName = `export_${jobId}.${getExt(format)}`;
    const outputPath = path.join(exportDir, outputFileName);

    if (format === 'png-sequence') {
      const output = fs.createWriteStream(outputPath);
      const archive = new ZipArchive({ zlib: { level: 9 } });

      output.on('close', () => {
        fs.rmSync(jobDir, { recursive: true, force: true });
        parentPort?.postMessage({ type: 'completed', data: outputPath });
      });

      archive.on('error', (err) => {
        parentPort?.postMessage({ type: 'error', data: err.message });
      });

      archive.pipe(output);
      archive.directory(jobDir, false);
      archive.finalize();
      return;
    }

    // 2. Run FFmpeg
    const command = ffmpeg();
    
    // Input pattern
    command.input(path.join(jobDir, 'frame_%06d.png'))
           .inputFPS(settings.fps);

    // 2.1 Apply Video Filters (Optional, as browser usually pre-processes)
    const filters: string[] = [];
    const colorGrading = settings.colorGrading;
    const effects = settings.effects;

    if (colorGrading) {
      // eq filter: brightness, contrast, saturation, gamma
      // FFmpeg eq: brightness [-1.0, 1.0], contrast [0.0, 10.0], saturation [0.0, 10.0]
      const b = (colorGrading.brightness - 1) + colorGrading.exposure;
      const c = colorGrading.contrast;
      const s = colorGrading.saturation;
      filters.push(`eq=brightness=${b}:contrast=${c}:saturation=${s}`);
    }

    if (effects?.vignette?.enabled) {
      filters.push(`vignette=angle=${effects.vignette.intensity}`);
    }

    if (effects?.grain?.enabled) {
      // Simple noise filter for grain
      filters.push(`noise=alls=${effects.grain.intensity * 100}:allf=t+u`);
    }

    if (format === 'sprite-sheet') {
      filters.push(`tile=${frames.length}x1`);
    }

    if (filters.length > 0) {
      command.videoFilters(filters.join(','));
    }

    // Output options based on format
    if (format === 'mp4') {
      command.outputFormat('mp4')
             .videoCodec('libx264')
             .outputOptions('-pix_fmt yuv420p');
    } else if (format === 'gif') {
      command.outputFormat('gif');
    } else if (format === 'webp') {
      command.outputFormat('webp');
    } else if (format === 'sprite-sheet') {
      command.outputFormat('image2')
             .outputOptions('-vframes 1');
    }

    command.on('progress', (progress) => {
      parentPort?.postMessage({ type: 'progress', data: Math.round(progress.percent || 0) });
    })
    .on('end', () => {
      // Cleanup temp frames
      fs.rmSync(jobDir, { recursive: true, force: true });
      parentPort?.postMessage({ type: 'completed', data: outputPath });
    })
    .on('error', (err) => {
      parentPort?.postMessage({ type: 'error', data: err.message });
    })
    .save(outputPath);

  } catch (err: any) {
    parentPort?.postMessage({ type: 'error', data: err.message });
  }
}

function getExt(format: string) {
  switch (format) {
    case 'mp4': return 'mp4';
    case 'gif': return 'gif';
    case 'webp': return 'webp';
    case 'png-sequence': return 'zip';
    case 'sprite-sheet': return 'png';
    default: return 'bin';
  }
}

processExport();
