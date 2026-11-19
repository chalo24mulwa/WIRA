import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "WIRA | Find Trusted Professionals Near You",
    template: "%s | WIRA",
  },
  description:
    "WIRA connects you with verified plumbers, electricians, carpenters, mechanics, masons, painters and other skilled professionals across Kenya.",
  keywords: [
    "WIRA",
    "Kenya professionals",
    "find plumber Kenya",
    "find electrician Kenya",
    "artisans Kenya",
    "home services Kenya",
  ],
  openGraph: {
    title: "WIRA | Find Trusted Professionals Near You",
    description:
      "Connect with verified skilled professionals near you, anywhere in Kenya.",
    type: "website",
    locale: "en_KE",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
