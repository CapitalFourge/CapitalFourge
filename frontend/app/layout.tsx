import type { Metadata } from "next";
import { Toaster } from "sonner";

import { ApolloWrapper } from "@/components/providers/apollo-wrapper";

import "./globals.css";

export const metadata: Metadata = {
  title: "Capital Fourge | Where Financial Knowledge Takes Shape",
  description: "Aprende conceptos financieros, prueba estrategias en un entorno sin riesgo y construye confianza antes de invertir dinero real.",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
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
