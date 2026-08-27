import { useState } from 'react';
import { RESTRICTED_STATES } from '../../../shared/src/constants';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { usStates } from '../lib/data';

const AuthModal = () => {
  const { showAuthModal, authModalTab, closeAuthModal, openAuthModal, addToast } = useUiStore();
  const { login, register, isLoading } = useAuthStore();
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '', confirmPassword: '', state: 'CA', acceptedTerms: false });

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      await login(loginForm);
      addToast({ type: 'success', message: 'Welcome back to Spin Out.' });
      closeAuthModal();
    } catch (error: any) {
      addToast({ type: 'error', message: error?.response?.data?.error ?? 'Unable to log in.' });
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    if (registerForm.password !== registerForm.confirmPassword) {
      addToast({ type: 'error', message: 'Passwords do not match.' });
      return;
    }
    if (!registerForm.acceptedTerms) {
      addToast({ type: 'error', message: 'You must accept the terms to register.' });
      return;
    }
    if (RESTRICTED_STATES.includes(registerForm.state as any)) {
      addToast({ type: 'error', message: 'Your state is currently restricted.' });
      return;
    }
    try {
      await register({ username: registerForm.username, email: registerForm.email, password: registerForm.password, state: registerForm.state });
      addToast({ type: 'success', message: 'Your account has been created.' });
      closeAuthModal();
    } catch (error: any) {
      addToast({ type: 'error', message: error?.response?.data?.error ?? 'Unable to register.' });
    }
  };

  return (
    <Modal isOpen={showAuthModal} onClose={closeAuthModal} title={authModalTab === 'login' ? 'Log In' : 'Create Account'}>
      <div className="mb-6 flex gap-2 rounded-2xl bg-white/5 p-1">
        <button className={`flex-1 rounded-2xl px-4 py-2 ${authModalTab === 'login' ? 'bg-white/10' : ''}`} onClick={() => openAuthModal('login')}>Login</button>
        <button className={`flex-1 rounded-2xl px-4 py-2 ${authModalTab === 'register' ? 'bg-white/10' : ''}`} onClick={() => openAuthModal('register')}>Register</button>
      </div>
      {authModalTab === 'login' ? (
        <form className="space-y-4" onSubmit={handleLogin}>
          <input className="w-full rounded-2xl bg-white/5 px-4 py-3" placeholder="Email" type="email" value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} />
          <input className="w-full rounded-2xl bg-white/5 px-4 py-3" placeholder="Password" type="password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} />
          <Button className="w-full" loading={isLoading} type="submit">Enter Casino</Button>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={handleRegister}>
          <input className="w-full rounded-2xl bg-white/5 px-4 py-3" placeholder="Username" value={registerForm.username} onChange={(event) => setRegisterForm({ ...registerForm, username: event.target.value })} />
          <input className="w-full rounded-2xl bg-white/5 px-4 py-3" placeholder="Email" type="email" value={registerForm.email} onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })} />
          <input className="w-full rounded-2xl bg-white/5 px-4 py-3" placeholder="Password" type="password" value={registerForm.password} onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })} />
          <input className="w-full rounded-2xl bg-white/5 px-4 py-3" placeholder="Confirm Password" type="password" value={registerForm.confirmPassword} onChange={(event) => setRegisterForm({ ...registerForm, confirmPassword: event.target.value })} />
          <select className="w-full rounded-2xl bg-card px-4 py-3" value={registerForm.state} onChange={(event) => setRegisterForm({ ...registerForm, state: event.target.value })}>
            {usStates.map((state) => <option key={state} value={state}>{state}{RESTRICTED_STATES.includes(state as any) ? ' (Restricted)' : ''}</option>)}
          </select>
          <label className="flex items-start gap-3 text-sm text-white/70">
            <input type="checkbox" checked={registerForm.acceptedTerms} onChange={(event) => setRegisterForm({ ...registerForm, acceptedTerms: event.target.checked })} />
            I confirm that I am 18+ and agree to the official sweepstakes rules and responsible gaming policy.
          </label>
          <Button className="w-full" loading={isLoading} type="submit">Create Account</Button>
        </form>
      )}
    </Modal>
  );
};

export default AuthModal;
