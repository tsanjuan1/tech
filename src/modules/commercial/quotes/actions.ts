"use server";

import { redirect } from "next/navigation";
import { createQuote } from "./repository";
import { validateCreateQuoteInput } from "./validation";

function createFeedbackUrl(type: "success" | "error", message: string) {
  const searchParams = new URLSearchParams({
    type,
    feedback: message,
  });

  return `/comercial/presupuestos?${searchParams.toString()}`;
}

export async function createQuoteAction(formData: FormData) {
  const validation = validateCreateQuoteInput({
    customerName: formData.get("customerName"),
    customerTaxId: formData.get("customerTaxId"),
    solutionType: formData.get("solutionType"),
    sellerName: formData.get("sellerName"),
    currency: formData.get("currency"),
    totalAmount: formData.get("totalAmount"),
    validUntil: formData.get("validUntil"),
    notes: formData.get("notes"),
  });

  if (!validation.success) {
    redirect(createFeedbackUrl("error", validation.message));
  }

  const quote = await createQuote(validation.data);

  redirect(
    createFeedbackUrl(
      "success",
      `Presupuesto ${quote.number} creado correctamente para ${quote.customerName}.`,
    ),
  );
}
