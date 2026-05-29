"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { ProtectedPage, RoleGuard } from "@/components/layout";
import { Button, Card, EmptyState, FormField, Input, LoadingState, PageHeader, Select } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import { Patient, SEX_LABELS, Sex } from "@/types";

const emptyPatient = {
  full_name: "",
  sus_card: "",
  birth_date: "",
  sex: "female" as Sex,
  city: "",
  health_unit: "",
};

export default function PatientsPage() {
  const { token, user } = useAuthStore();
  const { showMessage } = useUiStore();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyPatient);
  const [editingId, setEditingId] = useState<number | null>(null);

  async function loadPatients() {
    if (!token) return;
    setLoading(true);
    try {
      setPatients(await api.getPatients(token));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPatients();
  }, [token]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    try {
      if (editingId) {
        await api.updatePatient(token, editingId, form);
        showMessage("Paciente atualizado com sucesso", "success");
      } else {
        await api.createPatient(token, form);
        showMessage("Paciente cadastrado com sucesso", "success");
      }
      setForm(emptyPatient);
      setEditingId(null);
      await loadPatients();
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Erro ao salvar paciente", "error");
    }
  }

  function startEdit(patient: Patient) {
    setEditingId(patient.id);
    setForm({
      full_name: patient.full_name,
      sus_card: patient.sus_card,
      birth_date: patient.birth_date,
      sex: patient.sex,
      city: patient.city,
      health_unit: patient.health_unit,
    });
  }

  return (
    <ProtectedPage>
      <PageHeader title="Pacientes" description="Consulta de pacientes cadastrados no SUS" />

      <RoleGuard roles={["admin", "requester"]}>
        <Card className="mb-6">
          <h2 className="mb-4 text-lg font-semibold">{editingId ? "Editar paciente" : "Novo paciente"}</h2>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <FormField label="Nome completo">
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            </FormField>
            <FormField label="Cartão SUS">
              <Input value={form.sus_card} onChange={(e) => setForm({ ...form, sus_card: e.target.value })} required />
            </FormField>
            <FormField label="Data de nascimento">
              <Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} required />
            </FormField>
            <FormField label="Sexo">
              <Select value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value as Sex })}>
                {Object.entries(SEX_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Cidade">
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
            </FormField>
            <FormField label="Unidade de saúde">
              <Input value={form.health_unit} onChange={(e) => setForm({ ...form, health_unit: e.target.value })} required />
            </FormField>
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit">{editingId ? "Salvar alterações" : "Cadastrar paciente"}</Button>
              {editingId && (
                <Button type="button" variant="secondary" onClick={() => { setEditingId(null); setForm(emptyPatient); }}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </Card>
      </RoleGuard>

      <Card>
        {loading ? (
          <LoadingState />
        ) : patients.length === 0 ? (
          <EmptyState message="Nenhum paciente cadastrado." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2">Nome</th>
                  <th className="py-2">Cartão SUS</th>
                  <th className="py-2">Cidade</th>
                  <th className="py-2">Unidade</th>
                  <th className="py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.id} className="border-b">
                    <td className="py-3 font-medium">{patient.full_name}</td>
                    <td className="py-3">{patient.sus_card}</td>
                    <td className="py-3">{patient.city}</td>
                    <td className="py-3">{patient.health_unit}</td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <Link href={`/pacientes/${patient.id}`} className="text-primary-600 hover:underline">
                          Detalhes
                        </Link>
                        {(user?.role === "admin" || user?.role === "requester") && (
                          <button onClick={() => startEdit(patient)} className="text-gray-600 hover:underline">
                            Editar
                          </button>
                        )}
                      </div>
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
