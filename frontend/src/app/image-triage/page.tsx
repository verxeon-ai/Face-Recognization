"use client";

import { useRef, useState } from "react";
import { Image as ImageIcon, Search, Upload, X } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { api } from "@/lib/api/client";
import type { ImageAnalysisResult } from "@/types";

export default function ImageTriagePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImageAnalysisResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const pickFile = (f: File | null) => {
    if (!f) return;
    setFile(f);
    setResult(null);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const clear = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const res = await api.uploadImage(file);
      setResult(res);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Image analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const metrics = result?.results;

  return (
    <div>
      <PageHeader
        title="Forensic Image Triage & Scanning"
        description="Upload high-resolution surveillance photos for multi-face detection, identity verification, and unknown threat logging."
      />

      {loading ? (
        <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-black/85 backdrop-blur-md">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-aegis-cyan border-t-transparent" />
          <p className="mt-4 text-sm font-semibold text-aegis-text">
            Executing YuNet & SFace 128D Deep Feature Scan…
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Upload className="h-4 w-4 text-aegis-secondary" />
                Select or Drop Image File
              </div>
            </CardHeader>
            <CardBody>
              {!preview ? (
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
                      ? "border-aegis-cyan bg-aegis-cyan/10"
                      : "border-aegis-cyan/30 bg-aegis-cyan/[0.03] hover:border-aegis-cyan"
                  }`}
                >
                  <Upload className="mx-auto h-10 w-10 text-aegis-cyan" />
                  <p className="mt-3 text-sm font-semibold text-aegis-text">
                    Drag & drop photo or click to browse
                  </p>
                  <p className="mt-1 text-xs text-aegis-muted">
                    Supported: JPG, PNG, BMP, WEBP
                  </p>
                </button>
              ) : (
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="Preview"
                    className="mx-auto max-h-[320px] rounded-lg border border-aegis-border object-contain"
                  />
                  <div className="mt-3 flex gap-2">
                    <Button className="flex-1" variant="primary" onClick={analyze}>
                      <Search className="h-3.5 w-3.5" /> Scan & Identify Faces
                    </Button>
                    <Button onClick={clear} aria-label="Clear">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
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
                <ImageIcon className="h-4 w-4 text-aegis-green" />
                Recognition Forensics Report
              </div>
              {result ? (
                <Badge tone={result.alert ? "alert" : "live"} pulse>
                  ● SCAN COMPLETE
                </Badge>
              ) : null}
            </CardHeader>
            <CardBody>
              {!result ? (
                <div className="py-16 text-center text-sm text-aegis-muted">
                  <ImageIcon className="mx-auto mb-2 h-10 w-10 opacity-25" />
                  Upload and analyze an image to view bounding boxes and cosine
                  similarity metrics.
                </div>
              ) : (
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={result.result_image}
                    alt="Analysis result"
                    className="mx-auto mb-4 max-h-[360px] rounded-lg border border-aegis-border object-contain"
                  />

                  <div className="mb-4 grid grid-cols-3 gap-2 rounded-xl border border-aegis-border bg-black/40 p-3 text-center">
                    <div>
                      <div className="text-[11px] text-aegis-muted">Total Detected</div>
                      <div className="mt-1 text-xl font-semibold">
                        {metrics?.total_faces ?? 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-aegis-muted">Verified Known</div>
                      <div className="mt-1 text-xl font-semibold text-aegis-green">
                        {metrics?.recognized_persons?.length ?? 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-aegis-muted">Unauthorized</div>
                      <div className="mt-1 text-xl font-semibold text-aegis-red">
                        {metrics?.unknown_persons ?? 0}
                      </div>
                    </div>
                  </div>

                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-aegis-muted">
                    Identified Persons
                  </div>
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {metrics?.recognized_persons?.length ? (
                      metrics.recognized_persons.map((p) => (
                        <Badge key={`${p.name}-${p.confidence}`} tone="live">
                          {p.name} ({Math.round(p.confidence)}%)
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-aegis-muted">None</span>
                    )}
                  </div>

                  {(metrics?.unknown_persons ?? 0) > 0 ? (
                    <Badge tone="alert" pulse>
                      UNAUTHORIZED / UNKNOWN DETECTED
                    </Badge>
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
