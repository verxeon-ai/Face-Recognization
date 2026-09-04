"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Film, Upload } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { api } from "@/lib/api/client";
import type { VideoJobProgress } from "@/types";

export default function VideoScannerPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [report, setReport] = useState<VideoJobProgress | null>(null);

  const pickFile = (f: File | null) => {
    if (!f) return;
    setFile(f);
    setReport(null);
    setJobId(null);
    setProgress(0);
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(20);
    setProgressLabel("Uploading video file…");
    setReport(null);
    try {
      const res = await api.uploadVideo(file);
      if (!res.job_id) throw new Error("No job_id returned");
      setJobId(res.job_id);
      setProgressLabel("Analyzing video frames…");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
      setJobId(null);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const info = await api.videoProgress(jobId);
        if (cancelled) return;
        setProgress(info.progress ?? 0);
        setProgressLabel(`Analyzing frame data (${info.progress ?? 0}%)…`);
        if (info.status === "done") {
          setReport(info);
          setJobId(null);
          setProgressLabel("Analysis complete");
        }
      } catch {
        /* retry next interval */
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [jobId]);

  const results = report?.results;
  const unknownFrames =
    results?.frames_with_unknowns ?? results?.unknown_frames_count ?? 0;
  const showProgress = uploading || !!jobId || (progress > 0 && !report);

  return (
    <div>
      <PageHeader
        title="Recorded Video Surveillance Forensics"
        description="Automated multi-frame video scanning, identity tracking, and security incident audit report generation."
      />

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Upload className="h-4 w-4 text-aegis-amber" />
                Select Video File
              </div>
            </CardHeader>
            <CardBody>
              {!file ? (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    pickFile(e.dataTransfer.files?.[0] || null);
                  }}
                  className={`w-full rounded-xl border-2 border-dashed px-4 py-12 text-center transition-colors ${
                    dragOver
                      ? "border-aegis-amber bg-aegis-amber/10"
                      : "border-aegis-amber/35 bg-aegis-amber/[0.03] hover:border-aegis-amber"
                  }`}
                >
                  <Film className="mx-auto h-10 w-10 text-aegis-amber" />
                  <p className="mt-3 text-sm font-semibold text-aegis-text">
                    Drag & drop video or click to browse
                  </p>
                  <p className="mt-1 text-xs text-aegis-muted">
                    Supported: MP4, AVI, MOV, MKV, WEBM
                  </p>
                </button>
              ) : (
                <div>
                  <div className="rounded-xl border border-aegis-border bg-black/40 p-3 text-sm">
                    <Film className="mr-2 inline h-4 w-4 text-aegis-amber" />
                    <span className="font-medium text-aegis-text">{file.name}</span>
                    <span className="ml-2 text-xs text-aegis-muted">
                      ({(file.size / (1024 * 1024)).toFixed(1)} MB)
                    </span>
                  </div>
                  <Button
                    className="mt-3 w-full"
                    variant="primary"
                    disabled={uploading || !!jobId}
                    onClick={upload}
                  >
                    Upload & Start Video Scan
                  </Button>
                  <Button
                    className="mt-2 w-full"
                    size="sm"
                    disabled={uploading || !!jobId}
                    onClick={() => {
                      setFile(null);
                      if (inputRef.current) inputRef.current.value = "";
                    }}
                  >
                    Choose Different File
                  </Button>
                </div>
              )}

              {showProgress ? (
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-aegis-secondary">{progressLabel}</span>
                    <span className="font-semibold text-aegis-cyan">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-black">
                    <div
                      className="h-full rounded-full bg-aegis-cyan transition-all duration-300"
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                </div>
              ) : null}

              <input
                ref={inputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0] || null)}
              />
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Film className="h-4 w-4 text-aegis-secondary" />
                Frame-by-Frame Video Audit
              </div>
              {report ? (
                <Badge
                  tone={results?.alert ? "alert" : "live"}
                  pulse
                >
                  ● ANALYSIS DONE
                </Badge>
              ) : null}
            </CardHeader>
            <CardBody>
              {!report || !results ? (
                <div className="py-16 text-center text-sm text-aegis-muted">
                  <Film className="mx-auto mb-2 h-10 w-10 opacity-25" />
                  Upload a video to begin frame-by-frame forensic analysis.
                </div>
              ) : (
                <div>
                  <div className="mb-4 grid grid-cols-3 gap-2 rounded-xl border border-aegis-border bg-black/40 p-3 text-center">
                    <div>
                      <div className="text-[11px] text-aegis-muted">Total Frames</div>
                      <div className="mt-1 text-xl font-semibold">
                        {results.total_frames}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-aegis-muted">
                        Identified Persons
                      </div>
                      <div className="mt-1 text-xl font-semibold text-aegis-green">
                        {results.recognized_persons?.length ?? 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-aegis-muted">
                        Unauthorized Frames
                      </div>
                      <div className="mt-1 text-xl font-semibold text-aegis-red">
                        {unknownFrames}
                      </div>
                    </div>
                  </div>

                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-aegis-muted">
                    Persons Identified in Video
                  </div>
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {results.recognized_persons?.length ? (
                      results.recognized_persons.map((name) => (
                        <Badge key={name} tone="live">
                          {name.replaceAll("_", " ")}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-aegis-muted">None</span>
                    )}
                  </div>

                  {report.output_filename ? (
                    <a
                      href={`/results/${report.output_filename}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-aegis-text bg-aegis-text px-4 py-2.5 text-sm font-medium text-aegis-bg hover:bg-white"
                    >
                      <Download className="h-4 w-4" /> Download Annotated Video
                    </a>
                  ) : null}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
