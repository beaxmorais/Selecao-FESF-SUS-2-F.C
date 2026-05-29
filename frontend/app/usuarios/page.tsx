"use client";

import { FormEvent, useEffect, useState } from "react";

import { ProtectedPage, RoleGuard } from "@/components/layout";
import { Button, Card, EmptyState, FormField, Input, LoadingState, PageHeader, Select } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import { ROLE_LABELS, User, UserRole } from "@/types";

const emptyUser = {
  email: "",
  full_name: "",
  role: "requester" as UserRole,
  health_unit: "",
  password: "",
  is_active: true,
};

export default function UsersPage() {
  const { token } = useAuthStore();
  const { showMessage } = useUiStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyUser);

  async function loadUsers() {
    if (!token) return;
    setLoading(true);
    try {
      setUsers(await api.getUsers(token));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [token]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    try {
      await api.createUser(token, form);
      showMessage("Usuário criado com sucesso", "success");
      setForm(emptyUser);
      await loadUsers();
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Erro ao criar usuário", "error");
    }
  }

  async function toggleActive(user: User) {
    if (!token) return;
    try {
      await api.updateUser(token, user.id, { is_active: !user.is_active });
      await loadUsers();
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Erro ao atualizar usuário", "error");
    }
  }

  return (
    <ProtectedPage>
      <RoleGuard roles={["admin"]} fallback="message">
        <PageHeader title="Usuários" description="Gerenciamento de contas do sistema" />

        <Card className="mb-6">
          <h2 className="mb-4 text-lg font-semibold">Novo usuário</h2>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <FormField label="Nome completo">
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            </FormField>
            <FormField label="E-mail">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </FormField>
            <FormField label="Perfil">
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Unidade de saúde">
              <Input value={form.health_unit} onChange={(e) => setForm({ ...form, health_unit: e.target.value })} />
            </FormField>
            <FormField label="Senha">
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </FormField>
            <div className="md:col-span-2">
              <Button type="submit">Cadastrar usuário</Button>
            </div>
          </form>
        </Card>

        <Card>
          {loading ? (
            <LoadingState />
          ) : users.length === 0 ? (
            <EmptyState message="Nenhum usuário cadastrado." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="py-2">Nome</th>
                    <th className="py-2">E-mail</th>
                    <th className="py-2">Perfil</th>
                    <th className="py-2">Unidade</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b">
                      <td className="py-3 font-medium">{user.full_name}</td>
                      <td className="py-3">{user.email}</td>
                      <td className="py-3">{ROLE_LABELS[user.role]}</td>
                      <td className="py-3">{user.health_unit || "-"}</td>
                      <td className="py-3">{user.is_active ? "Ativo" : "Inativo"}</td>
                      <td className="py-3">
                        <button onClick={() => toggleActive(user)} className="text-primary-600 hover:underline">
                          {user.is_active ? "Desativar" : "Ativar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </RoleGuard>
    </ProtectedPage>
  );
}
