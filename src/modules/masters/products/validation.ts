import {
  currencies,
  solutionTypes,
} from "@/modules/commercial/quotes/types";
import {
  productCategories,
  productLifecycleStatuses,
  productSourcingTypes,
  type CreateProductInput,
  type ProductValidationResult,
} from "@/modules/masters/products/types";

type RawCreateProductInput =
  Partial<Record<keyof CreateProductInput, unknown>> | null;

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isProductCategory(value: string): value is CreateProductInput["category"] {
  return productCategories.includes(value as CreateProductInput["category"]);
}

function isSolutionType(value: string): value is CreateProductInput["solutionType"] {
  return solutionTypes.includes(value as CreateProductInput["solutionType"]);
}

function isProductSourcingType(
  value: string,
): value is CreateProductInput["sourcingType"] {
  return productSourcingTypes.includes(
    value as CreateProductInput["sourcingType"],
  );
}

function isProductLifecycleStatus(
  value: string,
): value is CreateProductInput["lifecycleStatus"] {
  return productLifecycleStatuses.includes(
    value as CreateProductInput["lifecycleStatus"],
  );
}

function isCurrency(value: string): value is CreateProductInput["costCurrency"] {
  return currencies.includes(value as CreateProductInput["costCurrency"]);
}

export function validateCreateProductInput(
  rawInput: RawCreateProductInput,
): ProductValidationResult {
  const input = rawInput ?? {};
  const productName = asTrimmedString(input.productName);
  const brandName = asTrimmedString(input.brandName);
  const category = asTrimmedString(input.category);
  const solutionType = asTrimmedString(input.solutionType);
  const sourcingType = asTrimmedString(input.sourcingType);
  const lifecycleStatus = asTrimmedString(input.lifecycleStatus);
  const preferredVendor = asTrimmedString(input.preferredVendor);
  const costCurrency = asTrimmedString(input.costCurrency);
  const unitCostText = asTrimmedString(input.unitCost).replace(",", ".");
  const listPriceText = asTrimmedString(input.listPrice).replace(",", ".");
  const leadTimeDaysText = asTrimmedString(input.leadTimeDays);
  const warrantyMonthsText = asTrimmedString(input.warrantyMonths);
  const notes = asTrimmedString(input.notes);

  const fieldErrors: Partial<Record<keyof CreateProductInput, string>> = {};

  if (!productName || productName.length < 3) {
    fieldErrors.productName =
      "El nombre del producto debe tener al menos 3 caracteres.";
  }

  if (!brandName || brandName.length < 2) {
    fieldErrors.brandName = "Indica una marca valida para el producto.";
  }

  if (!isProductCategory(category)) {
    fieldErrors.category = "Selecciona una categoria valida.";
  }

  if (!isSolutionType(solutionType)) {
    fieldErrors.solutionType = "Selecciona un tipo de solucion valido.";
  }

  if (!isProductSourcingType(sourcingType)) {
    fieldErrors.sourcingType = "Selecciona una estrategia de abastecimiento valida.";
  }

  if (!isProductLifecycleStatus(lifecycleStatus)) {
    fieldErrors.lifecycleStatus = "Selecciona un estado de catalogo valido.";
  }

  if (!preferredVendor || preferredVendor.length < 2) {
    fieldErrors.preferredVendor = "Indica un proveedor o canal preferido valido.";
  }

  if (!isCurrency(costCurrency)) {
    fieldErrors.costCurrency = "Selecciona una moneda valida.";
  }

  const unitCost = Number(unitCostText);
  const listPrice = Number(listPriceText);
  const leadTimeDays = Number(leadTimeDaysText);
  const warrantyMonths = Number(warrantyMonthsText);

  if (!Number.isFinite(unitCost) || unitCost < 0) {
    fieldErrors.unitCost = "El costo debe ser un numero valido mayor o igual a cero.";
  }

  if (!Number.isFinite(listPrice) || listPrice <= 0) {
    fieldErrors.listPrice = "La lista debe ser un numero mayor a cero.";
  }

  if (
    !Number.isInteger(leadTimeDays) ||
    leadTimeDays < 0 ||
    leadTimeDays > 365
  ) {
    fieldErrors.leadTimeDays = "El lead time debe estar entre 0 y 365 dias.";
  }

  if (
    !Number.isInteger(warrantyMonths) ||
    warrantyMonths < 0 ||
    warrantyMonths > 60
  ) {
    fieldErrors.warrantyMonths =
      "La garantia debe estar entre 0 y 60 meses.";
  }

  if (notes.length > 500) {
    fieldErrors.notes = "Las observaciones no pueden superar 500 caracteres.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      message: "Revisa los datos del producto antes de continuar.",
      fieldErrors,
    };
  }

  return {
    success: true,
    data: {
      productName,
      brandName,
      category: category as CreateProductInput["category"],
      solutionType: solutionType as CreateProductInput["solutionType"],
      sourcingType: sourcingType as CreateProductInput["sourcingType"],
      lifecycleStatus: lifecycleStatus as CreateProductInput["lifecycleStatus"],
      preferredVendor,
      costCurrency: costCurrency as CreateProductInput["costCurrency"],
      unitCost,
      listPrice,
      leadTimeDays,
      warrantyMonths,
      notes,
    },
  };
}
