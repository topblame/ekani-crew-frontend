import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'Nunchi.ai - 눈치',
  description: 'AI가 읽어주는 상대방의 속마음',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-gradient-to-b from-pink-50 to-purple-50 text-gray-700">
        <Header />

        {/* 메인 */}
        <main className="min-h-screen max-w-4xl mx-auto py-8 px-4 w-full">
          {children}
        </main>

        {/* 푸터 */}
        <footer className="bg-white/50 py-6 mt-auto">
          <div className="max-w-4xl mx-auto text-center text-sm text-gray-400">
            <p>2024 Nunchi.ai</p>
          </div>
        </footer>
      </body>
    </html>
  );
}