"use client";

import { useEffect, useMemo, useState } from "react";
import { Link2, QrCode, Smartphone, Wifi } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { CameraViewport } from "@/components/security/CameraViewport";
import { api } from "@/lib/api/client";
import { PHONE_HTTPS_PORT } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { usePolling } from "@/hooks/usePolling";
import type { PhoneStatus } from "@/types";

type Tab = "qr" | "ip";

export default function MobileStreamerPage() {
  const [status, setStatus] = useState<PhoneStatus | null>(null);
  const [localIp, setLocalIp] = useState("");
  const [tab, setTab] = useState<Tab>("qr");
  const [ipUrl, setIpUrl] = useState("");
  const [feedKey, setFeedKey] = useState(0);

  useEffect(() => {
    const host = window.location.hostname;
    fetch("/api/local_ip")
      .then((r) => r.json())
      .then((data) => {
        if (data?.local_ip) setLocalIp(data.local_ip);
        else if (host && host !== "localhost" && host !== "127.0.0.1") setLocalIp(host);
        else setLocalIp("192.168.100.90");
      })
      .catch(() => {
        if (host && host !== "localhost" && host !== "127.0.0.1") setLocalIp(host);
        else setLocalIp("192.168.100.90");
      });
  }, []);

  usePolling(async () => {
    const s = await api.getPhoneStatus();
    setStatus(s);
  }, 1000);

  const connected = !!status?.connected;
  const mobileUrl = useMemo(
    () => `https://${localIp || "192.168.x.x"}:${PHONE_HTTPS_PORT}/mobile-cam`,
    [localIp]
  );

  return (
    <div>
      <PageHeader
        title="Mobile Device Wireless Streamer"
        description="Convert any smartphone into an AI Edge camera sensor via QR handshake"
        actions={
          <Badge tone="live" pulse>
            <QrCode className="h-3.5 w-3.5" /> QR Handshake Ready
          </Badge>
        }
      />

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Card className="overflow-hidden">
            <div className="relative">
              <CameraViewport
                src="/phone_stream"
                alt="Phone Camera Feed"
                refreshKey={feedKey}
                className="min-h-[420px]"
                imgClassName="min-h-[420px] max-h-[520px]"
              />
              <div className="absolute left-3 top-3 z-10">
                <Badge tone={connected ? "live" : "neutral"} pulse={connected}>
                  {connected ? "● CAMERA CONNECTED" : "○ WAITING FOR PHONE"}
                </Badge>
              </div>
              {connected ? (
                <div className="absolute bottom-3 left-3 right-3 z-10">
                  <div className="rounded-md border border-aegis-green/40 bg-aegis-green/15 px-3 py-2 text-center text-xs font-semibold text-aegis-green">
                    ● CAMERA CONNECTED — Live phone feed active
                  </div>
                </div>
              ) : null}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Link2 className="h-4 w-4 text-aegis-secondary" />
                Connect Phone as Surveillance Sensor
              </div>
            </CardHeader>
            <CardBody>
              <div className="mb-4 flex gap-1 border-b border-aegis-border">
                {(
                  [
                    { id: "qr" as const, label: "1. Scan with Phone" },
                    { id: "ip" as const, label: "2. IP Webcam" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={cn(
                      "border-b-2 px-3 py-2 text-xs font-semibold transition-colors",
                      tab === t.id
                        ? "border-aegis-cyan text-aegis-cyan"
                        : "border-transparent text-aegis-secondary hover:text-aegis-text"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {tab === "qr" ? (
                <div className="rounded-xl border border-aegis-border bg-aegis-panel p-4 text-center">
                  <p className="mb-3 text-xs text-aegis-secondary">
                    Open your iPhone / Android camera app and scan this QR code to
                    stream directly to this dashboard:
                  </p>
                  <div className="mb-3 inline-block rounded-xl bg-white p-3">
                    <QRCodeSVG value={mobileUrl} size={170} level="M" />
                  </div>
                  <label className="mb-2 block text-left text-[11px] text-aegis-muted">
                    Laptop LAN IP (editable)
                    <input
                      className="mt-1 font-mono text-aegis-cyan"
                      value={localIp}
                      onChange={(e) => setLocalIp(e.target.value)}
                      placeholder="192.168.x.x"
                    />
                  </label>
                  <div className="break-all rounded-lg border border-aegis-border bg-black/50 px-3 py-2 font-mono text-xs text-aegis-cyan">
                    {mobileUrl}
                  </div>
                  <p className="mt-3 text-left text-[11px] leading-relaxed text-aegis-secondary">
                    1) Same Wi‑Fi as this laptop
                    <br />
                    2) Scan QR → on phone tap{" "}
                    <strong className="text-aegis-text">
                      Advanced → Proceed / Visit Site
                    </strong>{" "}
                    (accept the certificate warning)
                    <br />
                    3) Tap{" "}
                    <strong className="text-aegis-text">Allow Camera</strong> —
                    live video appears on this page
                  </p>
                  <a
                    href={mobileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-xs font-semibold text-aegis-cyan hover:underline"
                  >
                    Open mobile-cam link (cert accept)
                  </a>
                </div>
              ) : (
                <div className="rounded-xl border border-aegis-border bg-aegis-panel p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-aegis-text">
                    <Wifi className="h-4 w-4 text-aegis-amber" />
                    IP Webcam App
                  </div>
                  <p className="mb-3 text-xs text-aegis-secondary">
                    Install an IP Webcam app on your phone, start the HTTP video
                    stream, then paste the MJPEG /video URL below. Prefer the
                    built-in QR mobile-cam flow for recognition overlays.
                  </p>
                  <label className="block text-xs text-aegis-secondary">
                    IP Stream URL
                    <input
                      className="mt-1"
                      value={ipUrl}
                      onChange={(e) => setIpUrl(e.target.value)}
                      placeholder="http://192.168.1.100:8080/video"
                    />
                  </label>
                  <Button
                    className="mt-3 w-full"
                    size="sm"
                    onClick={() => {
                      if (!ipUrl.trim()) {
                        alert("Enter stream URL");
                        return;
                      }
                      setFeedKey((k) => k + 1);
                    }}
                  >
                    <Smartphone className="h-3.5 w-3.5" /> Refresh Phone Feed
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
