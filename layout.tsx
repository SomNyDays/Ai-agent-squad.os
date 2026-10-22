import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Squad OS — AI Business Intelligence",
  description: "A governed AI-agent workforce for research, evaluation, and revenue operations."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
