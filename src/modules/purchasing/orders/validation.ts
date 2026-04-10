import { currencies } from "@/modules/commercial/quotes/types";
import {
  purchaseOrderStatuses,
  type CreatePurchaseOrderInput,
  type PurchaseOrderValidationResult,
} from "@/modules/purchasing/orders/types";

type RawCreatePurchaseOrderInput =
  Partial<Record<keyof CreatePurchaseOrderInput, unknown>> | null;

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isCurrency(value: string): value is CreatePurchaseOrderInput["currency"] {
  return currencies.includes(value as CreatePurchaseOrderInput["currency"]);
}

function isPurchaseOrderStatus(
  value: string,
): value is CreatePurchaseOrderInput["status"] {
  return purchaseOrderStatuses.includes(value as CreatePurchaseOrderInput["status"]);
}

export function validateCreatePurchaseOrderInput(
  rawInput: RawCreatePurchaseOrderInput,
): PurchaseOrderValidationResult {
  const input = rawInput ?? {};
  const productId = asTrimmedString(input.productId);
  const salesOrderId = asTrimmedString(input.salesOrderId);
  const vendorName = asTrimmedString(input.vendorName);
  const warehouseName = asTrimmedString(input.warehouseName);
  const buyerName = asTrimmedString(input.buyerName);
  const status = asTrimmedString(input.status);
  const currency = asTrimmedString(input.currency);
  const quantityText = asTrimmedString(input.quantity).replace(",", ".");
  const unitCostText = asTrimmedString(input.unitCost).replace(",", ".");
  const expectedReceiptDate = asTrimmedString(input.expectedReceiptDate);
  const notes = asTrimmedString(input.notes);

  const fieldErrors: Partial<Record<keyof CreatePurchaseOrderInput, string>> = {};

  if (!productId) {
    fieldErrors.productId = "Selecciona un producto para continuar.";
  }

  if (!vendorName || vendorName.length < 2) {
    fieldErrors.vendorName = "Indica un proveedor valido.";
  }

  if (!warehouseName || warehouseName.length < 2) {
    fieldErrors.warehouseName = "Indica un deposito o destino valido.";
  }

  if (!buyerName || buyerName.length < 3) {
    fieldErrors.buyerName = "Indica un responsable de compras valido.";
  }

  if (!isPurchaseOrderStatus(status)) {
    fieldErrors.status = "Selecciona un estado valido.";
  }

  if (!isCurrency(currency)) {
    fieldErrors.currency = "Selecciona una moneda valida.";
  }

  const quantity = Number(quantityText);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    fieldErrors.quantity = "La cantidad debe ser un numero mayor a cero.";
  }

  const unitCost = Number(unitCostText);
  if (!Number.isFinite(unitCost) || unitCost < 0) {
    fieldErrors.unitCost = "El costo unitario debe ser un numero valido.";
  }

  const expectedReceiptDateValue = new Date(`${expectedReceiptDate}T00:00:00`);
  if (!expectedReceiptDate || Number.isNaN(expectedReceiptDateValue.getTime())) {
    fieldErrors.expectedReceiptDate = "Indica una fecha estimada valida.";
  }

  if (notes.length > 500) {
    fieldErrors.notes = "Las observaciones no pueden superar 500 caracteres.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      message: "Revisa los datos de la orden de compra antes de continuar.",
      fieldErrors,
    };
  }

  return {
    success: true,
    data: {
      productId,
      salesOrderId: salesOrderId || null,
      vendorName,
      warehouseName,
      buyerName,
      status: status as CreatePurchaseOrderInput["status"],
      currency: currency as CreatePurchaseOrderInput["currency"],
      quantity,
      unitCost,
      expectedReceiptDate,
      notes,
    },
  };
}
