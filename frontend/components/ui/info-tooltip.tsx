"use client";

import { useState } from "react";
import { HelpCircle, X } from "lucide-react";

interface InfoTooltipProps {
  title: string;
  description: string;
}

export function InfoTooltip({ title, description }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-white/[0.06] text-[10px] font-bold text-slate-300 transition hover:border-emerald-300/40 hover:text-emerald-200"
        aria-label={title}
      >
        <HelpCircle className="h-3 w-3" />
      </button>

      {open && (
        <span
          className="absolute left-1/2 top-full z-50 mt-2 w-72 -translate-x-1/2 rounded-2xl border border-white/10 bg-slate-900 p-4 text-left shadow-2xl"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">{title}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-white"
              aria-label="Cerrar ayuda"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <p className="mt-2 text-xs leading-6 text-slate-300">{description}</p>
        </span>
      )}
    </span>
  );
}
