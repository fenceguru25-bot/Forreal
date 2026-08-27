import { useEffect, useState } from 'react';
import Button from '../components/ui/Button';
import { api } from '../lib/api';
import { useUiStore } from '../store/uiStore';

const Admin = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [form, setForm] = useState({ id: '', scAmount: '0', gcAmount: '0' });
  const addToast = useUiStore((state) => state.addToast);

  const load = () => {
    api.get('/admin/users').then((response) => setUsers(response.data.data)).catch(() => undefined);
    api.get('/admin/stats').then((response) => setStats(response.data.data)).catch(() => undefined);
  };

  useEffect(load, []);

  const adjust = async () => {
    try {
      await api.put(`/admin/user/${form.id}/balance`, { scAmount: Number(form.scAmount), gcAmount: Number(form.gcAmount) });
      addToast({ type: 'success', message: 'Balance updated.' });
      load();
    } catch (error: any) {
      addToast({ type: 'error', message: error?.response?.data?.error ?? 'Unable to update balance.' });
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-black">Admin Console</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-card rounded-3xl p-5"><p className="text-white/60">Total Players</p><p className="mt-2 text-3xl font-black">{stats?.totalPlayers ?? 0}</p></div>
        <div className="glass-card rounded-3xl p-5"><p className="text-white/60">Transactions</p><p className="mt-2 text-3xl font-black">{stats?.totalTransactions ?? 0}</p></div>
        <div className="glass-card rounded-3xl p-5"><p className="text-white/60">Active Games</p><p className="mt-2 text-3xl font-black">{stats?.activeGames ?? 0}</p></div>
      </div>
      <div className="glass-card rounded-3xl p-6">
        <h2 className="text-2xl font-bold">Manual Balance Adjustment</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <input className="rounded-2xl bg-white/5 px-4 py-3" placeholder="User ID" value={form.id} onChange={(event) => setForm({ ...form, id: event.target.value })} />
          <input className="rounded-2xl bg-white/5 px-4 py-3" placeholder="SC Delta" value={form.scAmount} onChange={(event) => setForm({ ...form, scAmount: event.target.value })} />
          <input className="rounded-2xl bg-white/5 px-4 py-3" placeholder="GC Delta" value={form.gcAmount} onChange={(event) => setForm({ ...form, gcAmount: event.target.value })} />
          <Button onClick={adjust}>Apply</Button>
        </div>
      </div>
      <div className="glass-card overflow-x-auto rounded-3xl p-6">
        <table className="min-w-full text-left text-sm">
          <thead className="text-white/60"><tr><th className="pb-3">Username</th><th className="pb-3">Email</th><th className="pb-3">Role</th><th className="pb-3">GC</th><th className="pb-3">SC</th></tr></thead>
          <tbody>
            {users.map((user) => <tr key={user.id} className="border-t border-white/10"><td className="py-3">{user.username}</td><td>{user.email}</td><td>{user.role}</td><td>{user.goldCoins}</td><td>{user.sweepsCoins}</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Admin;
