import type { Metadata } from "next";
import { Toaster } from "sonner";

import { ApolloWrapper } from "@/components/providers/apollo-wrapper";

import "./globals.css";

export const metadata: Metadata = {
  title: "FinSight | Wealth Intelligence Platform",
  description: "Portfolio management, market monitoring, and execution workflows in one modern financial workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="bg-dashboard font-sans text-white antialiased">
        <ApolloWrapper>{children}</ApolloWrapper>
        <Toaster position="top-right" richColors theme="dark" />
      </body>
    </html>
  );
}
