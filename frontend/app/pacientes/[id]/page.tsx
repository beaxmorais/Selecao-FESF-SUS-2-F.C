"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ProtectedPage } from "@/components/layout";
import { Card, LoadingState, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { Patient, Referral, SEX_LABELS, STATUS_LABELS, PRIORITY_LABELS } from "@/types";

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  const { token } = useAuthStore();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.getPatient(token, Number(params.id)),
      api.getReferrals(token),
    ])
      .then(([patientData, referralData]) => {
        setPatient(patientData);
        setReferrals(referralData.filter((item) => item.patient_id === Number(params.id)));
      })
      .finally(() => setLoading(false));
  }, [token, params.id]);

  return (
    <ProtectedPage>
      <PageHeader
        title={patient?.full_name || "Paciente"}
        description="Detalhes do paciente e encaminhamentos vinculados"
        action={
          <Link href="/pacientes" className="rounded-lg border border-gray-300 px-4 py-2 text-sm">
            Voltar
          </Link>
        }
      />

      {loading || !patient ? (
        <LoadingState />
      ) : (
        <div className="space-y-6">
          <Card>
            <div className="grid gap-4 md:grid-cols-2 text-sm">
              <p><span className="text-gray-500">Cartão SUS:</span> {patient.sus_card}</p>
              <p><span className="text-gray-500">Nascimento:</span> {formatDate(patient.birth_date)}</p>
              <p><span className="text-gray-500">Sexo:</span> {SEX_LABELS[patient.sex]}</p>
              <p><span className="text-gray-500">Cidade:</span> {patient.city}</p>
              <p><span className="text-gray-500">Unidade:</span> {patient.health_unit}</p>
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold">Encaminhamentos</h2>
            {referrals.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum encaminhamento registrado.</p>
            ) : (
              <div className="space-y-3">
                {referrals.map((referral) => (
                  <Link
                    key={referral.id}
                    href={`/encaminhamentos/${referral.id}`}
                    className="block rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium">Encaminhamento #{referral.id}</p>
                        <p className="text-sm text-gray-500">{referral.reason}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p>{STATUS_LABELS[referral.status]}</p>
                        <p className="text-gray-500">
                          {PRIORITY_LABELS[referral.final_priority || referral.calculated_priority]}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </ProtectedPage>
  );
}
