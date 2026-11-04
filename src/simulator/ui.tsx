import { ReactNode, useId, useState } from "react";
import { Check } from "lucide-react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl bg-[#FFFDF8] border border-[#244629]/10 shadow-[0_6px_24px_rgba(36,70,41,0.06)] p-5 md:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

export function Label({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-semibold uppercase tracking-wide text-[#244629]/70 mb-1.5"
    >
      {children}
    </label>
  );
}

const inputBase =
  "w-full rounded-lg border border-[#244629]/20 bg-white px-3 py-2.5 text-[#244629] placeholder-[#244629]/35 focus:outline-none focus:ring-2 focus:ring-[#244629]/25 focus:border-[#244629]/50 transition";

export type Suggestion = { value: string; label: string; hint?: string };

/** Lista desplegable de sugerencias bajo un campo (se elige con un toque). */
function SuggestionList({
  items,
  onPick,
}: {
  items: Suggestion[];
  onPick: (v: string) => void;
}) {
  if (!items.length) return null;
  return (
    <ul
      role="listbox"
      className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-auto rounded-lg border border-[#244629]/15 bg-white py-1 shadow-[0_10px_30px_rgba(36,70,41,0.15)]"
    >
      {items.map((s) => (
        <li key={s.value + s.label}>
          <button
            type="button"
            role="option"
            aria-selected={false}
            // onMouseDown para elegir antes de que el campo pierda el foco
            onMouseDown={(e) => {
              e.preventDefault();
              onPick(s.value);
            }}
            className="flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-[#244629]/5"
          >
            <span className="font-medium">{s.label}</span>
            {s.hint && <span className="text-xs text-[#244629]/55">{s.hint}</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  placeholder,
  integer = false,
  className = "",
  ariaLabel,
  suggestions = [],
  help,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  integer?: boolean;
  className?: string;
  ariaLabel?: string;
  suggestions?: Suggestion[];
  help?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const pattern = integer ? /^\d*$/ : /^[\d.,]*$/;
  return (
    <div className={className}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#244629]/50">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type="text"
          inputMode={integer ? "numeric" : "decimal"}
          autoComplete="off"
          aria-label={ariaLabel}
          value={value}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onChange={(e) => {
            const v = e.target.value.replace(/\s/g, "");
            if (pattern.test(v)) onChange(v);
            // Al escribir, la lista se cierra para no tapar los campos de abajo
            setOpen(false);
          }}
          className={`${inputBase} ${prefix ? "pl-11" : ""} ${suffix ? "pr-16" : ""}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#244629]/50">
            {suffix}
          </span>
        )}
        {open && (
          <SuggestionList
            items={suggestions}
            onPick={(v) => {
              onChange(v);
              setOpen(false);
            }}
          />
        )}
      </div>
      {help && <p className="mt-1.5 text-xs text-[#244629]/60">{help}</p>}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  suggestions = [],
  ariaLabel,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  suggestions?: Suggestion[];
  ariaLabel?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const q = value.trim().toLowerCase();
  const filtered = suggestions.filter((s) => !q || s.label.toLowerCase().includes(q));
  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          required={required}
          placeholder={placeholder}
          aria-label={ariaLabel}
          autoComplete={suggestions.length ? "off" : undefined}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onChange={(e) => onChange(e.target.value)}
          className={inputBase}
        />
        {open && (
          <SuggestionList
            items={filtered}
            onPick={(v) => {
              onChange(v);
              setOpen(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputBase} ${value ? "" : "text-[#244629]/45"}`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  size = "md",
}: {
  label?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <div
        className="inline-flex flex-wrap rounded-full border border-[#244629]/20 bg-white p-1"
        role="radiogroup"
        aria-label={label}
      >
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={`rounded-full font-medium transition ${
              size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm"
            } ${value === o.value ? "bg-[#244629] text-[#F9F3E7]" : "text-[#244629] hover:bg-[#244629]/5"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Botones grandes de opción única (fruta, Sí/No). */
export function BigChoice<T extends string>({
  value,
  options,
  onChange,
  columns = 3,
}: {
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  columns?: 2 | 3;
}) {
  return (
    <div className={`grid gap-3 ${columns === 2 ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-3"}`} role="radiogroup">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`relative rounded-2xl border-2 px-5 py-5 text-left text-lg font-semibold transition ${
              active
                ? "border-[#244629] bg-[#244629] text-[#F9F3E7]"
                : "border-[#244629]/15 bg-white hover:border-[#244629]/40"
            }`}
          >
            {o.label}
            {active && <Check className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2" />}
          </button>
        );
      })}
    </div>
  );
}

/** Opciones múltiples tipo "chips". */
export function ChipMulti({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value.includes(o);
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                on
                  ? "border-[#244629] bg-[#244629] text-[#F9F3E7]"
                  : "border-[#244629]/20 bg-white hover:border-[#244629]/50"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-[#244629]"
      />
      <span className="text-sm leading-relaxed">{children}</span>
    </label>
  );
}

export function Kpi({
  label,
  value,
  help,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  help?: ReactNode;
  tone?: "default" | "loss" | "gain";
}) {
  const color =
    tone === "loss" ? "text-[#B5563A]" : tone === "gain" ? "text-[#3E7A4D]" : "text-[#244629]";
  return (
    <Card className="!p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-[#244629]/60">{label}</div>
      <div className={`mt-2 text-2xl md:text-3xl font-semibold tracking-tight ${color}`}>{value}</div>
      {help && <div className="mt-1 text-sm text-[#244629]/65">{help}</div>}
    </Card>
  );
}
