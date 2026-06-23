"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useCart } from "@/context/CartProvider";
import { createCheckoutOrder } from "@/server/orders";
import { previewPromoCode } from "@/server/promotions";
import PhoneInput from "@/components/form/PhoneInput";
import { formatNumber } from "@/lib/format";
import { resolveCartLineId } from "@/lib/cart";
import { trackPurchase } from "@/lib/analytics";
import { useAppToast } from "@/hooks/useAppToast";

export default function CheckoutForm({
  stripeEnabled,
  prefill,
  emailLocked = false,
}: {
  stripeEnabled: boolean;
  prefill?: { customerName: string; customerEmail: string; customerPhone: string } | null;
  emailLocked?: boolean;
}) {
  const t = useTranslations("Checkout");
  const locale = useLocale();
  const { items, subtotal, clearCart } = useCart();
  const { checkoutError } = useAppToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const [promoBusy, setPromoBusy] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoApplied, setPromoApplied] = useState<{
    code: string;
    discountAmount: number;
    total: number;
  } | null>(null);
  const [form, setForm] = useState({
    customerName: prefill?.customerName ?? "",
    customerEmail: prefill?.customerEmail ?? "",
    customerPhone: prefill?.customerPhone ?? "",
    notes: "",
    paymentMethod: stripeEnabled ? "STRIPE" : "COD",
  });

  useEffect(() => {
    if (!prefill) return;
    setForm((current) => ({
      ...current,
      customerName: current.customerName || prefill.customerName,
      customerEmail: current.customerEmail || prefill.customerEmail,
      customerPhone: current.customerPhone || prefill.customerPhone,
    }));
  }, [prefill]);

  if (items.length === 0) {
    return <p className="text-ivory-muted">{t("emptyCart")}</p>;
  }

  const currency = locale === "ar" ? "د.أ" : "JOD";
  const checkoutTotal = promoApplied?.total ?? subtotal;
  const discountAmount = promoApplied?.discountAmount ?? 0;

  function mapCheckoutError(code?: string) {
    switch (code) {
      case "INVALID_PRODUCTS":
        return t("errorInvalidProducts");
      case "INVALID_PROMO":
        return t("errorInvalidPromo");
      case "PROMO_MIN_SUBTOTAL":
        return t("errorPromoMinSubtotal");
      case "PROMO_NOT_APPLICABLE":
        return t("errorPromoNotApplicable");
      case "STRIPE_UNAVAILABLE":
      case "STRIPE_REQUIRES_DATABASE":
        return t("errorStripeUnavailable");
      default:
        return t("error");
    }
  }

  function mapPromoPreviewError(code: "INVALID" | "EXPIRED" | "MIN_SUBTOTAL" | "NOT_APPLICABLE" | "LIMIT") {
    switch (code) {
      case "MIN_SUBTOTAL":
        return t("errorPromoMinSubtotal");
      case "NOT_APPLICABLE":
        return t("errorPromoNotApplicable");
      case "LIMIT":
      case "EXPIRED":
      case "INVALID":
      default:
        return t("errorInvalidPromo");
    }
  }

  async function handleApplyPromo() {
    if (!promoInput.trim()) return;
    setPromoBusy(true);
    setPromoError(null);

    const result = await previewPromoCode(
      promoInput,
      items.map((item) => ({
        productId: item.productId,
        slug: item.slug,
        quantity: item.quantity,
      }))
    );

    setPromoBusy(false);

    if (!result.ok) {
      setPromoApplied(null);
      setPromoError(mapPromoPreviewError(result.error));
      return;
    }

    setPromoApplied({
      code: result.code,
      discountAmount: result.discountAmount,
      total: result.total,
    });
    setPromoError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await createCheckoutOrder({
        locale: locale as "ar" | "en",
        ...form,
        promoCode: promoApplied?.code ?? (promoInput.trim() || undefined),
        paymentMethod: form.paymentMethod as "STRIPE" | "COD",
        items,
      });

      if (!result.ok) {
        const message = mapCheckoutError(result.error);
        setError(message);
        checkoutError(message);
        setLoading(false);
        return;
      }

      const isStripeRedirect = result.redirectUrl.includes("checkout.stripe.com");

      if (!isStripeRedirect) {
        clearCart();
        trackPurchase(checkoutTotal);
      }

      if (result.viaWhatsapp) {
        window.open(result.redirectUrl, "_blank", "noopener,noreferrer");
        window.location.href = `/${locale}/checkout/success?whatsapp=1`;
        return;
      }

      window.location.href = result.redirectUrl;
    } catch {
      const message = t("error");
      setError(message);
      checkoutError(message);
      setLoading(false);
    }
  }

  return (
    <form
      id="checkout-form"
      onSubmit={handleSubmit}
      className="grid lg:grid-cols-2 gap-8 lg:gap-10 pb-24 lg:pb-0"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className="space-y-4">
        {prefill?.customerEmail ? (
          <p className="text-xs text-ivory-faint rounded-sm border border-gold-glow/15 bg-surface/30 px-4 py-3">
            {t("prefillHint")}
          </p>
        ) : null}
        <input
          required
          value={form.customerName}
          onChange={(e) => setForm({ ...form, customerName: e.target.value })}
          placeholder={t("name")}
          className="w-full bg-obsidian border border-gold-glow/20 rounded-sm px-4 py-3 text-sm"
        />
        <input
          required
          type="email"
          readOnly={emailLocked}
          value={form.customerEmail}
          onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
          placeholder={t("email")}
          className={`w-full bg-obsidian border border-gold-glow/20 rounded-sm px-4 py-3 text-sm${emailLocked ? " opacity-80 cursor-not-allowed" : ""}`}
        />
        <PhoneInput
          id="checkout-phone"
          value={form.customerPhone}
          onChange={(customerPhone) => setForm({ ...form, customerPhone })}
          className="bg-obsidian"
        />
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder={t("notes")}
          rows={4}
          className="w-full bg-obsidian border border-gold-glow/20 rounded-sm px-4 py-3 text-sm resize-none"
        />
        <fieldset className="space-y-2">
          <legend className="text-sm text-ivory-muted mb-2">{t("paymentMethod")}</legend>
          {stripeEnabled ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="payment"
                checked={form.paymentMethod === "STRIPE"}
                onChange={() => setForm({ ...form, paymentMethod: "STRIPE" })}
              />
              {t("stripe")}
            </label>
          ) : null}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="payment"
              checked={form.paymentMethod === "COD"}
              onChange={() => setForm({ ...form, paymentMethod: "COD" })}
            />
            {t("cod")}
          </label>
        </fieldset>
      </div>

      <div className="bg-obsidian border border-gold-glow/15 rounded-sm p-6 h-fit">
        <h2 className="font-serif text-2xl text-ivory mb-4">{t("summary")}</h2>
        <ul className="space-y-2 text-sm text-ivory-muted mb-6">
          {items.map((item) => (
            <li key={resolveCartLineId(item)} className="flex justify-between gap-4">
              <span>{locale === "ar" ? item.nameAr : item.nameEn}</span>
              <span>
                {formatNumber(item.price * item.quantity, locale)} {currency}
              </span>
            </li>
          ))}
        </ul>

        <div className="border-t border-gold-glow/15 pt-4 space-y-3">
          <label className="text-[10px] uppercase tracking-wider text-ivory-faint block">
            {t("promoCode")}
          </label>
          <div className="flex gap-2">
            <input
              value={promoInput}
              onChange={(event) => {
                setPromoInput(event.target.value.toUpperCase());
                setPromoApplied(null);
                setPromoError(null);
              }}
              placeholder={t("promoPlaceholder")}
              className="flex-1 bg-void border border-gold-glow/20 rounded-sm px-3 py-2.5 text-sm uppercase"
              dir="ltr"
            />
            <button
              type="button"
              onClick={() => void handleApplyPromo()}
              disabled={promoBusy || !promoInput.trim()}
              className="px-4 py-2.5 rounded-sm text-xs font-semibold border border-gold/30 text-gold hover:bg-gold/10 disabled:opacity-50"
            >
              {promoBusy ? t("promoApplying") : t("promoApply")}
            </button>
          </div>
          {promoApplied ? (
            <p className="text-xs text-success">{t("promoApplied", { code: promoApplied.code })}</p>
          ) : null}
          {promoError ? <p className="text-xs text-red-300">{promoError}</p> : null}
        </div>

        <div className="mt-5 space-y-2 border-t border-gold-glow/20 pt-4 text-sm">
          <div className="flex justify-between text-ivory-muted">
            <span>{t("subtotal")}</span>
            <span>
              {formatNumber(subtotal, locale)} {currency}
            </span>
          </div>
          {discountAmount > 0 ? (
            <div className="flex justify-between text-success">
              <span>{t("discount")}</span>
              <span>
                -{formatNumber(discountAmount, locale)} {currency}
              </span>
            </div>
          ) : null}
          <div className="flex justify-between text-gold text-xl font-serif pt-2">
            <span>{t("total")}</span>
            <span>
              {formatNumber(checkoutTotal, locale)} {currency}
            </span>
          </div>
        </div>

        {error ? <p className="text-red-400 text-sm mt-4">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 hidden w-full min-h-12 bg-gold text-void font-semibold rounded-sm disabled:opacity-60 lg:inline-flex lg:items-center lg:justify-center"
        >
          {loading ? t("processing") : t("placeOrder")}
        </button>
      </div>

      <div className="checkout-mobile-bar fixed inset-x-0 bottom-0 z-30 border-t border-gold-glow/15 bg-void/95 px-4 py-3 backdrop-blur-md light:bg-[#FAF7F2]/98 light:border-[#0E0D12]/10 lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.14em] text-ivory-faint">{t("total")}</p>
            <p className="font-serif text-lg text-gold">
              {formatNumber(checkoutTotal, locale)} {currency}
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-sm bg-gold px-5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#0E0D12] disabled:opacity-60"
          >
            {loading ? t("processing") : t("placeOrder")}
          </button>
        </div>
      </div>
    </form>
  );
}
