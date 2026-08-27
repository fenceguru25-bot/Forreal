import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const BalanceDisplay = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  if (!user) return null;

  return (
    <button onClick={() => navigate('/cashier')} className="glass-card flex items-center gap-3 rounded-full px-4 py-2 text-sm">
      <span>🟡 {user.goldCoins.toFixed(2)} GC</span>
      <span>💜 {user.sweepsCoins.toFixed(2)} SC</span>
    </button>
  );
};

export default BalanceDisplay;
