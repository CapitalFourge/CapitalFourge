"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-slate-950/55">
      <div className="mx-auto flex max-w-[1700px] flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center">
          <img src="/logo.svg" alt="Capital Fourge" className="h-12 w-auto" />
        </Link>
        <p className="text-xs text-slate-500">
          {new Date().getFullYear()} Capital Fourge. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
