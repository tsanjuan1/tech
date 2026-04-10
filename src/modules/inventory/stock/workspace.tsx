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
import {
  createSupabaseInventoryAllocation,
  createSupabaseInventoryMovement,
  getInventoryDashboard,
  getInventorySummaryRows,
  getInventoryTimelineEntries,
  listSupabaseInventoryAllocations,
  listSupabaseInventoryMovements,
} from "@/modules/inventory/stock/repository";
import type {
  InventoryAllocation,
  InventoryAllocationFieldName,
  InventoryMovement,
  InventoryMovementFieldName,
} from "@/modules/inventory/stock/types";
import {
  inventoryAllocationLabels,
  inventoryAllocationTypes,
  inventoryMovementLabels,
  inventoryMovementTypes,
} from "@/modules/inventory/stock/types";
import {
  validateCreateInventoryAllocationInput,
  validateCreateInventoryMovementInput,
} from "@/modules/inventory/stock/validation";
import { productSourcingTypeLabels, type Product } from "@/modules/masters/products/types";
import { listSupabaseProducts } from "@/modules/masters/products/repository";
import type { SalesOrder } from "@/modules/sales/orders/types";
import { listSupabaseSalesOrders } from "@/modules/sales/orders/repository";

type StockWorkspaceProps = {
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

type MovementFormState = {
  productId: string;
  warehouseName: string;
  movementType: string;
  quantity: string;
  referenceNote: string;
};

type AllocationFormState = {
  salesOrderId: string;
  productId: string;
  warehouseName: string;
  allocationType: string;
  quantity: string;
  notes: string;
};

const defaultMovementFormState: MovementFormState = {
  productId: "",
  warehouseName: "Deposito Central",
  movementType: "receipt",
  quantity: "",
  referenceNote: "",
};

const defaultAllocationFormState: AllocationFormState = {
  salesOrderId: "",
  productId: "",
  warehouseName: "Deposito Central",
  allocationType: "reserve",
  quantity: "",
  notes: "",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function getAvailabilityClassName(availableQuantity: number, reservedQuantity: number) {
  if (availableQuantity < 0) {
    return styles.statusRejected;
  }

  if (reservedQuantity > 0) {
    return styles.statusSent;
  }

  return styles.statusApproved;
}

export function StockWorkspace({
  initialProducts,
  initialSalesOrders,
  initialMovements,
  initialAllocations,
}: StockWorkspaceProps) {
  const [products, setProducts] = useState(initialProducts);
  const [salesOrders, setSalesOrders] = useState(initialSalesOrders);
  const [movements, setMovements] = useState(initialMovements);
  const [allocations, setAllocations] = useState(initialAllocations);
  const [movementFormState, setMovementFormState] = useState<MovementFormState>(
    defaultMovementFormState,
  );
  const [allocationFormState, setAllocationFormState] =
    useState<AllocationFormState>(defaultAllocationFormState);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [connectionNotice, setConnectionNotice] = useState<string | null>(null);
  const [movementFieldErrors, setMovementFieldErrors] = useState<
    Partial<Record<InventoryMovementFieldName, string>>
  >({});
  const [allocationFieldErrors, setAllocationFieldErrors] = useState<
    Partial<Record<InventoryAllocationFieldName, string>>
  >({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSavingMovement, setIsSavingMovement] = useState(false);
  const [isSavingAllocation, setIsSavingAllocation] = useState(false);
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

    try {
      const supabase = getSupabaseBrowserClient();
      const [nextProducts, nextOrders, nextMovements, nextAllocations] =
        await Promise.all([
          listSupabaseProducts(supabase),
          listSupabaseSalesOrders(supabase),
          listSupabaseInventoryMovements(supabase),
          listSupabaseInventoryAllocations(supabase),
        ]);

      if (isMountedRef.current) {
        setProducts(nextProducts);
        setSalesOrders(nextOrders);
        setMovements(nextMovements);
        setAllocations(nextAllocations);
        setConnectionNotice(null);
      }
    } catch (error) {
      if (isMountedRef.current) {
        setConnectionNotice(getSupabaseActionMessage(error, "inventory-read"));
      }
    } finally {
      if (isMountedRef.current) {
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
    () => getInventoryDashboard(movements, allocations),
    [movements, allocations],
  );
  const summaryRows = useMemo(
    () => getInventorySummaryRows(products, movements, allocations),
    [products, movements, allocations],
  );
  const timelineEntries = useMemo(
    () =>
      getInventoryTimelineEntries(products, salesOrders, movements, allocations).slice(
        0,
        10,
      ),
    [products, salesOrders, movements, allocations],
  );

  function handleMovementFieldChange(
    field: keyof MovementFormState,
    value: string,
  ) {
    setMovementFormState((current) => ({
      ...current,
      [field]: value,
    }));

    const errorField = field as InventoryMovementFieldName;
    if (movementFieldErrors[errorField]) {
      setMovementFieldErrors((current) => ({
        ...current,
        [errorField]: undefined,
      }));
    }
  }

  function handleAllocationFieldChange(
    field: keyof AllocationFormState,
    value: string,
  ) {
    setAllocationFormState((current) => ({
      ...current,
      [field]: value,
    }));

    const errorField = field as InventoryAllocationFieldName;
    if (allocationFieldErrors[errorField]) {
      setAllocationFieldErrors((current) => ({
        ...current,
        [errorField]: undefined,
      }));
    }
  }

  async function handleMovementSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validateCreateInventoryMovementInput(movementFormState);

    if (!validation.success) {
      setMovementFieldErrors(validation.fieldErrors);
      setFeedback({
        type: "error",
        message: validation.message,
      });
      return;
    }

    setIsSavingMovement(true);

    try {
      const nextMovement = await createSupabaseInventoryMovement(
        getSupabaseBrowserClient(),
        validation.data,
      );

      setMovements((current) => [nextMovement, ...current]);
      setMovementFormState(defaultMovementFormState);
      setMovementFieldErrors({});
      setFeedback({
        type: "success",
        message: `Movimiento registrado para ${validation.data.warehouseName}. El stock fisico ya quedo actualizado en la vista.`,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: getSupabaseActionMessage(error, "inventory-write"),
      });
    } finally {
      setIsSavingMovement(false);
    }
  }

  async function handleAllocationSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validateCreateInventoryAllocationInput(
      allocationFormState,
    );

    if (!validation.success) {
      setAllocationFieldErrors(validation.fieldErrors);
      setFeedback({
        type: "error",
        message: validation.message,
      });
      return;
    }

    setIsSavingAllocation(true);

    try {
      const nextAllocation = await createSupabaseInventoryAllocation(
        getSupabaseBrowserClient(),
        validation.data,
      );

      setAllocations((current) => [nextAllocation, ...current]);
      setAllocationFormState(defaultAllocationFormState);
      setAllocationFieldErrors({});
      setFeedback({
        type: "success",
        message: "Reserva logica registrada correctamente sobre la orden seleccionada.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: getSupabaseActionMessage(error, "inventory-write"),
      });
    } finally {
      setIsSavingAllocation(false);
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
          <span className={styles.eyebrow}>Modulo 05 / Stock</span>
          <h1 className={styles.heroTitle}>Disponibilidad real para vender y entregar mejor</h1>
          <p className={styles.heroText}>
            Este primer modulo de stock separa movimiento fisico y reserva
            logica. Asi podemos saber que hay en deposito, que ya esta
            comprometido por una orden y que todavia sigue disponible para una
            nueva venta sin pisar datos manualmente.
          </p>

          <div className={styles.heroCallouts}>
            <div className={styles.callout}>
              <span className={styles.calloutLabel}>Fisico</span>
              <strong className={styles.calloutValue}>Ingresos, ajustes y despachos</strong>
            </div>
            <div className={styles.callout}>
              <span className={styles.calloutLabel}>Logico</span>
              <strong className={styles.calloutValue}>Reservas ligadas a ordenes</strong>
            </div>
            <div className={styles.callout}>
              <span className={styles.calloutLabel}>Proximo hito</span>
              <strong className={styles.calloutValue}>Compras y reposicion</strong>
            </div>
          </div>
        </article>

        <aside className={styles.sidebarPanel}>
          <div>
            <h2 className={styles.sidebarTitle}>Que cambia con este modulo</h2>
            <p className={styles.sidebarText}>
              Ya no miramos solo catalogo o ventas. Ahora aparece una capa
              operativa que muestra stock fisico, stock reservado y
              disponibilidad por producto y deposito.
            </p>
          </div>

          <div className={styles.sidebarList}>
            <div className={styles.sidebarItem}>
              <strong>Comercial</strong>
              <span>Puede ver si hay disponibilidad antes de comprometer una fecha.</span>
            </div>
            <div className={styles.sidebarItem}>
              <strong>Logistica</strong>
              <span>Registra ingresos y despachos con trazabilidad operativa minima.</span>
            </div>
            <div className={styles.sidebarItem}>
              <strong>Siguiente etapa</strong>
              <span>Cuando sumemos items por orden, la reserva podra dispararse automaticamente.</span>
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
          <span className={styles.metricLabel}>Posiciones activas</span>
          <strong className={styles.metricValue}>{dashboard.trackedPositionsCount}</strong>
          <p className={styles.metricHint}>
            Combinaciones de producto y deposito con actividad fisica o logica.
          </p>
        </article>

        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Stock fisico</span>
          <strong className={styles.metricValue}>{formatQuantity(dashboard.onHandUnits)}</strong>
          <p className={styles.metricHint}>
            Suma de ingresos menos ajustes negativos y despachos registrados.
          </p>
        </article>

        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Stock reservado</span>
          <strong className={styles.metricValue}>
            {formatQuantity(dashboard.reservedUnits)}
          </strong>
          <p className={styles.metricHint}>
            Unidades ya comprometidas por ordenes de venta todavia no liberadas.
          </p>
        </article>

        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Disponible</span>
          <strong className={styles.metricValue}>
            {formatQuantity(dashboard.availableUnits)}
          </strong>
          <p className={styles.metricHint}>
            Referencia inmediata de lo que todavia puede prometerse al cliente.
          </p>
        </article>
      </section>

      <section className={styles.grid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Registrar stock</h2>
              <p className={styles.panelText}>
                Carga movimientos fisicos para ingresos, ajustes y despachos, y
                luego reservas o liberaciones ligadas a ordenes de venta.
              </p>
            </div>
            <span className={styles.stack}>Fisico + Logico</span>
          </div>

          <form className={styles.form} onSubmit={handleMovementSubmit}>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span className={styles.label}>Producto</span>
                <select
                  className={styles.select}
                  onChange={(event) =>
                    handleMovementFieldChange("productId", event.target.value)
                  }
                  value={movementFormState.productId}
                >
                  <option value="">Selecciona un producto</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.sku} · {product.productName}
                    </option>
                  ))}
                </select>
                {movementFieldErrors.productId ? (
                  <span className={styles.secondary}>
                    {movementFieldErrors.productId}
                  </span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Deposito</span>
                <input
                  className={styles.input}
                  onChange={(event) =>
                    handleMovementFieldChange("warehouseName", event.target.value)
                  }
                  placeholder="Deposito Central"
                  type="text"
                  value={movementFormState.warehouseName}
                />
                {movementFieldErrors.warehouseName ? (
                  <span className={styles.secondary}>
                    {movementFieldErrors.warehouseName}
                  </span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Movimiento fisico</span>
                <select
                  className={styles.select}
                  onChange={(event) =>
                    handleMovementFieldChange("movementType", event.target.value)
                  }
                  value={movementFormState.movementType}
                >
                  {inventoryMovementTypes.map((movementType) => (
                    <option key={movementType} value={movementType}>
                      {inventoryMovementLabels[movementType]}
                    </option>
                  ))}
                </select>
                {movementFieldErrors.movementType ? (
                  <span className={styles.secondary}>
                    {movementFieldErrors.movementType}
                  </span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Cantidad</span>
                <input
                  className={styles.input}
                  inputMode="decimal"
                  onChange={(event) =>
                    handleMovementFieldChange("quantity", event.target.value)
                  }
                  placeholder="0"
                  type="text"
                  value={movementFormState.quantity}
                />
                {movementFieldErrors.quantity ? (
                  <span className={styles.secondary}>
                    {movementFieldErrors.quantity}
                  </span>
                ) : null}
              </label>

              <label className={styles.fieldWide}>
                <span className={styles.label}>Referencia</span>
                <textarea
                  className={styles.textarea}
                  onChange={(event) =>
                    handleMovementFieldChange("referenceNote", event.target.value)
                  }
                  placeholder="Ej. recepcion OC-1042, despacho parcial de OV-2026-00001 o ajuste por control interno."
                  value={movementFormState.referenceNote}
                />
                <div className={styles.hintRow}>
                  <span>Este movimiento impacta el stock fisico.</span>
                  <span>{movementFormState.referenceNote.length}/500</span>
                </div>
                {movementFieldErrors.referenceNote ? (
                  <span className={styles.secondary}>
                    {movementFieldErrors.referenceNote}
                  </span>
                ) : null}
              </label>
            </div>

            <SubmitButton pending={isSavingMovement}>Registrar movimiento</SubmitButton>
          </form>

          <p className={styles.note}>
            Despues del movimiento fisico, registra tambien la reserva o
            liberacion logica sobre la orden para que la disponibilidad quede
            consistente.
          </p>

          <form className={styles.form} onSubmit={handleAllocationSubmit}>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span className={styles.label}>Orden de venta</span>
                <select
                  className={styles.select}
                  onChange={(event) =>
                    handleAllocationFieldChange("salesOrderId", event.target.value)
                  }
                  value={allocationFormState.salesOrderId}
                >
                  <option value="">Selecciona una orden</option>
                  {salesOrders.map((salesOrder) => (
                    <option key={salesOrder.id} value={salesOrder.id}>
                      {salesOrder.number} · {salesOrder.customerName}
                    </option>
                  ))}
                </select>
                {allocationFieldErrors.salesOrderId ? (
                  <span className={styles.secondary}>
                    {allocationFieldErrors.salesOrderId}
                  </span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Producto</span>
                <select
                  className={styles.select}
                  onChange={(event) =>
                    handleAllocationFieldChange("productId", event.target.value)
                  }
                  value={allocationFormState.productId}
                >
                  <option value="">Selecciona un producto</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.sku} · {product.productName}
                    </option>
                  ))}
                </select>
                {allocationFieldErrors.productId ? (
                  <span className={styles.secondary}>
                    {allocationFieldErrors.productId}
                  </span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Deposito</span>
                <input
                  className={styles.input}
                  onChange={(event) =>
                    handleAllocationFieldChange("warehouseName", event.target.value)
                  }
                  placeholder="Deposito Central"
                  type="text"
                  value={allocationFormState.warehouseName}
                />
                {allocationFieldErrors.warehouseName ? (
                  <span className={styles.secondary}>
                    {allocationFieldErrors.warehouseName}
                  </span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Operacion logica</span>
                <select
                  className={styles.select}
                  onChange={(event) =>
                    handleAllocationFieldChange("allocationType", event.target.value)
                  }
                  value={allocationFormState.allocationType}
                >
                  {inventoryAllocationTypes.map((allocationType) => (
                    <option key={allocationType} value={allocationType}>
                      {inventoryAllocationLabels[allocationType]}
                    </option>
                  ))}
                </select>
                {allocationFieldErrors.allocationType ? (
                  <span className={styles.secondary}>
                    {allocationFieldErrors.allocationType}
                  </span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Cantidad</span>
                <input
                  className={styles.input}
                  inputMode="decimal"
                  onChange={(event) =>
                    handleAllocationFieldChange("quantity", event.target.value)
                  }
                  placeholder="0"
                  type="text"
                  value={allocationFormState.quantity}
                />
                {allocationFieldErrors.quantity ? (
                  <span className={styles.secondary}>
                    {allocationFieldErrors.quantity}
                  </span>
                ) : null}
              </label>

              <label className={styles.fieldWide}>
                <span className={styles.label}>Observaciones</span>
                <textarea
                  className={styles.textarea}
                  onChange={(event) =>
                    handleAllocationFieldChange("notes", event.target.value)
                  }
                  placeholder="Ej. reserva comercial inicial, liberacion por cambio de configuracion o entrega logica posterior al despacho."
                  value={allocationFormState.notes}
                />
                <div className={styles.hintRow}>
                  <span>Esta operacion impacta el stock logico reservado.</span>
                  <span>{allocationFormState.notes.length}/500</span>
                </div>
                {allocationFieldErrors.notes ? (
                  <span className={styles.secondary}>
                    {allocationFieldErrors.notes}
                  </span>
                ) : null}
              </label>
            </div>

            <SubmitButton pending={isSavingAllocation}>Registrar reserva</SubmitButton>
          </form>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Disponibilidad actual</h2>
              <p className={styles.panelText}>
                Esta vista resume stock fisico, stock reservado y disponible por
                producto y deposito, calculado a partir de eventos registrados.
              </p>
            </div>
            <span className={styles.stack}>Resumen operativo</span>
          </div>

          <div className={styles.tableWrap}>
            {summaryRows.length === 0 ? (
              <div className={styles.empty}>Todavia no hay movimientos ni reservas cargadas.</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Deposito</th>
                    <th>Fisico</th>
                    <th>Reservado</th>
                    <th>Disponible</th>
                    <th>Abastecimiento</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryRows.map((row) => (
                    <tr key={row.key}>
                      <td>
                        <span className={styles.number}>{row.sku}</span>
                        <span className={styles.secondary}>
                          {row.productName} · {row.brandName}
                        </span>
                      </td>
                      <td>
                        <span className={styles.number}>{row.warehouseName}</span>
                        <span className={styles.secondary}>{row.preferredVendor}</span>
                      </td>
                      <td>
                        <span className={styles.number}>
                          {formatQuantity(row.onHandQuantity)}
                        </span>
                      </td>
                      <td>
                        <span className={styles.number}>
                          {formatQuantity(row.reservedQuantity)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`${styles.status} ${getAvailabilityClassName(
                            row.availableQuantity,
                            row.reservedQuantity,
                          )}`}
                        >
                          {formatQuantity(row.availableQuantity)}
                        </span>
                      </td>
                      <td>
                        <span className={styles.number}>
                          {productSourcingTypeLabels[row.sourcingType]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <p className={styles.note}>
            Para reflejar una entrega completa, combina `Despacho` en stock
            fisico con `Entrega logica` en reservas.
          </p>

          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Actividad reciente</h2>
              <p className={styles.panelText}>
                Timeline unico de eventos fisicos y logicos para seguir la
                trazabilidad operativa sin salir del modulo.
              </p>
            </div>
            <span className={styles.stack}>Bitacora</span>
          </div>

          <div className={styles.tableWrap}>
            {timelineEntries.length === 0 ? (
              <div className={styles.empty}>Todavia no hay actividad para mostrar.</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Producto</th>
                    <th>Deposito</th>
                    <th>Cantidad</th>
                    <th>Referencia</th>
                  </tr>
                </thead>
                <tbody>
                  {timelineEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td>
                        <span className={styles.number}>{formatDate(entry.createdAt)}</span>
                      </td>
                      <td>
                        <span
                          className={`${styles.status} ${
                            entry.kind === "movement"
                              ? styles.statusApproved
                              : styles.statusSent
                          }`}
                        >
                          {entry.label}
                        </span>
                      </td>
                      <td>
                        <span className={styles.number}>{entry.productSku}</span>
                        <span className={styles.secondary}>{entry.productName}</span>
                      </td>
                      <td>
                        <span className={styles.number}>{entry.warehouseName}</span>
                      </td>
                      <td>
                        <span className={styles.number}>{formatQuantity(entry.quantity)}</span>
                      </td>
                      <td>
                        <span className={styles.secondary}>{entry.referenceText}</span>
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
