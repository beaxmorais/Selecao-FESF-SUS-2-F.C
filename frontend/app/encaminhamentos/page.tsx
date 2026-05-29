"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ProtectedPage } from "@/components/layout";
import { Badge, Button, Card, EmptyState, LoadingState, PageHeader, Select } from "@/components/ui";
import { api } from "@/lib/api";
import { canCreateReferral } from "@/lib/permissions";
import { priorityTone, statusTone } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { PRIORITY_LABELS, Referral, ReferralStatus, STATUS_LABELS } from "@/types";

export default function ReferralsPage() {
  const { token, user } = useAuthStore();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  async function loadReferrals() {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.getReferrals(token, {
        status_filter: statusFilter || undefined,
        priority_filter: priorityFilter || undefined,
      });
      setReferrals(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReferrals();
  }, [token, statusFilter, priorityFilter]);

  return (
    <ProtectedPage>
      <PageHeader
        title="Encaminhamentos"
        description="Lista de solicitações hematológicas com filtros por status e prioridade"
        action={
          canCreateReferral(user) ? (
            <Link href="/encaminhamentos/novo">
              <Button>Novo encaminhamento</Button>
            </Link>
          ) : undefined
        }
      />

      <Card className="mb-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Todos</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Prioridade</label>
            <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="">Todas</option>
              {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      <Card>
        {loading ? (
          <LoadingState />
        ) : referrals.length === 0 ? (
          <EmptyState message="Nenhum encaminhamento encontrado." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2">ID</th>
                  <th className="py-2">Paciente</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Prioridade</th>
                  <th className="py-2">Pontuação</th>
                  <th className="py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((referral) => (
                  <tr key={referral.id} className="border-b">
                    <td className="py-3">#{referral.id}</td>
                    <td className="py-3">{referral.patient?.full_name || `Paciente ${referral.patient_id}`}</td>
                    <td className="py-3">
                      <Badge tone={statusTone(referral.status)}>{STATUS_LABELS[referral.status]}</Badge>
                    </td>
                    <td className="py-3">
                      <Badge tone={priorityTone(referral.final_priority || referral.calculated_priority)}>
                        {PRIORITY_LABELS[referral.final_priority || referral.calculated_priority]}
                      </Badge>
                    </td>
                    <td className="py-3">{referral.priority_score}</td>
                    <td className="py-3">
                      <Link href={`/encaminhamentos/${referral.id}`} className="text-primary-600 hover:underline">
                        Detalhes
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </ProtectedPage>
  );
}
