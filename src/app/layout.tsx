import type { Metadata } from 'next';
import { GoogleTagManager } from '@next/third-parties/google';
import './globals.css';
import Header from '@/components/Header';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: '눈치코치 - MBTI 기반 소통 코칭',
  description: 'AI가 읽어주는 상대방의 속마음',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <GoogleTagManager gtmId="GTM-WDV8TXKS" />
      <body className="bg-gradient-to-b from-pink-50 to-purple-50 text-gray-700">
        <Providers>
          <Header />

          {/* 메인 */}
          <main className="min-h-screen max-w-4xl mx-auto py-8 px-4 w-full">
            {children}
          </main>

          {/* 푸터 */}
          <footer className="bg-white/50 py-6 mt-auto">
            <div className="max-w-4xl mx-auto text-center text-sm text-gray-400">
              <p>2024 눈치코치</p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}