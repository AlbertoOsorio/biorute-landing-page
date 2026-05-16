"use client";

import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { supabase } from "../lib/supabase";

type FormState = "idle" | "loading" | "success" | "error";

export default function Contact() {
  const { language } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");

  const content = {
    en: {
      title: "Contact",
      lead: "Have a question or want to work with us? Send us a message and we'll get back to you.",
      namePlaceholder: "Your name",
      emailPlaceholder: "Your email",
      messagePlaceholder: "Your message",
      submit: "Send message",
      sending: "Sending…",
      success: "Message sent! We'll be in touch soon.",
      error: "Something went wrong. Please try again.",
      nameLabel: "Name",
      emailLabel: "Email",
      messageLabel: "Message",
    },
    es: {
      title: "Contacto",
      lead: "¿Tienes alguna pregunta o quieres trabajar con nosotros? Envíanos un mensaje y te responderemos pronto.",
      namePlaceholder: "Tu nombre",
      emailPlaceholder: "Tu correo",
      messagePlaceholder: "Tu mensaje",
      submit: "Enviar mensaje",
      sending: "Enviando…",
      success: "¡Mensaje enviado! Te contactaremos pronto.",
      error: "Algo salió mal. Por favor intenta de nuevo.",
      nameLabel: "Nombre",
      emailLabel: "Correo",
      messageLabel: "Mensaje",
    },
  } as const;

  const t = content[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState("loading");

    const { error } = await supabase
      .from("contact_submissions")
      .insert([{ name, email, message }]);

    if (error) {
      setFormState("error");
    } else {
      setFormState("success");
      setName("");
      setEmail("");
      setMessage("");
    }
  };

  return (
    <section
      id="contacto"
      className="relative z-0 bg-[#F9F3E7] text-[#244629] min-h-screen"
    >
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">

          {/* Left: title */}
          <div className="md:col-span-5">
            <h2 className="text-5xl md:text-6xl font-semibold tracking-tight">
              {t.title}
            </h2>
            <div className="my-10 h-px w-full bg-[#244629]/20" />
            <p className="text-base md:text-lg leading-relaxed text-[#244629]/80">
              {t.lead}
            </p>
          </div>

          {/* Right: form */}
          <div className="md:col-span-7">
            {formState === "success" ? (
              <div className="flex items-center justify-center h-full min-h-[320px]">
                <p className="text-xl font-medium text-[#244629]">
                  {t.success}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">

                <div className="space-y-1">
                  <label className="text-sm font-medium text-[#244629]/70 uppercase tracking-wide">
                    {t.nameLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.namePlaceholder}
                    className="
                      w-full bg-transparent border-b border-[#244629]/30
                      py-3 text-[#244629] placeholder-[#244629]/40
                      focus:outline-none focus:border-[#244629]
                      transition-colors duration-200 text-base
                    "
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-[#244629]/70 uppercase tracking-wide">
                    {t.emailLabel}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    className="
                      w-full bg-transparent border-b border-[#244629]/30
                      py-3 text-[#244629] placeholder-[#244629]/40
                      focus:outline-none focus:border-[#244629]
                      transition-colors duration-200 text-base
                    "
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-[#244629]/70 uppercase tracking-wide">
                    {t.messageLabel}
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t.messagePlaceholder}
                    className="
                      w-full bg-transparent border-b border-[#244629]/30
                      py-3 text-[#244629] placeholder-[#244629]/40
                      focus:outline-none focus:border-[#244629]
                      transition-colors duration-200 text-base resize-none
                    "
                  />
                </div>

                {formState === "error" && (
                  <p className="text-sm text-red-700">{t.error}</p>
                )}

                <button
                  type="submit"
                  disabled={formState === "loading"}
                  className="
                    mt-4 px-8 py-3 rounded-full
                    bg-[#244629] text-[#F9F3E7]
                    text-sm font-semibold tracking-wide
                    hover:bg-[#1F3D2B] transition-colors duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  {formState === "loading" ? t.sending : t.submit}
                </button>

              </form>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
