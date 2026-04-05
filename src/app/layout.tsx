import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "fitオリパ - 歩いてポケカを引こう！",
  description: "歩数でポイントをためて、ポケモンカードオリパを楽しもう。外れても日用品と交換できる「負けないオリパ」",
  openGraph: {
    title: "fitオリパ - 歩いてポケカを引こう！",
    description: "歩数でポイントをためて、ポケモンカードオリパを楽しもう。外れても日用品と交換できる「負けないオリパ」",
    siteName: "fitオリパ",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "fitオリパ - 歩いてポケカを引こう！",
    description: "歩数でポイントをためて、ポケモンカードオリパを楽しもう。外れても日用品と交換できる「負けないオリパ」",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
