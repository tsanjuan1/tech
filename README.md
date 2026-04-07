# B2B Tech ERP

Base inicial de un ERP integral para una Pyme argentina que vende tecnologia a otras empresas.

## Por que empezamos por este modulo

El primer modulo es `Comercial / Presupuestos` porque ordena el origen de la operacion:

- define cliente, vendedor y tipo de solucion
- permite empezar a medir pipeline y conversion
- prepara la futura conversion a orden de venta
- evita rehacer el flujo cuando integremos stock, compras y facturacion

## Stack elegido

- `Next.js 16 + React 19 + TypeScript`
- `App Router` para UI y backend-for-frontend
- `Arquitectura modular por dominio`
- `Server Actions` para mutaciones
- `Route Handlers` para integraciones JSON

## Software recomendado para trabajar bien con Claude

- `VS Code` como editor principal
- `Git + GitHub` para versionado y revisiones
- `Bruno` para probar APIs sin ruido
- `DBeaver` cuando integremos PostgreSQL
- `CLAUDE.md` con convenciones del proyecto para guiar asistentes de codigo

La razon de este stack es simple: TypeScript en frontend y backend reduce friccion, mejora el tipado compartido y hace que Claude/Codex puedan navegar y refactorizar mas rapido sin duplicar logica en distintos lenguajes.

## Modulo disponible hoy

Ruta web:

- `/comercial/presupuestos`

API:

- `GET /api/commercial/quotes`
- `POST /api/commercial/quotes`

## Comandos

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

## Que sigue despues de este modulo

1. maestros de clientes y productos
2. conversion de presupuesto a orden de venta
3. reservas de stock
4. aprobaciones comerciales y crediticias
5. persistencia real en PostgreSQL
