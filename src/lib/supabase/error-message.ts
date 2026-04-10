type SupabaseErrorShape = {
  code?: string | null;
  details?: string | null;
  hint?: string | null;
  message?: string | null;
};

type SupabaseOperation =
  | "customers-read"
  | "customers-write"
  | "quotes-read"
  | "quotes-write"
  | "products-read"
  | "products-write"
  | "sales-orders-read"
  | "sales-orders-write";

function getSupabaseErrorShape(error: unknown): SupabaseErrorShape {
  if (!error || typeof error !== "object") {
    return {};
  }

  const maybeError = error as SupabaseErrorShape;

  return {
    code: maybeError.code ?? null,
    details: maybeError.details ?? null,
    hint: maybeError.hint ?? null,
    message: maybeError.message ?? null,
  };
}

export function getSupabaseActionMessage(
  error: unknown,
  operation: SupabaseOperation,
) {
  const supabaseError = getSupabaseErrorShape(error);
  const message = (supabaseError.message ?? "").toLowerCase();
  const isPermissionError =
    supabaseError.code === "42501" || message.includes("permission denied");
  const isMissingRelation =
    supabaseError.code === "PGRST205" ||
    supabaseError.code === "42p01" ||
    message.includes("schema cache") ||
    message.includes("relation") ||
    message.includes("does not exist");

  if (isPermissionError) {
    if (
      operation === "products-read" ||
      operation === "products-write"
    ) {
      return "Supabase esta respondiendo, pero el modulo de productos todavia no tiene permisos o estructura lista para la web publica. Ejecuta 0004_product_catalog_module.sql en Supabase y luego toca Reintentar conexion.";
    }

    if (
      operation === "sales-orders-read" ||
      operation === "sales-orders-write"
    ) {
      return "Supabase esta respondiendo, pero el modulo de ordenes todavia no tiene permisos o estructura lista para la web publica. Ejecuta 0003_sales_orders_module.sql en Supabase y luego toca Reintentar conexion.";
    }

    if (operation === "customers-read" || operation === "quotes-read") {
      return "Supabase esta respondiendo, pero la web publica no tiene permisos sobre las tablas. Ejecuta el parche 0002_enable_anon_browser_access.sql en Supabase y luego toca Reintentar conexion.";
    }

    return "Supabase esta respondiendo, pero la web publica no tiene permisos para guardar. Ejecuta el parche 0002_enable_anon_browser_access.sql en Supabase y vuelve a intentar.";
  }

  if (isMissingRelation) {
    if (
      operation === "products-read" ||
      operation === "products-write"
    ) {
      return "El modulo de productos todavia no existe en tu base. Corre 0004_product_catalog_module.sql en Supabase y luego toca Reintentar conexion.";
    }

    if (
      operation === "sales-orders-read" ||
      operation === "sales-orders-write"
    ) {
      return "El modulo de ordenes de venta todavia no existe en tu base. Corre 0003_sales_orders_module.sql en Supabase y luego toca Reintentar conexion.";
    }

    if (operation === "customers-read" || operation === "quotes-read") {
      return "La estructura de Supabase todavia no esta completa. Verifica que hayas corrido 0001_initial_schema.sql y luego Reintentar conexion.";
    }

    return "La estructura de Supabase todavia no esta completa para guardar datos. Verifica que hayas corrido 0001_initial_schema.sql.";
  }

  if (operation === "customers-read") {
    return "No se pudo leer Supabase para clientes. Revisa la conexion del proyecto y vuelve a intentar.";
  }

  if (operation === "customers-write") {
    return "No se pudo guardar el cliente en Supabase. Revisa permisos, esquema y conexion del proyecto.";
  }

  if (operation === "quotes-read") {
    return "No se pudo leer Supabase para presupuestos. Revisa la conexion del proyecto y vuelve a intentar.";
  }

  if (operation === "products-read") {
    return "No se pudo leer Supabase para productos. Revisa la conexion del proyecto y vuelve a intentar.";
  }

  if (operation === "products-write") {
    return "No se pudo guardar el producto en Supabase. Revisa permisos, esquema y conexion del proyecto.";
  }

  if (operation === "sales-orders-read") {
    return "No se pudo leer Supabase para ordenes de venta. Revisa la conexion del proyecto y vuelve a intentar.";
  }

  if (operation === "sales-orders-write") {
    return "No se pudo guardar la orden de venta en Supabase. Revisa permisos, esquema y conexion del proyecto.";
  }

  return "No se pudo guardar el presupuesto en Supabase. Revisa permisos, esquema y conexion del proyecto.";
}
