'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Workspace, Note, WorkspaceMember } from '@/lib/types';
import Navbar from '@/components/Navbar';
import ChatPanel from '@/components/workspace/ChatPanel';
import NotesPanel from '@/components/workspace/NotesPanel';
import MembersPanel from '@/components/workspace/MembersPanel';
import { MessageSquare, FileText, Users, Copy, ArrowLeft, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

type Tab = 'chat' | 'notes' | 'members';

export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || !id) return;
    Promise.all([
      api.get(`/workspaces/${id}/`),
      api.get(`/notes/${id}/`),
      api.get(`/workspaces/${id}/members/`),
    ]).then(([wsRes, notesRes, membersRes]) => {
      setWorkspace(wsRes.data);
      setNotes(notesRes.data.results || notesRes.data);
      setMembers(membersRes.data);
    }).catch(() => router.push('/dashboard'))
      .finally(() => setFetching(false));
  }, [user, id, router]);

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!workspace) return null;

  const TABS: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'chat', label: 'Chat', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'notes', label: 'Notes', icon: <FileText className="w-4 h-4" />, count: notes.length },
    { id: 'members', label: 'Members', icon: <Users className="w-4 h-4" />, count: members.length },
  ];

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      <Navbar />

      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 py-4 gap-3 min-h-0">
        {/* Workspace header */}
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-3.5 flex items-center gap-3 shadow-sm">
          <Link href="/dashboard" className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="w-9 h-9 gradient-brand rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm">
            {workspace.name[0]?.toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 truncate">{workspace.name}</h1>
            {workspace.description && (
              <p className="text-xs text-gray-500 truncate">{workspace.description}</p>
            )}
          </div>

          <button
            onClick={() => { navigator.clipboard.writeText(workspace.invite_code); toast.success('Invite code copied!'); }}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-green-600 bg-gray-50 hover:bg-green-50 border border-gray-200 hover:border-green-200 px-3 py-1.5 rounded-xl transition-all font-mono font-semibold"
          >
            <Hash className="w-3 h-3" />
            {workspace.invite_code}
            <Copy className="w-3 h-3" />
          </button>
        </div>

        {/* Tabs + content */}
        <div className="bg-white rounded-2xl border border-gray-100 flex-1 flex flex-col overflow-hidden shadow-sm min-h-0">
          <div className="flex border-b border-gray-100 px-1 pt-1 gap-1 shrink-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-green-50 text-green-700 border-b-2 border-green-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${
                    activeTab === tab.id ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden min-h-0">
            {activeTab === 'chat' && <ChatPanel workspaceId={id} currentUser={user!} />}
            {activeTab === 'notes' && (
              <NotesPanel
                workspaceId={id}
                notes={notes}
                setNotes={setNotes}
                currentUser={user!}
              />
            )}
            {activeTab === 'members' && (
              <MembersPanel
                members={members}
                setMembers={setMembers}
                workspaceId={id}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
