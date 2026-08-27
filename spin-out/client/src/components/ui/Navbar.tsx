import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import BalanceDisplay from './BalanceDisplay';
import Button from './Button';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';

const links = [
  { to: '/', label: 'Home' },
  { to: '/lobby', label: 'Lobby' },
  { to: '/leaderboard', label: 'Leaderboard' }
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const { openAuthModal } = useUiStore();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        <Link to="/" className="text-2xl font-black tracking-tight">
          <span className="bg-gradient-to-r from-gold to-violet bg-clip-text text-transparent">🎰 Spin Out</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => isActive ? 'text-gold' : 'text-white/80 hover:text-white'}>{link.label}</NavLink>
          ))}
          {user?.role === 'admin' ? <NavLink to="/admin" className="text-white/80 hover:text-white">Admin</NavLink> : null}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <BalanceDisplay />
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="text-sm text-white/80">{user?.username}</Link>
              <Button variant="ghost" onClick={() => logout()}>Logout</Button>
            </div>
          ) : (
            <>
              <Button variant="ghost" onClick={() => openAuthModal('login')}>Login</Button>
              <Button onClick={() => openAuthModal('register')}>Register</Button>
            </>
          )}
        </div>
        <button className="md:hidden" onClick={() => setOpen((value) => !value)}>☰</button>
      </div>
      {open ? (
        <div className="border-t border-white/10 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((link) => <NavLink key={link.to} to={link.to} onClick={() => setOpen(false)}>{link.label}</NavLink>)}
            <BalanceDisplay />
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>
                <Button variant="ghost" onClick={() => logout()}>Logout</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => openAuthModal('login')}>Login</Button>
                <Button onClick={() => openAuthModal('register')}>Register</Button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
};

export default Navbar;
