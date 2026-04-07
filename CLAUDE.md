@AGENTS.md

# Proyecto

ERP B2B para una Pyme argentina que vende tecnologia a empresas.

# Modulo inicial

Arrancamos por `commercial/quotes` porque desde ahi nacen:
- presupuesto
- control comercial
- aprobacion de margen
- futura conversion a orden de venta
- posterior impacto en stock, facturacion y cobranzas

# Convenciones

- Mantener la logica de negocio en `src/modules/*`.
- Las paginas del App Router deben leer desde el dominio, no desde fetchs internos a sus propias rutas.
- Las mutaciones deben pasar por Server Actions o Route Handlers.
- El storage actual es en memoria y debe poder migrarse a PostgreSQL sin tocar la UI.
- Evitar meter logica comercial dentro de componentes visuales.
- Cualquier nuevo modulo debe seguir la misma estructura: `types`, `validation`, `repository`, `actions`, `components`.
