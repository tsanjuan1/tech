import {
  currencies,
  solutionTypes,
  type CreateQuoteInput,
  type QuoteValidationResult,
} from "./types";

type RawCreateQuoteInput = Partial<Record<keyof CreateQuoteInput, unknown>> | null;

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isCurrency(value: string): value is CreateQuoteInput["currency"] {
  return currencies.includes(value as CreateQuoteInput["currency"]);
}

function isSolutionType(value: string): value is CreateQuoteInput["solutionType"] {
  return solutionTypes.includes(value as CreateQuoteInput["solutionType"]);
}

export function validateCreateQuoteInput(
  rawInput: RawCreateQuoteInput,
): QuoteValidationResult {
  const input = rawInput ?? {};
  const customerId = asTrimmedString(input.customerId);
  const customerName = asTrimmedString(input.customerName);
  const customerTaxId = asTrimmedString(input.customerTaxId).replace(/\D/g, "");
  const solutionType = asTrimmedString(input.solutionType);
  const sellerName = asTrimmedString(input.sellerName);
  const currency = asTrimmedString(input.currency);
  const totalAmountText = asTrimmedString(input.totalAmount).replace(",", ".");
  const validUntil = asTrimmedString(input.validUntil);
  const notes = asTrimmedString(input.notes);

  const fieldErrors: Partial<Record<keyof CreateQuoteInput, string>> = {};

  if (!customerId) {
    fieldErrors.customerId = "Selecciona un cliente del maestro para continuar.";
  }

  if (!customerName || customerName.length < 3) {
    fieldErrors.customerName = "El cliente debe tener al menos 3 caracteres.";
  }

  if (customerTaxId.length !== 11) {
    fieldErrors.customerTaxId = "El CUIT debe tener 11 digitos.";
  }

  if (!isSolutionType(solutionType)) {
    fieldErrors.solutionType = "Selecciona un tipo de solucion valido.";
  }

  if (!sellerName || sellerName.length < 3) {
    fieldErrors.sellerName = "Indica el responsable comercial.";
  }

  if (!isCurrency(currency)) {
    fieldErrors.currency = "Selecciona una moneda valida.";
  }

  const totalAmount = Number(totalAmountText);

  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    fieldErrors.totalAmount = "El total debe ser un numero mayor a cero.";
  }

  const validUntilDate = new Date(`${validUntil}T00:00:00`);
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
    !validUntil ||
    Number.isNaN(validUntilDate.getTime()) ||
    validUntilDate < startOfToday
  ) {
    fieldErrors.validUntil = "La vigencia debe ser hoy o una fecha futura.";
  }

  if (notes.length > 500) {
    fieldErrors.notes = "El alcance comercial no puede superar 500 caracteres.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      message: "Revisa los datos del presupuesto antes de continuar.",
      fieldErrors,
    };
  }

  const parsedSolutionType = solutionType as CreateQuoteInput["solutionType"];
  const parsedCurrency = currency as CreateQuoteInput["currency"];

  return {
    success: true,
    data: {
      customerId,
      customerName,
      customerTaxId,
      solutionType: parsedSolutionType,
      sellerName,
      currency: parsedCurrency,
      totalAmount,
      validUntil,
      notes,
    },
  };
}
