"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { ProtectedPage, RoleGuard } from "@/components/layout";
import { Button, Card, FormField, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import { CRITERION_LABELS, Patient, PRIORITY_LABELS, PriorityPreview } from "@/types";

const clinicalKeys = Object.keys(CRITERION_LABELS).filter(
  (key) => !["hemoglobina_abaixo_8", "calcio_acima_11", "creatinina_acima_2"].includes(key)
);

export default function NewReferralPage() {
  const { token } = useAuthStore();
  const { showMessage } = useUiStore();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState("");
  const [reason, setReason] = useState("");
  const [hemoglobina, setHemoglobina] = useState("");
  const [calcio, setCalcio] = useState("");
  const [creatinina, setCreatinina] = useState("");
  const [criteria, setCriteria] = useState<Record<string, boolean>>({});
  const [preview, setPreview] = useState<PriorityPreview | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.getPatients(token).then(setPatients);
  }, [token]);

  function buildPayload() {
    const today = new Date().toISOString().slice(0, 10);
    const labResults = [
      hemoglobina ? { exam_name: "hemoglobina", value: Number(hemoglobina), unit: "g/dL", collected_at: today } : null,
      calcio ? { exam_name: "calcio", value: Number(calcio), unit: "mg/dL", collected_at: today } : null,
      creatinina ? { exam_name: "creatinina", value: Number(creatinina), unit: "mg/dL", collected_at: today } : null,
    ].filter(Boolean);

    const clinicalCriteria = [
      ...clinicalKeys.map((key) => ({ criterion_key: key, is_present: !!criteria[key] })),
    ];

    return { labResults, clinicalCriteria };
  }

  async function handlePreview() {
    if (!token) return;
    const { labResults, clinicalCriteria } = buildPayload();
    try {
      const result = await api.previewPriority(token, labResults, clinicalCriteria);
      setPreview(result);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Erro ao calcular prioridade", "error");
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token || !patientId) return;
    setSubmitting(true);
    const { labResults, clinicalCriteria } = buildPayload();
    try {
      const referral = await api.createReferral(token, {
        patient_id: Number(patientId),
        reason,
        lab_results: labResults,
        clinical_criteria: clinicalCriteria,
      });
      showMessage("Encaminhamento criado com sucesso", "success");
      window.location.href = `/encaminhamentos/${referral.id}`;
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Erro ao criar encaminhamento", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ProtectedPage>
      <RoleGuard roles={["admin", "requester"]} fallback="message">
        <PageHeader
          title="Novo encaminhamento"
          description="Cadastre sinais clínicos e exames laboratoriais para calcular a prioridade"
          action={
            <Link href="/encaminhamentos" className="rounded-lg border border-gray-300 px-4 py-2 text-sm">
              Voltar
            </Link>
          }
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Paciente">
                <Select value={patientId} onChange={(e) => setPatientId(e.target.value)} required>
                  <option value="">Selecione</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.full_name} - {patient.sus_card}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Motivo do encaminhamento">
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} required rows={3} className="md:col-span-2" />
              </FormField>
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold">Exames laboratoriais</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <FormField label="Hemoglobina (g/dL)">
                <Input type="number" step="0.1" value={hemoglobina} onChange={(e) => setHemoglobina(e.target.value)} />
              </FormField>
              <FormField label="Cálcio (mg/dL)">
                <Input type="number" step="0.1" value={calcio} onChange={(e) => setCalcio(e.target.value)} />
              </FormField>
              <FormField label="Creatinina (mg/dL)">
                <Input type="number" step="0.1" value={creatinina} onChange={(e) => setCreatinina(e.target.value)} />
              </FormField>
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold">Critérios clínicos</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {clinicalKeys.map((key) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!criteria[key]}
                    onChange={(e) => setCriteria({ ...criteria, [key]: e.target.checked })}
                  />
                  {CRITERION_LABELS[key]}
                </label>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Prévia de prioridade</h2>
                {preview ? (
                  <p className="mt-2 text-sm text-gray-600">
                    Pontuação: <strong>{preview.priority_score}</strong> • Prioridade:{" "}
                    <strong>{PRIORITY_LABELS[preview.calculated_priority]}</strong>
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-gray-500">Calcule a prioridade antes de salvar.</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={handlePreview}>
                  Calcular prioridade
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Salvando..." : "Salvar rascunho"}
                </Button>
              </div>
            </div>
          </Card>
        </form>
      </RoleGuard>
    </ProtectedPage>
  );
}
