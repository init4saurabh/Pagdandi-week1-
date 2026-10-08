import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegistrar } from "@/components/service-worker";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Pagdandi — Take the path less scrolled", template: "%s · Pagdandi" },
  description: "An audio-first AI walk companion powered by open-weight Gemma.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Pagdandi", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#173f32", colorScheme: "light dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><ServiceWorkerRegistrar/>{children}</body></html>;
}
