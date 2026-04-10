import type { ProductSourcingType } from "@/modules/masters/products/types";

export const inventoryMovementTypes = [
  "receipt",
  "adjustment-in",
  "adjustment-out",
  "dispatch",
  "return",
] as const;

export type InventoryMovementType = (typeof inventoryMovementTypes)[number];

export const inventoryAllocationTypes = [
  "reserve",
  "release",
  "deliver",
] as const;

export type InventoryAllocationType = (typeof inventoryAllocationTypes)[number];

export const inventoryMovementLabels: Record<InventoryMovementType, string> = {
  receipt: "Ingreso",
  "adjustment-in": "Ajuste positivo",
  "adjustment-out": "Ajuste negativo",
  dispatch: "Despacho",
  return: "Devolucion",
};

export const inventoryAllocationLabels: Record<InventoryAllocationType, string> = {
  reserve: "Reserva",
  release: "Liberacion",
  deliver: "Entrega logica",
};

export type InventoryMovement = {
  id: string;
  productId: string;
  warehouseName: string;
  movementType: InventoryMovementType;
  quantity: number;
  referenceNote: string;
  createdAt: string;
};

export type InventoryAllocation = {
  id: string;
  salesOrderId: string;
  productId: string;
  warehouseName: string;
  allocationType: InventoryAllocationType;
  quantity: number;
  notes: string;
  createdAt: string;
};

export type CreateInventoryMovementInput = {
  productId: string;
  warehouseName: string;
  movementType: InventoryMovementType;
  quantity: number;
  referenceNote: string;
};

export type CreateInventoryAllocationInput = {
  salesOrderId: string;
  productId: string;
  warehouseName: string;
  allocationType: InventoryAllocationType;
  quantity: number;
  notes: string;
};

export type InventoryMovementFieldName =
  | "productId"
  | "warehouseName"
  | "movementType"
  | "quantity"
  | "referenceNote";

export type InventoryAllocationFieldName =
  | "salesOrderId"
  | "productId"
  | "warehouseName"
  | "allocationType"
  | "quantity"
  | "notes";

export type InventoryMovementValidationResult =
  | {
      success: true;
      data: CreateInventoryMovementInput;
    }
  | {
      success: false;
      message: string;
      fieldErrors: Partial<Record<InventoryMovementFieldName, string>>;
    };

export type InventoryAllocationValidationResult =
  | {
      success: true;
      data: CreateInventoryAllocationInput;
    }
  | {
      success: false;
      message: string;
      fieldErrors: Partial<Record<InventoryAllocationFieldName, string>>;
    };

export type InventoryDashboard = {
  trackedPositionsCount: number;
  onHandUnits: number;
  reservedUnits: number;
  availableUnits: number;
};

export type InventorySummaryRow = {
  key: string;
  productId: string;
  sku: string;
  productName: string;
  brandName: string;
  warehouseName: string;
  onHandQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  sourcingType: ProductSourcingType;
  preferredVendor: string;
};

export type InventoryTimelineEntry = {
  id: string;
  createdAt: string;
  kind: "movement" | "allocation";
  warehouseName: string;
  productSku: string;
  productName: string;
  quantity: number;
  label: string;
  referenceText: string;
};
