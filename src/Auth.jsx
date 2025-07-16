import { useState } from 'react';
import { useAuthStore } from './store/authStore';

export default function Auth({ onAuth }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const { login: loginAction, register: registerAction, error, loading } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    if (isLogin) {
      const success = await loginAction(username, password);
      if (success && onAuth) onAuth();
    } else {
      const success = await registerAction(username, password);
      if (success) {
        setSuccessMsg('Registration successful! Please log in.');
        setIsLogin(true);
        setPassword('');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>{isLogin ? 'Login' : 'Register'}</h2>
      <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required autoComplete="username" />
      <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" required autoComplete={isLogin ? "current-password" : "new-password"} />
      <button type="submit" disabled={loading}>{isLogin ? 'Login' : 'Register'}</button>
      <button type="button" onClick={() => { setIsLogin(!isLogin); setSuccessMsg(''); }} disabled={loading}>
        {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
      </button>
      {successMsg && <div style={{color:'green', marginTop:8}}>{successMsg}</div>}
      {error && <div style={{color:'red', marginTop:8}}>{error}</div>}
      {loading && <div style={{color:'#2563eb', marginTop:8}}>Loading...</div>}
    </form>
  );
}