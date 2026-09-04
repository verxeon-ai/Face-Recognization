"use client";

import { useState } from "react";
import { Activity, Play, Square, UserRound } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { CameraViewport } from "@/components/security/CameraViewport";

export default function LiveFacePage() {
  const [streaming, setStreaming] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const start = () => {
    setRefreshKey((k) => k + 1);
    setStreaming(true);
  };

  const stop = () => setStreaming(false);

  return (
    <div>
      <PageHeader
        title="Live Face Recognition Stream"
        description="OpenCV YuNet Landmark Alignment & SFace 128D Deep Feature Vector Matching"
        actions={
          <>
            <Button
              size="sm"
              variant="primary"
              disabled={streaming}
              onClick={start}
            >
              <Play className="h-3.5 w-3.5" /> Start Camera Feed
            </Button>
            <Button
              size="sm"
              variant="danger"
              disabled={!streaming}
              onClick={stop}
            >
              <Square className="h-3.5 w-3.5" /> Stop Feed
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Card className="overflow-hidden">
            <div className="relative min-h-[420px] bg-black">
              {streaming ? (
                <CameraViewport
                  src="/video_feed"
                  alt="Live Camera Feed"
                  refreshKey={refreshKey}
                  className="min-h-[420px]"
                  imgClassName="min-h-[420px] max-h-[530px]"
                />
              ) : (
                <div className="flex min-h-[420px] items-center justify-center text-sm text-aegis-muted">
                  Camera feed stopped
                </div>
              )}
              {streaming ? (
                <div className="absolute right-3 top-3 z-10">
                  <Badge tone="alert" pulse>
                    ● STREAM LIVE
                  </Badge>
                </div>
              ) : null}
            </div>
          </Card>
        </div>

        <div className="space-y-3 lg:col-span-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Activity className="h-4 w-4 text-aegis-secondary" />
                Real-Time Telemetry
              </div>
            </CardHeader>
            <CardBody className="space-y-0 p-0">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-aegis-border">
                    <td className="px-4 py-3 text-aegis-secondary">Engine State</td>
                    <td className="px-4 py-3 text-right">
                      <Badge tone={streaming ? "live" : "neutral"} pulse={streaming}>
                        {streaming ? "● STREAMING" : "Stopped"}
                      </Badge>
                    </td>
                  </tr>
                  <tr className="border-b border-aegis-border">
                    <td className="px-4 py-3 text-aegis-secondary">Face Detection</td>
                    <td className="px-4 py-3 text-right font-medium text-aegis-text">
                      YuNet DNN (5 Landmarks)
                    </td>
                  </tr>
                  <tr className="border-b border-aegis-border">
                    <td className="px-4 py-3 text-aegis-secondary">Embedding Metric</td>
                    <td className="px-4 py-3 text-right font-medium text-aegis-text">
                      SFace (128D Deep L2)
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-aegis-secondary">Threshold</td>
                    <td className="px-4 py-3 text-right font-medium text-aegis-cyan">
                      Cosine ≥ 0.363
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <UserRound className="h-4 w-4 text-aegis-green" />
                Identified in View
              </div>
            </CardHeader>
            <CardBody>
              <div className="py-8 text-center text-sm text-aegis-muted">
                <UserRound className="mx-auto mb-2 h-8 w-8 opacity-25" />
                Face labels render on the annotated MJPEG stream.
                <br />
                Start the camera to begin scanning.
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
