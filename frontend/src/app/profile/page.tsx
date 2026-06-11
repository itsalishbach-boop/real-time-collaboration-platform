'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Camera, Mail, User, FileText,
  Shield, Calendar, Save, Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default function ProfilePage() {
  const { user, loading, updateUser } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setBio(user.bio || '');
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('bio', bio);
      if (avatarFile) formData.append('avatar', avatarFile);

      const { data } = await api.patch('/auth/me/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(data);
      setAvatarFile(null);
      toast.success('Profile updated!');
    } catch (err: unknown) {
      const errors = (err as { response?: { data?: Record<string, string[]> } })?.response?.data;
      const msg = errors ? Object.values(errors).flat().join(' ') : 'Failed to update profile';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const displayAvatar = avatarPreview || user.avatar_url;
  const initials = user.username?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero */}
      <div className="gradient-brand">
        <div className="max-w-3xl mx-auto px-4 pt-8 pb-20 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Your Profile</h1>
            <p className="text-green-100 text-sm">Manage your account details</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-12 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Avatar card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center text-center">
            <div className="relative mb-4">
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={user.username}
                  className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl gradient-brand flex items-center justify-center text-white font-bold text-3xl shadow-lg ring-4 ring-white">
                  {initials}
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-2 -right-2 w-8 h-8 gradient-brand rounded-xl flex items-center justify-center shadow-md hover:opacity-90 transition-opacity border-2 border-white"
                title="Change avatar"
              >
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            {avatarPreview && (
              <p className="text-xs text-green-600 font-semibold mb-2 bg-green-50 px-2 py-1 rounded-lg">
                New photo selected
              </p>
            )}

            <h2 className="font-bold text-gray-900 text-lg">{user.username}</h2>
            <p className="text-sm text-gray-500 truncate max-w-full">{user.email}</p>

            <div className="w-full mt-5 pt-5 border-t border-gray-50 space-y-3 text-left">
              <div className="flex items-center gap-2.5 text-sm">
                <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Status</p>
                  <p className="font-semibold text-green-600 text-xs">Active account</p>
                </div>
              </div>
              {user.last_seen && (
                <div className="flex items-center gap-2.5 text-sm">
                  <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Last seen</p>
                    <p className="font-semibold text-gray-700 text-xs">
                      {formatDistanceToNow(new Date(user.last_seen), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Edit form */}
          <div className="lg:col-span-2 space-y-4">
            <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              <div>
                <h3 className="font-bold text-gray-900 mb-4">Edit Profile</h3>
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={user.email}
                    readOnly
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus-green text-sm bg-gray-50 focus:bg-white transition-colors"
                    placeholder="Your username"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bio</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    maxLength={200}
                    placeholder="Tell your team a little about yourself…"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus-green text-sm resize-none bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1 text-right">{bio.length}/200</p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 gradient-brand text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 transition-opacity text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                ) : (
                  <><Save className="w-4 h-4" /> Save changes</>
                )}
              </button>
            </form>

            {/* Account info card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Account Info</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                  <span className="text-sm text-gray-500">User ID</span>
                  <span className="text-sm font-mono font-semibold text-gray-700">#{user.id}</span>
                </div>
                <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                  <span className="text-sm text-gray-500">Account status</span>
                  <span className="text-xs font-bold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">Active</span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-gray-500">Online status</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    user.is_online ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {user.is_online ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
