"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function CameraViewport({
  src,
  alt,
  className,
  imgClassName,
  refreshKey,
  onLiveChange,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  refreshKey?: number | string;
  onLiveChange?: (live: boolean) => void;
}) {
  const [failed, setFailed] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const onLiveRef = useRef(onLiveChange);
  onLiveRef.current = onLiveChange;

  useEffect(() => {
    const sep = src.includes("?") ? "&" : "?";
    const bust = `${src}${sep}t=${Date.now()}${
      refreshKey != null ? `&k=${refreshKey}` : ""
    }`;
    setUrl(bust);
    setFailed(false);
    onLiveRef.current?.(false);
  }, [src, refreshKey]);

  const live = !!url && !failed;

  return (
    <div className={cn("relative overflow-hidden bg-black", className)}>
      <div className="pointer-events-none absolute inset-0 z-[1] bg-grid-fade opacity-40" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={failed || !url ? undefined : url}
        alt={alt}
        className={cn("relative z-[2] h-full w-full object-contain", imgClassName)}
        onError={() => {
          setFailed(true);
          onLiveRef.current?.(false);
        }}
        onLoad={() => {
          setFailed(false);
          onLiveRef.current?.(true);
        }}
      />
      {!live ? (
        <div className="absolute inset-0 z-[3] flex items-center justify-center text-xs text-aegis-muted">
          Waiting for sensor feed…
        </div>
      ) : null}
    </div>
  );
}
