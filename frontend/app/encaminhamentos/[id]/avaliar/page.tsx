"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { ProtectedPage, RoleGuard } from "@/components/layout";
import { Button, Card, FormField, PageHeader, Select, Textarea } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import { EvaluationDecision, PRIORITY_LABELS, Priority, Referral } from "@/types";

export default function EvaluateReferralPage({ params }: { params: { id: string } }) {
  const { token } = useAuthStore();
  const { showMessage } = useUiStore();
  const [referral, setReferral] = useState<Referral | null>(null);
  const [decision, setDecision] = useState<EvaluationDecision>("approve");
  const [priority, setPriority] = useState<Priority>("medium");
  const [justification, setJustification] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.getReferral(token, Number(params.id)).then((data) => {
      setReferral(data);
      setPriority(data.final_priority || data.calculated_priority);
    });
  }, [token, params.id]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setSubmitting(true);
    try {
      await api.evaluateReferral(token, Number(params.id), {
        decision,
        priority,
        justification,
      });
      showMessage("Avaliação registrada com sucesso", "success");
      window.location.href = `/encaminhamentos/${params.id}`;
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Erro ao registrar avaliação", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ProtectedPage>
      <RoleGuard roles={["admin", "regulator"]} fallback="message">
        <PageHeader
          title={`Avaliar encaminhamento #${params.id}`}
          description="Confirme ou ajuste a prioridade com justificativa auditável"
          action={
            <Link href={`/encaminhamentos/${params.id}`} className="rounded-lg border border-gray-300 px-4 py-2 text-sm">
              Voltar
            </Link>
          }
        />

        {referral && (
          <Card className="mb-6">
            <p className="text-sm text-gray-600">
              Prioridade calculada: <strong>{PRIORITY_LABELS[referral.calculated_priority]}</strong> ({referral.priority_score} pontos)
            </p>
            <p className="mt-2 text-sm text-gray-700">{referral.reason}</p>
          </Card>
        )}

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Decisão">
              <Select value={decision} onChange={(e) => setDecision(e.target.value as EvaluationDecision)}>
                <option value="approve">Aprovar</option>
                <option value="return">Devolver para correção</option>
                <option value="schedule">Agendar</option>
                <option value="cancel">Cancelar</option>
              </Select>
            </FormField>

            <FormField label="Prioridade final">
              <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Justificativa">
              <Textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                rows={5}
                required
                placeholder="Descreva a fundamentação clínica da decisão"
              />
            </FormField>

            {referral && priority !== referral.calculated_priority && (
              <p className="rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                A prioridade final difere da calculada. Justificativa detalhada é obrigatória.
              </p>
            )}

            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvando..." : "Registrar avaliação"}
            </Button>
          </form>
        </Card>
      </RoleGuard>
    </ProtectedPage>
  );
}
