export const NAV_ITEMS = [
  {
    href: "/image-triage",
    label: "Image Triage",
    icon: "Image",
  },
  {
    href: "/video-scanner",
    label: "Video Scanner",
    icon: "Film",
  },
] as const;

export const THREAT_MODULES = [
  { id: "weapon", label: "1. Visible Weapon", match: ["Weapon"], icon: "Eye" },
  { id: "fight", label: "2. Physical Fight", match: ["Altercation", "Fight"], icon: "Zap" },
  { id: "fall", label: "3. Fall Detection", match: ["Person Down", "Fall"], icon: "PersonStanding" },
  { id: "loiter", label: "4. Loitering", match: ["Loitering"], icon: "Hourglass" },
  { id: "crowd", label: "5. Crowd Anomaly", match: ["Crowd"], icon: "Users" },
] as const;

export const PHONE_HTTPS_PORT = 5443;
