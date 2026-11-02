import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LossCauseKey } from "./config";
import { Currency, formatMoney, formatNumber, SimulatorResults } from "./calc";
import type { SimulatorText } from "./i18n";
import { COLORS } from "./theme";

const axisTick = { fill: COLORS.inkSoft, fontSize: 12 };
const tooltipStyle = {
  backgroundColor: COLORS.card,
  border: `1px solid ${COLORS.grid}`,
  borderRadius: 10,
  color: COLORS.ink,
  fontSize: 13,
};

export function EmptyChart({ text, height = 260 }: { text: string; height?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl border border-dashed border-[#244629]/25 text-center text-sm text-[#244629]/60 px-6"
      style={{ height }}
    >
      {text}
    </div>
  );
}

/**
 * Las temporadas pueden cruzar el año (p. ej. cereza: semana 45 → semana 6).
 * Ordenamos las semanas empezando después del mayor hueco del calendario.
 */
function seasonOrder(points: SimulatorResults["pricePoints"]) {
  const weeks = [...new Set(points.map((p) => p.week))].sort((a, b) => a - b);
  if (weeks.length < 2) return points.map((p) => ({ ...p, x: p.week }));
  let gapStart = weeks[weeks.length - 1];
  let maxGap = weeks[0] + 52 - weeks[weeks.length - 1];
  for (let i = 1; i < weeks.length; i++) {
    const g = weeks[i] - weeks[i - 1];
    if (g > maxGap) {
      maxGap = g;
      gapStart = weeks[i - 1];
    }
  }
  const wraps = gapStart !== weeks[weeks.length - 1];
  return points
    .map((p) => ({ ...p, x: wraps && p.week <= gapStart ? p.week + 52 : p.week }))
    .sort((a, b) => a.x - b.x);
}

export function PriceChart({
  r,
  currency,
  t,
}: {
  r: SimulatorResults;
  currency: Currency;
  t: SimulatorText;
}) {
  if (r.pricePoints.length < 2) return <EmptyChart text={t.chartPriceEmpty} height={300} />;
  const data = seasonOrder(r.pricePoints);
  const weekLabel = (x: number) => `${t.weekShort} ${((x - 1) % 52) + 1}`;
  const dotColor = (kind: string) =>
    kind === "best" ? COLORS.green : kind === "worst" ? COLORS.spoiled : COLORS.ink;

  return (
    <div style={{ height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid stroke={COLORS.grid} vertical={false} />
          <XAxis
            dataKey="x"
            type="number"
            domain={["dataMin - 1", "dataMax + 1"]}
            allowDecimals={false}
            tickFormatter={weekLabel}
            tick={axisTick}
            stroke={COLORS.grid}
          />
          <YAxis
            tick={axisTick}
            stroke={COLORS.grid}
            width={64}
            tickFormatter={(v: number) => formatMoney(v, currency, true)}
            domain={[0, "auto"]}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(x: number) => weekLabel(x)}
            formatter={(v: number) => [`${formatMoney(v, currency, true)}${t.perKg}`, ""]}
            separator=""
          />
          {r.refPrice != null && (
            <ReferenceLine
              y={r.refPrice}
              stroke={COLORS.inkSoft}
              strokeDasharray="5 5"
              label={{
                value: `${t.avgLine} ${formatMoney(r.refPrice, currency, true)}`,
                position: "insideTopRight",
                fill: COLORS.inkSoft,
                fontSize: 12,
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="price"
            stroke={COLORS.ink}
            strokeWidth={2.5}
            isAnimationActive={false}
            dot={(props: { cx?: number; cy?: number; payload?: { kind: string }; index?: number }) => (
              <circle
                key={props.index}
                cx={props.cx}
                cy={props.cy}
                r={props.payload?.kind === "extra" ? 4 : 7}
                fill={dotColor(props.payload?.kind ?? "extra")}
                stroke={COLORS.card}
                strokeWidth={2}
              />
            )}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const causeColor: Record<LossCauseKey, string> = {
  spoiled: COLORS.spoiled,
  discounted: COLORS.discounted,
  diverted: COLORS.diverted,
  oversupply: COLORS.oversupply,
  other: COLORS.other,
};

/** Barra horizontal 100% con la distribución del volumen (sin librería). */
export function VolumeBar({
  r,
  t,
  otherLabel,
  lang,
}: {
  r: SimulatorResults;
  t: SimulatorText;
  otherLabel: string;
  lang: "es" | "en";
}) {
  const parts = [
    { key: "normal", label: t.normalSale, pct: r.normalPct, color: COLORS.normal },
    ...r.causes
      .filter((c) => c.pct > 0)
      .map((c) => ({
        key: c.key,
        label: c.key === "other" && otherLabel ? otherLabel : t.causes[c.key].title,
        pct: c.pct,
        color: causeColor[c.key],
      })),
  ];
  const total = parts.reduce((s, p) => s + p.pct, 0) || 1;
  return (
    <div>
      <div className="flex h-8 w-full overflow-hidden rounded-full bg-[#244629]/10">
        {parts.map((p) =>
          p.pct > 0 ? (
            <div
              key={p.key}
              title={`${p.label}: ${formatNumber(p.pct, 1, lang)}%`}
              style={{ width: `${(p.pct / total) * 100}%`, backgroundColor: p.color }}
              className="h-full transition-all duration-300"
            />
          ) : null
        )}
      </div>
      <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        {parts.map((p) => (
          <li key={p.key} className="flex items-center gap-2">
            <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: p.color }} />
            <span className="text-[#244629]/80 truncate">{p.label}</span>
            <span className="ml-auto font-semibold tabular-nums">{formatNumber(p.pct, 1, lang)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LossChart({
  r,
  currency,
  t,
  otherLabel,
}: {
  r: SimulatorResults;
  currency: Currency;
  t: SimulatorText;
  otherLabel: string;
}) {
  const data = r.causes
    .filter((c) => c.loss > 0)
    .map((c) => ({
      name: c.key === "other" && otherLabel ? otherLabel : t.causes[c.key].title,
      key: c.key,
      loss: c.loss,
      recLow: c.recoveredLow,
      recRange: c.recoveredHigh - c.recoveredLow,
      recHigh: c.recoveredHigh,
    }));
  if (!r.ready || data.length === 0) return <EmptyChart text={t.chartLossEmpty} height={300} />;

  return (
    <div style={{ height: 80 + data.length * 56 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 0 }} barGap={4}>
          <CartesianGrid stroke={COLORS.grid} horizontal={false} />
          <XAxis
            type="number"
            tick={axisTick}
            stroke={COLORS.grid}
            tickFormatter={(v: number) => formatMoney(v, currency)}
          />
          <YAxis type="category" dataKey="name" tick={axisTick} stroke={COLORS.grid} width={120} />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: "#24462908" }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as (typeof data)[number];
              return (
                <div style={{ ...tooltipStyle, padding: "8px 12px" }}>
                  <div className="font-semibold mb-1">{label}</div>
                  <div>
                    {t.lossLegend}: {formatMoney(d.loss, currency)}
                  </div>
                  <div style={{ color: COLORS.green }}>
                    {t.recoverLegend}: {formatMoney(d.recLow, currency)} – {formatMoney(d.recHigh, currency)}
                  </div>
                </div>
              );
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: COLORS.ink }}
            payload={[
              { value: t.lossLegend, type: "square", color: COLORS.spoiled },
              { value: t.recoverLegend, type: "square", color: COLORS.green },
            ]}
          />
          <Bar dataKey="loss" barSize={16} radius={[0, 4, 4, 0]} isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.key} fill={causeColor[d.key]} />
            ))}
          </Bar>
          <Bar dataKey="recLow" stackId="rec" barSize={16} fill={COLORS.green} isAnimationActive={false} />
          <Bar
            dataKey="recRange"
            stackId="rec"
            barSize={16}
            fill={COLORS.greenLight}
            radius={[0, 4, 4, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RevenueChart({
  r,
  currency,
  t,
}: {
  r: SimulatorResults;
  currency: Currency;
  t: SimulatorText;
}) {
  if (!r.ready || r.actualRevenue == null) return null;
  const data = [
    { name: t.withoutEthylock, value: r.actualRevenue, color: COLORS.spoiled },
    { name: t.withLow, value: r.actualRevenue + (r.recoveredLow ?? 0), color: COLORS.green },
    { name: t.withHigh, value: r.actualRevenue + (r.recoveredHigh ?? 0), color: COLORS.greenLight },
  ];
  return (
    <div style={{ height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 24, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid stroke={COLORS.grid} vertical={false} />
          <XAxis dataKey="name" tick={axisTick} stroke={COLORS.grid} interval={0} />
          <YAxis
            tick={axisTick}
            stroke={COLORS.grid}
            width={80}
            tickFormatter={(v: number) => formatMoney(v, currency)}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: "#24462908" }}
            formatter={(v: number) => [formatMoney(v, currency), ""]}
            separator=""
          />
          {r.potentialRevenue != null && (
            <ReferenceLine
              y={r.potentialRevenue}
              stroke={COLORS.inkSoft}
              strokeDasharray="5 5"
              label={{
                value: `${t.potential} ${formatMoney(r.potentialRevenue, currency)}`,
                position: "insideTopRight",
                fill: COLORS.inkSoft,
                fontSize: 12,
              }}
            />
          )}
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={90} isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
