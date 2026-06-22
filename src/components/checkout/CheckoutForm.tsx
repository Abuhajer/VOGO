"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useCart } from "@/context/CartProvider";
import { createCheckoutOrder } from "@/server/orders";
import PhoneInput from "@/components/form/PhoneInput";
import { formatNumber } from "@/lib/format";
import { trackPurchase } from "@/lib/analytics";
import { useAppToast } from "@/hooks/useAppToast";

export default function CheckoutForm({ stripeEnabled }: { stripeEnabled: boolean }) {
  const t = useTranslations("Checkout");
  const locale = useLocale();
  const { items, subtotal, clearCart } = useCart();
  const { checkoutError } = useAppToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    notes: "",
    paymentMethod: stripeEnabled ? "STRIPE" : "COD",
  });

  if (items.length === 0) {
    return <p className="text-ivory-muted">{t("emptyCart")}</p>;
  }

  function mapCheckoutError(code?: string) {
    switch (code) {
      case "INVALID_PRODUCTS":
        return t("errorInvalidProducts");
      case "STRIPE_UNAVAILABLE":
      case "STRIPE_REQUIRES_DATABASE":
        return t("errorStripeUnavailable");
      default:
        return t("error");
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await createCheckoutOrder({
        locale: locale as "ar" | "en",
        ...form,
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
        trackPurchase(subtotal);
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
      onSubmit={handleSubmit}
      className="grid lg:grid-cols-2 gap-10"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className="space-y-4">
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
          value={form.customerEmail}
          onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
          placeholder={t("email")}
          className="w-full bg-obsidian border border-gold-glow/20 rounded-sm px-4 py-3 text-sm"
        />
        <PhoneInput
          id="checkout-phone"
          locale={locale}
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
            <li key={item.productId} className="flex justify-between gap-4">
              <span>{locale === "ar" ? item.nameAr : item.nameEn}</span>
              <span>
                {formatNumber(item.price * item.quantity, locale)} {locale === "ar" ? "د.أ" : "JOD"}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-gold-glow/20 pt-4 text-gold text-xl font-serif">
          <span>{t("total")}</span>
          <span>
            {formatNumber(subtotal, locale)} {locale === "ar" ? "د.أ" : "JOD"}
          </span>
        </div>
        {error ? <p className="text-red-400 text-sm mt-4">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full min-h-[48px] bg-gold text-void font-semibold rounded-sm disabled:opacity-60"
        >
          {loading ? t("processing") : t("placeOrder")}
        </button>
      </div>
    </form>
  );
}
