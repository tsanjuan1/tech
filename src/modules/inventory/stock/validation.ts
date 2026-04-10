import {
  inventoryAllocationTypes,
  inventoryMovementTypes,
  type CreateInventoryAllocationInput,
  type CreateInventoryMovementInput,
  type InventoryAllocationValidationResult,
  type InventoryMovementValidationResult,
} from "@/modules/inventory/stock/types";

type RawCreateInventoryMovementInput =
  Partial<Record<keyof CreateInventoryMovementInput, unknown>> | null;

type RawCreateInventoryAllocationInput =
  Partial<Record<keyof CreateInventoryAllocationInput, unknown>> | null;

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isInventoryMovementType(
  value: string,
): value is CreateInventoryMovementInput["movementType"] {
  return inventoryMovementTypes.includes(
    value as CreateInventoryMovementInput["movementType"],
  );
}

function isInventoryAllocationType(
  value: string,
): value is CreateInventoryAllocationInput["allocationType"] {
  return inventoryAllocationTypes.includes(
    value as CreateInventoryAllocationInput["allocationType"],
  );
}

export function validateCreateInventoryMovementInput(
  rawInput: RawCreateInventoryMovementInput,
): InventoryMovementValidationResult {
  const input = rawInput ?? {};
  const productId = asTrimmedString(input.productId);
  const warehouseName = asTrimmedString(input.warehouseName);
  const movementType = asTrimmedString(input.movementType);
  const quantityText = asTrimmedString(input.quantity).replace(",", ".");
  const referenceNote = asTrimmedString(input.referenceNote);

  const fieldErrors: Partial<Record<keyof CreateInventoryMovementInput, string>> = {};

  if (!productId) {
    fieldErrors.productId = "Selecciona un producto para registrar movimiento.";
  }

  if (!warehouseName || warehouseName.length < 2) {
    fieldErrors.warehouseName = "Indica un deposito o ubicacion valida.";
  }

  if (!isInventoryMovementType(movementType)) {
    fieldErrors.movementType = "Selecciona un tipo de movimiento valido.";
  }

  const quantity = Number(quantityText);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    fieldErrors.quantity = "La cantidad debe ser un numero mayor a cero.";
  }

  if (referenceNote.length > 500) {
    fieldErrors.referenceNote = "La referencia no puede superar 500 caracteres.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      message: "Revisa los datos del movimiento antes de continuar.",
      fieldErrors,
    };
  }

  return {
    success: true,
    data: {
      productId,
      warehouseName,
      movementType: movementType as CreateInventoryMovementInput["movementType"],
      quantity,
      referenceNote,
    },
  };
}

export function validateCreateInventoryAllocationInput(
  rawInput: RawCreateInventoryAllocationInput,
): InventoryAllocationValidationResult {
  const input = rawInput ?? {};
  const salesOrderId = asTrimmedString(input.salesOrderId);
  const productId = asTrimmedString(input.productId);
  const warehouseName = asTrimmedString(input.warehouseName);
  const allocationType = asTrimmedString(input.allocationType);
  const quantityText = asTrimmedString(input.quantity).replace(",", ".");
  const notes = asTrimmedString(input.notes);

  const fieldErrors: Partial<Record<keyof CreateInventoryAllocationInput, string>> = {};

  if (!salesOrderId) {
    fieldErrors.salesOrderId = "Selecciona una orden para registrar la reserva.";
  }

  if (!productId) {
    fieldErrors.productId = "Selecciona un producto para reservar.";
  }

  if (!warehouseName || warehouseName.length < 2) {
    fieldErrors.warehouseName = "Indica un deposito o ubicacion valida.";
  }

  if (!isInventoryAllocationType(allocationType)) {
    fieldErrors.allocationType = "Selecciona un tipo de reserva valido.";
  }

  const quantity = Number(quantityText);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    fieldErrors.quantity = "La cantidad debe ser un numero mayor a cero.";
  }

  if (notes.length > 500) {
    fieldErrors.notes = "La referencia no puede superar 500 caracteres.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      message: "Revisa los datos de la reserva antes de continuar.",
      fieldErrors,
    };
  }

  return {
    success: true,
    data: {
      salesOrderId,
      productId,
      warehouseName,
      allocationType: allocationType as CreateInventoryAllocationInput["allocationType"],
      quantity,
      notes,
    },
  };
}
