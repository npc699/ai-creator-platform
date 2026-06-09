// 根布局：仅负责全站 HTML 壳、字体变量与默认 metadata；导航/鉴权/Session 由各 route group layout 承担。
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

// next/font 注入 CSS 变量，供 globals.css / Tailwind 引用，避免 layout shift。
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "创作台",
  description: "AI 创作者工作台",
};

/** 全站最外层布局；(auth) 登录注册与 (main) 工作台共用此壳，不在此挂载 SessionProvider。 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // lang 影响无障碍朗读与搜索引擎语言判定，与产品中文界面一致。
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
