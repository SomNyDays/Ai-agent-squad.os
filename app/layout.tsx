import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "AI Agent Squad OS", description: "A visual squad of AI agents, missions, and boss battles." };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
