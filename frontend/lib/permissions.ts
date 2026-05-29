import type { User, UserRole } from "@/types";

export function hasRole(user: User | null | undefined, ...roles: UserRole[]): boolean {
  return Boolean(user && roles.includes(user.role));
}

export function canCreateReferral(user: User | null | undefined): boolean {
  return hasRole(user, "admin", "requester");
}

export function canEvaluateReferral(user: User | null | undefined): boolean {
  return hasRole(user, "admin", "regulator");
}

export function canManagePatients(user: User | null | undefined): boolean {
  return hasRole(user, "admin", "requester");
}
