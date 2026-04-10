import type { CurrencyCode } from "@/modules/commercial/quotes/types";

export const purchaseOrderStatuses = [
  "draft",
  "sent",
  "confirmed",
  "partial-receipt",
  "received",
  "cancelled",
] as const;

export type PurchaseOrderStatus = (typeof purchaseOrderStatuses)[number];

export const purchaseOrderStatusLabels: Record<PurchaseOrderStatus, string> = {
  draft: "Borrador",
  sent: "Enviada",
  confirmed: "Confirmada",
  "partial-receipt": "Recepcion parcial",
  received: "Recibida",
  cancelled: "Cancelada",
};

export type PurchaseOrder = {
  id: string;
  number: string;
  productId: string;
  salesOrderId: string | null;
  sourceSalesOrderNumber: string | null;
  productSku: string;
  productName: string;
  vendorName: string;
  warehouseName: string;
  buyerName: string;
  status: PurchaseOrderStatus;
  currency: CurrencyCode;
  quantity: number;
  unitCost: number;
  totalAmount: number;
  expectedReceiptDate: string;
  createdAt: string;
  notes: string;
};

export type CreatePurchaseOrderInput = {
  productId: string;
  salesOrderId: string | null;
  vendorName: string;
  warehouseName: string;
  buyerName: string;
  status: PurchaseOrderStatus;
  currency: CurrencyCode;
  quantity: number;
  unitCost: number;
  expectedReceiptDate: string;
  notes: string;
};

export type PurchaseOrderFieldName =
  | "productId"
  | "salesOrderId"
  | "vendorName"
  | "warehouseName"
  | "buyerName"
  | "status"
  | "currency"
  | "quantity"
  | "unitCost"
  | "expectedReceiptDate"
  | "notes";

export type PurchaseOrderValidationResult =
  | {
      success: true;
      data: CreatePurchaseOrderInput;
    }
  | {
      success: false;
      message: string;
      fieldErrors: Partial<Record<PurchaseOrderFieldName, string>>;
    };

export type PurchaseOrdersDashboard = {
  openPurchaseOrdersCount: number;
  dueThisWeekCount: number;
  replenishmentSignalsCount: number;
  committedByCurrency: Record<CurrencyCode, number>;
};

export type ReplenishmentSuggestion = {
  key: string;
  productId: string;
  sku: string;
  productName: string;
  warehouseName: string;
  availableQuantity: number;
  reservedQuantity: number;
  suggestedQuantity: number;
  preferredVendor: string;
  leadTimeDays: number;
};
