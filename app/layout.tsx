import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZILA Catálogo",
  description: "Catálogo digital de ZILA Calzados",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
