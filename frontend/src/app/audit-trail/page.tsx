"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, RefreshCw, ShieldAlert, ShieldCheck, UserX } from "lucide-react";
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
        title="Real-Time Security Audit Trail"
        description="Immutable event history logged automatically when unauthorized individuals or visual threats occur."
        actions={
          <>
            <Badge tone="alert" pulse>
              {alerts.length} Total Incidents
            </Badge>
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
            Logged Security Exceptions
          </div>
          <span className="text-[11px] text-aegis-muted">
            Sorted chronologically (latest first)
          </span>
        </CardHeader>
        <CardBody>
          {loading && alerts.length === 0 ? (
            <div className="py-12 text-center text-sm text-aegis-muted">
              Loading audit trail…
            </div>
          ) : alerts.length === 0 ? (
            <div className="py-16 text-center text-aegis-muted">
              <ShieldCheck className="mx-auto h-10 w-10 text-aegis-green opacity-75" />
              <h3 className="mt-3 text-base font-semibold text-aegis-text">
                All Clear · No Security Alerts
              </h3>
              <p className="mt-1 text-sm">
                When an unauthorized person or safety threat is detected, full
                audit telemetry is stored here.
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
                  <Badge tone="alert">
                    <ShieldAlert className="h-3 w-3" /> HIGH PRIORITY
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
