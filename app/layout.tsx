import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mercaplanner | Organiza tu compra",
  description: "Planifica las comidas y la compra mensual de tu hogar.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

