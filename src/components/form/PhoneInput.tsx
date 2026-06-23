"use client";

import {
  getPhoneCountryPrefix,
  getPhoneInputPlaceholder,
  PHONE_LTR_CLASS,
  stripJordanPhoneNational,
  toWesternDigits,
} from "@/lib/format";

type PhoneInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  locale: string;
  required?: boolean;
  className?: string;
};

export default function PhoneInput({
  id,
  value,
  onChange,
  locale,
  required = true,
  className = "",
}: PhoneInputProps) {
  const displayValue = stripJordanPhoneNational(value);

  return (
    <div
      dir="ltr"
      className={`flex overflow-hidden rounded-sm border border-gold-glow/25 bg-surface focus-within:border-gold/50 focus-within:ring-1 focus-within:ring-gold/30 transition-colors ${PHONE_LTR_CLASS} ${className}`}
    >
      <span
        aria-hidden
        className="inline-flex items-center shrink-0 bg-surface-2 px-3 py-3.5 text-sm font-medium text-gold border-e border-gold-glow/25 tabular-nums"
      >
        {getPhoneCountryPrefix()}
      </span>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        dir="ltr"
        required={required}
        value={displayValue}
        onChange={(event) => onChange(toWesternDigits(event.target.value))}
        placeholder={getPhoneInputPlaceholder(locale)}
        className="min-w-0 flex-1 bg-surface px-4 py-3.5 text-sm text-ivory text-left placeholder:text-ivory-faint focus:outline-none tabular-nums"
      />
    </div>
  );
}
