/**
 * Configuración del simulador: todo lo que define BioRoute (supuestos y datos
 * de rubro). Lo que ingresa el productor viene del formulario.
 * Ajusta los valores aquí y el simulador (gráficos, textos, PDF) se actualiza solo.
 *
 * Los textos de la web no nombran el producto ("nuestra tecnología"), así un
 * cambio de marca no requiere tocar el simulador.
 *
 * ⚠️ Los valores marcados como PROVISORIO deben ser validados por alguien del
 * equipo con experiencia en terreno antes de publicar: un dato de rubro
 * equivocado resta credibilidad justo con quien queremos convencer.
 */

export type LossCauseKey = "spoiled" | "discounted" | "diverted" | "oversupply" | "other";
export type Fruit = "avocado" | "cherry" | "other";

// ---------------------------------------------------------------------------
// Supuestos del efecto de la tecnología
// ---------------------------------------------------------------------------

/**
 * Supuesto base que explica todo el simulador: días adicionales de vida útil
 * (calidad comercial) de la fruta tratada vs. sin tratar. [mínimo, máximo].
 * ⚠️ PROVISORIO y deliberadamente conservador (máximo 5 días hasta tener datos
 * de ensayos). Usa `null` para ocultar la frase de días.
 */
export const SHELF_LIFE_EXTRA_DAYS: [number, number] | null = [2, 4];

/**
 * Fracción de la pérdida de cada causa que se evita con esos días adicionales.
 * [escenario conservador, escenario optimista], entre 0 y 1.
 * ⚠️ PROVISORIO y conservador, coherente con SHELF_LIFE_EXTRA_DAYS.
 */
export const RECOVERY_RATES: Record<LossCauseKey, [number, number]> = {
  spoiled: [0.2, 0.4],
  discounted: [0.15, 0.3],
  diverted: [0.1, 0.25],
  oversupply: [0.1, 0.2],
  other: [0.05, 0.15],
};

/**
 * Parte del valor recuperado que se considera un precio razonable para el
 * producto. Uso interno: no se muestra en la web ni en el PDF; solo se guarda
 * con cada simulación para el equipo comercial.
 */
export const PRICE_VALUE_SHARE: [number, number] = [0.2, 0.35];

// ---------------------------------------------------------------------------
// Datos de rubro (para mostrar que entendemos el negocio)
// ---------------------------------------------------------------------------

/** Tipo de cambio aproximado, solo para convertir los precios sugeridos a CLP. */
export const USD_TO_CLP = 950;

type FruitInfo = {
  /** Ventana típica de cosecha en Chile (texto). ⚠️ PROVISORIO */
  harvest: { es: string; en: string };
  /** Semanas del año de inicio y fin de cosecha (si inicio > fin, cruza el año). */
  harvestWeeks: [number, number] | null;
  /** Kilos por caja por defecto (editable por el usuario). ⚠️ PROVISORIO */
  kgPerBox: number;
  /** Destinos sugeridos (el usuario puede escribir otros). */
  destinations: { es: string; en: string }[];
  /** Precios sugeridos de venta normal, en US$/kg (se convierten a la unidad elegida). ⚠️ PROVISORIO */
  priceSuggestionsUsdKg: number[];
};

const OTHER_DESTINATIONS = [
  { es: "EE.UU.", en: "USA" },
  { es: "Europa", en: "Europe" },
  { es: "China", en: "China" },
  { es: "Corea del Sur", en: "South Korea" },
  { es: "Japón", en: "Japan" },
  { es: "Latinoamérica", en: "Latin America" },
  { es: "Mercado interno", en: "Domestic market" },
];

export const FRUIT_INFO: Record<Fruit, FruitInfo> = {
  avocado: {
    harvest: { es: "agosto a marzo", en: "August to March" },
    harvestWeeks: [32, 12],
    kgPerBox: 4,
    destinations: [
      { es: "Holanda", en: "Netherlands" },
      { es: "España", en: "Spain" },
      { es: "Reino Unido", en: "United Kingdom" },
      { es: "EE.UU.", en: "USA" },
      { es: "China", en: "China" },
      { es: "Argentina", en: "Argentina" },
      { es: "Mercado interno", en: "Domestic market" },
    ],
    priceSuggestionsUsdKg: [1.5, 2, 2.5, 3],
  },
  cherry: {
    harvest: { es: "noviembre a enero", en: "November to January" },
    harvestWeeks: [44, 4],
    kgPerBox: 5,
    destinations: [
      { es: "China", en: "China" },
      { es: "Corea del Sur", en: "South Korea" },
      { es: "Taiwán", en: "Taiwan" },
      { es: "EE.UU.", en: "USA" },
      { es: "Brasil", en: "Brazil" },
      { es: "Mercado interno", en: "Domestic market" },
    ],
    priceSuggestionsUsdKg: [4, 5, 6, 8],
  },
  other: {
    harvest: { es: "", en: "" },
    harvestWeeks: null,
    kgPerBox: 5,
    destinations: OTHER_DESTINATIONS,
    priceSuggestionsUsdKg: [1, 2, 3, 5],
  },
};

/** Volúmenes sugeridos por unidad. */
export const VOLUME_SUGGESTIONS = { ton: [100, 300, 500, 1000], kg: [100000, 300000, 500000], box: [20000, 50000, 100000] };

/** % del volumen sugeridos para las pérdidas. */
export const LOSS_PCT_SUGGESTIONS = [2, 5, 10, 15];

/** Precio obtenido sugerido como fracción del precio de venta normal. */
export const LOSS_PRICE_FRACTIONS: Record<Exclude<LossCauseKey, "spoiled">, number[]> = {
  discounted: [0.5, 0.7, 0.85],
  diverted: [0.2, 0.3, 0.5],
  oversupply: [0.6, 0.75, 0.9],
  other: [0.5, 0.75],
};

/** Regiones de Chile para el formulario de contacto. */
export const REGIONS = [
  "Arica y Parinacota",
  "Tarapacá",
  "Antofagasta",
  "Atacama",
  "Coquimbo",
  "Valparaíso",
  "Metropolitana",
  "O'Higgins",
  "Maule",
  "Ñuble",
  "Biobío",
  "La Araucanía",
  "Los Ríos",
  "Los Lagos",
  "Aysén",
  "Magallanes",
];

/** Frutales para "¿qué frutales manejas?" (selección múltiple). */
export const GROWER_FRUITS: { es: string; en: string }[] = [
  { es: "Palta", en: "Avocado" },
  { es: "Cereza", en: "Cherry" },
  { es: "Arándano", en: "Blueberry" },
  { es: "Uva de mesa", en: "Table grape" },
  { es: "Manzana", en: "Apple" },
  { es: "Pera", en: "Pear" },
  { es: "Kiwi", en: "Kiwi" },
  { es: "Cítricos", en: "Citrus" },
  { es: "Carozos", en: "Stone fruit" },
  { es: "Otro", en: "Other" },
];
