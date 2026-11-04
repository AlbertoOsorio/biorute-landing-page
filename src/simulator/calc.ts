import {
  FRUIT_INFO,
  PRICE_VALUE_SHARE,
  RECOVERY_RATES,
  type Fruit,
  type LossCauseKey,
} from "./config";

export type { Fruit } from "./config";
export type Currency = "USD" | "CLP";
/** Unidad en que el productor tiene sus datos. */
export type Unit = "kg" | "ton" | "box";
export type YesNo = "yes" | "no" | null;

export type PricePoint = { id: string; week: string; price: string };
export type Destination = { id: string; name: string; pct: string; price: string };

export type LossInput = {
  answer: YesNo;
  /** Cantidad afectada: en % del volumen o en la unidad de volumen. */
  amount: string;
  amountUnit: "pct" | "vol";
  /** Precio obtenido (en la unidad de precio elegida). */
  price: string;
};

/** Lo que el usuario escribe, tal cual (strings) para no perder lo tecleado. */
export type SimulatorInputs = {
  fruit: Fruit | null;
  fruitOther: string;
  currency: Currency;
  volume: string;
  volumeUnit: Unit;
  priceUnit: Unit;
  kgPerBox: string;
  avgPrice: string;
  destinations: Destination[];
  /** Paso opcional de variación de precio. */
  pricesEnabled: YesNo;
  bestPrice: string;
  bestWeek: string;
  worstPrice: string;
  worstWeek: string;
  extraPoints: PricePoint[];
  /** Solo para "otra" fruta (palta y cereza usan su ventana de cosecha). */
  crossesYear: boolean;
  losses: Record<LossCauseKey, LossInput>;
  otherLabel: string;
};

export const LOSS_KEYS: LossCauseKey[] = ["spoiled", "discounted", "diverted", "oversupply", "other"];

const emptyLoss = (): LossInput => ({ answer: null, amount: "", amountUnit: "pct", price: "" });

export const emptyInputs = (): SimulatorInputs => ({
  fruit: null,
  fruitOther: "",
  currency: "USD",
  volume: "",
  volumeUnit: "ton",
  priceUnit: "kg",
  kgPerBox: "",
  avgPrice: "",
  destinations: [],
  pricesEnabled: null,
  bestPrice: "",
  bestWeek: "",
  worstPrice: "",
  worstWeek: "",
  extraPoints: [],
  crossesYear: false,
  losses: {
    spoiled: emptyLoss(),
    discounted: emptyLoss(),
    diverted: emptyLoss(),
    oversupply: emptyLoss(),
    other: emptyLoss(),
  },
  otherLabel: "",
});

export const exampleInputs = (): SimulatorInputs => ({
  ...emptyInputs(),
  fruit: "avocado",
  volume: "500",
  avgPrice: "2.3",
  destinations: [
    { id: "d1", name: "Holanda", pct: "50", price: "2.5" },
    { id: "d2", name: "EE.UU.", pct: "30", price: "2.2" },
  ],
  pricesEnabled: "yes",
  bestPrice: "3.2",
  bestWeek: "38",
  worstPrice: "1.4",
  worstWeek: "6",
  extraPoints: [
    { id: "ex1", week: "44", price: "2.6" },
    { id: "ex2", week: "50", price: "2.1" },
  ],
  losses: {
    spoiled: { answer: "yes", amount: "6", amountUnit: "pct", price: "" },
    discounted: { answer: "yes", amount: "12", amountUnit: "pct", price: "1.5" },
    diverted: { answer: "yes", amount: "8", amountUnit: "pct", price: "0.6" },
    oversupply: { answer: "yes", amount: "10", amountUnit: "pct", price: "1.6" },
    other: { answer: "no", amount: "", amountUnit: "pct", price: "" },
  },
});

/**
 * Convierte texto a número aceptando coma decimal.
 * En CLP los puntos se interpretan como separador de miles (1.500 = 1500).
 */
export function parseNum(raw: string, currency: Currency = "USD"): number | null {
  if (raw == null) return null;
  let s = raw.trim().replace(/\s/g, "");
  if (!s) return null;
  if (currency === "CLP") s = s.replace(/\./g, "");
  s = s.replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Kilos por caja efectivos (lo ingresado o el valor por defecto de la fruta). */
export function boxKg(inp: SimulatorInputs): number {
  const v = parseNum(inp.kgPerBox);
  if (v != null && v > 0) return v;
  return FRUIT_INFO[inp.fruit ?? "other"].kgPerBox;
}

/** Kilos que hay en 1 unidad. */
export function kgPerUnit(unit: Unit, inp: SimulatorInputs): number {
  return unit === "kg" ? 1 : unit === "ton" ? 1000 : boxKg(inp);
}

/** Precio ingresado (en la unidad de precio) → precio por kg. */
export function priceToKg(raw: string, inp: SimulatorInputs): number | null {
  const p = parseNum(raw, inp.currency);
  return p == null ? null : p / kgPerUnit(inp.priceUnit, inp);
}

/** ¿La temporada cruza el año? (según la ventana de cosecha de la fruta) */
export function seasonCrossesYear(inp: SimulatorInputs): boolean {
  const w = FRUIT_INFO[inp.fruit ?? "other"].harvestWeeks;
  return w ? w[0] > w[1] : inp.crossesYear;
}

export type CauseResult = {
  key: LossCauseKey;
  answered: boolean;
  pct: number;
  volumeKg: number;
  /** Precio obtenido por kg. */
  price: number;
  revenue: number;
  loss: number;
  recoveredLow: number;
  recoveredHigh: number;
};

export type SimulatorResults = {
  volumeKg: number | null;
  /** Precio de venta normal por kg (ponderado por destinos si los hay). */
  refPrice: number | null;
  destinationsPct: number;
  destinationsOverflow: boolean;
  /** Puntos de precio por kg. */
  pricePoints: { week: number; price: number; kind: "best" | "worst" | "extra" }[];
  causes: CauseResult[];
  lossPctTotal: number;
  normalPct: number;
  pctOverflow: boolean;
  /** Valor de la temporada a precio de venta normal. */
  potentialRevenue: number | null;
  actualRevenue: number | null;
  totalLoss: number | null;
  lossShare: number | null;
  recoveredLow: number | null;
  recoveredHigh: number | null;
  valuePerKgLow: number | null;
  valuePerKgHigh: number | null;
  impliedPriceLow: number | null;
  impliedPriceHigh: number | null;
  /** Hay volumen y precio: se puede mostrar el valor de la temporada. */
  hasSeason: boolean;
  ready: boolean;
};

export function computeResults(inp: SimulatorInputs): SimulatorResults {
  const vol = parseNum(inp.volume);
  const volumeKg = vol != null && vol > 0 ? vol * kgPerUnit(inp.volumeUnit, inp) : null;
  const avg = priceToKg(inp.avgPrice, inp);

  // Precio de venta normal: promedio, refinado con los destinos ingresados.
  let destinationsPct = 0;
  let destWeighted = 0;
  for (const d of inp.destinations) {
    const pct = parseNum(d.pct);
    const price = priceToKg(d.price, inp);
    if (pct != null && pct > 0 && price != null && price > 0) {
      destinationsPct += pct;
      destWeighted += pct * price;
    }
  }
  const destinationsOverflow = destinationsPct > 100.0001;
  let refPrice: number | null = avg != null && avg > 0 ? avg : null;
  if (destinationsPct > 0 && !destinationsOverflow) {
    const rest = 100 - destinationsPct;
    if (rest <= 0.0001) refPrice = destWeighted / destinationsPct;
    else if (refPrice != null) refPrice = (destWeighted + rest * refPrice) / 100;
  }

  const pricePoints: SimulatorResults["pricePoints"] = [];
  if (inp.pricesEnabled === "yes") {
    const pushPoint = (w: string, p: string, kind: "best" | "worst" | "extra") => {
      const week = parseNum(w);
      const price = priceToKg(p, inp);
      if (week != null && price != null && week >= 1 && week <= 53) {
        pricePoints.push({ week: Math.round(week), price, kind });
      }
    };
    pushPoint(inp.bestWeek, inp.bestPrice, "best");
    pushPoint(inp.worstWeek, inp.worstPrice, "worst");
    inp.extraPoints.forEach((pt) => pushPoint(pt.week, pt.price, "extra"));
  }

  let lossPctTotal = 0;
  const causes: CauseResult[] = LOSS_KEYS.map((key) => {
    const li = inp.losses[key];
    const answered = li.answer === "yes";
    let pct = 0;
    if (answered) {
      const amount = parseNum(li.amount) ?? 0;
      if (li.amountUnit === "pct") pct = amount;
      else if (volumeKg) pct = ((amount * kgPerUnit(inp.volumeUnit, inp)) / volumeKg) * 100;
      pct = Math.max(0, Math.min(100, pct));
    }
    lossPctTotal += pct;
    const price = key === "spoiled" || !answered ? 0 : Math.max(0, priceToKg(li.price, inp) ?? 0);
    const volume = volumeKg != null ? (volumeKg * pct) / 100 : 0;
    const revenue = volume * price;
    // Mientras falte el precio obtenido, la causa aún no suma pérdida
    const priceMissing = answered && key !== "spoiled" && li.price.trim() === "";
    const loss = refPrice != null && !priceMissing ? volume * Math.max(refPrice - price, 0) : 0;
    const [lo, hi] = RECOVERY_RATES[key];
    return {
      key,
      answered,
      pct,
      volumeKg: volume,
      price,
      revenue,
      loss,
      recoveredLow: loss * lo,
      recoveredHigh: loss * hi,
    };
  });

  const pctOverflow = lossPctTotal > 100.0001;
  const normalPct = Math.max(0, 100 - lossPctTotal);
  const hasSeason = volumeKg != null && refPrice != null;
  const ready = hasSeason && !pctOverflow;

  const base = {
    volumeKg,
    refPrice,
    destinationsPct,
    destinationsOverflow,
    pricePoints,
    causes,
    lossPctTotal,
    normalPct,
    pctOverflow,
    hasSeason,
    ready,
  };

  if (!ready || volumeKg == null || refPrice == null) {
    return {
      ...base,
      potentialRevenue: hasSeason ? volumeKg! * refPrice! : null,
      actualRevenue: null,
      totalLoss: null,
      lossShare: null,
      recoveredLow: null,
      recoveredHigh: null,
      valuePerKgLow: null,
      valuePerKgHigh: null,
      impliedPriceLow: null,
      impliedPriceHigh: null,
    };
  }

  const potentialRevenue = volumeKg * refPrice;
  const normalRevenue = ((volumeKg * normalPct) / 100) * refPrice;
  const actualRevenue = normalRevenue + causes.reduce((s, x) => s + x.revenue, 0);
  const totalLoss = causes.reduce((s, x) => s + x.loss, 0);
  const recoveredLow = causes.reduce((s, x) => s + x.recoveredLow, 0);
  const recoveredHigh = causes.reduce((s, x) => s + x.recoveredHigh, 0);
  const valuePerKgLow = recoveredLow / volumeKg;
  const valuePerKgHigh = recoveredHigh / volumeKg;

  return {
    ...base,
    potentialRevenue,
    actualRevenue,
    totalLoss,
    lossShare: potentialRevenue > 0 ? totalLoss / potentialRevenue : null,
    recoveredLow,
    recoveredHigh,
    valuePerKgLow,
    valuePerKgHigh,
    impliedPriceLow: valuePerKgLow * PRICE_VALUE_SHARE[0],
    impliedPriceHigh: valuePerKgHigh * PRICE_VALUE_SHARE[1],
  };
}

export function formatMoney(n: number | null, currency: Currency, perUnit = false): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  let digits = 0;
  if (currency === "USD") digits = perUnit || abs < 100 ? 2 : 0;
  if (currency === "CLP") digits = perUnit && abs < 10 ? 1 : 0;
  const s = new Intl.NumberFormat(currency === "CLP" ? "es-CL" : "en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
  return `${currency === "USD" ? "US$" : "$"}${s}`;
}

export function formatNumber(n: number | null, digits = 0, lang: "es" | "en" = "es"): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(lang === "es" ? "es-CL" : "en-US", {
    maximumFractionDigits: digits,
  }).format(n);
}

/** Formatea un número para escribirlo en un campo (sin separador de miles). */
export function toInputString(n: number, currency: Currency): string {
  const digits = currency === "CLP" ? 0 : n < 10 ? 2 : n < 100 ? 1 : 0;
  return String(Number(n.toFixed(digits)));
}

// ---------------------------------------------------------------------------
// Validaciones de coherencia: evitan datos ilógicos entre pasos
// ---------------------------------------------------------------------------

export type Issue =
  | { code: "bestBelowWorst" }
  | { code: "avgAboveBest"; avg: number; best: number }
  | { code: "avgBelowWorst"; avg: number; worst: number }
  | { code: "pointAboveBest"; week: number }
  | { code: "pointBelowWorst"; week: number }
  | { code: "weekConflict"; week: number }
  | { code: "weekRange" }
  | { code: "destDuplicate"; name: string }
  | { code: "destAboveBest"; name: string }
  | { code: "destBelowWorst"; name: string }
  | { code: "amountOverVolume" }
  | { code: "priceNotLower"; normal: number };

/** Paso de precios: mejor ≥ promedio ≥ peor, semanas sin precios contradictorios. */
export function priceIssues(inp: SimulatorInputs, r: SimulatorResults): Issue[] {
  if (inp.pricesEnabled !== "yes") return [];
  const issues: Issue[] = [];
  const best = priceToKg(inp.bestPrice, inp);
  const worst = priceToKg(inp.worstPrice, inp);
  if (best != null && worst != null && best < worst) issues.push({ code: "bestBelowWorst" });
  if (r.refPrice != null) {
    if (best != null && r.refPrice > best * 1.0001) issues.push({ code: "avgAboveBest", avg: r.refPrice, best });
    if (worst != null && r.refPrice < worst * 0.9999) issues.push({ code: "avgBelowWorst", avg: r.refPrice, worst });
  }
  // Destinos fuera del rango mejor–peor
  for (const d of inp.destinations) {
    const p = priceToKg(d.price, inp);
    if (p == null || !d.name.trim()) continue;
    if (best != null && p > best * 1.0001) issues.push({ code: "destAboveBest", name: d.name.trim() });
    if (worst != null && p < worst * 0.9999) issues.push({ code: "destBelowWorst", name: d.name.trim() });
  }
  // Semanas: rango válido y un solo precio por semana
  const points: { week: string; price: string; extra: boolean }[] = [
    { week: inp.bestWeek, price: inp.bestPrice, extra: false },
    { week: inp.worstWeek, price: inp.worstPrice, extra: false },
    ...inp.extraPoints.map((p) => ({ week: p.week, price: p.price, extra: true })),
  ];
  const byWeek = new Map<number, Set<number>>();
  let outOfRange = false;
  for (const pt of points) {
    const w = parseNum(pt.week);
    if (w == null) continue;
    if (w < 1 || w > 52) {
      outOfRange = true;
      continue;
    }
    const p = priceToKg(pt.price, inp);
    if (p == null) continue;
    const set = byWeek.get(w) ?? new Set<number>();
    set.add(Math.round(p * 10000));
    byWeek.set(w, set);
    if (pt.extra && best != null && p > best * 1.0001) issues.push({ code: "pointAboveBest", week: w });
    if (pt.extra && worst != null && p < worst * 0.9999) issues.push({ code: "pointBelowWorst", week: w });
  }
  if (outOfRange) issues.push({ code: "weekRange" });
  byWeek.forEach((prices, w) => {
    if (prices.size > 1) issues.push({ code: "weekConflict", week: w });
  });
  return issues;
}

/** Paso de destinos: nombres repetidos. */
export function destinationIssues(inp: SimulatorInputs): Issue[] {
  const seen = new Set<string>();
  const issues: Issue[] = [];
  for (const d of inp.destinations) {
    const n = d.name.trim();
    if (!n) continue;
    const k = n.toLowerCase();
    if (seen.has(k)) issues.push({ code: "destDuplicate", name: n });
    seen.add(k);
  }
  return issues;
}

/** Paso de una pérdida: cantidad dentro del volumen y precio menor al normal. */
export function lossIssues(inp: SimulatorInputs, r: SimulatorResults, key: LossCauseKey): Issue[] {
  const l = inp.losses[key];
  if (l.answer !== "yes") return [];
  const issues: Issue[] = [];
  const amount = parseNum(l.amount);
  if (amount != null) {
    const over =
      l.amountUnit === "pct"
        ? amount > 100
        : r.volumeKg != null && amount * kgPerUnit(inp.volumeUnit, inp) > r.volumeKg * 1.0001;
    if (over) issues.push({ code: "amountOverVolume" });
  }
  if (key !== "spoiled" && r.refPrice != null) {
    const p = priceToKg(l.price, inp);
    if (p != null && p >= r.refPrice) issues.push({ code: "priceNotLower", normal: r.refPrice });
  }
  return issues;
}
