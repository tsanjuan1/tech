"use client";

import { useEffect, useMemo, useState } from "react";
import { SubmitButton } from "@/components/submit-button";
import {
  createBrowserQuote,
  getQuotesDashboard,
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
import styles from "@/app/comercial/presupuestos/page.module.css";

type QuotesWorkspaceProps = {
  initialQuotes: Quote[];
};

type FormState = {
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

const storageKey = "b2b-tech-erp:quotes";

const defaultFormState: FormState = {
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
  const [quotes, setQuotes] = useState(initialQuotes);
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<QuoteFieldName, string>>
  >({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedQuotes = window.localStorage.getItem(storageKey);

      if (storedQuotes) {
        const parsedQuotes = JSON.parse(storedQuotes) as Quote[];
        if (Array.isArray(parsedQuotes) && parsedQuotes.length > 0) {
          setQuotes(parsedQuotes);
        }
      }
    } catch {
      setFeedback({
        type: "error",
        message:
          "No se pudo leer el historial local del navegador. Se cargaron los datos base.",
      });
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(quotes));
  }, [hydrated, quotes]);

  const dashboard = useMemo(() => getQuotesDashboard(quotes), [quotes]);

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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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

    const nextQuote = createBrowserQuote(validation.data, quotes);
    setQuotes((current) => [nextQuote, ...current]);
    setFormState(defaultFormState);
    setFieldErrors({});
    setFeedback({
      type: "success",
      message: `Presupuesto ${nextQuote.number} creado correctamente para ${nextQuote.customerName}.`,
    });
  }

  return (
    <main className={styles.shell}>
      <section className={styles.hero}>
        <article className={styles.heroPanel}>
          <span className={styles.eyebrow}>Modulo 01 / Comercial</span>
          <h1 className={styles.heroTitle}>Presupuestos que ordenan toda la operacion</h1>
          <p className={styles.heroText}>
            Esta primera version ya queda deployable en Netlify sin runtime
            server. La carga de presupuestos funciona en el navegador y deja la
            experiencia lista para pasar luego a backend real con base de datos.
          </p>

          <div className={styles.heroCallouts}>
            <div className={styles.callout}>
              <span className={styles.calloutLabel}>Enfoque inicial</span>
              <strong className={styles.calloutValue}>Ventas B2B de tecnologia</strong>
            </div>
            <div className={styles.callout}>
              <span className={styles.calloutLabel}>Persistencia actual</span>
              <strong className={styles.calloutValue}>Local del navegador</strong>
            </div>
            <div className={styles.callout}>
              <span className={styles.calloutLabel}>Siguiente hito</span>
              <strong className={styles.calloutValue}>Backend y orden de venta</strong>
            </div>
          </div>
        </article>

        <aside className={styles.sidebarPanel}>
          <div>
            <h2 className={styles.sidebarTitle}>Web lista para mostrar</h2>
            <p className={styles.sidebarText}>
              Esta version queda publica y sin 404. Mantiene la interfaz, el
              flujo de alta y las metricas del modulo mientras preparamos la
              etapa con base de datos y servicios reales.
            </p>
          </div>

          <div className={styles.sidebarList}>
            <div className={styles.sidebarItem}>
              <strong>Frontend</strong>
              <span>Next.js exportado como sitio estatico para Netlify</span>
            </div>
            <div className={styles.sidebarItem}>
              <strong>Interaccion</strong>
              <span>Formulario funcional con validacion y guardado local</span>
            </div>
            <div className={styles.sidebarItem}>
              <strong>Proxima etapa</strong>
              <span>PostgreSQL, auth por roles, stock y facturacion ARCA</span>
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
                La carga funciona desde el navegador y se guarda en este mismo
                equipo. Es ideal para demo, prueba operativa y validacion de
                flujo antes de conectar backend definitivo.
              </p>
            </div>
            <span className={styles.stack}>Cliente + Storage</span>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span className={styles.label}>Cliente</span>
                <input
                  className={styles.input}
                  name="customerName"
                  onChange={(event) =>
                    handleFieldChange("customerName", event.target.value)}
                  placeholder="Empresa cliente"
                  required
                  type="text"
                  value={formState.customerName}
                />
                {fieldErrors.customerName ? (
                  <span className={styles.secondary}>{fieldErrors.customerName}</span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>CUIT</span>
                <input
                  className={styles.input}
                  name="customerTaxId"
                  onChange={(event) =>
                    handleFieldChange("customerTaxId", event.target.value)}
                  placeholder="30XXXXXXXXX"
                  required
                  type="text"
                  value={formState.customerTaxId}
                />
                {fieldErrors.customerTaxId ? (
                  <span className={styles.secondary}>{fieldErrors.customerTaxId}</span>
                ) : null}
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
              <span>Los datos se guardan localmente en este navegador.</span>
              <span>Perfecto para demo y validacion operativa inicial.</span>
            </div>

            <SubmitButton>Guardar presupuesto</SubmitButton>
          </form>

          <p className={styles.note}>
            Esta version reemplaza temporalmente la API server para asegurar un
            deploy estable en Netlify sin errores ni rutas rotas.
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
