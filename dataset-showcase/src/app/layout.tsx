import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Vendored variable fonts (latin subset). next/font/google was replaced
// because its Turbopack loader fails the Vercel production build.
const montserrat = localFont({
  src: "./fonts/Montserrat-latin.woff2",
  variable: "--font-montserrat",
  weight: "100 900",
});

const jetbrainsMono = localFont({
  src: "./fonts/JetBrainsMono-latin.woff2",
  variable: "--font-jetbrains-mono",
  weight: "400 800",
});

export const metadata: Metadata = {
  title: "Dataset Showcase",
  description: "Browse and preview featured CSV datasets.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${montserrat.variable} ${jetbrainsMono.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-white font-sans text-black antialiased">
        {children}
      </body>
    </html>
  );
}
