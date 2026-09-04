export type Role = "Admin" | "Security Operator";

export interface SystemStats {
  total_persons: number;
  model: string;
  threshold: string;
  encodings_loaded: boolean;
  model_loaded: boolean;
  persons: string[];
}

export interface AlertItem {
  timestamp: string;
  message: string;
  confidence?: number;
  distance?: number;
}

export interface ThreatItem {
  type: string;
  confidence: number;
  details?: string;
}

export interface ThreatStatus {
  threats_count: number;
  threats: ThreatItem[];
  persons_in_view: number;
  motion_energy: number;
  camera_name: string;
  timestamp: string;
}

export type IncidentStatus =
  | "Pending Review"
  | "VERIFIED"
  | "FALSE_ALARM"
  | string;

export interface Incident {
  incident_id: string;
  camera_id: string;
  location: string;
  timestamp: string;
  threat_type: string;
  confidence: number;
  details?: string;
  snapshot_url: string;
  video_clip_url?: string;
  status: IncidentStatus;
  verified_at?: string | null;
  verifier_notes?: string;
}

export interface CameraInfo {
  name: string;
  source_type: string;
  active?: boolean;
}

export type CamerasMap = Record<string, CameraInfo>;

export interface PhoneStatus {
  connected: boolean;
  status: "connected" | "waiting" | string;
  last_frame_age: number | null;
}

export interface RecognizedPerson {
  name: string;
  confidence: number;
  score?: number;
}

export interface PhoneFrameResult {
  success: boolean;
  connected?: boolean;
  recognized: RecognizedPerson[];
  unknowns: number;
}

export interface ImageAnalysisResult {
  success: boolean;
  original_image: string;
  result_image: string;
  results: {
    total_faces: number;
    recognized_persons: RecognizedPerson[];
    unknown_persons: number;
    all_in_dataset: boolean;
    alert: boolean;
  };
  alert: boolean;
}

export interface VideoJobProgress {
  progress: number;
  status: "processing" | "done" | "not_found" | string;
  results?: {
    total_frames: number;
    recognized_persons: string[];
    frames_with_unknowns?: number;
    unknown_frames_count?: number;
    all_in_dataset: boolean;
    alert: boolean;
  };
  output_filename?: string;
}

export interface ThreatRules {
  loitering_threshold_seconds?: number;
  crowd_surge_threshold?: number;
  motion_energy_threshold?: number;
  confidence_threshold?: number;
  camera_name?: string;
  webhook_url?: string;
  alert_email_recipient?: string;
  smtp_host?: string;
  [key: string]: unknown;
}
