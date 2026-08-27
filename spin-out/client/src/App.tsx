import { Navigate, Route, Routes } from 'react-router-dom';
import AuthModal from './components/AuthModal';
import Footer from './components/ui/Footer';
import Navbar from './components/ui/Navbar';
import Toast from './components/ui/Toast';
import { useAuth } from './hooks/useAuth';
import Admin from './pages/Admin';
import Baccarat from './pages/Baccarat';
import Blackjack from './pages/Blackjack';
import Cashier from './pages/Cashier';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Leaderboard from './pages/Leaderboard';
import Lobby from './pages/Lobby';
import ResponsibleGaming from './pages/ResponsibleGaming';
import Roulette from './pages/Roulette';
import SlotGame from './pages/SlotGame';
import Terms from './pages/Terms';
import { useAuthStore } from './store/authStore';
import { useUiStore } from './store/uiStore';

const ProtectedRoute = ({ children, adminOnly = false }: { children: JSX.Element; adminOnly?: boolean }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

const App = () => {
  useAuth();
  const toasts = useUiStore((state) => state.toasts);
  const removeToast = useUiStore((state) => state.removeToast);

  return (
    <div className="min-h-screen bg-background text-white">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/games/slots/:gameId" element={<SlotGame />} />
          <Route path="/games/blackjack" element={<Blackjack />} />
          <Route path="/games/roulette" element={<Roulette />} />
          <Route path="/games/baccarat" element={<Baccarat />} />
          <Route path="/cashier" element={<ProtectedRoute><Cashier /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/responsible-gaming" element={<ResponsibleGaming />} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
        </Routes>
      </main>
      <Footer />
      <AuthModal />
      <div className="fixed right-4 top-20 z-50 flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />)}
      </div>
    </div>
  );
};

export default App;
