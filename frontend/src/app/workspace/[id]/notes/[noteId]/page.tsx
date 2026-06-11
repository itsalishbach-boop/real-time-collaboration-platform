'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import { NoteVersion } from '@/lib/types';
import Navbar from '@/components/Navbar';
import { ArrowLeft, Clock, Users, RotateCcw, X, Wifi, WifiOff, History } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface ActiveUser {
  user_id: number;
  username: string;
}

export default function NoteEditorPage() {
  const { id: workspaceId, noteId } = useParams<{ id: string; noteId: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [versions, setVersions] = useState<NoteVersion[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [viewingVersion, setViewingVersion] = useState<NoteVersion | null>(null);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [user, loading, router]);

  const handleWsMessage = useCallback((data: unknown) => {
    const msg = data as {
      type: string;
      note?: { title: string; content: string };
      title?: string;
      content?: string;
      updated_by_name?: string;
      user_id?: number;
      username?: string;
    };

    if (msg.type === 'note_init' && msg.note && !initialized.current) {
      initialized.current = true;
      setTitle(msg.note.title);
      setContent(msg.note.content);
    } else if (msg.type === 'note_update') {
      if (msg.title !== undefined) setTitle(msg.title);
      if (msg.content !== undefined) setContent(msg.content);
      toast(`${msg.updated_by_name} updated the note`, { icon: '✏️' });
    } else if (msg.type === 'user_joined') {
      setActiveUsers((prev) => {
        if (prev.find((u) => u.user_id === msg.user_id)) return prev;
        return [...prev, { user_id: msg.user_id!, username: msg.username! }];
      });
    } else if (msg.type === 'user_left') {
      setActiveUsers((prev) => prev.filter((u) => u.user_id !== msg.user_id));
    }
  }, []);

  const { send, isConnected } = useWebSocket(`ws/notes/${noteId}/`, handleWsMessage, !!user);

  const sendUpdate = useCallback((newTitle: string, newContent: string) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      send({ type: 'note_update', title: newTitle, content: newContent });
    }, 600);
  }, [send]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    sendUpdate(e.target.value, content);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    sendUpdate(title, e.target.value);
  };

  const loadVersions = async () => {
    try {
      const { data } = await api.get(`/notes/detail/${noteId}/versions/`);
      setVersions(data.results || data);
      setShowVersions(true);
    } catch {
      toast.error('Failed to load versions');
    }
  };

  const restoreVersion = (version: NoteVersion) => {
    setTitle(version.title);
    setContent(version.content);
    send({ type: 'note_update', title: version.title, content: version.content });
    setViewingVersion(null);
    setShowVersions(false);
    toast.success('Version restored');
  };

  const avatarColor = (name: string) => {
    const colors = ['bg-blue-200 text-blue-700', 'bg-purple-200 text-purple-700', 'bg-orange-200 text-orange-700', 'bg-pink-200 text-pink-700'];
    return colors[name.charCodeAt(0) % colors.length];
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      <Navbar />

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-4 gap-3 min-h-0">
        {/* Toolbar */}
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm shrink-0">
          <Link
            href={`/workspace/${workspaceId}`}
            className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex-1" />

          {/* Active collaborators */}
          {activeUsers.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {activeUsers.slice(0, 4).map((u) => (
                  <div
                    key={u.user_id}
                    title={`${u.username} is editing`}
                    className={`w-7 h-7 rounded-lg border-2 border-white flex items-center justify-center text-xs font-bold ${avatarColor(u.username)}`}
                  >
                    {u.username[0]?.toUpperCase()}
                  </div>
                ))}
              </div>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {activeUsers.length} editing
              </span>
            </div>
          )}

          <button
            onClick={loadVersions}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-green-600 bg-gray-50 hover:bg-green-50 border border-gray-200 hover:border-green-200 px-3 py-1.5 rounded-xl transition-all"
          >
            <History className="w-3.5 h-3.5" /> History
          </button>

          <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl border ${
            isConnected
              ? 'text-green-600 bg-green-50 border-green-100'
              : 'text-amber-600 bg-amber-50 border-amber-100'
          }`}>
            {isConnected
              ? <><Wifi className="w-3 h-3" /> Live</>
              : <><WifiOff className="w-3 h-3" /> Reconnecting</>
            }
          </div>
        </div>

        {/* Editor */}
        <div className="bg-white rounded-2xl border border-gray-100 flex-1 flex flex-col overflow-hidden shadow-sm min-h-0">
          {viewingVersion && (
            <div className="flex items-center gap-3 px-8 py-3 bg-amber-50 border-b border-amber-100">
              <Clock className="w-4 h-4 text-amber-600" />
              <p className="text-sm text-amber-800 font-medium flex-1">
                Viewing version from {formatDistanceToNow(new Date(viewingVersion.created_at), { addSuffix: true })} by {viewingVersion.edited_by_name}
              </p>
              <button
                onClick={() => restoreVersion(viewingVersion)}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Restore
              </button>
              <button
                onClick={() => setViewingVersion(null)}
                className="p-1 rounded-lg hover:bg-amber-100 text-amber-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <input
            value={viewingVersion ? viewingVersion.title : title}
            onChange={handleTitleChange}
            readOnly={!!viewingVersion}
            placeholder="Untitled note…"
            className="px-8 pt-8 pb-3 text-3xl font-bold text-gray-900 outline-none placeholder-gray-200 bg-transparent border-b border-gray-50 focus:border-gray-100 transition-colors"
          />
          <textarea
            value={viewingVersion ? viewingVersion.content : content}
            onChange={handleContentChange}
            readOnly={!!viewingVersion}
            placeholder="Start writing… Use this space to collaborate with your team."
            className="flex-1 px-8 py-6 text-gray-700 text-base leading-8 outline-none resize-none bg-transparent scrollbar-thin placeholder-gray-300"
            style={{ minHeight: '400px' }}
          />
        </div>
      </div>

      {/* Version history sidebar */}
      {showVersions && (
        <div className="fixed inset-y-0 right-0 w-80 bg-white border-l border-gray-100 shadow-2xl z-50 flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <History className="w-4 h-4 text-green-600" /> Version History
            </h3>
            <button
              onClick={() => { setShowVersions(false); setViewingVersion(null); }}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {versions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
                <Clock className="w-8 h-8 text-gray-200 mb-2" />
                <p className="text-sm font-semibold text-gray-500">No versions yet</p>
                <p className="text-xs text-gray-400 mt-1">Versions are saved automatically as you edit</p>
              </div>
            ) : (
              <div className="py-2">
                {versions.map((v, i) => (
                  <div
                    key={v.id}
                    onClick={() => setViewingVersion(v)}
                    className={`px-5 py-3.5 cursor-pointer border-b border-gray-50 transition-colors ${
                      viewingVersion?.id === v.id
                        ? 'bg-green-50 border-l-2 border-l-green-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                        i === 0 ? 'gradient-brand text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {versions.length - i}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{v.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDistanceToNow(new Date(v.created_at), { addSuffix: true })}
                        </p>
                        <p className="text-xs text-gray-400">by {v.edited_by_name}</p>
                        {viewingVersion?.id === v.id && (
                          <button
                            onClick={(e) => { e.stopPropagation(); restoreVersion(v); }}
                            className="mt-2 flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-semibold"
                          >
                            <RotateCcw className="w-3 h-3" /> Restore this version
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
