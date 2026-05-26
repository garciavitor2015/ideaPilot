import { Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["400", "600", "700", "800"],
});

export const metadata = {
  title: "IdeaPilot — Seu hub de ideias inteligente",
  description: "Organize, evolua e priorize suas ideias com IA",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={sora.variable}>{children}</body>
    </html>
  );
}
