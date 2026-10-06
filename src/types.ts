export interface AnimeConfig {
  tag: string;
  nombre: string;
  hashtags?: string;
  clipsCount?: number;
  rawPending?: number;
  potentialShorts?: number;
  scriptsCount?: number;
  renderedCount?: number;
}

export interface ScriptItem {
  id: string;
  tag?: string;
  anime: string;
  titulo: string;
  texto: string;
  voz?: string;
  createdAt?: string;
  bucleLoopCheck?: string;
  polarizingDebate?: string;
  viralScore?: number;
}

export interface RenderItem {
  scriptId: string;
  filename: string;
  titulo: string;
  anime: string;
  tag: string;
  textPreview: string;
  renderedAt: string;
  videoPath: string;
}

export interface UploadItem {
  filename: string;
  status: 'uploaded' | 'scheduled' | 'pending';
  youtube_id?: string;
  scheduled_at?: string;
  vsa?: number; // Viewed vs Swiped Away %
  avd?: number; // Average View Duration %
  commentRate?: number; // Comment to view %
}

export interface DashboardData {
  totalAnimes: number;
  totalScripts: number;
  totalRenders: number;
  totalUploaded: number;
  totalScheduled: number;
  animeStats: AnimeConfig[];
  pipeline: {
    isRunning: boolean;
    activeStep: string | null;
    progress: number;
  };
}

export interface PipelineLog {
  timestamp: string;
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
}

export interface ViralCalibration {
  hookMaxWords: number;
  clipPacingSeconds: number;
  patternInterruptMode: 'auto' | 'snap_zoom' | 'flash_invert' | 'camera_shake';
  subBassDrop: boolean;
  sfxImpactTimestamps: boolean;
  sidechainDucking: boolean;
  zeroDecayTrimMs: number;
  targetVsa: number;
  targetAvd: number;
}
