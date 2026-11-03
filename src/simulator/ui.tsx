import { ReactNode, useId } from "react";


export function Section({
  n,
  title,
  lead,
  children,
  id,
}: {
  n: number;
  title: string;
  lead?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="py-12 md:py-16 border-t border-[#244629]/15 scroll-mt-20">
      <div className="flex items-start gap-4 mb-8">
        <span className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#244629] text-[#F9F3E7] text-sm font-semibold">
          {n}
        </span>
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h2>
          {lead && <p className="mt-2 text-[#244629]/75 max-w-2xl">{lead}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

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
}) {
  const id = useId();
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
          onChange={(e) => {
            const v = e.target.value.replace(/\s/g, "");
            if (pattern.test(v)) onChange(v);
          }}
          className={`${inputBase} ${prefix ? "pl-11" : ""} ${suffix ? "pr-14" : ""}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#244629]/50">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  type = "text",
  required,
  multiline,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  multiline?: boolean;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      {multiline ? (
        <textarea
          id={id}
          rows={4}
          value={value}
          required={required}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputBase} resize-none`}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          required={required}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={inputBase}
        />
      )}
    </div>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="inline-flex flex-wrap rounded-full border border-[#244629]/20 bg-white p-1" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              value === o.value ? "bg-[#244629] text-[#F9F3E7]" : "text-[#244629] hover:bg-[#244629]/5"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
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
