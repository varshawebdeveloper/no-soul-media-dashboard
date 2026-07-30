import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import styles from './Login.module.css';

export const Login: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const res = await api.post(endpoint, { email, password });
      if (res.data.success) {
        login(res.data.data.accessToken, res.data.data.user);
        navigate('/');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.brandHeader}>
          <h1 className={styles.title}>NO SOUL</h1>
          <p className={styles.subtitle}>CLIENT ANALYTICS PLATFORM</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <h2 className={styles.formTitle}>{isRegister ? 'Create Account' : 'Sign In'}</h2>
          {errorMsg && <div className={styles.error}>{errorMsg}</div>}

          <div className={styles.field}>
            <label>EMAIL ADDRESS</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="agency@nosoulmedia.com"
            />
          </div>

          <div className={styles.field}>
            <label>PASSWORD</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Processing...' : isRegister ? 'Register' : 'Sign In'}
          </button>
        </form>

        <div className={styles.footer}>
          <span>{isRegister ? 'Already have an account?' : "Don't have an account?"}</span>
          <button onClick={() => setIsRegister(!isRegister)} className={styles.toggleBtn}>
            {isRegister ? 'Sign In' : 'Register'}
          </button>
        </div>
      </div>
    </div>
  );
};
