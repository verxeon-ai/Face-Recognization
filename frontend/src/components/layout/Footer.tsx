"use client";

import { useEffect, useState } from "react";

export function Footer() {
  const [endpointLabel, setEndpointLabel] = useState<string>("…");
  const [online, setOnline] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let retries = 0;
    const tick = async () => {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        if (cancelled) return;
        const wasOnline = online;
        setOnline(res.ok);
        if (res.ok) retries = 0;
        if (!wasOnline && res.ok) {
          const ipRes = await fetch("/api/local_ip", { cache: "no-store" });
          if (ipRes.ok) {
            const data = await ipRes.json();
            if (data?.public_base_url) {
              setEndpointLabel(data.public_base_url.replace(/^https?:\/\//, ""));
            } else if (data?.local_ip) {
              setEndpointLabel(`${data.local_ip}:5001`);
            }
          }
        }
      } catch {
        if (!cancelled) {
          retries++;
          setOnline(false);
        }
      }
    };
    tick();
    const id = window.setInterval(tick, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <footer className="mt-auto border-t border-aegis-border bg-aegis-bg">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 text-[11px] text-aegis-muted lg:px-6">
        <div className="font-medium tracking-wide">AegisAI · Video Threat Defense</div>
        <div className="flex flex-wrap items-center gap-3 font-mono">
          <span>Endpoint: {endpointLabel}</span>
          <span
            className={`inline-flex items-center gap-1.5 ${
              online ? "text-aegis-green" : "text-aegis-red"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                online ? "bg-aegis-green" : "bg-aegis-red"
              }`}
            />
            {online ? "Backend online" : "Backend offline"}
          </span>
        </div>
      </div>
    </footer>
  );
}
