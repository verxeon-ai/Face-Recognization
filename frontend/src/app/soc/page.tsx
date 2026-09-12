"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Check,
  Film,
  Phone,
  RefreshCw,
  Settings2,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { CameraViewport } from "@/components/security/CameraViewport";
import { api } from "@/lib/api/client";
import { THREAT_MODULES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { usePolling } from "@/hooks/usePolling";
import type { Incident, ThreatStatus } from "@/types";

export default function SocPage() {
  const [status, setStatus] = useState<ThreatStatus | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [focused, setFocused] = useState<string | null>(null);
  const [feedLive, setFeedLive] = useState(false);
  const [sirenOn, setSirenOn] = useState(true);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [evidence, setEvidence] = useState<Incident | null>(null);
  const [evidenceTab, setEvidenceTab] = useState<"snap" | "video">("snap");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busyDelete, setBusyDelete] = useState(false);
  const knownPending = useRef(new Set<string>());
  const audioCtx = useRef<AudioContext | null>(null);
  // Ref so in-flight incident polls always see the latest mute state
  const sirenOnRef = useRef(true);
  const activeOsc = useRef<OscillatorNode | null>(null);

  const [loiter, setLoiter] = useState("8");
  const [crowd, setCrowd] = useState("4");
  const [motion, setMotion] = useState("18");
  const [conf, setConf] = useState("40");
  const [camName, setCamName] = useState("Loading camera…");
  const [webhook, setWebhook] = useState("");
  const [email, setEmail] = useState("");
  const [smtp, setSmtp] = useState("");

  const stopSirenAudio = () => {
    try {
      activeOsc.current?.stop();
    } catch {
      /* already stopped */
    }
    activeOsc.current = null;
    if (audioCtx.current && audioCtx.current.state === "running") {
      void audioCtx.current.suspend();
    }
  };

  const setSirenEnabled = (enabled: boolean) => {
    sirenOnRef.current = enabled;
    setSirenOn(enabled);
    if (!enabled) stopSirenAudio();
  };

  const playSiren = () => {
    if (!sirenOnRef.current) return;
    try {
      if (!audioCtx.current) {
        audioCtx.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)();
      }
      const ctx = audioCtx.current;
      if (ctx.state === "suspended") void ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      activeOsc.current = osc;
      osc.onended = () => {
        if (activeOsc.current === osc) activeOsc.current = null;
      };
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      /* ignore */
    }
  };

  const refreshIncidents = async () => {
    const list = await api.getIncidents();
    let hasNew = false;
    list.forEach((inc) => {
      if (inc.status === "Pending Review" && !knownPending.current.has(inc.incident_id)) {
        hasNew = true;
        knownPending.current.add(inc.incident_id);
      }
    });
    if (hasNew) playSiren();
    setIncidents(list);
    setSelected((prev) => {
      const ids = new Set(list.map((i) => i.incident_id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (ids.has(id)) next.add(id);
      });
      return next;
    });
  };

  usePolling(async () => {
    const hud = await api.getThreatStatus();
    setStatus(hud);
    if (hud.camera_name) setCamName(hud.camera_name);
  }, 1000);

  usePolling(() => refreshIncidents(), 2500);

  const activeMatches = useMemo(() => {
    const threats = status?.threats || [];
    return THREAT_MODULES.map((m) => ({
      ...m,
      active: threats.some((t) => m.match.some((k) => t.type.includes(k))),
    }));
  }, [status]);

  const filteredIncidents = useMemo(() => {
    if (!focused) return incidents;
    const mod = THREAT_MODULES.find((m) => m.id === focused);
    if (!mod) return incidents;
    return incidents.filter((inc) =>
      mod.match.some((k) => inc.threat_type.includes(k))
    );
  }, [incidents, focused]);

  const applyRulesToForm = (rules: {
    loitering_threshold_seconds?: number;
    crowd_surge_threshold?: number;
    motion_energy_threshold?: number;
    confidence_threshold?: number;
    camera_name?: string;
    webhook_url?: string;
    alert_email_recipient?: string;
    smtp_host?: string;
  }) => {
    if (rules.loitering_threshold_seconds != null)
      setLoiter(String(rules.loitering_threshold_seconds));
    if (rules.crowd_surge_threshold != null)
      setCrowd(String(rules.crowd_surge_threshold));
    if (rules.motion_energy_threshold != null)
      setMotion(String(rules.motion_energy_threshold));
    if (rules.confidence_threshold != null)
      setConf(String(Math.round(Number(rules.confidence_threshold) * 100)));
    if (rules.camera_name) setCamName(rules.camera_name);
    if (rules.webhook_url != null) setWebhook(String(rules.webhook_url));
    if (rules.alert_email_recipient != null)
      setEmail(String(rules.alert_email_recipient));
    if (rules.smtp_host != null) setSmtp(String(rules.smtp_host));
  };

  const openRules = async () => {
    try {
      const rules = await api.getRules();
      applyRulesToForm(rules);
    } catch {
      /* keep current form values */
    }
    setRulesOpen(true);
  };

  const alertLabel =
    status && status.threats_count > 0
      ? `ALERT: ${status.threats[0].type.toUpperCase()}`
      : "● STATUS: ALL CLEAR";

  const allFilteredSelected =
    filteredIncidents.length > 0 &&
    filteredIncidents.every((i) => selected.has(i.incident_id));

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredIncidents.forEach((i) => next.delete(i.incident_id));
      } else {
        filteredIncidents.forEach((i) => next.add(i.incident_id));
      }
      return next;
    });
  };

  const deleteSelected = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    if (!window.confirm(`Delete ${ids.length} selected queue item(s)?`)) return;
    setBusyDelete(true);
    try {
      await api.deleteIncidents(ids);
      ids.forEach((id) => knownPending.current.delete(id));
      setSelected(new Set());
      await refreshIncidents();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusyDelete(false);
    }
  };

  const clearQueue = async () => {
    if (!incidents.length) return;
    if (
      !window.confirm(
        `Clear the entire verification queue (${incidents.length} items)? This cannot be undone.`
      )
    ) {
      return;
    }
    setBusyDelete(true);
    try {
      await api.deleteIncidents([], true);
      knownPending.current.clear();
      setSelected(new Set());
      await refreshIncidents();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Clear queue failed");
    } finally {
      setBusyDelete(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="SOC Video Threat Triage"
        description="Live analytics, verification queue, and detection rule configuration."
        actions={
          <>
            <Button
              variant="warning"
              size="sm"
              onClick={() => setSirenEnabled(!sirenOnRef.current)}
              style={{ opacity: sirenOn ? 1 : 0.55 }}
              aria-pressed={!sirenOn}
            >
              {sirenOn ? (
                <Volume2 className="h-3.5 w-3.5" />
              ) : (
                <VolumeX className="h-3.5 w-3.5" />
              )}
              Siren: {sirenOn ? "ON" : "MUTED"}
            </Button>
            <Badge tone={status && status.threats_count > 0 ? "alert" : "live"} pulse>
              {alertLabel}
            </Badge>
            <Button size="sm" onClick={() => refreshIncidents()}>
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
        {activeMatches.map((m) => (
          <button
            key={m.id}
            onClick={() => setFocused((prev) => (prev === m.id ? null : m.id))}
            title={
              focused === m.id
                ? "Clear queue filter"
                : `Filter queue to ${m.label}`
            }
            className={cn(
              "rounded-lg border px-2 py-2.5 text-center text-[12px] font-semibold transition-colors",
              m.active
                ? "border-aegis-red bg-aegis-red/15 text-red-200 shadow-[0_0_18px_rgba(239,68,68,0.25)]"
                : focused === m.id
                  ? "border-aegis-cyan bg-aegis-cyan/10 text-aegis-cyan"
                  : "border-aegis-border bg-aegis-panel text-aegis-secondary hover:text-aegis-text"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
      {focused ? (
        <div className="mb-3 flex items-center justify-between text-xs text-aegis-muted">
          <span>
            Queue filtered to{" "}
            <span className="font-semibold text-aegis-cyan">
              {THREAT_MODULES.find((m) => m.id === focused)?.label}
            </span>{" "}
            ({filteredIncidents.length})
          </span>
          <button
            className="font-semibold text-aegis-secondary hover:text-aegis-text"
            onClick={() => setFocused(null)}
          >
            Clear filter
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Card className="overflow-hidden">
            <div className="relative">
              <CameraViewport
                src="/threat_video_feed"
                alt="Live AI Threat Stream"
                className="min-h-[420px]"
                imgClassName="min-h-[420px] max-h-[540px]"
                onLiveChange={setFeedLive}
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-3">
                <Badge tone={feedLive ? "live" : "neutral"} pulse={feedLive}>
                  {feedLive ? "EDGE AI SENSOR ACTIVE" : "SENSOR OFFLINE"}
                </Badge>
                <Badge tone="neutral" className="font-mono">
                  Motion Flow: {status?.motion_energy ?? 0}
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-aegis-border bg-aegis-elevated px-4 py-3">
              <div className="text-xs text-aegis-secondary">
                Active Sensor Feed:{" "}
                <span className="font-semibold text-aegis-text">{camName}</span>
              </div>
              <div className="flex gap-2">
                <Link href="/mobile-streamer">
                  <Button size="sm">
                    <Phone className="h-3.5 w-3.5" /> Connect Smartphone
                  </Button>
                </Link>
                <Button size="sm" onClick={() => void openRules()}>
                  <Settings2 className="h-3.5 w-3.5" /> Config & Alerts
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card className="flex min-h-[520px] flex-col">
            <CardHeader>
              <div className="text-sm font-semibold">Human Verification Queue</div>
              <div className="flex flex-wrap items-center gap-2">
                {filteredIncidents.length > 0 ? (
                  <label className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] text-aegis-secondary">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAllFiltered}
                    />
                    Select all
                  </label>
                ) : null}
                <Button
                  size="sm"
                  variant="danger"
                  disabled={busyDelete || selected.size === 0}
                  onClick={() => void deleteSelected()}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete ({selected.size})
                </Button>
                <Button
                  size="sm"
                  disabled={busyDelete || incidents.length === 0}
                  onClick={() => void clearQueue()}
                >
                  Clear all
                </Button>
              </div>
            </CardHeader>
            <CardBody className="max-h-[620px] flex-1 space-y-3 overflow-y-auto">
              {filteredIncidents.length === 0 ? (
                <div className="py-16 text-center text-sm text-aegis-muted">
                  {focused
                    ? "No incidents match this threat filter."
                    : "No active threats detected."}
                  <br />
                  {focused
                    ? "Clear the filter or wait for matching detections."
                    : "AI safety engine is continuously scanning."}
                </div>
              ) : (
                filteredIncidents.map((inc) => {
                  const pending = inc.status === "Pending Review";
                  const isSelected = selected.has(inc.incident_id);
                  return (
                  <div
                    key={inc.incident_id}
                    className={cn(
                      "rounded-xl border bg-black/40 p-3",
                      isSelected
                        ? "border-aegis-cyan/50"
                        : "border-aegis-border"
                    )}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={isSelected}
                          onChange={() => toggleOne(inc.incident_id)}
                          aria-label={`Select incident ${inc.incident_id}`}
                        />
                        <Badge tone="alert">{inc.threat_type}</Badge>
                        <Badge
                          tone={
                            inc.status === "VERIFIED"
                              ? "alert"
                              : inc.status === "FALSE_ALARM"
                                ? "neutral"
                                : "warn"
                          }
                        >
                          {inc.status === "VERIFIED"
                            ? "Escalated"
                            : inc.status === "FALSE_ALARM"
                              ? "False Alarm"
                              : "Pending Review"}
                        </Badge>
                      </div>
                      <span className="font-mono text-[10px] text-aegis-muted">
                        {inc.timestamp}
                      </span>
                    </div>
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={inc.snapshot_url}
                          alt=""
                          className="aspect-[4/3] w-full cursor-pointer rounded-md border border-aegis-border object-cover"
                          onClick={() => {
                            setEvidence(inc);
                            setEvidenceTab("snap");
                          }}
                        />
                      </div>
                      <div className="col-span-8 text-xs text-aegis-secondary">
                        <div>
                          Camera:{" "}
                          <span className="font-semibold text-aegis-text">
                            {inc.camera_id}
                          </span>
                        </div>
                        <div>
                          Confidence:{" "}
                          <span className="font-semibold text-aegis-amber">
                            {inc.confidence}%
                          </span>
                        </div>
                        <div className="mt-1">{inc.details}</div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 border-t border-aegis-border pt-3">
                      <Button
                        size="sm"
                        onClick={() => {
                          setEvidence(inc);
                          setEvidenceTab("video");
                        }}
                      >
                        <Film className="h-3.5 w-3.5" /> 10s Clip
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={!pending}
                        onClick={async () => {
                          await api.verifyIncident(inc.incident_id, "VERIFIED");
                          await refreshIncidents();
                        }}
                      >
                        <Check className="h-3.5 w-3.5" /> Verify
                      </Button>
                      <Button
                        size="sm"
                        disabled={!pending}
                        onClick={async () => {
                          await api.verifyIncident(inc.incident_id, "FALSE_ALARM");
                          await refreshIncidents();
                        }}
                      >
                        <X className="h-3.5 w-3.5" /> Dismiss
                      </Button>
                    </div>
                  </div>
                  );
                })
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
        title="Threat Detection Rules & Dispatch Config"
        wide
        footer={
          <>
            <Button onClick={() => setRulesOpen(false)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={async () => {
                await api.updateRules({
                  loitering_threshold_seconds: parseFloat(loiter),
                  crowd_surge_threshold: parseInt(crowd, 10),
                  motion_energy_threshold: parseFloat(motion),
                  confidence_threshold: parseFloat(conf) / 100,
                  camera_name: camName,
                  webhook_url: webhook,
                  alert_email_recipient: email,
                  smtp_host: smtp,
                });
                setRulesOpen(false);
              }}
            >
              Save Changes
            </Button>
          </>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-xs text-aegis-secondary">
            Loitering Threshold (Seconds)
            <input className="mt-1" value={loiter} onChange={(e) => setLoiter(e.target.value)} />
          </label>
          <label className="text-xs text-aegis-secondary">
            Crowd Surge Count
            <input className="mt-1" value={crowd} onChange={(e) => setCrowd(e.target.value)} />
          </label>
          <label className="text-xs text-aegis-secondary">
            Motion Sensitivity
            <input className="mt-1" value={motion} onChange={(e) => setMotion(e.target.value)} />
          </label>
          <label className="text-xs text-aegis-secondary">
            AI Confidence Cutoff (%)
            <input className="mt-1" value={conf} onChange={(e) => setConf(e.target.value)} />
          </label>
          <label className="text-xs text-aegis-secondary md:col-span-2">
            Camera Name
            <input className="mt-1" value={camName} onChange={(e) => setCamName(e.target.value)} />
          </label>
          <label className="text-xs text-aegis-secondary md:col-span-2">
            Webhook URL
            <input className="mt-1" value={webhook} onChange={(e) => setWebhook(e.target.value)} />
          </label>
          <label className="text-xs text-aegis-secondary">
            Alert Email
            <input className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="text-xs text-aegis-secondary">
            SMTP Host
            <input className="mt-1" value={smtp} onChange={(e) => setSmtp(e.target.value)} />
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            size="sm"
            onClick={async () => {
              try {
                const res = await api.dispatchTestAlert();
                const details = res.details || {};
                const channels = Object.entries(details)
                  .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
                  .join("\n");
                alert(
                  channels
                    ? `Test alert sent.\n\n${channels}`
                    : "Test alert queued. Configure webhook/email/SMS in rules to deliver it."
                );
              } catch (err) {
                alert(err instanceof Error ? err.message : "Test alert failed");
              }
            }}
          >
            Send Test Alert
          </Button>
        </div>
      </Modal>

      <Modal
        open={!!evidence}
        onClose={() => setEvidence(null)}
        title={evidence ? `${evidence.threat_type} — ${evidence.incident_id}` : "Evidence"}
        wide
        footer={
          <>
            <Button onClick={() => setEvidence(null)}>Close</Button>
            {evidence ? (
              <Button
                variant="danger"
                onClick={async () => {
                  await api.verifyIncident(evidence.incident_id, "VERIFIED");
                  setEvidence(null);
                  await refreshIncidents();
                }}
              >
                Verify & Escalate Now
              </Button>
            ) : null}
          </>
        }
      >
        {evidence ? (
          <div>
            <div className="mb-3 flex gap-2">
              <Button
                size="sm"
                variant={evidenceTab === "snap" ? "primary" : "secondary"}
                onClick={() => setEvidenceTab("snap")}
              >
                Snapshot
              </Button>
              <Button
                size="sm"
                variant={evidenceTab === "video" ? "primary" : "secondary"}
                onClick={() => setEvidenceTab("video")}
              >
                10s Clip
              </Button>
            </div>
            {evidenceTab === "snap" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={evidence.snapshot_url}
                alt=""
                className="mx-auto max-h-[400px] rounded-lg border border-aegis-border"
              />
            ) : (
              <video
                key={evidence.video_clip_url}
                controls
                className="mx-auto max-h-[400px] w-full rounded-lg border border-aegis-border bg-black"
                src={evidence.video_clip_url}
              />
            )}
            <div className="mt-3 rounded-lg border border-aegis-border bg-black/40 p-3 text-xs text-aegis-secondary">
              <div>
                <strong>Location:</strong> {evidence.location} ·{" "}
                <strong>Camera:</strong> {evidence.camera_id}
              </div>
              <div>
                <strong>Timestamp:</strong> {evidence.timestamp} ·{" "}
                <strong>Confidence:</strong> {evidence.confidence}%
              </div>
              <div>
                <strong>Details:</strong> {evidence.details || "N/A"}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
