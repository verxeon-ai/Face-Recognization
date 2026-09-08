"use client";

import { useEffect, useMemo, useState } from "react";
import { Link2, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { CameraViewport } from "@/components/security/CameraViewport";
import { api } from "@/lib/api/client";
import { PHONE_HTTPS_PORT } from "@/lib/constants";
import { usePolling } from "@/hooks/usePolling";
import type { PhoneStatus } from "@/types";

export default function MobileStreamerPage() {
  const [status, setStatus] = useState<PhoneStatus | null>(null);
  const [localIp, setLocalIp] = useState("");
  const [ipReady, setIpReady] = useState(false);
  const [phoneCamUrl, setPhoneCamUrl] = useState("");
  const [isCloud, setIsCloud] = useState(false);

  useEffect(() => {
    const host = window.location.hostname;
    const isLocalHost = host === "localhost" || host === "127.0.0.1";

    // Cloud / HTTPS deploy: same-origin /mobile-cam (ALB terminates TLS)
    if (
      typeof window !== "undefined" &&
      window.location.protocol === "https:" &&
      !isLocalHost
    ) {
      const url = `${window.location.origin}/mobile-cam`;
      setPhoneCamUrl(url);
      setLocalIp(host);
      setIsCloud(true);
      setIpReady(true);
    }

    fetch("/api/local_ip")
      .then((r) => r.json())
      .then((data) => {
        if (data?.phone_cam_url) {
          setPhoneCamUrl(data.phone_cam_url);
          setIsCloud(data.deployment === "cloud" || !!data.public_base_url);
        }
        if (data?.local_ip) {
          setLocalIp(data.local_ip);
          setIpReady(true);
        } else if (host && !isLocalHost) {
          setLocalIp(host);
          setIpReady(true);
        } else if (!data?.phone_cam_url) {
          setIpReady(false);
        }
      })
      .catch(() => {
        if (host && !isLocalHost) {
          setLocalIp(host);
          setIpReady(true);
          if (window.location.protocol === "https:") {
            setPhoneCamUrl(`${window.location.origin}/mobile-cam`);
            setIsCloud(true);
          }
        } else {
          setIpReady(false);
        }
      });
  }, []);

  usePolling(async () => {
    const s = await api.getPhoneStatus();
    setStatus(s);
  }, 1000);

  const connected = !!status?.connected;
  const mobileUrl = useMemo(() => {
    if (phoneCamUrl.trim()) return phoneCamUrl.trim();
    if (localIp.trim()) {
      return `https://${localIp.trim()}:${PHONE_HTTPS_PORT}/mobile-cam`;
    }
    return "";
  }, [phoneCamUrl, localIp]);
  const canQr = !!mobileUrl;

  return (
    <div>
      <PageHeader
        title="Mobile Device Wireless Streamer"
        description="Convert any smartphone into an AI edge camera via HTTPS QR handshake."
        actions={
          <Badge tone={canQr ? "live" : "warn"} pulse={canQr}>
            <QrCode className="h-3.5 w-3.5" />
            {canQr ? "QR Handshake Ready" : "Set LAN IP"}
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
              <div className="rounded-xl border border-aegis-border bg-aegis-panel p-4 text-center">
                <p className="mb-3 text-xs text-aegis-secondary">
                  Open your iPhone / Android camera app and scan this QR code to
                  stream directly to this dashboard:
                </p>
                {canQr ? (
                  <div className="mb-3 inline-block rounded-xl bg-white p-3">
                    <QRCodeSVG value={mobileUrl} size={170} level="M" />
                  </div>
                ) : (
                  <div className="mb-3 rounded-xl border border-dashed border-aegis-border px-4 py-10 text-xs text-aegis-muted">
                    Enter your laptop LAN IP below to generate the QR code.
                    {!ipReady
                      ? " Could not auto-detect IP from the backend."
                      : ""}
                  </div>
                )}
                {!isCloud ? (
                  <label className="mb-2 block text-left text-[11px] text-aegis-muted">
                    Laptop LAN IP (editable)
                    <input
                      className="mt-1 font-mono text-aegis-cyan"
                      value={localIp}
                      onChange={(e) => {
                        setLocalIp(e.target.value);
                        setPhoneCamUrl("");
                      }}
                      placeholder="192.168.x.x"
                    />
                  </label>
                ) : (
                  <p className="mb-2 text-left text-[11px] text-aegis-muted">
                    Cloud HTTPS mode — QR uses your public URL (no cert warning).
                  </p>
                )}
                {canQr ? (
                  <div className="break-all rounded-lg border border-aegis-border bg-black/50 px-3 py-2 font-mono text-xs text-aegis-cyan">
                    {mobileUrl}
                  </div>
                ) : null}
                <p className="mt-3 text-left text-[11px] leading-relaxed text-aegis-secondary">
                  {isCloud ? (
                    <>
                      1) Scan QR on any network
                      <br />
                      2) Tap{" "}
                      <strong className="text-aegis-text">Allow Camera</strong>{" "}
                      — live video appears on this page
                      <br />
                      3) SOC / Live Face also use this phone feed on AWS (no
                      server webcam)
                    </>
                  ) : (
                    <>
                      1) Same Wi‑Fi as this laptop
                      <br />
                      2) Scan QR → on phone tap{" "}
                      <strong className="text-aegis-text">
                        Advanced → Proceed / Visit Site
                      </strong>{" "}
                      (accept the certificate warning)
                      <br />
                      3) Tap{" "}
                      <strong className="text-aegis-text">Allow Camera</strong>{" "}
                      — live video appears on this page
                    </>
                  )}
                </p>
                {canQr ? (
                  <a
                    href={mobileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-xs font-semibold text-aegis-cyan hover:underline"
                  >
                    Open mobile-cam link
                    {isCloud ? "" : " (cert accept)"}
                  </a>
                ) : null}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
