import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronUp, Download, Plus, Sparkles, X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import {
  computeResults,
  destinationIssues,
  emptyInputs,
  exampleInputs,
  formatMoney,
  formatNumber,
  kgPerUnit,
  LOSS_KEYS,
  lossIssues,
  parseNum,
  priceIssues,
  seasonCrossesYear,
  toInputString,
  type Currency,
  type Fruit,
  type Issue,
  type LossInput,
  type SimulatorInputs,
  type Unit,
  type YesNo,
} from "../simulator/calc";
import {
  FRUIT_INFO,
  GROWER_FRUITS,
  LOSS_PCT_SUGGESTIONS,
  LOSS_PRICE_FRACTIONS,
  RECOVERY_RATES,
  REGIONS,
  SHELF_LIFE_EXTRA_DAYS,
  USD_TO_CLP,
  VOLUME_SUGGESTIONS,
  type LossCauseKey,
} from "../simulator/config";
import { simulatorText } from "../simulator/i18n";
import {
  newSessionId,
  saveSimulation,
  saveSimulatorContact,
  type SimulatorContact,
} from "../simulator/storage";
import { PriceChart, RecoveryChart } from "../simulator/charts";
import {
  BigChoice,
  Card,
  Checkbox,
  ChipMulti,
  NumberField,
  Segmented,
  SelectField,
  TextField,
  type Suggestion,
} from "../simulator/ui";

const AUTOSAVE_MS = 2500;

type StepId =
  | "intro"
  | "fruit"
  | "season"
  | "destinations"
  | "prices"
  | `loss-${LossCauseKey}`
  | "result"
  | "report";

const STEPS: StepId[] = [
  "intro",
  "fruit",
  "season",
  "destinations",
  "prices",
  ...LOSS_KEYS.map((k) => `loss-${k}` as const),
  "result",
  "report",
];

/** Grupo de la barra de progreso al que pertenece cada paso. */
const groupOf = (s: StepId): number =>
  s === "fruit"
    ? 0
    : s === "season"
      ? 1
      : s === "destinations"
        ? 2
        : s === "prices"
          ? 3
          : s.startsWith("loss-")
            ? 4
            : s === "result"
              ? 5
              : 6;

const pct = (n: number) => `${Math.round(n * 100)}%`;

export default function Simulator() {
  const { language } = useLanguage();
  const t = simulatorText[language];

  const [inputs, setInputs] = useState<SimulatorInputs>(emptyInputs);
  const results = useMemo(() => computeResults(inputs), [inputs]);
  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx];
  const cur = inputs.currency;
  const money = (n: number | null) => formatMoney(n, cur);
  const curPrefix = cur === "USD" ? "US$" : "$";
  const priceFactor = kgPerUnit(inputs.priceUnit, inputs); // kg → unidad de precio
  const perUnit = t.perUnit[inputs.priceUnit];
  /** Precio por kg → texto en la unidad de precio elegida. */
  const priceTxt = (perKg: number | null) =>
    perKg == null ? "—" : `${formatMoney(perKg * priceFactor, cur, true)}${perUnit}`;
  const fruitInfo = FRUIT_INFO[inputs.fruit ?? "other"];

  // ---- Captura de datos -------------------------------------------------
  const sessionId = useRef(newSessionId());
  const touched = useRef(false);
  useEffect(() => {
    if (!touched.current) return;
    const id = window.setTimeout(() => {
      void saveSimulation(sessionId.current, inputs, results, language, null, step);
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(id);
  }, [inputs, results, language, step]);

  const update = (patch: Partial<SimulatorInputs>) => {
    touched.current = true;
    setInputs((prev) => ({ ...prev, ...patch }));
  };
  const updateLoss = (key: LossCauseKey, patch: Partial<LossInput>) => {
    touched.current = true;
    setInputs((prev) => ({
      ...prev,
      losses: { ...prev.losses, [key]: { ...prev.losses[key], ...patch } },
    }));
  };

  // ---- Navegación -------------------------------------------------------
  const topRef = useRef<HTMLDivElement>(null);
  const goTo = (i: number) => {
    setStepIdx(Math.max(0, Math.min(STEPS.length - 1, i)));
    requestAnimationFrame(() => {
      const el = topRef.current;
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
    });
  };
  const next = () => goTo(stepIdx + 1);
  const back = () => goTo(stepIdx - 1);

  const lossValid = (k: LossCauseKey) => {
    const l = inputs.losses[k];
    if (l.answer === null) return false;
    if (l.answer === "no") return true;
    const amount = parseNum(l.amount);
    if (amount == null || amount <= 0) return false;
    if (k !== "spoiled" && l.price.trim() === "") return false;
    if (k === "other" && !inputs.otherLabel.trim()) return false;
    return !results.pctOverflow;
  };
  // Validaciones de coherencia del paso actual
  const stepIssues: Issue[] =
    step === "destinations"
      ? destinationIssues(inputs)
      : step === "prices"
        ? priceIssues(inputs, results)
        : step.startsWith("loss-")
          ? lossIssues(inputs, results, step.slice(5) as LossCauseKey)
          : [];
  const issueText = (i: Issue): string => {
    switch (i.code) {
      case "avgAboveBest":
        return t.issues.avgAboveBest(priceTxt(i.avg), priceTxt(i.best));
      case "avgBelowWorst":
        return t.issues.avgBelowWorst(priceTxt(i.avg), priceTxt(i.worst));
      case "pointAboveBest":
      case "pointBelowWorst":
      case "weekConflict":
        return t.issues[i.code](i.week);
      case "destDuplicate":
      case "destAboveBest":
      case "destBelowWorst":
        return t.issues[i.code](i.name);
      case "priceNotLower":
        return t.issues.priceNotLower(priceTxt(i.normal));
      default:
        return t.issues[i.code]();
    }
  };
  const issuesBox =
    stepIssues.length > 0 ? (
      <div role="alert" className="mt-6 rounded-xl border border-[#B5563A]/30 bg-[#B5563A]/10 px-4 py-3 text-sm animate-fadeIn">
        <p className="font-semibold text-[#B5563A]">{t.issueTitle}</p>
        <ul className="mt-1 list-disc pl-5 space-y-0.5">
          {stepIssues.map((i, n) => (
            <li key={n}>{issueText(i)}</li>
          ))}
        </ul>
      </div>
    ) : null;

  const canContinue = stepIssues.length === 0 && (() => {
    if (step === "fruit") return inputs.fruit !== null && (inputs.fruit !== "other" || !!inputs.fruitOther.trim());
    if (step === "season") return results.hasSeason;
    if (step === "destinations") return !results.destinationsOverflow;
    if (step.startsWith("loss-")) return lossValid(step.slice(5) as LossCauseKey);
    return true;
  })();

  // ---- Sugerencias -------------------------------------------------------
  const priceSuggestions: Suggestion[] = fruitInfo.priceSuggestionsUsdKg.map((usdKg) => {
    const v = usdKg * (cur === "CLP" ? USD_TO_CLP : 1) * priceFactor;
    return { value: toInputString(v, cur), label: `${formatMoney(v, cur, true)}${perUnit}` };
  });
  const lossPriceSuggestions = (k: Exclude<LossCauseKey, "spoiled">): Suggestion[] =>
    results.refPrice == null
      ? []
      : LOSS_PRICE_FRACTIONS[k].map((f) => {
          const v = results.refPrice! * f * priceFactor;
          return {
            value: toInputString(v, cur),
            label: `${formatMoney(v, cur, true)}${perUnit}`,
            hint: t.ofNormal(pct(f)),
          };
        });
  const weekSuggestions: Suggestion[] = (() => {
    const w = fruitInfo.harvestWeeks;
    if (!w) return [];
    const len = w[0] <= w[1] ? w[1] - w[0] : 52 - w[0] + w[1];
    return [0, 0.25, 0.5, 0.75, 1].map((f) => {
      const wk = ((w[0] - 1 + Math.round(len * f)) % 52) + 1;
      return { value: String(wk), label: `${t.weekShort} ${wk}` };
    });
  })();

  // ---- Contacto ---------------------------------------------------------
  const [contact, setContact] = useState<SimulatorContact>({
    name: "",
    email: "",
    company: "",
    region: "",
    fruits: [],
    phone: "",
    consent: false,
  });
  const [sendState, setSendState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [consentError, setConsentError] = useState(false);

  const downloadPdf = async () => {
    const { downloadReport } = await import("../simulator/pdf");
    // El PDF siempre se genera en español
    await downloadReport({ inputs, results, contact });
  };
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!contact.consent) {
      setConsentError(true);
      return;
    }
    setSendState("loading");
    const [simOk, contactOk] = await Promise.all([
      saveSimulation(sessionId.current, inputs, results, language, contact, "report-sent"),
      saveSimulatorContact(sessionId.current, inputs, results, contact),
    ]);
    if (!(simOk && contactOk)) {
      setSendState("error");
      return;
    }
    try {
      await downloadPdf();
    } catch (err) {
      console.error("[simulador] error al generar el PDF", err);
    }
    setSendState("success");
  };

  const restart = () => {
    sessionId.current = newSessionId();
    touched.current = false;
    setInputs(emptyInputs());
    setSendState("idle");
    goTo(0);
  };

  // ---- Panel "Tu cuenta" ----------------------------------------------
  const lossLines = results.causes
    .filter((c) => c.answered && c.loss > 0)
    .map((c) => ({
      key: c.key,
      label: c.key === "other" && inputs.otherLabel ? inputs.otherLabel : t.causes[c.key].title,
      value: c.loss,
    }));
  const showLedger = step !== "intro" && step !== "result" && step !== "report";
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const ledgerHeadline =
    results.ready && (results.totalLoss ?? 0) > 0
      ? { label: t.ledgerTable, value: money(results.totalLoss), red: true }
      : { label: t.ledgerSeason, value: money(results.potentialRevenue), red: false };

  const ledger = (
    <div className="space-y-3 text-sm">
      {!results.hasSeason ? (
        <p className="text-[#244629]/60">{t.ledgerEmpty}</p>
      ) : (
        <>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[#244629]/75">{t.ledgerSeason}</span>
            <span className="text-lg font-semibold tabular-nums">{money(results.potentialRevenue)}</span>
          </div>
          {lossLines.map((l) => (
            <div key={l.key} className="flex items-baseline justify-between gap-3 animate-fadeIn">
              <span className="text-[#244629]/75">− {l.label}</span>
              <span className="font-semibold tabular-nums text-[#B5563A]">−{money(l.value)}</span>
            </div>
          ))}
          {lossLines.length > 0 && results.ready && (
            <div className="border-t border-[#244629]/15 pt-3 space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[#244629]/75">{t.ledgerReal}</span>
                <span className="font-semibold tabular-nums">{money(results.actualRevenue)}</span>
              </div>
              <div className="flex items-baseline justify-between gap-3 rounded-lg bg-[#B5563A]/10 px-3 py-2">
                <span className="font-semibold text-[#B5563A]">{t.ledgerTable}</span>
                <span className="text-lg font-bold tabular-nums text-[#B5563A]">{money(results.totalLoss)}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  // ---- Pasos ------------------------------------------------------------
  let body: ReactNode = null;

  if (step === "intro") {
    body = (
      <div className="max-w-2xl">
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight leading-tight">{t.introTitle}</h1>
        <p className="mt-5 text-base md:text-lg leading-relaxed text-[#244629]/80">{t.introLead}</p>
        <ul className="mt-6 space-y-2">
          {t.introPoints.map((p) => (
            <li key={p} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-[#3E7A4D]" /> {p}
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={next}
            className="inline-flex items-center gap-2 rounded-full bg-[#244629] px-7 py-3 text-sm font-semibold text-[#F9F3E7] hover:bg-[#1F3D2B] transition"
          >
            {t.start} <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              update(exampleInputs());
              goTo(STEPS.indexOf("result"));
            }}
            className="inline-flex items-center gap-2 rounded-full border border-[#244629]/30 px-5 py-3 text-sm font-medium hover:bg-[#244629]/5 transition"
          >
            <Sparkles className="h-4 w-4" /> {t.seeExample}
          </button>
        </div>
        <p className="mt-6 text-sm text-[#244629]/60 max-w-xl">🔒 {t.introPrivacy}</p>
      </div>
    );
  }

  if (step === "fruit") {
    body = (
      <>
        <StepTitle title={t.fruitTitle} />
        <BigChoice<Fruit>
          value={inputs.fruit}
          onChange={(v) => update({ fruit: v, kgPerBox: "" })}
          options={[
            { value: "avocado", label: t.fruits.avocado },
            { value: "cherry", label: t.fruits.cherry },
            { value: "other", label: t.fruits.other },
          ]}
        />
        {inputs.fruit === "other" && (
          <div className="mt-4 max-w-sm">
            <TextField label={t.fruitOther} value={inputs.fruitOther} onChange={(v) => update({ fruitOther: v })} />
          </div>
        )}
        {inputs.fruit && inputs.fruit !== "other" && (
          <div className="mt-5 rounded-xl bg-[#244629]/5 px-4 py-3 text-sm leading-relaxed animate-fadeIn">
            <p>{t.fruitNote(fruitInfo.harvest[language])}</p>
            <p className="text-[#244629]/70">
              {t.fruitDestNote(
                fruitInfo.destinations
                  .slice(0, 4)
                  .map((d) => d[language])
                  .join(", ")
              )}
            </p>
          </div>
        )}
      </>
    );
  }

  if (step === "season") {
    const showBox = inputs.volumeUnit === "box" || inputs.priceUnit === "box";
    const unitOpts = (["ton", "kg", "box"] as Unit[]).map((u) => ({ value: u, label: t.units[u] }));
    body = (
      <>
        <StepTitle title={t.seasonTitle} lead={t.seasonLead} />
        <div className="space-y-6">
          <Segmented<Currency>
            label={t.currency}
            value={cur}
            onChange={(v) => update({ currency: v })}
            options={[
              { value: "USD", label: "USD" },
              { value: "CLP", label: "CLP" },
            ]}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3 items-end">
            <NumberField
              label={t.volume}
              value={inputs.volume}
              onChange={(v) => update({ volume: v })}
              suffix={t.unitsShort[inputs.volumeUnit]}
              suggestions={VOLUME_SUGGESTIONS[inputs.volumeUnit].map((v) => ({
                value: String(v),
                label: `${formatNumber(v, 0, language)} ${t.unitsShort[inputs.volumeUnit]}`,
              }))}
            />
            <div className="pb-1.5">
              <Segmented<Unit>
                value={inputs.volumeUnit}
                onChange={(v) => update({ volumeUnit: v })}
                options={unitOpts}
                size="sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3 items-start">
            <NumberField
              label={t.avgPrice}
              value={inputs.avgPrice}
              onChange={(v) => update({ avgPrice: v })}
              prefix={curPrefix}
              suffix={perUnit}
              suggestions={priceSuggestions}
              help={t.avgPriceHelp}
            />
            <Segmented<Unit>
              label={t.priceUnitLabel}
              value={inputs.priceUnit}
              onChange={(v) => update({ priceUnit: v })}
              options={unitOpts}
              size="sm"
            />
          </div>
          {showBox && (
            <div className="max-w-[220px] animate-fadeIn">
              <NumberField
                label={t.kgPerBox}
                value={inputs.kgPerBox}
                onChange={(v) => update({ kgPerBox: v })}
                placeholder={String(fruitInfo.kgPerBox)}
                suffix="kg"
                suggestions={[2.5, 4, 5, 10].map((v) => ({ value: String(v), label: `${v} kg` }))}
              />
            </div>
          )}
          {results.hasSeason && (
            <div className="rounded-2xl bg-[#244629] text-[#F9F3E7] p-6 md:p-8 animate-fadeIn">
              <div className="text-xs md:text-sm font-semibold uppercase tracking-[0.16em] text-[#F9F3E7]/70">
                {t.seasonBanner}
              </div>
              <div className="mt-2 text-4xl md:text-5xl font-semibold tracking-tight tabular-nums">
                {money(results.potentialRevenue)}
              </div>
              <div className="mt-2 text-sm text-[#F9F3E7]/75">
                {t.seasonBannerHelp(
                  `${formatNumber(parseNum(inputs.volume), 0, language)} ${t.unitsShort[inputs.volumeUnit]}`,
                  priceTxt(results.refPrice)
                )}
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  if (step === "destinations") {
    const destSuggestions = fruitInfo.destinations.map((d) => ({ value: d[language], label: d[language] }));
    const setDest = (id: string, patch: Partial<SimulatorInputs["destinations"][number]>) =>
      update({ destinations: inputs.destinations.map((d) => (d.id === id ? { ...d, ...patch } : d)) });
    const rest = 100 - results.destinationsPct;
    body = (
      <>
        <StepTitle title={t.destTitle} lead={t.destLead} />
        <div className="space-y-4">
          {inputs.destinations.map((d) => (
            <div
              key={d.id}
              className="grid grid-cols-2 sm:grid-cols-[1.4fr_0.8fr_1fr_auto] gap-3 items-end rounded-xl border border-[#244629]/10 bg-white p-3"
            >
              <div className="col-span-2 sm:col-span-1">
                <TextField
                  label={t.destName}
                  value={d.name}
                  onChange={(v) => setDest(d.id, { name: v })}
                  suggestions={destSuggestions}
                />
              </div>
              <NumberField
                label={t.destPct}
                value={d.pct}
                onChange={(v) => setDest(d.id, { pct: v })}
                suffix="%"
                suggestions={[10, 25, 50, 75, 100].map((v) => ({ value: String(v), label: `${v}%` }))}
              />
              <NumberField
                label={t.destPrice}
                value={d.price}
                onChange={(v) => setDest(d.id, { price: v })}
                prefix={curPrefix}
                suffix={perUnit}
                suggestions={priceSuggestions}
              />
              <button
                type="button"
                aria-label={t.remove}
                onClick={() => update({ destinations: inputs.destinations.filter((x) => x.id !== d.id) })}
                className="col-span-2 sm:col-span-1 justify-self-end h-10 w-10 inline-flex items-center justify-center rounded-full text-[#244629]/60 hover:bg-[#244629]/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              update({ destinations: [...inputs.destinations, { id: newSessionId(), name: "", pct: "", price: "" }] })
            }
            className="w-full rounded-xl border border-dashed border-[#244629]/30 py-3 inline-flex items-center justify-center gap-2 text-sm font-medium hover:bg-[#244629]/5 transition"
          >
            <Plus className="h-4 w-4" /> {t.addDest}
          </button>
          {results.destinationsOverflow ? (
            <p className="text-sm font-medium text-[#B5563A]">{t.destOverflow}</p>
          ) : (
            results.destinationsPct > 0 &&
            rest > 0.0001 && (
              <p className="text-sm text-[#244629]/65">{t.destRest(formatNumber(rest, 1, language))}</p>
            )
          )}
        </div>
      </>
    );
  }

  if (step === "prices") {
    const pricePair = (label: string, pKey: "bestPrice" | "worstPrice", wKey: "bestWeek" | "worstWeek") => (
      <div className="grid grid-cols-[1fr_110px] gap-3">
        <NumberField
          label={label}
          value={inputs[pKey]}
          onChange={(v) => update({ [pKey]: v })}
          prefix={curPrefix}
          suffix={perUnit}
          suggestions={priceSuggestions}
        />
        <NumberField
          label={t.week}
          value={inputs[wKey]}
          onChange={(v) => update({ [wKey]: v })}
          integer
          placeholder="1–52"
          suggestions={weekSuggestions}
        />
      </div>
    );
    const b = parseNum(inputs.bestPrice, cur);
    const w = parseNum(inputs.worstPrice, cur);
    body = (
      <>
        <StepTitle title={t.pricesTitle} lead={t.pricesLead} />
        <p className="font-medium mb-3">{t.pricesQuestion}</p>
        <div className="max-w-sm">
          <BigChoice<"yes" | "no">
            columns={2}
            value={inputs.pricesEnabled}
            onChange={(v) => {
              update({ pricesEnabled: v });
              if (v === "no") next();
            }}
            options={[
              { value: "yes", label: t.yes },
              { value: "no", label: t.no },
            ]}
          />
        </div>
        {inputs.pricesEnabled === "yes" && (
          <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-6 animate-fadeIn">
            <div className="space-y-4">
              {fruitInfo.harvestWeeks && (
                <p className="text-sm text-[#244629]/65">
                  {t.harvestWeeksHint(fruitInfo.harvestWeeks[0], fruitInfo.harvestWeeks[1])}
                </p>
              )}
              {pricePair(t.best, "bestPrice", "bestWeek")}
              {pricePair(t.worst, "worstPrice", "worstWeek")}
              {inputs.extraPoints.map((p) => (
                <div key={p.id} className="grid grid-cols-[1fr_110px_auto] gap-3 items-center">
                  <NumberField
                    ariaLabel={t.week}
                    value={p.price}
                    onChange={(v) =>
                      update({ extraPoints: inputs.extraPoints.map((x) => (x.id === p.id ? { ...x, price: v } : x)) })
                    }
                    prefix={curPrefix}
                    suffix={perUnit}
                  />
                  <NumberField
                    ariaLabel={t.week}
                    value={p.week}
                    onChange={(v) =>
                      update({ extraPoints: inputs.extraPoints.map((x) => (x.id === p.id ? { ...x, week: v } : x)) })
                    }
                    integer
                    placeholder={t.weekShort}
                    suggestions={weekSuggestions}
                  />
                  <button
                    type="button"
                    aria-label={t.remove}
                    onClick={() => update({ extraPoints: inputs.extraPoints.filter((x) => x.id !== p.id) })}
                    className="h-9 w-9 inline-flex items-center justify-center rounded-full text-[#244629]/60 hover:bg-[#244629]/10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  update({ extraPoints: [...inputs.extraPoints, { id: newSessionId(), week: "", price: "" }] })
                }
                className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
              >
                <Plus className="h-4 w-4" /> {t.addWeek}
              </button>
              {!fruitInfo.harvestWeeks && (
                <Checkbox checked={inputs.crossesYear} onChange={(v) => update({ crossesYear: v })}>
                  {t.crossesYear}
                </Checkbox>
              )}
            </div>
            <div>
              <h3 className="font-semibold mb-3">{t.chartPriceTitle}</h3>
              <PriceChart
                r={results}
                currency={cur}
                t={t}
                crossesYear={seasonCrossesYear(inputs)}
                factor={priceFactor}
                unitLabel={perUnit}
              />
              {b != null && w != null && b > w && (
                <p className="mt-3 text-sm text-[#244629]/75">
                  {t.spread}:{" "}
                  <strong>
                    {formatMoney(b - w, cur, true)}
                    {perUnit}
                  </strong>
                </p>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  if (step.startsWith("loss-")) {
    const key = step.slice(5) as LossCauseKey;
    const c = t.causes[key];
    const l = inputs.losses[key];
    const n = LOSS_KEYS.indexOf(key) + 1;
    const cause = results.causes.find((x) => x.key === key)!;
    const volUnitLabel = t.unitsShort[inputs.volumeUnit];
    body = (
      <>
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#244629]/55 mb-2">
          {t.lossesIntro} · {t.lossOf(n, LOSS_KEYS.length)}
        </div>
        <StepTitle title={c.question} lead={c.help} />
        <div className="max-w-sm">
          <BigChoice<"yes" | "no">
            columns={2}
            value={l.answer}
            onChange={(v: Exclude<YesNo, null>) => {
              updateLoss(key, { answer: v });
              if (v === "no") next();
            }}
            options={[
              { value: "yes", label: t.yes },
              { value: "no", label: t.no },
            ]}
          />
        </div>
        {l.answer === "yes" && (
          <div className="mt-6 space-y-5 max-w-xl animate-fadeIn">
            {key === "other" && (
              <TextField label={t.otherLabel} value={inputs.otherLabel} onChange={(v) => update({ otherLabel: v })} />
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 items-end">
              <NumberField
                label={c.amountLabel}
                value={l.amount}
                onChange={(v) => updateLoss(key, { amount: v })}
                suffix={l.amountUnit === "pct" ? "%" : volUnitLabel}
                suggestions={
                  l.amountUnit === "pct"
                    ? LOSS_PCT_SUGGESTIONS.map((v) => ({ value: String(v), label: `${v}%` }))
                    : []
                }
              />
              <div className="pb-1.5">
                <Segmented<"pct" | "vol">
                  value={l.amountUnit}
                  onChange={(v) => updateLoss(key, { amountUnit: v, amount: "" })}
                  options={[
                    { value: "pct", label: t.amountUnitPct },
                    { value: "vol", label: volUnitLabel },
                  ]}
                  size="sm"
                />
              </div>
            </div>
            {key !== "spoiled" && (
              <NumberField
                label={c.priceLabel}
                value={l.price}
                onChange={(v) => updateLoss(key, { price: v })}
                prefix={curPrefix}
                suffix={perUnit}
                suggestions={lossPriceSuggestions(key)}
              />
            )}
            {cause.loss > 0 && (
              <p className="rounded-lg bg-[#B5563A]/10 px-4 py-3 text-sm animate-fadeIn">
                ≈ <strong className="text-[#B5563A]">{money(cause.loss)}</strong> {t.lossThisCause}
                {l.amountUnit === "vol" && ` (${formatNumber(cause.pct, 1, language)}%)`}
              </p>
            )}
            {results.pctOverflow && <p className="text-sm font-medium text-[#B5563A]">{t.overflow}</p>}
          </div>
        )}
      </>
    );
  }

  if (step === "result") {
    const total = results.totalLoss ?? 0;
    const shareLow = total ? (results.recoveredLow ?? 0) / total : 0;
    const shareHigh = total ? (results.recoveredHigh ?? 0) / total : 0;
    const ref = results.refPrice ?? 0;
    const tonsLow = ref ? (results.recoveredLow ?? 0) / ref / 1000 : 0;
    const tonsHigh = ref ? (results.recoveredHigh ?? 0) / ref / 1000 : 0;
    const shown = results.causes.filter((x) => x.answered && x.loss > 0);
    body = !results.ready ? (
      <Card>
        <p>{results.pctOverflow ? t.overflow : t.ledgerEmpty}</p>
      </Card>
    ) : (
      <div className="space-y-6">
        <StepTitle
          title={t.resultTitle}
          lead={t.resultStory(money(results.potentialRevenue), money(results.actualRevenue))}
        />

        {total <= 0 ? (
          <Card>
            <p>{t.noLosses}</p>
          </Card>
        ) : (
          <>
            {/* Sobre la mesa */}
            <div className="rounded-2xl border-2 border-[#B5563A]/30 bg-[#B5563A]/5 p-5 md:p-6">
              <div className="text-xs md:text-sm font-semibold uppercase tracking-[0.16em] text-[#B5563A]">
                {t.resultTable}
              </div>
              <div className="mt-1 text-3xl md:text-4xl font-semibold tabular-nums text-[#B5563A]">{money(total)}</div>
              <div className="text-sm text-[#244629]/70">
                {t.resultTableHelp(`${formatNumber((results.lossShare ?? 0) * 100, 1, language)}%`)}
              </div>
            </div>

            {/* Protagonista: lo recuperable */}
            <div className="rounded-3xl bg-[#244629] text-[#F9F3E7] p-6 md:p-10">
              <div className="text-sm md:text-base font-semibold uppercase tracking-[0.14em] text-[#F9F3E7]/75">
                {t.recovered}
              </div>
              <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight tabular-nums">
                  {money(results.recoveredLow)} – {money(results.recoveredHigh)}
                </span>
                <span className="text-xl md:text-2xl text-[#F9F3E7]/75">{t.perSeason}</span>
              </div>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#F9F3E7]/75">{t.grossNote}</p>

              <div className="mt-8">
                <div className="flex h-5 w-full overflow-hidden rounded-full bg-[#C8694C]">
                  <div className="h-full bg-[#7FC08F]" style={{ width: `${shareLow * 100}%` }} />
                  <div className="h-full bg-[#D6EBD9]" style={{ width: `${(shareHigh - shareLow) * 100}%` }} />
                </div>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#F9F3E7]/75">
                  <LegendDot color="#7FC08F" label={t.legendRecLow} />
                  <LegendDot color="#D6EBD9" label={t.legendRecHigh} />
                  <LegendDot color="#C8694C" label={t.legendKept} />
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Stat label={t.shareLabel} value={`${pct(shareLow)} – ${pct(shareHigh)}`} />
                <Stat
                  label={t.upliftLabel}
                  value={`${formatMoney((ref + (results.valuePerKgLow ?? 0)) * priceFactor, cur, true)} – ${formatMoney(
                    (ref + (results.valuePerKgHigh ?? 0)) * priceFactor,
                    cur,
                    true
                  )}`}
                  unit={perUnit}
                  sub={`${t.today}: ${priceTxt(ref)}`}
                />
                <Stat
                  label={t.tonsLabel}
                  value={`${formatNumber(tonsLow, 0, language)} – ${formatNumber(tonsHigh, 0, language)} t`}
                />
              </div>
            </div>

            {/* ¿De dónde sale? */}
            <Card>
              <h3 className="text-xl md:text-2xl font-semibold tracking-tight">{t.whyTitle}</h3>
              <p className="mt-3 max-w-4xl leading-relaxed text-[#244629]/80">{t.whyIntro}</p>
              <p className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight text-[#3E7A4D]">{t.whyKey}</p>
              {SHELF_LIFE_EXTRA_DAYS && (
                <p className="mt-4 inline-block rounded-xl bg-[#244629] text-[#F9F3E7] px-4 py-3 font-semibold">
                  {t.whyDays(SHELF_LIFE_EXTRA_DAYS[0], SHELF_LIFE_EXTRA_DAYS[1])}
                </p>
              )}
              <p className="mt-4 max-w-4xl text-sm leading-relaxed text-[#244629]/75">{t.whyFormula}</p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {shown.map((x) => {
                  const [lo, hi] = RECOVERY_RATES[x.key];
                  const title = x.key === "other" && inputs.otherLabel ? inputs.otherLabel : t.causes[x.key].title;
                  return (
                    <div key={x.key} className="flex flex-col rounded-xl border border-[#244629]/12 bg-white p-4 md:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-semibold">{title}</div>
                        <div className="shrink-0 text-right">
                          <div className="font-semibold tabular-nums text-[#3E7A4D]">
                            {pct(lo)} – {pct(hi)}
                          </div>
                          <div className="text-xs text-[#244629]/60">{t.whyRate}</div>
                        </div>
                      </div>
                      <p className="mt-2 mb-3 text-sm leading-relaxed text-[#244629]/75">{t.causes[x.key].why}</p>
                      <div className="mt-auto pt-3 border-t border-[#244629]/10 text-sm">
                        {t.whyYouLose} <strong className="text-[#B5563A]">{money(x.loss)}</strong> → {t.whyYouRecover}{" "}
                        <strong className="text-[#3E7A4D]">
                          {money(x.recoveredLow)} – {money(x.recoveredHigh)}
                        </strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold mb-4">{t.chartCompareTitle}</h3>
              <RecoveryChart r={results} currency={cur} t={t} />
            </Card>
          </>
        )}
      </div>
    );
  }

  if (step === "report") {
    const setC =
      <K extends keyof SimulatorContact>(k: K) =>
      (v: SimulatorContact[K]) =>
        setContact((c) => ({ ...c, [k]: v }));
    body =
      sendState === "success" ? (
        <div className="py-2">
          <StepTitle title={t.sent} lead={t.sentLead} />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void downloadPdf()}
              className="inline-flex items-center gap-2 rounded-full bg-[#244629] px-6 py-3 text-sm font-semibold text-[#F9F3E7] hover:bg-[#1F3D2B] transition"
            >
              <Download className="h-4 w-4" /> {t.downloadAgain}
            </button>
            <button
              type="button"
              onClick={restart}
              className="inline-flex items-center gap-2 rounded-full border border-[#244629]/30 px-5 py-3 text-sm font-medium hover:bg-[#244629]/5 transition"
            >
              {t.restart}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          <StepTitle title={t.reportTitle} lead={t.reportLead} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <TextField label={`${t.email} *`} type="email" value={contact.email} onChange={setC("email")} required />
            <TextField label={`${t.name} *`} value={contact.name} onChange={setC("name")} required />
            <SelectField
              label={t.region}
              value={contact.region}
              onChange={setC("region")}
              options={[...REGIONS, t.regionOther]}
              placeholder={t.regionPlaceholder}
            />
            <TextField label={`${t.company} (${t.optional})`} value={contact.company} onChange={setC("company")} />
          </div>
          <ChipMulti
            label={t.growerFruits}
            options={GROWER_FRUITS.map((f) => f[language])}
            value={contact.fruits}
            onChange={setC("fruits")}
          />
          <div className="max-w-sm">
            <TextField label={`${t.phone} (${t.optional})`} type="tel" value={contact.phone} onChange={setC("phone")} />
          </div>
          <div className={`rounded-xl p-4 ${consentError && !contact.consent ? "bg-[#B5563A]/10" : "bg-[#244629]/5"}`}>
            <Checkbox
              checked={contact.consent}
              onChange={(v) => {
                setC("consent")(v);
                if (v) setConsentError(false);
              }}
            >
              {t.consent} *
            </Checkbox>
            {consentError && !contact.consent && (
              <p className="mt-2 text-sm font-medium text-[#B5563A]">{t.consentNeeded}</p>
            )}
          </div>
          <p className="text-xs text-[#244629]/60">{t.privacyShort}</p>
          {sendState === "error" && <p className="text-sm text-[#B5563A]">{t.error}</p>}
          <button
            type="submit"
            disabled={sendState === "loading"}
            className="inline-flex items-center gap-2 rounded-full bg-[#244629] px-8 py-3 text-sm font-semibold text-[#F9F3E7] hover:bg-[#1F3D2B] transition disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> {sendState === "loading" ? t.sending : t.send}
          </button>
        </form>
      );
  }

  // ---- Render ------------------------------------------------------------
  const isOptional = step === "destinations" || step === "prices";
  const wide = !showLedger;
  const bare = step === "intro" || step === "result";

  return (
    <div className="bg-[#F9F3E7] text-[#244629] min-h-screen">
      <div ref={topRef} className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 md:pt-28 pb-32">
        {step !== "intro" && <Progress t={t} group={groupOf(step)} />}

        <div className={`mt-6 grid grid-cols-1 gap-6 ${wide ? "" : "lg:grid-cols-12"}`}>
          <div className={wide ? "" : "lg:col-span-8"}>
            <div key={step} className="animate-fadeIn">
              {bare ? (
                body
              ) : (
                <Card className="md:!p-8">
                  {body}
                  {issuesBox}
                </Card>
              )}
            </div>

            {/* Navegación */}
            {step !== "intro" && !(step === "report" && sendState === "success") && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={back}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-[#244629]/75 hover:bg-[#244629]/5 transition"
                >
                  <ArrowLeft className="h-4 w-4" /> {t.back}
                </button>
                <div className="flex flex-wrap items-center gap-3">
                  {isOptional && (
                    <button
                      type="button"
                      onClick={() => {
                        // Omitir precios descarta lo ingresado en ese paso
                        if (step === "prices") update({ pricesEnabled: "no" });
                        next();
                      }}
                      className="rounded-full px-4 py-2.5 text-sm font-medium text-[#244629]/70 hover:bg-[#244629]/5 transition"
                    >
                      {t.skip}
                    </button>
                  )}
                  {step === "result" ? (
                    <button
                      type="button"
                      onClick={next}
                      className="inline-flex items-center gap-2 rounded-full bg-[#244629] px-7 py-3 text-sm font-semibold text-[#F9F3E7] hover:bg-[#1F3D2B] transition"
                    >
                      <Download className="h-4 w-4" /> {t.getReport}
                    </button>
                  ) : step !== "report" ? (
                    <button
                      type="button"
                      onClick={next}
                      disabled={!canContinue}
                      className="inline-flex items-center gap-2 rounded-full bg-[#244629] px-7 py-3 text-sm font-semibold text-[#F9F3E7] hover:bg-[#1F3D2B] transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {t.next} <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {/* Panel "Tu cuenta" (escritorio) */}
          {showLedger && (
            <aside className="hidden lg:block lg:col-span-4">
              <div className="sticky top-20">
                <Card>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#244629]/60 mb-4">
                    {t.ledgerTitle}
                  </div>
                  {ledger}
                </Card>
                <p className="mt-3 px-1 text-xs text-[#244629]/55">{t.privacyShort}</p>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Panel "Tu cuenta" (celular): barra inferior desplegable */}
      {showLedger && results.hasSeason && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 px-3 pb-3">
          <div className="rounded-2xl bg-[#FFFDF8] border border-[#244629]/15 shadow-[0_-8px_30px_rgba(36,70,41,0.18)]">
            {ledgerOpen && <div className="max-h-[50vh] overflow-auto px-4 pt-4 pb-2">{ledger}</div>}
            <button
              type="button"
              onClick={() => setLedgerOpen((o) => !o)}
              aria-expanded={ledgerOpen}
              className="flex w-full items-center justify-between gap-3 px-4 py-3"
            >
              <span className="text-sm text-[#244629]/75">
                {ledgerOpen ? t.ledgerHide : ledgerHeadline.label}
              </span>
              <span className="flex items-center gap-2">
                {!ledgerOpen && (
                  <strong className={`tabular-nums ${ledgerHeadline.red ? "text-[#B5563A]" : ""}`}>
                    {ledgerHeadline.value}
                  </strong>
                )}
                <ChevronUp className={`h-4 w-4 transition-transform ${ledgerOpen ? "rotate-180" : ""}`} />
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function StepTitle({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl md:text-3xl font-semibold tracking-tight leading-snug">{title}</h2>
      {lead && <p className="mt-2 text-[#244629]/70 max-w-2xl leading-relaxed">{lead}</p>}
    </div>
  );
}

function Progress({ t, group }: { t: (typeof simulatorText)["es"]; group: number }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#244629]/55">{t.eyebrow}</div>
      <div className="mt-3 flex gap-1.5" aria-hidden>
        {t.groups.map((g, i) => (
          <div key={g} className={`h-1.5 flex-1 rounded-full ${i <= group ? "bg-[#244629]" : "bg-[#244629]/15"}`} />
        ))}
      </div>
      <div className="mt-2 text-sm text-[#244629]/70">
        {t.stepOf(group + 1, t.groups.length)} · <strong>{t.groups[group]}</strong>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} /> {label}
    </span>
  );
}

function Stat({ label, value, unit, sub }: { label: string; value: string; unit?: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-[#F9F3E7]/10 p-5">
      <div className="text-sm text-[#F9F3E7]/75">{label}</div>
      <div className="mt-1 text-2xl md:text-3xl font-semibold tabular-nums">
        {value}
        {unit && <span className="text-base font-normal text-[#F9F3E7]/75">{unit}</span>}
      </div>
      {sub && <div className="text-sm text-[#F9F3E7]/65 mt-1">{sub}</div>}
    </div>
  );
}
