"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ModuleNav } from "@/components/module-nav";
import styles from "@/components/module-shell.module.css";
import { SubmitButton } from "@/components/submit-button";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { getSupabaseActionMessage } from "@/lib/supabase/error-message";
import type { CurrencyCode } from "@/modules/commercial/quotes/types";
import {
  getInventorySummaryRows,
  listSupabaseInventoryAllocations,
  listSupabaseInventoryMovements,
} from "@/modules/inventory/stock/repository";
import type {
  InventoryAllocation,
  InventoryMovement,
} from "@/modules/inventory/stock/types";
import { listSupabaseProducts } from "@/modules/masters/products/repository";
import { productSourcingTypeLabels, type Product } from "@/modules/masters/products/types";
import {
  createSupabasePurchaseOrder,
  getPurchaseOrdersDashboard,
  getReplenishmentSuggestions,
  listSupabasePurchaseOrders,
} from "@/modules/purchasing/orders/repository";
import type {
  PurchaseOrder,
  PurchaseOrderFieldName,
  PurchaseOrderStatus,
} from "@/modules/purchasing/orders/types";
import {
  purchaseOrderStatusLabels,
  purchaseOrderStatuses,
} from "@/modules/purchasing/orders/types";
import { validateCreatePurchaseOrderInput } from "@/modules/purchasing/orders/validation";
import { listSupabaseSalesOrders } from "@/modules/sales/orders/repository";
import type { SalesOrder } from "@/modules/sales/orders/types";

type PurchasingWorkspaceProps = {
  initialPurchaseOrders: PurchaseOrder[];
  initialProducts: Product[];
  initialSalesOrders: SalesOrder[];
  initialMovements: InventoryMovement[];
  initialAllocations: InventoryAllocation[];
};

type FeedbackState =
  | {
      type: "success" | "error";
      message: string;
    }
  | null;

type FormState = {
  productId: string;
  salesOrderId: string;
  vendorName: string;
  warehouseName: string;
  buyerName: string;
  status: string;
  currency: string;
  quantity: string;
  unitCost: string;
  expectedReceiptDate: string;
  notes: string;
};

const defaultFormState: FormState = {
  productId: "",
  salesOrderId: "",
  vendorName: "",
  warehouseName: "Deposito Central",
  buyerName: "Equipo de Compras",
  status: "draft",
  currency: "USD",
  quantity: "",
  unitCost: "",
  expectedReceiptDate: "",
  notes: "",
};

const statusTone: Record<PurchaseOrderStatus, string> = {
  draft: styles.statusDraft,
  sent: styles.statusSent,
  confirmed: styles.statusApproved,
  "partial-receipt": styles.statusSent,
  received: styles.statusApproved,
  cancelled: styles.statusRejected,
};

const currencyLabels: Record<CurrencyCode, string> = {
  ARS: "ARS",
  USD: "USD",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatMoney(amount: number, currency: CurrencyCode) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function getDaysUntil(value: string) {
  const dueDate = new Date(`${value}T00:00:00`);
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );

  const diff = dueDate.getTime() - startOfToday.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getStockSuggestionNotice(error: unknown) {
  if (!error || typeof error !== "object") {
    return "No se pudo leer el modulo de stock para calcular sugerencias reales. Se muestran datos base como referencia.";
  }

  const candidate = error as { code?: string | null; message?: string | null };
  const message = (candidate.message ?? "").toLowerCase();

  if (
    candidate.code === "PGRST205" ||
    message.includes("schema cache") ||
    message.includes("does not exist")
  ) {
    return "Las sugerencias reales de reposicion usan el modulo Stock. Corre 0005_inventory_stock_module.sql en Supabase para reemplazar estos datos base por disponibilidad real.";
  }

  if (candidate.code === "42501" || message.includes("permission denied")) {
    return "Supabase responde, pero la web publica todavia no puede leer stock para sugerir reposicion real. Se muestran datos base mientras tanto.";
  }

  return "No se pudo leer el modulo de stock para calcular sugerencias reales. Se muestran datos base como referencia.";
}

export function PurchasingWorkspace({
  initialPurchaseOrders,
  initialProducts,
  initialSalesOrders,
  initialMovements,
  initialAllocations,
}: PurchasingWorkspaceProps) {
  const [purchaseOrders, setPurchaseOrders] = useState(initialPurchaseOrders);
  const [products, setProducts] = useState(initialProducts);
  const [salesOrders, setSalesOrders] = useState(initialSalesOrders);
  const [movements, setMovements] = useState(initialMovements);
  const [allocations, setAllocations] = useState(initialAllocations);
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [connectionNotice, setConnectionNotice] = useState<string | null>(null);
  const [stockSuggestionNotice, setStockSuggestionNotice] = useState<string | null>(
    null,
  );
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<PurchaseOrderFieldName, string>>
  >({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isMountedRef = useRef(true);

  async function loadWorkspace() {
    if (!isSupabaseConfigured()) {
      if (isMountedRef.current) {
        setIsRefreshing(false);
        setConnectionNotice(
          "Supabase no esta configurado todavia. La app queda mostrando los datos base para que puedas seguir navegando.",
        );
      }

      return;
    }

    const supabase = getSupabaseBrowserClient();
    const [coreResult, inventoryResult] = await Promise.allSettled([
      Promise.all([
        listSupabasePurchaseOrders(supabase),
        listSupabaseProducts(supabase),
        listSupabaseSalesOrders(supabase),
      ]),
      Promise.all([
        listSupabaseInventoryMovements(supabase),
        listSupabaseInventoryAllocations(supabase),
      ]),
    ]);

    if (coreResult.status === "fulfilled") {
      const [nextPurchaseOrders, nextProducts, nextSalesOrders] = coreResult.value;

      if (isMountedRef.current) {
        setPurchaseOrders(nextPurchaseOrders);
        setProducts(nextProducts);
        setSalesOrders(nextSalesOrders);
        setConnectionNotice(null);
      }
    } else if (isMountedRef.current) {
      setConnectionNotice(getSupabaseActionMessage(coreResult.reason, "purchases-read"));
    }

    if (inventoryResult.status === "fulfilled") {
      const [nextMovements, nextAllocations] = inventoryResult.value;

      if (isMountedRef.current) {
        setMovements(nextMovements);
        setAllocations(nextAllocations);
        setStockSuggestionNotice(null);
      }
    } else if (isMountedRef.current) {
      setStockSuggestionNotice(getStockSuggestionNotice(inventoryResult.reason));
    }

    if (isMountedRef.current) {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    isMountedRef.current = true;
    void loadWorkspace();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const inventorySummary = useMemo(
    () => getInventorySummaryRows(products, movements, allocations),
    [products, movements, allocations],
  );
  const replenishmentSuggestions = useMemo(
    () => getReplenishmentSuggestions(products, inventorySummary),
    [products, inventorySummary],
  );
  const dashboard = useMemo(
    () =>
      getPurchaseOrdersDashboard(
        purchaseOrders,
        replenishmentSuggestions.length,
      ),
    [purchaseOrders, replenishmentSuggestions.length],
  );
  const selectedProduct = useMemo(
    () => products.find((product) => product.id === formState.productId) ?? null,
    [products, formState.productId],
  );
  const openSalesOrders = useMemo(
    () =>
      salesOrders.filter(
        (salesOrder) =>
          salesOrder.status !== "delivered" && salesOrder.status !== "on-hold",
      ),
    [salesOrders],
  );

  function handleFieldChange(field: keyof FormState, value: string) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));

    const errorField = field as PurchaseOrderFieldName;
    if (fieldErrors[errorField]) {
      setFieldErrors((current) => ({
        ...current,
        [errorField]: undefined,
      }));
    }
  }

  function handleProductChange(productId: string) {
    const product = products.find((entry) => entry.id === productId) ?? null;

    setFormState((current) => ({
      ...current,
      productId,
      vendorName: product?.preferredVendor ?? current.vendorName,
      warehouseName:
        product?.sourcingType === "license"
          ? "Licencias Digitales"
          : current.warehouseName,
      currency: product?.costCurrency ?? current.currency,
      unitCost: product ? String(product.unitCost) : current.unitCost,
    }));

    setFieldErrors((current) => ({
      ...current,
      productId: undefined,
      vendorName: undefined,
      currency: undefined,
      unitCost: undefined,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validateCreatePurchaseOrderInput(formState);

    if (!validation.success) {
      setFieldErrors(validation.fieldErrors);
      setFeedback({
        type: "error",
        message: validation.message,
      });
      return;
    }

    setIsSaving(true);

    try {
      const nextPurchaseOrder = await createSupabasePurchaseOrder(
        getSupabaseBrowserClient(),
        validation.data,
      );

      setPurchaseOrders((current) => [nextPurchaseOrder, ...current]);
      setFormState(defaultFormState);
      setFieldErrors({});
      setFeedback({
        type: "success",
        message: `Orden de compra ${nextPurchaseOrder.number} creada correctamente para ${nextPurchaseOrder.productName}.`,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: getSupabaseActionMessage(error, "purchases-write"),
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRetryConnection() {
    setIsRefreshing(true);
    setFeedback(null);
    await loadWorkspace();
  }

  return (
    <main className={styles.shell}>
      <ModuleNav />

      <section className={styles.hero}>
        <article className={styles.heroPanel}>
          <span className={styles.eyebrow}>Modulo 06 / Compras</span>
          <h1 className={styles.heroTitle}>Reposicion y abastecimiento con criterio operativo</h1>
          <p className={styles.heroText}>
            Este modulo convierte faltantes y necesidades comerciales en ordenes
            de compra concretas. Toma producto, proveedor preferido, costo,
            deposito destino y orden relacionada para empezar a cerrar el ciclo
            entre venta, stock y abastecimiento.
          </p>

          <div className={styles.heroCallouts}>
            <div className={styles.callout}>
              <span className={styles.calloutLabel}>Abastecimiento</span>
              <strong className={styles.calloutValue}>Ordenes de compra trazables</strong>
            </div>
            <div className={styles.callout}>
              <span className={styles.calloutLabel}>Analisis</span>
              <strong className={styles.calloutValue}>Reposicion sugerida por disponibilidad</strong>
            </div>
            <div className={styles.callout}>
              <span className={styles.calloutLabel}>Proximo hito</span>
              <strong className={styles.calloutValue}>Entregas y remitos</strong>
            </div>
          </div>
        </article>

        <aside className={styles.sidebarPanel}>
          <div>
            <h2 className={styles.sidebarTitle}>Que resuelve ahora</h2>
            <p className={styles.sidebarText}>
              Compras deja de correr detras de lo urgente en planillas
              separadas. Ahora puede registrar ordenes, ver lo que falta y
              anticipar reposiciones sobre el mismo mapa operativo del ERP.
            </p>
          </div>

          <div className={styles.sidebarList}>
            <div className={styles.sidebarItem}>
              <strong>Stock</strong>
              <span>La reposicion se apoya en disponibilidad y reservas del catalogo actual.</span>
            </div>
            <div className={styles.sidebarItem}>
              <strong>Ventas</strong>
              <span>La compra puede quedar vinculada a una orden para seguir su contexto.</span>
            </div>
            <div className={styles.sidebarItem}>
              <strong>Proveedores</strong>
              <span>Se reutiliza el proveedor preferido y el costo base del producto.</span>
            </div>
          </div>
        </aside>
      </section>

      {feedback ? (
        <section
          className={`${styles.feedback} ${
            feedback.type === "error"
              ? styles.feedbackError
              : styles.feedbackSuccess
          }`}
        >
          {feedback.message}
        </section>
      ) : null}

      {connectionNotice ? (
        <section className={styles.feedback}>
          <div>{connectionNotice}</div>
          <div className={styles.feedbackActions}>
            <button
              className={styles.secondaryButton}
              onClick={handleRetryConnection}
              type="button"
            >
              {isRefreshing ? "Reintentando..." : "Reintentar conexion"}
            </button>
          </div>
        </section>
      ) : null}

      {stockSuggestionNotice ? (
        <section className={styles.feedback}>{stockSuggestionNotice}</section>
      ) : null}

      <section className={styles.metrics}>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Ordenes abiertas</span>
          <strong className={styles.metricValue}>{dashboard.openPurchaseOrdersCount}</strong>
          <p className={styles.metricHint}>
            Incluye borradores, enviadas, confirmadas y recepciones parciales.
          </p>
        </article>

        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Recepciones 7 dias</span>
          <strong className={styles.metricValue}>{dashboard.dueThisWeekCount}</strong>
          <p className={styles.metricHint}>
            Ordenes abiertas con ingreso esperado dentro de la semana operativa.
          </p>
        </article>

        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Senales de reposicion</span>
          <strong className={styles.metricValue}>
            {dashboard.replenishmentSignalsCount}
          </strong>
          <p className={styles.metricHint}>
            Productos con disponibilidad baja o nula segun el stock actual.
          </p>
        </article>

        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Compromiso USD</span>
          <strong className={styles.metricValue}>
            {formatMoney(dashboard.committedByCurrency.USD, "USD")}
          </strong>
          <p className={styles.metricHint}>
            {dashboard.committedByCurrency.ARS > 0
              ? `Tambien ${formatMoney(dashboard.committedByCurrency.ARS, "ARS")} en ARS.`
              : "Moneda principal del abastecimiento actual."}
          </p>
        </article>
      </section>

      <section className={styles.grid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Nueva orden de compra</h2>
              <p className={styles.panelText}>
                Alta operativa de compras con referencia a producto, proveedor,
                deposito destino y orden relacionada cuando la reposicion nace
                desde una venta concreta.
              </p>
            </div>
            <span className={styles.stack}>Procurement</span>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span className={styles.label}>Producto</span>
                <select
                  className={styles.select}
                  onChange={(event) => handleProductChange(event.target.value)}
                  value={formState.productId}
                >
                  <option value="">Selecciona un producto</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.sku} · {product.productName}
                    </option>
                  ))}
                </select>
                {fieldErrors.productId ? (
                  <span className={styles.secondary}>{fieldErrors.productId}</span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Orden relacionada</span>
                <select
                  className={styles.select}
                  onChange={(event) =>
                    handleFieldChange("salesOrderId", event.target.value)
                  }
                  value={formState.salesOrderId}
                >
                  <option value="">Sin relacion directa</option>
                  {openSalesOrders.map((salesOrder) => (
                    <option key={salesOrder.id} value={salesOrder.id}>
                      {salesOrder.number} · {salesOrder.customerName}
                    </option>
                  ))}
                </select>
                {fieldErrors.salesOrderId ? (
                  <span className={styles.secondary}>{fieldErrors.salesOrderId}</span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Proveedor</span>
                <input
                  className={styles.input}
                  onChange={(event) =>
                    handleFieldChange("vendorName", event.target.value)
                  }
                  placeholder="Proveedor o canal"
                  type="text"
                  value={formState.vendorName}
                />
                {fieldErrors.vendorName ? (
                  <span className={styles.secondary}>{fieldErrors.vendorName}</span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Deposito destino</span>
                <input
                  className={styles.input}
                  onChange={(event) =>
                    handleFieldChange("warehouseName", event.target.value)
                  }
                  placeholder="Deposito Central"
                  type="text"
                  value={formState.warehouseName}
                />
                {fieldErrors.warehouseName ? (
                  <span className={styles.secondary}>{fieldErrors.warehouseName}</span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Comprador</span>
                <input
                  className={styles.input}
                  onChange={(event) =>
                    handleFieldChange("buyerName", event.target.value)
                  }
                  placeholder="Responsable de compras"
                  type="text"
                  value={formState.buyerName}
                />
                {fieldErrors.buyerName ? (
                  <span className={styles.secondary}>{fieldErrors.buyerName}</span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Estado</span>
                <select
                  className={styles.select}
                  onChange={(event) => handleFieldChange("status", event.target.value)}
                  value={formState.status}
                >
                  {purchaseOrderStatuses.map((status) => (
                    <option key={status} value={status}>
                      {purchaseOrderStatusLabels[status]}
                    </option>
                  ))}
                </select>
                {fieldErrors.status ? (
                  <span className={styles.secondary}>{fieldErrors.status}</span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Moneda</span>
                <select
                  className={styles.select}
                  onChange={(event) =>
                    handleFieldChange("currency", event.target.value)
                  }
                  value={formState.currency}
                >
                  <option value="USD">{currencyLabels.USD}</option>
                  <option value="ARS">{currencyLabels.ARS}</option>
                </select>
                {fieldErrors.currency ? (
                  <span className={styles.secondary}>{fieldErrors.currency}</span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Cantidad</span>
                <input
                  className={styles.input}
                  inputMode="decimal"
                  onChange={(event) =>
                    handleFieldChange("quantity", event.target.value)
                  }
                  placeholder="0"
                  type="text"
                  value={formState.quantity}
                />
                {fieldErrors.quantity ? (
                  <span className={styles.secondary}>{fieldErrors.quantity}</span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Costo unitario</span>
                <input
                  className={styles.input}
                  inputMode="decimal"
                  onChange={(event) =>
                    handleFieldChange("unitCost", event.target.value)
                  }
                  placeholder="0.00"
                  type="text"
                  value={formState.unitCost}
                />
                {fieldErrors.unitCost ? (
                  <span className={styles.secondary}>{fieldErrors.unitCost}</span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Recepcion estimada</span>
                <input
                  className={styles.input}
                  onChange={(event) =>
                    handleFieldChange("expectedReceiptDate", event.target.value)
                  }
                  type="date"
                  value={formState.expectedReceiptDate}
                />
                {fieldErrors.expectedReceiptDate ? (
                  <span className={styles.secondary}>
                    {fieldErrors.expectedReceiptDate}
                  </span>
                ) : null}
              </label>

              <label className={styles.fieldWide}>
                <span className={styles.label}>Observaciones</span>
                <textarea
                  className={styles.textarea}
                  onChange={(event) => handleFieldChange("notes", event.target.value)}
                  placeholder="Detalle de la compra, condicion acordada, referencia de cotizacion o criterio de reposicion."
                  value={formState.notes}
                />
                <div className={styles.hintRow}>
                  <span>
                    {selectedProduct
                      ? `Proveedor sugerido ${selectedProduct.preferredVendor} · lead time ${selectedProduct.leadTimeDays} dias · ${productSourcingTypeLabels[selectedProduct.sourcingType]}`
                      : "Al elegir un producto se completa el proveedor y costo base sugerido."}
                  </span>
                  <span>{formState.notes.length}/500</span>
                </div>
                {fieldErrors.notes ? (
                  <span className={styles.secondary}>{fieldErrors.notes}</span>
                ) : null}
              </label>
            </div>

            <SubmitButton pending={isSaving}>Guardar orden de compra</SubmitButton>
          </form>

          <p className={styles.note}>
            La reposicion todavia no se dispara sola desde stock. En esta etapa
            el sistema ya te muestra la senal y te permite convertirla en una
            orden de compra real desde la misma web.
          </p>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Ordenes recientes</h2>
              <p className={styles.panelText}>
                Seguimiento de compras emitidas con referencia a producto,
                proveedor, estado y fecha esperada de recepcion.
              </p>
            </div>
            <span className={styles.stack}>Seguimiento</span>
          </div>
          
          <div className={styles.tableWrap}>
            {purchaseOrders.length === 0 ? (
              <div className={styles.empty}>Todavia no hay ordenes de compra cargadas.</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Numero</th>
                    <th>Producto</th>
                    <th>Proveedor</th>
                    <th>Estado</th>
                    <th>Total</th>
                    <th>Recepcion</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.map((purchaseOrder) => {
                    const daysUntil = getDaysUntil(purchaseOrder.expectedReceiptDate);

                    return (
                      <tr key={purchaseOrder.id}>
                        <td>
                          <span className={styles.number}>{purchaseOrder.number}</span>
                          <span className={styles.secondary}>
                            {purchaseOrder.sourceSalesOrderNumber
                              ? `Origen ${purchaseOrder.sourceSalesOrderNumber}`
                              : "Reposicion general"}
                          </span>
                        </td>
                        <td>
                          <span className={styles.number}>{purchaseOrder.productSku}</span>
                          <span className={styles.secondary}>
                            {purchaseOrder.productName} · {formatQuantity(purchaseOrder.quantity)} u.
                          </span>
                        </td>
                        <td>
                          <span className={styles.number}>{purchaseOrder.vendorName}</span>
                          <span className={styles.secondary}>
                            {purchaseOrder.warehouseName} · {purchaseOrder.buyerName}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`${styles.status} ${statusTone[purchaseOrder.status]}`}
                          >
                            {purchaseOrderStatusLabels[purchaseOrder.status]}
                          </span>
                        </td>
                        <td>
                          <span className={styles.money}>
                            {formatMoney(
                              purchaseOrder.totalAmount,
                              purchaseOrder.currency,
                            )}
                          </span>
                          <span className={styles.secondary}>
                            {formatMoney(
                              purchaseOrder.unitCost,
                              purchaseOrder.currency,
                            )} por unidad
                          </span>
                        </td>
                        <td>
                          <span className={styles.number}>
                            {formatDate(purchaseOrder.expectedReceiptDate)}
                          </span>
                          <span className={styles.secondary}>
                            {daysUntil > 0
                              ? `Llega en ${daysUntil} dias`
                              : daysUntil === 0
                                ? "Llega hoy"
                                : "Fecha vencida"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <p className={styles.note}>
            Esta tabla va a ser la base para la futura recepcion de compras y el
            impacto automatico sobre stock fisico.
          </p>

          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Senales de reposicion</h2>
              <p className={styles.panelText}>
                Productos con disponibilidad baja o nula segun el stock actual,
                priorizados para transformarse en nuevas ordenes de compra.
              </p>
            </div>
            <span className={styles.stack}>Reorder hints</span>
          </div>

          <div className={styles.tableWrap}>
            {replenishmentSuggestions.length === 0 ? (
              <div className={styles.empty}>No hay senales de reposicion por ahora.</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Deposito</th>
                    <th>Disponible</th>
                    <th>Reservado</th>
                    <th>Sugerido</th>
                    <th>Proveedor</th>
                  </tr>
                </thead>
                <tbody>
                  {replenishmentSuggestions.slice(0, 8).map((suggestion) => (
                    <tr key={suggestion.key}>
                      <td>
                        <span className={styles.number}>{suggestion.sku}</span>
                        <span className={styles.secondary}>{suggestion.productName}</span>
                      </td>
                      <td>
                        <span className={styles.number}>{suggestion.warehouseName}</span>
                      </td>
                      <td>
                        <span
                          className={`${styles.status} ${
                            suggestion.availableQuantity <= 0
                              ? styles.statusRejected
                              : styles.statusSent
                          }`}
                        >
                          {formatQuantity(suggestion.availableQuantity)}
                        </span>
                      </td>
                      <td>
                        <span className={styles.number}>
                          {formatQuantity(suggestion.reservedQuantity)}
                        </span>
                      </td>
                      <td>
                        <span className={styles.number}>
                          {formatQuantity(suggestion.suggestedQuantity)} u.
                        </span>
                      </td>
                      <td>
                        <span className={styles.number}>{suggestion.preferredVendor}</span>
                        <span className={styles.secondary}>
                          Lead time {suggestion.leadTimeDays} dias
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
