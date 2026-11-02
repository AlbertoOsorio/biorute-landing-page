import { supabase, supabaseConfigured } from "../lib/supabase";
import type { SimulatorInputs, SimulatorResults } from "./calc";

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
    ethylock_price_low: r.ethylockPriceLow,
    ethylock_price_high: r.ethylockPriceHigh,
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
