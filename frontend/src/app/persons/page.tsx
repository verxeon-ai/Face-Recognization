"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Database, Search, UserCircle, UserPlus, Users, X } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { api } from "@/lib/api/client";
import type { SystemStats } from "@/types";

export default function PersonsPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api
      .getStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const persons = stats?.persons ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return persons;
    return persons.filter((name) => {
      const spaced = name.replaceAll("_", " ").toLowerCase();
      return spaced.includes(q) || name.toLowerCase().includes(q);
    });
  }, [persons, query]);

  return (
    <div>
      <PageHeader
        title="Authorized Identities Catalog"
        description={
          loading
            ? "Loading identity catalog…"
            : `${stats?.total_persons ?? 0} verified personnel with 128D deep feature embeddings registered in the SFace index.`
        }
        actions={
          <Link href="/persons/add">
            <Button variant="primary" size="sm">
              <UserPlus className="h-3.5 w-3.5" /> Register New Identity
            </Button>
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Database className="h-4 w-4 text-aegis-green" />
            Registered Personnel Index
          </div>
          <Badge
            tone={stats?.encodings_loaded ? "live" : "neutral"}
            pulse={!!stats?.encodings_loaded}
          >
            {stats?.encodings_loaded
              ? "● 128D embeddings loaded"
              : "○ Embeddings not loaded"}
          </Badge>
        </CardHeader>
        <CardBody>
          {!loading && persons.length > 0 ? (
            <div className="mb-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-aegis-muted" />
                <input
                  className="w-full pl-9 pr-9"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search identities by name…"
                  aria-label="Search identities"
                />
                {query ? (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-aegis-muted hover:text-aegis-text"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
              <div className="mt-1.5 text-[11px] text-aegis-muted">
                Showing {filtered.length} of {persons.length}
              </div>
            </div>
          ) : null}

          {loading ? (
            <div className="py-12 text-center text-sm text-aegis-muted">
              Loading identities…
            </div>
          ) : persons.length === 0 ? (
            <div className="py-16 text-center text-aegis-muted">
              <Users className="mx-auto h-10 w-10 opacity-25" />
              <p className="mt-3 text-sm">
                No identity models loaded. Start the backend or register a new
                person.
              </p>
              <Link href="/persons/add" className="mt-4 inline-block">
                <Button size="sm">
                  <UserPlus className="h-3.5 w-3.5" /> Add Person
                </Button>
              </Link>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-aegis-muted">
              No identities match "{query.trim()}".
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
              {filtered.map((name) => (
                <Link
                  key={name}
                  href={`/persons/${encodeURIComponent(name)}`}
                  className="rounded-xl border border-aegis-border bg-aegis-panel px-3 py-4 text-center transition-colors hover:border-aegis-cyan/40"
                >
                  <UserCircle className="mx-auto h-8 w-8 text-aegis-cyan" />
                  <div className="mt-2 text-xs font-semibold text-aegis-text">
                    {name.replaceAll("_", " ")}
                  </div>
                  <div className="mt-1 text-[10px] text-aegis-muted">
                    View photos
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
