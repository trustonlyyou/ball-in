import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { Header } from "@/components/Header";
import { TEAM_NAME } from "@/config";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: `${TEAM_NAME} 농구팀`,
  description: `${TEAM_NAME} 농구팀 경기 기록과 스탯`,
};

export const viewport: Viewport = {
  themeColor: "#030712",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <Header />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
        <footer className="py-6 text-center text-xs text-gray-600">© {TEAM_NAME}</footer>
      </body>
    </html>
  );
}
