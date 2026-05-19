import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import { Worker } from "worker_threads";
import { fileURLToPath } from "url";
import { dirname } from "path";

const _filename = typeof import.meta !== "undefined" && import.meta.url 
  ? fileURLToPath(import.meta.url) 
  : __filename;

const _dirname = typeof import.meta !== "undefined" && import.meta.url 
  ? dirname(_filename) 
  : __dirname;


async function startServer() {
  const app = express();
  const PORT = 3001;

  // Middleware for parsing large bodies
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  const jobs = new Map<string, any>();
  const TEMP_DIR = path.join(process.cwd(), "temp_frames");
  const EXPORT_DIR = path.join(process.cwd(), "exports");

  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
  if (!fs.existsSync(EXPORT_DIR)) fs.mkdirSync(EXPORT_DIR, { recursive: true });

  // API Routes
  app.post("/api/export", async (req, res) => {
    const { frames, settings, format } = req.body;
    const jobId = uuidv4();
    
    const job: any = {
      id: jobId,
      status: 'queued',
      progress: 0,
      format,
      createdAt: Date.now()
    };
    
    jobs.set(jobId, job);

    // Start worker
    try {
      const isProd = process.env.NODE_ENV === 'production';
      const workerExt = isProd ? '.cjs' : '.ts';
      const workerPath = path.join(_dirname, isProd ? "src/server/workers/exportWorker.cjs" : "src/server/workers/exportWorker.ts");
      
      const worker = new Worker(workerPath, {
        workerData: {
          jobId,
          frames,
          settings,
          format,
          tempDir: TEMP_DIR,
          exportDir: EXPORT_DIR
        }
      });

      worker.on('message', (message) => {
        if (message.type === 'progress') {
          job.status = 'processing';
          job.progress = message.data;
          jobs.set(jobId, { ...job });
        } else if (message.type === 'completed') {
          job.status = 'completed';
          job.progress = 100;
          job.outputPath = message.data;
          jobs.set(jobId, { ...job });
        } else if (message.type === 'error') {
          job.status = 'failed';
          job.error = message.data;
          jobs.set(jobId, { ...job });
        }
      });

      worker.on('error', (err) => {
        job.status = 'failed';
        job.error = err.message;
        jobs.set(jobId, { ...job });
      });

      res.json({ jobId });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Real Gemini API Integration Routes
  app.post("/api/ai/suggestions", async (req, res) => {
    const { apiKey, composition, selectedLayer } = req.body;
    if (!apiKey) {
      return res.status(400).json({ error: "Gemini API Key is required. Please set it in the Settings tab." });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
        You are an expert AI Cinematographer and Director of Photography for the web-based video compositor Sequence Animator PRO.
        Your goal is to analyze the composition and suggest exactly 3 custom, highly creative, dynamic and context-aware animations or camera movements.
        
        Composition Metadata:
        - Name: "${composition.name}"
        - Resolution: ${composition.width}x${composition.height}
        - Duration: ${composition.duration} frames
        - Frame Rate (FPS): ${composition.fps}
        - Layers: ${JSON.stringify(composition.layers.map((l: any) => ({ id: l.id, name: l.name, type: l.type, parallaxDepth: l.parallaxDepth })))}
        - Active Camera Settings: Zoom: ${composition.camera.zoom}, PosX: ${composition.camera.x}, PosY: ${composition.camera.y}
        
        Selected Layer info (if any):
        ${selectedLayer ? JSON.stringify({ id: selectedLayer.id, name: selectedLayer.name, type: selectedLayer.type, text: selectedLayer.text || "" }) : "None selected"}

        Generate exactly 3 suggestions. Return ONLY a valid JSON array matching this exact schema (no markdown, no wrap blocks, no extra explanations):
        [
          {
            "id": "suggestion-id-1",
            "title": "Creative Cinematic Title",
            "description": "Short explanation of why this keyframe sequence creates tension or fits the scene's name.",
            "category": "camera" | "layer" | "look",
            "keyframes": [
              {
                "target": "camera" | "layer",
                "property": "x" | "y" | "zoom" | "rotation" | "opacity" | "characterReveal" | "blur" | "fontSize" | "letterSpacing",
                "keyframes": [
                  { "frame": 0, "value": 1.0, "easing": "easeInOut" },
                  { "frame": 30, "value": 1.4, "easing": "easeInOut" }
                ]
              }
            ]
          }
        ]

        Only use standard easings: "linear", "easeIn", "easeOut", "easeInOut", "cubic", "quart", "quint", "back", "elastic", "bounce".
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const suggestions = JSON.parse(response.text || "[]");
      res.json({ suggestions });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/ai/depth-map", async (req, res) => {
    const { apiKey, frameUrl, layerName } = req.body;
    if (!apiKey) {
      return res.status(400).json({ error: "Gemini API Key is required." });
    }
    if (!frameUrl) {
      return res.status(400).json({ error: "Frame image URL (Base64) is required." });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      // Convert Base64 data URL to standard Gemini format
      const base64Data = frameUrl.split(",")[1] || frameUrl;
      const mimeType = frameUrl.split(";")[0].split(":")[1] || "image/png";

      const prompt = `
        Analyze this sequence frame named "${layerName || "Layer"}" to calculate its scene depth composition.
        Determine the primary subjects, midground assets, and background scenery.
        Provide a smart depth estimation.
        
        Return ONLY a valid JSON object matching this schema:
        {
          "parallaxDepth": number, // Estimated parallax depth value (e.g. -300 for distant bg, 0 for middle focal, 300 for foreground closeups)
          "focalDistance": number, // Estimated focal distance (0 to 1000)
          "focalRange": number, // Suggest focal range (100 to 500)
          "description": "Visual breakdown explaining the subjects, background and 3D depth separation."
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          },
          prompt
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const analysis = JSON.parse(response.text || "{}");
      res.json({ analysis });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/export/:jobId", (req, res) => {
    const job = jobs.get(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json(job);
  });

  app.get("/api/download/:jobId", (req, res) => {
    const job = jobs.get(req.params.jobId);
    if (!job || job.status !== 'completed' || !job.outputPath) {
      return res.status(404).json({ error: "File not ready" });
    }
    res.download(job.outputPath);
  });

  // Serve Exports
  app.use("/exports", express.static(EXPORT_DIR));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
