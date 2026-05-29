import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Triagem Hematológica",
  description: "Sistema de triagem e priorização de encaminhamentos hematológicos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
