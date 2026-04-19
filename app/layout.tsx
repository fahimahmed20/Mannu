import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import StoreProvider from "@/components/StoreProvider";
import NetworkStatus from "@/components/NetworkStatus";

export const metadata: Metadata = {
  title: "Manu Explorers Field Guide",
  description:
    "Wildlife field guide for Manu National Park, Peru. Identify birds, frogs, and more — works offline.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Manu Guide",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1a3a2a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-screen bg-stone-50" suppressHydrationWarning>
        <StoreProvider>
          <NetworkStatus />
          <main className="max-w-lg mx-auto lg:max-w-full pb-24 min-h-screen">
            {children}
          </main>
          <BottomNav />
        </StoreProvider>
      </body>
    </html>
  );
}
