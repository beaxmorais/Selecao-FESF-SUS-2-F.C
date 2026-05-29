export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}

export function priorityTone(priority: string): "gray" | "green" | "yellow" | "red" | "blue" {
  switch (priority) {
    case "urgent":
      return "red";
    case "high":
      return "yellow";
    case "medium":
      return "blue";
    default:
      return "green";
  }
}

export function statusTone(status: string): "gray" | "green" | "yellow" | "red" | "blue" {
  switch (status) {
    case "approved":
    case "scheduled":
      return "green";
    case "submitted":
    case "in_review":
      return "yellow";
    case "returned":
    case "cancelled":
      return "red";
    default:
      return "gray";
  }
}
