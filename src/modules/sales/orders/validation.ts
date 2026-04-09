import {
  currencies,
  solutionTypes,
} from "@/modules/commercial/quotes/types";
import {
  salesOrderStatuses,
  type CreateSalesOrderInput,
  type SalesOrderValidationResult,
} from "@/modules/sales/orders/types";

type RawCreateSalesOrderInput =
  Partial<Record<keyof CreateSalesOrderInput, unknown>> | null;

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isCurrency(value: string): value is CreateSalesOrderInput["currency"] {
  return currencies.includes(value as CreateSalesOrderInput["currency"]);
}

function isSolutionType(
  value: string,
): value is CreateSalesOrderInput["solutionType"] {
  return solutionTypes.includes(value as CreateSalesOrderInput["solutionType"]);
}

function isSalesOrderStatus(
  value: string,
): value is CreateSalesOrderInput["status"] {
  return salesOrderStatuses.includes(value as CreateSalesOrderInput["status"]);
}

export function validateCreateSalesOrderInput(
  rawInput: RawCreateSalesOrderInput,
): SalesOrderValidationResult {
  const input = rawInput ?? {};
  const customerId = asTrimmedString(input.customerId);
  const quoteId = asTrimmedString(input.quoteId);
  const customerName = asTrimmedString(input.customerName);
  const customerTaxId = asTrimmedString(input.customerTaxId).replace(/\D/g, "");
  const solutionType = asTrimmedString(input.solutionType);
  const sellerName = asTrimmedString(input.sellerName);
  const status = asTrimmedString(input.status);
  const currency = asTrimmedString(input.currency);
  const totalAmountText = asTrimmedString(input.totalAmount).replace(",", ".");
  const requestedDeliveryDate = asTrimmedString(input.requestedDeliveryDate);
  const notes = asTrimmedString(input.notes);

  const fieldErrors: Partial<Record<keyof CreateSalesOrderInput, string>> = {};

  if (!customerId) {
    fieldErrors.customerId = "Selecciona un cliente para continuar.";
  }

  if (!customerName || customerName.length < 3) {
    fieldErrors.customerName = "La razon social debe tener al menos 3 caracteres.";
  }

  if (customerTaxId.length !== 11) {
    fieldErrors.customerTaxId = "El CUIT debe tener 11 digitos.";
  }

  if (!isSolutionType(solutionType)) {
    fieldErrors.solutionType = "Selecciona un tipo de solucion valido.";
  }

  if (!sellerName || sellerName.length < 3) {
    fieldErrors.sellerName = "Indica el responsable comercial de la orden.";
  }

  if (!isSalesOrderStatus(status)) {
    fieldErrors.status = "Selecciona un estado operativo valido.";
  }

  if (!isCurrency(currency)) {
    fieldErrors.currency = "Selecciona una moneda valida.";
  }

  const totalAmount = Number(totalAmountText);

  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    fieldErrors.totalAmount = "El total debe ser un numero mayor a cero.";
  }

  const requestedDeliveryDateValue = new Date(`${requestedDeliveryDate}T00:00:00`);
  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    0,
    0,
    0,
    0,
  );

  if (
    !requestedDeliveryDate ||
    Number.isNaN(requestedDeliveryDateValue.getTime()) ||
    requestedDeliveryDateValue < startOfToday
  ) {
    fieldErrors.requestedDeliveryDate =
      "La fecha comprometida debe ser hoy o una fecha futura.";
  }

  if (notes.length > 500) {
    fieldErrors.notes = "Las observaciones no pueden superar 500 caracteres.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      message: "Revisa los datos de la orden antes de continuar.",
      fieldErrors,
    };
  }

  const parsedSolutionType = solutionType as CreateSalesOrderInput["solutionType"];
  const parsedStatus = status as CreateSalesOrderInput["status"];
  const parsedCurrency = currency as CreateSalesOrderInput["currency"];

  return {
    success: true,
    data: {
      customerId,
      quoteId: quoteId || null,
      customerName,
      customerTaxId,
      solutionType: parsedSolutionType,
      sellerName,
      status: parsedStatus,
      currency: parsedCurrency,
      totalAmount,
      requestedDeliveryDate,
      notes,
    },
  };
}
