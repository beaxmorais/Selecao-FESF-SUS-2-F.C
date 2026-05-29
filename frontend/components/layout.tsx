"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

import { NavLink } from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import { ROLE_LABELS } from "@/types";

function MessageBanner() {
  const { message, messageType, clearMessage } = useUiStore();
  if (!message) return null;

  return (
    <div
      className={`mb-4 rounded-lg px-4 py-3 text-sm ${
        messageType === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <span>{message}</span>
        <button onClick={clearMessage} className="text-xs underline">
          Fechar
        </button>
      </div>
    </div>
  );
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { fetchMe, token, user } = useAuthStore();
  const [checking, setChecking] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setChecking(false);
      router.replace("/login");
      return;
    }

    fetchMe().finally(() => setChecking(false));
  }, [token, fetchMe, router]);

  if (!token || checking || !user) {
    return null;
  }

  return <>{children}</>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const links = [
    { href: "/dashboard", label: "Visão geral", roles: ["admin", "requester", "regulator"] },
    { href: "/pacientes", label: "Pacientes", roles: ["admin", "requester", "regulator"] },
    { href: "/encaminhamentos", label: "Encaminhamentos", roles: ["admin", "requester", "regulator"] },
    { href: "/usuarios", label: "Usuários", roles: ["admin"] },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-64 border-r border-gray-200 bg-white p-6 md:block">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">FESF SUS</p>
            <h2 className="text-lg font-bold text-gray-900">Triagem Hematológica</h2>
          </div>
          <nav className="space-y-1">
            {links
              .filter((link) => user && link.roles.includes(user.role))
              .map((link) => (
                <NavLink key={link.href} href={link.href} active={pathname.startsWith(link.href)}>
                  {link.label}
                </NavLink>
              ))}
          </nav>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="border-b border-gray-200 bg-white px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                <p className="text-xs text-gray-500">
                  {user ? ROLE_LABELS[user.role] : ""}
                  {user?.health_unit ? ` • ${user.health_unit}` : ""}
                </p>
              </div>
              <button
                onClick={logout}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Sair
              </button>
            </div>
          </header>
          <main className="flex-1 p-6">
            <MessageBanner />
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export function ProtectedPage({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}

export function RoleGuard({
  children,
  roles,
  fallback = "hide",
}: {
  children: ReactNode;
  roles: Array<"admin" | "requester" | "regulator">;
  fallback?: "hide" | "message";
}) {
  const { user } = useAuthStore();
  if (!user || !roles.includes(user.role)) {
    if (fallback === "message") {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Você não tem permissão para acessar esta página.
        </div>
      );
    }
    return null;
  }
  return <>{children}</>;
}
