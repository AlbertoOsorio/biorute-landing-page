/**
 * Reporte PDF del simulador, generado en el navegador con jsPDF.
 * Este módulo se carga solo cuando la persona pide su reporte (import dinámico).
 */
import { jsPDF } from "jspdf";
import logoUrl from "../imagen/logoBioRoute.png";
import {
  formatMoney,
  formatNumber,
  kgPerUnit,
  type SimulatorInputs,
  type SimulatorResults,
} from "./calc";
import { RECOVERY_RATES, SHELF_LIFE_EXTRA_DAYS } from "./config";
import type { SimulatorText } from "./i18n";
import type { SimulatorContact } from "./storage";

const INK: [number, number, number] = [36, 70, 41];
const SOFT: [number, number, number] = [95, 115, 98];
const RED: [number, number, number] = [181, 86, 58];
const GREEN: [number, number, number] = [62, 122, 77];
const GREEN_LIGHT: [number, number, number] = [169, 205, 176];
const CREAM: [number, number, number] = [249, 243, 231];

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
  t: SimulatorText;
  lang: "es" | "en";
  fruitName: string;
}) {
  const { inputs, results: r, contact, t, lang, fruitName } = opts;
  const cur = inputs.currency;
  const money = (n: number | null) => formatMoney(n, cur);
  const pf = kgPerUnit(inputs.priceUnit, inputs);
  const priceTxt = (perKg: number | null) =>
    perKg == null ? "—" : `${formatMoney(perKg * pf, cur, true)}${t.perUnit[inputs.priceUnit]}`;
  const pct = (n: number, d = 0) => `${formatNumber(n, d, lang)}%`;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const M = 18;
  const CW = W - 2 * M;
  let y = M;

  const ensure = (h: number) => {
    if (y + h > 280) {
      doc.addPage();
      y = M;
    }
  };
  const text = (s: string, size: number, opt: { bold?: boolean; color?: [number, number, number]; gap?: number; x?: number; width?: number } = {}) => {
    doc.setFont("helvetica", opt.bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...(opt.color ?? INK));
    const lines = doc.splitTextToSize(s, opt.width ?? CW) as string[];
    const lh = size * 0.42;
    ensure(lines.length * lh);
    doc.text(lines, opt.x ?? M, y + lh * 0.8);
    y += lines.length * lh + (opt.gap ?? 2);
  };
  const heading = (s: string) => {
    ensure(14);
    y += 4;
    text(s, 13, { bold: true, gap: 3 });
  };

  // --- Encabezado
  const logo = await loadLogo();
  if (logo) {
    const h = 11;
    doc.addImage(logo.data, "PNG", M, y, (logo.w / logo.h) * h, h);
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...SOFT);
  doc.text(
    `${t.pdfDate}: ${new Date().toLocaleDateString(lang === "es" ? "es-CL" : "en-US")}`,
    W - M,
    y + 4,
    { align: "right" }
  );
  y += 18;
  text(t.pdfTitle, 20, { bold: true, gap: 2 });
  const who = [contact.name, contact.company, contact.region].filter(Boolean).join(" · ");
  text(`${t.pdfPreparedFor}: ${who}`, 10, { color: SOFT, gap: 4 });

  // --- Tu temporada
  heading(t.pdfSeason);
  const rows: [string, string][] = [
    [t.pdfFruit, fruitName],
    [t.pdfVolume, `${inputs.volume} ${t.unitsShort[inputs.volumeUnit]}${inputs.volumeUnit === "box" ? ` (${formatNumber(kgPerUnit("box", inputs), 1, lang)} kg)` : ""}`],
    [t.pdfNormalPrice, priceTxt(r.refPrice)],
  ];
  const dests = inputs.destinations.filter((d) => d.name.trim() && d.pct);
  if (dests.length) {
    rows.push([
      t.pdfDestinations,
      dests.map((d) => `${d.name} ${d.pct}%${d.price ? ` · ${formatMoney(Number(d.price.replace(",", ".")) || 0, cur, true)}${t.perUnit[inputs.priceUnit]}` : ""}`).join("   "),
    ]);
  }
  rows.push([t.potential, money(r.potentialRevenue)]);
  for (const [k, v] of rows) {
    ensure(7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...SOFT);
    doc.text(k, M, y + 4);
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    const lines = doc.splitTextToSize(v, CW - 55) as string[];
    doc.text(lines, M + 55, y + 4);
    y += Math.max(1, lines.length) * 5 + 1.5;
  }

  // --- Resumen destacado
  y += 4;
  ensure(52);
  const boxY = y;
  doc.setFillColor(...INK);
  doc.roundedRect(M, boxY, CW, 50, 3, 3, "F");
  y = boxY + 6;
  text(t.resultTable.toUpperCase(), 8.5, { color: CREAM, x: M + 7, width: CW - 14, gap: 0.5 });
  text(`${money(r.totalLoss)}  (${pct((r.lossShare ?? 0) * 100, 1)})`, 16, { bold: true, color: CREAM, x: M + 7, width: CW - 14, gap: 3 });
  text(t.recovered.toUpperCase(), 8.5, { color: CREAM, x: M + 7, width: CW - 14, gap: 0.5 });
  text(`${money(r.recoveredLow)} – ${money(r.recoveredHigh)} ${t.perSeason}`, 18, { bold: true, color: CREAM, x: M + 7, width: CW - 14, gap: 3 });
  // barra de la pérdida y lo recuperado
  const total = r.totalLoss || 0;
  if (total > 0) {
    const bx = M + 7;
    const bw = CW - 14;
    const by = boxY + 41;
    const lo = ((r.recoveredLow ?? 0) / total) * bw;
    const hi = ((r.recoveredHigh ?? 0) / total) * bw;
    doc.setFillColor(200, 105, 76);
    doc.rect(bx, by, bw, 3.5, "F");
    doc.setFillColor(214, 235, 217);
    doc.rect(bx, by, hi, 3.5, "F");
    doc.setFillColor(127, 192, 143);
    doc.rect(bx, by, lo, 3.5, "F");
  }
  y = boxY + 54;
  text(t.grossNote, 8.5, { color: SOFT, gap: 2 });

  // --- Tabla de pérdidas
  heading(t.pdfLosses);
  const cols = [M, M + 72, M + 100, M + 135];
  const head = [t.pdfCause, t.pdfVolPct, t.pdfLost, t.pdfRecoverable];
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...SOFT);
  head.forEach((h, i) => doc.text(h, cols[i], y + 4));
  y += 6;
  doc.setDrawColor(...GREEN_LIGHT);
  doc.line(M, y, W - M, y);
  y += 1;
  const causes = r.causes.filter((c) => c.answered && c.pct > 0);
  for (const c of causes) {
    ensure(8);
    const name = c.key === "other" && inputs.otherLabel ? inputs.otherLabel : t.causes[c.key].title;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    doc.text(name, cols[0], y + 5);
    doc.text(pct(c.pct, 1), cols[1], y + 5);
    doc.setTextColor(...RED);
    doc.text(money(c.loss), cols[2], y + 5);
    doc.setTextColor(...GREEN);
    doc.setFont("helvetica", "bold");
    doc.text(`${money(c.recoveredLow)} – ${money(c.recoveredHigh)}`, cols[3], y + 5);
    y += 7.5;
  }
  if (!causes.length) text(t.noLosses, 10, { color: SOFT });

  // --- ¿De dónde sale este valor?
  heading(t.whyTitle);
  text(t.whyIntro, 10, { gap: 2 });
  text(t.whyKey, 11, { bold: true, gap: 2 });
  if (SHELF_LIFE_EXTRA_DAYS) text(t.whyDays(SHELF_LIFE_EXTRA_DAYS[0], SHELF_LIFE_EXTRA_DAYS[1]), 10, { gap: 2 });
  text(t.whyFormula, 9.5, { color: SOFT, gap: 3 });
  for (const c of causes) {
    const name = c.key === "other" && inputs.otherLabel ? inputs.otherLabel : t.causes[c.key].title;
    const [lo, hi] = RECOVERY_RATES[c.key];
    ensure(18); // título y explicación de la causa en la misma página
    text(`${name} — ${Math.round(lo * 100)}–${Math.round(hi * 100)}% ${t.whyRate}`, 10, { bold: true, gap: 0.5 });
    text(t.causes[c.key].why, 9.5, { color: SOFT, gap: 2.5 });
  }

  // --- Pie
  ensure(14);
  y += 4;
  doc.setDrawColor(...GREEN_LIGHT);
  doc.line(M, y, W - M, y);
  y += 2;
  text(t.pdfContact, 10, { bold: true, color: GREEN });

  doc.save(t.pdfFile);
}
