"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Film,
  Image as ImageIcon,
  Radar,
  Shield,
  Smartphone,
  Users,
  Video,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { api } from "@/lib/api/client";
import type { SystemStats } from "@/types";

const features = [
  {
    href: "/soc",
    title: "SOC Threat Triage",
    desc: "Live threat analytics with human verification queue.",
    icon: Radar,
  },
  {
    href: "/live-face",
    title: "Live Face Cam",
    desc: "Real-time SFace identity matching from webcam.",
    icon: Video,
  },
  {
    href: "/mobile-streamer",
    title: "Mobile Streamer",
    desc: "Turn any phone into a wireless AI edge camera.",
    icon: Smartphone,
  },
  {
    href: "/image-triage",
    title: "Image Triage",
    desc: "Upload stills for recognition and unknown alerts.",
    icon: ImageIcon,
  },
  {
    href: "/video-scanner",
    title: "Video Scanner",
    desc: "Batch analyze footage with frame-level reporting.",
    icon: Film,
  },
  {
    href: "/persons",
    title: "Known Identities",
    desc: "Browse the enrolled catalog and register new persons.",
    icon: Users,
  },
];

export default function SystemHubPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);

  useEffect(() => {
    api.getStats().then(setStats).catch(() => setStats(null));
  }, []);

  return (
    <div>
      <PageHeader
        title="System Hub"
        description="Operational overview for AegisAI facial recognition and video threat defense."
        actions={
          <>
            <Link href="/soc">
              <Button variant="danger" size="sm">
                <Radar className="h-3.5 w-3.5" /> Open SOC
              </Button>
            </Link>
            <Link href="/multi-camera">
              <Button size="sm">Multi-Camera Wall</Button>
            </Link>
          </>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Known Persons", value: stats?.total_persons ?? "—" },
          { label: "Model", value: stats?.model?.split("(")[0]?.trim() || "SFace DNN" },
          { label: "Encodings", value: stats?.encodings_loaded ? "Loaded" : "Pending" },
          { label: "Detector", value: stats?.model_loaded ? "Online" : "Offline" },
        ].map((item) => (
          <Card key={item.label}>
            <CardBody>
              <div className="text-[11px] uppercase tracking-[0.14em] text-aegis-muted">
                {item.label}
              </div>
              <div className="mt-2 truncate text-xl font-semibold text-aegis-text">
                {item.value}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {features.map((f) => (
          <Link key={f.href} href={f.href} className="group">
            <Card className="h-full transition-colors group-hover:border-aegis-border-strong">
              <CardBody>
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-aegis-border bg-aegis-panel">
                  <f.icon className="h-4 w-4 text-aegis-secondary" />
                </div>
                <div className="text-sm font-semibold text-aegis-text">{f.title}</div>
                <p className="mt-1 text-sm text-aegis-secondary">{f.desc}</p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mt-5">
        <CardHeader>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Shield className="h-4 w-4 text-aegis-secondary" />
            Known Identities
          </div>
          <Badge tone="live">{stats?.persons?.length ?? 0} enrolled</Badge>
        </CardHeader>
        <CardBody>
          {stats?.persons?.length ? (
            <div className="flex flex-wrap gap-2">
              {stats.persons.map((name) => (
                <span
                  key={name}
                  className="rounded-md border border-aegis-border bg-aegis-panel px-2.5 py-1 text-xs text-aegis-secondary"
                >
                  {name.replaceAll("_", " ")}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-aegis-muted">
              Start the Flask backend to load identity catalog statistics.
            </p>
          )}
          <div className="mt-4">
            <Link href="/persons/add">
              <Button size="sm">Add Person</Button>
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
