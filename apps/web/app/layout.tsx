import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "LifeOS — منظومة الحياة",
    template: "%s | LifeOS",
  },
  description:
    "منصة إنتاجية متكاملة — تخطيط، معرفة، تركيز، عادات، وذكاء اصطناعي بدون تسريب بيانات أو paywall.",
  applicationName: "LifeOS",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "LifeOS" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" style={{ colorScheme: "dark" }}>
      <body className={inter.variable}>
        {children}
      </body>
    </html>
  );
}
