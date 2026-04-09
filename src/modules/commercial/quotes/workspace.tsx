"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ModuleNav } from "@/components/module-nav";
import styles from "@/components/module-shell.module.css";
import { SubmitButton } from "@/components/submit-button";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { getSupabaseActionMessage } from "@/lib/supabase/error-message";
import {
  createSupabaseQuote,
  getQuotesDashboard,
  listSupabaseQuotes,
} from "@/modules/commercial/quotes/repository";
import type {
  CurrencyCode,
  Quote,
  QuoteFieldName,
  QuoteStatus,
} from "@/modules/commercial/quotes/types";
import {
  solutionTypeLabels,
  statusLabels,
} from "@/modules/commercial/quotes/types";
import { validateCreateQuoteInput } from "@/modules/commercial/quotes/validation";
import {
  getSeedCustomers,
  listSupabaseCustomers,
} from "@/modules/masters/customers/repository";
import { CustomersWorkspace } from "@/modules/masters/customers/workspace";

type QuotesWorkspaceProps = {
  initialQuotes: Quote[];
};

type FormState = {
  customerId: string;
  customerName: string;
  customerTaxId: string;
  solutionType: string;
  sellerName: string;
  currency: string;
  totalAmount: string;
  validUntil: string;
  notes: string;
};

type FeedbackState =
  | {
      type: "success" | "error";
      message: string;
    }
  | null;

const defaultFormState: FormState = {
  customerId: "",
  customerName: "",
  customerTaxId: "",
  solutionType: "",
  sellerName: "",
  currency: "USD",
  totalAmount: "",
  validUntil: "",
  notes: "",
};

const statusClassNames: Record<QuoteStatus, string> = {
  draft: styles.statusDraft,
  sent: styles.statusSent,
  approved: styles.statusApproved,
  rejected: styles.statusRejected,
  expired: styles.statusExpired,
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
    customerId: formState.customerId,
    customerName: formState.customerName,
    customerTaxId: formState.customerTaxId,
    solutionType: formState.solutionType,
    sellerName: formState.sellerName,
    currency: formState.currency,
    totalAmount: formState.totalAmount,
    validUntil: formState.validUntil,
    notes: formState.notes,
  };
}

export function QuotesWorkspace({ initialQuotes }: QuotesWorkspaceProps) {
  const searchParams = useSearchParams();
  const [quotes, setQuotes] = useState(initialQuotes);
  const [customers, setCustomers] = useState(getSeedCustomers());
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [connectionNotice, setConnectionNotice] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<QuoteFieldName, string>>
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
      const [nextQuotes, nextCustomers] = await Promise.all([
        listSupabaseQuotes(supabase),
        listSupabaseCustomers(supabase),
      ]);

      if (isMountedRef.current) {
        setQuotes(nextQuotes);
        setCustomers(nextCustomers);
        setConnectionNotice(null);
      }
    } catch (error) {
      if (isMountedRef.current) {
        setConnectionNotice(getSupabaseActionMessage(error, "quotes-read"));
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

  const dashboard = useMemo(() => getQuotesDashboard(quotes), [quotes]);
  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === formState.customerId) ?? null,
    [customers, formState.customerId],
  );
  const currentModule = searchParams.get("module") ?? "quotes";

  if (currentModule === "customers") {
    return <CustomersWorkspace initialCustomers={getSeedCustomers()} />;
  }

  function handleFieldChange(
    field: keyof FormState,
    value: string,
  ) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));

    const errorField = field as QuoteFieldName;
    if (fieldErrors[errorField]) {
      setFieldErrors((current) => ({
        ...current,
        [errorField]: undefined,
      }));
    }
  }

  function handleCustomerChange(customerId: string) {
    const customer = customers.find((entry) => entry.id === customerId);

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validateCreateQuoteInput(normalizeFormState(formState));

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
      const nextQuote = await createSupabaseQuote(
        getSupabaseBrowserClient(),
        validation.data,
      );

      setQuotes((current) => [nextQuote, ...current]);
      setFormState(defaultFormState);
      setFieldErrors({});
      setFeedback({
        type: "success",
        message: `Presupuesto ${nextQuote.number} creado correctamente para ${nextQuote.customerName}.`,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: getSupabaseActionMessage(error, "quotes-write"),
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
          <span className={styles.eyebrow}>Modulo 01 / Comercial</span>
          <h1 className={styles.heroTitle}>Presupuestos que ordenan toda la operacion</h1>
          <p className={styles.heroText}>
            Esta primera version ya queda deployable en Netlify sin runtime
            server. La carga de presupuestos funciona sobre Supabase y convive
            con el maestro de clientes para empezar a darle forma real al ERP.
          </p>

          <div className={styles.heroCallouts}>
            <div className={styles.callout}>
              <span className={styles.calloutLabel}>Enfoque inicial</span>
              <strong className={styles.calloutValue}>Ventas B2B de tecnologia</strong>
            </div>
            <div className={styles.callout}>
              <span className={styles.calloutLabel}>Persistencia actual</span>
              <strong className={styles.calloutValue}>Supabase en tiempo real</strong>
            </div>
            <div className={styles.callout}>
              <span className={styles.calloutLabel}>Conexion activa</span>
              <strong className={styles.calloutValue}>Cliente maestro vinculado</strong>
            </div>
          </div>
        </article>

        <aside className={styles.sidebarPanel}>
          <div>
            <h2 className={styles.sidebarTitle}>Web lista para mostrar</h2>
            <p className={styles.sidebarText}>
              Esta version queda publica, conectada a Supabase y con el flujo
              comercial listo para seguir creciendo sin depender de datos
              guardados solo en el navegador.
            </p>
          </div>

          <div className={styles.sidebarList}>
            <div className={styles.sidebarItem}>
              <strong>Frontend</strong>
              <span>Next.js exportado como sitio estatico para Netlify</span>
            </div>
            <div className={styles.sidebarItem}>
              <strong>Interaccion</strong>
              <span>Formulario conectado al maestro y persistido en Supabase</span>
            </div>
            <div className={styles.sidebarItem}>
              <strong>Proxima etapa</strong>
              <span>Productos, items de presupuesto y conversion a venta</span>
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
          <span className={styles.metricLabel}>Presupuestos activos</span>
          <strong className={styles.metricValue}>{dashboard.openQuotesCount}</strong>
          <p className={styles.metricHint}>
            Incluye borradores, enviados y aprobados todavia no convertidos a
            venta.
          </p>
        </article>

        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Vencen en 7 dias</span>
          <strong className={styles.metricValue}>{dashboard.expiringThisWeekCount}</strong>
          <p className={styles.metricHint}>
            Este indicador ayuda a priorizar seguimiento comercial inmediato.
          </p>
        </article>

        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Pipeline USD</span>
          <strong className={styles.metricValue}>
            {formatMoney(dashboard.pipelineByCurrency.USD, "USD")}
          </strong>
          <p className={styles.metricHint}>
            Separamos moneda para no mezclar gestion comercial con conversiones
            artificiales.
          </p>
        </article>

        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Pipeline ARS</span>
          <strong className={styles.metricValue}>
            {formatMoney(dashboard.pipelineByCurrency.ARS, "ARS")}
          </strong>
          <p className={styles.metricHint}>
            Valor operativo local listo para futuras reglas de margen e
            impuestos.
          </p>
        </article>
      </section>

      <section className={styles.grid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Nuevo presupuesto</h2>
              <p className={styles.panelText}>
                El presupuesto ahora nace desde un cliente real del maestro.
                Eso evita errores de carga, deja la relacion lista para ventas y
                ordena mejor la base comercial incluso en esta etapa estatica.
              </p>
            </div>
            <span className={styles.stack}>Cliente + Quote link</span>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              <label className={styles.fieldWide}>
                <span className={styles.label}>Cliente maestro</span>
                <select
                  className={styles.select}
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
                    Si el cliente no existe aun, cargalo desde el modulo Maestros / Clientes.
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
                <span className={styles.label}>Vendedor</span>
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
                    Sugerido desde la cuenta: {selectedCustomer.accountManager}
                  </span>
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
                <span className={styles.label}>Total</span>
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
                <span className={styles.label}>Valido hasta</span>
                <input
                  className={styles.input}
                  name="validUntil"
                  onChange={(event) =>
                    handleFieldChange("validUntil", event.target.value)}
                  required
                  type="date"
                  value={formState.validUntil}
                />
                {fieldErrors.validUntil ? (
                  <span className={styles.secondary}>{fieldErrors.validUntil}</span>
                ) : null}
              </label>

              <label className={styles.fieldWide}>
                <span className={styles.label}>Alcance comercial</span>
                <textarea
                  className={styles.textarea}
                  name="notes"
                  onChange={(event) => handleFieldChange("notes", event.target.value)}
                  placeholder="Ejemplo: renovacion de notebooks para 45 usuarios, licencias M365 e instalacion inicial."
                  value={formState.notes}
                />
                {fieldErrors.notes ? (
                  <span className={styles.secondary}>{fieldErrors.notes}</span>
                ) : null}
              </label>
            </div>

            <div className={styles.hintRow}>
              <span>El presupuesto guarda un snapshot del cliente y su referencia maestra.</span>
              <span>
                {isLoading || isRefreshing
                  ? "Sincronizando datos..."
                  : "Guardado real en Supabase."}
              </span>
            </div>

            <SubmitButton pending={isSaving}>Guardar presupuesto</SubmitButton>
          </form>

          <p className={styles.note}>
            {connectionNotice
              ? "El modulo ya esta preparado para Supabase. Cuando corras el SQL en tu proyecto, recarga la pagina y pasara a leer la base real."
              : "Este modulo ahora usa Supabase. Si acabas de correr el SQL, recarga la pagina para ver los datos iniciales ya persistidos."}
          </p>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Presupuestos recientes</h2>
              <p className={styles.panelText}>
                La tabla se actualiza en tiempo real cada vez que agregas un
                presupuesto desde la misma web.
              </p>
            </div>
            <span className={styles.stack}>Demo funcional</span>
          </div>

          <div className={styles.tableWrap}>
            {quotes.length === 0 ? (
              <div className={styles.empty}>Todavia no hay presupuestos cargados.</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Numero</th>
                    <th>Cliente</th>
                    <th>Solucion</th>
                    <th>Responsable</th>
                    <th>Estado</th>
                    <th>Total</th>
                    <th>Vigencia</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((quote) => {
                    const daysUntil = getDaysUntil(quote.validUntil);

                    return (
                      <tr key={quote.id}>
                        <td>
                          <span className={styles.number}>{quote.number}</span>
                          <span className={styles.secondary}>
                            Creado {formatDate(quote.createdAt.slice(0, 10))}
                          </span>
                        </td>
                        <td>
                          <span className={styles.number}>{quote.customerName}</span>
                          <span className={styles.secondary}>{quote.customerTaxId}</span>
                        </td>
                        <td>
                          <span className={styles.number}>
                            {solutionTypeLabels[quote.solutionType]}
                          </span>
                          <span className={styles.secondary}>{quote.notes}</span>
                        </td>
                        <td>
                          <span className={styles.number}>{quote.sellerName}</span>
                        </td>
                        <td>
                          <span
                            className={`${styles.status} ${statusClassNames[quote.status]}`}
                          >
                            {statusLabels[quote.status]}
                          </span>
                        </td>
                        <td>
                          <span className={styles.money}>
                            {formatMoney(quote.totalAmount, quote.currency)}
                          </span>
                          <span className={styles.secondary}>{quote.currency}</span>
                        </td>
                        <td>
                          <span className={styles.number}>{formatDate(quote.validUntil)}</span>
                          <span className={styles.secondary}>
                            {daysUntil > 0
                              ? `Vence en ${daysUntil} dias`
                              : daysUntil === 0
                                ? "Vence hoy"
                                : "Ya vencido"}
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
