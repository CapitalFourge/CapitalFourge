"use client";

import { useState, ReactNode } from "react";

export function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const [mounted] = useState(() => typeof window !== "undefined");

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}