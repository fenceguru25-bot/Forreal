'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import WalletDisplay from './WalletDisplay';
import { apiFetch } from '@/lib/api';

const links = [
  { href: '/lobby', label: 'Lobby' },
  { href: '/promotions', label: 'Promotions' },
  { href: '/wallet', label: 'Wallet' },
  { href: '/amoe', label: 'Free Entry' },
];

interface WalletState {
  gcBalance: number;
  scBalance: number;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('forreal.token');
    const storedUser = localStorage.getItem('forreal.user');
    const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? 'admin@forreal.com').toLowerCase();

    setToken(storedToken);
    setIsAdmin(Boolean(storedUser && JSON.parse(storedUser).email?.toLowerCase() === adminEmail));

    if (storedToken) {
      apiFetch<WalletState>('/api/wallet/balance')
        .then((response) => setWallet(response))
        .catch(() => {
          setWallet(null);
        });
    }
  }, [pathname]);

  const logout = () => {
    localStorage.removeItem('forreal.token');
    localStorage.removeItem('forreal.user');
    localStorage.removeItem('forreal.wallet');
    setToken(null);
    setWallet(null);
    router.push('/');
    router.refresh();
  };

  return (
    <header className="border-b border-white/10 bg-casino-night/80 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6">
          <Link href="/" className="text-xl font-black tracking-tight text-white">
            <span className="text-casino-gold">ForReal</span> Casino
          </Link>
          <div className="hidden items-center gap-5 md:flex">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium ${active ? 'text-casino-gold' : 'text-slate-300 hover:text-white'}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {token && wallet ? <WalletDisplay gcBalance={wallet.gcBalance} scBalance={wallet.scBalance} compact /> : null}
          {token ? (
            <>
              <Link href="/responsible-gaming" className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 hover:border-casino-gold hover:text-casino-gold">
                RG Tools
              </Link>
                  {isAdmin ? (
                    <Link href="/admin" className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 hover:border-casino-gold hover:text-casino-gold">
                      Admin
                    </Link>
                  ) : null}
                  <button onClick={logout} className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20">
                    Logout
                  </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 hover:border-casino-gold hover:text-casino-gold">
                Login
              </Link>
              <Link href="/auth/register" className="rounded-full bg-casino-gold px-4 py-2 text-sm font-semibold text-casino-night hover:bg-[#e7bb67]">
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
