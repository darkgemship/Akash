import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Akash — Kho tri thức",
  description: "Akash · biến trải nghiệm thành trí tuệ, biến trí tuệ thành content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('akash-theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){};(function(){var x=function(s){return s&&(s.indexOf('chrome-extension://')>-1||s.indexOf('Talisman')>-1||s.indexOf('moz-extension://')>-1)};window.addEventListener('unhandledrejection',function(e){var r=e.reason||{};if(x(String(r.stack||r.message||e.reason||'')))e.stopImmediatePropagation(),e.preventDefault()},true);window.addEventListener('error',function(e){if(x(String(e.filename||'')+String(e.message||'')+String(e.error&&e.error.stack||'')))e.stopImmediatePropagation(),e.preventDefault()},true)})()` }} />
        {children}
      </body>
    </html>
  );
}
