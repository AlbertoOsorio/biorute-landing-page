# BioRoute Landing Page — Code Documentation

## Overview

Landing page for **BioRoute**, a Chilean deep-tech biotech startup that develops biodegradable post-harvest coatings (peptides) to extend the shelf life of fresh fruit for long-distance export.

**Stack:** React 18 · TypeScript · Vite · Tailwind CSS · React Router DOM · Supabase (dependency, not actively used in the UI)

---

## Project Structure

```
biorute-landing-page/
├── index.html                        # HTML entry point
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── vercel.json                        # Vercel deployment config
├── src/
│   ├── main.tsx                       # React root — mounts <App />
│   ├── App.tsx                        # Router setup
│   ├── index.css                      # Global styles
│   ├── vite-env.d.ts
│   ├── context/
│   │   └── LanguageContext.tsx        # Global language state (ES/EN)
│   ├── page/
│   │   ├── HomePage.tsx               # Route "/"
│   │   └── Vision.tsx                 # Route "/equipo"
│   ├── components/
│   │   ├── Layout.tsx                 # Shell: Navigation + children + Footer
│   │   ├── Navigation.tsx             # Fixed top nav with language switcher
│   │   ├── Footer.tsx                 # Footer with contact and links
│   │   ├── Hero.tsx                   # Fixed full-screen background image
│   │   ├── HeroTextOverlay.tsx        # Scroll-animated headline over the hero
│   │   ├── ChileanAgroExportChallenge.tsx  # Scroll-animated card with stats
│   │   ├── SolutionSection.tsx        # "Our Solution" section
│   │   ├── ProductPresentation.tsx    # Product showcase with parallax image
│   │   ├── EfficacyTable.tsx          # Comparison table (ETHYLOCK vs competitors)
│   │   └── EvolutionaryComponent.tsx  # 3-step roadmap carousel
│   └── imagen/
│       ├── fondo.png                  # Hero background image
│       ├── logoBioRoute.png           # Brand logo
│       ├── imagenCompleta.png         # Avocado & cherry image (product section)
│       ├── image1.png                 # Year 1 roadmap image
│       ├── image2.png                 # Year 2 roadmap image
│       └── image3.png                 # Year 3 roadmap image
```

---

## Routing (`App.tsx`)

Two routes, both wrapped in `<Layout>`:

| Path       | Component  | Description              |
|------------|------------|--------------------------|
| `/`        | `HomePage` | Main landing page        |
| `/equipo`  | `Vision`   | Mission, Vision & roadmap |

---

## Internationalization (`LanguageContext.tsx`)

A React Context provides `language` (`'en' | 'es'`) and `setLanguage` globally. The default is `'en'`. Every component that needs translated text calls `useLanguage()`. The language toggle lives in `Navigation`.

---

## Pages

### `HomePage` (`src/page/HomePage.tsx`)

Assembles the landing page sections in order:

1. **Hero** — fixed full-screen background (z-0)
2. **HeroTextOverlay** — animated text on top of the hero (z-10, full viewport height)
3. **ChileanAgroExportChallenge** — scroll-in card
4. **SolutionSection** — product description
5. **ProductPresentation** — parallax product image + efficacy table

### `Vision` (`src/page/Vision.tsx`)

Bilingual Mission / Vision text page, followed by the `EvolutionaryComponent` (3-year roadmap).

---

## Components

### `Layout` (`components/Layout.tsx`)

- Wraps every page.
- Provides `LanguageProvider` (all child components can use `useLanguage()`).
- Renders `<Navigation />` (fixed top), `<main>` (flex-1), and `<Footer />`.

---

### `Navigation` (`components/Navigation.tsx`)

- **Fixed** navbar at the top (z-40).
- **Auto-hide on scroll down**, reappears on scroll up (tracked via `lastScrollY` ref).
- Layout: 3-column grid — left link | center logo | right language toggle.
- Left link: routes to `/equipo`.
- Center logo: routes to `/`.
- Right: ES / EN pill toggle that calls `setLanguage`.

---

### `Footer` (`components/Footer.tsx`)

- Background: `#2f4e37` (dark green).
- Shows BioRoute logo, tagline, contact email (`contacto@bioroutebt.com`), and a links column.
- Bottom bar: copyright + "Built by CodeXpertDS.com".
- All text is bilingual via `useLanguage()`.

---

### `Hero` (`components/Hero.tsx`)

- `position: fixed`, `inset: 0`, `z-index: 0` — stays behind all scrollable content.
- Renders `fondo.png` as a full-cover `<img>`.
- A black overlay (`bg-black/45`) dims the image for text contrast.

---

### `HeroTextOverlay` (`components/HeroTextOverlay.tsx`)

- Absolutely positioned inside a full-viewport container (set by `HomePage`).
- Listens to `scroll` via `requestAnimationFrame` for performance.
- Calculates `p` (progress 0→1) based on how far the element has scrolled past the viewport.
- Animates:
  - `translateY`: moves text up by up to 80px
  - `opacity`: fades out from 1 to 0
  - `scale`: shrinks slightly (max 5%)
- Text is bilingual (3 headline lines + a description paragraph).

---

### `ChileanAgroExportChallenge` (`components/ChileanAgroExportChallenge.tsx`)

**Scroll-driven expanding card.** As the user scrolls into the section, a card animates from a rounded, narrow pill to a full-screen panel.

**Key mechanics:**
- `triggerRef` — the scroll target used to compute progress `p` (0→1).
- `contentRef` — measured with `ResizeObserver` to compute the card's final height dynamically.
- Card properties animated with `p`:
  - `top` — card descends from 30svh toward the top
  - `height` — expands to fit content
  - `width` — goes from 92vw to 100vw
  - `border-radius` — shrinks from 28px to 0px

**`useCountUp` hook** — animates numbers from 0 to their target with an ease-out-cubic curve. Used for the 3 stat bullets (rank, industry value, GDP share). Triggered once `p > 0.25`.

**`getAnimatedMeta` helper** — parses raw value strings (`"Top 5 mundial"`, `"USD 7B+"`, `"1,5%"`) to extract a numeric end value and a renderer function for both ES and EN.

---

### `SolutionSection` (`components/SolutionSection.tsx`)

Static section on the `#about` anchor. Shows:
- Section title and lead paragraph.
- Description of the anti-ripening peptide technology.
- Three highlighted badges: Antioxidant / Anti-ethylene / Anti-dehydration.

---

### `ProductPresentation` (`components/ProductPresentation.tsx`)

Two sub-zones inside `#info`:

1. **Title block** — product names (`Ethylock` / `CherryStop`) and description.
2. **Parallax image scene** — `imagenCompleta.png` inside a sticky container. On scroll:
   - `yImg`: the image translates up/down (parallax, via `translate3d`).
   - `tilt`: subtle `rotateX` tilt.
   - `scale(1.1)` constant overscale to avoid white edges during parallax.
3. **Bottom panel** — rises up with `easeOutCubic` animation as it enters the viewport; contains `<EfficacyTable />`.

---

### `EfficacyTable` (`components/EfficacyTable.tsx`)

Comparison table of ETHYLOCK vs. three conventional post-harvest treatments:

| Column        | Type     |
|---------------|----------|
| ETHYLOCK      | Hero (green highlight) |
| Conventional waxes | Competitor |
| Fungicides    | Competitor |
| 1-MCP         | Competitor |

**Rows (attributes):**
- Prevents ethylene synthesis
- Antimicrobial effect
- Reduces respiration and dehydration
- Preserves organoleptic characteristics

Features:
- **Mobile detection** (`window.innerWidth < 768`) — shows a scroll hint bar with `ChevronLeft`/`ChevronRight` buttons.
- **Sticky first column** on desktop (attribute labels don't scroll away).
- `IconCheck` / `IconX` SVG icons with accessible `aria-label` and `title`.
- Horizontal scroll with `scrollBy` helpers.

---

### `EvolutionaryComponent` (`components/EvolutionaryComponent.tsx`)

Interactive 3-step roadmap carousel, used in the `Vision` page.

**Steps:**
| Step | Title (EN) | Title (ES) |
|------|-----------|-----------|
| 1 | Year 1: Development & Validation | Año 1: Desarrollo y Validación |
| 2 | Year 2: Scaling & Preparation | Año 2: Escalado y Preparación |
| 3 | Year 3: Market Expansion | Año 3: Expansión de Mercado |

Each step has an image (`image1/2/3.png`) and 3 bullet points.

**UI:**
- **Progress bar** — a horizontal track with circle indicators (upcoming / active / completed states). Clicking a circle jumps to that step.
- **Dot indicators** — small dots below the image for quick navigation.
- **Prev/Next** navigation is available via `prevStep` / `nextStep` (cyclic, wraps around).
- Progress percentage = `((currentStep + 1) / 3) * 100`.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Extra CSS classes |
| `showNavigation` | `boolean` | `true` | Show nav buttons |
| `showProgressBar` | `boolean` | `true` | Show step progress bar |

---

## Color Palette

| Variable | Hex | Used for |
|----------|-----|----------|
| Background | `#F9F3E7` | Cards, page background |
| Primary text | `#244629` | Headings, body text |
| Dark green | `#2f4e37` | Footer background |
| Deep green | `#1F3D2B` | Active nav button |

---

---

## Contact Form (`src/page/Contact.tsx`)

Accessible at `/contacto`. Bilingual form with three fields: **Name**, **Email**, **Message**.

**Behavior:**
- Submissions are saved to the `contact_submissions` Supabase table.
- Shows a loading state while submitting and a success message on completion.
- If Supabase is not yet configured (missing env vars), the form still works visually — it shows the success state without saving data, so the UI is fully testable before backend setup.

**Supabase:** la tabla `contact_submissions` se crea con `supabase/setup.sql` (la web solo puede insertar; los mensajes se leen desde el panel de Supabase).

---

## Simulador (`src/page/Simulator.tsx`)

Accesible en `/simulador` (enlace en la barra de navegación). Herramienta bilingüe donde el productor ingresa los datos de su temporada y ve al instante gráficos, pérdidas y el **precio implícito de Ethylock** (rango).

**Secciones:**
1. Operación — fruta, moneda (USD/CLP), volumen en toneladas.
2. Precios — mejor, peor y promedio por kg con su semana; semanas adicionales opcionales → gráfico de evolución del precio (soporta temporadas que cruzan el año).
3. Causas de pérdida — % del volumen y precio obtenido para: se echó a perder, vendida más barata, otra aplicación, sobreoferta, otra causa. El resto se considera vendido al precio promedio.
4. Resultado — ingreso potencial vs. real, pérdida, valor recuperable con Ethylock y precio implícito por kg.
5. Contacto — los datos de contacto se guardan junto con la simulación.

**Cálculo (`src/simulator/calc.ts`):**
- Pérdida por causa = volumen afectado × (precio promedio − precio obtenido).
- Valor recuperable = pérdida × % de recuperación de Ethylock para esa causa (rango conservador–optimista).
- Precio implícito Ethylock por kg = valor recuperable por kg × participación de valor.

**Supuestos editables (`src/simulator/config.ts`):** `SHELF_LIFE_EXTRA_DAYS` (días adicionales de vida útil, el supuesto base que se explica en "¿De dónde sale este valor?"; **valor provisorio, validar con los ensayos**, `null` lo oculta), `RECOVERY_RATES` (recuperación por causa) y `PRICE_VALUE_SHARE` (parte del valor que se considera precio razonable; solo uso interno, no se muestra). Cambiarlos actualiza todo el simulador.

**Marca:** los textos no nombran el producto ("nuestra tecnología" / "nuestra formulación"), para que un rebranding no requiera cambios. El valor recuperable se presenta como **ingreso bruto adicional**, sin descontar el costo del tratamiento.

**Captura de datos:** cada visita tiene un id; 2,5 s después de cada cambio se guarda (o actualiza) la fila de esa visita, así quedan los datos aunque no se deje contacto. Al enviar el formulario se agrega el contacto a la misma fila **y** se crea una fila en `contact_submissions` (mensaje que empieza con `[Simulador]`, con resumen e id de la simulación), así todos los contactos quedan en una sola tabla. Sin Supabase configurado no se guarda nada (en desarrollo se muestra en la consola del navegador).

**Supabase:** la tabla `simulator_submissions` y la función `save_simulation` se crean con `supabase/setup.sql`.

Para ver los datos: Supabase → Table Editor → `simulator_submissions` (o exportar a CSV).

---

## Supabase (base de datos)

Servicio externo (supabase.com) donde se guardan el formulario de contacto y el simulador.

1. Crear un proyecto en supabase.com.
2. SQL Editor → New query → pegar **todo** `supabase/setup.sql` → Run.
3. Project Settings → API / Data API → copiar *Project URL* y la clave *anon / publishable* (nunca la *service_role / secret*).
4. Vercel → Settings → Environment Variables → `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (Production, Preview, Development) → redeploy.

Sin estas variables los formularios muestran éxito pero **no guardan nada**.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Where to find it |
|----------|-----------------|
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon/public key |

> `.env` is gitignored and will never be committed.

---

## Scripts

```bash
npm run dev        # Start Vite dev server
npm run build      # Production build
npm run preview    # Preview production build
npm run lint       # ESLint
npm run typecheck  # TypeScript type check (no emit)
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^18.3.1 | UI library |
| `react-dom` | ^18.3.1 | DOM renderer |
| `react-router-dom` | ^7.12.0 | Client-side routing |
| `recharts` | ^2.15.4 | Gráficos del simulador |
| `lucide-react` | ^0.344.0 | Icons (chevrons, phone icon) |
| `@supabase/supabase-js` | ^2.57.4 | Backend client (installed, not yet used in UI) |
| `tailwindcss` | ^3.4.1 | Utility CSS |
| `vite` | ^5.4.2 | Build tool |
| `typescript` | ^5.5.3 | Type safety |
