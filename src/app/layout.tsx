import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Frippr — AI Chart Assistant",
  description: "AI-powered conversational chart generation with Frappe Charts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
