"use client";

import { useEffect, useState } from "react";
import { Play, UserPlus } from "lucide-react";
import { CameraViewport } from "@/components/security/CameraViewport";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";

export default function DemoPage() {
  const [live, setLive] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [stats, setStats] = useState<{ persons: number; model: string } | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => setStats({ persons: d.total_persons, model: d.model }))
      .catch(() => {});
  }, []);

  const enroll = async () => {
    setEnrolling(true);
    try {
      await fetch("/api/demo/enroll", { method: "POST" });
      setEnrolled(true);
      const r = await fetch("/api/stats");
      const d = await r.json();
      setStats({ persons: d.total_persons, model: d.model });
    } catch {
      /* ignore */
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-aegis-text">Live Demo</h1>
          <p className="text-xs text-aegis-muted">
            AI face recognition running on a pre-loaded surveillance video.
          </p>
        </div>
        <Badge tone={live ? "live" : "neutral"} pulse={live}>
          {live ? "STREAM ACTIVE" : "OFFLINE"}
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Video Stream */}
        <div className="lg:col-span-8">
          <Card className="overflow-hidden">
            <CameraViewport
              src="/api/demo/stream"
              alt="Live demo stream"
              className="min-h-[400px]"
              imgClassName="min-h-[400px] max-h-[520px]"
              onLiveChange={setLive}
            />
            <div className="flex items-center justify-between border-t border-aegis-border bg-aegis-elevated px-4 py-2">
              <span className="text-xs text-aegis-secondary">
                Source: test_videos/video.mp4 — looped with real-time SFace recognition
              </span>
              <div className="flex gap-2">
                <Badge tone="neutral" className="font-mono text-[10px]">
                  {stats?.persons ?? "—"} identities enrolled
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Demo Face + Controls */}
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardBody>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-aegis-muted">
                Target Face (auto-detected)
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/api/demo/face"
                alt="Demo face"
                className="w-full rounded-lg border border-aegis-border object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-aegis-muted">
                Demo Controls
              </div>
              <Button
                className="w-full"
                variant="primary"
                disabled={enrolling || enrolled}
                onClick={enroll}
              >
                <UserPlus className="h-3.5 w-3.5" />
                {enrolled
                  ? "Face Enrolled"
                  : enrolling
                    ? "Enrolling..."
                    : "Enroll Demo Face"}
              </Button>
              <p className="text-[10px] text-aegis-muted leading-relaxed">
                Enroll the demo face into the recognition database so the model
                identifies it by name in the video stream.
              </p>
            </CardBody>
          </Card>

          {stats ? (
            <Card>
              <CardBody>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-aegis-muted mb-2">
                  Model Info
                </div>
                <div className="space-y-1 text-xs text-aegis-secondary">
                  <div>
                    Engine: <span className="text-aegis-text font-medium">{stats.model}</span>
                  </div>
                  <div>
                    Identities: <span className="text-aegis-text font-medium">{stats.persons}</span>
                  </div>
                  <div>
                    Detector: <span className="text-aegis-text font-medium">YuNet DNN</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
