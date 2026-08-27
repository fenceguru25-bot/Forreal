import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'ForReal Casino',
  description: 'Sweepstakes casino scaffold with dual-currency wallet, AMOE, and responsible gaming controls.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-casino-radial text-white">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(214,166,76,0.08),transparent_20%),linear-gradient(180deg,rgba(7,11,26,0.95),rgba(7,11,26,1))]">
          <Navbar />
          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
