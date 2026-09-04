"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function CameraViewport({
  src,
  alt,
  className,
  imgClassName,
  refreshKey,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  refreshKey?: number | string;
}) {
  const [failed, setFailed] = useState(false);
  // Defer cache-busting until after mount to avoid SSR/client hydration mismatch
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const sep = src.includes("?") ? "&" : "?";
    const bust = `${src}${sep}t=${Date.now()}${
      refreshKey != null ? `&k=${refreshKey}` : ""
    }`;
    setUrl(bust);
    setFailed(false);
  }, [src, refreshKey]);

  return (
    <div className={cn("relative overflow-hidden bg-black", className)}>
      <div className="pointer-events-none absolute inset-0 z-[1] bg-grid-fade opacity-40" />
      {/* MJPEG streams require raw img — next/image breaks multipart */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={failed || !url ? undefined : url}
        alt={alt}
        className={cn("relative z-[2] h-full w-full object-contain", imgClassName)}
        onError={() => setFailed(true)}
        onLoad={() => setFailed(false)}
      />
      {!url || failed ? (
        <div className="absolute inset-0 z-[3] flex items-center justify-center text-xs text-aegis-muted">
          Waiting for sensor feed…
        </div>
      ) : null}
    </div>
  );
}
