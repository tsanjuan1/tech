import { NextResponse } from "next/server";
import {
  createQuote,
  getQuotesDashboard,
  listQuotes,
} from "@/modules/commercial/quotes/repository";
import { validateCreateQuoteInput } from "@/modules/commercial/quotes/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const [quotes, dashboard] = await Promise.all([
    listQuotes(),
    getQuotesDashboard(),
  ]);

  return NextResponse.json({
    data: quotes,
    dashboard,
  });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const validation = validateCreateQuoteInput(payload);

  if (!validation.success) {
    return NextResponse.json(
      {
        error: "validation_error",
        message: validation.message,
        fieldErrors: validation.fieldErrors,
      },
      { status: 400 },
    );
  }

  const quote = await createQuote(validation.data);

  return NextResponse.json(
    {
      data: quote,
    },
    { status: 201 },
  );
}
