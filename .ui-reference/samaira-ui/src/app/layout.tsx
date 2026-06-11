import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ask Samaira — Octaraa",
  description: "AI-powered family wealth assistant. Educational guidance for young Indian families.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Tabler icons */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
