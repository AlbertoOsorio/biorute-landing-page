"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../imagen/logoBioRoute.png";
import { useLanguage } from "../context/LanguageContext";

export default function Navigation() {
  const [isNavbarHidden, setIsNavbarHidden] = useState(false);
  const lastScrollY = useRef(0);
  const { language, setLanguage } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        setIsNavbarHidden(true);
      }

      if (currentScrollY < lastScrollY.current) {
        setIsNavbarHidden(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`
        fixed top-0 left-0 right-0 z-40
        transition-transform duration-300 ease-out
        ${isNavbarHidden ? "-translate-y-full" : "translate-y-0"}
      `}
    >
      <div
        className="
          mx-auto w-[91vw] max-w-7xl
          bg-[#F9F3E7]
          rounded-b-md
          shadow-[0_6px_24px_rgba(0,0,0,0.08)]
          border border-t-0 border-black/5
          px-4 sm:px-8
        "
      >
        <div className="grid h-12 grid-cols-[auto_1fr_auto] sm:grid-cols-[1fr_auto_1fr] items-center gap-1.5 sm:gap-2">
          {/* LINK IZQUIERDA */}
          <div className="flex items-center gap-2.5 sm:gap-6 whitespace-nowrap">
            <Link
              to="/equipo"
              className="
                relative text-xs sm:text-base font-medium text-[#244629]
                after:absolute after:left-0 after:-bottom-1
                after:h-[2px] after:w-0 after:bg-[#244629]
                after:transition-all after:duration-300
                hover:after:w-full
              "
            >
              <span className="hidden sm:inline">
                {language === "es" ? "Nuestro Equipo" : "Our Team"}
              </span>
              <span className="sm:hidden">{language === "es" ? "Equipo" : "Team"}</span>
            </Link>
            <Link
              to="/simulador"
              className="
                relative text-xs sm:text-base font-medium text-[#244629]
                after:absolute after:left-0 after:-bottom-1
                after:h-[2px] after:w-0 after:bg-[#244629]
                after:transition-all after:duration-300
                hover:after:w-full
              "
            >
              {language === "es" ? "Simulador" : "Simulator"}
            </Link>
            <Link
              to="/contacto"
              className="
                relative text-xs sm:text-base font-medium text-[#244629]
                after:absolute after:left-0 after:-bottom-1
                after:h-[2px] after:w-0 after:bg-[#244629]
                after:transition-all after:duration-300
                hover:after:w-full
              "
            >
              {language === "es" ? "Contacto" : "Contact"}
            </Link>
          </div>

          {/* LOGO CENTRO (a /) */}
          <div className="flex justify-center">
            <Link to="/" aria-label="Go to homepage">
              <img
                src={
                  (logo as unknown as { src: string })?.src ??
                  (logo as unknown as string)
                }
                alt="BioRoute Logo"
                className="h-6 sm:h-12 w-auto max-w-none shrink-0 select-none cursor-pointer"
                draggable={false}
              />
            </Link>
          </div>

         
          <div className="flex justify-end">
            <div
              className="
                inline-flex items-center
                rounded-full border border-black/10
                bg-[#F7F8F6]
                p-1
                text-xs sm:text-sm font-medium
                text-zinc-700
                shadow-inner
              "
            >
              <button
                onClick={() => setLanguage("es")}
                className={`
                  rounded-full transition-all duration-200
                  px-1.5 py-1 sm:px-3 sm:py-1
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F3D2B]/30
                  ${
                    language === "es"
                      ? "bg-[#1F3D2B] text-white shadow-sm"
                      : "hover:bg-black/5"
                  }
                `}
                aria-label="Cambiar a español"
                type="button"
              >
                ES
              </button>

              <button
                onClick={() => setLanguage("en")}
                className={`
                  rounded-full transition-all duration-200
                  px-1.5 py-1 sm:px-3 sm:py-1
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F3D2B]/30
                  ${
                    language === "en"
                      ? "bg-[#1F3D2B] text-white shadow-sm"
                      : "hover:bg-black/5"
                  }
                `}
                aria-label="Switch to English"
                type="button"
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
