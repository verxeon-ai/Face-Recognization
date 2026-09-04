import type {
  AlertItem,
  CamerasMap,
  ImageAnalysisResult,
  Incident,
  PhoneFrameResult,
  PhoneStatus,
  SystemStats,
  ThreatRules,
  ThreatStatus,
  VideoJobProgress,
} from "@/types";

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getStats: () => fetch("/api/stats").then((r) => parseJson<SystemStats>(r)),
  getAlerts: () => fetch("/api/alerts").then((r) => parseJson<AlertItem[]>(r)),
  getThreatStatus: () =>
    fetch("/api/threat_status").then((r) => parseJson<ThreatStatus>(r)),
  getIncidents: () =>
    fetch("/api/incidents").then((r) => parseJson<Incident[]>(r)),
  verifyIncident: (incident_id: string, action: string, notes?: string) =>
    fetch("/api/verify_incident", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        incident_id,
        action,
        notes: notes || "Operator verified via SOC console",
      }),
    }).then((r) => parseJson<{ success: boolean; incident?: Incident; error?: string }>(r)),
  updateRules: (payload: Partial<ThreatRules>) =>
    fetch("/api/update_rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => parseJson<{ success?: boolean; rules?: ThreatRules; error?: string }>(r)),
  getCameras: () => fetch("/api/cameras").then((r) => parseJson<CamerasMap>(r)),
  updateCamera: (cam_id: number, name?: string, url?: string) =>
    fetch("/api/cameras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cam_id, name, url }),
    }).then((r) => parseJson<{ success: boolean; cameras: CamerasMap }>(r)),
  dispatchTestAlert: () =>
    fetch("/api/dispatch_test_alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threat_type: "SOC Connectivity Test" }),
    }).then((r) => parseJson<{ success: boolean }>(r)),
  switchRole: (role: "Admin" | "Operator") =>
    fetch("/api/auth/switch_role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
      credentials: "include",
    }).then((r) => parseJson<{ success: boolean; current_role: string }>(r)),
  getPhoneStatus: () =>
    fetch("/api/phone_status").then((r) => parseJson<PhoneStatus>(r)),
  streamPhoneFrame: (image: string) =>
    fetch("/api/stream_phone_frame", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image }),
    }).then((r) => parseJson<PhoneFrameResult>(r)),
  uploadImage: (file: File) => {
    const fd = new FormData();
    fd.append("image", file);
    return fetch("/upload_image", { method: "POST", body: fd }).then((r) =>
      parseJson<ImageAnalysisResult>(r)
    );
  },
  uploadVideo: (file: File) => {
    const fd = new FormData();
    fd.append("video", file);
    return fetch("/upload_video", { method: "POST", body: fd }).then((r) =>
      parseJson<{ success: boolean; job_id: string }>(r)
    );
  },
  videoProgress: (jobId: string) =>
    fetch(`/video_progress/${jobId}`).then((r) =>
      parseJson<VideoJobProgress>(r)
    ),
  addPerson: (name: string, images: File[]) => {
    const fd = new FormData();
    fd.append("name", name);
    images.forEach((img) => fd.append("images", img));
    return fetch("/add_person", { method: "POST", body: fd }).then((r) =>
      parseJson<{ success: boolean; message: string; name: string; images_saved: number }>(r)
    );
  },
};
