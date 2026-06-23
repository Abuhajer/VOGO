"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import SectionLabel from "@/components/icons/SectionLabel";
import { WhatsAppIcon } from "@/components/icons/Icons";
import { BUSINESS_PHONE_E164, getDisplayPhone, PHONE_LTR_CLASS } from "@/lib/format";
import PhoneInput from "@/components/form/PhoneInput";
import { getGoogleMapsLink, getLocationAddress } from "@/lib/location";
import SocialLinks from "@/components/icons/SocialLinks";
import ContactMap from "@/components/contact/ContactMap";

export default function ContactSection() {
  const t = useTranslations("Contact");
  const locale = useLocale();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    setIsSubmitting(true);

    // Simulate API request
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);

      // Open WhatsApp with prefilled form details
      const encodedText = encodeURIComponent(
        locale === "ar"
          ? `مرحباً ڤوچو، أنا الاسم: ${name}\nرقم الهاتف: ${phone}\nاستفساري: ${message}`
          : `Hello VOGO, my name is: ${name}\nPhone: ${phone}\nInquiry: ${message}`
      );
      
      const whatsappUrl = `https://wa.me/${BUSINESS_PHONE_E164.replace("+", "")}?text=${encodedText}`;
      window.open(whatsappUrl, "_blank");

      // Reset form fields
      setName("");
      setPhone("");
      setMessage("");
    }, 1500);
  };

  return (
    <section
      className="relative w-full bg-void py-20 md:py-32 border-b border-gold-glow/15"
      id="contact"
    >
      <div 
        className="container mx-auto px-4 sm:px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20"
        dir={locale === "ar" ? "rtl" : "ltr"}
      >
        {/* Left Column: Contact details (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <SectionLabel className="mb-2 text-gold">{t("title")}</SectionLabel>
          <h2 className="text-3xl md:text-5xl font-serif font-light text-ivory mb-8 leading-tight">
            {locale === "ar" ? "تواصل مخصص للأناقة" : "Personalized Style Consultations"}
          </h2>

          <div className="space-y-6 text-sm md:text-base font-sans font-light text-ivory-muted">
            {/* Phone */}
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-ivory-faint mb-1">
                {t("phone")}
              </span>
              <a
                href={`tel:${BUSINESS_PHONE_E164}`}
                className="text-gold hover:text-ivory text-lg md:text-xl font-light tracking-wide transition-colors duration-300 w-fit inline-block"
              >
                <span dir="ltr" className={`block text-start ${PHONE_LTR_CLASS}`}>
                  {getDisplayPhone()}
                </span>
              </a>
            </div>

            {/* Address */}
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-ivory-faint mb-1">
                {t("address")}
              </span>
              <a
                href={getGoogleMapsLink(locale)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ivory leading-relaxed text-sm md:text-base font-light hover:text-gold transition-colors duration-300 w-fit"
              >
                {getLocationAddress(locale)}
              </a>
            </div>

            <ContactMap />

            {/* Direct WhatsApp Call to Action */}
            <div className="pt-4">
              <a
                href={`https://wa.me/${BUSINESS_PHONE_E164.replace("+", "")}?text=${encodeURIComponent(t("whatsappMsg"))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#20ba5a] text-white px-6 py-3.5 rounded-sm font-sans text-xs uppercase tracking-[0.2em] font-semibold transition-all duration-300 hover:shadow-[0_4px_15px_rgba(37,211,102,0.3)]"
              >
                <WhatsAppIcon size={18} className="shrink-0" />
                <span>{t("whatsapp")}</span>
              </a>
            </div>

            {/* Social */}
            <div className="flex flex-col pt-2">
              <span className="text-[9px] uppercase tracking-wider text-ivory-faint mb-3">
                {locale === "ar" ? "تابعنا" : "Follow Us"}
              </span>
              <SocialLinks isArabic={locale === "ar"} />
            </div>
          </div>
        </div>

        {/* Right Column: Inquiry Form (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-center bg-obsidian border border-gold-glow/10 rounded-sm p-6 md:p-10 lg:p-12 relative overflow-hidden">
          {/* Form Header */}
          <h3 className="text-xl font-serif text-ivory mb-6">
            {t("formTitle")}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div className="flex flex-col">
              <label htmlFor="name" className="text-[10px] uppercase tracking-wider text-ivory-muted mb-2 font-medium">
                {t("name")} <span className="text-gold">*</span>
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("namePlaceholder")}
                className="bg-void border border-gold-glow/20 text-ivory rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all duration-300 placeholder:text-ivory-faint/60"
              />
            </div>

            {/* Phone Number */}
            <div className="flex flex-col">
              <label htmlFor="phone" className="text-[10px] uppercase tracking-wider text-ivory-muted mb-2 font-medium">
                {t("phoneLabel")} <span className="text-gold">*</span>
              </label>
              <PhoneInput
                id="phone"
                value={phone}
                onChange={setPhone}
              />
            </div>

            {/* Message */}
            <div className="flex flex-col">
              <label htmlFor="message" className="text-[10px] uppercase tracking-wider text-ivory-muted mb-2 font-medium">
                {t("message")}
              </label>
              <textarea
                id="message"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("messagePlaceholder")}
                className="bg-void border border-gold-glow/20 text-ivory rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all duration-300 placeholder:text-ivory-faint/60 resize-none"
              />
            </div>

            {/* Success Message Banner */}
            {submitSuccess && (
              <div className="p-4 bg-gold-glow/10 border border-gold/20 text-gold text-xs rounded-sm transition-all duration-500">
                {t("success")}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full relative py-4 bg-gold text-void font-sans text-xs uppercase tracking-[0.2em] font-semibold rounded-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(201,168,76,0.35)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  {/* Subtle spinner */}
                  <div className="w-4 h-4 border-2 border-void border-t-transparent rounded-full animate-spin" />
                  <span>{locale === "ar" ? "جاري الإرسال..." : "Sending..."}</span>
                </>
              ) : (
                <span>{t("submit")}</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
