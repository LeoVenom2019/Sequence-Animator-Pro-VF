import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useJobStore } from '../store/useJobStore';
import { Loader2, CheckCircle2, AlertCircle, Download, X } from 'lucide-react';

export const JobQueue = () => {
  const { jobs, removeJob } = useJobStore();

  if (jobs.length === 0) return null;

  return (
    <div className="fixed bottom-48 right-6 w-80 space-y-2 z-[60] pointer-events-none">
      <AnimatePresence>
        {jobs.map((job) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className="bg-[#1a1a1a]/95 backdrop-blur-xl border border-zinc-800 rounded-lg p-3 shadow-2xl pointer-events-auto overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {job.status === 'processing' && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />}
                {job.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
                {job.status === 'failed' && <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  {job.format} Render
                </span>
              </div>
              <button 
                onClick={() => removeJob(job.id)}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/5 rounded transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <div className="relative h-1 bg-zinc-800 rounded-full overflow-hidden mb-2">
              <motion.div 
                className={`absolute inset-y-0 left-0 transition-all duration-300 ${
                  job.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${job.progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 font-mono">
                {job.status.toUpperCase()} {job.status === 'processing' && `(${job.progress}%)`}
              </span>
              
              {job.status === 'completed' && job.downloadUrl && (
                <a 
                  href={job.downloadUrl}
                  download
                  className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 font-bold"
                >
                  <Download className="w-3 h-3" />
                  DOWNLOAD
                </a>
              )}
            </div>

            {job.error && (
              <div className="mt-2 text-[9px] text-red-500 font-medium truncate">
                {job.error}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
