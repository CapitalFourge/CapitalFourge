"use client";

import Link from "next/link";
import {
  Twitter,
  Instagram,
  Linkedin,
  Github,
  Mail,
  MapPin,
} from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-slate-950/55">
      <div className="mx-auto max-w-[1700px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center">
              <img
                src="/logo.svg"
                alt="Capital Fourge"
                className="h-14 w-auto"
              />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-7 text-slate-400">
              Empoderando a las personas para aprender, practicar y dominar la
              inversión a través de la educación y simulaciones realistas del
              mercado.
            </p>
            <div className="mt-5 flex gap-4">
              {[
                { Icon: Twitter, href: "#", label: "Twitter" },
                { Icon: Instagram, href: "#", label: "Instagram" },
                { Icon: Linkedin, href: "#", label: "LinkedIn" },
                { Icon: Github, href: "#", label: "GitHub" },
                { Icon: Mail, href: "mailto:hola@capitalfourge.com", label: "Email" },
              ].map(({ Icon, href, label }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-slate-400 transition hover:border-white/20 hover:text-white"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
              Plataforma
            </p>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li>
                <Link href="/strategies" className="transition hover:text-white">
                  Estrategias
                </Link>
              </li>
              <li>
                <Link href="/portfolio" className="transition hover:text-white">
                  Portafolios
                </Link>
              </li>
              <li>
                <Link href="/explorer" className="transition hover:text-white">
                  Mercados
                </Link>
              </li>
              <li>
                <Link href="/transactions" className="transition hover:text-white">
                  Movimientos
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
              Empresa
            </p>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li>
                <Link href="/about" className="transition hover:text-white">
                  Sobre nosotros
                </Link>
              </li>
              <li>
                <Link href="/terms" className="transition hover:text-white">
                  Términos
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="transition hover:text-white">
                  Privacidad
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" />
                <span>Buenos Aires, Argentina</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} Capital Fourge. Todos los derechos
            reservados.
          </p>
          <p>Where Financial Knowledge Takes Shape.</p>
        </div>
      </div>
    </footer>
  );
}
