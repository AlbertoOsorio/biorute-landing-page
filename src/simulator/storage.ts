import { supabase, supabaseConfigured } from "../lib/supabase";
import { formatMoney, formatNumber, type SimulatorInputs, type SimulatorResults } from "./calc";

/**
 * Guarda la simulación en Supabase mediante la función `save_simulation`
 * (ver DOCUMENTATION.md → Simulador). Cada visita tiene un id propio; los
 * guardados sucesivos actualizan la misma fila, así quedan registrados los
 * datos aunque la persona no llegue a dejar su contacto.
 */

export type SimulatorContact = {
  name: string;
  company: string;
  email: string;
  phone: string;
  message: string;
};

export function newSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback RFC4122 v4
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function summarize(r: SimulatorResults) {
  return {
    volume_kg: r.volumeKg,
    ref_price: r.refPrice,
    potential_revenue: r.potentialRevenue,
    actual_revenue: r.actualRevenue,
    total_loss: r.totalLoss,
    loss_share: r.lossShare,
    recovered_low: r.recoveredLow,
    recovered_high: r.recoveredHigh,
    implied_price_low: r.impliedPriceLow,
    implied_price_high: r.impliedPriceHigh,
    causes: r.causes.map((c) => ({ key: c.key, pct: c.pct, price: c.price, loss: c.loss })),
  };
}

export async function saveSimulation(
  id: string,
  inputs: SimulatorInputs,
  results: SimulatorResults,
  language: string,
  contact: SimulatorContact | null = null
): Promise<boolean> {
  if (!supabaseConfigured || !supabase) {
    // Visible también en producción (F12 → Console) para diagnosticar.
    console.warn(
      "[simulador] Supabase NO configurado: faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en este deploy. Datos no guardados."
    );
    if (import.meta.env.DEV) {
      console.info("[simulador] datos que se habrían guardado", {
        id,
        inputs,
        results: summarize(results),
        contact,
      });
    }
    return true;
  }
  const { error } = await supabase.rpc("save_simulation", {
    p_id: id,
    p_inputs: inputs,
    p_results: summarize(results),
    p_contact: contact,
    p_language: language,
  });
  if (error) {
    console.error("[simulador] Supabase rechazó el guardado:", error.message, error);
  } else {
    console.info("[simulador] guardado OK en Supabase");
  }
  return !error;
}

const FRUIT_ES = { avocado: "Palta", cherry: "Cereza", other: "Otra" } as const;

/**
 * Agrega el contacto del simulador a `contact_submissions`, la misma tabla del
 * formulario /contacto, para tener todos los interesados en un solo lugar.
 * El mensaje incluye un resumen de la simulación y su id (columna `id` de
 * `simulator_submissions`) para ver el detalle completo.
 */
export async function saveSimulatorContact(
  simulationId: string,
  inputs: SimulatorInputs,
  results: SimulatorResults,
  contact: SimulatorContact
): Promise<boolean> {
  const cur = inputs.currency;
  const fruit =
    inputs.fruit === "other" && inputs.fruitOther ? inputs.fruitOther : FRUIT_ES[inputs.fruit];
  const lines = [
    "[Simulador]",
    contact.company && `Empresa: ${contact.company}`,
    contact.phone && `Teléfono: ${contact.phone}`,
    contact.message && `Comentario: ${contact.message}`,
    `Fruta: ${fruit} · Volumen: ${inputs.volumeTons || "—"} t · Moneda: ${cur}`,
    results.ready &&
      `Ingreso perdido: ${formatMoney(results.totalLoss, cur)} (${formatNumber(
        (results.lossShare ?? 0) * 100,
        1
      )}%)`,
    results.ready &&
      `Recuperable: ${formatMoney(results.recoveredLow, cur)} – ${formatMoney(results.recoveredHigh, cur)}`,
    `Simulación: ${simulationId}`,
  ].filter(Boolean);
  const row = { name: contact.name, email: contact.email, message: lines.join("\n") };

  if (!supabaseConfigured || !supabase) {
    console.warn("[contacto] Supabase NO configurado: contacto no guardado.", row);
    return true;
  }
  const { error } = await supabase.from("contact_submissions").insert([row]);
  if (error) {
    console.error("[contacto] Supabase rechazó el guardado:", error.message, error);
  } else {
    console.info("[contacto] contacto guardado OK en Supabase");
  }
  return !error;
}
