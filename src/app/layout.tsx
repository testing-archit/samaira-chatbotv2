import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Samaira | Octaraa Wealth Assistant",
  description: "Samaira is your AI-powered family wealth assistant from Octaraa. Get personalized financial strategies, compare investment platforms, and plan your family's financial future.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
