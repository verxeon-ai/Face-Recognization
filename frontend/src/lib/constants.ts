export const NAV_ITEMS = [
  { href: "/soc", label: "SOC Threat Triage", icon: "Radar" },
  { href: "/multi-camera", label: "Multi-Camera Wall", icon: "LayoutGrid" },
  { href: "/", label: "System Hub", icon: "Cpu" },
  { href: "/live-face", label: "Live Face Cam", icon: "Video" },
  { href: "/mobile-streamer", label: "Mobile Streamer", icon: "Smartphone" },
  { href: "/image-triage", label: "Image Triage", icon: "Image" },
  { href: "/video-scanner", label: "Video Scanner", icon: "Film" },
  { href: "/audit-trail", label: "Audit Trail", icon: "ShieldAlert" },
] as const;

export const THREAT_MODULES = [
  { id: "weapon", label: "1. Visible Weapon", match: ["Weapon"], icon: "Eye" },
  { id: "fight", label: "2. Physical Fight", match: ["Altercation", "Fight"], icon: "Zap" },
  { id: "restricted", label: "3. Restricted Zone", match: ["Restricted"], icon: "ShieldAlert" },
  { id: "fall", label: "4. Fall Detection", match: ["Person Down", "Fall"], icon: "PersonStanding" },
  { id: "loiter", label: "5. Loitering", match: ["Loitering"], icon: "Hourglass" },
  { id: "crowd", label: "6. Crowd Anomaly", match: ["Crowd"], icon: "Users" },
] as const;

export const PHONE_HTTPS_PORT = 5443;
