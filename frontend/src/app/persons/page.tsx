"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Database, UserCircle, UserPlus, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { api } from "@/lib/api/client";
import type { SystemStats } from "@/types";

export default function PersonsPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const persons = stats?.persons ?? [];

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
          <Badge tone="live" pulse>
            ● 128D Deep L2 Embeddings Active
          </Badge>
        </CardHeader>
        <CardBody>
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
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
              {persons.map((name) => (
                <div
                  key={name}
                  className="rounded-xl border border-aegis-border bg-aegis-panel px-3 py-4 text-center transition-colors hover:border-aegis-cyan/40"
                >
                  <UserCircle className="mx-auto h-8 w-8 text-aegis-cyan" />
                  <div className="mt-2 text-xs font-semibold text-aegis-text">
                    {name.replaceAll("_", " ")}
                  </div>
                  <Badge tone="live" className="mt-2 text-[10px]">
                    Verified
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
