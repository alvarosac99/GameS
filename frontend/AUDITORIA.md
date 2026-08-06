# Auditoría frontend — GameS (rama `frontend/rediseno-tokens`)

Fecha: 2026-08-06. Alcance: `frontend/src` completo (pages/, components/, context/, App.jsx, index.css, tailwind.config.js).

**Estado: TODO APLICADO.** Los 26 puntos de este documento (fondos animados, P0 responsive, accesibilidad de teclado, theming, bugs, anti-patrones, refactors y componentes compartidos) están implementados y verificados con `vite build` (sin errores) y `vitest run` (36/36 tests). Este documento se conserva como registro de la auditoría original; las secciones de abajo describen el estado **antes** de los cambios.

Componentes/hooks/utils nuevos creados durante la implementación:
- `components/ui/Panel.jsx`, `components/ui/Pagination.jsx`, `components/ui/PerPageSelector.jsx`, `components/ui/IconButton.jsx`
- `hooks/useDebouncedSearch.js`
- `lib/format.js` (`formatHoras`), `fetchJuegosPorIds` en `lib/api.js`
- Escala de z-index semántica en `tailwind.config.js` (`dropdown/sticky/modal-backdrop/modal/toast/tooltip/max`)

Nota: quedan ~24 avisos de ESLint (`no-unused-vars`, `no-empty`) preexistentes en el código, no relacionados con esta auditoría — no se tocaron por estar fuera de alcance.

---

## 0. Fondos animados — ELIMINADO

Se quitó todo el sistema de fondo animado (cursor-glow que seguía el puntero, líneas de circuito, partículas "ember" en dark mode, beams JS con RAF):

- `App.jsx`: eliminados el efecto `pointermove` (`--cursor-x/y`) y el efecto completo de animación de `circuit-beam` (~150 líneas de JS con RAF), más el `<div className="circuit-beams">` del JSX.
- `index.css`: eliminadas las variables `--bg-anim-*`, `--cursor-glow-*`, `--circuit-line-*` (root y `.dark`), los pseudo-elementos `.app-shell::before`/`::after`, las clases `.circuit-beams`/`.circuit-beam`, y los keyframes muertos `embersDrift`, `embersRise`, `microchipPulse`, `circuitSweep`, `circuitLightFlow`.
- Se mantiene `--imagen-fondo` (gradiente radial claro / `background.png` en oscuro) como fondo **concreto/estático** — base para rediseñar.
- Build verificado con `vite build`: sin errores.

**Pendiente de decidir**: diseño final de los fondos concretos por tema (light/dark).

---

## 1. Auditoría técnica general (a11y, theming, bugs, anti-patrones)

### Audit Health Score

| # | Dimensión | Score | Hallazgo clave |
|---|---|---|---|
| 1 | Accesibilidad | 1/4 | `<div onClick>` sin `role`/`tabIndex`/`onKeyDown` en 9+ sitios |
| 2 | Rendimiento | 3/4 | Sin layout thrash grave; fetches sin `AbortController` |
| 3 | Responsive | ver sección 2 | Auditado aparte, con más detalle |
| 4 | Theming | 2/4 | `JuegoUnico.jsx` ignora el sistema de tokens; hex sueltos repetidos |
| 5 | Anti-patrones | 2/4 | `border-l-4` decorativo (banned) en 2 sitios; z-index sin escala |
| **Total** | | **11/20** | **Aceptable — trabajo significativo pendiente** |

### P1 — Críticos

1. **Navegación sin teclado (patrón sistémico, 9+ sitios)**: `div`/`li` con `onClick` como único disparador, sin `role="button"`/`tabIndex`/`onKeyDown`.
   - `components/GameCard.jsx:35` (componente más reusado de la app)
   - `components/Carrusel.jsx:58-70`
   - `components/AñadirEntrada.jsx:91-97`
   - `components/BuscadorGlobal.jsx:133-159`
   - `components/EditarFavoritos.jsx:113-121`
   - `components/Comentarios.jsx:159-160`
   - `pages/ListaUsuarios.jsx:77-91`
   - `pages/Jugar.jsx:140-164`
   - `pages/Planificaciones.jsx:165-172`

2. **Foco visible eliminado sin alternativa**: `components/Carrusel.jsx:41,78` — `outline-none focus:outline-none ring-0` en flechas de navegación (usado 3× en Home). Viola WCAG 2.4.7.

3. **`pages/JuegoUnico.jsx` fuera del sistema de tokens**: página entera usa `bg-black/NN`, hex literales (`#1f1f1f`, `#181818`, `#232323`, `#2a2a2a`, `#333333`), `text-white`/`text-gray-200` en vez de `bg-card`/`text-foreground`. En modo claro queda un panel oscuro incoherente con el resto de la app. Líneas: 678, 688, 707, 716, 723, 763, 779, 785, 812, 829, 898, 995, 1011, 1020, 1029, 1122, 1141, 1151, 1161, 1194.

4. **`border-black/10` roto en dark mode**: `pages/PaginaPrincipal.jsx` líneas 58, 111, 137, 158, 220, 236, 270 — borde casi invisible sobre fondo oscuro. Debe ser `border-border`.

5. **Race condition en traducción de sinopsis**: `pages/JuegoUnico.jsx:244-274` — fetch a Google Translate sin `AbortController` ni guard de `juego.id`. Cambiar de juego rápido puede pintar la sinopsis del juego anterior sobre el actual. (Bug de código, no de diseño.)

### P2 — Relevantes

- Hex sueltos repetidos: `#1f1f1f` en `Comentarios.jsx` (×3), `Planificaciones.jsx:160`, `TarjetaSkeleton.jsx:5`; `#22282f`/`#292e36` en `ValoracionEstrellas.jsx:102`; `#181b20` en `EditarFavoritos.jsx:99` → candidatos a token compartido (`--surface-strong`).
- Botones icono sin `aria-label`: `EditarPerfil.jsx:57`, `EditarFavoritos.jsx:57,70`, `JuegoUnico.jsx:1208`.
- Inputs sin `<label>` (solo placeholder): Login, Register, NuevoJuego, AñadirEntrada, BuscadorGlobal, Jugar, Planificar, ListaUsuarios — inconsistente con `Reportar.jsx`/`EditarPerfil.jsx` que sí usan `<Label htmlFor>` (shadcn).
- Side-stripe borders (patrón *banned*): `CalendarioDiario.jsx:53`, `ListaEntradasDiario.jsx:20` (`border-l-4 border-primary` decorativo).
- Actualización optimista sin rollback: `JuegoUnico.jsx:753-762,802-811` (select de estado de biblioteca) — si el PATCH falla, la UI no revierte ni avisa.
- `Jugar.jsx:222-227` — botón "Descartar" sin `await`/`.catch()` en el fetch de finalizar sesión.
- Manejo de errores de red inconsistente: `res.json()` sin comprobar `res.ok` en `ActividadReciente.jsx:38-39`, `Diario.jsx:26-27`, `Planificaciones.jsx:31-33` y otros — patrón repetido.
- `GameCard.jsx:13-23` — `style` inline y clases Tailwind definiendo el mismo alto/ancho por duplicado (código muerto, sin efecto funcional).

### P3 — Menores

- Dependencias de `useEffect` incompletas (`Biblioteca.jsx:28-65`, `Login.jsx:15-21`, `Register.jsx:18-33`) — no rompen hoy, frágiles a refactors.
- `Perfil.jsx:327-334,358-364` — dos `<h1>` con el mismo nombre animado, uno oculto (`hidden`) — código muerto en el DOM.
- z-index arbitrario sin escala semántica: `z-20/40/50/[100]/[9999]` repartidos sin criterio entre `App.jsx`, `Carrusel.jsx`, `GameCard.jsx`, `LoadingScreen.jsx`, modales.

### Positivo (mantener)

- Sistema de tokens HSL bien diseñado en `index.css` (light + dark completos, incluye `success/warning/info`, poco habitual y bien pensado).
- `Reportar.jsx`/`EditarPerfil.jsx` usan `<Label htmlFor>` correctamente — patrón a replicar.
- `App.jsx` maneja `Escape` para cerrar el menú lateral — patrón a replicar en `NotificacionesLista`/dropdowns.
- Sin gradient-text, sin hero-metric template, sin card-grids clonados — no lee como diseño IA genérico.
- `GameCard.jsx` tilt 3D ya optimizado (rAF + rect cacheado + mutación directa de `style`, sin `setState` en mousemove).

---

## 2. Responsive

**Veredicto**: no es "pésimo" en general — la mayoría de páginas de listado (Biblioteca, Juegos, Diario, Planificaciones, Planificar, PlanificacionDetalle, Perfil) siguen buena disciplina mobile-first (`grid-cols-2 sm:grid-cols-3 md:grid-cols-4`, `flex-col md:flex-row`). Pero hay **2 roturas P0 de alta visibilidad** más un patrón sistémico de touch-targets pequeños.

### P0 — Rompe en mobile (375px y menos)

1. **`components/Carrusel.jsx:36-72`**: sin ningún breakpoint responsive. `GameCard` no fija ancho propio; 5 tarjetas + `gap-4 px-16` dentro de un contenedor `overflow-hidden` (no scrollable) fuerzan un track >1300px. En 375px el usuario ve solo un fragmento recortado de la tarjeta central. Usado 3× en `pages/PaginaPrincipal.jsx` (líneas 179, 191, 205) — la página más visitada tras login.

2. **`components/EditarFavoritos.jsx:59-61`**: `flex gap-4` sin `flex-wrap` con 5 `GameCard` dentro de un modal `max-w-2xl`, sin `overflow-x-auto` → overflow horizontal del modal en mobile. Se abre desde `pages/Perfil.jsx:458`, acción común para cualquier usuario.

**Causa raíz común**: `GameCard.jsx` no define ancho propio — funciona bien en CSS grid con columnas explícitas, rompe en flex sin wrap y sin ancho por hijo.

### P1 — Funciona pero mal en mobile

- **Touch targets <44px**, repetido 5×: `JuegoUnico.jsx:843,855` (32px), `JuegoUnico.jsx:885,893` (40px), `Perfil.jsx:317-323` (~36px), `EditarPerfil.jsx:104-109` (~36px), `EditarFavoritos.jsx:69-72` (28px, el peor — botón de quitar favorito superpuesto sobre la tarjeta).
- `components/NotificacionesLista.jsx:12` — `w-80` fijo (320px), sin `max-w-[calc(100vw-2rem)]`. Se sale del borde en iPhone SE (viewport 320px).

### P2 — Cosmético

- Clases Tailwind `3xl:`/`4xl:` inexistentes en `tailwind.config.js` (el config solo llega a `2xl`), usadas como si funcionaran en `Biblioteca.jsx:111,209,220` y `Juegos.jsx:186,288,294` — no-ops, código muerto/copy-paste sin verificar.

### Positivo

- `App.jsx` (header/menú/buscador): se adapta bien, buscador oculto tras botón en mobile (`xl:hidden`), menú lateral con overlay funciona.
- Login/Register/Ajustes/ListaUsuarios/NuestrosJuegos/NuevoJuego/Privacidad: layouts simples de una columna, sin anchos fijos problemáticos.

---

## 3. Optimización React y componentes atómicos

- **Cero `React.memo`** en toda la app. `GameCard` se renderiza 7-8× por página en listas (`Biblioteca.jsx`, `Juegos.jsx`) sin memo — cualquier cambio de estado del padre re-renderiza todas las tarjetas visibles aunque sus props no cambien.
- **`useCallback`/`useMemo` solo en 2 archivos** (`Precios.jsx`, `TurnstileContext.jsx`) de ~35. Handlers inline pasados a listas se recrean cada render, lo que anularía el beneficio de un futuro `memo` si no se estabilizan también.

### Candidatos a extracción (repetición de código)

| Candidato | Duplicado en |
|---|---|
| Hook `useDebouncedSearch(endpoint, delay)` | `AñadirEntrada.jsx`, `BuscadorGlobal.jsx`, `EditarFavoritos.jsx`, `Jugar.jsx` |
| Componente `<Panel>` (bg-card/70 + dark:bg-black/30 + blur) | `ActividadReciente.jsx:63`, `Perfil.jsx:341,407,432` |
| Componente `<Pagination>` | `Biblioteca.jsx:239-253`, `Juegos.jsx:305-321` |
| Componente `<PerPageSelector>` | `Biblioteca.jsx:168-197`, `Juegos.jsx:244-274` |
| Util `formatHoras(segundos)` | `Planificaciones`, `PlanificacionDetalle`, `Planificar`, `PlanesCompletados`, `GameCard.jsx:86` |
| Util `fetchJuegosPorIds(ids)` | `ActividadReciente`, `Diario`, `Planificaciones`, `PlanificacionDetalle`, `Planificar` |
| Componente `<IconButton>` (44×44 mín., `aria-label` obligatorio) | Resolvería a la vez el hallazgo de touch-targets pequeños |

---

## Resumen de prioridad para el rediseño

1. **P0**: `Carrusel.jsx` y `EditarFavoritos.jsx` rotos en mobile (causa raíz: `GameCard` sin ancho propio).
2. **P1**: navegación sin teclado (9+ sitios), foco eliminado en Carrusel, `JuegoUnico.jsx` fuera de tokens, `border-black/10` roto en dark, race condition traducción, touch-targets pequeños (5 sitios), `NotificacionesLista` ancho fijo.
3. **P2**: hex sueltos repetidos, aria-labels faltantes, labels de formulario faltantes, side-stripe borders, updates optimistas sin rollback, manejo de errores de red inconsistente, clases `3xl`/`4xl` muertas.
4. **Mejora estructural**: `React.memo` en `GameCard`/`TarjetaSkeleton`/`ValoracionEstrellas`, extraer hook de debounce + componentes `<Panel>`/`<Pagination>`/`<PerPageSelector>`/`<IconButton>` + utils `formatHoras`/`fetchJuegosPorIds`.
