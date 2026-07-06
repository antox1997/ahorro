export const formatCurrency = (value: number, currency = "USD") =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const formatShortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });

export const monthLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("es-MX", { month: "long", year: "numeric" });
