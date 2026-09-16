# Plan: lookup de portafolios por nombre y shareSlug

## Objetivo

Conservar la ruta privada `/portfolio/:name`, resolverla con el `userId` extraído del token y el nombre exacto del portafolio, y mantener la ruta pública `/share/:shareSlug` para los portafolios publicados desde el leaderboard.

## Decisiones confirmadas

- La ruta privada seguirá usando el nombre del portafolio; no se cambiará a ID ni a otro identificador.
- El nombre será el valor exacto almacenado, con validación de no vacío y codificación segura en la URL.
- Los portafolios públicos se consultarán por `shareSlug`, no por nombre.
- La página pública debe mostrar posiciones y movimientos/transacciones.

## Estado actual y causa principal

- El backend ya tiene el flujo privado esperado: `portfolioByName` obtiene el usuario autenticado y llama a `getPortfolioByName(userId, name)` (`portfolio-manager/src/main/java/com/capitalfourge/portfoliomanager/infrastructure/adapters/in/graphql/PortfolioGraphQLController.java:128-146`); el servicio consulta por `userId + name` (`PortfolioService.java:507-516`).
- El flujo público ya está parcialmente implementado: `sharedPortfolio` filtra portafolios no públicos (`PortfolioGraphQLController.java:786-795`) y el leaderboard enlaza a `/share/${shareSlug}` (`frontend/app/(dashboard)/leaderboard/page.tsx:165-169`).
- El fallo que hace que la página privada nunca muestre el portafolio está en el frontend: la query usa el alias `portfolioByName`, pero la página comprueba y lee `data?.portfolio` / `data.portfolio` (`frontend/app/(dashboard)/portfolio/[slug]/page.tsx:84-118,201-210`).
- El leaderboard frontend consulta `leaderboard`, pero el schema GraphQL y el controlador actual no exponen ese campo; el servicio `getPublicLeaderboard()` sí existe (`PortfolioService.java:465-478`).
- La página pública consulta posiciones pero no transacciones (`frontend/app/share/[slug]/page.tsx:18-34,138-180`), aunque el resolver puede exponerlas.
- `findByName(String)` es una consulta global sin ownership (`JpaPortfolioRepository.java:20`, `PortfolioService.java:497-505`) y debe eliminarse del camino de acceso privado.
- La base de datos no garantiza nombres únicos por usuario; `shareSlug` sí es único globalmente (`PortfolioEntity.java:33-35`).

## Tareas de implementación

1. Corregir el detalle privado en frontend
   - En `frontend/app/(dashboard)/portfolio/[slug]/page.tsx`, usar `data?.portfolioByName` para el estado de carga/error y asignar `const portfolio = data?.portfolioByName as Portfolio | undefined`.
   - Mantener la query `portfolioByName(name: $name)` y la lectura de `me` para validar ownership en pantalla.
   - Codificar los nombres al construir enlaces privados con `encodeURIComponent(portfolio.name)` en:
     - `frontend/app/(dashboard)/portfolio/page.tsx:112`
     - `frontend/app/(dashboard)/dashboard/page.tsx:350-353`
     - `frontend/app/(dashboard)/explorer/[symbol]/page.tsx:496`
   - Rechazar nombres vacíos o que contengan `/` en la creación de portafolios; así la ruta de un segmento sigue siendo representable. Mantener espacios y caracteres Unicode, codificados por la URL.

2. Endurecer el lookup privado en backend
   - Mantener `portfolioByName` como endpoint autenticado y seguir usando `findByUserIdAndName`; no permitir fallback a una búsqueda global por nombre.
   - Eliminar `getPortfolioByName(String)` de `PortfolioUseCase`, `PortfolioService`, `PortfolioRepository`, `JpaPortfolioRepository` y `PortfolioPersistenceAdapter`, salvo que una búsqueda posterior demuestre otro consumidor legítimo.
   - En `PortfolioService.createPortfolio`, validar y normalizar el nombre: rechazar `null`/blank y almacenar `trim()`.
   - Añadir en `PortfolioEntity` una restricción única compuesta `(user_id, name)` para hacer explícita la regla de negocio.
   - No modificar el check de `isPublic` dentro de `getPortfolioBySlug`: `portfolioBySlug` está diseñado para permitir al owner ver un portafolio privado; la autorización público/owner ya está en el controlador (`PortfolioGraphQLController.java:150-167`).

3. Completar el flujo público y leaderboard
   - Añadir un `@QueryMapping leaderboard()` en `PortfolioGraphQLController` que llame a `portfolioUseCase.getPublicLeaderboard()`.
   - Añadir `leaderboard: [Portfolio!]!` al `Query` de `portfolio-manager/src/main/resources/graphql/schema.graphqls:6-29`.
   - Mantener el filtro backend de `isPublic` en `sharedPortfolio`; no exponer portafolios privados por shareSlug.
   - Ampliar `GET_SHARED_PORTFOLIO` con `transactions { id symbol type quantity price totalAmount timestamp }` y renderizar una sección de movimientos en `frontend/app/share/[slug]/page.tsx`.
   - Mantener los enlaces del leaderboard usando `shareSlug`; validar en backend que todo portafolio público tenga un slug no vacío antes de devolverlo.

4. Garantizar unicidad y concurrencia de slugs
   - Mantener `shareSlug` único globalmente.
   - En `toggleVisibility`, generar el slug con el sufijo aleatorio actual y repetir ante colisión de base de datos con un número acotado de intentos; no reutilizar ni cambiar un slug ya publicado.
   - Añadir índice para el leaderboard, por ejemplo `(is_public, performance DESC)`, y aplicar la restricción compuesta de nombres mediante SQL explícito para bases existentes.

5. Pruebas
   - Backend:
     - Usuario autenticado A obtiene su portafolio por nombre.
     - Usuario B y las solicitudes sin token no obtienen el portafolio de A.
     - Dos usuarios pueden tener el mismo nombre; un mismo usuario no puede duplicarlo.
     - `sharedPortfolio` devuelve un portafolio público sin auth y `null` para uno privado.
     - El resolver `leaderboard` devuelve solo públicos y con `shareSlug`.
     - Colisión de `shareSlug` resuelta por reintento.
   - Frontend:
     - Mock de `portfolioByName` renderiza el detalle privado y no depende de `data.portfolio`.
     - Los enlaces privados codificados funcionan con espacios y caracteres especiales permitidos.
     - La página `/share/:slug` renderiza posiciones y transacciones públicas.

## Validación

- Frontend: `pnpm test`, `pnpm lint`, `pnpm build` desde `frontend`.
- Backend: `mvn test` desde `portfolio-manager`; ejecutar además `AuthCookieIntegrationTest` cuando haya Docker disponible.
- Verificar manualmente:
  - `/portfolio/<nombre-codificado>` con token válido para el owner.
  - La misma URL con otro usuario devuelve “no encontrado/sin permisos”.
  - `/share/<shareSlug>` sin autenticación muestra detalles y movimientos.
  - El leaderboard solo contiene portafolios públicos y sus botones abren `/share/<shareSlug>`.

## Migración y rollout

- Antes de crear la restricción única compuesta, ejecutar:
  `SELECT user_id, name, COUNT(*) FROM portfolios GROUP BY user_id, name HAVING COUNT(*) > 1;`
- Resolver cualquier duplicado existente antes de aplicar:
  `CREATE UNIQUE INDEX IF NOT EXISTS ux_portfolios_user_name ON portfolios (user_id, name);`
- Aplicar también el índice de leaderboard si la base ya existe:
  `CREATE INDEX IF NOT EXISTS idx_portfolios_public_performance ON portfolios (is_public, performance DESC);`
- El proyecto usa Hibernate `ddl-auto: update` y no tiene Flyway activo en el backend; por eso la restricción debe quedar reflejada en la entidad y aplicarse explícitamente en la base existente.
- Desplegar primero el cambio backend/migración y después el frontend; las URLs públicas actuales no cambian.

## Riesgos

- Un nombre con `/` no puede representarse de forma fiable en un segmento dinámico; se rechazará en creación.
- Si existen duplicados históricos `(user_id, name)`, la migración fallará hasta limpiarlos.
- Los nombres privados no deben usarse como identificador de seguridad: la autorización real sigue dependiendo del `userId` del token y de la restricción de ownership.
