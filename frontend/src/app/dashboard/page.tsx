'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Workspace } from '@/lib/types';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import { Plus, Users, LogIn, Trash2, ArrowRight, Sparkles, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [fetching, setFetching] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      api.get('/workspaces/')
        .then((res) => setWorkspaces(res.data.results || res.data))
        .finally(() => setFetching(false));
    }
  }, [user]);

  const createWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/workspaces/', { name: newName, description: newDesc });
      setWorkspaces((prev) => [data, ...prev]);
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
      toast.success('Workspace created!');
    } catch {
      toast.error('Failed to create workspace');
    }
  };

  const joinWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/workspaces/join/', { invite_code: inviteCode });
      setWorkspaces((prev) => [data, ...prev]);
      setShowJoin(false);
      setInviteCode('');
      toast.success('Joined workspace!');
    } catch {
      toast.error('Invalid invite code');
    }
  };

  const deleteWorkspace = async (id: string) => {
    if (!confirm('Delete this workspace? This action cannot be undone.')) return;
    try {
      await api.delete(`/workspaces/${id}/`);
      setWorkspaces((prev) => prev.filter((w) => w.id !== id));
      toast.success('Workspace deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const WORKSPACE_COLORS = [
    'from-green-400 to-emerald-500',
    'from-blue-400 to-cyan-500',
    'from-purple-400 to-violet-500',
    'from-orange-400 to-amber-500',
    'from-pink-400 to-rose-500',
    'from-teal-400 to-cyan-500',
  ];

  const getColor = (name: string) => WORKSPACE_COLORS[name.charCodeAt(0) % WORKSPACE_COLORS.length];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero header */}
      <div className="gradient-brand">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <p className="text-green-200 text-sm font-medium mb-1">Welcome back,</p>
          <h1 className="text-3xl font-bold text-white mb-2">{user?.username} </h1>
          <p className="text-green-100 text-sm">You have {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8 -mt-4">
        {/* Action row */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Your Workspaces</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowJoin(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-green-300 hover:text-green-700 transition-colors shadow-sm"
            >
              <LogIn className="w-4 h-4" /> Join
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
            >
              <Plus className="w-4 h-4" /> New Workspace
            </button>
          </div>
        </div>

        {workspaces.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center shadow-sm">
            <div className="w-16 h-16 gradient-brand-soft rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-green-600" />
            </div>
            <p className="font-semibold text-gray-800 text-lg">No workspaces yet</p>
            <p className="text-sm text-gray-500 mt-1 mb-6">Create your first workspace or join an existing one</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowJoin(true)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:border-green-300 hover:text-green-700 transition-colors"
              >
                Join with code
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="px-4 py-2 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90"
              >
                Create workspace
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                onClick={() => router.push(`/workspace/${ws.id}`)}
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-green-200 hover:shadow-lg hover:shadow-green-50 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl bg-linear-to-br ${getColor(ws.name)} flex items-center justify-center text-white font-bold text-lg shadow-sm`}>
                    {ws.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    {ws.is_owner && (
                      <button
                        onClick={() => deleteWorkspace(ws.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                        title="Delete workspace"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button className="p-1.5 rounded-lg hover:bg-green-50 text-gray-300 group-hover:text-green-500 transition-colors">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-gray-900 truncate">{ws.name}</h3>
                {ws.description && (
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2 leading-relaxed">{ws.description}</p>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                  <span className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Users className="w-3.5 h-3.5" /> {ws.member_count} member{ws.member_count !== 1 ? 's' : ''}
                  </span>
                  <span className="text-xs font-mono bg-green-50 text-green-700 px-2 py-0.5 rounded-lg border border-green-100">
                    {ws.invite_code}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  {formatDistanceToNow(new Date(ws.created_at), { addSuffix: true })}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>

      {showCreate && (
        <Modal title="Create Workspace" onClose={() => setShowCreate(false)}>
          <form onSubmit={createWorkspace} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Workspace name</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                placeholder="My Team"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus-green text-sm bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description <span className="font-normal text-gray-400">(optional)</span></label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={3}
                placeholder="What is this workspace for?"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus-green text-sm resize-none bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 gradient-brand text-white font-semibold rounded-xl hover:opacity-90 text-sm transition-opacity"
            >
              Create Workspace
            </button>
          </form>
        </Modal>
      )}

      {showJoin && (
        <Modal title="Join Workspace" onClose={() => setShowJoin(false)}>
          <form onSubmit={joinWorkspace} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Invite code</label>
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                required
                placeholder="XXXXXXXXXX"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus-green text-sm font-mono tracking-widest bg-gray-50 focus:bg-white transition-colors text-center"
              />
              <p className="text-xs text-gray-400 mt-1.5">Ask a workspace member for their invite code</p>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 gradient-brand text-white font-semibold rounded-xl hover:opacity-90 text-sm transition-opacity"
            >
              Join Workspace
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-100" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
