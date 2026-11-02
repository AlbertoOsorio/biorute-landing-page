import {
  ETHYLOCK_RECOVERY,
  ETHYLOCK_VALUE_SHARE,
  LossCauseKey,
} from "./config";

export type Currency = "USD" | "CLP";
export type Fruit = "avocado" | "cherry" | "other";

export type PricePoint = { id: string; week: string; price: string };

export type LossInput = { pct: string; price: string };

/** Lo que el usuario escribe, tal cual (strings) para no perder lo tecleado. */
export type SimulatorInputs = {
  fruit: Fruit;
  fruitOther: string;
  currency: Currency;
  volumeTons: string;
  bestPrice: string;
  bestWeek: string;
  worstPrice: string;
  worstWeek: string;
  avgPrice: string;
  extraPoints: PricePoint[];
  losses: Record<LossCauseKey, LossInput>;
  otherLabel: string;
};

export const LOSS_KEYS: LossCauseKey[] = [
  "spoiled",
  "discounted",
  "diverted",
  "oversupply",
  "other",
];

export const emptyInputs = (): SimulatorInputs => ({
  fruit: "avocado",
  fruitOther: "",
  currency: "USD",
  volumeTons: "",
  bestPrice: "",
  bestWeek: "",
  worstPrice: "",
  worstWeek: "",
  avgPrice: "",
  extraPoints: [],
  losses: {
    spoiled: { pct: "", price: "0" },
    discounted: { pct: "", price: "" },
    diverted: { pct: "", price: "" },
    oversupply: { pct: "", price: "" },
    other: { pct: "", price: "" },
  },
  otherLabel: "",
});

export const exampleInputs = (): SimulatorInputs => ({
  fruit: "avocado",
  fruitOther: "",
  currency: "USD",
  volumeTons: "500",
  bestPrice: "3.2",
  bestWeek: "38",
  worstPrice: "1.4",
  worstWeek: "50",
  avgPrice: "2.3",
  extraPoints: [
    { id: "ex1", week: "34", price: "2.6" },
    { id: "ex2", week: "42", price: "2.4" },
    { id: "ex3", week: "46", price: "1.9" },
  ],
  losses: {
    spoiled: { pct: "6", price: "0" },
    discounted: { pct: "12", price: "1.5" },
    diverted: { pct: "8", price: "0.6" },
    oversupply: { pct: "10", price: "1.6" },
    other: { pct: "", price: "" },
  },
  otherLabel: "",
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

export type CauseResult = {
  key: LossCauseKey;
  pct: number;
  volumeKg: number;
  price: number;
  revenue: number;
  loss: number;
  recoveredLow: number;
  recoveredHigh: number;
};

export type SimulatorResults = {
  volumeKg: number | null;
  refPrice: number | null;
  pricePoints: { week: number; price: number; kind: "best" | "worst" | "extra" }[];
  seasonSpread: number | null;
  causes: CauseResult[];
  lossPctTotal: number;
  normalPct: number;
  pctOverflow: boolean;
  potentialRevenue: number | null;
  actualRevenue: number | null;
  totalLoss: number | null;
  lossShare: number | null;
  recoveredLow: number | null;
  recoveredHigh: number | null;
  valuePerKgLow: number | null;
  valuePerKgHigh: number | null;
  ethylockPriceLow: number | null;
  ethylockPriceHigh: number | null;
  ready: boolean;
};

export function computeResults(inp: SimulatorInputs): SimulatorResults {
  const c = inp.currency;
  const tons = parseNum(inp.volumeTons, "USD");
  const volumeKg = tons != null && tons > 0 ? tons * 1000 : null;
  const avg = parseNum(inp.avgPrice, c);
  const best = parseNum(inp.bestPrice, c);
  const worst = parseNum(inp.worstPrice, c);
  const refPrice = avg != null && avg > 0 ? avg : null;

  const pricePoints: SimulatorResults["pricePoints"] = [];
  const pushPoint = (w: string, p: string, kind: "best" | "worst" | "extra") => {
    const week = parseNum(w);
    const price = parseNum(p, c);
    if (week != null && price != null && week >= 1 && week <= 53) {
      pricePoints.push({ week: Math.round(week), price, kind });
    }
  };
  pushPoint(inp.bestWeek, inp.bestPrice, "best");
  pushPoint(inp.worstWeek, inp.worstPrice, "worst");
  inp.extraPoints.forEach((pt) => pushPoint(pt.week, pt.price, "extra"));
  pricePoints.sort((a, b) => a.week - b.week);

  const seasonSpread = best != null && worst != null ? best - worst : null;

  let lossPctTotal = 0;
  const causes: CauseResult[] = LOSS_KEYS.map((key) => {
    const li = inp.losses[key];
    const pct = Math.max(0, Math.min(100, parseNum(li.pct) ?? 0));
    lossPctTotal += pct;
    const price = key === "spoiled" ? 0 : Math.max(0, parseNum(li.price, c) ?? 0);
    const volume = volumeKg != null ? (volumeKg * pct) / 100 : 0;
    const revenue = volume * price;
    const loss = refPrice != null ? volume * Math.max(refPrice - price, 0) : 0;
    const [lo, hi] = ETHYLOCK_RECOVERY[key];
    return {
      key,
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
  const ready = volumeKg != null && refPrice != null && !pctOverflow;

  if (!ready) {
    return {
      volumeKg,
      refPrice,
      pricePoints,
      seasonSpread,
      causes,
      lossPctTotal,
      normalPct,
      pctOverflow,
      potentialRevenue: null,
      actualRevenue: null,
      totalLoss: null,
      lossShare: null,
      recoveredLow: null,
      recoveredHigh: null,
      valuePerKgLow: null,
      valuePerKgHigh: null,
      ethylockPriceLow: null,
      ethylockPriceHigh: null,
      ready,
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
    volumeKg,
    refPrice,
    pricePoints,
    seasonSpread,
    causes,
    lossPctTotal,
    normalPct,
    pctOverflow,
    potentialRevenue,
    actualRevenue,
    totalLoss,
    lossShare: potentialRevenue > 0 ? totalLoss / potentialRevenue : null,
    recoveredLow,
    recoveredHigh,
    valuePerKgLow,
    valuePerKgHigh,
    ethylockPriceLow: valuePerKgLow * ETHYLOCK_VALUE_SHARE[0],
    ethylockPriceHigh: valuePerKgHigh * ETHYLOCK_VALUE_SHARE[1],
    ready,
  };
}

export function formatMoney(n: number | null, currency: Currency, perKg = false): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  let digits = 0;
  if (currency === "USD") digits = perKg || abs < 100 ? 2 : 0;
  if (currency === "CLP") digits = perKg && abs < 10 ? 1 : 0;
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
