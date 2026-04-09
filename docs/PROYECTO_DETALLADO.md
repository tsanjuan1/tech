# B2B Tech ERP - Documento Maestro Del Proyecto

## 1. Resumen ejecutivo

Este proyecto busca construir un ERP B2B para una Pyme argentina que vende tecnologia a otras empresas. La meta no es solamente tener pantallas, sino un sistema unico que conecte comercial, compras, stock, logistica, administracion, servicio tecnico, finanzas, impuestos y contabilidad.

El proyecto ya tiene una primera base funcional publicada en Netlify. El modulo inicial es `Comercial / Presupuestos`, porque es el punto donde nace la operacion y desde donde luego se encadenan ventas, compras, stock, facturacion y cobranzas.

La version actual fue adaptada para deploy estatico y hoy funciona como demo operativa real: permite cargar presupuestos desde la web, validar datos, mostrar pipeline y guardar informacion en el navegador local. La siguiente etapa es pasar esa base a persistencia real con PostgreSQL y empezar a construir los maestros y la conversion a orden de venta.

---

## 2. Objetivo del negocio

La solucion debe servir a una empresa que quiere escalar su operacion hasta un volumen cercano a USD 1.000.000 por mes, con trazabilidad completa de punta a punta.

Objetivos principales:

- centralizar informacion de todos los sectores
- eliminar planillas y dobles cargas
- tener trazabilidad completa de cada operacion
- medir margen, conversion, stock y cobranzas
- profesionalizar la operacion y dejarla lista para escalar
- construir una base mantenible, segura y confiable

---

## 3. Estado actual del proyecto

Estado al 2026-04-07:

- repositorio GitHub: `tsanjuan1/tech`
- hosting: Netlify
- sitio publicado: `https://jovial-babka-6134d6.netlify.app`
- rutas funcionales actuales:
  - `https://jovial-babka-6134d6.netlify.app/comercial/presupuestos/`
  - `https://jovial-babka-6134d6.netlify.app/maestros/clientes/`
- stack actual: `Next.js 16 + React 19 + TypeScript`
- modalidad actual de despliegue: sitio estatico exportado

Estado funcional actual:

- existe un modulo inicial de presupuestos
- existe un segundo modulo funcional de maestros de clientes
- la pantalla principal y la ruta `/comercial/presupuestos/` muestran el workspace comercial
- la ruta `/maestros/clientes/` muestra el maestro inicial de clientes
- la carga de presupuestos funciona del lado cliente
- la carga de clientes funciona del lado cliente
- los datos se validan antes de guardarse
- los datos se guardan en `localStorage` por modulo
- existen presupuestos semilla para la demo inicial
- existen clientes semilla para la demo inicial
- se muestran metricas comerciales basicas
- se muestran metricas base del maestro de clientes
- no hay backend productivo ni base de datos todavia
- no hay autenticacion ni permisos por rol todavia

Motivo del enfoque actual:

- Netlify estaba devolviendo errores con el enfoque server inicial
- se priorizo una web estable, visible y funcional
- por eso la primera entrega se paso a export estatico

---

## 4. Alcance funcional objetivo del ERP completo

### 4.1 Core maestro

El sistema completo debe tener una capa central de datos maestros compartidos por todos los modulos:

- clientes
- proveedores
- contactos
- usuarios
- roles y permisos
- productos
- categorias
- marcas
- listas de precios
- monedas
- impuestos
- bancos
- depositos
- ubicaciones
- sucursales
- centros de costo

### 4.2 Modulo comercial

Debe permitir:

- cargar presupuestos
- versionar presupuestos
- aprobar descuentos y margen
- registrar vendedor responsable
- registrar tipo de solucion
- controlar vigencia
- medir pipeline
- convertir presupuesto a orden de venta

### 4.3 Modulo ventas

Debe permitir:

- crear ordenes de venta
- reservar stock
- controlar disponibilidad
- gestionar entregas parciales
- manejar backorders
- emitir remitos
- preparar facturacion

### 4.4 Modulo compras

Debe permitir:

- solicitudes internas de compra
- comparativa de proveedores
- ordenes de compra
- recepciones parciales
- mercaderia en transito
- costos de adquisicion
- fechas prometidas y demoras

### 4.5 Modulo stock

Debe contemplar:

- stock fisico
- stock logico
- stock disponible
- stock reservado
- stock dañado
- stock en reparacion
- stock demo
- stock consignado
- transferencias internas
- ajustes
- conteos
- movimientos por serie y lote

### 4.6 Modulo logistica

Debe permitir:

- picking
- packing
- remitos
- control de salida
- hoja de ruta
- seguimiento de entrega
- prueba de entrega
- instalaciones en cliente

### 4.7 Modulo facturacion

Debe permitir:

- facturas
- notas de credito
- notas de debito
- recibos asociados
- comprobantes por punto de venta
- integracion futura con ARCA
- manejo de moneda local y extranjera

### 4.8 Modulo finanzas y tesoreria

Debe permitir:

- cuentas corrientes clientes
- cuentas corrientes proveedores
- cobranzas
- pagos
- anticipos
- bancos
- conciliaciones
- flujo de fondos
- recibos

### 4.9 Modulo impuestos y contabilidad

Debe permitir:

- IVA compras
- IVA ventas
- percepciones
- retenciones
- asientos automaticos
- plan de cuentas
- cierre mensual
- reportes para estudio contable

### 4.10 Modulo servicio tecnico y RMA

Debe permitir:

- ingreso de equipos
- diagnostico
- presupuesto de reparacion
- aprobacion del cliente
- consumo de repuestos
- garantias
- seguimiento por numero de serie

### 4.11 Modulo armado de soluciones

Debe permitir:

- configuracion de soluciones
- armado de computadoras
- definicion de componentes
- mano de obra
- checklist tecnico
- entrega con documentacion

### 4.12 Modulo BI y control

Debe permitir:

- margen por operacion
- rentabilidad por cliente
- rentabilidad por vendedor
- aging de cobranzas
- rotacion de stock
- forecast comercial
- cumplimiento logisitico

---

## 5. Stack elegido y criterio tecnico

### 5.1 Stack actual

- `Next.js 16`
- `React 19`
- `TypeScript`
- `App Router`
- `CSS Modules`
- `ESLint`
- `Netlify`
- `GitHub`

### 5.2 Motivo de esta eleccion

Se eligio un stack TypeScript end-to-end porque:

- acelera el desarrollo del MVP
- reduce friccion entre frontend y backend
- comparte tipos y reglas de dominio
- facilita el trabajo con Claude/Codex
- permite evolucionar sin dividir prematuramente el sistema

### 5.3 Software recomendado para trabajar con Claude/Codex

- `VS Code` para desarrollo diario
- `GitHub` para versionado y auditoria de cambios
- `Netlify` para deploys publicos rapidos
- `Bruno` para pruebas de API
- `DBeaver` para inspeccion de base de datos
- `PostgreSQL` como base futura principal

### 5.4 Principio arquitectonico actual

El proyecto debe seguir un enfoque de monolito modular:

- una sola aplicacion
- dominios separados por carpeta
- UI desacoplada de la logica de negocio
- reglas de validacion y tipos dentro del dominio
- posibilidad de migrar storage sin reescribir pantallas

---

## 6. Estructura real actual del repositorio

```text
tech/
|-- CLAUDE.md
|-- README.md
|-- docs/
|   `-- PROYECTO_DETALLADO.md
|-- netlify.toml
|-- next.config.ts
|-- package.json
|-- tsconfig.json
`-- src/
    |-- app/
    |   |-- favicon.ico
    |   |-- globals.css
    |   |-- layout.tsx
    |   |-- page.tsx
    |   `-- comercial/
    |       `-- presupuestos/
    |           `-- page.tsx
    |   `-- maestros/
    |       `-- clientes/
    |           `-- page.tsx
    |-- components/
    |   |-- module-nav.tsx
    |   |-- module-shell.module.css
    |   `-- submit-button.tsx
    `-- modules/
        |-- commercial/
        |   `-- quotes/
        |       |-- repository.ts
        |       |-- types.ts
        |       |-- validation.ts
        |       `-- workspace.tsx
        `-- masters/
            `-- customers/
                |-- repository.ts
                |-- types.ts
                |-- validation.ts
                `-- workspace.tsx
```

### 6.1 Responsabilidad de cada archivo principal

`README.md`

- resumen corto del proyecto
- stack elegido
- comandos
- modulo inicial

`CLAUDE.md`

- reglas internas del proyecto
- convenciones de organizacion
- guia para asistentes de codigo

`netlify.toml`

- define el build para Netlify
- usa `npm run build`
- publica la carpeta `out`

`next.config.ts`

- define `output: "export"`
- define `trailingSlash: true`
- asegura salida estatico-compatible para Netlify

`src/app/layout.tsx`

- layout base de Next.js
- metadata general del sitio
- idioma `es-AR`

`src/app/page.tsx`

- pagina raiz
- renderiza el workspace de presupuestos

`src/app/comercial/presupuestos/page.tsx`

- ruta del modulo comercial
- tambien renderiza el workspace

`src/app/maestros/clientes/page.tsx`

- ruta del modulo de maestros y clientes
- renderiza el workspace del maestro comercial

`src/components/module-nav.tsx`

- navegacion entre modulos funcionales
- deja la app preparada para crecer por dominios

`src/components/module-shell.module.css`

- estilos compartidos de los modulos funcionales
- evita duplicar layout y componentes de la shell visual

`src/components/submit-button.tsx`

- boton reutilizable de submit
- usa `useFormStatus`

`src/modules/commercial/quotes/types.ts`

- tipos del dominio de presupuestos
- estados
- monedas
- tipos de solucion
- shape de `Quote`

`src/modules/commercial/quotes/validation.ts`

- validacion de entrada del formulario
- sanitizacion minima de datos
- errores por campo

`src/modules/commercial/quotes/repository.ts`

- datos semilla
- logica de dashboard
- creacion de presupuesto para modo navegador

`src/modules/commercial/quotes/workspace.tsx`

- componente principal del modulo
- renderiza hero, metricas, formulario y tabla
- maneja el estado del formulario
- guarda y lee del `localStorage`

`src/modules/masters/customers/types.ts`

- tipos del dominio de clientes
- estados comerciales, credito y segmentos
- shape de `Customer`

`src/modules/masters/customers/validation.ts`

- validacion de entrada del formulario de clientes
- errores por campo
- normalizacion minima

`src/modules/masters/customers/repository.ts`

- clientes semilla
- dashboard del maestro
- alta local para modo navegador

`src/modules/masters/customers/workspace.tsx`

- componente principal del modulo de clientes
- renderiza hero, metricas, formulario y tabla
- maneja estado local y guardado en navegador

---

## 7. Flujo funcional actual del modulo de presupuestos

### 7.1 Pantallas actuales

Actualmente hay una experiencia principal:

- `/`
- `/comercial/presupuestos/`
- `/maestros/clientes/`

La raiz muestra el workspace comercial y la navegacion superior permite pasar
entre los modulos funcionales disponibles.

### 7.2 Flujo de uso actual

1. La pantalla carga presupuestos semilla desde `repository.ts`.
2. Si el navegador ya tiene datos guardados en `localStorage`, se cargan esos datos.
3. El usuario completa el formulario.
4. Se validan los datos con `validateCreateQuoteInput`.
5. Si hay errores, se muestran mensajes por campo.
6. Si el formulario es valido, se construye un nuevo presupuesto con `createBrowserQuote`.
7. El presupuesto se agrega al estado local.
8. La lista y las metricas se recalculan en pantalla.
9. El conjunto completo de presupuestos se guarda en `localStorage`.

### 7.3 Datos capturados hoy

Cada presupuesto actual captura:

- cliente
- CUIT
- tipo de solucion
- vendedor
- moneda
- total
- vigencia
- notas

### 7.4 Reglas de validacion actuales

Reglas implementadas:

- cliente: minimo 3 caracteres
- CUIT: exactamente 11 digitos
- tipo de solucion: debe existir en el catalogo permitido
- vendedor: minimo 3 caracteres
- moneda: debe ser `ARS` o `USD`
- total: numero mayor a 0
- vigencia: hoy o fecha futura
- notas: maximo 500 caracteres

### 7.5 Metricas actuales

El dashboard calcula:

- cantidad de presupuestos abiertos
- cantidad que vencen en 7 dias
- pipeline en `ARS`
- pipeline en `USD`
- cantidad aprobada en el mes

### 7.6 Limitaciones actuales

La version actual no tiene todavia:

- base de datos
- autenticacion
- usuarios reales
- workflow de aprobacion
- items por presupuesto
- conversion a orden de venta
- integracion con stock
- integracion con facturacion
- API productiva

---

## 8. Modelo de datos actual del modulo quotes

### 8.1 Estados del presupuesto

Estados definidos:

- `draft`
- `sent`
- `approved`
- `rejected`
- `expired`

### 8.2 Monedas

Monedas definidas:

- `ARS`
- `USD`

### 8.3 Tipos de solucion

Tipos definidos:

- `workstations`
- `infrastructure`
- `licensing`
- `technical-service`
- `networking`

### 8.4 Entidad Quote

La entidad actual es:

```ts
type Quote = {
  id: string;
  number: string;
  customerName: string;
  customerTaxId: string;
  solutionType: SolutionType;
  sellerName: string;
  status: QuoteStatus;
  currency: CurrencyCode;
  totalAmount: number;
  validUntil: string;
  createdAt: string;
  notes: string;
};
```

### 8.5 Evolucion recomendada de Quote

En la siguiente fase, `Quote` deberia crecer con:

- `customerId`
- `sellerId`
- `items[]`
- `subtotal`
- `discountAmount`
- `discountPercent`
- `taxAmount`
- `marginAmount`
- `marginPercent`
- `version`
- `convertedToSalesOrderId`
- `approvalStatus`
- `approvedBy`
- `approvedAt`

---

## 9. Arquitectura objetivo recomendada

### 9.1 Capa de presentacion

Responsabilidad:

- paginas
- layouts
- formularios
- componentes visuales
- feedback al usuario

Ubicacion:

- `src/app/*`
- `src/components/*`

### 9.2 Capa de dominio

Responsabilidad:

- tipos
- reglas
- validaciones
- servicios del dominio
- calculos de negocio

Ubicacion:

- `src/modules/*`

### 9.3 Capa de persistencia futura

Responsabilidad:

- acceso a base de datos
- queries
- mapeo de entidades
- transacciones

Recomendacion:

- seguir dentro de cada modulo, por ejemplo:
  - `repository.ts`
  - `queries.ts`
  - `mappers.ts`

### 9.4 Capa de integraciones futuras

Responsabilidad:

- ARCA
- bancos
- email
- WhatsApp
- servicios externos

Recomendacion:

- `src/integrations/*`

---

## 10. Estructura objetivo sugerida para crecer

```text
src/
|-- app/
|-- components/
|-- integrations/
|   |-- arca/
|   |-- banks/
|   `-- notifications/
|-- lib/
|   |-- auth/
|   |-- db/
|   |-- dates/
|   `-- money/
`-- modules/
    |-- masters/
    |   |-- customers/
    |   |-- products/
    |   |-- suppliers/
    |   `-- users/
    |-- commercial/
    |   `-- quotes/
    |-- sales/
    |   `-- orders/
    |-- purchasing/
    |   `-- purchase-orders/
    |-- inventory/
    |   |-- stock-movements/
    |   |-- warehouses/
    |   `-- transfers/
    |-- logistics/
    |   `-- deliveries/
    |-- finance/
    |   |-- receipts/
    |   |-- collections/
    |   |-- banks/
    |   `-- treasury/
    |-- accounting/
    |   |-- entries/
    |   `-- taxes/
    `-- service/
        |-- repairs/
        `-- rma/
```

---

## 11. Roadmap recomendado por fases

### Fase 0 - Base y orden tecnico

Objetivo:

- consolidar la base actual y dejarla lista para crecer

Trabajo:

- documentacion
- checklist tecnico
- normalizacion de estructura
- definicion de convenciones
- definicion de roadmap

Resultado esperado:

- repo ordenado
- documentacion central
- decisiones tecnicas claras

### Fase 1 - Persistencia real y maestros

Objetivo:

- pasar de demo local a aplicacion con datos persistentes

Trabajo:

- integrar PostgreSQL
- crear tabla `customers`
- crear tabla `users`
- crear tabla `quotes`
- crear tabla `quote_items`
- crear catalogos base
- implementar repositorios persistentes
- mantener la UI actual

Resultado esperado:

- datos reales
- clientes reales
- presupuestos persistentes
- base para permisos y operaciones

### Fase 2 - Presupuesto completo

Objetivo:

- convertir el modulo actual en presupuesto comercial usable de verdad

Trabajo:

- items por presupuesto
- subtotales
- descuentos
- condiciones comerciales
- aprobacion de margen
- versionado
- estados operativos mas completos

Resultado esperado:

- presupuesto comercial real
- informacion lista para convertir a venta

### Fase 3 - Orden de venta

Objetivo:

- conectar comercial con operacion

Trabajo:

- modulo `sales/orders`
- conversion de presupuesto a venta
- estados de orden
- reserva de stock
- validacion comercial
- tracking de cumplimiento

Resultado esperado:

- orden de venta formal
- base para compras y logistica

### Fase 4 - Maestros de productos y stock

Objetivo:

- incorporar el corazon operativo del ERP

Trabajo:

- catalogo de productos
- marcas
- categorias
- seriales
- depositos
- ubicaciones
- libro de movimientos
- stock logico y fisico

Resultado esperado:

- control real de inventario
- trazabilidad

### Fase 5 - Compras y abastecimiento

Objetivo:

- conectar necesidad comercial con compra real

Trabajo:

- solicitudes de compra
- ordenes de compra
- recepciones parciales
- mercaderia en transito
- fechas comprometidas

Resultado esperado:

- compras integradas con ventas y stock

### Fase 6 - Logistica y entregas

Objetivo:

- controlar salida y entrega al cliente

Trabajo:

- picking
- packing
- remitos
- entregas parciales
- comprobantes de entrega

Resultado esperado:

- operacion logistica visible y controlada

### Fase 7 - Facturacion y administracion

Objetivo:

- monetizar la operacion sin salir del sistema

Trabajo:

- facturas
- notas de credito
- notas de debito
- cuentas corrientes
- recibos
- integracion ARCA

Resultado esperado:

- circuito administrativo integrado

### Fase 8 - Finanzas, bancos e impuestos

Objetivo:

- cerrar el circuito economico y contable

Trabajo:

- cobranzas
- pagos
- bancos
- conciliaciones
- retenciones
- percepciones
- impuestos
- asientos

Resultado esperado:

- administracion y contabilidad conectadas

### Fase 9 - Servicio tecnico y armado de soluciones

Objetivo:

- cubrir la realidad del negocio tecnologico

Trabajo:

- reparaciones
- tickets internos
- presupuestos de servicio
- garantias
- armado de equipos
- checklists tecnicos

Resultado esperado:

- un ERP adaptado al negocio real

---

## 12. Paso a paso recomendado para la proxima etapa inmediata

El orden recomendado desde el estado actual es este:

### Paso 1

Agregar base de datos PostgreSQL.

Objetivo:

- dejar de depender de `localStorage`

Entregables:

- conexion a base
- configuracion por entorno
- esquema inicial

### Paso 2

Crear maestros minimos.

Objetivo:

- reemplazar textos libres por entidades reales

Entregables:

- clientes
- usuarios vendedores
- catalogo inicial de soluciones o productos

### Paso 3

Persistir presupuestos.

Objetivo:

- grabar y leer desde base real

Entregables:

- `quotes`
- `quote_items`
- consulta de listado
- alta real

### Paso 4

Agregar items al presupuesto.

Objetivo:

- que el presupuesto tenga detalle comercial real

Entregables:

- filas de producto o servicio
- cantidades
- precios
- subtotal

### Paso 5

Implementar login y roles.

Objetivo:

- preparar seguridad y auditoria

Entregables:

- login
- usuario autenticado
- rol comercial
- rol administracion
- rol gerencia

### Paso 6

Convertir presupuesto a orden de venta.

Objetivo:

- conectar el primer modulo con el siguiente

Entregables:

- boton de conversion
- entidad `sales_order`
- relacion `quote -> sales_order`

---

## 13. Base de datos inicial recomendada

Tablas recomendadas para la siguiente fase:

- `users`
- `roles`
- `user_roles`
- `customers`
- `customer_contacts`
- `products`
- `product_categories`
- `quotes`
- `quote_items`
- `sales_orders`
- `sales_order_items`
- `audit_logs`

Campos minimos recomendados:

### `customers`

- id
- business_name
- tax_id
- email
- phone
- address
- status
- created_at
- updated_at

### `users`

- id
- full_name
- email
- status
- created_at
- updated_at

### `quotes`

- id
- number
- customer_id
- seller_id
- status
- currency
- valid_until
- notes
- subtotal_amount
- total_amount
- created_at
- updated_at

### `quote_items`

- id
- quote_id
- item_type
- description
- product_id nullable
- quantity
- unit_price
- total_price
- created_at

---

## 14. Seguridad y permisos

Seguridad minima obligatoria a futuro:

- autenticacion
- autorizacion por roles
- auditoria de acciones
- separacion entre usuarios comunes y administradores
- logs de cambios criticos
- proteccion de datos sensibles

Roles sugeridos:

- comercial
- administracion
- compras
- logistica
- tecnico
- finanzas
- gerencia
- administrador del sistema

Ejemplo de permisos:

- comercial puede crear presupuestos y ver sus clientes
- administracion puede facturar y emitir recibos
- compras puede crear ordenes de compra
- logistica puede preparar y confirmar entregas
- tecnico puede gestionar reparaciones
- gerencia puede ver reportes y aprobar excepciones

---

## 15. Reglas de negocio importantes a respetar

Estas reglas deben sostenerse desde el inicio:

- no duplicar entidades entre modulos
- todo presupuesto debe tener trazabilidad
- una venta debe nacer de un presupuesto o dejar motivo de excepcion
- el stock no se corrige pisando valores, se mueve por eventos
- los comprobantes no se borran, se revierten
- las integraciones fiscales deben quedar desacopladas del dominio comercial
- las pantallas no deben contener reglas de negocio complejas

---

## 16. Despliegue actual y proceso de entrega

### 16.1 Build actual

Scripts actuales:

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

### 16.2 Configuracion de Netlify

Archivo:

- `netlify.toml`

Configuracion:

- comando de build: `npm run build`
- carpeta publicada: `out`

### 16.3 Configuracion de Next.js

Archivo:

- `next.config.ts`

Configuracion clave:

- `output: "export"`
- `trailingSlash: true`

### 16.4 Motivo del deploy estatico

Se eligio deploy estatico para evitar errores de runtime en Netlify en esta primera etapa y asegurar una web visible, funcional y demostrable.

---

## 17. Convenciones de desarrollo ya definidas

Convenciones actuales:

- la logica de negocio vive en `src/modules/*`
- las paginas del App Router deben consumir el dominio, no pegarse a si mismas via fetch
- las mutaciones deben pasar por mecanismos claros
- la persistencia debe poder cambiar sin romper la UI
- los nuevos modulos deben repetir la estructura por dominio

Estructura sugerida por modulo:

- `types.ts`
- `validation.ts`
- `repository.ts`
- `actions.ts`
- `components/*`

En la version actual, `actions.ts` fue retirado del modulo `quotes` porque el deploy estatico no usa server actions para persistencia.

---

## 18. Riesgos actuales y como controlarlos

### Riesgo 1

Persistencia solo local del navegador.

Impacto:

- no sirve para multiusuario real
- se pierde si cambia el navegador o equipo

Mitigacion:

- migrar a PostgreSQL en la siguiente fase

### Riesgo 2

No hay autenticacion.

Impacto:

- no hay trazabilidad por usuario real

Mitigacion:

- agregar login y roles antes de modulos administrativos

### Riesgo 3

No hay items por presupuesto.

Impacto:

- el presupuesto es solo cabecera

Mitigacion:

- agregar `quote_items` en el siguiente sprint funcional

### Riesgo 4

No hay integracion con operaciones.

Impacto:

- no existe aun continuidad hacia ventas o stock

Mitigacion:

- implementar conversion a orden de venta como siguiente hito

---

## 19. Definicion de terminado por etapa

Una fase debe considerarse cerrada solo si cumple:

- funcionalidad visible
- datos persistentes si corresponde
- validaciones implementadas
- errores controlados
- documentacion actualizada
- pruebas manuales completas
- deploy verificable

---

## 20. Proximo sprint recomendado

Sprint sugerido:

### Objetivo

Pasar de demo local a modulo comercial persistente.

### Alcance

- PostgreSQL
- clientes
- vendedores
- presupuestos persistentes
- items de presupuesto

### Resultado esperado

- primera version verdaderamente multiusuario
- base para orden de venta
- continuidad tecnica sin rehacer interfaz

---

## 21. Conclusion

El proyecto ya tiene una base concreta y visible. No es un documento teorico sobre un ERP imaginario: ya existe un primer modulo funcional, una estructura de codigo ordenada, un repo sincronizado y una web desplegada.

La estrategia correcta ahora es construir sobre esta base sin romper lo que ya funciona. El orden recomendado es:

1. persistencia real
2. maestros
3. items de presupuesto
4. conversion a orden de venta
5. stock
6. compras
7. logistica
8. facturacion
9. finanzas y contabilidad
10. servicio tecnico y armado

Si se respeta este orden, el sistema va a crecer con coherencia, con menos retrabajo y con una base suficientemente profesional para escalar.
