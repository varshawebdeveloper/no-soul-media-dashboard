import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Channel } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  channels: Channel[];
  selectedChannel: Channel | null;
  setSelectedChannel: (channel: Channel | null) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  fetchChannels: () => Promise<void>;
  addChannel: (input: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setSelectedChannel(null);
  };

  const fetchChannels = async () => {
    try {
      const res = await api.get('/channels');
      if (res.data.success) {
        setChannels(res.data.data);
        if (res.data.data.length > 0 && !selectedChannel) {
          setSelectedChannel(res.data.data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch channels:', err);
    }
  };

  const addChannel = async (input: string) => {
    const res = await api.post('/channels', { input });
    if (res.data.success) {
      await fetchChannels();
      setSelectedChannel(res.data.data.channel);
    }
    return res.data;
  };

  useEffect(() => {
    if (token) {
      fetchChannels();
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        channels,
        selectedChannel,
        setSelectedChannel,
        login,
        logout,
        fetchChannels,
        addChannel,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
