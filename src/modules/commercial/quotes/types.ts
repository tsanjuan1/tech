export const quoteStatuses = [
  "draft",
  "sent",
  "approved",
  "rejected",
  "expired",
] as const;

export type QuoteStatus = (typeof quoteStatuses)[number];

export const currencies = ["ARS", "USD"] as const;

export type CurrencyCode = (typeof currencies)[number];

export const solutionTypes = [
  "workstations",
  "infrastructure",
  "licensing",
  "technical-service",
  "networking",
] as const;

export type SolutionType = (typeof solutionTypes)[number];

export const statusLabels: Record<QuoteStatus, string> = {
  draft: "Borrador",
  sent: "Enviado",
  approved: "Aprobado",
  rejected: "Rechazado",
  expired: "Vencido",
};

export const solutionTypeLabels: Record<SolutionType, string> = {
  workstations: "Computadoras y hardware",
  infrastructure: "Infraestructura",
  licensing: "Licencias y software",
  "technical-service": "Servicio tecnico",
  networking: "Networking",
};

export type Quote = {
  id: string;
  number: string;
  customerId?: string;
  customerName: string;
  customerTaxId: string;
  solutionType: SolutionType;
  sellerName: string;
  status: QuoteStatus;
  currency: CurrencyCode;
  totalAmount: number;
  validUntil: string;
  createdAt: string;
  notes: string;
};

export type CreateQuoteInput = {
  customerId: string;
  customerName: string;
  customerTaxId: string;
  solutionType: SolutionType;
  sellerName: string;
  currency: CurrencyCode;
  totalAmount: number;
  validUntil: string;
  notes: string;
};

export type QuoteFieldName =
  | "customerId"
  | "customerName"
  | "customerTaxId"
  | "solutionType"
  | "sellerName"
  | "currency"
  | "totalAmount"
  | "validUntil"
  | "notes";

export type QuoteValidationResult =
  | {
      success: true;
      data: CreateQuoteInput;
    }
  | {
      success: false;
      message: string;
      fieldErrors: Partial<Record<QuoteFieldName, string>>;
    };

export type QuotesDashboard = {
  openQuotesCount: number;
  expiringThisWeekCount: number;
  pipelineByCurrency: Record<CurrencyCode, number>;
  approvedThisMonthCount: number;
};
