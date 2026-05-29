"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ProtectedPage } from "@/components/layout";
import { Badge, Card, LoadingState, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { canCreateReferral } from "@/lib/permissions";
import { priorityTone } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { DashboardReport, PRIORITY_LABELS, STATUS_LABELS } from "@/types";

export default function DashboardPage() {
  const { token, user } = useAuthStore();
  const [report, setReport] = useState<DashboardReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api
      .getDashboard(token)
      .then(setReport)
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <ProtectedPage>
      <PageHeader
        title="Visão geral"
        description="Indicadores gerais de pacientes e encaminhamentos hematológicos"
      />

      {loading || !report ? (
        <LoadingState />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <p className="text-sm text-gray-500">Pacientes cadastrados</p>
              <p className="mt-2 text-3xl font-bold">{report.total_patients}</p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500">Encaminhamentos</p>
              <p className="mt-2 text-3xl font-bold">{report.total_referrals}</p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500">Aguardando revisão</p>
              <p className="mt-2 text-3xl font-bold text-yellow-600">{report.pending_review}</p>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <h2 className="mb-4 text-lg font-semibold">Por status</h2>
              <div className="space-y-2">
                {Object.entries(report.by_status).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <span>{STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status}</span>
                    <Badge>{count}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="mb-4 text-lg font-semibold">Por prioridade</h2>
              <div className="space-y-2">
                {Object.entries(report.by_priority).map(([priority, count]) => (
                  <div key={priority} className="flex items-center justify-between text-sm">
                    <Badge tone={priorityTone(priority)}>
                      {PRIORITY_LABELS[priority as keyof typeof PRIORITY_LABELS]}
                    </Badge>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Ações rápidas</h2>
                <p className="text-sm text-gray-500">Acesse os módulos principais do sistema</p>
              </div>
              <div className="flex gap-2">
                {canCreateReferral(user) && (
                  <Link href="/encaminhamentos/novo" className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white">
                    Novo encaminhamento
                  </Link>
                )}
                <Link href="/encaminhamentos" className="rounded-lg border border-gray-300 px-4 py-2 text-sm">
                  Ver encaminhamentos
                </Link>
              </div>
            </div>
          </Card>
        </div>
      )}
    </ProtectedPage>
  );
}
