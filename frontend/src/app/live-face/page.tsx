"use client";

import { useState } from "react";
import { Activity, EyeOff, Play } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { CameraViewport } from "@/components/security/CameraViewport";

export default function LiveFacePage() {
  const [streaming, setStreaming] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [feedLive, setFeedLive] = useState(false);

  const start = () => {
    setRefreshKey((k) => k + 1);
    setStreaming(true);
  };

  const hide = () => {
    setStreaming(false);
    setFeedLive(false);
  };

  return (
    <div>
      <PageHeader
        title="Live Face Recognition Stream"
        description="OpenCV YuNet landmark alignment & SFace 128D matching — identity labels draw on the live feed."
        actions={
          <>
            <Button
              size="sm"
              variant="primary"
              disabled={streaming}
              onClick={start}
            >
              <Play className="h-3.5 w-3.5" /> Show Camera Feed
            </Button>
            <Button
              size="sm"
              variant="danger"
              disabled={!streaming}
              onClick={hide}
            >
              <EyeOff className="h-3.5 w-3.5" /> Hide Feed
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
                  onLiveChange={setFeedLive}
                />
              ) : (
                <div className="flex min-h-[420px] items-center justify-center text-sm text-aegis-muted">
                  Feed hidden — backend camera may still be running.
                </div>
              )}
              {streaming ? (
                <div className="absolute right-3 top-3 z-10">
                  <Badge tone={feedLive ? "alert" : "neutral"} pulse={feedLive}>
                    {feedLive ? "● STREAM LIVE" : "○ CONNECTING"}
                  </Badge>
                </div>
              ) : null}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Activity className="h-4 w-4 text-aegis-secondary" />
                Recognition Engine
              </div>
            </CardHeader>
            <CardBody className="space-y-0 p-0">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-aegis-border">
                    <td className="px-4 py-3 text-aegis-secondary">Viewport</td>
                    <td className="px-4 py-3 text-right">
                      <Badge
                        tone={streaming && feedLive ? "live" : "neutral"}
                        pulse={streaming && feedLive}
                      >
                        {!streaming
                          ? "Hidden"
                          : feedLive
                            ? "● LIVE"
                            : "Connecting"}
                      </Badge>
                    </td>
                  </tr>
                  <tr className="border-b border-aegis-border">
                    <td className="px-4 py-3 text-aegis-secondary">Detector</td>
                    <td className="px-4 py-3 text-right font-medium text-aegis-text">
                      YuNet DNN
                    </td>
                  </tr>
                  <tr className="border-b border-aegis-border">
                    <td className="px-4 py-3 text-aegis-secondary">Matcher</td>
                    <td className="px-4 py-3 text-right font-medium text-aegis-text">
                      SFace 128D
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
              <p className="border-t border-aegis-border px-4 py-3 text-xs text-aegis-muted">
                Recognized names and unknown alerts appear as overlays on the
                annotated MJPEG stream.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
