/**
 * Reporte PDF del simulador, generado en el navegador con jsPDF.
 * Siempre en español. Los gráficos se dibujan como vectores (nítidos al imprimir).
 * Este módulo se carga solo cuando la persona pide su reporte (import dinámico).
 */
import { jsPDF } from "jspdf";
import logoUrl from "../imagen/logoBioRoute.png";
import {
  kgPerUnit,
  parseNum,
  priceToKg,
  seasonCrossesYear,
  type Currency,
  type SimulatorInputs,
  type SimulatorResults,
} from "./calc";
import { GROWER_FRUITS, RECOVERY_RATES, SHELF_LIFE_EXTRA_DAYS } from "./config";
import { simulatorText } from "./i18n";
import type { SimulatorContact } from "./storage";

type RGB = [number, number, number];
const INK: RGB = [36, 70, 41];
const SOFT: RGB = [95, 115, 98];
const GRID: RGB = [222, 226, 218];
const RED: RGB = [181, 86, 58];
const RED_SOFT: RGB = [200, 105, 76];
const GREEN: RGB = [62, 122, 77];
const GREEN_MID: RGB = [127, 192, 143];
const GREEN_LIGHT: RGB = [169, 205, 176];
const GREEN_PALE: RGB = [214, 235, 217];
const NEUTRAL: RGB = [201, 195, 180];
const CREAM: RGB = [249, 243, 231];
const CARD: RGB = [255, 253, 248];

const t = simulatorText.es;

async function loadLogo(): Promise<{ data: string; w: number; h: number } | null> {
  try {
    const blob = await (await fetch(logoUrl)).blob();
    const data = await new Promise<string>((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result as string);
      fr.onerror = rej;
      fr.readAsDataURL(blob);
    });
    const img = new Image();
    img.src = data;
    await img.decode();
    return { data, w: img.naturalWidth, h: img.naturalHeight };
  } catch {
    return null;
  }
}

export async function downloadReport(opts: {
  inputs: SimulatorInputs;
  results: SimulatorResults;
  contact: SimulatorContact;
}) {
  const { inputs, results: r, contact } = opts;
  const cur: Currency = inputs.currency;
  const prefix = cur === "USD" ? "US$" : "$";

  // --- Formatos en español (es-CL)
  const num = (n: number, d = 0) =>
    new Intl.NumberFormat("es-CL", { maximumFractionDigits: d, minimumFractionDigits: 0 }).format(n);
  const money = (n: number | null) => {
    if (n == null || !Number.isFinite(n)) return "—";
    const d = cur === "USD" && Math.abs(n) < 100 ? 2 : 0;
    return prefix + new Intl.NumberFormat("es-CL", { maximumFractionDigits: d, minimumFractionDigits: d }).format(n);
  };
  const moneyShort = (n: number) =>
    prefix + new Intl.NumberFormat("es-CL", { notation: "compact", maximumFractionDigits: 1 }).format(n);
  const pf = kgPerUnit(inputs.priceUnit, inputs);
  const perUnit = t.perUnit[inputs.priceUnit];
  const unitPrice = (perKg: number | null) => {
    if (perKg == null || !Number.isFinite(perKg)) return "—";
    const v = perKg * pf;
    const d = cur === "USD" ? 2 : v < 10 ? 1 : 0;
    return prefix + new Intl.NumberFormat("es-CL", { maximumFractionDigits: d, minimumFractionDigits: d }).format(v) + perUnit;
  };
  const pct = (n: number, d = 0) => `${num(n, d)}%`;
  const fruitName =
    inputs.fruit === "other" ? inputs.fruitOther || t.fruits.other : inputs.fruit ? t.fruits[inputs.fruit] : "—";
  const causeName = (k: SimulatorResults["causes"][number]["key"]) =>
    k === "other" && inputs.otherLabel ? inputs.otherLabel : t.causes[k].title;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const M = 18;
  const CW = W - 2 * M;
  const BOTTOM = 280;
  let y = M;

  const ensure = (h: number) => {
    if (y + h > BOTTOM) {
      doc.addPage();
      y = M;
    }
  };
  const font = (size: number, bold = false, color: RGB = INK) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };
  const text = (
    s: string,
    size: number,
    opt: { bold?: boolean; color?: RGB; gap?: number; x?: number; width?: number } = {}
  ) => {
    font(size, opt.bold, opt.color);
    const lines = doc.splitTextToSize(s, opt.width ?? CW) as string[];
    const lh = size * 0.42;
    ensure(lines.length * lh);
    doc.text(lines, opt.x ?? M, y + lh * 0.8);
    y += lines.length * lh + (opt.gap ?? 2);
  };
  const heading = (s: string, need = 20) => {
    ensure(need);
    y += 5;
    text(s, 13, { bold: true, gap: 3 });
  };
  const legend = (items: [RGB, string][], x0: number, yy: number, color: RGB = SOFT) => {
    let x = x0;
    font(7.5, false, color);
    for (const [c, label] of items) {
      doc.setFillColor(...c);
      doc.rect(x, yy - 2.2, 2.6, 2.6, "F");
      doc.text(label, x + 3.6, yy);
      x += 3.6 + doc.getTextWidth(label) + 6;
    }
  };

  // Ejes Y genéricos para gráficos de barras/líneas
  const niceMax = (v: number) => {
    if (v <= 0) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
  };
  const yAxis = (
    x: number,
    top: number,
    h: number,
    w: number,
    max: number,
    fmt: (v: number) => string,
    min = 0
  ) => {
    font(7, false, SOFT);
    doc.setDrawColor(...GRID);
    doc.setLineWidth(0.2);
    for (let i = 0; i <= 4; i++) {
      const v = min + ((max - min) * i) / 4;
      const yy = top + h - (h * i) / 4;
      doc.line(x, yy, x + w, yy);
      doc.text(fmt(v), x - 2, yy + 1, { align: "right" });
    }
  };

  // =====================================================================
  // Encabezado
  // =====================================================================
  const logo = await loadLogo();
  if (logo) {
    const h = 11;
    doc.addImage(logo.data, "PNG", M, y, (logo.w / logo.h) * h, h);
  }
  font(9, false, SOFT);
  doc.text(`${t.pdfDate}: ${new Date().toLocaleDateString("es-CL")}`, W - M, y + 4, { align: "right" });
  y += 18;
  // Personalizado con los datos de quien lo genera
  const owner = contact.company.trim() || contact.name.trim();
  const docTitle = owner ? `Diagnóstico BioRoute | ${owner}` : "Diagnóstico BioRoute";
  text(docTitle, 20, { bold: true, gap: 1 });
  text(t.pdfTitle, 11, { color: GREEN, bold: true, gap: 4 });
  const meta: [string, string][] = [
    ["Generado por", [contact.name.trim(), contact.email.trim()].filter(Boolean).join(" · ")],
    ["Empresa / predio", contact.company.trim()],
    // Región y frutales en español aunque se hayan elegido con el sitio en inglés
    ["Región", contact.region === simulatorText.en.regionOther ? t.regionOther : contact.region],
    [
      "Frutales",
      contact.fruits.map((f) => GROWER_FRUITS.find((g) => g.en === f || g.es === f)?.es ?? f).join(", "),
    ],
    ["Evaluación", `${fruitName} · ${num(parseNum(inputs.volume) ?? 0)} ${t.unitsShort[inputs.volumeUnit]}`],
  ];
  for (const [k, v] of meta) {
    if (!v) continue;
    font(9, false, SOFT);
    doc.text(k, M, y + 3.5);
    font(9, true, INK);
    doc.text(doc.splitTextToSize(v, CW - 35) as string[], M + 35, y + 3.5);
    y += 5;
  }
  y += 4;
  doc.setProperties({ title: docTitle, subject: t.pdfTitle, author: "BioRoute", creator: "BioRoute" });

  // =====================================================================
  // Resumen destacado (como el banner de la web)
  // =====================================================================
  const total = r.totalLoss ?? 0;
  const low = r.recoveredLow ?? 0;
  const high = r.recoveredHigh ?? 0;
  ensure(62);
  const boxY = y;
  doc.setFillColor(...INK);
  doc.roundedRect(M, boxY, CW, 58, 3, 3, "F");
  y = boxY + 7;
  text(`${t.resultTable.toUpperCase()}`, 8.5, { color: CREAM, x: M + 7, width: CW - 14, gap: 0.5 });
  text(`${money(total)}  ·  ${t.resultTableHelp(pct((r.lossShare ?? 0) * 100, 1))}`, 13, {
    bold: true,
    color: CREAM,
    x: M + 7,
    width: CW - 14,
    gap: 4,
  });
  text(t.recovered.toUpperCase(), 8.5, { color: CREAM, x: M + 7, width: CW - 14, gap: 0.5 });
  text(`${money(low)} – ${money(high)}`, 22, { bold: true, color: CREAM, x: M + 7, width: CW - 14, gap: 0 });
  text(t.perSeason, 10, { color: CREAM, x: M + 7, width: CW - 14, gap: 3 });
  if (total > 0) {
    const bx = M + 7;
    const bw = CW - 14;
    const by = boxY + 47;
    doc.setFillColor(...RED_SOFT);
    doc.rect(bx, by, bw, 3.5, "F");
    doc.setFillColor(...GREEN_PALE);
    doc.rect(bx, by, (high / total) * bw, 3.5, "F");
    doc.setFillColor(...GREEN_MID);
    doc.rect(bx, by, (low / total) * bw, 3.5, "F");
    legend(
      [
        [GREEN_MID, t.legendRecLow],
        [GREEN_PALE, t.legendRecHigh],
        [RED_SOFT, t.legendKept],
      ],
      bx,
      by + 8,
      CREAM
    );
  }
  y = boxY + 62;

  // Tres indicadores
  if (total > 0 && r.refPrice) {
    ensure(26);
    const sw = (CW - 8) / 3;
    const stats: [string, string, string?][] = [
      [t.shareLabel, `${pct((low / total) * 100)} – ${pct((high / total) * 100)}`],
      [
        t.upliftLabel,
        `${unitPrice(r.refPrice + (r.valuePerKgLow ?? 0))} – ${unitPrice(r.refPrice + (r.valuePerKgHigh ?? 0))}`,
        `${t.today}: ${unitPrice(r.refPrice)}`,
      ],
      [t.tonsLabel, `${num(low / r.refPrice / 1000)} – ${num(high / r.refPrice / 1000)} t`],
    ];
    stats.forEach(([label, value, sub], i) => {
      const x = M + i * (sw + 4);
      doc.setFillColor(...CARD);
      doc.setDrawColor(...GRID);
      doc.roundedRect(x, y, sw, 23, 2, 2, "FD");
      font(7.5, false, SOFT);
      doc.text(doc.splitTextToSize(label, sw - 6) as string[], x + 3, y + 5);
      font(value.length > 18 ? 9 : 11.5, true, GREEN);
      doc.text(doc.splitTextToSize(value, sw - 6) as string[], x + 3, y + 15);
      if (sub) {
        font(7, false, SOFT);
        doc.text(sub, x + 3, y + 21);
      }
    });
    y += 27;
  }
  text(t.grossNote, 8.5, { color: SOFT, gap: 2 });

  // =====================================================================
  // Tu temporada
  // =====================================================================
  heading(t.pdfSeason, 50);
  const rows: [string, string][] = [
    [t.pdfFruit, fruitName],
    [
      t.pdfVolume,
      `${num(parseNum(inputs.volume) ?? 0)} ${t.unitsShort[inputs.volumeUnit]}` +
        (inputs.volumeUnit === "box" || inputs.priceUnit === "box"
          ? ` · ${num(kgPerUnit("box", inputs), 1)} kg por caja`
          : ""),
    ],
    [t.pdfNormalPrice, unitPrice(r.refPrice)],
    [t.potential, money(r.potentialRevenue)],
    [t.ledgerReal, money(r.actualRevenue)],
    [t.ledgerTable, money(r.totalLoss)],
  ];
  for (const [k, v] of rows) {
    ensure(7);
    font(10, false, SOFT);
    doc.text(k, M, y + 4);
    font(10, true, k === t.ledgerTable ? RED : INK);
    doc.text(v, M + 62, y + 4);
    y += 6.5;
  }

  // Destinos
  const dests = inputs.destinations.filter((d) => d.name.trim() && parseNum(d.pct));
  if (dests.length) {
    heading(t.pdfDestinations, 14 + dests.length * 7);
    font(9, true, SOFT);
    doc.text(t.destName, M, y + 4);
    doc.text(t.destPct, M + 70, y + 4);
    doc.text(t.destPrice, M + 110, y + 4);
    y += 6;
    doc.setDrawColor(...GREEN_LIGHT);
    doc.line(M, y, W - M, y);
    y += 1;
    for (const d of dests) {
      font(10, false, INK);
      doc.text(d.name.trim(), M, y + 5);
      doc.text(pct(parseNum(d.pct) ?? 0, 1), M + 70, y + 5);
      doc.text(unitPrice(priceToKg(d.price, inputs)), M + 110, y + 5);
      y += 7;
    }
    const rest = 100 - r.destinationsPct;
    if (rest > 0.01) text(t.destRest(num(rest, 1)), 8.5, { color: SOFT });
  }

  // =====================================================================
  // Gráfico 1: la cuenta de tu temporada (cascada)
  // =====================================================================
  const lossCauses = r.causes.filter((c) => c.answered && c.loss > 0);
  if (r.potentialRevenue && lossCauses.length) {
    heading("La cuenta de tu temporada", 95);
    const top = y + 4;
    const h = 62;
    const axisX = M + 18;
    const w = CW - 18;
    const steps: { label: string; from: number; to: number; color: RGB; rangeTo?: number }[] = [];
    let level = r.potentialRevenue;
    steps.push({ label: t.ledgerSeason, from: 0, to: level, color: INK });
    for (const c of lossCauses) {
      steps.push({ label: causeName(c.key), from: level - c.loss, to: level, color: RED });
      level -= c.loss;
    }
    steps.push({ label: t.ledgerReal, from: 0, to: level, color: NEUTRAL });
    steps.push({ label: t.ledgerRecover, from: level, to: level + low, color: GREEN, rangeTo: level + high });
    // El eje no parte en cero: así las pérdidas y lo recuperable se distinguen
    const gap = r.potentialRevenue - level;
    const step = niceMax(Math.max(gap, 1) / 2);
    const min = Math.max(0, Math.floor((level - gap * 1.2) / step) * step);
    const max = Math.ceil((r.potentialRevenue * 1.02) / step) * step;
    yAxis(axisX, top, h, w, max, moneyShort, min);
    const slot = w / steps.length;
    const bw = Math.min(16, slot * 0.62);
    const Y = (v: number) => top + h - ((Math.max(v, min) - min) / (max - min)) * h;
    steps.forEach((s, i) => {
      const x = axisX + i * slot + (slot - bw) / 2;
      if (s.rangeTo != null) {
        doc.setFillColor(...GREEN_PALE);
        doc.rect(x, Y(s.rangeTo), bw, Y(s.to) - Y(s.rangeTo), "F");
      }
      doc.setFillColor(...s.color);
      doc.rect(x, Y(s.to), bw, Math.max(0.3, Y(s.from) - Y(s.to)), "F");
      // conector
      if (i < steps.length - 1) {
        doc.setDrawColor(...SOFT);
        doc.setLineWidth(0.15);
        doc.setLineDashPattern([0.8, 0.8], 0);
        const lvl = s.color === RED ? s.from : s.to;
        doc.line(x + bw, Y(lvl), x + slot, Y(lvl));
        doc.setLineDashPattern([], 0);
      }
      // valor
      const delta = s.rangeTo != null ? `+${moneyShort(low)}–${moneyShort(high)}` : s.color === RED ? `-${moneyShort(s.to - s.from)}` : moneyShort(s.to);
      font(6.5, true, s.color === RED ? RED : s.color === GREEN ? GREEN : INK);
      doc.text(delta, x + bw / 2, Y(s.rangeTo ?? s.to) - 1.5, { align: "center" });
      // etiqueta
      font(6.5, false, SOFT);
      const lab = doc.splitTextToSize(s.label, slot - 1) as string[];
      doc.text(lab.slice(0, 3), x + bw / 2, top + h + 4, { align: "center" });
    });
    y = top + h + 15;
    if (min > 0) text(`El eje vertical comienza en ${moneyShort(min)} para que se distingan las pérdidas.`, 7.5, { color: SOFT });
  }

  // =====================================================================
  // Tabla de pérdidas por causa
  // =====================================================================
  heading(t.pdfLosses, 30);
  const cols = [M, M + 70, M + 98, M + 132];
  font(9, true, SOFT);
  [t.pdfCause, t.pdfVolPct, t.pdfLost, t.pdfRecoverable].forEach((h, i) => doc.text(h, cols[i], y + 4));
  y += 6;
  doc.setDrawColor(...GREEN_LIGHT);
  doc.line(M, y, W - M, y);
  y += 1;
  for (const c of lossCauses) {
    ensure(8);
    font(10, false, INK);
    doc.text(causeName(c.key), cols[0], y + 5);
    doc.text(pct(c.pct, 1), cols[1], y + 5);
    font(10, false, RED);
    doc.text(money(c.loss), cols[2], y + 5);
    font(10, true, GREEN);
    doc.text(`${money(c.recoveredLow)} – ${money(c.recoveredHigh)}`, cols[3], y + 5);
    y += 7.5;
  }
  if (!lossCauses.length) text(t.noLosses, 10, { color: SOFT });
  else {
    doc.setDrawColor(...GRID);
    doc.line(M, y, W - M, y);
    font(10, true, INK);
    doc.text("Total", cols[0], y + 5);
    doc.text(pct(r.lossPctTotal, 1), cols[1], y + 5);
    font(10, true, RED);
    doc.text(money(total), cols[2], y + 5);
    font(10, true, GREEN);
    doc.text(`${money(low)} – ${money(high)}`, cols[3], y + 5);
    y += 9;
  }

  // =====================================================================
  // Gráfico 2: pérdida hoy vs. con nuestra tecnología
  // =====================================================================
  if (total > 0) {
    heading(t.chartCompareTitle, 85);
    const top = y + 8;
    const h = 55;
    const axisX = M + 18;
    const w = CW - 18;
    const max = niceMax(total * 1.05);
    yAxis(axisX, top, h, w, max, moneyShort);
    const Y = (v: number) => top + h - (v / max) * h;
    const bw = 30;
    const bars = [
      { label: t.lossToday, x: axisX + w * 0.25 - bw / 2 },
      { label: t.lossWithTech, x: axisX + w * 0.7 - bw / 2 },
    ];
    // Hoy
    doc.setFillColor(...RED);
    doc.rect(bars[0].x, Y(total), bw, Y(0) - Y(total), "F");
    font(8.5, true, RED);
    doc.text(moneyShort(total), bars[0].x + bw / 2, Y(total) - 2, { align: "center" });
    // Con tecnología: se mantiene (rojo) + rango (verde claro) + conservador (verde)
    const kept = total - high;
    doc.setFillColor(...RED);
    doc.rect(bars[1].x, Y(kept), bw, Y(0) - Y(kept), "F");
    doc.setFillColor(...GREEN_LIGHT);
    doc.rect(bars[1].x, Y(total - low), bw, Y(kept) - Y(total - low), "F");
    doc.setFillColor(...GREEN);
    doc.rect(bars[1].x, Y(total), bw, Y(total - low) - Y(total), "F");
    font(8.5, true, GREEN);
    doc.text(`+${moneyShort(low)} – ${moneyShort(high)}`, bars[1].x + bw / 2, Y(total) - 2, { align: "center" });
    font(8, false, SOFT);
    bars.forEach((b) => doc.text(b.label, b.x + bw / 2, top + h + 5, { align: "center" }));
    legend(
      [
        [RED, t.legendKept],
        [GREEN, t.legendRecLow],
        [GREEN_LIGHT, t.legendRecHigh],
      ],
      M,
      top + h + 12
    );
    y = top + h + 18;
  }

  // =====================================================================
  // Gráfico 3: evolución del precio
  // =====================================================================
  if (r.pricePoints.length >= 2) {
    heading(t.chartPriceTitle, 85);
    const crosses = seasonCrossesYear(inputs);
    const pts = r.pricePoints
      .map((p) => ({ ...p, x: crosses && p.week <= 26 ? p.week + 52 : p.week, v: p.price * pf }))
      .sort((a, b) => a.x - b.x);
    const top = y + 4;
    const h = 52;
    const axisX = M + 20;
    const w = CW - 26;
    const refV = r.refPrice != null ? r.refPrice * pf : 0;
    const max = niceMax(Math.max(refV, ...pts.map((p) => p.v)) * 1.1);
    const fmtP = (v: number) => {
      const d = cur === "USD" ? (max < 20 ? 2 : 0) : 0;
      return prefix + new Intl.NumberFormat("es-CL", { maximumFractionDigits: d, minimumFractionDigits: d }).format(v);
    };
    yAxis(axisX, top, h, w, max, fmtP);
    const x0 = pts[0].x;
    const x1 = pts[pts.length - 1].x;
    const X = (x: number) => axisX + 6 + ((x - x0) / Math.max(1, x1 - x0)) * (w - 12);
    const Y = (v: number) => top + h - (v / max) * h;
    if (r.refPrice != null) {
      doc.setDrawColor(...SOFT);
      doc.setLineDashPattern([1.2, 1.2], 0);
      doc.line(axisX, Y(refV), axisX + w, Y(refV));
      doc.setLineDashPattern([], 0);
      font(7, false, SOFT);
      doc.text(`${t.avgLine} ${unitPrice(r.refPrice)}`, axisX + 1, Y(refV) + 3.5);
    }
    doc.setDrawColor(...INK);
    doc.setLineWidth(0.6);
    for (let i = 1; i < pts.length; i++) {
      doc.line(X(pts[i - 1].x), Y(pts[i - 1].v), X(pts[i].x), Y(pts[i].v));
    }
    doc.setLineWidth(0.2);
    for (const p of pts) {
      const c = p.kind === "best" ? GREEN : p.kind === "worst" ? RED : INK;
      doc.setFillColor(...c);
      doc.circle(X(p.x), Y(p.v), p.kind === "extra" ? 1 : 1.6, "F");
      font(6.5, p.kind !== "extra", c);
      doc.text(fmtP(p.v), X(p.x), Y(p.v) - 2.5, { align: "center" });
      font(6.5, false, SOFT);
      doc.text(`Sem. ${((p.x - 1) % 52) + 1}`, X(p.x), top + h + 4, { align: "center" });
    }
    y = top + h + 9;
    const best = parseNum(inputs.bestPrice, cur);
    const worst = parseNum(inputs.worstPrice, cur);
    if (best != null && worst != null && best > worst) {
      text(`${t.spread}: ${unitPrice((best - worst) / pf)}`, 9, { color: SOFT });
    }
  }

  // =====================================================================
  // ¿De dónde sale este valor?
  // =====================================================================
  heading(t.whyTitle, 40);
  text(t.whyIntro, 10, { gap: 2 });
  text(t.whyKey, 13, { bold: true, color: GREEN, gap: 2 });
  if (SHELF_LIFE_EXTRA_DAYS) text(t.whyDays(SHELF_LIFE_EXTRA_DAYS[0], SHELF_LIFE_EXTRA_DAYS[1]), 10, { bold: true, gap: 2 });
  text(t.whyFormula, 9.5, { color: SOFT, gap: 3 });
  for (const c of lossCauses) {
    const [lo, hi] = RECOVERY_RATES[c.key];
    ensure(20); // título y explicación de la causa en la misma página
    text(`${causeName(c.key)} — ${Math.round(lo * 100)}–${Math.round(hi * 100)}% ${t.whyRate}`, 10, {
      bold: true,
      gap: 0.5,
    });
    text(t.causes[c.key].why, 9.5, { color: SOFT, gap: 0.5 });
    text(`${t.whyYouLose} ${money(c.loss)} · ${t.whyYouRecover} ${money(c.recoveredLow)} – ${money(c.recoveredHigh)}`, 9.5, {
      gap: 3,
    });
  }

  // =====================================================================
  // Próximos pasos
  // =====================================================================
  heading("Próximos pasos", 30);
  text(
    "Estos resultados se basan en tus datos y en supuestos conservadores. Un especialista de BioRoute puede revisarlos contigo, ajustarlos a tu operación y preparar una propuesta con el costo del tratamiento.",
    10,
    { gap: 3 }
  );
  text(t.pdfContact, 11, { bold: true, color: GREEN });

  // Pie de página en todas las páginas
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...GRID);
    doc.line(M, 287, W - M, 287);
    font(7.5, false, SOFT);
    doc.text(`${docTitle} · ${contact.email.trim()}`, M, 291);
    doc.text(`Página ${i} de ${pages}`, W - M, 291, { align: "right" });
  }

  // Nombre de archivo con la empresa (o el nombre): diagnostico-bioroute-agricola-x.pdf
  const slug = owner
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  doc.save(slug ? `diagnostico-bioroute-${slug}.pdf` : t.pdfFile);
}
