/**
 * Supuestos comerciales del simulador.
 *
 * Todo lo que ingresa el productor viene del formulario; lo único que BioRoute
 * define son estos supuestos sobre el efecto de Ethylock. Ajusta los valores aquí
 * y el simulador (gráficos, rangos y textos) se actualiza solo.
 */

export type LossCauseKey =
  | "spoiled"
  | "discounted"
  | "diverted"
  | "oversupply"
  | "other";

/**
 * Fracción de la pérdida de cada causa que Ethylock puede recuperar.
 * [escenario conservador, escenario optimista], valores entre 0 y 1.
 */
export const ETHYLOCK_RECOVERY: Record<LossCauseKey, [number, number]> = {
  // Fruta que se pudrió o se descartó: el efecto antimicrobiano y anti-etileno
  // es el más directo.
  spoiled: [0.4, 0.7],
  // Vendida con descuento por madurez, deshidratación o rechazo de calidad.
  discounted: [0.3, 0.6],
  // Desviada a industria, mercado interno u otra aplicación.
  diverted: [0.2, 0.5],
  // Vendida en semanas de sobreoferta por no poder esperar o llegar a otro mercado.
  oversupply: [0.2, 0.45],
  // Otras causas indicadas por el productor.
  other: [0.1, 0.3],
};

/**
 * Parte del valor recuperado que se considera un precio razonable para Ethylock
 * (el productor se queda con el resto). [mínimo, máximo] entre 0 y 1.
 */
export const ETHYLOCK_VALUE_SHARE: [number, number] = [0.2, 0.35];
