import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const omnes = localFont({
  variable: "--font-omnes",
  src: [
    { path: "../public/omnes sans/Omnes-Regular.otf",  weight: "400", style: "normal" },
    { path: "../public/omnes sans/Omnes-Medium.otf",   weight: "500", style: "normal" },
    { path: "../public/omnes sans/Omnes-Semibold.otf", weight: "600", style: "normal" },
    { path: "../public/omnes sans/Omnes-Bold.otf",     weight: "700", style: "normal" },
    { path: "../public/omnes sans/Omnes-Black.otf",    weight: "800", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "Foco - Entrevista de Desligamento",
  description: "Sistema de entrevista de desligamento",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${omnes.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
