"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  Expand,
  LayoutGrid,
  Radar,
  Settings2,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { CameraViewport } from "@/components/security/CameraViewport";
import { api } from "@/lib/api/client";
import { usePolling } from "@/hooks/usePolling";
import type { CamerasMap, Incident } from "@/types";

const CAMERAS = [
  { id: 1, fallback: "Main Entrance", hint: "YOLOv8 Edge AI" },
  { id: 2, fallback: "North Corridor", hint: "Optical Flow" },
  { id: 3, fallback: "East Parking Lot", hint: "Perimeter Geofence" },
  { id: 4, fallback: "Restricted Vault", hint: "Secure Perimeter" },
] as const;

export default function MultiCameraPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [cameras, setCameras] = useState<CamerasMap>({});
  const [configOpen, setConfigOpen] = useState(false);
  const [camId, setCamId] = useState(1);
  const [camName, setCamName] = useState("");
  const [camUrl, setCamUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const refreshIncidents = async () => {
    const list = await api.getIncidents();
    setIncidents(list);
  };

  usePolling(() => refreshIncidents(), 3000);

  useEffect(() => {
    api.getCameras().then(setCameras).catch(() => setCameras({}));
  }, []);

  const openConfig = async () => {
    try {
      const map = await api.getCameras();
      setCameras(map);
      const first = map["1"];
      setCamId(1);
      setCamName(first?.name || CAMERAS[0].fallback);
      setCamUrl("");
    } catch {
      /* ignore */
    }
    setConfigOpen(true);
  };

  const onSelectCam = (id: number) => {
    setCamId(id);
    const info = cameras[String(id)];
    setCamName(info?.name || CAMERAS[id - 1]?.fallback || `Camera ${id}`);
  };

  const saveCamera = async () => {
    setSaving(true);
    try {
      const res = await api.updateCamera(
        camId,
        camName.trim() || undefined,
        camUrl.trim() || undefined
      );
      if (res.cameras) setCameras(res.cameras);
      setConfigOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update camera");
    } finally {
      setSaving(false);
    }
  };

  const cameraLabel = (id: number) =>
    cameras[String(id)]?.name || CAMERAS[id - 1]?.fallback || `Camera ${id}`;

  return (
    <div>
      <PageHeader
        title="Multi-Camera Surveillance Wall"
        description="4-Up Concurrent AI Security Matrix & Perimeter Health"
        actions={
          <>
            <Badge tone="live" pulse>
              4 STREAMS ONLINE
            </Badge>
            <Link href="/soc">
              <Button size="sm" variant="danger">
                <Radar className="h-3.5 w-3.5" /> Open SOC Triage
              </Button>
            </Link>
            <Button size="sm" onClick={openConfig}>
              <Settings2 className="h-3.5 w-3.5" /> RTSP Feeds
            </Button>
          </>
        }
      />

      <div className="mb-4 grid gap-3 lg:grid-cols-2">
        {CAMERAS.map((cam) => (
          <Card key={cam.id} className="overflow-hidden">
            <div className="relative">
              <CameraViewport
                src={`/threat_video_feed/${cam.id}`}
                alt={`Camera ${cam.id} stream`}
                className="min-h-[260px]"
                imgClassName="min-h-[260px] max-h-[320px] object-cover"
              />
              <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
                <Badge tone="info">
                  <LayoutGrid className="h-3 w-3" />
                  CAM {String(cam.id).padStart(2, "0")}: {cameraLabel(cam.id)}
                </Badge>
              </div>
              <div className="absolute right-3 top-3 z-10">
                <Badge tone="live" pulse>
                  ● ALL CLEAR
                </Badge>
              </div>
              <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between">
                <span className="rounded-full border border-aegis-border bg-black/80 px-3 py-1 font-mono text-[11px] text-aegis-cyan">
                  {cam.hint}
                </span>
                <Link href="/soc">
                  <Button size="sm" variant="ghost">
                    <Expand className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="text-sm font-semibold">Multi-Camera Incident Timeline</div>
          <Link
            href="/soc"
            className="text-xs font-semibold text-aegis-cyan hover:underline"
          >
            Open Live Triage Queue →
          </Link>
        </CardHeader>
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-aegis-border text-[11px] uppercase tracking-[0.12em] text-aegis-muted">
                <th className="px-4 py-3 font-semibold">Incident ID</th>
                <th className="px-4 py-3 font-semibold">Timestamp</th>
                <th className="px-4 py-3 font-semibold">Camera</th>
                <th className="px-4 py-3 font-semibold">Threat</th>
                <th className="px-4 py-3 font-semibold">Confidence</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {incidents.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-aegis-muted"
                  >
                    No security incidents logged across cameras.
                  </td>
                </tr>
              ) : (
                incidents.map((inc) => (
                  <tr
                    key={inc.incident_id}
                    className="border-b border-aegis-border/70 last:border-0"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-aegis-cyan">
                      {inc.incident_id}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-aegis-secondary">
                      {inc.timestamp}
                    </td>
                    <td className="px-4 py-3 font-medium text-aegis-text">
                      {inc.camera_id}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="alert">{inc.threat_type}</Badge>
                    </td>
                    <td className="px-4 py-3 font-semibold text-aegis-amber">
                      {inc.confidence}%
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={
                          inc.status === "VERIFIED"
                            ? "alert"
                            : inc.status === "FALSE_ALARM"
                              ? "neutral"
                              : "warn"
                        }
                      >
                        {inc.status === "VERIFIED"
                          ? "Escalated"
                          : inc.status === "FALSE_ALARM"
                            ? "False Alarm"
                            : "Pending Review"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={inc.status !== "Pending Review"}
                          onClick={async () => {
                            await api.verifyIncident(inc.incident_id, "VERIFIED");
                            await refreshIncidents();
                          }}
                        >
                          <Check className="h-3.5 w-3.5" /> Verify
                        </Button>
                        <Button
                          size="sm"
                          disabled={inc.status !== "Pending Review"}
                          onClick={async () => {
                            await api.verifyIncident(
                              inc.incident_id,
                              "FALSE_ALARM"
                            );
                            await refreshIncidents();
                          }}
                        >
                          <X className="h-3.5 w-3.5" /> Dismiss
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <Modal
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        title="RTSP & Camera Feed Settings"
        footer={
          <>
            <Button onClick={() => setConfigOpen(false)}>Cancel</Button>
            <Button variant="primary" disabled={saving} onClick={saveCamera}>
              {saving ? "Saving…" : "Save Camera Stream"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block text-xs text-aegis-secondary">
            Select Camera Channel
            <select
              className="mt-1"
              value={camId}
              onChange={(e) => onSelectCam(Number(e.target.value))}
            >
              {CAMERAS.map((c) => (
                <option key={c.id} value={c.id}>
                  Camera {String(c.id).padStart(2, "0")} — {cameraLabel(c.id)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-aegis-secondary">
            Camera Display Name
            <input
              className="mt-1"
              value={camName}
              onChange={(e) => setCamName(e.target.value)}
              placeholder="e.g. North Entrance Gate"
            />
          </label>
          <label className="block text-xs text-aegis-secondary">
            RTSP / IP Video URL (or 0 for Local Webcam)
            <input
              className="mt-1"
              value={camUrl}
              onChange={(e) => setCamUrl(e.target.value)}
              placeholder="rtsp://user:pass@192.168.1.100:554/stream"
            />
            <span className="mt-1 block text-[11px] text-aegis-muted">
              Leave empty to use AI sensor simulation.
            </span>
          </label>
        </div>
      </Modal>
    </div>
  );
}
