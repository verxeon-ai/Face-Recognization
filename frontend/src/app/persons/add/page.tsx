"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Cpu, Images, UserPlus, X } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { api } from "@/lib/api/client";

export default function AddPersonPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    tone: "ok" | "err";
    text: string;
  } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = (incoming: FileList | File[] | null) => {
    if (!incoming) return;
    const list = Array.from(incoming);
    if (!list.length) return;
    setFiles((prev) => [...prev, ...list]);
    list.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviews((prev) => [...prev, String(reader.result)]);
      };
      reader.readAsDataURL(file);
    });
    setMessage(null);
  };

  const clearPhotos = () => {
    setFiles([]);
    setPreviews([]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setMessage({ tone: "err", text: "Enter a full name / identity title." });
      return;
    }
    if (files.length === 0) {
      setMessage({ tone: "err", text: "Upload at least one facial image." });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await api.addPerson(trimmed, files);
      setMessage({
        tone: "ok",
        text:
          res.message ||
          `Registered ${res.name} with ${res.images_saved} image(s). Model retrain queued.`,
      });
      setName("");
      clearPhotos();
    } catch (err) {
      setMessage({
        tone: "err",
        text: err instanceof Error ? err.message : "Failed to add person",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Register New Authorized Personnel"
        description="Upload facial photos to automatically extract 128D deep feature embeddings and retrain the SFace model."
        actions={
          <Link href="/persons">
            <Button size="sm">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Catalog
            </Button>
          </Link>
        }
      />

      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <UserPlus className="h-4 w-4 text-aegis-secondary" />
              Personnel Identity Credentials
            </div>
          </CardHeader>
          <CardBody>
            <label className="mb-4 block text-xs text-aegis-secondary">
              Full Name / Identity Title *
              <input
                className="mt-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Levi Ackerman"
              />
              <span className="mt-1 block text-[11px] text-aegis-muted">
                This identity name will appear on real-time HUD bounding boxes
                upon recognition.
              </span>
            </label>

            <div className="mb-4">
              <div className="mb-1 text-xs text-aegis-secondary">
                Facial Images (Upload 1–5 clear photos for deep embedding) *
              </div>
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
                  addFiles(e.dataTransfer.files);
                }}
                className={`w-full rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors ${
                  dragOver
                    ? "border-aegis-cyan bg-aegis-cyan/10"
                    : "border-aegis-cyan/35 bg-aegis-cyan/[0.03] hover:border-aegis-cyan"
                }`}
              >
                <Images className="mx-auto h-9 w-9 text-aegis-cyan" />
                <p className="mt-2 text-sm font-semibold text-aegis-text">
                  Click or drag photos to upload
                </p>
                <p className="mt-1 text-xs text-aegis-muted">
                  Supported formats: JPG, PNG, WEBP
                </p>
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
            </div>

            {previews.length > 0 ? (
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-aegis-muted">
                    Selected Photos ({previews.length})
                  </span>
                  <Button size="sm" variant="ghost" onClick={clearPhotos}>
                    <X className="h-3.5 w-3.5" /> Clear All
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {previews.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={`${src.slice(0, 32)}-${i}`}
                      src={src}
                      alt=""
                      className="aspect-square w-full rounded-lg border border-aegis-border object-cover"
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {message ? (
              <div
                className={`mb-4 rounded-lg border px-3 py-2 text-sm ${
                  message.tone === "ok"
                    ? "border-aegis-green/35 bg-aegis-green/10 text-aegis-green"
                    : "border-aegis-red/35 bg-aegis-red/10 text-red-200"
                }`}
              >
                {message.text}
              </div>
            ) : null}

            <Button
              className="w-full"
              variant="primary"
              size="lg"
              disabled={submitting}
              onClick={submit}
            >
              <Cpu className="h-4 w-4" />
              {submitting
                ? "Registering & Retraining…"
                : "Add Identity & Retrain SFace Model"}
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
