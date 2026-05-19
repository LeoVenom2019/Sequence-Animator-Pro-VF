/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useProjectStore } from './store/useProjectStore';
import { TopBar } from './ui/TopBar';
import { Sidebar } from './ui/Sidebar';
import { Player } from './ui/Player';
import { Timeline } from './ui/Timeline';
import { DropZone } from './ui/DropZone';
import { ExportPanel } from './ui/ExportPanel';
import { JobQueue } from './ui/JobQueue';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const { currentProject, setProject } = useProjectStore();
  const [isExportOpen, setIsExportOpen] = useState(false);
  const hasFrames = (currentProject?.compositions[0].layers.length ?? 0) > 0;

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('sap_active_project');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProject(parsed);
      } catch (e) {
        console.error("Failed to load project", e);
      }
    }
  }, []);

  useEffect(() => {
    if (currentProject) {
      localStorage.setItem('sap_active_project', JSON.stringify(currentProject));
    }
  }, [currentProject]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0a0a0a] text-zinc-100 font-sans overflow-hidden select-none">
      <TopBar onExportClick={() => setIsExportOpen(true)} />
      
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex flex-col relative bg-[#111111] overflow-hidden">
          <AnimatePresence mode="wait">
            {!hasFrames ? (
              <motion.div 
                key="dropzone"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex items-center justify-center p-8"
              >
                <DropZone />
              </motion.div>
            ) : (
              <motion.div 
                key="player"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col pt-4 px-4 pb-2"
              >
                <Player />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <Sidebar />
      </div>

      <Timeline />

      <ExportPanel isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
      <JobQueue />

      {/* Background Ambient Effect */}
      <div className="fixed inset-0 pointer-events-none z-neg">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/5 blur-[100px] rounded-full" />
      </div>
    </div>
  );
}

