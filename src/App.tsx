import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ScriptStudioView } from './components/ScriptStudioView';
import { VideoPlayerView } from './components/VideoPlayerView';
import { FootageManagerView } from './components/FootageManagerView';
import { YouTubeSchedulerView } from './components/YouTubeSchedulerView';
import { PipelineTerminalModal } from './components/PipelineTerminalModal';
import { DashboardData, ScriptItem, PipelineLog } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedScript, setSelectedScript] = useState<ScriptItem | null>(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [logs, setLogs] = useState<PipelineLog[]>([]);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/pipeline/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        if (dashboardData) {
          setDashboardData(prev => prev ? {
            ...prev,
            pipeline: {
              isRunning: data.isRunning,
              activeStep: data.activeStep,
              progress: data.progress
            }
          } : null);
        }
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchLogs();
  }, []);

  // Poll logs and dashboard data when pipeline is running
  useEffect(() => {
    const isRunning = dashboardData?.pipeline.isRunning;
    const interval = setInterval(() => {
      fetchLogs();
      if (isRunning) {
        fetchDashboardData();
      }
    }, isRunning ? 1000 : 4000);

    return () => clearInterval(interval);
  }, [dashboardData?.pipeline.isRunning]);

  const handleRunPipelineStep = async (stepNumber: number) => {
    try {
      setIsTerminalOpen(true);
      await fetch('/api/pipeline/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: stepNumber })
      });
      fetchLogs();
      fetchDashboardData();
    } catch (err) {
      console.error('Error running pipeline step:', err);
    }
  };

  const isRunning = dashboardData?.pipeline.isRunning || false;
  const activeStep = dashboardData?.pipeline.activeStep || null;
  const progress = dashboardData?.pipeline.progress || 0;
  const animes = dashboardData?.animeStats || [];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isRunning={isRunning}
        onOpenTerminal={() => setIsTerminalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            data={dashboardData}
            loading={loading}
            onRunStep={handleRunPipelineStep}
            onOpenTerminal={() => setIsTerminalOpen(true)}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'scripts' && (
          <ScriptStudioView
            animes={animes}
            onSelectScriptForAssemble={(script) => {
              setSelectedScript(script);
              setActiveTab('player');
            }}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'player' && (
          <VideoPlayerView
            selectedScript={selectedScript}
            animes={animes}
            onSelectScript={setSelectedScript}
          />
        )}

        {activeTab === 'footage' && (
          <FootageManagerView
            animes={animes}
            onRefresh={fetchDashboardData}
            onRunStep={handleRunPipelineStep}
          />
        )}

        {activeTab === 'youtube' && (
          <YouTubeSchedulerView />
        )}
      </main>

      {/* Terminal Log Modal */}
      <PipelineTerminalModal
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        logs={logs}
        isRunning={isRunning}
        activeStep={activeStep}
        progress={progress}
        onRunStep={handleRunPipelineStep}
      />
    </div>
  );
};
