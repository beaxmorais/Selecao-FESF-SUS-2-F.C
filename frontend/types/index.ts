export type UserRole = "admin" | "requester" | "regulator";
export type Sex = "male" | "female" | "other";
export type ReferralStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "approved"
  | "returned"
  | "scheduled"
  | "cancelled";
export type Priority = "low" | "medium" | "high" | "urgent";
export type EvaluationDecision = "approve" | "return" | "schedule" | "cancel";

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  health_unit?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Patient {
  id: number;
  full_name: string;
  sus_card: string;
  birth_date: string;
  sex: Sex;
  city: string;
  health_unit: string;
  created_at: string;
}

export interface LabResult {
  id?: number;
  referral_id?: number;
  exam_name: string;
  value: number;
  unit: string;
  collected_at: string;
}

export interface ClinicalCriterion {
  id?: number;
  referral_id?: number;
  criterion_key: string;
  is_present: boolean;
  notes?: string | null;
}

export interface Evaluation {
  id: number;
  referral_id: number;
  evaluator_id: number;
  decision: EvaluationDecision;
  priority: Priority;
  justification: string;
  created_at: string;
}

export interface Referral {
  id: number;
  patient_id: number;
  created_by_id: number;
  status: ReferralStatus;
  calculated_priority: Priority;
  final_priority?: Priority | null;
  priority_score: number;
  reason: string;
  created_at: string;
  updated_at: string;
  lab_results: LabResult[];
  clinical_criteria: ClinicalCriterion[];
  patient?: Patient;
  evaluations?: Evaluation[];
}

export interface DashboardReport {
  total_patients: number;
  total_referrals: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  pending_review: number;
}

export interface PriorityPreview {
  priority_score: number;
  calculated_priority: Priority;
  matched_criteria: string[];
}

export const CRITERION_LABELS: Record<string, string> = {
  hemoglobina_abaixo_8: "Hemoglobina abaixo de 8 g/dL",
  calcio_acima_11: "Cálcio acima de 11 mg/dL",
  creatinina_acima_2: "Creatinina acima de 2 mg/dL",
  dor_ossea_persistente: "Dor óssea persistente",
  perda_peso_nao_explicada: "Perda de peso não explicada",
  infeccoes_recorrentes: "Infecções recorrentes",
  suspeita_forte_unidade: "Suspeita forte informada pela unidade",
};

export const STATUS_LABELS: Record<ReferralStatus, string> = {
  draft: "Rascunho",
  submitted: "Enviado",
  in_review: "Em análise",
  approved: "Aprovado",
  returned: "Devolvido",
  scheduled: "Agendado",
  cancelled: "Cancelado",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  requester: "Solicitante",
  regulator: "Regulador",
};

export const SEX_LABELS: Record<Sex, string> = {
  male: "Masculino",
  female: "Feminino",
  other: "Outro",
};
