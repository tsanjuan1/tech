# B2B Tech ERP

Base inicial de un ERP integral para una Pyme argentina que vende tecnologia a otras empresas.

## Documento maestro

La documentacion detallada del proyecto esta en:

- `docs/PROYECTO_DETALLADO.md`

## Supabase

La app ya esta preparada para usar Supabase en cliente.

- proyecto actual: `vrgtgixpbjyzmuxcdmdi`
- schema base: `supabase/0001_initial_schema.sql`
- parche para acceso navegador sin login: `supabase/0002_enable_anon_browser_access.sql`
- variables ejemplo: `.env.example`

## Por que empezamos por este modulo

El primer modulo es `Comercial / Presupuestos` porque ordena el origen de la operacion:

- define cliente, vendedor y tipo de solucion
- permite empezar a medir pipeline y conversion
- prepara la futura conversion a orden de venta
- evita rehacer el flujo cuando integremos stock, compras y facturacion

## Stack elegido

- `Next.js 16 + React 19 + TypeScript`
- `App Router` para la experiencia web
- `Arquitectura modular por dominio`
- `CSS Modules`
- `Export estatico para Netlify`

## Software recomendado para trabajar bien con Claude

- `VS Code` como editor principal
- `Git + GitHub` para versionado y revisiones
- `Bruno` para probar APIs sin ruido
- `DBeaver` cuando integremos PostgreSQL
- `CLAUDE.md` con convenciones del proyecto para guiar asistentes de codigo

La razon de este stack es simple: TypeScript en frontend y backend reduce friccion, mejora el tipado compartido y hace que Claude/Codex puedan navegar y refactorizar mas rapido sin duplicar logica en distintos lenguajes.

## Modulo disponible hoy

Rutas web:

- `/comercial/presupuestos`
- `/maestros/clientes`

Persistencia actual:

- `Supabase` desde navegador
- fallback visual a datos semilla si la base todavia no responde

## Comandos

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

## Que sigue despues de este modulo

1. integrar clientes reales dentro de presupuestos
2. maestros de productos
3. conversion de presupuesto a orden de venta
4. reservas de stock
5. persistencia real en PostgreSQL
