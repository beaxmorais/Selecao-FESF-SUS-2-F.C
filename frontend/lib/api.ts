const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = "Erro na requisição";
    try {
      const data = await response.json();
      message = data.detail || message;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export async function login(email: string, password: string) {
  const body = new URLSearchParams();
  body.append("username", email);
  body.append("password", password);

  const response = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new ApiError("Credenciais inválidas", response.status);
  }

  return response.json() as Promise<{ access_token: string; token_type: string }>;
}

export const api = {
  getMe: (token: string) => request<import("@/types").User>("/api/v1/auth/me", {}, token),

  getUsers: (token: string) => request<import("@/types").User[]>("/api/v1/users/", {}, token),
  createUser: (token: string, data: object) =>
    request<import("@/types").User>("/api/v1/users/", { method: "POST", body: JSON.stringify(data) }, token),
  updateUser: (token: string, id: number, data: object) =>
    request<import("@/types").User>(`/api/v1/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }, token),
  deleteUser: (token: string, id: number) =>
    request<void>(`/api/v1/users/${id}`, { method: "DELETE" }, token),

  getPatients: (token: string) => request<import("@/types").Patient[]>("/api/v1/patients/", {}, token),
  getPatient: (token: string, id: number) =>
    request<import("@/types").Patient>(`/api/v1/patients/${id}`, {}, token),
  createPatient: (token: string, data: object) =>
    request<import("@/types").Patient>("/api/v1/patients/", { method: "POST", body: JSON.stringify(data) }, token),
  updatePatient: (token: string, id: number, data: object) =>
    request<import("@/types").Patient>(`/api/v1/patients/${id}`, { method: "PATCH", body: JSON.stringify(data) }, token),
  deletePatient: (token: string, id: number) =>
    request<void>(`/api/v1/patients/${id}`, { method: "DELETE" }, token),

  getReferrals: (token: string, params?: { status_filter?: string; priority_filter?: string }) => {
    const query = new URLSearchParams();
    if (params?.status_filter) query.set("status_filter", params.status_filter);
    if (params?.priority_filter) query.set("priority_filter", params.priority_filter);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<import("@/types").Referral[]>(`/api/v1/referrals/${suffix}`, {}, token);
  },
  getReferral: (token: string, id: number) =>
    request<import("@/types").Referral>(`/api/v1/referrals/${id}`, {}, token),
  createReferral: (token: string, data: object) =>
    request<import("@/types").Referral>("/api/v1/referrals/", { method: "POST", body: JSON.stringify(data) }, token),
  updateReferral: (token: string, id: number, data: object) =>
    request<import("@/types").Referral>(`/api/v1/referrals/${id}`, { method: "PATCH", body: JSON.stringify(data) }, token),
  deleteReferral: (token: string, id: number) =>
    request<void>(`/api/v1/referrals/${id}`, { method: "DELETE" }, token),
  submitReferral: (token: string, id: number) =>
    request<import("@/types").Referral>(`/api/v1/referrals/${id}/submit`, { method: "POST" }, token),
  evaluateReferral: (token: string, id: number, data: object) =>
    request<import("@/types").Evaluation>(`/api/v1/referrals/${id}/evaluate`, { method: "POST", body: JSON.stringify(data) }, token),
  previewPriority: (token: string, labResults: object[], clinicalCriteria: object[]) =>
    request<import("@/types").PriorityPreview>(
      "/api/v1/referrals/preview-priority",
      {
        method: "POST",
        body: JSON.stringify({ lab_results: labResults, clinical_criteria: clinicalCriteria }),
      },
      token
    ),

  getDashboard: (token: string) =>
    request<import("@/types").DashboardReport>("/api/v1/reports/dashboard", {}, token),
};
