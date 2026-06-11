import type { Metadata } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Be Vietnam Pro: thiết kế cho tiếng Việt — dấu đẹp, hình học high-tech (BRANDING.md §2)
const akashSans = Be_Vietnam_Pro({
  variable: "--font-geist-sans",
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["vietnamese", "latin"],
});

const akashMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["vietnamese", "latin"],
});

export const metadata: Metadata = {
  title: "Akash — Vũ trụ tri thức của bạn",
  description: "Akash · mài cuộc đời thành kim cương: sống → ghi → chuyển hoá → toả sáng",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${akashSans.variable} ${akashMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('akash-theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){};(function(){var x=function(s){return s&&(s.indexOf('chrome-extension://')>-1||s.indexOf('Talisman')>-1||s.indexOf('moz-extension://')>-1)};window.addEventListener('unhandledrejection',function(e){var r=e.reason||{};if(x(String(r.stack||r.message||e.reason||'')))e.stopImmediatePropagation(),e.preventDefault()},true);window.addEventListener('error',function(e){if(x(String(e.filename||'')+String(e.message||'')+String(e.error&&e.error.stack||'')))e.stopImmediatePropagation(),e.preventDefault()},true)})()` }} />
        {children}
      </body>
    </html>
  );
}
