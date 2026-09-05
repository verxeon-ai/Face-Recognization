"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, RefreshCw, ShieldCheck, UserX } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { api } from "@/lib/api/client";
import type { AlertItem } from "@/types";

export default function AuditTrailPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.getAlerts();
      setAlerts(list);
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Security Alert Log"
        description="Face-recognition and threat alerts recorded by the backend (latest first)."
        actions={
          <>
            <Badge tone="neutral">{alerts.length} alerts</Badge>
            <Button size="sm" onClick={() => load()} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Bell className="h-4 w-4 text-aegis-amber" />
            Logged Alerts
          </div>
          <span className="text-[11px] text-aegis-muted">
            From data/alerts_log.json
          </span>
        </CardHeader>
        <CardBody>
          {loading && alerts.length === 0 ? (
            <div className="py-12 text-center text-sm text-aegis-muted">
              Loading alert log…
            </div>
          ) : alerts.length === 0 ? (
            <div className="py-16 text-center text-aegis-muted">
              <ShieldCheck className="mx-auto h-10 w-10 text-aegis-green opacity-75" />
              <h3 className="mt-3 text-base font-semibold text-aegis-text">
                All Clear · No Alerts Logged
              </h3>
              <p className="mt-1 text-sm">
                Unknown faces and safety threats will appear here when detected.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert, idx) => (
                <div
                  key={`${alert.timestamp}-${idx}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-aegis-border bg-aegis-panel px-4 py-3 transition-colors hover:border-aegis-red/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-aegis-red/30 bg-aegis-red/15 text-aegis-red">
                      <UserX className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-aegis-text">
                        {alert.message}
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] text-aegis-muted">
                        {alert.timestamp}
                        {alert.confidence != null
                          ? ` · conf ${Math.round(alert.confidence)}%`
                          : ""}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
