import type { CurrencyCode } from "@/modules/commercial/quotes/types";
import type { SolutionType } from "@/modules/commercial/quotes/types";

export const salesOrderStatuses = [
  "entered",
  "credit-check",
  "ready-fulfillment",
  "partial-delivery",
  "delivered",
  "on-hold",
] as const;

export type SalesOrderStatus = (typeof salesOrderStatuses)[number];

export const salesOrderStatusLabels: Record<SalesOrderStatus, string> = {
  entered: "Ingresada",
  "credit-check": "Control crediticio",
  "ready-fulfillment": "Lista para preparar",
  "partial-delivery": "Entrega parcial",
  delivered: "Entregada",
  "on-hold": "En espera",
};

export type SalesOrder = {
  id: string;
  number: string;
  customerId: string;
  quoteId: string | null;
  sourceQuoteNumber: string | null;
  customerName: string;
  customerTaxId: string;
  solutionType: SolutionType;
  sellerName: string;
  status: SalesOrderStatus;
  currency: CurrencyCode;
  totalAmount: number;
  requestedDeliveryDate: string;
  createdAt: string;
  notes: string;
};

export type CreateSalesOrderInput = {
  customerId: string;
  quoteId: string | null;
  customerName: string;
  customerTaxId: string;
  solutionType: SolutionType;
  sellerName: string;
  status: SalesOrderStatus;
  currency: CurrencyCode;
  totalAmount: number;
  requestedDeliveryDate: string;
  notes: string;
};

export type SalesOrderFieldName =
  | "customerId"
  | "quoteId"
  | "customerName"
  | "customerTaxId"
  | "solutionType"
  | "sellerName"
  | "status"
  | "currency"
  | "totalAmount"
  | "requestedDeliveryDate"
  | "notes";

export type SalesOrderValidationResult =
  | {
      success: true;
      data: CreateSalesOrderInput;
    }
  | {
      success: false;
      message: string;
      fieldErrors: Partial<Record<SalesOrderFieldName, string>>;
    };

export type SalesOrdersDashboard = {
  openOrdersCount: number;
  dueThisWeekCount: number;
  onHoldCount: number;
  committedByCurrency: Record<CurrencyCode, number>;
};
