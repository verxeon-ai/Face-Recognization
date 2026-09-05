"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Images, UserCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { api } from "@/lib/api/client";
import { useRole } from "@/hooks/useRole";

type PersonDetail = {
  name: string;
  display_name: string;
  image_count: number;
  images: { filename: string; url: string }[];
};

export default function PersonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAdmin, isOperator, ready } = useRole();
  const rawName = decodeURIComponent(String(params.name || ""));

  const [detail, setDetail] = useState<PersonDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (ready && isOperator) {
      router.replace("/soc");
    }
  }, [ready, isOperator, router]);

  useEffect(() => {
    if (!isAdmin || !rawName) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getPerson(rawName)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setDetail(null);
          setError(err instanceof Error ? err.message : "Failed to load identity");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin, rawName]);

  if (!ready || isOperator) {
    return (
      <div className="py-16 text-center text-sm text-aegis-muted">
        Identity catalog is Admin-only. Redirecting…
      </div>
    );
  }

  const title = detail?.display_name || rawName.replaceAll("_", " ");

  return (
    <div>
      <PageHeader
        title={title}
        description={
          loading
            ? "Loading enrolled photos…"
            : detail
              ? `${detail.image_count} enrolled photo${detail.image_count === 1 ? "" : "s"} used for SFace embeddings.`
              : "Identity photo gallery"
        }
        actions={
          <Link href="/persons">
            <Button size="sm">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Catalog
            </Button>
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Images className="h-4 w-4 text-aegis-cyan" />
            Enrolled Photos
          </div>
          {detail ? (
            <Badge tone="live">{detail.image_count} images</Badge>
          ) : null}
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="py-12 text-center text-sm text-aegis-muted">
              Loading photos…
            </div>
          ) : error ? (
            <div className="py-16 text-center text-sm text-aegis-red">{error}</div>
          ) : !detail?.images.length ? (
            <div className="py-16 text-center text-aegis-muted">
              <UserCircle className="mx-auto h-10 w-10 opacity-25" />
              <p className="mt-3 text-sm">No photos found for this identity.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {detail.images.map((img) => (
                <button
                  key={img.filename}
                  type="button"
                  onClick={() => setLightbox(img.url)}
                  className="group overflow-hidden rounded-xl border border-aegis-border bg-black/40 text-left transition-colors hover:border-aegis-cyan/50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.filename}
                    className="aspect-square w-full object-cover transition-transform group-hover:scale-[1.02]"
                  />
                  <div className="truncate px-2 py-1.5 font-mono text-[10px] text-aegis-muted">
                    {img.filename}
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {lightbox ? (
        <button
          type="button"
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setLightbox(null)}
          aria-label="Close photo"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt=""
            className="max-h-[90vh] max-w-[90vw] rounded-lg border border-aegis-border object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </button>
      ) : null}
    </div>
  );
}
