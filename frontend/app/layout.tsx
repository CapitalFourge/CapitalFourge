import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FinSight | Quant Analysis Terminal",
  description: "Next-generation portfolio management and market intelligence.",
};

import { ApolloWrapper } from "@/components/providers/apollo-wrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.className} bg-black text-white antialiased`}>
        <ApolloWrapper>
          {children}
        </ApolloWrapper>
        <Toaster position="top-right" richColors theme="dark" />
      </body>
    </html>
  );
}
