import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wasilisha - Reach Every Channel. One Platform.",
  description: "Multi-channel messaging platform for SMS, Email, and WhatsApp",
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
