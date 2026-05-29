"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ProtectedPage, RoleGuard } from "@/components/layout";
import { Badge, Button, Card, LoadingState, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDate, priorityTone, statusTone } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import {
  CRITERION_LABELS,
  PRIORITY_LABELS,
  Referral,
  STATUS_LABELS,
} from "@/types";

export default function ReferralDetailPage({ params }: { params: { id: string } }) {
  const { token, user } = useAuthStore();
  const { showMessage } = useUiStore();
  const [referral, setReferral] = useState<Referral | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadReferral() {
    if (!token) return;
    setLoading(true);
    try {
      setReferral(await api.getReferral(token, Number(params.id)));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReferral();
  }, [token, params.id]);

  async function handleSubmitReferral() {
    if (!token || !referral) return;
    try {
      await api.submitReferral(token, referral.id);
      showMessage("Encaminhamento enviado para regulação", "success");
      await loadReferral();
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Erro ao enviar encaminhamento", "error");
    }
  }

  return (
    <ProtectedPage>
      <PageHeader
        title={`Encaminhamento #${params.id}`}
        description="Detalhes clínicos, exames laboratoriais e histórico de avaliações"
        action={
          <Link href="/encaminhamentos" className="rounded-lg border border-gray-300 px-4 py-2 text-sm">
            Voltar
          </Link>
        }
      />

      {loading || !referral ? (
        <LoadingState />
      ) : (
        <div className="space-y-6">
          <Card>
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone={statusTone(referral.status)}>{STATUS_LABELS[referral.status]}</Badge>
              <Badge tone={priorityTone(referral.final_priority || referral.calculated_priority)}>
                {PRIORITY_LABELS[referral.final_priority || referral.calculated_priority]}
              </Badge>
              <span className="text-sm text-gray-500">Pontuação: {referral.priority_score}</span>
            </div>
            <p className="mt-4 text-sm text-gray-700">{referral.reason}</p>
            {referral.patient && (
              <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
                <p><span className="text-gray-500">Paciente:</span> {referral.patient.full_name}</p>
                <p><span className="text-gray-500">Cartão SUS:</span> {referral.patient.sus_card}</p>
              </div>
            )}
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <h2 className="mb-4 text-lg font-semibold">Exames laboratoriais</h2>
              {referral.lab_results.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum exame registrado.</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {referral.lab_results.map((lab) => (
                    <div key={lab.id} className="flex justify-between border-b py-2">
                      <span>{lab.exam_name}</span>
                      <span>{lab.value} {lab.unit}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <h2 className="mb-4 text-lg font-semibold">Critérios clínicos</h2>
              {referral.clinical_criteria.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum critério registrado.</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {referral.clinical_criteria.map((criterion) => (
                    <div key={criterion.id} className="flex justify-between border-b py-2">
                      <span>{CRITERION_LABELS[criterion.criterion_key] || criterion.criterion_key}</span>
                      <span>{criterion.is_present ? "Presente" : "Ausente"}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <Card>
            <h2 className="mb-4 text-lg font-semibold">Histórico de avaliações</h2>
            {!referral.evaluations || referral.evaluations.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhuma avaliação registrada.</p>
            ) : (
              <div className="space-y-3">
                {referral.evaluations.map((evaluation) => (
                  <div key={evaluation.id} className="rounded-lg border border-gray-200 p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <Badge tone={priorityTone(evaluation.priority)}>
                        {PRIORITY_LABELS[evaluation.priority]}
                      </Badge>
                      <span className="text-gray-500">{formatDate(evaluation.created_at)}</span>
                    </div>
                    <p className="mt-2">{evaluation.justification}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="flex gap-2">
            {(user?.role === "admin" || user?.role === "requester") && referral.status === "draft" && (
              <Button onClick={handleSubmitReferral}>Enviar para regulação</Button>
            )}
            {(user?.role === "admin" || user?.role === "regulator") &&
              ["submitted", "in_review"].includes(referral.status) && (
                <Link href={`/encaminhamentos/${referral.id}/avaliar`}>
                  <Button>Avaliar encaminhamento</Button>
                </Link>
              )}
          </div>
        </div>
      )}
    </ProtectedPage>
  );
}
