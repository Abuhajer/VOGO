const EASTERN_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"] as const;

/** Convert Western digits in any string to Eastern Arabic numerals (٠–٩). */
export function toEasternArabicDigits(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => EASTERN_DIGITS[Number(digit)]!);
}

/** Localize digits for display — Arabic uses Eastern numerals, English stays Western. */
export function formatLocalizedDigits(value: string | number, locale: string): string {
  return locale === "ar" ? toEasternArabicDigits(value) : String(value);
}

/** Format a numeric value for UI (prices, counters, etc.). */
export function formatNumber(value: number, locale: string): string {
  if (locale === "ar") {
    return value.toLocaleString("ar-JO-u-nu-arab", { useGrouping: false });
  }

  return value.toLocaleString("en-US", { useGrouping: false });
}

export const BUSINESS_PHONE_E164 = "+962797226984";

/** Jordan mobile — national format without leading 0 */
export const JORDAN_PHONE_NATIONAL = "79 722 6984";
export const JORDAN_PHONE_LOCAL = "0797226984";
export const JORDAN_COUNTRY_CODE = "962";

/** @deprecated Use getDisplayPhone() */
export const BUSINESS_PHONE_DISPLAY = `+${JORDAN_COUNTRY_CODE} ${JORDAN_PHONE_NATIONAL}`;

/** Phone numbers must stay LTR even inside Arabic RTL layouts. */
export const PHONE_LTR_CLASS =
  "dir-ltr text-start [unicode-bidi:isolate] tabular-nums";

/** Force LTR rendering for mixed + / digit strings in RTL pages. */
const LTR_MARK = "\u200E";

export function getJordanCountryPrefix(locale: string): string {
  const code =
    locale === "ar"
      ? toEasternArabicDigits(JORDAN_COUNTRY_CODE)
      : JORDAN_COUNTRY_CODE;
  return `${LTR_MARK}+${code}`;
}

export function getDisplayPhone(locale: string): string {
  const national =
    locale === "ar"
      ? toEasternArabicDigits(JORDAN_PHONE_NATIONAL)
      : JORDAN_PHONE_NATIONAL;

  return `${getJordanCountryPrefix(locale)} ${national}`;
}

export function getPhoneInputPlaceholder(locale: string): string {
  const local =
    locale === "ar"
      ? toEasternArabicDigits(JORDAN_PHONE_LOCAL)
      : JORDAN_PHONE_LOCAL;

  return `${LTR_MARK}${local}`;
}
