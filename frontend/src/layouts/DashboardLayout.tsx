import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Video, BarChart2, Settings, Plus, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from './DashboardLayout.module.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout, channels, selectedChannel, setSelectedChannel, addChannel } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [channelInput, setChannelInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelInput.trim()) return;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await addChannel(channelInput);
      setShowAddModal(false);
      setChannelInput('');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to add channel');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <h2 className={styles.logoText}>NO SOUL</h2>
          <span className={styles.badge}>ANALYTICS</span>
        </div>

        {/* Channel Selector */}
        <div className={styles.channelSelector}>
          <div className={styles.selectorHeader}>
            <span className={styles.selectorLabel}>CHANNEL</span>
            <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>
              <Plus size={14} /> Add
            </button>
          </div>

          <select
            className={styles.select}
            value={selectedChannel?.id || ''}
            onChange={(e) => {
              const ch = channels.find((c) => c.id === e.target.value);
              if (ch) setSelectedChannel(ch);
            }}
          >
            {channels.length === 0 ? (
              <option value="">No channels added</option>
            ) : (
              channels.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.title || ch.handle || ch.youtube_channel_id}
                </option>
              ))
            )}
          </select>
        </div>

        <nav className={styles.nav}>
          <NavLink to="/" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/videos" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <Video size={18} />
            <span>Videos</span>
          </NavLink>
          <NavLink to="/reports" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <BarChart2 size={18} />
            <span>Reports</span>
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <Settings size={18} />
            <span>Settings</span>
          </NavLink>
        </nav>

        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            <span className={styles.userEmail}>{user?.email}</span>
            <span className={styles.userRole}>{user?.role}</span>
          </div>
          <button className={styles.logoutBtn} onClick={() => { logout(); navigate('/login'); }}>
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>{children}</main>

      {/* Add Channel Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Add YouTube Channel</h3>
            <p className={styles.modalSub}>Enter YouTube Channel Handle (@mkbhd), URL, or Channel ID.</p>
            {errorMsg && <div className={styles.error}>{errorMsg}</div>}
            <form onSubmit={handleAddSubmit}>
              <input
                type="text"
                placeholder="e.g. @MKBHD or UC..."
                value={channelInput}
                onChange={(e) => setChannelInput(e.target.value)}
                className={styles.modalInput}
                required
              />
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowAddModal(false)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
                  {isSubmitting ? 'Fetching Stats...' : 'Add Channel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
