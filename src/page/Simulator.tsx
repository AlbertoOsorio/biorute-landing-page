import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Plus, X, Sparkles, RotateCcw } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import {
  computeResults,
  Currency,
  emptyInputs,
  exampleInputs,
  formatMoney,
  formatNumber,
  Fruit,
  LOSS_KEYS,
  SimulatorInputs,
} from "../simulator/calc";
import { ETHYLOCK_RECOVERY, ETHYLOCK_VALUE_SHARE, LossCauseKey } from "../simulator/config";
import { simulatorText } from "../simulator/i18n";
import { newSessionId, saveSimulation, SimulatorContact } from "../simulator/storage";
import { LossChart, PriceChart, RevenueChart, VolumeBar } from "../simulator/charts";
import { Card, Kpi, NumberField, Section, Segmented, TextField } from "../simulator/ui";

const AUTOSAVE_MS = 2500;

const pct = (n: number) => `${Math.round(n * 100)}%`;

export default function Simulator() {
  const { language } = useLanguage();
  const t = simulatorText[language];

  const [inputs, setInputs] = useState<SimulatorInputs>(emptyInputs);
  const results = useMemo(() => computeResults(inputs), [inputs]);
  const cur = inputs.currency;
  const money = (n: number | null) => formatMoney(n, cur);
  const moneyKg = (n: number | null) => formatMoney(n, cur, true);
  const curPrefix = cur === "USD" ? "US$" : "$";

  // ---- Captura de datos -------------------------------------------------
  const sessionId = useRef(newSessionId());
  const touched = useRef(false);
  useEffect(() => {
    if (!touched.current) return;
    const id = window.setTimeout(() => {
      void saveSimulation(sessionId.current, inputs, results, language);
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(id);
  }, [inputs, results, language]);

  const update = (patch: Partial<SimulatorInputs>) => {
    touched.current = true;
    setInputs((prev) => ({ ...prev, ...patch }));
  };
  const updateLoss = (key: LossCauseKey, field: "pct" | "price", value: string) => {
    touched.current = true;
    setInputs((prev) => ({
      ...prev,
      losses: { ...prev.losses, [key]: { ...prev.losses[key], [field]: value } },
    }));
  };
  const updatePoint = (id: string, field: "week" | "price", value: string) =>
    update({
      extraPoints: inputs.extraPoints.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    });

  // ---- Contacto ---------------------------------------------------------
  const [contact, setContact] = useState<SimulatorContact>({
    name: "",
    company: "",
    email: "",
    phone: "",
    message: "",
  });
  const [sendState, setSendState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const setC = (k: keyof SimulatorContact) => (v: string) => setContact((c) => ({ ...c, [k]: v }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSendState("loading");
    const ok = await saveSimulation(sessionId.current, inputs, results, language, contact);
    setSendState(ok ? "success" : "error");
  };

  const showPricePill =
    results.ready && results.ethylockPriceHigh != null && results.ethylockPriceHigh > 0;

  return (
    <div className="bg-[#F9F3E7] text-[#244629] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-28">
        {/* Encabezado */}
        <header className="max-w-3xl">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#244629]/60">
            {t.eyebrow} · Ethylock
          </div>
          <h1 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
            {t.title}
          </h1>
          <p className="mt-5 text-base md:text-lg leading-relaxed text-[#244629]/80">{t.lead}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => update(exampleInputs())}
              className="inline-flex items-center gap-2 rounded-full border border-[#244629]/30 px-4 py-2 text-sm font-medium hover:bg-[#244629]/5 transition"
            >
              <Sparkles className="h-4 w-4" /> {t.loadExample}
            </button>
            <button
              type="button"
              onClick={() => update(emptyInputs())}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-[#244629]/70 hover:bg-[#244629]/5 transition"
            >
              <RotateCcw className="h-4 w-4" /> {t.reset}
            </button>
          </div>
          <p className="mt-4 text-xs text-[#244629]/55 max-w-xl">{t.privacy}</p>
        </header>

        {/* 1. Operación */}
        <div className="mt-12">
          <Section n={1} title={t.s1} lead={t.s1Lead}>
            <Card>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div className="space-y-3">
                  <Segmented<Fruit>
                    label={t.fruit}
                    value={inputs.fruit}
                    onChange={(v) => update({ fruit: v })}
                    options={[
                      { value: "avocado", label: t.fruits.avocado },
                      { value: "cherry", label: t.fruits.cherry },
                      { value: "other", label: t.fruits.other },
                    ]}
                  />
                  {inputs.fruit === "other" && (
                    <TextField
                      label={t.fruitOther}
                      value={inputs.fruitOther}
                      onChange={(v) => update({ fruitOther: v })}
                    />
                  )}
                </div>
                <Segmented<Currency>
                  label={t.currency}
                  value={inputs.currency}
                  onChange={(v) => update({ currency: v })}
                  options={[
                    { value: "USD", label: "USD" },
                    { value: "CLP", label: "CLP" },
                  ]}
                />
                <NumberField
                  label={t.volume}
                  value={inputs.volumeTons}
                  onChange={(v) => update({ volumeTons: v })}
                  suffix={t.tons}
                  placeholder="500"
                />
              </div>
            </Card>
          </Section>
        </div>

        {/* 2. Precios */}
        <Section n={2} title={t.s2} lead={t.s2Lead}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-5 space-y-5">
              {(
                [
                  ["best", t.best, "bestPrice", "bestWeek"],
                  ["worst", t.worst, "worstPrice", "worstWeek"],
                ] as const
              ).map(([k, label, pKey, wKey]) => (
                <div key={k} className="grid grid-cols-[1fr_96px] gap-3">
                  <NumberField
                    label={label}
                    value={inputs[pKey]}
                    onChange={(v) => update({ [pKey]: v })}
                    prefix={curPrefix}
                    suffix={t.perKg}
                    placeholder={cur === "USD" ? "0,00" : "0"}
                  />
                  <NumberField
                    label={t.week}
                    value={inputs[wKey]}
                    onChange={(v) => update({ [wKey]: v })}
                    integer
                    placeholder="1–52"
                  />
                </div>
              ))}
              <NumberField
                label={t.avg}
                value={inputs.avgPrice}
                onChange={(v) => update({ avgPrice: v })}
                prefix={curPrefix}
                suffix={t.perKg}
                placeholder={cur === "USD" ? "0,00" : "0"}
              />

              <div className="pt-2 border-t border-[#244629]/10">
                <p className="text-sm text-[#244629]/65 mb-3">{t.extraHint}</p>
                <div className="space-y-3">
                  {inputs.extraPoints.map((p) => (
                    <div key={p.id} className="grid grid-cols-[1fr_96px_auto] gap-3 items-center">
                      <NumberField
                        ariaLabel={`${t.week} ${p.week}`}
                        value={p.price}
                        onChange={(v) => updatePoint(p.id, "price", v)}
                        prefix={curPrefix}
                        suffix={t.perKg}
                      />
                      <NumberField
                        ariaLabel={t.week}
                        value={p.week}
                        onChange={(v) => updatePoint(p.id, "week", v)}
                        integer
                        placeholder={t.weekShort}
                      />
                      <button
                        type="button"
                        aria-label={t.remove}
                        onClick={() =>
                          update({ extraPoints: inputs.extraPoints.filter((x) => x.id !== p.id) })
                        }
                        className="h-9 w-9 inline-flex items-center justify-center rounded-full text-[#244629]/60 hover:bg-[#244629]/10"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    update({
                      extraPoints: [
                        ...inputs.extraPoints,
                        { id: newSessionId(), week: "", price: "" },
                      ],
                    })
                  }
                  className="mt-3 inline-flex items-center gap-2 text-sm font-medium hover:underline"
                >
                  <Plus className="h-4 w-4" /> {t.addWeek}
                </button>
              </div>

              <label className="flex items-start gap-3 pt-4 border-t border-[#244629]/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inputs.crossesYear}
                  onChange={(e) => update({ crossesYear: e.target.checked })}
                  className="mt-1 h-4 w-4 accent-[#244629]"
                />
                <span>
                  <span className="block text-sm font-medium">{t.crossesYear}</span>
                  <span className="block text-xs text-[#244629]/60 mt-0.5">{t.crossesYearHelp}</span>
                </span>
              </label>
            </Card>

            <Card className="lg:col-span-7">
              <h3 className="font-semibold mb-4">{t.chartPriceTitle}</h3>
              <PriceChart r={results} currency={cur} t={t} crossesYear={inputs.crossesYear} />
              {results.seasonSpread != null && results.seasonSpread > 0 && (
                <p className="mt-4 text-sm text-[#244629]/75">
                  {t.spread}:{" "}
                  <strong className="text-[#244629]">
                    {moneyKg(results.seasonSpread)}
                    {t.perKg}
                  </strong>
                </p>
              )}
            </Card>
          </div>
        </Section>

        {/* 3. Causas de pérdida */}
        <Section n={3} title={t.s3} lead={t.s3Lead}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-4">
              {LOSS_KEYS.filter((key) => key !== "other" || inputs.otherEnabled).map((key) => {
                const c = t.causes[key];
                const li = inputs.losses[key];
                return (
                  <Card key={key} className="!p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-semibold">{c.title}</div>
                      {key === "other" && (
                        <button
                          type="button"
                          aria-label={t.remove}
                          onClick={() =>
                            update({
                              otherEnabled: false,
                              otherLabel: "",
                              losses: { ...inputs.losses, other: { pct: "", price: "" } },
                            })
                          }
                          className="-mt-1 -mr-1 h-8 w-8 inline-flex items-center justify-center rounded-full text-[#244629]/60 hover:bg-[#244629]/10"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-[#244629]/65 mt-1 mb-4">{c.help}</p>
                    {key === "other" && (
                      <div className="mb-3">
                        <TextField
                          label={t.otherLabel}
                          value={inputs.otherLabel}
                          onChange={(v) => update({ otherLabel: v })}
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <NumberField
                        label={t.pctVolume}
                        value={li.pct}
                        onChange={(v) => updateLoss(key, "pct", v)}
                        suffix="%"
                        placeholder="0"
                      />
                      {key !== "spoiled" && (
                        <NumberField
                          label={c.priceLabel}
                          value={li.price}
                          onChange={(v) => updateLoss(key, "price", v)}
                          prefix={curPrefix}
                          suffix={t.perKg}
                        />
                      )}
                    </div>
                  </Card>
                );
              })}
              {!inputs.otherEnabled && (
                <button
                  type="button"
                  onClick={() => update({ otherEnabled: true })}
                  className="w-full rounded-2xl border border-dashed border-[#244629]/30 py-4 inline-flex items-center justify-center gap-2 text-sm font-medium hover:bg-[#244629]/5 transition"
                >
                  <Plus className="h-4 w-4" /> {t.addOther}
                </button>
              )}
            </div>

            <div className="lg:col-span-7 space-y-6 lg:sticky lg:top-20 self-start">
              <Card>
                <h3 className="font-semibold mb-4">{t.chartVolumeTitle}</h3>
                <VolumeBar r={results} t={t} otherLabel={inputs.otherLabel} lang={language} />
                <p className="mt-4 text-sm text-[#244629]/70">
                  {t.assigned}: <strong>{formatNumber(results.lossPctTotal, 1, language)}%</strong>
                </p>
                {results.pctOverflow && (
                  <p className="mt-2 text-sm font-medium text-[#B5563A]">{t.overflow}</p>
                )}
              </Card>
              <Card>
                <h3 className="font-semibold mb-4">{t.chartLossTitle}</h3>
                <LossChart r={results} currency={cur} t={t} otherLabel={inputs.otherLabel} />
              </Card>
            </div>
          </div>
        </Section>

        {/* 4. Resultado */}
        <Section n={4} title={t.s4} lead={t.s4Lead} id="resultado">
          {!results.ready ? (
            <Card>
              <p className="text-[#244629]/70">{results.pctOverflow ? t.overflow : t.needData}</p>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Kpi label={t.potential} value={money(results.potentialRevenue)} help={t.potentialHelp} />
                <Kpi label={t.actual} value={money(results.actualRevenue)} />
                <Kpi
                  label={t.totalLoss}
                  tone="loss"
                  value={money(results.totalLoss)}
                  help={`${formatNumber((results.lossShare ?? 0) * 100, 1, language)}% ${t.ofPotential}`}
                />
                <Kpi
                  label={t.recovered}
                  tone="gain"
                  value={
                    <span className="text-xl md:text-2xl">
                      {money(results.recoveredLow)} – {money(results.recoveredHigh)}
                    </span>
                  }
                  help={t.perSeason}
                />
              </div>

              {/* Precio implícito Ethylock */}
              <div className="rounded-2xl bg-[#244629] text-[#F9F3E7] p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F9F3E7]/70">
                    {t.ethylockPrice}
                  </div>
                  <div className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">
                    {t.between} {moneyKg(results.ethylockPriceLow)} {t.and}{" "}
                    {moneyKg(results.ethylockPriceHigh)}
                    <span className="text-lg font-normal text-[#F9F3E7]/80"> {t.perKgTreated}</span>
                  </div>
                  <p className="mt-3 text-sm text-[#F9F3E7]/80 max-w-xl">{t.ethylockPriceHelp}</p>
                </div>
                <div className="md:col-span-5 rounded-xl bg-[#F9F3E7]/10 p-5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#F9F3E7]/70">
                    {t.valuePerKg}
                  </div>
                  <div className="mt-1 text-2xl font-semibold">
                    {moneyKg(results.valuePerKgLow)} – {moneyKg(results.valuePerKgHigh)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <Card className="lg:col-span-7">
                  <h3 className="font-semibold mb-4">{t.chartCompareTitle}</h3>
                  <RevenueChart r={results} currency={cur} t={t} />
                </Card>
                <Card className="lg:col-span-5">
                  <h3 className="font-semibold mb-3">{t.assumptions}</h3>
                  <ul className="space-y-2 text-sm">
                    {LOSS_KEYS.filter((k) => k !== "other" || inputs.otherEnabled).map((k) => (
                      <li key={k} className="flex justify-between gap-4">
                        <span className="text-[#244629]/75">
                          {k === "other" && inputs.otherLabel ? inputs.otherLabel : t.causes[k].title}
                        </span>
                        <span className="font-semibold tabular-nums">
                          {pct(ETHYLOCK_RECOVERY[k][0])} – {pct(ETHYLOCK_RECOVERY[k][1])}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 pt-4 border-t border-[#244629]/10 text-sm text-[#244629]/70">
                    {t.assumptionsShare} {pct(ETHYLOCK_VALUE_SHARE[0])} – {pct(ETHYLOCK_VALUE_SHARE[1])}
                  </p>
                </Card>
              </div>
            </div>
          )}
        </Section>

        {/* 5. Contacto */}
        <Section n={5} title={t.s5} lead={t.s5Lead} id="contacto-simulador">
          <Card className="max-w-3xl">
            {sendState === "success" ? (
              <p className="text-lg font-medium py-8 text-center">{t.sent}</p>
            ) : (
              <form onSubmit={onSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <TextField label={t.name} value={contact.name} onChange={setC("name")} required />
                  <TextField label={t.company} value={contact.company} onChange={setC("company")} />
                  <TextField
                    label={t.email}
                    type="email"
                    value={contact.email}
                    onChange={setC("email")}
                    required
                  />
                  <TextField label={t.phone} type="tel" value={contact.phone} onChange={setC("phone")} />
                </div>
                <TextField label={t.message} value={contact.message} onChange={setC("message")} multiline />
                {sendState === "error" && <p className="text-sm text-[#B5563A]">{t.error}</p>}
                <button
                  type="submit"
                  disabled={sendState === "loading"}
                  className="px-8 py-3 rounded-full bg-[#244629] text-[#F9F3E7] text-sm font-semibold tracking-wide hover:bg-[#1F3D2B] transition disabled:opacity-50"
                >
                  {sendState === "loading" ? t.sending : t.send}
                </button>
              </form>
            )}
          </Card>
        </Section>
      </div>

      {/* Precio implícito siempre visible */}
      {showPricePill && (
        <a
          href="#resultado"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 max-w-[calc(100vw-32px)] rounded-full bg-[#244629] text-[#F9F3E7] shadow-[0_10px_30px_rgba(0,0,0,0.25)] px-5 py-3 text-sm flex items-center gap-2 whitespace-nowrap"
        >
          <span className="text-[#F9F3E7]/70 hidden sm:inline">{t.ethylockPrice}:</span>
          <span className="sm:hidden text-[#F9F3E7]/70">Ethylock:</span>
          <strong>
            {moneyKg(results.ethylockPriceLow)} – {moneyKg(results.ethylockPriceHigh)}
            {t.perKg}
          </strong>
        </a>
      )}
    </div>
  );
}
