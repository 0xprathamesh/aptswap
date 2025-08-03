import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/context/Providers";
import { Toaster } from "sonner";
import Header from "@/components/Header";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CrossChain Swap - Sepolia ↔ Aptos Bridge",
  description: "Cross-chain atomic swaps between Sepolia and Aptos networks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistMono.variable} antialiased`}>
        <Providers>
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
            <Header />
            {children}
          </div>
          <Toaster
            position="top-right"
            richColors
            closeButton
            duration={5000}
          />
        </Providers>
      </body>
    </html>
  );
}
