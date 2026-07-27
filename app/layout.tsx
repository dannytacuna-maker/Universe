import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import { ApplicationShell } from "@/components/ui/application-shell";
import { appMetadata } from "@/lib/app-metadata";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: appMetadata.name,
    template: `%s | ${appMetadata.name}`,
  },
  description: appMetadata.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <ClerkProvider>
      <html className={`${GeistSans.variable} ${GeistMono.variable}`} lang="en">
        <body className={GeistSans.className}>
          <ApplicationShell>{children}</ApplicationShell>
        </body>
      </html>
    </ClerkProvider>
  );
}
