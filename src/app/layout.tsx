import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { CartProvider } from "@/components/CartProvider";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MK Gourmet | Catálogo e pedidos no WhatsApp",
  description:
    "Loja acolhedora com catálogo, promoções e novidades. Peça pelo WhatsApp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full antialiased">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
