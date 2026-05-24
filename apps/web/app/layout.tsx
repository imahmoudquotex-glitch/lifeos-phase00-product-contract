import type { Metadata, Viewport } from "next";
import { Inter, Tajawal } from "next/font/google";
import "./globals.css";

// Geist is not a Google Font — using Inter instead (same look, Google CDN)
const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic"],
  weight: ["400", "500", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Zenith — Life OS",
    template: "%s | Zenith",
  },
  description:
    "منصة إنتاجية متكاملة — تخطيط، معرفة، تركيز، عادات، وذكاء اصطناعي بدون تسريب بيانات أو paywall.",
  applicationName: "Zenith",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Zenith" },
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
      <body className={`${inter.variable} ${tajawal.variable}`}>
        {children}
      </body>
    </html>
  );
}

