import { Big_Shoulders_Display, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Display face — condensed + tall, reads like municipal route signage.
// This is the one place the page's "voice" comes from, so weight range is
// deliberately narrow (600/700 only) — we never want a thin, delicate cut of it.
const display = Big_Shoulders_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
  display: "swap",
});

// Body face — quiet, highly legible, does not compete with the display face.
const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

// Utility/data face — used only for route codes, stats, timestamps, and the
// small "manifest" style labels. Keeping it scoped to those spots is what
// makes it read as intentional instead of decorative.
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: "CleanLoop — One loop, four roles, no missed collection.",
  description:
    "CleanLoop connects residents, operations staff, collection crews, and community volunteers on a single platform, so a reported issue reaches the right person the moment it's raised.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="bg-loop-100 font-sans text-loop-900 antialiased">
        {children}
      </body>
    </html>
  );
}