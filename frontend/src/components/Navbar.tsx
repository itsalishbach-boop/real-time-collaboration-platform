'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { usePresence } from '@/contexts/PresenceContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { MessageSquare, Bell, LogOut, User, ChevronDown } from 'lucide-react';
import NotificationPanel from './NotificationPanel';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unreadCount, clearUnread } = usePresence();
  const router = useRouter();
  const [showNotif, setShowNotif] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    router.push('/auth/login');
  };

  const handleBellClick = () => {
    setShowNotif((p) => !p);
    if (!showNotif) clearUnread();
  };

  return (
    <nav className="h-14 bg-white border-b border-gray-100 flex items-center px-5 gap-4 sticky top-0 z-40 shadow-sm">
      <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-gray-900 group">
        <div className="w-7 h-7 gradient-brand rounded-lg flex items-center justify-center shadow-sm group-hover:opacity-90 transition-opacity">
          <MessageSquare className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="hidden sm:block">CollabSpace</span>
      </Link>

      <div className="flex-1" />

      {/* Notification bell */}
      <div className="relative">
        <button
          onClick={handleBellClick}
          className="relative p-2 rounded-xl hover:bg-gray-50 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-gray-500" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-green-500 text-white text-[10px] rounded-full flex items-center justify-center leading-none font-bold px-0.5 shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        {showNotif && <NotificationPanel onClose={() => setShowNotif(false)} />}
      </div>

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => setShowMenu((p) => !p)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
        >
          <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center text-white font-bold text-xs shadow-sm">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <span className="hidden sm:block text-gray-700 font-semibold text-sm">{user?.username}</span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50">
            <div className="px-4 py-2 mb-1 border-b border-gray-50">
              <p className="text-xs text-gray-500">Signed in as</p>
              <p className="text-sm font-semibold text-gray-800 truncate">{user?.email}</p>
            </div>
            <Link
              href="/profile"
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setShowMenu(false)}
            >
              <User className="w-4 h-4 text-gray-400" /> Profile
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 w-full text-left transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
