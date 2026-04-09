import {
  creditStatuses,
  customerLifecycleStatuses,
  customerSegments,
  type CreateCustomerInput,
  type CustomerValidationResult,
} from "./types";

type RawCreateCustomerInput =
  Partial<Record<keyof CreateCustomerInput, unknown>> | null;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isCustomerSegment(value: string): value is CreateCustomerInput["segment"] {
  return customerSegments.includes(value as CreateCustomerInput["segment"]);
}

function isLifecycleStatus(
  value: string,
): value is CreateCustomerInput["lifecycleStatus"] {
  return customerLifecycleStatuses.includes(
    value as CreateCustomerInput["lifecycleStatus"],
  );
}

function isCreditStatus(value: string): value is CreateCustomerInput["creditStatus"] {
  return creditStatuses.includes(value as CreateCustomerInput["creditStatus"]);
}

export function validateCreateCustomerInput(
  rawInput: RawCreateCustomerInput,
): CustomerValidationResult {
  const input = rawInput ?? {};
  const businessName = asTrimmedString(input.businessName);
  const taxId = asTrimmedString(input.taxId).replace(/\D/g, "");
  const segment = asTrimmedString(input.segment);
  const accountManager = asTrimmedString(input.accountManager);
  const lifecycleStatus = asTrimmedString(input.lifecycleStatus);
  const creditStatus = asTrimmedString(input.creditStatus);
  const paymentTermDaysText = asTrimmedString(input.paymentTermDays);
  const email = asTrimmedString(input.email).toLowerCase();
  const phone = asTrimmedString(input.phone);
  const city = asTrimmedString(input.city);
  const notes = asTrimmedString(input.notes);

  const fieldErrors: Partial<Record<keyof CreateCustomerInput, string>> = {};

  if (!businessName || businessName.length < 3) {
    fieldErrors.businessName = "La razon social debe tener al menos 3 caracteres.";
  }

  if (taxId.length !== 11) {
    fieldErrors.taxId = "El CUIT debe tener 11 digitos.";
  }

  if (!isCustomerSegment(segment)) {
    fieldErrors.segment = "Selecciona un segmento valido.";
  }

  if (!accountManager || accountManager.length < 3) {
    fieldErrors.accountManager = "Indica un responsable comercial valido.";
  }

  if (!isLifecycleStatus(lifecycleStatus)) {
    fieldErrors.lifecycleStatus = "Selecciona un estado comercial valido.";
  }

  if (!isCreditStatus(creditStatus)) {
    fieldErrors.creditStatus = "Selecciona un estado de credito valido.";
  }

  const paymentTermDays = Number(paymentTermDaysText);

  if (
    !Number.isInteger(paymentTermDays) ||
    paymentTermDays < 0 ||
    paymentTermDays > 365
  ) {
    fieldErrors.paymentTermDays = "El plazo debe estar entre 0 y 365 dias.";
  }

  if (!email || !emailPattern.test(email)) {
    fieldErrors.email = "Ingresa un email valido.";
  }

  const normalizedPhoneDigits = phone.replace(/\D/g, "");
  if (!phone || normalizedPhoneDigits.length < 8) {
    fieldErrors.phone = "Ingresa un telefono valido con al menos 8 digitos.";
  }

  if (!city || city.length < 2) {
    fieldErrors.city = "Indica la localidad principal del cliente.";
  }

  if (notes.length > 500) {
    fieldErrors.notes = "Las observaciones no pueden superar 500 caracteres.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      message: "Revisa los datos del cliente antes de continuar.",
      fieldErrors,
    };
  }

  return {
    success: true,
    data: {
      businessName,
      taxId,
      segment: segment as CreateCustomerInput["segment"],
      accountManager,
      lifecycleStatus: lifecycleStatus as CreateCustomerInput["lifecycleStatus"],
      creditStatus: creditStatus as CreateCustomerInput["creditStatus"],
      paymentTermDays,
      email,
      phone,
      city,
      notes,
    },
  };
}
