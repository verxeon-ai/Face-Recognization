"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  FlipHorizontal2,
  Pause,
  Play,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api/client";
import type { RecognizedPerson } from "@/types";

type Phase = "permission" | "streaming" | "error";

export default function MobileCamPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);

  const [phase, setPhase] = useState<Phase>("permission");
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  );
  const [sending, setSending] = useState(true);
  const sendingRef = useRef(true);
  const [statusLabel, setStatusLabel] = useState("Starting camera…");
  const [recognized, setRecognized] = useState<RecognizedPerson[]>([]);
  const [unknowns, setUnknowns] = useState(0);
  const [httpsHint, setHttpsHint] = useState(false);

  useEffect(() => {
    sendingRef.current = sending;
  }, [sending]);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.location.protocol !== "https:" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      setHttpsHint(true);
    }
  }, []);

  const stopSender = () => {
    if (intervalRef.current != null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    return () => {
      stopSender();
      stopTracks();
    };
  }, []);

  const startFrameSender = useCallback(() => {
    stopSender();
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }
    const canvas = canvasRef.current;
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    intervalRef.current = window.setInterval(() => {
      const video = videoRef.current;
      if (!sendingRef.current || !video || video.readyState < 2) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.65);
      api
        .streamPhoneFrame(dataUrl)
        .then((data) => {
          setRecognized(data.recognized || []);
          setUnknowns(data.unknowns || 0);
        })
        .catch(() => {});
    }, 120);
  }, []);

  const startCamera = useCallback(
    async (mode: "user" | "environment") => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatusLabel("Camera API unavailable — open via HTTPS QR link");
        setPhase("error");
        return;
      }

      stopTracks();
      try {
        const media = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });
        streamRef.current = media;
        const video = videoRef.current;
        if (video) {
          video.srcObject = media;
          await video.play();
        }
        setPhase("streaming");
        setStatusLabel("● LIVE — Streaming to laptop");
        setSending(true);
        startFrameSender();
      } catch {
        setStatusLabel("Camera permission denied or blocked");
        setPhase("permission");
        alert("Please Allow camera access when prompted, then try again.");
      }
    },
    [startFrameSender]
  );

  useEffect(() => {
    if (phase !== "streaming") return;
    if (sending) {
      startFrameSender();
      setStatusLabel("● LIVE — Streaming to laptop");
    } else {
      stopSender();
      setStatusLabel("Stream Paused");
    }
  }, [sending, phase, startFrameSender]);

  const requestAccess = async () => {
    setStatusLabel("Requesting camera permission…");
    setPhase("streaming");
    await startCamera(facingMode);
  };

  const flipCamera = async () => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    await startCamera(next);
  };

  return (
    <div className="min-h-screen bg-[#07090e] px-3 py-4 text-center text-white">
      <div className="mb-1 flex items-center justify-center gap-2">
        <Shield className="h-6 w-6 text-aegis-cyan" />
        <div className="text-lg font-bold tracking-tight text-aegis-cyan">
          AegisAI Mobile Sensor
        </div>
      </div>
      <p className="mb-4 text-xs text-aegis-secondary">
        Live wireless camera for your laptop dashboard
      </p>

      {phase === "permission" || phase === "error" ? (
        <div className="mx-auto mt-8 max-w-md rounded-2xl border border-aegis-cyan/35 bg-[#0f172a]/95 px-5 py-7">
          <Camera className="mx-auto h-12 w-12 text-aegis-cyan" />
          <h2 className="mt-3 text-base font-semibold">Allow camera access</h2>
          <p className="mt-2 text-xs text-aegis-secondary">
            Tap the button below. Your phone will ask:{" "}
            <strong className="text-white">
              “Allow AegisAI to access your camera?”
            </strong>{" "}
            Choose <strong className="text-aegis-green">Allow</strong> to start
            live streaming.
          </p>
          <Button
            className="mt-4 w-full"
            variant="primary"
            size="lg"
            onClick={requestAccess}
          >
            <Camera className="h-4 w-4" /> Allow Camera & Start Live Stream
          </Button>
          {httpsHint ? (
            <p className="mt-3 text-xs text-aegis-amber">
              This page must be opened with <strong>https://</strong>. Scan the
              QR again from the laptop page after restarting the server.
            </p>
          ) : null}
          {phase === "error" ? (
            <p className="mt-2 text-xs text-aegis-red">{statusLabel}</p>
          ) : null}
        </div>
      ) : null}

      <div
        className={`mx-auto max-w-md ${phase === "streaming" ? "" : "hidden"}`}
      >
        <div className="relative overflow-hidden rounded-2xl border border-aegis-border bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="block max-h-[52vh] w-full object-cover"
          />
        </div>

        <div
          className={`mt-3 inline-block rounded-full px-4 py-2 text-sm font-semibold ${
            sending
              ? "bg-aegis-green/20 text-aegis-green"
              : "bg-aegis-amber/20 text-aegis-amber"
          }`}
        >
          {statusLabel}
        </div>

        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Button size="sm" onClick={flipCamera}>
            <FlipHorizontal2 className="h-3.5 w-3.5" /> Flip Camera
          </Button>
          <Button
            size="sm"
            variant={sending ? "danger" : "primary"}
            onClick={() => setSending((v) => !v)}
          >
            {sending ? (
              <>
                <Pause className="h-3.5 w-3.5" /> Stop Feed
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" /> Resume Feed
              </>
            )}
          </Button>
        </div>

        <div className="mt-4 rounded-2xl border border-aegis-border bg-[#0f172a]/85 p-4 text-left">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-aegis-muted">
            Live Recognition
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recognized.length > 0 ? (
              recognized.map((p) => (
                <Badge key={`${p.name}-${p.confidence}`} tone="live">
                  {p.name} ({Math.round(p.confidence)}%)
                </Badge>
              ))
            ) : unknowns > 0 ? (
              <Badge tone="alert">UNAUTHORIZED PERSON</Badge>
            ) : (
              <span className="text-xs text-aegis-muted">
                Point camera at a face
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
