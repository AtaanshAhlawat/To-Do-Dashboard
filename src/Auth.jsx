import React, { useState } from 'react';
import { useAuthStore } from './store/authStore';
import { authStyles } from './styles/authStyles';

export default function Auth({ onAuth }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    // Basic validation
    if (!username.trim() || !password) {
      setError('Username and password are required');
      setLoading(false);
      return;
    }
    
    try {
              if (isLogin) {
          const result = await login(username, password);
          if (result) {
            setSuccess('Login successful!');
            // Small delay to show success message before redirecting
            setTimeout(() => {
              if (onAuth) onAuth();
            }, 500);
          } else {
            setError('Login failed. Please check your credentials.');
          }
        } else {
                  const registerResult = await register(username, password);
          if (!registerResult) {
            setError('Registration failed. Please try again.');
            return;
          }
        setSuccess('Registration successful! Please log in.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={authStyles.container}>
      <div style={authStyles.form}>
        <h2 style={authStyles.title}>
          {isLogin ? 'Sign In' : 'Create Account'}
        </h2>
        
        {error && <div style={authStyles.error}>{error}</div>}
        {success && <div style={authStyles.success}>{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ ...authStyles.formElement, ...authStyles.input }}
            disabled={loading}
            aria-label="Username"
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ ...authStyles.formElement, ...authStyles.input }}
            disabled={loading}
            aria-label="Password"
          />
          
          <button 
            type="submit" 
            style={{ ...authStyles.formElement, ...authStyles.button }}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
        
        <button 
          type="button"
          style={authStyles.toggle}
          onClick={() => !loading && setIsLogin(!isLogin)}
          disabled={loading}
        >
          {isLogin 
            ? "Don't have an account? Sign up" 
            : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
