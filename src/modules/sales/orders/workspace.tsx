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
import type {
  CurrencyCode,
  Quote,
} from "@/modules/commercial/quotes/types";
import { solutionTypeLabels } from "@/modules/commercial/quotes/types";
import {
  listSupabaseCustomers,
} from "@/modules/masters/customers/repository";
import type { Customer } from "@/modules/masters/customers/types";
import {
  createSupabaseSalesOrder,
  getSalesOrdersDashboard,
  listSupabaseSalesOrders,
} from "@/modules/sales/orders/repository";
import type {
  SalesOrder,
  SalesOrderFieldName,
  SalesOrderStatus,
} from "@/modules/sales/orders/types";
import { salesOrderStatusLabels } from "@/modules/sales/orders/types";
import { validateCreateSalesOrderInput } from "@/modules/sales/orders/validation";
import { listSupabaseQuotes } from "@/modules/commercial/quotes/repository";

type SalesOrdersWorkspaceProps = {
  initialOrders: SalesOrder[];
  initialCustomers: Customer[];
  initialQuotes: Quote[];
};

type FormState = {
  quoteId: string;
  customerId: string;
  customerName: string;
  customerTaxId: string;
  solutionType: string;
  sellerName: string;
  status: string;
  currency: string;
  totalAmount: string;
  requestedDeliveryDate: string;
  notes: string;
};

type FeedbackState =
  | {
      type: "success" | "error";
      message: string;
    }
  | null;

const defaultFormState: FormState = {
  quoteId: "",
  customerId: "",
  customerName: "",
  customerTaxId: "",
  solutionType: "",
  sellerName: "",
  status: "entered",
  currency: "USD",
  totalAmount: "",
  requestedDeliveryDate: "",
  notes: "",
};

const orderStatusClassNames: Record<SalesOrderStatus, string> = {
  entered: styles.statusDraft,
  "credit-check": styles.statusSent,
  "ready-fulfillment": styles.statusApproved,
  "partial-delivery": styles.statusSent,
  delivered: styles.statusApproved,
  "on-hold": styles.statusRejected,
};

const currencyLabels: Record<CurrencyCode, string> = {
  ARS: "ARS",
  USD: "USD",
};

function formatMoney(amount: number, currency: CurrencyCode) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
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

function normalizeFormState(formState: FormState) {
  return {
    quoteId: formState.quoteId,
    customerId: formState.customerId,
    customerName: formState.customerName,
    customerTaxId: formState.customerTaxId,
    solutionType: formState.solutionType,
    sellerName: formState.sellerName,
    status: formState.status,
    currency: formState.currency,
    totalAmount: formState.totalAmount,
    requestedDeliveryDate: formState.requestedDeliveryDate,
    notes: formState.notes,
  };
}

export function SalesOrdersWorkspace({
  initialOrders,
  initialCustomers,
  initialQuotes,
}: SalesOrdersWorkspaceProps) {
  const [salesOrders, setSalesOrders] = useState(initialOrders);
  const [customers, setCustomers] = useState(initialCustomers);
  const [quotes, setQuotes] = useState(initialQuotes);
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [connectionNotice, setConnectionNotice] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<SalesOrderFieldName, string>>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isMountedRef = useRef(true);

  async function loadWorkspace() {
    if (!isSupabaseConfigured()) {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
        setConnectionNotice(
          "Supabase no esta configurado todavia. La app queda mostrando los datos base para que puedas seguir navegando.",
        );
      }

      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();
      const [nextOrders, nextCustomers, nextQuotes] = await Promise.all([
        listSupabaseSalesOrders(supabase),
        listSupabaseCustomers(supabase),
        listSupabaseQuotes(supabase),
      ]);

      if (isMountedRef.current) {
        setSalesOrders(nextOrders);
        setCustomers(nextCustomers);
        setQuotes(nextQuotes);
        setConnectionNotice(null);
      }
    } catch (error) {
      if (isMountedRef.current) {
        setConnectionNotice(getSupabaseActionMessage(error, "sales-orders-read"));
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }

  useEffect(() => {
    isMountedRef.current = true;
    void loadWorkspace();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const dashboard = useMemo(
    () => getSalesOrdersDashboard(salesOrders),
    [salesOrders],
  );
  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === formState.customerId) ?? null,
    [customers, formState.customerId],
  );
  const eligibleQuotes = useMemo(
    () =>
      quotes.filter(
        (quote) => quote.status === "approved" || quote.status === "sent",
      ),
    [quotes],
  );
  const selectedQuote = useMemo(
    () => eligibleQuotes.find((quote) => quote.id === formState.quoteId) ?? null,
    [eligibleQuotes, formState.quoteId],
  );

  function handleFieldChange(field: keyof FormState, value: string) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));

    const errorField = field as SalesOrderFieldName;
    if (fieldErrors[errorField]) {
      setFieldErrors((current) => ({
        ...current,
        [errorField]: undefined,
      }));
    }
  }

  function handleCustomerChange(customerId: string) {
    const customer = customers.find((entry) => entry.id === customerId) ?? null;

    setFormState((current) => ({
      ...current,
      customerId,
      customerName: customer?.businessName ?? "",
      customerTaxId: customer?.taxId ?? "",
      sellerName: customer?.accountManager ?? current.sellerName,
    }));

    setFieldErrors((current) => ({
      ...current,
      customerId: undefined,
      customerName: undefined,
      customerTaxId: undefined,
    }));
  }

  function handleQuoteChange(quoteId: string) {
    const quote = eligibleQuotes.find((entry) => entry.id === quoteId) ?? null;

    if (!quote) {
      setFormState((current) => ({
        ...current,
        quoteId: "",
      }));
      return;
    }

    setFormState((current) => ({
      ...current,
      quoteId,
      customerId: quote.customerId ?? current.customerId,
      customerName: quote.customerName,
      customerTaxId: quote.customerTaxId,
      sellerName: quote.sellerName,
      solutionType: quote.solutionType,
      currency: quote.currency,
      totalAmount: String(quote.totalAmount),
      notes: quote.notes,
    }));

    setFieldErrors((current) => ({
      ...current,
      quoteId: undefined,
      customerId: undefined,
      customerName: undefined,
      customerTaxId: undefined,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validateCreateSalesOrderInput(normalizeFormState(formState));

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
      const nextSalesOrder = await createSupabaseSalesOrder(
        getSupabaseBrowserClient(),
        validation.data,
      );

      setSalesOrders((current) => [nextSalesOrder, ...current]);
      setFormState(defaultFormState);
      setFieldErrors({});
      setFeedback({
        type: "success",
        message: `Orden ${nextSalesOrder.number} creada correctamente para ${nextSalesOrder.customerName}.`,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: getSupabaseActionMessage(error, "sales-orders-write"),
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
          <span className={styles.eyebrow}>Modulo 03 / Ventas</span>
          <h1 className={styles.heroTitle}>Ordenes de venta que activan la operacion</h1>
          <p className={styles.heroText}>
            Este modulo convierte el cierre comercial en una orden ejecutable.
            Desde aca quedan definidos cliente, presupuesto origen, estado
            operativo, fecha comprometida y monto listo para pasar a stock,
            logistica y administracion.
          </p>

          <div className={styles.heroCallouts}>
            <div className={styles.callout}>
              <span className={styles.calloutLabel}>Origen</span>
              <strong className={styles.calloutValue}>Presupuesto o carga manual</strong>
            </div>
            <div className={styles.callout}>
              <span className={styles.calloutLabel}>Persistencia actual</span>
              <strong className={styles.calloutValue}>Supabase en tiempo real</strong>
            </div>
            <div className={styles.callout}>
              <span className={styles.calloutLabel}>Siguiente hito</span>
              <strong className={styles.calloutValue}>Stock y entregas</strong>
            </div>
          </div>
        </article>

        <aside className={styles.sidebarPanel}>
          <div>
            <h2 className={styles.sidebarTitle}>Que resuelve ahora</h2>
            <p className={styles.sidebarText}>
              La orden de venta deja de ser una charla informal y pasa a tener
              trazabilidad concreta. Eso permite coordinar preparacion,
              validacion crediticia, entrega y futura facturacion con una sola
              referencia operativa.
            </p>
          </div>

          <div className={styles.sidebarList}>
            <div className={styles.sidebarItem}>
              <strong>Comercial</strong>
              <span>Convierte presupuestos cerrados en operaciones ejecutables.</span>
            </div>
            <div className={styles.sidebarItem}>
              <strong>Logistica</strong>
              <span>Prepara fecha prometida, estado y origen documental.</span>
            </div>
            <div className={styles.sidebarItem}>
              <strong>Administracion</strong>
              <span>Base lista para futuras reservas, remitos y facturacion.</span>
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

      <section className={styles.metrics}>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Ordenes abiertas</span>
          <strong className={styles.metricValue}>{dashboard.openOrdersCount}</strong>
          <p className={styles.metricHint}>
            Incluye ordenes ingresadas, listas para preparar, parciales o en espera.
          </p>
        </article>

        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Entregas en 7 dias</span>
          <strong className={styles.metricValue}>{dashboard.dueThisWeekCount}</strong>
          <p className={styles.metricHint}>
            Ayuda a anticipar preparacion, coordinacion y seguimiento con el cliente.
          </p>
        </article>

        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>En espera</span>
          <strong className={styles.metricValue}>{dashboard.onHoldCount}</strong>
          <p className={styles.metricHint}>
            Visibilidad para creditos, faltantes o aprobaciones pendientes.
          </p>
        </article>

        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Comprometido USD</span>
          <strong className={styles.metricValue}>
            {formatMoney(dashboard.committedByCurrency.USD, "USD")}
          </strong>
          <p className={styles.metricHint}>
            Monto abierto comprometido a ejecutar y entregar.
          </p>
        </article>
      </section>

      <section className={styles.grid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Nueva orden de venta</h2>
              <p className={styles.panelText}>
                Puedes cargarla manualmente o derivarla desde un presupuesto
                enviado o aprobado. La orden toma cliente, responsable, solucion
                y monto para dejarla lista para operacion.
              </p>
            </div>
            <span className={styles.stack}>Quote to Order</span>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              <label className={styles.fieldWide}>
                <span className={styles.label}>Presupuesto origen</span>
                <select
                  className={styles.select}
                  name="quoteId"
                  onChange={(event) => handleQuoteChange(event.target.value)}
                  value={formState.quoteId}
                >
                  <option value="">Carga manual / sin presupuesto</option>
                  {eligibleQuotes.map((quote) => (
                    <option key={quote.id} value={quote.id}>
                      {quote.number} - {quote.customerName}
                    </option>
                  ))}
                </select>
                <span className={styles.secondary}>
                  {selectedQuote
                    ? `La orden quedara vinculada a ${selectedQuote.number} y tomara sus datos base.`
                    : "Si seleccionas un presupuesto, cliente, vendedor y total se completan automaticamente."}
                </span>
              </label>

              <label className={styles.fieldWide}>
                <span className={styles.label}>Cliente maestro</span>
                <select
                  className={styles.select}
                  disabled={Boolean(selectedQuote)}
                  name="customerId"
                  onChange={(event) => handleCustomerChange(event.target.value)}
                  required
                  value={formState.customerId}
                >
                  <option disabled value="">
                    Seleccionar cliente
                  </option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.code} - {customer.businessName}
                    </option>
                  ))}
                </select>
                {fieldErrors.customerId || fieldErrors.customerName || fieldErrors.customerTaxId ? (
                  <span className={styles.secondary}>
                    {fieldErrors.customerId ??
                      fieldErrors.customerName ??
                      fieldErrors.customerTaxId}
                  </span>
                ) : (
                  <span className={styles.secondary}>
                    {selectedQuote
                      ? "El cliente queda bloqueado porque esta orden deriva de un presupuesto existente."
                      : "Si el cliente no existe aun, cargalo desde Maestros / Clientes."}
                  </span>
                )}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Razon social vinculada</span>
                <input
                  className={styles.input}
                  name="customerName"
                  placeholder="Selecciona un cliente"
                  readOnly
                  type="text"
                  value={formState.customerName}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>CUIT vinculado</span>
                <input
                  className={styles.input}
                  name="customerTaxId"
                  placeholder="Selecciona un cliente"
                  readOnly
                  type="text"
                  value={formState.customerTaxId}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Tipo de solucion</span>
                <select
                  className={styles.select}
                  name="solutionType"
                  onChange={(event) =>
                    handleFieldChange("solutionType", event.target.value)}
                  required
                  value={formState.solutionType}
                >
                  <option disabled value="">
                    Seleccionar
                  </option>
                  {Object.entries(solutionTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                {fieldErrors.solutionType ? (
                  <span className={styles.secondary}>{fieldErrors.solutionType}</span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Responsable</span>
                <input
                  className={styles.input}
                  name="sellerName"
                  onChange={(event) =>
                    handleFieldChange("sellerName", event.target.value)}
                  placeholder="Responsable comercial"
                  required
                  type="text"
                  value={formState.sellerName}
                />
                {fieldErrors.sellerName ? (
                  <span className={styles.secondary}>{fieldErrors.sellerName}</span>
                ) : selectedCustomer ? (
                  <span className={styles.secondary}>
                    Cuenta asignada a {selectedCustomer.accountManager} con pago a{" "}
                    {selectedCustomer.paymentTermDays} dias.
                  </span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Estado operativo</span>
                <select
                  className={styles.select}
                  name="status"
                  onChange={(event) => handleFieldChange("status", event.target.value)}
                  required
                  value={formState.status}
                >
                  {Object.entries(salesOrderStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
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
                  name="currency"
                  onChange={(event) =>
                    handleFieldChange("currency", event.target.value)}
                  required
                  value={formState.currency}
                >
                  {Object.entries(currencyLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Total comprometido</span>
                <input
                  className={styles.input}
                  min="0"
                  name="totalAmount"
                  onChange={(event) =>
                    handleFieldChange("totalAmount", event.target.value)}
                  placeholder="0"
                  required
                  step="0.01"
                  type="number"
                  value={formState.totalAmount}
                />
                {fieldErrors.totalAmount ? (
                  <span className={styles.secondary}>{fieldErrors.totalAmount}</span>
                ) : null}
              </label>

              <label className={styles.fieldWide}>
                <span className={styles.label}>Fecha comprometida</span>
                <input
                  className={styles.input}
                  name="requestedDeliveryDate"
                  onChange={(event) =>
                    handleFieldChange("requestedDeliveryDate", event.target.value)}
                  required
                  type="date"
                  value={formState.requestedDeliveryDate}
                />
                {fieldErrors.requestedDeliveryDate ? (
                  <span className={styles.secondary}>
                    {fieldErrors.requestedDeliveryDate}
                  </span>
                ) : null}
              </label>

              <label className={styles.fieldWide}>
                <span className={styles.label}>Observaciones operativas</span>
                <textarea
                  className={styles.textarea}
                  name="notes"
                  onChange={(event) => handleFieldChange("notes", event.target.value)}
                  placeholder="Ejemplo: coordinar entrega parcial, validar disponible antes de liberar y avisar a administracion para anticipo."
                  value={formState.notes}
                />
                {fieldErrors.notes ? (
                  <span className={styles.secondary}>{fieldErrors.notes}</span>
                ) : null}
              </label>
            </div>

            <div className={styles.hintRow}>
              <span>
                La orden guarda el cliente final y opcionalmente la referencia al presupuesto origen.
              </span>
              <span>
                {isLoading || isRefreshing
                  ? "Sincronizando datos..."
                  : "Guardado real en Supabase."}
              </span>
            </div>

            <SubmitButton pending={isSaving}>Guardar orden de venta</SubmitButton>
          </form>

          <p className={styles.note}>
            {connectionNotice
              ? "El modulo ya esta preparado para Supabase. Cuando corras la migracion de ordenes, recarga o toca Reintentar conexion para empezar a usar la base real."
              : "Este modulo ya usa Supabase. Si acabas de correr la migracion nueva, recarga la pagina para ver las ordenes base persistidas."}
          </p>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Ordenes recientes</h2>
              <p className={styles.panelText}>
                Vista operativa para seguir el estado de ejecucion, detectar bloqueos
                y dejar trazada la relacion entre venta, cliente y compromiso de entrega.
              </p>
            </div>
            <span className={styles.stack}>Operacion viva</span>
          </div>

          <div className={styles.tableWrap}>
            {salesOrders.length === 0 ? (
              <div className={styles.empty}>Todavia no hay ordenes cargadas.</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Orden</th>
                    <th>Cliente</th>
                    <th>Origen</th>
                    <th>Responsable</th>
                    <th>Estado</th>
                    <th>Total</th>
                    <th>Entrega</th>
                  </tr>
                </thead>
                <tbody>
                  {salesOrders.map((salesOrder) => {
                    const daysUntil = getDaysUntil(salesOrder.requestedDeliveryDate);

                    return (
                      <tr key={salesOrder.id}>
                        <td>
                          <span className={styles.number}>{salesOrder.number}</span>
                          <span className={styles.secondary}>
                            Alta {formatDate(salesOrder.createdAt.slice(0, 10))}
                          </span>
                        </td>
                        <td>
                          <span className={styles.number}>{salesOrder.customerName}</span>
                          <span className={styles.secondary}>{salesOrder.customerTaxId}</span>
                        </td>
                        <td>
                          <span className={styles.number}>
                            {salesOrder.sourceQuoteNumber ?? "Carga manual"}
                          </span>
                          <span className={styles.secondary}>
                            {solutionTypeLabels[salesOrder.solutionType]}
                          </span>
                        </td>
                        <td>
                          <span className={styles.number}>{salesOrder.sellerName}</span>
                          <span className={styles.secondary}>{salesOrder.notes}</span>
                        </td>
                        <td>
                          <span
                            className={`${styles.status} ${orderStatusClassNames[salesOrder.status]}`}
                          >
                            {salesOrderStatusLabels[salesOrder.status]}
                          </span>
                        </td>
                        <td>
                          <span className={styles.money}>
                            {formatMoney(salesOrder.totalAmount, salesOrder.currency)}
                          </span>
                          <span className={styles.secondary}>{salesOrder.currency}</span>
                        </td>
                        <td>
                          <span className={styles.number}>
                            {formatDate(salesOrder.requestedDeliveryDate)}
                          </span>
                          <span className={styles.secondary}>
                            {daysUntil > 0
                              ? `Compromiso en ${daysUntil} dias`
                              : daysUntil === 0
                                ? "Compromiso hoy"
                                : "Fecha ya vencida"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
