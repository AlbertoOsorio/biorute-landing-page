/**
 * Supuestos comerciales del simulador.
 *
 * Todo lo que ingresa el productor viene del formulario; lo único que BioRoute
 * define son estos supuestos sobre el efecto de nuestra tecnología. Ajusta los valores aquí
 * y el simulador (gráficos, rangos y textos) se actualiza solo.
 *
 * Los textos de la web no nombran el producto ("nuestra tecnología"), así un
 * cambio de marca no requiere tocar el simulador.
 */

export type LossCauseKey =
  | "spoiled"
  | "discounted"
  | "diverted"
  | "oversupply"
  | "other";

/**
 * Supuesto base que explica todo el simulador: días adicionales de vida útil
 * (calidad comercial) de la fruta tratada vs. sin tratar. [mínimo, máximo].
 * Se muestra en la web en "¿De dónde sale este valor?".
 * ⚠️ VALOR PROVISORIO y deliberadamente conservador (máximo 5 días hasta tener
 * datos de ensayos). Reemplazar por el dato validado.
 * Usa `null` para ocultar la frase de días.
 */
export const SHELF_LIFE_EXTRA_DAYS: [number, number] | null = [2, 4];

/**
 * Fracción de la pérdida de cada causa que nuestra tecnología puede recuperar.
 * [escenario conservador, escenario optimista], valores entre 0 y 1.
 * Valores provisorios y conservadores, coherentes con SHELF_LIFE_EXTRA_DAYS.
 */
export const RECOVERY_RATES: Record<LossCauseKey, [number, number]> = {
  // Fruta que se pudrió o se descartó: el efecto antimicrobiano y anti-etileno
  // es el más directo.
  spoiled: [0.2, 0.4],
  // Vendida con descuento por madurez, deshidratación o rechazo de calidad.
  discounted: [0.15, 0.3],
  // Desviada a industria, mercado interno u otra aplicación.
  diverted: [0.1, 0.25],
  // Vendida en semanas de sobreoferta por no poder esperar o llegar a otro mercado.
  oversupply: [0.1, 0.2],
  // Otras causas indicadas por el productor.
  other: [0.05, 0.15],
};

/**
 * Parte del valor recuperado que se considera un precio razonable para el producto
 * (el productor se queda con el resto). Uso interno: no se muestra en la web,
 * solo se guarda con cada simulación para el equipo comercial. [mínimo, máximo] entre 0 y 1.
 */
export const PRICE_VALUE_SHARE: [number, number] = [0.2, 0.35];
